// Premier League accumulation cutoffs are based on club matches played.
export function oneBookingFromBan(yellows: number | null | undefined, clubMatches: number | null | undefined) {
 if (clubMatches == null || clubMatches < 0) return false;
 return (yellows === 4 && clubMatches < 19) ||
  (yellows === 9 && clubMatches < 32) ||
  (yellows === 14 && clubMatches < 38);
}
