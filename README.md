# AduanaDocs

Real SaaS scaffold for customs-documentation operations: despachantes de aduana, ATA, forwarders, and import/export operators.

## Live

- Production: https://aduana-docs-web.vercel.app
- App route: https://aduana-docs-web.vercel.app/#app

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Plain CSS, no UI library
- Supabase-ready backend: Auth + Postgres + Storage + RLS
- Local demo mode with `localStorage` when Supabase env vars are absent

## Modules

- Panel: KPIs, risk queue, upcoming deadlines, quick actions.
- Legajos: create/delete, checklist by operation kind, risk scoring, document status, JSON/CSV export.
- Clientes: client registry, contact fields, CRUD.
- Vencimientos: deadline windows 7/14/30/all.
- Documentos: document matrix by operation/client/status, CSV export.
- Portal cliente: simulated shareable status view/message.
- Configuración: workspace, pricing plan, production-readiness checklist, reset.

## Production schema

See `supabase/migrations/0001_initial_schema.sql`.

Core tables:

- `workspaces`
- `profiles`
- `workspace_members`
- `clients`
- `operations`
- `operation_docs`
- `document_files`
- `portal_shares`
- `audit_events`

RLS is enabled for tenant isolation. Storage bucket: `customs-documents`.

## Env vars

Copy `.env.example` to `.env.local` when connecting Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

The app builds and runs without these values in demo mode.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
```

## Docs

- `docs/TECH_DECISION.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `research/argentina-customs-taxonomy.md`

## Safety note

Demo mode does **not** upload or process real customs documents. Production use requires Supabase Auth, private storage, RLS verification, audit logs, backups, and legal/compliance review. AduanaDocs is an operational control layer over official systems; it does not claim official ARCA/VUCE/SIM/SITA integration.

## Legacy

The previous static HTML app is preserved at `public/legacy-static-app.html`.
