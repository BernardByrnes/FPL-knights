import type { Player } from "./types";
import { money, per90, value } from "./metrics";
export type ComparisonMetric = {key:string;label:string;get:(p:Player)=>number|null;direction:"higher"|"lower";digits:number;format?:(value:number|null)=>string;help?:string};
export const comparisonMetrics:ComparisonMetric[] = [
 {key:"projectedPoints",label:"Next 5 GW projected points",get:p=>p.projectedPoints??null,direction:"higher",digits:2,help:"Forecast total across the displayed upcoming window; unavailable if any gameweek is missing."},
 {key:"projectedMinutes",label:"Next 5 GW expected minutes",get:p=>p.projectedMinutes??null,direction:"higher",digits:1},
 {key:"projectionValue",label:"Projected points per £m",get:p=>p.projectionValue??null,direction:"higher",digits:2},
 {key:"price",label:"Price",get:p=>p.price,direction:"lower",digits:1,format:money},
 {key:"points",label:"Total points",get:p=>p.points,direction:"higher",digits:0},
 {key:"ppg",label:"Points per game",get:p=>p.ppg,direction:"higher",digits:2},
 {key:"per90",label:"Points per 90",get:per90,direction:"higher",digits:2,help:"Season points divided by minutes, multiplied by 90."},
 {key:"minutes",label:"Minutes",get:p=>p.minutes,direction:"higher",digits:0},
 {key:"starts",label:"Starts",get:p=>p.starts,direction:"higher",digits:0},
 {key:"goals",label:"Goals",get:p=>p.goals,direction:"higher",digits:0},
 {key:"assists",label:"Assists",get:p=>p.assists,direction:"higher",digits:0},
 {key:"xg",label:"Expected goals (xG)",get:p=>p.xg,direction:"higher",digits:2},
 {key:"xa",label:"Expected assists (xA)",get:p=>p.xa,direction:"higher",digits:2},
 {key:"xgi",label:"Expected involvements",get:p=>p.xgi,direction:"higher",digits:2},
 {key:"cleanSheets",label:"Clean sheets",get:p=>p.cleanSheets,direction:"higher",digits:0},
 {key:"defensive",label:"Defensive contributions",get:p=>p.defensive,direction:"higher",digits:0},
 {key:"form",label:"Recent form",get:p=>p.form,direction:"higher",digits:1,help:"FPL's snapshot form metric."},
 {key:"value",label:"Points per £m",get:value,direction:"higher",digits:2}
];
// Compare at displayed precision so identical displayed numbers receive equal treatment.
export function bestPlayerIds(players:Player[],metric:ComparisonMetric):number[]{
 const available=players.map(p=>({id:p.id,value:metric.get(p)})).filter((p):p is {id:number;value:number}=>p.value!=null&&Number.isFinite(p.value)).map(p=>({...p,value:Number(p.value.toFixed(metric.digits))}));
 if(available.length<2)return [];
 const best=(metric.direction==="lower"?Math.min:Math.max)(...available.map(p=>p.value));
 return available.filter(p=>p.value===best).map(p=>p.id);
}
