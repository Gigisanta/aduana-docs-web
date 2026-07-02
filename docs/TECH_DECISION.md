# Tech decision — AduanaDocs

## Decision

Build AduanaDocs as **Next.js 16 + React 19 + TypeScript + Supabase Auth/Postgres/Storage/RLS**.

The app keeps a local demo mode for sales, but the production path is Supabase-backed. This is the best fit for customs documentation because the hard part is not rendering UI; it is authenticated multi-tenant access to sensitive documents with storage policies, auditability, and operational simplicity.

## What we use in other projects

| Pattern seen in Gio repos | Where | Good | Pain / risk |
|---|---|---|---|
| Next.js 16 + React 19 | Infrannova, MaatWork CRM, Hub, Nutrición, Varigas, Gym | Best deploy story on Vercel, App Router, server actions, good UI velocity | Build/prerender can fail if client-only APIs leak into server render; keep browser APIs guarded |
| Tailwind v4 | Most current MaatWork apps | Fast design iteration, tokenized style | `@apply`/config pitfalls; for AduanaDocs we use plain CSS first to reduce moving parts |
| Prisma | CRM, Hub, Gym, Varigas, Oro Azul | Great schema DX, Studio, clear migrations, easy relational modeling | Heavier runtime/client generation; serverless/edge and version churn can be annoying |
| Drizzle | Infrannova, Nutrición | Very lean, SQL-like, fast, serverless-friendly | More manual migrations/policies; less batteries-included than Prisma |
| NextAuth/Auth.js | Several MaatWork apps | Works for app auth and OAuth | Does not solve object storage/RLS by itself; docs product still needs DB/storage policy layer |
| R2/S3 style object storage | Infrannova-style document systems | Durable and flexible for files | You must build auth/signing/policies/audit surfaces yourself |

## Why Supabase-first here

AduanaDocs handles customs paperwork: invoices, BL/AWB/CRT, SEDI support, permits, certificates, guarantees, transport docs. The data is multi-tenant and sensitive. Supabase gives us:

- Postgres as source of truth.
- Auth identities matching database `auth.uid()`.
- Row Level Security for tenant isolation.
- Private Storage buckets with SQL policies.
- Good enough zero-to-paid speed for MVP pilots.
- No fake backend or hand-rolled auth.

## Why not Prisma-first now

Prisma is still valid for internal CRUD-heavy apps. For this product, however, RLS and storage policy correctness matter more than ORM comfort. A Prisma + NextAuth + S3/R2 stack would require more custom security glue. That can be worth it later for enterprise deployments, but not for the first sellable production path.

## Why not Drizzle as the primary app data layer now

Drizzle is lean and performs well. But when using Supabase Auth/RLS, direct Supabase clients keep auth context and policies clearer. Drizzle can be added later for server-only admin/reporting jobs or type-safe migrations, but the first path should keep security obvious.

## Build rule

- Demo mode works without env vars via localStorage.
- Production mode activates when Supabase env vars exist.
- Schema/RLS/storage policies live in `supabase/migrations/0001_initial_schema.sql`.
- No official ARCA/VUCE/SIM integration is claimed until a real integration contract exists.
