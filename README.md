# FPL Knights

An independent Fantasy Premier League analytics MVP. Season data is observed FPL Core Insights data; FPL Optimized projections are forecasts loaded automatically by the server.

## Run locally

Requires Node.js 20.9 or newer and Git. From this directory:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. If no snapshot is present, run `npm run ingest` first. Ingestion needs access to GitHub; the app itself continues to use the last verified JSON snapshot when offline. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for validation. A Next.js compatible host such as Vercel can deploy the repository; no database or paid service is required. No public deployment is configured here.

## Data

[FPL Core Insights](https://github.com/olbauday/FPL-Core-Insights) supplies the public season and gameweek CSVs. The source README permits use in websites and requests attribution; its dataset itself also includes third-party data, so review underlying rights before redistributing beyond this derived view. Each refresh pins all files to one upstream commit, checks identities, schemas, completed-week chronology and Premier League fixture associations, and writes the compact derived snapshot only after validation. Missing fields remain unavailable. Prices are supplied in millions. The freshness timestamp indicates the last successful refresh, not live match tracking.

GitHub Actions refreshes at 08:30 and 18:30 UTC and supports manual dispatch. Enable Actions and repository workflow write permissions if your repository settings restrict them. A failed refresh leaves the previously committed snapshot intact. The refresh fails closed on gaps or inconsistent data; inspect workflow logs when the upstream structure changes.

## Automatic updates

The GitHub Actions ingestion refresh runs at 08:30 and 18:30 UTC (11:30 and 21:30 East Africa Time). Only validated snapshots are committed. The Next.js server checks the latest generated JSON from this repository with a five-minute cache, and an open browser refreshes its server-rendered data every five minutes. The bundled local snapshot is retained when the remote request fails or is older. No redeployment is needed to display a newly generated snapshot on a running Next.js host.

The public CSV import button has been removed. Automatic FPL Form projections are not enabled: its export terms prohibit sharing or publishing that data. A licensed forecast source or permission from FPL Form is needed before server-side forecasts can be published. The parser remains in the library with its tests for potential future authorized use.

## Scope and limitations

This MVP has no account, backend upload, recommendation engine or automated FPL Form access. Upcoming fixtures are unavailable until the source provides a reliably identifiable future Premier League schedule. Historical snapshots may be stale if upstream refresh fails; use the visible timestamp and commit link. Team and positional filters are in the player explorer; source data may contain missing values shown as dashes. 

## Verified workflow run

The first successful manual refresh was [run 43499043623](https://github.com/BernardByrnes/FPL-knights/actions/runs/43499043623) on 13 November 2026, at commit `c719f57`. It passed `npm ci`, ingestion, typecheck, lint, unit tests and the production build. The earlier [lockfile bootstrap run](https://github.com/BernardByrnes/FPL-knights/actions/runs/43498206501) also successfully committed the lockfile with the Actions token. Enable GitHub Actions and allow the workflow token to write repository contents; branch protection rules must also permit the refresh bot to push, or the refresh commit step will fail. You can launch **Refresh FPL data → Run workflow** from the Actions tab. Scheduled runs use GitHub's UTC cron schedule and may start later than the stated time.

The manual **Browser QA** workflow exercises desktop and mobile navigation, player details, four-player comparison and the absence of an import button. Screenshots are retained as a workflow artifact; the test uses real player IDs but no FPL Form forecast data.

## Security boundaries

Player statistics and frontend JavaScript are public, visible in browser developer tools, and present in this public repository. Do not place credentials, private forecasts, or personal information in public files or client component props. There are currently no user accounts, database, or public data-writing endpoints. The local development server binds to 127.0.0.1; production hosting must run a production build with HTTPS, rather than expose `next dev`.

Browser headers prevent framing, disable MIME sniffing and sensitive device permissions, and restrict object embeds and form destinations. Production browser source maps are disabled. This is baseline hardening, not a penetration-test certification; dependencies and hosting settings still need ongoing security maintenance.

## Personal five-gameweek projections

The Projections menu loads the upcoming-gameweek CSV from `sertalpbilal/fpl_optimized`, branch `engine`, under `src/static/projection/2026-27/gw{N}.csv`. The server revalidates source metadata and data together on visits after a twelve-hour cache window, pins both to the file's latest commit, and uses FPL IDs for matching. Source rows that do not match the historical player database are excluded visibly. Forecast CSVs and normalized forecasts are not committed to this public repository; Next.js server caching holds fetched forecasts. These forecasts are intended for the owner's personal dashboard. Deploying this publicly would expose forecasts to visitors.

Each weekly cell shows projected points and expected minutes. Totals and value metrics require all weeks in the stated window; blanks remain unavailable. A season-end window may contain fewer than five weeks and is explicitly labeled. Source prices are shown as source assumptions, separate from current FPL price. The comparison includes projected total points, minutes and value with higher-is-better highlighting and a weekly forecast chart. If no verified forecast can be fetched, historical views continue working. A previously cached successful forecast can survive failed revalidation; a cold cache cannot provide an offline forecast.
