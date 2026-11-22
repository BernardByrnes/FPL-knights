import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Player } from "@/lib/types";

const styles = [
 { color: "#83b0fa", dash: undefined },
 { color: "#e8b35b", dash: "6 3" },
 { color: "#65c8b7", dash: "2 3" },
 { color: "#b59cf2", dash: "8 3 2 3" },
];

export default function ScoringTrends({ players, completedGameweeks }: { players: Player[]; completedGameweeks: number[] }) {
 const [position, setPosition] = useState("");
 const weeks = completedGameweeks.slice(-6);
 const leaders = players.filter(player => !position || player.position === position).flatMap(player => {
  const points = weeks.map(gw => player.weeks.find(week => week.gw === gw)?.points ?? null);
  if (points.every(value => value === null)) return [];
  return [{ player, points, total: points.reduce<number>((sum, value) => sum + (value ?? 0), 0) }];
 }).sort((a, b) => b.total - a.total || a.player.id - b.player.id).slice(0, styles.length);
 const rows = weeks.map((gw, index) => ({
  label: `GW${gw}`,
  ...Object.fromEntries(leaders.map(({ player, points }) => [`p${player.id}`, points[index]])),
 }));

 return <section className="panel chart-panel scoring-trends" aria-labelledby="scoring-trends-title">
  <div className="panel-head">
   <div>
    <h2 id="scoring-trends-title">Leading scorers by gameweek</h2>
    <p>Weekly points for the top four scorers across the last six completed gameweeks.</p>
   </div>
   <label className="trend-filter">Position
    <select aria-label="Scoring position" value={position} onChange={event => setPosition(event.target.value)}>
     <option value="">All positions</option>
     {["Goalkeeper", "Defender", "Midfielder", "Forward"].map(role => <option key={role}>{role}</option>)}
    </select>
   </label>
  </div>
  {leaders.length ? <div className="chart">
   <ResponsiveContainer width="100%" height="100%">
    <LineChart data={rows} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
     <CartesianGrid stroke="#303d4e" vertical={false}/>
     <XAxis dataKey="label" tick={{ fill: "#a0aec0", fontSize: 11 }} axisLine={false} tickLine={false}/>
     <YAxis width={28} allowDecimals={false} tick={{ fill: "#a0aec0", fontSize: 11 }} axisLine={false} tickLine={false}/>
     <Tooltip contentStyle={{ background: "#1a222e", border: "1px solid #3b4b60" }} labelStyle={{ color: "#e3eaf3" }}/>
     <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }}/>
     {leaders.map(({ player, total }, index) => <Line key={player.id} dataKey={`p${player.id}`}
      name={`${player.name} · ${total} pts`} stroke={styles[index].color}
      strokeDasharray={styles[index].dash} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false}/>)}
    </LineChart>
   </ResponsiveContainer>
  </div> : <p className="empty">No completed gameweek points for this position yet.</p>}
 </section>;
}
