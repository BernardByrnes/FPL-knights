# FPL Knights

An independent Fantasy Premier League analytics MVP. Season data is observed FPL Core Insights data; imported FPL Form numbers are forecasts and stay in your browser's memory.

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

## Private forecast import

Download a personal export from [FPL Form](https://www.fplform.com/export-fpl-form-data), then choose **Import projections**. Parsing and matching are browser-local: no upload, API request, persistence, or analytics service is involved. The preview lists matching coverage and warnings before confirmation. Close or reload the page, or use **Clear imported projections**, to discard it.

Supported columns are `X_pts`, or the extra-column export's `X_with_prob`, `X_pts_no_prob`, and `X_prob`, with optional `GW` prefix (for example `10_pts` or `GW10_with_prob`). `X_pts` and `X_with_prob` are already probability-weighted and are never multiplied again. Conditional-only values are not shown as weighted forecasts. Unknown, duplicate and ambiguous players are excluded; choose a specific player in the preview when name matching is ambiguous. An ID column (`id`, `player_id`, `element`, or `fpl_id`) takes precedence over name matching; otherwise a unique exact normalized name is required. The comparison shows actual coverage for each five-week window and labels partial totals. FPL Form prohibits publishing its exports; do not commit private CSVs or derived projection tables.

## Scope and limitations

This MVP has no account, backend upload, recommendation engine or automated FPL Form access. Upcoming fixtures are unavailable until the source provides a reliably identifiable future Premier League schedule. Historical snapshots may be stale if upstream refresh fails; use the visible timestamp and commit link. Team and positional filters are in the player explorer; source data may contain missing values shown as dashes. Forecast data disappears on reload by design.

## Verified workflow run

The first successful manual refresh was [run 43499043623](https://github.com/BernardByrnes/FPL-knights/actions/runs/43499043623) on 13 November 2026, at commit `c719f57`. It passed `npm ci`, ingestion, typecheck, lint, unit tests and the production build. The earlier [lockfile bootstrap run](https://github.com/BernardByrnes/FPL-knights/actions/runs/43498206501) also successfully committed the lockfile with the Actions token. Enable GitHub Actions and allow the workflow token to write repository contents; branch protection rules must also permit the refresh bot to push, or the refresh commit step will fail. You can launch **Refresh FPL data → Run workflow** from the Actions tab. Scheduled runs use GitHub's UTC cron schedule and may start later than the stated time.
