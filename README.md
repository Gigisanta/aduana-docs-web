# AduanaDocs Web

Landing page + functional prototype for a customs documentation management platform aimed at despachantes de aduana, agentes de transporte aduanero, forwarders, and import/export operators.

## Live

- Production: https://aduana-docs-web.vercel.app
- GitHub: https://github.com/Gigisanta/aduana-docs-web
- Vercel project: `giolivos-projects/aduana-docs-web`

## Scope

- Single static `index.html`.
- No build step, no dependencies, no backend.
- Includes deep market research, ICPs, feature proposal, competitor framing, regulatory/document taxonomy, GTM plan, pricing hypotheses, and a functional operations demo.
- Research appendix: `research/argentina-customs-taxonomy.md`.

## Functional demo features

- Create customs operation records.
- Auto-generate document checklists by operation type: importación, exportación, tránsito, temporal.
- Persist demo data locally in browser `localStorage`.
- Calculate completion %, missing docs, risk score, active risk count, and estimated monthly time savings.
- Search and filter operations.
- Select an operation, toggle checklist items, and delete records.
- Export current operations as JSON or CSV.
- Copy an operational summary to clipboard.
- Reset demo data.
- ROI calculator for sales/pricing conversations.

## Safety note

This prototype does **not** upload or process real customs documents. A production version needs authentication, authorization, encrypted storage, audit logs, backups, and verified legal/compliance review.

## Deploy

Static HTML deploys directly on Vercel. The GitHub repo is connected to the Vercel project.
