import { expect, test } from "vitest";
import { buildSquad, positions } from "../lib/squad";
import type { Player, ProjectionView } from "../lib/types";

test("optimizes a captain and XI while paying for a legal 15-player squad", async () => {
 const players: Player[] = [];
 const gw = 12;
 const rows: ProjectionView["rows"] = [];
 for (const position of positions) {
  for (let i = 0; i < 9; i++) {
   const id = players.length + 1;
   const player: Player = {
    id, name: `Player ${id}`, fullName: `Player ${id}`, team: `Club ${i < 2 ? 0 : i}`,
    teamCode: i, position, price: i < 2 ? 12 : 5, status: i === 8 ? "i" : "a",
    points: null, minutes: null, starts: null, goals: null, assists: null,
    xg: null, xa: null, xgi: null, cleanSheets: null, defensive: null, form: null, ppg: null, weeks: [],
   };
   players.push(player);
   rows.push({ id, weeks: { [gw]: { points: i === 8 ? 100 : i < 2 ? 10 : 3, minutes: 90 } } });
  }
 }
 const result = await buildSquad(players, { gameweeks: [gw], updatedAt: "", rows }, gw);
 expect(result).not.toBeNull();
 const squad = result!;
 const selected = squad.picks.map(p => players[p.id - 1]);
 const starters = squad.picks.filter(p => p.starter);
 expect(squad.optimal).toBe(true);
 expect(squad.cost).toBe(96);
 expect(squad.points).toBe(64);
 expect(selected).toHaveLength(15);
 expect(positions.map(position => selected.filter(p => p.position === position).length)).toEqual([2, 5, 5, 3]);
 expect(selected.filter(p => p.team === "Club 0")).toHaveLength(3);
 expect(selected.some(p => p.status === "i")).toBe(false);
 expect(starters).toHaveLength(11);
 expect(starters.filter(p => p.captain)).toHaveLength(1);
}, 10000);
