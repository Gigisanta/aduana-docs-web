# AduanaDocs implementation plan

## Phase 0 — Current completed scaffold

- Next.js 16 / React 19 / TypeScript app shell.
- Local demo workspace with modules: Panel, Legajos, Clientes, Vencimientos, Documentos, Portal cliente, Configuración.
- Domain model and pure functions for checklist templates, risk, completion, deadline windows, CSV export.
- Supabase-ready env helpers and SQL migration for production schema/RLS/storage.
- Legacy static HTML preserved under `public/legacy-static-app.html`.

## Phase 1 — Paid pilot backend

1. Create Supabase project.
2. Apply `supabase/migrations/0001_initial_schema.sql`.
3. Configure env vars in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` only for trusted server jobs, never client.
4. Implement Supabase Auth screens.
5. Replace demo-store operations with Supabase repository methods.
6. Use private Storage bucket paths: `{workspace_id}/{operation_id}/{doc_id}/{filename}`.
7. Add audit event insert for every create/update/delete/upload/share action.

## Phase 2 — Production document workflow

- Real file upload/download with signed URLs.
- Document observation/rejection states.
- Roles: owner/admin/operator/client_viewer.
- Portal share tokens with expiration/revocation.
- Email/WhatsApp copy templates; no automated sending until deliverability and consent are clear.
- Backups and restore drill.

## Phase 3 — Commercial readiness

- Concierge onboarding for 3–5 despachantes/ATA.
- Import client/legajo CSV.
- Pilot pricing: Starter USD 200–500/mo equivalent ARS or fee per legajo.
- Measure hours saved, missing-document rate, operation delays avoided.
- Only then add OCR/API integrations.

## Phase 4 — Integrations, if validated

- OCR extraction for invoice/packing/transport docs.
- ARCA/VUCE/SIM references only via official/legal paths.
- Accounting/ERP export.
- Advanced audit/reporting.

## Gates before real documents

- Auth live and tested.
- RLS test suite with cross-tenant denial checks.
- Private storage policies tested.
- Audit logs immutable enough for operational review.
- Data retention/backup policy written.
- Legal/compliance review for customs document custody.
