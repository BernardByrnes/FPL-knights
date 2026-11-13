import type { Player } from "./types";
export const value = (p: Player) => p.points != null && p.price ? p.points / p.price : null;
export const per90 = (p: Player) => p.points != null && p.minutes ? p.points * 90 / p.minutes : null;
export const number = (n: number | null | undefined, digits = 1) => n == null || !Number.isFinite(n) ? "—" : n.toFixed(digits);
export const money = (n: number | null | undefined) => n == null ? "—" : `£${n.toFixed(1)}m`;
