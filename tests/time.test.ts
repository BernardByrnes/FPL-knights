import {it,expect} from "vitest";
import {formatEAT} from "../lib/time";
it("converts a deadline from UTC to EAT",()=>expect(formatEAT("2026-11-21T11:00:00Z",true)).toBe("21 Nov, 14:00 EAT"));
it("advances the date across midnight in EAT",()=>expect(formatEAT("2026-11-13T23:30:00Z")).toBe("14 Nov 2026, 02:30 EAT"));
