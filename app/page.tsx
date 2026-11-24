import { readFile } from "node:fs/promises";
import { loadProjections } from "@/lib/load-projections";
import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { buildSquad, SQUAD_BUDGET } from "@/lib/squad";
import Dashboard from "@/components/dashboard";
import type { Dataset } from "@/lib/types";
const loadSquad = unstable_cache(buildSquad, ["gw-squad-v1", String(SQUAD_BUDGET)], { revalidate: 43200 });
export default async function Page(){
 // Render a fresh page from the data caches instead of caching the whole dashboard.
 await connection();
 let data: Dataset | null = null;
 try {data=JSON.parse(await readFile(process.cwd()+"/public/data/season.json","utf8"));} catch {}
 try {
  const response = await fetch("https://raw.githubusercontent.com/BernardByrnes/FPL-knights/main/public/data/season.json", {next:{revalidate:300}, signal:AbortSignal.timeout(5000)});
  if(response.ok){const candidate=await response.json() as Dataset;if((!data || Date.parse(candidate.updatedAt)>=Date.parse(data.updatedAt)) && candidate.season==="2026-2027" && candidate.players?.length>100 && /^[a-f0-9]{40}$/.test(candidate.sourceCommit)) data=candidate;}
 } catch {}
 const projections=await loadProjections(data?.nextGameweek??null);
 const view=data?{season:data.season,snapshotGameweek:data.snapshotGameweek,updatedAt:data.updatedAt,completedGameweeks:data.completedGameweeks,nextGameweek:data.nextGameweek,deadline:data.deadline,fixtures:data.fixtures,players:data.players}:null;
 const projectionView=projections?{gameweeks:projections.gameweeks,updatedAt:projections.sourceUpdatedAt,rows:projections.rows.map(({id,weeks})=>({id,weeks}))}:null;
 const squad = view?.nextGameweek && projectionView
  ? await loadSquad(view.players, projectionView, view.nextGameweek).catch(error => {
     console.warn("Unable to optimize gameweek squad:", error);
     return null;
    })
  : null;
 return <Dashboard data={view} projections={projectionView} squad={squad}/>;
}
