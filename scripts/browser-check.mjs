import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
const data=JSON.parse(await readFile("public/data/season.json","utf8"));
const ranked=[...data.players].filter(p=>p.points!=null).sort((a,b)=>b.points-a.points);
const selected=ranked.filter(p=>data.players.filter(q=>q.name===p.name).length===1).slice(0,4);
const [first,second]=selected;
const browser=await chromium.launch({headless:true});
await mkdir("artifacts",{recursive:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
async function checkNoSourceReferences(){
 if(await page.locator('a[href*="github.com"],a[href$=".csv"]').count())throw Error("Provider or CSV access link remains in frontend");
 const text=await page.locator("body").innerText();if(/\bUTC\b/.test(text))throw Error("Website timestamps must use EAT");if(/FPL Optimized|FPL Core Insights|source CSV/i.test(text))throw Error("Provider reference remains visible");
}
const errors=[]; page.on("pageerror",e=>errors.push(e.message));
page.on("console",message=>{if(message.type()==="error" && /hydration|whitespace text nodes|cannot be a child|cannot be a descendant/i.test(message.text())) errors.push(message.text());});
const response=await page.goto("http://127.0.0.1:3000",{waitUntil:"networkidle"});
const headers=response.headers();
if(headers["x-content-type-options"]!=="nosniff" || headers["x-frame-options"]!=="DENY") throw Error("Missing browser security headers");
if(headers["x-powered-by"]) throw Error("Framework identification header should be disabled");
await page.getByRole("heading",{name:"The bigger picture."}).waitFor();
if(await page.locator(".category-ranking").count()!==6) throw Error("Expected six category leaderboards");
for(const category of await page.locator(".category-ranking").all()) {if(await category.locator("li").count()!==6) throw Error("Each category must display six ranked players");}

await page.waitForTimeout(350);
await checkNoSourceReferences();
await page.screenshot({path:"artifacts/dashboard-desktop.png",fullPage:true});
await page.getByRole("button",{name:"Projections",exact:true}).click();
await page.getByRole("heading",{name:"Look five weeks ahead."}).waitFor();
await page.locator(".projection-row").first().waitFor();
if(await page.locator(".projection-row").first().locator(".projection-weeks>div").count()!==5)throw Error("Expected five forecast gameweeks");
await page.getByLabel("Search projections").fill("Raya");
await page.locator(".projection-row").first().waitFor();
await checkNoSourceReferences();
await page.screenshot({path:"artifacts/projections-desktop.png",fullPage:true});
const forecastRow=page.locator(".projection-row").first();
const forecastName=await forecastRow.locator(".projection-player>strong").textContent();
const weekly=await forecastRow.locator(".projection-weeks b").allTextContents();
const total=Number(await forecastRow.locator(".projection-total b").textContent());
if(Math.abs(weekly.reduce((sum,v)=>sum+Number(v),0)-total)>.011)throw Error("Five-week forecast total does not match weekly values");
await forecastRow.getByRole("button",{name:"Compare +",exact:true}).click();
await page.locator('tr[data-metric="projectedPoints"]').waitFor();
if((await page.locator('tr[data-metric="projectedPoints"] td[data-player-id] span').first().textContent())==="—")throw Error("Selected player forecast was not joined");
await page.getByRole("button",{name:`Remove ${forecastName}`,exact:true}).click();

await page.getByRole("button",{name:"Player explorer"}).click();
const pagination=page.getByRole("navigation",{name:"Player pagination top",exact:true});
if(await page.locator(".player-table-row").count()!==25)throw Error("Expected 25 players per page");
const firstPageName=await page.locator(".player-table-row button").first().textContent();
await pagination.getByRole("button",{name:"Next",exact:true}).click();
if(await page.locator(".player-table-row button").first().textContent()===firstPageName)throw Error("Next player page did not change results");
await page.getByLabel("Players per page",{exact:true}).selectOption("10");
if(await page.locator(".player-table-row").count()!==10)throw Error("Page size did not update");
await pagination.getByRole("button",{name:"Next",exact:true}).click();
const pageJump=page.getByLabel("Go to player page",{exact:true});
const lastPage=await pageJump.locator("option").last().getAttribute("value");
await pageJump.selectOption(lastPage);
if(!(await pagination.getByRole("button",{name:"Next",exact:true}).isDisabled()))throw Error("Last page should disable Next");
await page.getByLabel("Search players",{exact:true}).fill("zzzz-no-matching-player");
if(await page.locator(".player-table-row").count()!==0 || !(await pagination.getByRole("button",{name:"Next",exact:true}).isDisabled()))throw Error("Empty pagination state failed");

await page.getByLabel("Search players",{exact:true}).fill(first.name);
if(!(await page.getByRole("navigation",{name:"Player pagination top",exact:true}).getByRole("button",{name:"Previous",exact:true}).isDisabled()))throw Error("Search did not reset pagination");

await page.locator(".player-table-row").first().waitFor();
await page.locator(".player-table-row button").first().click();
await page.getByRole("dialog").getByText(first.fullName).waitFor();
await page.getByRole("dialog").getByRole("button",{name:"Close"}).click();
await page.getByRole("button",{name:"Compare players"}).click();
if(await page.locator(".metric-picker").count()) throw Error("Statistics controls must wait for a player");
for(const p of [first,second]) { await page.getByLabel("Search players to compare").fill(p.name); await page.locator(".search-results button").filter({hasText:p.name}).first().click(); await page.getByText("Choose statistics to compare",{exact:true}).waitFor(); }
await page.getByRole("heading",{name:"The numbers, side by side"}).waitFor();
if(await page.locator(".comparison tr").evaluateAll(rows=>rows.some(row=>Array.from(row.childNodes).some(node=>node.nodeType===3)))) throw Error("Comparison rows must not contain whitespace text nodes");

await page.getByRole("button",{name:"Clear statistics",exact:true}).click();
await page.getByLabel("Expected goals (xG)",{exact:true}).check();
await page.getByLabel("Price",{exact:true}).check();
if(await page.locator("tbody tr").count()!==2) throw Error("Only chosen statistics should be displayed");
for(const key of ["xg","price"]){
 const row=page.locator(`tr[data-metric="${key}"]`);
 const values=await row.locator("td[data-player-id]").evaluateAll(cells=>cells.map(c=>({id:Number(c.getAttribute("data-player-id")),value:Number(c.querySelector("span").textContent.replace(/[£m]/g,"")),best:c.classList.contains("best-metric")})));
 const best=(key==="price"?Math.min:Math.max)(...values.map(v=>v.value));
 if(values.some(v=>v.best!==(v.value===best))) throw Error(`Wrong ${key} highlight`);
}
await page.getByRole("button",{name:"Select all",exact:true}).click();
const projectedValues=await page.locator('tr[data-metric="projectedPoints"] td[data-player-id]').evaluateAll(cells=>cells.map(c=>({value:Number(c.querySelector("span").textContent),best:c.classList.contains("best-metric")})));
if(projectedValues.length!==2||projectedValues.some(v=>!Number.isFinite(v.value)))throw Error("Five-week comparison values missing");
const projectedBest=Math.max(...projectedValues.map(v=>v.value));
if(projectedValues.some(v=>v.best!==(v.value===projectedBest)))throw Error("Wrong projected points winner");

await page.getByRole("heading",{name:"Points per £million"}).waitFor();
if(await page.getByRole("button",{name:"Import projections"}).count()) throw Error("Import button must be removed");
await page.waitForTimeout(350);
await checkNoSourceReferences();
await page.screenshot({path:"artifacts/comparison-desktop.png",fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.reload({waitUntil:"networkidle"});
await page.getByRole("heading",{name:"The bigger picture."}).waitFor();
await page.waitForTimeout(350);
await page.screenshot({path:"artifacts/dashboard-mobile.png",fullPage:true});
await page.locator(".mobile-nav").getByRole("button",{name:"Projections",exact:true}).click();
await page.locator(".projection-row").first().waitFor();
await page.getByLabel("Search projections").fill("Raya");
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error("Projection mobile overflow");
await page.screenshot({path:"artifacts/projections-mobile.png",fullPage:true});
await page.locator(".mobile-nav").getByRole("button",{name:"Players",exact:true}).click();
await page.getByLabel("Search players",{exact:true}).fill(first.name);
await page.screenshot({path:"artifacts/players-mobile.png",fullPage:true});
await page.locator(".mobile-nav").getByRole("button",{name:"Compare",exact:true}).click();
for(const p of selected) { await page.getByLabel("Search players to compare").fill(p.name); await page.locator(".search-results button").filter({hasText:p.name}).first().click(); }
await page.getByRole("heading",{name:"The numbers, side by side"}).waitFor();
if(await page.locator(".comparison tr").evaluateAll(rows=>rows.some(row=>Array.from(row.childNodes).some(node=>node.nodeType===3)))) throw Error("Comparison rows must not contain whitespace text nodes");

await page.waitForTimeout(350);
const overflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
if(overflow.width>overflow.viewport) throw Error(`Mobile horizontal overflow: ${JSON.stringify(overflow)}`);
await page.waitForTimeout(350);
await page.screenshot({path:"artifacts/comparison-mobile.png",fullPage:true});
if(errors.length) throw Error(`Browser errors: ${errors.join("; ")}`);
console.log(`Browser QA passed with ${first.name} and ${second.name}; responsive cards, bottom navigation, no import button.`);
await browser.close();
