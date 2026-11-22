import { execFileSync } from "node:child_process";
import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
import Papa from "papaparse";
import { validateCompleted } from "./validation.mjs";
const season = "2026-2027";
const commit = process.env.FPL_SOURCE_COMMIT || execFileSync("git", ["ls-remote", "https://github.com/olbauday/FPL-Core-Insights.git", "refs/heads/main"], {encoding:"utf8"}).trim().split(/\s+/)[0];
if (!/^[a-f0-9]{40}$/.test(commit)) throw Error("Could not determine upstream commit");
const base = `https://raw.githubusercontent.com/olbauday/FPL-Core-Insights/${commit}/data/${season}/`;
async function csv(path, required) {
  const response = await fetch(base + path.split('/').map(encodeURIComponent).join('/'));
  if (!response.ok) throw Error(`${path}: HTTP ${response.status}`);
  const result = Papa.parse(await response.text(), {header:true, skipEmptyLines:true});
  if (result.errors.length) throw Error(`${path}: ${JSON.stringify(result.errors.slice(0, 2))}`);
  for (const key of required) if (!result.meta.fields?.includes(key)) throw Error(`${path}: missing ${key}`);
  if (!result.data.length) throw Error(`${path}: no records`);
  return result.data;
}
const number = (value, label) => { if (value == null || String(value).trim() === "") return null; const n = Number(value); if (!Number.isFinite(n)) throw Error(`${label}: invalid number ${value}`); return n; };
const unique = (rows, field, label) => { const map = new Map(); for (const row of rows) { const id = number(row[field], label); if (!Number.isInteger(id) || id <= 0 || map.has(id)) throw Error(`${label}: invalid or duplicate ID ${id}`); map.set(id,row); } return map; };
const [people, stats, teams, summaries] = await Promise.all([
 csv("players.csv", ["player_id","web_name","team_code","position"]), csv("playerstats.csv", ["id","now_cost","total_points","minutes","gw"]), csv("teams.csv", ["code","name","short_name"]), csv("gameweek_summaries.csv", ["id","finished","data_checked","is_next","deadline_time"])
]);
const playerMap = unique(people,"player_id","players");
const snapshotGameweek = Math.max(...stats.map(row => { const gw=number(row.gw,"snapshot gameweek"); if (!Number.isInteger(gw) || gw < 1 || gw > 38) throw Error(`Invalid snapshot gameweek ${gw}`); return gw; }));
const statMap = unique(stats.filter(row=>number(row.gw,"snapshot gameweek")===snapshotGameweek),"id",`GW${snapshotGameweek} season snapshot`);
const teamMap = unique(teams,"code","teams"); unique(summaries,"id","summaries");
const done = summaries.filter(x => x.finished === "True" && x.data_checked === "True").map(x => number(x.id,"gameweek")).sort((a,b)=>a-b);
validateCompleted(done, snapshotGameweek);
const next = summaries.find(x=>x.is_next === "True");
const upcoming = next ? number(next.id, "next gameweek") : null;
const fixtures = (await Promise.all(
 Array.from({length: upcoming ? Math.min(5, 39 - upcoming) : 0}, (_, index) => upcoming + index).map(async gw => {
  try {
   const rows = await csv(`By Gameweek/GW${gw}/fixtures.csv`, ["gameweek","tournament","home_team","away_team"]);
   return rows.filter(row => row.tournament === "prem" && Number(row.gameweek) === gw).map(row => {
    const home = teamMap.get(Number(row.home_team))?.short_name;
    const away = teamMap.get(Number(row.away_team))?.short_name;
    if (!home || !away || home === away) throw Error(`Invalid fixture team in GW${gw}`);
    return {gw,home,away};
   });
  } catch (error) {
   console.warn(`Upcoming GW${gw} fixtures unavailable: ${error.message}`);
   return [];
  }
 })
)).flat();
const weekly = new Map();
for (const gw of done) {
 const [rows,fixtures] = await Promise.all([csv(`By Gameweek/GW${gw}/player_gameweek_stats.csv`,["id","gw","event_points","minutes","expected_goals","expected_assists"]), csv(`By Gameweek/GW${gw}/fixtures.csv`,["gameweek","tournament","home_team","away_team","finished"])]);
 const league = fixtures.filter(f=>f.tournament === "prem" && number(f.gameweek,"fixture gameweek")===gw);
 if (!league.length || league.some(f=>f.finished !== "True" || !teamMap.has(number(f.home_team,"fixture home")) || !teamMap.has(number(f.away_team,"fixture away")))) throw Error(`GW${gw}: incomplete or invalid Premier League fixtures`);
 const map=unique(rows,"id",`GW${gw}`); for (const [id,row] of map) { if (!playerMap.has(id) || number(row.gw,"gw") !== gw) throw Error(`GW${gw}: unknown player or mismatched week ${id}`); }
 weekly.set(gw,map); console.log(`Validated GW${gw}: ${map.size} players, ${league.length} PL fixtures`);
}
const fields = {price:"now_cost",points:"total_points",minutes:"minutes",starts:"starts",goals:"goals_scored",assists:"assists",xg:"expected_goals",xa:"expected_assists",xgi:"expected_goal_involvements",cleanSheets:"clean_sheets",defensive:"defensive_contribution",form:"form",ppg:"points_per_game"};
const players=[];
for (const [id,p] of playerMap) { const s=statMap.get(id); if (!s) continue; const team=teamMap.get(number(p.team_code,"team code")); if (!team) throw Error(`Unknown team for ${id}`); const values={}; for (const [key,col] of Object.entries(fields)) values[key]=number(s[col],`${id} ${col}`); if (values.price !== null && (values.price < 3 || values.price > 20)) throw Error(`Unexpected price units for ${id}: ${values.price}`); if (values.minutes !== null && values.minutes < 0) throw Error(`Negative minutes for ${id}`);
 players.push({id,name:p.web_name,fullName:`${p.first_name} ${p.second_name}`.trim(),team:team.short_name,teamCode:number(p.team_code,"team"),position:p.position,...values,
  status:s.status||undefined,news:s.news||undefined,
  chanceNext:number(s.chance_of_playing_next_round,"playing chance"),
  ownership:number(s.selected_by_percent,"ownership"),
  transfersIn:number(s.transfers_in_event,"transfers in"),
  transfersOut:number(s.transfers_out_event,"transfers out"),
  priceChange:number(s.cost_change_event,"price change"),
  weeks:done.flatMap(gw=>{const r=weekly.get(gw).get(id); return r ? [{gw,points:number(r.event_points,"points"),minutes:number(r.minutes,"minutes"),xg:number(r.expected_goals,"xg"),xa:number(r.expected_assists,"xa")}] : [];})}); }
