import loadHighs from "highs";
import type { Player, ProjectionView } from "./types";

export const SQUAD_BUDGET = 101;
export const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"] as const;
const squadCounts = [2, 5, 5, 3];
const starterMinimums = [1, 3, 2, 1];

export type SquadPick = { id: number; points: number; starter: boolean; captain: boolean };
export type Squad = { gw: number; picks: SquadPick[]; cost: number; points: number; optimal: boolean };

let solver: ReturnType<typeof loadHighs> | undefined;
const variable = (role: string, id: number) => role + id;
const sum = (terms: string[]) => terms.join(" + ");

export async function buildSquad(players: Player[], projection: ProjectionView, gw: number): Promise<Squad | null> {
 const gameweek = new Map(projection.rows.map(row => [row.id, row.weeks[gw]]));
 const candidates = players.flatMap(player => {
  const pred = gameweek.get(player.id);
  const position = positions.findIndex(role => role === player.position);
  if (player.price == null || !Number.isFinite(player.price) || player.price <= 0 ||
      pred?.points == null || !Number.isFinite(pred.points) || position < 0 ||
      ["i", "s", "u", "n"].includes(player.status ?? "")) return [];
  return [{ id: player.id, club: player.team, position, price: Math.round(player.price * 10), points: pred.points }];
 });
 if (squadCounts.some((count, i) => candidates.filter(p => p.position === i).length < count)) return null;

 const columns = candidates.flatMap(p => ["x", "s", "c"].map(role => variable(role, p.id)));
 const objective = candidates.flatMap(p => {
  // One hundredth of an XI point outweighs any possible squad tie breaker.
  const score = Math.round(p.points * 100);
  return [[score, `x${p.id}`], [score * 1_000_000, `s${p.id}`], [score * 1_000_000, `c${p.id}`]] as const;
 }).map(([score, name], index) =>
  `${score < 0 ? "- " : index ? "+ " : ""}${Math.abs(score)} ${name}`
 ).join(" ");
 const constraints = [
  `budget: ${sum(candidates.map(p => `${p.price} x${p.id}`))} <= ${SQUAD_BUDGET * 10}`,
  `eleven: ${sum(candidates.map(p => `s${p.id}`))} = 11`,
  `one_captain: ${sum(candidates.map(p => `c${p.id}`))} = 1`,
 ];
 positions.forEach((_, i) => {
  const eligible = candidates.filter(p => p.position === i);
  constraints.push(`squad_${i}: ${sum(eligible.map(p => `x${p.id}`))} = ${squadCounts[i]}`);
  constraints.push(`start_${i}: ${sum(eligible.map(p => `s${p.id}`))} ${i === 0 ? "=" : ">="} ${starterMinimums[i]}`);
 });
 const clubs = new Map<string, string[]>();
 for (const p of candidates) {
  if (!clubs.has(p.club)) clubs.set(p.club, []);
  clubs.get(p.club)!.push(`x${p.id}`);
  constraints.push(`start_${p.id}_link: s${p.id} - x${p.id} <= 0`, `captain_${p.id}_link: c${p.id} - s${p.id} <= 0`);
 }
 [...clubs.values()].forEach((members, index) => constraints.push(`club_${index}: ${sum(members)} <= 3`));
 const lp = ["Maximize", `points: ${objective}`, "Subject To", ...constraints, "Binary", ...columns, "End"].join("\n");

 solver ??= loadHighs();
 const result = (await solver).solve(lp, { time_limit: 5, output_flag: false, mip_rel_gap: 0 });
 const chosen = (column: string) => {
  const value = result.Columns?.[column];
  return value != null && "Primal" in value && value.Primal > 0.5;
 };
 const picked = candidates.filter(p => chosen(`x${p.id}`));
 const picks = picked.map(p => ({ id: p.id, points: p.points, starter: chosen(`s${p.id}`), captain: chosen(`c${p.id}`) }));
 const cost = picked.reduce((total, p) => total + p.price, 0) / 10;
 const starters = picked.filter(p => chosen(`s${p.id}`));
 const clubCounts = new Map<string, number>();
 for (const p of picked) clubCounts.set(p.club, (clubCounts.get(p.club) ?? 0) + 1);
 if (picks.length !== 15 || starters.length !== 11 || cost > SQUAD_BUDGET ||
     squadCounts.some((n, i) => picked.filter(p => p.position === i).length !== n) ||
     starterMinimums.some((n, i) => {
      const count = starters.filter(p => p.position === i).length;
      return i === 0 ? count !== n : count < n;
     }) || [...clubCounts.values()].some(count => count > 3) ||
     picks.filter(p => p.starter && p.captain).length !== 1) return null;

 const points = picks.reduce((total, p) => total + (p.starter ? p.points * (p.captain ? 2 : 1) : 0), 0);
 return { gw, picks, cost, points, optimal: result.Status === "Optimal" };
}
