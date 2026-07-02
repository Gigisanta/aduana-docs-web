# AduanaDocs implementation plan

## Phase 0 — Current completed scaffold

- Next.js 16 / React 19 / TypeScript app shell.
- Local demo workspace with modules: Panel, Legajos, Clientes, Vencimientos, Documentos, Portal cliente, Configuración.
- Production architecture corrected after delegated audit: NextAuth v5 + Prisma + Postgres/Neon + R2.
- Static export on Vercel so the sales demo is public and cheap.
- Legacy HTML preserved at `public/legacy-static-app.html`.

## Phase 1 — Production backend foundation

1. Add Auth.js/NextAuth v5 root `auth.ts` with pinned beta version.
2. Add Prisma Client singleton and run migrations against Neon/Postgres.
3. Implement workspace creation and membership roles:
   - owner
   - admin
   - operator
   - client_viewer
   - auditor
4. Move demo state behind repository interfaces so UI can switch from local demo to server data.
5. Add Vitest coverage for domain functions and authorization helpers before CRUD grows.

## Phase 2 — Core data workflows

1. Clients CRUD.
2. Legajos CRUD.
3. Checklist generation per operation kind.
4. Vencimientos computed from operation dates.
5. Audit log dual-write in every mutation.

## Phase 3 — Documents and client portal

1. R2 bucket private by default.
2. Upload flow:
   - Server Action validates session + workspace role.
   - Server returns signed upload URL.
   - Browser uploads directly to R2.
   - Server records metadata and audit event.
3. Download/share flow:
   - role-aware Server Action.
   - signed URL TTL 5 minutes.
   - portal share tokens scoped to legajo/client.
4. MIME allowlist and file-size limits.

## Phase 4 — Hardening before paid production

- Rate limiting on auth and file routes.
- 2FA for owner/admin.
- Virus scanning pipeline for uploaded files.
- Backups and restore test.
- Append-only audit export.
- Ley 25.326 privacy/data handling review.
- Pen-test readiness checklist.

## Why not jump straight to all of this

The current app is already useful for demos and concierge pilots. The expensive part is secure backend hardening. Build it only after paid pilots confirm workflow and pricing.
