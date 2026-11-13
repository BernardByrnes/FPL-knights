import { describe, expect, it } from "vitest";
import { coverage, parseForecast } from "../lib/forecast";
import type { Player } from "../lib/types";
const players = [{id:1,name:"Smith",fullName:"Alex Smith"},{id:2,name:"Smith",fullName:"Ben Smith"},{id:3,name:"Jones",fullName:"Carl Jones"}] as Player[];
describe("private forecast import",()=>{
 it("matches IDs and never applies probability twice",()=>{const p=parseForecast("id,name,10_pts_no_prob,10_prob,10_with_prob,11_pts\n1,Smith,10,50,5,4",players);expect(p.matched).toBe(1);expect(p.forecast.players[1][10]).toEqual({points:5,probability:.5});expect(coverage(p.forecast,1,10)).toEqual({total:9,count:2,expected:5});});
 it("reports ambiguous names and supports explicit mapping",()=>{const csv="name,10_pts\nSmith,3";expect(parseForecast(csv,players).unmatched).toEqual(["Smith"]);expect(parseForecast(csv,players,{Smith:2}).forecast.players[2][10].points).toBe(3);});
 it("excludes duplicate IDs rather than silently overwriting",()=>{const p=parseForecast("id,10_pts\n1,3\n1,4",players);expect(p.matched).toBe(0);expect(p.warnings.join()).toContain("Duplicate");});
 it("does not invent weighted points from conditional values",()=>{const p=parseForecast("id,10_pts_no_prob,10_prob\n3,8,50",players);expect(p.forecast.players[3][10].points).toBeNull();expect(p.warnings.length).toBeGreaterThan(0);});
 it("rejects unrecognised columns",()=>expect(()=>parseForecast("id,prediction\n1,5",players)).toThrow());
});
