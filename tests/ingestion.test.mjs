import { describe, expect, it } from "vitest";
import { validateCompleted } from "../scripts/validation.mjs";
describe("ingestion gate", () => {
 it("accepts contiguous completed weeks covered by a snapshot", () => expect(() => validateCompleted([1,2,3],3)).not.toThrow());
 it("refuses gaps, no completed weeks and older snapshots", () => { for (const [weeks,snapshot] of [[[1,3],3],[[],0],[[1,2],1]]) expect(() => validateCompleted(weeks,snapshot)).toThrow(); });
});
