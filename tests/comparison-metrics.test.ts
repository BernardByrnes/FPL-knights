import { describe,it,expect } from "vitest";
import { comparisonMetrics,bestPlayerIds } from "../lib/comparison-metrics";
import type { Player } from "../lib/types";
const players=[{id:1,price:8,xg:3.12},{id:2,price:5,xg:4.25},{id:3,price:5,xg:4.25}] as Player[];
const metric=(key:string)=>comparisonMetrics.find(m=>m.key===key)!;
describe("comparison best values",()=>{
 it("highlights the highest xG and all ties",()=>expect(bestPlayerIds(players,metric("xg"))).toEqual([2,3]));
 it("highlights lower prices",()=>expect(bestPlayerIds(players,metric("price"))).toEqual([2,3]));
 it("does not declare a winner for one player or one available value",()=>{expect(bestPlayerIds(players.slice(0,1),metric("xg"))).toEqual([]);expect(bestPlayerIds([{id:1,xg:2},{id:2,xg:null}] as Player[],metric("xg"))).toEqual([]);});
 it("preserves genuine zero and ignores missing values",()=>expect(bestPlayerIds([{id:1,xg:0},{id:2,xg:0},{id:3,xg:null}] as Player[],metric("xg"))).toEqual([1,2]));
 it("treats values equal at displayed precision as tied",()=>expect(bestPlayerIds([{id:1,xg:2.001},{id:2,xg:2.002}] as Player[],metric("xg"))).toEqual([1,2]));
});
