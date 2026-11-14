import {describe,it,expect} from "vitest";
import {parseProjections,projectionTotal} from "../lib/projections";
const header="ID,Name,Team,Pos,BV,SV,11_Pts,11_xMins,12_Pts,12_xMins,13_Pts,13_xMins,14_Pts,14_xMins,15_Pts,15_xMins";
const row="1,Raya,Arsenal,G,6.2,6.2,3.78,89,3.36,89,3.65,89,3.7,89,4.04,89";
describe("five-gameweek projections",()=>{
 it("joins by FPL ID and aggregates all five discrete weeks",()=>{const p=parseProjections(header+"\n"+row,11);expect(p.gameweeks).toEqual([11,12,13,14,15]);expect(p.rows[0].id).toBe(1);expect(projectionTotal(p.rows[0],p.gameweeks,"points")).toBeCloseTo(18.53);expect(projectionTotal(p.rows[0],p.gameweeks,"minutes")).toBe(445)});
 it("rejects missing headers and duplicate IDs",()=>{expect(()=>parseProjections("ID,Name\n1,Raya",11)).toThrow();expect(()=>parseProjections(header+"\n"+row+"\n"+row,11)).toThrow()});
 it("does not turn incomplete forecasts into a full total",()=>{const p=parseProjections(header+"\n"+row.replace("3.78,89",",89"),11);expect(projectionTotal(p.rows[0],p.gameweeks,"points")).toBeNull();expect(projectionTotal(undefined,p.gameweeks,"points")).toBeNull()});
 it("preserves zero forecasts and rejects invalid minutes",()=>{const p=parseProjections(header+"\n"+row.replace("3.78,89","0,0"),11);expect(p.rows[0].weeks[11]).toEqual({points:0,minutes:0});expect(()=>parseProjections(header+"\n"+row.replace("3.78,89","3.78,-1"),11)).toThrow()});
 it("reports exact coverage at season end",()=>{const p=parseProjections("ID,Name,Team,Pos,BV,SV,38_Pts,38_xMins\n1,Raya,Arsenal,G,6,6,2,90",38);expect(p.gameweeks).toEqual([38]);expect(projectionTotal(p.rows[0],p.gameweeks,"points")).toBe(2)});
});