if (players.length < 100 || statMap.size !== players.length) throw Error(`Incomplete identity join: ${players.length}/${statMap.size}`);
if (snapshotGameweek === done.at(-1)) {
 for (const player of players) {
  if (player.points == null || player.weeks.some(week=>week.points == null || week.minutes == null)) throw Error(`Missing points or minutes for player ${player.id}`);
  const sum = player.weeks.reduce((total, week)=>total + week.points, 0);
  if (sum !== player.points) throw Error(`Player ${player.id}: weekly points ${sum} do not match season snapshot ${player.points}`);
 }
}
players.sort((a,b)=>a.id-b.id);
const output={season,snapshotGameweek,sourceCommit:commit,updatedAt:new Date().toISOString(),completedGameweeks:done,nextGameweek:next?number(next.id,"next"):null,deadline:next?.deadline_time||null,fixtures,players};
await mkdir("public/data",{recursive:true});
// Do not churn the dataset when the upstream commit is unchanged.
try { const previous=JSON.parse(await readFile("public/data/season.json","utf8")); if(previous.sourceCommit===commit && JSON.stringify(previous.fixtures)===JSON.stringify(fixtures) && previous.players[0]?.status!==undefined) { console.log("Already current; preserving original update timestamp"); process.exit(0); } } catch {}
await writeFile("public/data/season.json.tmp",JSON.stringify(output)); await rename("public/data/season.json.tmp","public/data/season.json"); console.log(`Published ${players.length} players from ${commit}`);
