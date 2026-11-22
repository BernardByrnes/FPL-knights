export type Week = { gw: number; points: number | null; minutes: number | null; xg: number | null; xa: number | null };
export type Fixture = { gw: number; home: string; away: string };
export type Player = { id: number; name: string; fullName: string; team: string; teamCode: number; position: string; price: number | null; points: number | null; minutes: number | null; starts: number | null; goals: number | null; assists: number | null; xg: number | null; xa: number | null; xgi: number | null; cleanSheets: number | null; defensive: number | null; form: number | null; ppg: number | null; projectedPoints?: number | null; projectedMinutes?: number | null; projectionValue?: number | null; status?: string; news?: string; chanceNext?: number | null; ownership?: number | null; transfersIn?: number | null; transfersOut?: number | null; priceChange?: number | null; weeks: Week[] };
export type Dataset = { season: string; snapshotGameweek: number; sourceCommit: string; updatedAt: string; completedGameweeks: number[]; nextGameweek: number | null; deadline: string | null; fixtures?: Fixture[]; players: Player[] };
export type Forecast = { source: string; gameweeks: number[]; players: Record<number, Record<number, { points: number | null; probability: number | null }>> };

export type ProjectionRow = {id:number;name:string;team:string;position:string;buyPrice:number|null;sellPrice:number|null;weeks:Record<number,{points:number|null;minutes:number|null}>};
export type Projections = {gameweeks:number[];sourceCommit:string;sourceUpdatedAt:string;sourceUrl:string;rows:ProjectionRow[]};

export type DatasetView = Omit<Dataset,"sourceCommit">;
export type ProjectionView = {gameweeks:number[];updatedAt:string;rows:Pick<ProjectionRow,"id"|"weeks">[]};
