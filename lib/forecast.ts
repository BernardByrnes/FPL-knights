import Papa from "papaparse";
import type { Forecast, Player } from "./types";
type Row = Record<string,string>;
export type Preview = { forecast: Forecast; unmatched: string[]; warnings: string[]; matched: number; rows: number };
const normalize = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const n = (s: string | undefined) => { if (s == null || s.trim() === "") return null; const x=Number(s.replace("%","")); return Number.isFinite(x) ? x : null; };
export function parseForecast(text: string, players: Player[], manual: Record<string,number> = {}): Preview {
 const parsed=Papa.parse<Row>(text,{header:true,skipEmptyLines:true,transformHeader:h=>h.trim()});
 if(parsed.errors.length) throw Error(`CSV could not be parsed: ${parsed.errors[0].message}`);
 const headers=parsed.meta.fields || []; const columns=new Map<number,Record<string,string>>();
 for(const h of headers) { const m=h.match(/^(?:GW\s*)?(\d{1,2})_(pts|pts_no_prob|prob|with_prob)$/i); if(m) {const gw=Number(m[1]); if(gw<1||gw>38) continue; columns.set(gw,{...columns.get(gw),[m[2].toLowerCase()]:h});} }
 const gameweeks=[...columns.keys()].sort((a,b)=>a-b); if(!gameweeks.length) throw Error("No supported gameweek columns found (for example 12_pts or 12_with_prob).");
 const idHeader=headers.find(h=>/^(id|player_id|element|fpl_id)$/i.test(h));
 const nameHeader=headers.find(h=>/^(name|player|player_name|web_name|full_name)$/i.test(h));
 if(!idHeader&&!nameHeader) throw Error("Add an id or player name column to the CSV.");
 const forecast:Forecast={source:"FPL Form (private import)",gameweeks,players:{}}; const unmatched:string[]=[]; const warnings:string[]=[]; const seen=new Set<number>();
 parsed.data.forEach((row,index)=>{
  const label=(nameHeader && row[nameHeader]) || (idHeader && row[idHeader]) || `row ${index+2}`;
  const id=idHeader?n(row[idHeader]):null; let matches=id != null ? players.filter(p=>p.id===id) : [];
  if(!matches.length && id==null && nameHeader) { const name=normalize(row[nameHeader]||""); matches=players.filter(p=>normalize(p.name)===name||normalize(p.fullName)===name); }
  if(manual[label]!=null) matches=players.filter(p=>p.id===manual[label]);
  if(matches.length!==1) { unmatched.push(label); return; }
  const player=matches[0]; if(seen.has(player.id)) { warnings.push(`Duplicate player ${label}; all rows for this player excluded.`); delete forecast.players[player.id]; return; } seen.add(player.id);
  const weeks:Forecast["players"][number]={}; for(const gw of gameweeks) {const c=columns.get(gw)!; const weighted=c.with_prob || c.pts; const points=weighted?n(row[weighted]):null; let probability=c.prob?n(row[c.prob]):null; if(probability!=null && probability>1 && probability<=100) probability/=100; if(probability!=null&&(probability<0||probability>1)) {warnings.push(`${label}, GW${gw}: invalid probability`); probability=null;} if(!weighted && c.pts_no_prob) warnings.push(`${label}, GW${gw}: conditional points excluded; no probability-weighted column.`); weeks[gw]={points,probability}; } forecast.players[player.id]=weeks;
 });
 return {forecast,unmatched,warnings:[...new Set(warnings)],matched:Object.keys(forecast.players).length,rows:parsed.data.length};
}
export function coverage(f: Forecast, id: number, start: number) { const weeks=Array.from({length:5},(_,i)=>start+i).filter(w=>w<=38); const entries=weeks.map(w=>f.players[id]?.[w]?.points ?? null); const available=entries.filter((x):x is number=>x!=null); return {total:available.length?available.reduce((a,b)=>a+b,0):null,count:available.length,expected:weeks.length}; }
