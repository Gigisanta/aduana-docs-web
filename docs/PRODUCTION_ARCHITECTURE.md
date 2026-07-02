# AduanaDocs — Production Architecture Document

> Customs documentation SaaS for despachantes de aduana / ATA / forwarders / import-export in Argentina & LATAM.
> Security- & compliance-first design. Read-only architecture, schema, and MVP phasing.

---

## Table of Contents

1. [Stack Decision: Supabase vs Custom NextAuth+Prisma+S3](#1-stack-decision)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Multi-Tenant Model & Workspace Isolation](#3-multi-tenant-model)
4. [Database Schema Entities](#4-database-schema-entities)
5. [RLS & Security Architecture](#5-rls--security-architecture)
6. [Compliance Considerations (Argentina Focus)](#6-compliance-considerations)
7. [File Storage Strategy](#7-file-storage-strategy)
8. [Audit Log System](#8-audit-log-system)
9. [MVP Phases](#9-mvp-phases)

---

## 1. Stack Decision

### Contenders

| Dimension | Supabase Auth + Postgres + Storage + RLS | NextAuth v5 + Prisma + PostgreSQL + S3-compatible |
|---|---|---|
| **Auth** | Built-in Supabase Auth (GoTrue). Email/password, OAuth, magic link. JWT or session. | NextAuth v5 (Auth.js). Providers: credentials, OAuth, magic link. JWT sessions or DB sessions. |
| **DB** | Postgres via Supabase (managed). Direct client access via PostgREST (anon key + RLS). | Custom PostgreSQL (Neon, RDS, Supabase as provider). Access only through Next.js Server Actions / API routes. |
| **File storage** | Supabase Storage (S3-compatible). Signed URLs. RLS policies on storage objects. | S3-compatible (R2, MinIO, AWS S3). Signed URLs or CloudFront signed cookies. |
| **Multi-tenant isolation** | RLS policies on `tenant_id` column. | Server-side guard in every Server Action + API route (tenant_id injected from session). |
| **Audit logging** | Custom table + trigger. | Custom table + middleware + DB trigger (dual write). |
| **API surface** | Exposed to client (browser can call DB directly via supabase-js). | Narrow — only Server Actions and explicit API routes. |
| **Migration velocity** | Very fast — minimal backend code. | Moderate — every mutation is a Server Action. |
| **Compliance control** | Medium — direct DB access requires airtight RLS. | High — full control over every request path. |
| **Schema changes** | Supabase migrations (git-based with local CLI). | Prisma migrations (battle-tested, git-friendly). |

### Recommendation: NextAuth v5 + Prisma + PostgreSQL + S3 (R2)

**Rationale for customs documentation SaaS:**

1. **Compliance surface is narrower.** Customs docs contain sensitive trade data (cargo manifests, CUIT/CUIL, invoice values, certificates of origin). Direct DB exposure via PostgREST means every client-side `supabase.from('legajos').select('*')` is a potential leak if an RLS policy is wrong. With NextAuth + Server Actions, every mutation goes through audited server logic — no public API key to rotate, no browser-to-DB path.

2. **Audit trail is mandatory, not optional.** Argentine customs regulations (Ley 25.326, AFIP Resoluciones) require traceability. A dual-write audit log (DB trigger + application middleware) is easier to enforce when the app controls the data path.

3. **File security is critical.** Customs files (manifests, facturas comerciales, packing lists, certificates of origin, DUA/SIMI) are sensitive. Signed URLs with short TTLs (5 min), enforced through a single access-check Server Action before generating the URL, is simpler to audit than storage RLS policies.

4. **Multi-tenant workspace isolation must be bulletproof.** With a shared Postgres instance, a missing `WHERE workspace_id = $1` in one Prisma query leaks data silently. With Supabase RLS, a missing `USING (tenant_id = auth.jwt() ->> 'tenant_id')` leaks data silently too — but with Server Actions, the leak surface is smaller and easier to test.

5. **The Infrannova reference confirms this pattern in production.** The existing Infrannova SaaS (construction management, Argentine market, similar compliance needs) runs Next.js 16 + Drizzle + Neon + NextAuth v5 + R2. The AduanaDocs team can reuse patterns directly.

> **PONYTAIL:** If the team ships fast and wants zero backend code, Supabase + RLS is viable for an MVP — but migration to server-side auth for Phase 2 should be planned from day 1. For a regulated industry (customs), start with the server-side pattern; it's cheaper than retrofitting.

#### Decision Summary

```
Winner: NextAuth v5 + Prisma + PostgreSQL (Neon) + S3-compatible (R2)
Deploy: Vercel (frontend + API routes) | Neon (DB) | R2 (files)
Auth: NextAuth v5, JWT sessions, credentials provider + OAuth
```

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│  Next.js 16 App Router (RSC + Server Actions)        │
│  Tailwind 4 + shadcn/ui                              │
└──────────┬──────────────────────────────────────────┘
           │ HTTPS (HSTS, CSP, strict headers)
           ▼
┌─────────────────────────────────────────────────────┐
│  Vercel Edge Network                                 │
│  ┌─────────────────────────────────────────────────┐│
│  │  Next.js 16  (Edge + Serverless Functions)      ││
│  │  ┌────────────┐  ┌───────────────────────────┐  ││
│  │  │ Server     │  │ API Routes                 │  ││
│  │  │ Actions    │  │ /api/webhooks/*            │  ││
│  │  │ (mutations)│  │ /api/auth/*                │  ││
│  │  │ (queries)  │  │ /api/files/* (signed URLs) │  ││
│  │  └────────────┘  └───────────────────────────┘  ││
│  │                   ┌───────────────────────────┐  ││
│  │                   │ Middleware                 │  ││
│  │                   │ - Tenant resolution        │  ││
│  │                   │ - Session validation       │  ││
│  │                   │ - CSP headers              │  ││
│  │                   │ - Rate limiting            │  ││
│  │                   └───────────────────────────┘  ││
│  └─────────────────────────────────────────────────┘│
└──────────┬──────────────────────────────────────────┘
           │
     ┌─────┼───────────────────────────┐
     │     │                           │
     ▼     ▼                           ▼
┌──────────┴──────────┐  ┌──────────────────────┐
│  Neon PostgreSQL     │  │  R2 / S3-compatible  │
│  (serverless)        │  │  (encrypted at rest) │
│                      │  │                      │
│  - Multi-tenant      │  │  - Legajo documents  │
│  - Row-level audit   │  │  - Client files      │
│  - Functions/triggers│  │  - Templates         │
│  - Encrypted at rest │  │  - Signed URLs (5m)  │
│  - Point-in-time     │  │  - Lifecycle rules   │
│    recovery          │  │                      │
└──────────────────────┘  └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  External Services   │
│                      │
│  - Resend (email)    │
│  - Google Drive API  │
│    (optional import) │
│  - AFIP WS (future)  │
│  - Stripe (billing)  │
└──────────────────────┘
```

### Middleware Security Chain

Every request passes through this middleware pipeline (in order):

1. **Strict Transport Security** — `Strict-Transport-Security: max-age=31536000; includeSubDomains`
2. **Content Security Policy** — restrictive CSP (no eval, no inline scripts except nonces, frame-src 'none')
3. **Rate Limiting** — per-IP + per-user (token bucket via Upstash or Vercel KV)
4. **Session Validation** — NextAuth session hydration, JWT expiry check
5. **Tenant Resolution** — extract `workspace_id` from session JWT, set in request context
6. **Audit Context** — attach user_id, workspace_id, request_id to every mutation

---

## 3. Multi-Tenant Model

### Pattern: Shared Database, Row-Level Isolation via `workspace_id`

```
Each row in every data table carries a NOT NULL workspace_id FK.
All queries filter WHERE workspace_id = current_session.workspace_id.
```

### Entity Relationship

```
Workspace (tenant)
  ├── Users (via WorkspaceMembership — JOIN table with role)
  ├── Clients
  │     ├── Legajos (customs cases/files)
  │     │     ├── Documents
  │     │     ├── ChecklistItems
  │     │     └── Vencimientos (deadlines)
  │     └── ClientContacts
  ├── Templates (reusable checklist templates)
  ├── AuditLog (per-workspace immutable log)
  └── StorageObjects (file metadata, not the file itself)
```

### Membership & Role Model

| Role | Scope | Permissions |
|---|---|---|
| `workspace_owner` | Full workspace | Invite admins, manage billing, delete workspace, all read/write |
| `workspace_admin` | Full workspace | Manage users, all entities CRUD, export data |
| `despachante` | Assigned legajos only | CRUD legajos, upload docs, mark checklist, view vencimientos |
| `colaborador` | Assigned legajos only | Read legajos, add comments, upload docs |
| `cliente` | Own client record + linked legajos | View legajos (read-only), download docs, view vencimientos |

> **PONYTAIL:** For MVP, use a flat `role` enum on WorkspaceMembership. For Phase 3+, migrate to a RBAC permission table for fine-grained ACLs.

---

## 4. Database Schema Entities

### 4.1 Tenancy & Auth

```prisma
model Workspace {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  tier      String   @default("starter") // starter | pro | enterprise
  settings  Json?    // custom branding, etc.
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members        WorkspaceMembership[]
  clients        Client[]
  legajos        Legajo[]
  auditLogs      AuditLog[]
  storageObjects StorageObject[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  image     String?
  password  String?  // hashed, nullable for OAuth users
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  accounts     Account[]             // NextAuth adapter
  sessions     Session[]
  memberships  WorkspaceMembership[]
  createdBy    AccessLog[]           @relation("AuditActor")
}

/// NextAuth v5 adapter models (Account, Session, VerificationToken) omitted for brevity.
/// See: https://authjs.dev/reference/adapter/prisma

model WorkspaceMembership {
  id          String   @id @default(cuid())
  userId      String
  workspaceId String
  role        String   @default("colaborador") // workspace_owner | workspace_admin | despachante | colaborador | cliente
  invitedBy   String?  // userId who invited
  joinedAt    DateTime @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@index([workspaceId])
  @@index([userId])
}
```

> **PONYTAIL:** NextAuth v5 Adapter manages `accounts`, `sessions`, and `verification_tokens` tables automatically. The schema here shows only the custom business tables.

### 4.2 Business Entities

```prisma
model Client {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  taxId       String?  // CUIT/CUIL (Argentina)
  email       String?
  phone       String?
  address     String?
  notes       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace    Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  contacts     ClientContact[]
  legajos      Legajo[]

  @@index([workspaceId])
  @@index([workspaceId, taxId])
}

model ClientContact {
  id          String   @id @default(cuid())
  clientId    String
  name        String
  email       String?
  phone       String?
  role        String?  // e.g., "Titular", "Apoderado", "Contacto administrativo"
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())

  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId])
}

model Legajo {
  id          String   @id @default(cuid())
  workspaceId String
  clientId    String
  title       String
  description String?
  type        String   // importacion | exportacion | transito | deposito | otro
  status      String   @default("activo") // activo | en_proceso | pendiente_docs | finalizado | cancelado
  referencia  String?  // customer's internal reference number
  duaNumber   String?  // DUA / SIMI number (assigned later)
  assignedTo  String?  // userId of the despachante
  openedAt    DateTime @default(now())
  closedAt    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace    Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  client       Client           @relation(fields: [clientId], references: [id])
  documents    Document[]
  checklists   ChecklistItem[]
  vencimientos Vencimiento[]
  notes        LegajoNote[]

  @@index([workspaceId])
  @@index([workspaceId, clientId])
  @@index([workspaceId, status])
  @@index([workspaceId, duaNumber])
}

model Document {
  id            String   @id @default(cuid())
  legajoId      String
  uploadedBy    String   // userId
  category      String   // factura_comercial | packing_list | certificado_origen | manifiesto | DUA | SIMI | poder | otro
  displayName   String   // user-friendly filename
  storageKey    String   @unique // R2/s3 object key
  mimeType      String
  fileSize      Int      // bytes
  fileHash      String   // SHA-256 for integrity verification
  isEncrypted   Boolean  @default(true)
  isVerified    Boolean  @default(false) // virus scan passed
  version       Int      @default(1)
  parentVersion String?  // previous version's document id
  createdAt     DateTime @default(now())

  legajo      Legajo     @relation(fields: [legajoId], references: [id], onDelete: Cascade)
  uploader    User       @relation(fields: [uploadedBy], references: [id])

  @@index([legajoId])
  @@index([category])
  @@index([storageKey])
}

model ChecklistItem {
  id          String   @id @default(cuid())
  legajoId    String
  title       String
  description String?
  category    String?  // documento | pago | tramite | verificacion
  isRequired  Boolean  @default(true)
  isCompleted Boolean  @default(false)
  completedBy String?  // userId
  completedAt DateTime?
  dueDate     DateTime? // soft deadline
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  legajo Legajo @relation(fields: [legajoId], references: [id], onDelete: Cascade)
  completer User? @relation(fields: [completedBy], references: [id])

  @@index([legajoId])
}

model Vencimiento {
  id          String   @id @default(cuid())
  legajoId    String
  title       String
  description String?
  type        String   // vencimiento_dua | plazo_legal | fecha_pago | otro
  dueDate     DateTime
  reminderAt  DateTime? // send reminder at this time
  notifiedAt  DateTime[] // already sent notifications (Postgres array)
  isResolved  Boolean  @default(false)
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  legajo Legajo @relation(fields: [legajoId], references: [id], onDelete: Cascade)

  @@index([legajoId])
  @@index([dueDate])
  @@index([workspaceId]) // denormalized for cross-workspace queries
}

model LegajoNote {
  id        String   @id @default(cuid())
  legajoId  String
  authorId  String
  content   String
  isPinned  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  legajo Legajo @relation(fields: [legajoId], references: [id], onDelete: Cascade)
  author User   @relation(fields: [authorId], references: [id])

  @@index([legajoId])
}
```

### 4.3 Audit & Storage Models

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  workspaceId String
  actorId     String?  // userId who performed the action (NULL for system)
  action      String   // legajo.created | document.uploaded | user.invited | etc.
  entityType  String   // WorkspaceMembership | Legajo | Document | Vencimiento | etc.
  entityId    String   // the affected record's id
  metadata    Json?    // diff / change details / context
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([workspaceId, createdAt(sort: Desc)])
  @@index([workspaceId, action])
  @@index([actorId])
  @@index([entityType, entityId])
  @@index([createdAt(sort: Desc)])
}

model StorageObject {
  id          String   @id @default(cuid())
  workspaceId String
  storageKey  String   @unique // R2/S3 key
  originalName String
  mimeType    String
  fileSize    Int
  fileHash    String   // SHA-256
  checksumMd5 String?
  isEncrypted Boolean  @default(true)
  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?
  expiresAt   DateTime? // TTL for temp files
  createdAt   DateTime @default(now())

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
  @@index([storageKey])
  @@index([fileHash])
}
```

---

## 5. RLS & Security Architecture

### 5.1 Security Layers

```
Layer 5: Application (Server Actions / API Routes)
├── Session validation (NextAuth)
├── Workspace membership check
├── Role-based authorization
└── Input validation (Zod schemas)

Layer 4: Database (PostgreSQL)
├── NOT NULL workspace_id on every row
├── Foreign key constraints
├── Partial indexes on workspace_id
├── Row-level security policies (defense in depth)
├── pg_audit extension (optional, for SOC2)
└── Encrypted at rest (Neon provides)

Layer 3: File Storage (R2)
├── All objects private by default
├── Signed URLs with 5-minute TTL
├── Access verified by Server Action before URL generation
├── Server-side encryption (AES-256)
└── Virus scanning via async job

Layer 2: Network
├── HTTPS enforced (HSTS)
├── CSP with nonces
├── Rate limiting (100 req/s per IP, 30 req/s per user)
├── Request size limits (10MB upload via signed URL)
└── DDoS protection (Cloudflare or Vercel Firewall)

Layer 1: Application Security
├── Zod validation on every mutation
├── XSS prevention (React auto-escapes, CSP)
├── CSRF protection (Next.js built-in for Server Actions)
├── SQL injection (Prisma parameterized queries)
└── Dependency scanning (Dependabot / Snyk)
```

### 5.2 Authorization Flow (CRITICAL PATH)

```
User Request
  │
  ▼
NextAuth Middleware
  ├── Session NOT found → 401
  ▼
Workspace Resolution
  ├── Extract workspace_id from session JWT
  ├── Verify user is ACTIVE member of workspace
  └── Verify workspace.isActive == true
      ├── FAIL → 403
      ▼
Entity Authorization
  ├── SELECT/UPDATE/DELETE query
  ├── Prisma WHERE clause MUST include workspaceId
  └── (No workspaceId in query → explicit error, never default-all)
      │
      ▼
Role Check (for sensitive operations)
  ├── Create/delete workspace → workspace_owner only
  ├── Invite users → workspace_admin or owner
  ├── Close legajo → despachante or admin
  └── View portal → cliente (own data only)
```

### 5.3 Server Action Pattern (Mandatory)

```typescript
// src/lib/actions/legajos.ts  — every Server Action follows this pattern:

export async function createLegajo(data: CreateLegajoSchema) {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthenticated");

  // 2. Get workspace from session
  const workspaceId = session.user.activeWorkspaceId;
  if (!workspaceId) throw new Error("No active workspace");

  // 3. Verify membership is active
  const membership = await db.workspaceMembership.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });
  if (!membership || membership.role === "cliente")
    throw new Error("Insufficient permissions");  // clientes can't create legajos

  // 4. Validate input
  const parsed = createLegajoSchema.parse(data);  // Zod

  // 5. Check client belongs to workspace (tenant-scoped FK)
  const client = await db.client.findFirst({
    where: { id: parsed.clientId, workspaceId },
  });
  if (!client) throw new Error("Client not found in workspace");

  // 6. Execute
  const legajo = await db.legajo.create({
    data: {
      ...parsed,
      workspaceId,  // ← INJECTED from session, NOT from client
      openedAt: new Date(),
    },
  });

  // 7. Audit
  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: session.user.id,
      action: "legajo.created",
      entityType: "Legajo",
      entityId: legajo.id,
      metadata: { title: legajo.title, clientId: legajo.clientId },
    },
  });

  return legajo;
}
```

> **CRITICAL RULE:** `workspaceId` is **always** injected from the server-side session, never accepted from client input. A `data: { ...parsed, workspaceId }` pattern ensures the client cannot forge a cross-tenant write.

### 5.4 File Access Security

```typescript
// src/lib/files/signed-url.ts

export async function getDocumentDownloadUrl(documentId: string) {
  // 1. Auth + membership check
  const session = await auth();
  const workspaceId = getWorkspaceId(session);

  // 2. Find document with workspace-scoped query
  const document = await db.document.findFirst({
    where: {
      id: documentId,
      legajo: {
        workspaceId,
        // For "cliente" role, also check the legajo is assigned to them
        ...(session.user.role === "cliente" && {
          client: { contacts: { some: { email: session.user.email } } },
        }),
      },
    },
    include: { legajo: true },
  });

  if (!document) throw new Error("Document not found or access denied");

  // 3. Generate short-lived signed URL
  const signedUrl = await r2.getSignedUrl({
    key: document.storageKey,
    ttl: 300, // 5 minutes
  });

  // 4. Audit
  await db.auditLog.create({
    data: {
      workspaceId,
      actorId: session.user.id,
      action: "document.downloaded",
      entityType: "Document",
      entityId: document.id,
    },
  });

  // 5. Return URL (browser downloads directly from R2)
  return { url: signedUrl, filename: document.displayName };
}
```

### 5.5 RLS as Defense-in-Depth (PostgreSQL Level)

Even though the app layer enforces tenant isolation, enable RLS on every table as a last line of defense against:

- A buggy Prisma query that omits `workspaceId`
- Direct DB access from admin tools (Prisma Studio, pgAdmin)
- A compromised session that escalates privileges

```sql
-- Example RLS policy enforced at DB level (created via migration)
CREATE POLICY tenant_isolation ON legajos
  USING (workspace_id = current_setting('app.current_workspace_id')::text);

CREATE POLICY tenant_isolation ON documents
  USING (legajo_id IN (
    SELECT id FROM legajos
    WHERE workspace_id = current_setting('app.current_workspace_id')::text
  ));
```

The `app.current_workspace_id` is set by a database session variable at the start of each pooler connection (via Neon's pgBouncer mode or a custom middleware).

> **PONYTAIL:** RLS at DB level adds operational complexity (session variables, connection pooling). Skip in MVP, add in Phase 2 when you have a dedicated DB user per app instance.

---

## 6. Compliance Considerations

### 6.1 Argentina: Ley de Protección de Datos Personales (Ley 25.326)

| Requirement | Implementation |
|---|---|
| **Consent** for data collection | Terms acceptance at signup, per-workspace privacy policy |
| **Purpose limitation** | Data classified by purpose (comercial, fiscal, operativo). Never use client data for marketing without explicit opt-in. |
| **Data minimization** | Only collect fields listed in schema. No tracking pixels, no analytics with PII. |
| **Access & rectification** | "Portal Cliente" allows clients to view and request correction of their data |
| **Data retention** | Workspace owner can configure retention policy (default: 5 years post-closure, then anonymize) |
| **Security measures** | Encryption at rest (AES-256), encryption in transit (TLS 1.3), access logging |
| **Breach notification** | Audit log enables after-the-fact investigation. Automated alert on anomalous access patterns. |
| **Cross-border data transfer** | Neon can be deployed in US East or São Paulo (Argentina has no strict data residency requirement, but for sensitive customs data, São Paulo region minimizes latency) |

### 6.2 AFIP / Customs-Specific Compliance

| Aspect | Implementation |
|---|---|
| **Electronic documents** | All stored documents carry SHA-256 hash for integrity verification against originals |
| **DUA/SIMI tracking** | Reference numbers stored and indexed. Audit trail for every status change. |
| **Client verification** | CUIT/CUIL validated against AFIP public API (future integration) |
| **Fiscal retention** | Trade documents: minimum 10 years (CNV/AFIP requirement). System enforces retention holds. |
| **Access segregation** | Despachantes cannot see each other's legajos without explicit sharing |
| **Portal Cliente** | Clients have read-only access to their own legajos only — never cross-client visibility |

---

## 7. File Storage Strategy

### 7.1 Architecture

```
Storage: Cloudflare R2 (S3-compatible, no egress fees)
Region: Automatic (global)
Encryption: Server-side AES-256 (R2 default)
Lifecycle: Auto-delete files > 365 days after legajo closure (via lifecycle rules)

Path convention:
  {workspace_id}/{entity_type}/{entity_id}/{uuid}.{ext}

Example:
  ws_cl5g8k2a1000/legajos/leg_abc123/2a3f8c1e-9b4d-4f7a-8e1c-3d2b5f6a7e8c.pdf
```

### 7.2 Upload Flow

```
1. Client selects file
2. Server Action creates Document record (with pending status)
3. Server generates signed PUT URL (5 min TTL) for R2
4. Client uploads directly to R2 via signed URL (no server bottleneck)
5. Server Action confirms upload completed
6. Async job:
   a. ClamAV scan (Lambda / RunPod)
   b. Hash verification (compare SHA-256)
   c. Generate thumbnail (if PDF/image)
   d. Mark Document.isVerified = true
7. On failure: mark Document.isVerified = false + notify uploader
```

### 7.3 Allowed File Types (Whitelist)

```
application/pdf                              → .pdf
image/tiff                                   → .tif, .tiff
image/jpeg                                   → .jpg, .jpeg
image/png                                    → .png
application/vnd.openxmlformats-officedocument.* → .docx, .xlsx
application/zip                              → .zip (for batch uploads)
```

> **PONYTAIL:** No executable MIME types. No SVG (XSS vector). No macro-enabled Office docs. Virus scan required before marking `isVerified`.

---

## 8. Audit Log System

### 8.1 Design

```
Store: PostgreSQL (same DB as application data — no separate infra needed for MVP)
Structure: Append-only (no UPDATE, no DELETE on audit_log rows)
Retention: 10 years minimum (fiscal/regulatory requirement)
Indexed on: (workspace_id, created_at DESC) for workspace scoped queries
           (entity_type, entity_id) for entity history
           (actor_id) for user activity reports
```

### 8.2 What to Audit

| Event | Category | Data Captured |
|---|---|---|
| User login/logout | auth.session | IP, user agent, timestamp |
| Workspace membership change | auth.workspace | invitedUserId, role, invitedBy |
| Legajo created/updated/closed | legajo.* | Changeset diff (JSON) |
| Document uploaded/downloaded/ deleted | document.* | File name, size, hash, downloader ID |
| Checklist item added/completed | checklist.* | Item title, completer, timestamp |
| Vencimiento created/resolved | vencimiento.* | Title, due date, resolver |
| Client imported/updated | client.* | Changed fields |
| Portal access by cliente | portal.access | Client ID, legajo ID, IP |
| Failed permission check | security.denied | Requested action, target entity, role |
| API key operations | apikey.* | Key prefix, action, actor |
| Export/download batch | data.export | Record count, format, date range |

### 8.3 Dual-Write Implementation (MVP)

```typescript
// src/lib/audit.ts — helper used by every Server Action
export async function logAuditEvent(params: {
  workspaceId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  // Fire-and-forget: don't block the main operation on audit
  // but ensure ordering: audit write happens in a separate transaction
  // that can fail independently
  try {
    await db.auditLog.create({ data: params });
  } catch (error) {
    // Log error to monitoring but don't fail the user action
    console.error("Audit log write failed:", error);
    // TODO: send to dead-letter queue for retry
  }
}
```

> **PONYTAIL:** MVP uses application-level audit logging. Phase 3+ should add a PostgreSQL trigger-based backup (pg_audit extension or custom trigger) to capture direct DB writes.

---

## 9. MVP Phases

### Phase 0: Foundation (Week 1–2)

```
Goal: Authentication + workspace creation
Deliverable: A user can sign up, create a workspace, and invite another user

- Next.js 16 + Tailwind 4 setup
- NextAuth v5 (credentials provider, email/password via Resend)
- Prisma schema: User, Workspace, WorkspaceMembership, Account, Session
- Neon DB provisioning
- Vercel deployment
- Basic workspaces CRUD
- Invite flow by email
- Role enum (owner, admin, despachante)
- CSP + HSTS headers
```

### Phase 1: Core Customs Workflow (Week 3–4)

```
Goal: Manage clients, legajos, and documents
Deliverable: Full CRUD for the primary business entities

- Client CRUD (with CUIT validation)
- Legajo CRUD (import/export/transito types)
- Document upload with R2 signed URLs
- Document categorization & version tracking
- Server Action pattern with workspace injection (Section 5.3)
- Audit logging for all mutations
- Allowed MIME type enforcement
- Virus scan placeholder (async job stub)
```

### Phase 2: Operations & Compliance (Week 5–6)

```
Goal: Checklists, deadlines, client portal
Deliverable: Operational workflows + external access

- Checklist templates (reusable per legajo type)
- Checklist items per legajo (with completion tracking)
- Vencimiento system (deadlines with reminders)
- Portal Cliente (read-only view of own legajos)
- Signed URL download flow (5-minute TTL)
- Email notifications for vencimientos (Resend)
- Role: colaborador (restricted permissions)
- Role: cliente (read-only portal)
```

### Phase 3: Production Hardening (Week 7–8)

```
Goal: Security hardening, performance, audit readiness
Deliverable: Enterprise-ready

- PostgreSQL RLS policies (defense in depth)
- Rate limiting (Upstash or Vercel KV)
- File upload virus scanning (ClamAV via worker)
- File integrity verification (SHA-256 after upload)
- 2FA / TOTP (NextAuth v5 supports)
- AFIP CUIT validation API integration
- Data export (JSON/CSV per workspace)
- Backup & recovery plan
- Penetration testing walkthrough
- SOC2 / ISO 27001 readiness documentation
- Admin dashboard (workspace management)
- Billing integration (Stripe)
```

### Phase 4: Advanced (Future)

```
- AFIP/SICNEA/DISA integration (direct electronic submission)
- Batch document generation (template → PDF)
- OCR for scanned customs documents
- Advanced RBAC (custom permission sets)
- Audit log immutable storage (write-once, append-only table or external log service)
- S3 Object Lock / WORM for immutable records
- Multi-region deployment
- White-label / custom branding per workspace
```

---

## Key Technical Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| **Auth** | NextAuth v5 (JWT sessions) | Full control over session shape; workspace_id in JWT |
| **ORM** | Prisma | Type-safe, great migrations, mature. Drizzle is faster but Prisma's DX wins for compliance-heavy schemas |
| **Database** | Neon (serverless Postgres) | Branching for staging, point-in-time recovery, encrypted at rest |
| **File storage** | Cloudflare R2 | No egress fees, global edge, S3-compatible, AES-256 default |
| **Multi-tenant strategy** | Shared table + workspace_id | Simplest operational model; row-level isolation via app code + DB RLS |
| **Audit** | Application-level + future DB triggers | MVP: app-based. Phase 3+: immutable append-only |
| **File upload** | Direct-to-S3 via signed URLs | No server bottleneck, async virus scan |
| **Validation** | Zod (server + client) | Schema validation at every trust boundary |
| **Email** | Resend | Transactional email for invites, notifications, reminders |
| **Role model** | Flat role enum, expand to RBAC later | YAGNI for MVP; explicit upgrade path |

---

## Architecture Diagram (ASCII)

```
    ┌──────────────┐      ┌───────────────┐      ┌──────────────┐
    │   Next.js 16  │      │  Cloudflare    │      │    Neon       │
    │   (Vercel)    │◄────►│  R2 (files)    │      │  (Postgres)   │
    │              │      │               │      │              │
    │ Server Actions│      │  AES-256 at   │      │  Encrypted   │
    │ + API Routes  │      │  rest         │      │  at rest     │
    │ + Middleware  │      │  Signed URLs  │      │  PITR backup │
    └──────┬───────┘      └───────────────┘      └──────┬───────┘
           │                                            │
           │  ┌─────────────────────────────────────┐   │
           ├──┤  Resend (email)                     │   │
           │  │  - Invites, notifications, reminders│   │
           │  └─────────────────────────────────────┘   │
           │                                            │
    ┌──────┴────────────────────────────────────────────┴───────┐
    │                   Multi-Tenant Security Boundary           │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │  Workspace 1          Workspace 2        Workspace 3  │  │
    │  │  ┌──────────┐        ┌──────────┐       ┌──────────┐  │  │
    │  │  │ Users    │        │ Users    │       │ Users    │  │  │
    │  │  │ Clients  │        │ Clients  │       │ Clients  │  │  │
    │  │  │ Legajos  │        │ Legajos  │       │ Legajos  │  │  │
    │  │  │ Docs     │        │ Docs     │       │ Docs     │  │  │
    │  │  │ Audits   │        │ Audits   │       │ Audits   │  │  │
    │  │  └──────────┘        └──────────┘       └──────────┘  │  │
    │  └──────────────────────────────────────────────────────┘  │
    │    Isolation: workspace_id FK on every row                 │
    └───────────────────────────────────────────────────────────┘
```
