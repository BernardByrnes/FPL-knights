import { readFile } from "node:fs/promises";
import Dashboard from "@/components/dashboard";
import type { Dataset } from "@/lib/types";
export default async function Page(){ let data: Dataset | null = null; try { data=JSON.parse(await readFile(process.cwd()+"/public/data/season.json","utf8")); } catch {} return <Dashboard data={data}/>; }
