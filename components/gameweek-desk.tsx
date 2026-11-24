import type { Player, ProjectionView } from "@/lib/types";
import type { Squad, SquadPick } from "@/lib/squad";
import { formatEAT } from "@/lib/time";
import { money, number } from "@/lib/metrics";
import { Kit } from "./player-context";

const pitchPositions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

export default function GameweekDesk({ squad, projection, players, nextGameweek, onPlayer, onPlan, onForecast }: {
 squad: Squad | null;
 projection: ProjectionView | null;
 players: Player[];
 nextGameweek: number | null;
 onPlayer: (player: Player) => void;
 onPlan: () => void;
 onForecast: () => void;
}) {
 const byId = new Map(players.map(player => [player.id, player]));
 const starters = squad?.picks.filter(pick => pick.starter) ?? [];
 const bench = (squad?.picks.filter(pick => !pick.starter) ?? []).sort((a, b) => {
  const goalkeeper = (pick: SquadPick) => Number(byId.get(pick.id)?.position === "Goalkeeper");
  return goalkeeper(b) - goalkeeper(a) || b.points - a.points;
 });
 const rows = pitchPositions.map(position => starters.filter(pick => byId.get(pick.id)?.position === position));
 const captain = starters.find(pick => pick.captain);
 const vice = starters.filter(pick => pick !== captain).sort((a, b) => b.points - a.points)[0];

 function renderPick(pick: SquadPick) {
  const player = byId.get(pick.id);
  if (!player) return null;
  const role = pick.captain ? "Captain" : pick === vice ? "Vice-captain" : "";
  return <button key={pick.id} className="pitch-player" onClick={() => onPlayer(player)}
   aria-label={`${player.name}, ${player.team}, ${number(pick.points, 2)} projected points${role ? ", " + role : ""}`}>
   <span className="pitch-kit"><Kit player={player}/>{role && <span className="captain-mark">{pick.captain ? "C" : "V"}</span>}</span>
   <strong>{player.name}</strong>
   <span>{number(pick.points, 2)} xPts <span className="pitch-club">· {player.team}</span></span>
  </button>;
 }

 return <div className="gameweek-desk">
  <section className="panel squad-panel" aria-labelledby="squad-title">
   <div className="squad-heading">
    <div><h2 id="squad-title" className="squad-gameweek">{nextGameweek ? `Gameweek ${nextGameweek}` : "Gameweek preview"}</h2>
     <p className="squad-subtitle">{squad?.optimal ? "Best projected squad" : "Projected squad"}</p>
    </div>
    {squad && <div className="squad-totals">
     <div><b>{number(squad.points, 2)}</b><small>XI xPts · captain included</small></div>
     <div><b>{money(squad.cost)}</b><small>15 players · £{squad.budget}m cap</small></div>
    </div>}
   </div>
   {squad ? <>
    <div className="pitch" aria-label="Starting XI">
     {rows.map((row, index) => <div className="pitch-row" key={pitchPositions[index]}>{row.map(renderPick)}</div>)}
    </div>
    <div className="squad-bench"><h3>Bench</h3><div>{bench.map(renderPick)}</div></div>
    <p className="muted squad-note">{rows.slice(1).map(row => row.length).join("–")} formation
     {projection && ` · Forecast updated ${formatEAT(projection.updatedAt)}`}</p>
   </> : <p className="muted squad-note">{projection
     ? "A valid squad could not be generated from the current forecast."
     : "A squad will appear once forecasts are available for the next gameweek."}</p>}
  </section>
  <aside className="desk-tools" aria-label="Gameweek tools">
   <section className="panel desk-tool"><h2>Find a replacement</h2>
    <p>See how many points a same-position transfer could gain within your budget.</p>
    <button className="primary" onClick={onPlan}>Open Transfer Finder</button>
   </section>
   <section className="panel desk-tool"><h2>Compare upcoming fixtures</h2>
    <p>See opponents, expected minutes and projected points across the next five gameweeks.</p>
    <button className="panel-link" onClick={onForecast}>View projections →</button>
   </section>
  </aside>
 </div>;
}
