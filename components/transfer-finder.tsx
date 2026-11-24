import { useState } from "react";
import { Search } from "lucide-react";
import { projectionTotal } from "@/lib/projections";
import { money, number } from "@/lib/metrics";
import type { Fixture, Player, ProjectionView } from "@/lib/types";
import { PlayerFlags, fixtureLabel, Kit } from "./player-context";

export default function TransferFinder({ players, data, fixtures, onCompare }: {
 players: Player[];
 data: ProjectionView;
 fixtures: Fixture[];
 onCompare: (outgoing: Player, incoming: Player) => void;
}) {
 const [query, setQuery] = useState("");
 const [outgoingId, setOutgoingId] = useState<number>();
 const [budget, setBudget] = useState("");
 const [horizon, setHorizon] = useState(Math.min(5, data.gameweeks.length));
 const [differentials, setDifferentials] = useState(false);
 const weeks = data.gameweeks.slice(0, horizon);
 const rows = new Map(data.rows.map(row => [row.id, row]));
 const outgoing = players.find(player => player.id === outgoingId);
 const baseline = projectionTotal(outgoing && rows.get(outgoing.id), weeks, "points");
 const shortlist = query.trim() && !outgoing ? players.filter(player =>
  `${player.name} ${player.fullName}`.toLowerCase().includes(query.trim().toLowerCase())
 ).slice(0, 6) : [];
 const maxPrice = Number(budget);
 const replacements = outgoing && baseline != null && budget.trim() && maxPrice > 0 ? players.flatMap(player => {
  if (player.id === outgoing.id || player.position !== outgoing.position || player.price == null ||
      player.price > maxPrice || ["i", "u", "s", "n"].includes(player.status ?? "") ||
      (differentials && (player.ownership == null || player.ownership >= 10))) return [];
  const points = projectionTotal(rows.get(player.id), weeks, "points");
  return points == null ? [] : [{ player, points }];
 }).sort((a, b) => b.points - a.points || a.player.price! - b.player.price! || a.player.id - b.player.id).slice(0, 5) : [];

 function renderResult(player: Player, points: number | null, hold = false) {
  const minutes = projectionTotal(rows.get(player.id), weeks, "minutes");
  const gain = points != null && baseline != null ? Number((points - baseline).toFixed(2)) : null;
  const priceDifference = !hold && player.price != null && outgoing?.price != null
   ? Number((player.price - outgoing.price).toFixed(1)) : null;
  return <li className="transfer-result" key={player.id}>
   <span className="transfer-identity"><Kit player={player}/><span><strong>{player.name}</strong>
    <small>{hold ? "Hold current player" : player.team} · {money(player.price)}
     {priceDifference ? ` (${priceDifference > 0 ? "+" : "−"}${money(Math.abs(priceDifference))})` : ""}
     {player.ownership != null && ` · ${number(player.ownership, 1)}% owned`}</small>
    <PlayerFlags player={player}/>
   </span></span>
   <span className="transfer-numbers"><strong>{number(points, 2)} xPts</strong><small>{number(minutes, 0)} expected min</small>
    {!hold && gain != null && <b className={gain > 0 ? "gain-positive" : gain < 0 ? "gain-negative" : ""}>
     {gain > 0 ? "+" : ""}{number(gain, 2)} xPts vs hold
    </b>}
   </span>
   {fixtures.length > 0 && <span className="transfer-fixtures">{weeks.map(gw =>
    <small key={gw}>GW{gw} {fixtureLabel(fixtures, player.team, gw)}</small>
   )}</span>}
   {!hold && outgoing && <button className="outline-button" onClick={() => onCompare(outgoing, player)}>Compare</button>}
  </li>;
 }

 return <section className="panel transfer-panel" aria-labelledby="transfer-title">
  <h2 id="transfer-title">Find a replacement</h2>
  <p className="muted">Compare same-position players by projected gain. Enter the most you can spend on the incoming player.</p>
  <div className="transfer-controls">
   {outgoing ? <button className="outline-button" onClick={() => { setOutgoingId(undefined); setQuery(""); }}>
    Change {outgoing.name}
   </button> : <label className="search"><Search size={16}/><input aria-label="Player to replace"
    value={query} onChange={event => setQuery(event.target.value)} placeholder="Search for a player to replace"/></label>}
   <label className="projection-price">Max budget (£m)<input type="number" min="3" max="25" step="0.1"
    value={budget} onChange={event => setBudget(event.target.value)}/></label>
   <label className="transfer-window">Forecast window<select value={horizon} onChange={event => setHorizon(Number(event.target.value))}>
    {[...new Set([1, 3, 5].map(length => Math.min(length, data.gameweeks.length)))].map(length =>
     <option key={length} value={length}>{length} {length === 1 ? "gameweek" : "gameweeks"}</option>)}
   </select></label>
   <label className="ownership-filter"><input type="checkbox" checked={differentials} onChange={event => setDifferentials(event.target.checked)}/>
    Under 10% owned</label>
  </div>
  {shortlist.length > 0 && <div className="search-results">
   {shortlist.map(player => <button key={player.id} onClick={() => {
    setOutgoingId(player.id);
    if (!budget && player.price != null) setBudget(player.price.toFixed(1));
   }}><span>{player.name} <small>{player.team} · {player.position}</small><PlayerFlags player={player}/></span><b>{money(player.price)}</b></button>)}
  </div>}
  {!outgoing && query.trim() && !shortlist.length && <p className="muted">No players match this search.</p>}
  {outgoing && <>
   <ul className="transfer-results">{renderResult(outgoing, baseline, true)}
    {replacements.map(({ player, points }) => renderResult(player, points))}
   </ul>
   {baseline == null ? <p className="muted">This player has an incomplete forecast for the selected window.</p>
    : !replacements.length && <p className="muted">No alternatives match this budget and filter.</p>}
  </>}
 </section>;
}
