import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Dataset } from "../lib/types";
const data = JSON.parse(readFileSync("public/data/season.json", "utf8")) as Dataset;
describe("verified source snapshot", () => {
 it("contains unique FPL identities and ordered completed gameweeks", () => {
  expect(data.players.length).toBeGreaterThan(100);
  expect(new Set(data.players.map(p => p.id)).size).toBe(data.players.length);
  expect(data.completedGameweeks).toEqual(data.completedGameweeks.map((_,i)=>i+1));
 });
 it("preserves weekly points and the cumulative snapshot", () => {
  if (data.snapshotGameweek !== data.completedGameweeks.at(-1)) return;
  for (const p of data.players) {
   expect(p.weeks.every((w,i)=>data.completedGameweeks.includes(w.gw) && (i===0 || w.gw>p.weeks[i-1].gw))).toBe(true);
   expect(p.weeks.reduce((sum,w)=>sum+(w.points ?? 0),0)).toBe(p.points);
  }
 });
});
