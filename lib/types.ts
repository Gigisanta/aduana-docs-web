export type Role = "owner" | "admin" | "operator" | "client_viewer";

export type PlanId = "starter" | "operacion" | "midmarket" | "enterprise";

export type OperationKind = "importacion" | "exportacion" | "transito" | "temporal";

export type DocumentRequestStatus = "pending" | "received" | "observed";

export interface Workspace {
  id: string;
  name: string;
  plan: PlanId;
  createdAt: string;
}

export interface Profile {
  id: string;
  workspaceId: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  notes: string;
}

export interface Operation {
  id: string;
  workspaceId: string;
  clientId: string;
  code: string;
  kind: OperationKind;
  lane: string;
  dueDate: string;
  notes: string;
  createdAt: string;
}

export interface OperationDoc {
  id: string;
  operationId: string;
  name: string;
  required: boolean;
  received: boolean;
  receivedAt: string | null;
}

export interface DocumentRequest {
  id: string;
  operationId: string;
  docName: string;
  status: DocumentRequestStatus;
  requestedAt: string;
  note: string;
}

export interface DocumentFile {
  id: string;
  operationId: string;
  docName: string;
  fileName: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface PortalShare {
  id: string;
  operationId: string;
  token: string;
  createdAt: string;
  revoked: boolean;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorLabel: string;
  action: string;
  entityType: "operation" | "client" | "workspace" | "document";
  entityId: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean>;
}

export type OperationStatus = "ready" | "risk";

export interface ExportRow {
  legajo: string;
  cliente: string;
  tipo: string;
  ruta: string;
  vencimiento: string;
  avance: string;
  riesgo: number;
  faltantes: string;
}
