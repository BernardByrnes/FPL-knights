import "server-only";
import { unstable_cache } from "next/cache";
import { parseProjections } from "./projections";
import type { Projections } from "./types";
const load=unstable_cache(async(start:number):Promise<Projections>=>{
 const path=`src/static/projection/2026-27/gw${start}.csv`;
 const metadata=await fetch(`https://api.github.com/repos/sertalpbilal/fpl_optimized/commits?sha=engine&path=${encodeURIComponent(path)}&per_page=1`,{cache:"no-store",signal:AbortSignal.timeout(10000)});
 if(!metadata.ok)throw Error("Projection source metadata unavailable");
 const commits=await metadata.json();const commit=commits[0];if(!/^[a-f0-9]{40}$/.test(commit?.sha)||!Number.isFinite(Date.parse(commit?.commit?.committer?.date)))throw Error("Invalid projection provenance");
 const response=await fetch(`https://raw.githubusercontent.com/sertalpbilal/fpl_optimized/${commit.sha}/${path}`,{cache:"no-store",signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error("Projection source unavailable");const normalized=parseProjections(await response.text(),start);if(normalized.rows.length<100)throw Error("Incomplete projection source");
 return {...normalized,sourceCommit:commit.sha,sourceUpdatedAt:commit.commit.committer.date,sourceUrl:`https://github.com/sertalpbilal/fpl_optimized/blob/${commit.sha}/${path}`};
},["fpl-optimized-personal-projections-v1"],{revalidate:43200});
export async function loadProjections(start:number|null){if(start==null)return null;try{return await load(start)}catch(error){console.warn("Projections unavailable:",error instanceof Error?error.message:"unknown source error");return null}}
