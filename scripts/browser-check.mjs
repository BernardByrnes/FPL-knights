import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
const data=JSON.parse(await readFile("public/data/season.json","utf8"));
const ranked=[...data.players].filter(p=>p.points!=null).sort((a,b)=>b.points-a.points);
const selected=ranked.filter(p=>data.players.filter(q=>q.name===p.name).length===1).slice(0,4);
const [first,second]=selected;
const browser=await chromium.launch({headless:true});
await mkdir("artifacts",{recursive:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on("pageerror",e=>errors.push(e.message));
const response=await page.goto("http://127.0.0.1:3000",{waitUntil:"networkidle"});
const headers=response.headers();
if(headers["x-content-type-options"]!=="nosniff" || headers["x-frame-options"]!=="DENY") throw Error("Missing browser security headers");
if(headers["x-powered-by"]) throw Error("Framework identification header should be disabled");
await page.getByRole("heading",{name:"The bigger picture."}).waitFor();
if(await page.locator(".category-ranking").count()!==6) throw Error("Expected six category leaderboards");
for(const category of await page.locator(".category-ranking").all()) {if(await category.locator("li").count()!==6) throw Error("Each category must display six ranked players");}

await page.waitForTimeout(350);
await page.screenshot({path:"artifacts/dashboard-desktop.png",fullPage:true});
await page.getByRole("button",{name:"Player explorer"}).click();
await page.getByLabel("Search players",{exact:true}).fill(first.name);
await page.locator(".player-table-row").first().waitFor();
await page.locator(".player-table-row button").first().click();
await page.getByRole("dialog").getByText(first.fullName).waitFor();
await page.getByRole("dialog").getByRole("button",{name:"Close"}).click();
await page.getByRole("button",{name:"Compare players"}).click();
await page.getByLabel("Comparison position",{exact:true}).selectOption(first.position);
await page.getByLabel("Comparison club",{exact:true}).selectOption(first.team);
await page.getByLabel("Max price (£m)",{exact:true}).fill(String(first.price));
await page.getByLabel("Min minutes",{exact:true}).fill(String(first.minutes));
const filteredButtons=await page.locator(".candidate-results button").allTextContents();
if(!filteredButtons.length || filteredButtons.some(text=>!text.includes(first.team))) throw Error("Comparison club filter failed");
await page.getByLabel("Max price (£m)",{exact:true}).fill("0");
await page.getByText("No players match these filters. Try widening your price range or lowering a minimum.").waitFor();
await page.getByRole("button",{name:"Reset filters",exact:true}).click();

for(const p of [first,second]) { await page.getByLabel("Search players to compare").fill(p.name); await page.locator(".search-results button").filter({hasText:p.name}).first().click(); }
await page.getByRole("heading",{name:"The numbers, side by side"}).waitFor();
await page.getByLabel("Max price (£m)",{exact:true}).fill("0");
if(await page.locator(".selection:not(.vacant)").count()!==2) throw Error("Filters must not remove selected players");
await page.getByRole("button",{name:"Reset filters",exact:true}).click();

await page.getByRole("heading",{name:"Points per £million"}).waitFor();
if(await page.getByRole("button",{name:"Import projections"}).count()) throw Error("Import button must be removed");
await page.waitForTimeout(350);
await page.screenshot({path:"artifacts/comparison-desktop.png",fullPage:true});
await page.setViewportSize({width:390,height:844});
await page.reload({waitUntil:"networkidle"});
await page.getByRole("heading",{name:"The bigger picture."}).waitFor();
await page.waitForTimeout(350);
await page.screenshot({path:"artifacts/dashboard-mobile.png",fullPage:true});
await page.locator(".mobile-nav").getByRole("button",{name:"Players",exact:true}).click();
await page.getByLabel("Search players",{exact:true}).fill(first.name);
await page.screenshot({path:"artifacts/players-mobile.png",fullPage:true});
await page.locator(".mobile-nav").getByRole("button",{name:"Compare",exact:true}).click();
for(const p of selected) { await page.getByLabel("Search players to compare").fill(p.name); await page.locator(".search-results button").filter({hasText:p.name}).first().click(); }
await page.getByRole("heading",{name:"The numbers, side by side"}).waitFor();
await page.waitForTimeout(350);
const overflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
if(overflow.width>overflow.viewport) throw Error(`Mobile horizontal overflow: ${JSON.stringify(overflow)}`);
await page.waitForTimeout(350);
await page.screenshot({path:"artifacts/comparison-mobile.png",fullPage:true});
if(errors.length) throw Error(`Browser errors: ${errors.join("; ")}`);
console.log(`Browser QA passed with ${first.name} and ${second.name}; responsive cards, bottom navigation, no import button.`);
await browser.close();
