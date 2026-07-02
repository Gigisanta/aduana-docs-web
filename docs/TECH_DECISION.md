# Tech decision — AduanaDocs

## Decision after delegated repo audit

Build AduanaDocs as **Next.js 16 + React 19 + TypeScript + NextAuth v5 + Prisma + PostgreSQL/Neon + Cloudflare R2**.

The live app keeps a local demo mode for sales. The production backend should be server-controlled: browser → Next.js Server Actions/API routes → Prisma/Postgres/R2. Do not expose customs-document workflows through direct browser-to-database access.

## Why this changed

The first scaffold used Supabase because it is fast for MVPs. The deeper audit of Gio's repos and the security architecture review changed the backend decision:

- **AduanaDocs stores sensitive trade data**: CUITs, invoices, BL/AWB/CRT, manifests, permits, guarantees, client contacts.
- **Auditability matters more than fastest MVP setup**: server-controlled writes make append-only audit logging easier to enforce.
- **Files should not be database blobs**: documents live in private object storage, with short-lived signed URLs generated only after role checks.
- **Gio's mature SaaS repos favor Prisma/NextAuth/npm/tests** for complex business domains.
- **Drizzle remains good for lean SQL**, but it is not the first choice here because the product's core risk is document/security workflow, not ORM minimalism.

## Stack comparison from Gio repos

| Pattern | Where seen | Keep / avoid for AduanaDocs |
|---|---|---|
| Next.js 16 + React 19 | Infrannova, CRM, Hub, Nutrición, Varigas, Gym | Keep. Best deploy and App Router story on Vercel. |
| Prisma | CRM, Hub, Gym, Varigas, Oro Azul | Prefer for production domain schema, migrations, adapter support, relational modeling. |
| Drizzle | Infrannova, Nutrición | Valid for lean SQL/admin/reporting, not primary backend for document-heavy compliance workflows. |
| NextAuth/Auth.js v5 | Mature app pattern | Use pinned exact v5 beta; do not use floating `^` for beta auth packages. |
| Supabase | Good zero-to-paid platform | Keep as a spike/reference only; not the canonical production path after audit. |
| R2/S3 private storage | Infrannova-style docs | Use for customs files with MIME whitelist + signed URL TTL + audit event. |
| npm + Vitest | Mature repos | Use npm, add Vitest before backend rewrite grows. |

## Production rule

- Demo mode can use localStorage and static export for sales validation.
- Production mode uses server-side auth, workspace membership checks, Prisma transactions, append-only audit events, and private R2 document storage.
- Database rows keep file metadata only; binary files never go into Postgres.
- No official ARCA/VUCE/SIM/SITA integration is claimed until a real integration contract exists.
