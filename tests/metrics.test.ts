import { describe, expect, it } from "vitest";
import { money, number, per90, value } from "../lib/metrics";
import type { Player } from "../lib/types";
const player = { points: 24, minutes: 180, price: 6 } as Player;
describe("comparison metrics", () => {
 it("uses the actual minutes for points per 90", () => { expect(per90(player)).toBe(12); expect(per90({...player, minutes:0})).toBeNull(); });
 it("uses millions as supplied and preserves missing values", () => {expect(money(5.5)).toBe("£5.5m"); expect(money(null)).toBe("—"); expect(number(null)).toBe("—"); expect(value(player)).toBe(4);});
});
