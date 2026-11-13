import { describe, it, expect } from "vitest";
import { emptyComparisonFilters as base, matchesComparisonFilters as matches } from "../lib/player-filters";
import type { Player } from "../lib/types";
const p={team:"ARS",position:"Defender",price:5,minutes:900,points:60,form:4,xg:1,xa:2,defensive:70} as Player;
describe("comparison candidate filters",()=>{
 it("combines club, position, inclusive price bounds and performance minima",()=>{expect(matches(p,{...base,club:"ARS",position:"Defender",minPrice:"5",maxPrice:"5",minutes:"900",points:"60",xg:"1",xa:"2",defensive:"70"})).toBe(true);expect(matches(p,{...base,club:"LIV"})).toBe(false);expect(matches(p,{...base,position:"Forward"})).toBe(false);expect(matches(p,{...base,maxPrice:"4.9"})).toBe(false);});
 it("excludes unavailable metrics only when a corresponding filter is active",()=>{expect(matches({...p,xg:null},base)).toBe(true);expect(matches({...p,xg:null},{...base,xg:"0"})).toBe(false);});
 it("rejects inverted, negative and invalid bounds",()=>{for(const f of [{minPrice:"6",maxPrice:"4"},{minutes:"-1"},{xg:"invalid"}])expect(matches(p,{...base,...f})).toBe(false);});
});
