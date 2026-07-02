# AduanaDocs Web

Full local-first app (not just a landing page) for customs documentation management, aimed at despachantes de aduana, agentes de transporte aduanero, forwarders, and import/export operators.

## Live

- Production: https://aduana-docs-web.vercel.app
- GitHub: https://github.com/Gigisanta/aduana-docs-web
- Vercel project: `giolivos-projects/aduana-docs-web`

## Scope

- Single static `index.html`.
- No build step, no dependencies, no backend.
- Short marketing intro (research, ICPs, competitor framing, GTM) plus a hash-routed app shell that is the main product surface.
- Research appendix: `research/argentina-customs-taxonomy.md`.

## App shell

- `#app` gates a local demo login/onboarding (workspace name, no real auth) before showing the app.
- Sidebar hash routing (`#app/panel`, `#app/legajos`, `#app/clientes`, `#app/vencimientos`, `#app/documentos`, `#app/portal`, `#app/config`) swaps modules without a page reload.
- "Ver sitio" / "Entrar a la app" toggles between marketing and app mode; any non-`#app` hash exits app mode.

## Modules

- **Panel**: live KPIs, risk queue, upcoming deadlines, quick actions.
- **Legajos**: create operations, auto-generated checklist by operation type (importación, exportación, tránsito, temporal), search/filter, detail view, checklist toggles, delete, export JSON/CSV, copy summary, reset demo, ROI calculator.
- **Clientes**: client registry derived from operations, with add/edit/delete, contact fields, and per-client op/risk stats.
- **Vencimientos**: deadline list sorted by urgency, filterable by 7/14/30 days.
- **Documentos**: cross-operation document matrix, filterable by client/status, exportable as CSV.
- **Portal cliente**: simulated shareable client view per legajo (checklist status, copy link, copy WhatsApp-style message).
- **Configuración**: workspace name, plan selection, production-readiness checklist, reset workspace data.

All state persists to `localStorage` (`aduanaDocsOpsV2`, `aduanaDocsClientsV1`, `aduanaDocsSessionV1`, `aduanaDocsSettingsV1`, `aduanaDocsRoiV1`).

## UI/UX pass

- Claude Code Sonnet pass turned the single-page demo into a full app shell with sidebar navigation, local session gating, and 7 functional modules, while keeping the marketing research content as a shorter intro.
- Still one static page: no external assets, no dependencies, no backend.

## Safety note

This app does **not** upload or process real customs documents, and its login is a local demo session (no real auth/backend). It does not claim official ARCA/VUCE/SIM/SITA integration — it positions itself as an operational control layer over those official systems. A production version needs real authentication, authorization, encrypted storage, audit logs, backups, and verified legal/compliance review.

## Deploy

Static HTML deploys directly on Vercel. The GitHub repo is connected to the Vercel project.
