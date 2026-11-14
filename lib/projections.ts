import Papa from "papaparse";
import type { ProjectionRow } from "./types";
export function parseProjections(csv:string,start:number):{gameweeks:number[];rows:ProjectionRow[]}{
 const parsed=Papa.parse<Record<string,string>>(csv,{header:true,skipEmptyLines:true,transformHeader:h=>h.trim()});
 if(parsed.errors.length) throw Error("Malformed projections CSV");
 const gameweeks=Array.from({length:Math.min(5,39-start)},(_,i)=>start+i);
 if(start<1||start>38||gameweeks.length===0)throw Error("Invalid projection gameweek");
 const headers=parsed.meta.fields||[];for(const col of ["ID","Name","Team","Pos","BV","SV",...gameweeks.flatMap(g=>[`${g}_Pts`,`${g}_xMins`])])if(!headers.includes(col))throw Error(`Missing projection column: ${col}`);
 const numeric=(s:string,min:number,max:number)=>{if(!s?.trim())return null;const n=Number(s);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Invalid projection value: ${s}`);return n};
 const ids=new Set<number>();const rows=parsed.data.map(r=>{const id=Number(r.ID);if(!Number.isInteger(id)||id<=0||ids.has(id))throw Error("Invalid or duplicate projection ID");ids.add(id);return {id,name:r.Name,team:r.Team,position:r.Pos,buyPrice:numeric(r.BV,0,25),sellPrice:numeric(r.SV,0,25),weeks:Object.fromEntries(gameweeks.map(g=>[g,{points:numeric(r[`${g}_Pts`],-20,100),minutes:numeric(r[`${g}_xMins`],0,270)}]))}});
 if(!rows.length)throw Error("Empty projections CSV");return {gameweeks,rows};
}
export function projectionTotal(row:Pick<ProjectionRow,"weeks">|undefined,weeks:number[],key:"points"|"minutes"):number|null{
 if(!row||!weeks.length)return null;const values=weeks.map(g=>row.weeks[g]?.[key]);return values.every((v):v is number=>v!=null&&Number.isFinite(v))?values.reduce((a,b)=>a+b,0):null;
}
