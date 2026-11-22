import type { CSSProperties } from "react";
import type { Fixture, Player } from "@/lib/types";

const shirts: Record<string, [string, string]> = {
 ARS: ["#dc334d", "#f5efe6"], AVL: ["#8b3650", "#abd6ed"], BOU: ["#d53948", "#192331"],
 BRE: ["#d53948", "#fff1e7"], BHA: ["#3475d4", "#eff5ff"], CHE: ["#315ce0", "#d7e4ff"],
 COV: ["#82c8ee", "#315781"], CRY: ["#3b5bb4", "#ec4a5e"], EVE: ["#305dc5", "#efefff"],
 FUL: ["#f0f0ed", "#263041"], HUL: ["#f8a940", "#293240"], IPS: ["#3a70d2", "#e5eefa"],
 LEE: ["#f3f3ed", "#e8c246"], LIV: ["#d93249", "#ffe3d8"], MCI: ["#83c5ee", "#e6f4ff"],
 MUN: ["#dc3a4e", "#263041"], NEW: ["#edeef1", "#273040"], NFO: ["#dc374a", "#fff2da"],
 SUN: ["#ee4057", "#f5f1ea"], TOT: ["#f2f2ef", "#36436a"],
};
const striped = new Set(["BOU", "BRE", "BHA", "CRY", "HUL", "NEW", "SUN"]);

export function Kit({ player }: { player: Player }) {
 const goalkeeper = player.position === "Goalkeeper";
 const [body, sleeves] = goalkeeper ? ["#76c898", "#294e60"] : shirts[player.team] ?? ["#8297b2", "#e2eaf5"];
 return <span className={`kit ${!goalkeeper && striped.has(player.team) ? "kit-striped" : ""}`}
  style={{ "--shirt": body, "--sleeves": sleeves } as CSSProperties} aria-hidden="true" />;
}

const availability: Record<string, string> = {
 d: "Doubtful", i: "Injured", s: "Suspended", u: "Unavailable", n: "Unavailable",
};
export function Availability({ player }: { player: Player }) {
 const label = availability[player.status ?? ""];
 if (!label) return null;
 return <span className="availability" title={player.news || undefined}>
  {label}{player.chanceNext != null ? ` · ${player.chanceNext}% next GW` : ""}
 </span>;
}

export function fixtureLabel(fixtures: Fixture[], team: string, gw: number) {
 const round = fixtures.filter(fixture => fixture.gw === gw);
 if (!round.length) return "—";
 const opponents = round.flatMap(({ home, away }) => home === team ? [`${away} (H)`] : away === team ? [`${home} (A)`] : []);
 return opponents.length ? opponents.join(" · ") : "Blank";
}
