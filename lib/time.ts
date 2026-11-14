export function formatEAT(timestamp:string,compact=false):string {
 const date=new Date(timestamp);
 if(!Number.isFinite(date.getTime()))return "Unavailable";
 return new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",day:"2-digit",month:"short",...(compact?{}:{year:"numeric"}),hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(date)+" EAT";
}
