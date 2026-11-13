import type { Player } from "./types";
export const emptyComparisonFilters = {club:"",position:"",minPrice:"",maxPrice:"",minutes:"",points:"",form:"",xg:"",xa:"",defensive:""};
export type ComparisonFilters = typeof emptyComparisonFilters;
export function matchesComparisonFilters(p:Player, filters:ComparisonFilters):boolean {
 if(filters.club && p.team!==filters.club || filters.position && p.position!==filters.position) return false;
 for(const key of ["minPrice","maxPrice","minutes","points","form","xg","xa","defensive"] as const){
  const raw=filters[key]; if(raw.trim()==="") continue;
  const limit=Number(raw); const actual=key==="minPrice"||key==="maxPrice"?p.price:p[key];
  if(!Number.isFinite(limit)||limit<0||actual==null||!Number.isFinite(actual)) return false;
  if(key==="maxPrice"?actual>limit:actual<limit) return false;
 }
 return true;
}
