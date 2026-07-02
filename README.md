# AduanaDocs

SaaS demo + production scaffold for customs-documentation operations: despachantes de aduana, ATA, freight forwarders, and import/export operators.

## Live

- Production demo: https://aduana-docs-web.vercel.app
- Legacy static prototype: `/legacy-static-app.html`

## Current state

The deployed product is a **Next.js 16 / React 19 / TypeScript** app running as a static sales/demo shell. It includes a local demo workspace for:

- Panel operativo
- Legajos
- Clientes
- Vencimientos
- Matriz documental
- Portal cliente
- Configuración / plan comercial

The demo persists in browser `localStorage`; it is safe for sales demos and concierge pilots, not for real customer documents.

## Production backend decision

After delegated repo audit and security architecture review, the canonical production path is:

- Next.js App Router + Server Actions/API routes
- NextAuth v5 / Auth.js, pinned exact beta
- Prisma + PostgreSQL/Neon
- Cloudflare R2/S3-compatible private object storage
- Signed upload/download URLs with short TTL
- Append-only audit log for every sensitive mutation

Supabase was useful as an initial spike, but it is no longer the canonical backend decision for customs-document production data.

## Useful commands

```bash
npm install
npm run dev
npm run verify
npm audit --audit-level=moderate
```

`npm run verify` runs lint, TypeScript, domain self-checks, and production build.

## Files

- `app/page.tsx` — sales page + local demo app shell.
- `lib/domain.ts` — business/domain functions.
- `lib/demo-store-context.tsx` — local demo state.
- `prisma/schema.prisma` — production data model target.
- `docs/TECH_DECISION.md` — stack decision after repo audit.
- `docs/IMPLEMENTATION_PLAN.md` — phased backend implementation.
- `docs/PRODUCTION_ARCHITECTURE.md` — full architecture reference.
- `public/legacy-static-app.html` — previous one-file prototype.

## Env for production backend

Copy `.env.example` to `.env.local` when implementing backend mode:

```bash
cp .env.example .env.local
```

Required later:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- R2 bucket/access vars
- optional `RESEND_API_KEY`

## Compliance disclaimer

AduanaDocs is an operational control layer over official systems. It does **not** claim official ARCA/VUCE/SIM/SITA integration. Real production use requires privacy/compliance review, backups, audit retention, access controls, file malware scanning, and a tested restore path.
