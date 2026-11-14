import { readFile } from "node:fs/promises";
import { loadProjections } from "@/lib/load-projections";
import Dashboard from "@/components/dashboard";
import type { Dataset } from "@/lib/types";
export const revalidate = 300;
export default async function Page(){
 let data: Dataset | null = null;
 try {data=JSON.parse(await readFile(process.cwd()+"/public/data/season.json","utf8"));} catch {}
 try {
  const response = await fetch("https://raw.githubusercontent.com/BernardByrnes/FPL-knights/main/public/data/season.json", {next:{revalidate:300}, signal:AbortSignal.timeout(5000)});
  if(response.ok){const candidate=await response.json() as Dataset;if((!data || Date.parse(candidate.updatedAt)>=Date.parse(data.updatedAt)) && candidate.season==="2026-2027" && candidate.players?.length>100 && /^[a-f0-9]{40}$/.test(candidate.sourceCommit)) data=candidate;}
 } catch {}
 const projections=await loadProjections(data?.nextGameweek??null);
 return <Dashboard data={data} projections={projections}/>;
}
