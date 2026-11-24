import { expect, test } from "vitest";
import { oneBookingFromBan } from "../lib/discipline";

test.each([[4, 19], [9, 32], [14, 38]])("expires the %i-yellow warning after %i club matches", (yellows, cutoff) => {
 expect(oneBookingFromBan(yellows, cutoff - 1)).toBe(true);
 expect(oneBookingFromBan(yellows, cutoff)).toBe(false);
 expect(oneBookingFromBan(yellows + 1, cutoff - 1)).toBe(false);
 expect(oneBookingFromBan(yellows, null)).toBe(false);
});
