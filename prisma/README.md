# Prisma production schema

Canonical production backend target after delegated audit:

- NextAuth v5 / Auth.js for auth.
- Prisma for schema, migrations, and server-only DB access.
- PostgreSQL/Neon as database.
- R2/S3-compatible object storage for private document binaries.

Documents are represented by metadata rows. Binary files must stay in private object storage and be exposed only through short-lived signed URLs after server-side role checks.

Run later, once `DATABASE_URL` is configured:

```bash
npx prisma validate
npx prisma migrate dev --name initial
npx prisma migrate deploy
```
