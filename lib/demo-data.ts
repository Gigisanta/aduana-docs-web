import { buildOperationDocs, slugify } from "./domain";
import type { AuditEvent, Client, Operation, OperationDoc, PlanId, Workspace } from "./types";

export interface DemoState {
  workspace: Workspace;
  clients: Client[];
  operations: Operation[];
  operationDocs: Record<string, OperationDoc[]>;
  auditEvents: AuditEvent[];
  roi: { hoursPerWeek: number; costPerHour: number };
  readiness: Record<number, boolean>;
  session: { workspaceName: string; enteredAt: string } | null;
}

export const DEMO_STORAGE_KEY = "aduanadocs.demo.v1";
export const DEMO_WORKSPACE_ID = "demo-workspace";

interface SeedOperationDef {
  code: string;
  clientName: string;
  kind: Operation["kind"];
  lane: string;
  dueDate: string;
  notes: string;
  receivedDocs: string[];
}

const SEED_OPERATIONS: SeedOperationDef[] = [
  {
    code: "IMP-2026-0146",
    clientName: "Metalúrgica Sur",
    kind: "importacion",
    lane: "Autopartes · China → Buenos Aires",
    dueDate: "2026-07-09",
    notes: "Revisar certificado de origen antes de oficializar.",
    receivedDocs: ["Factura comercial", "Packing list", "BL/AWB/CRT", "SEDI", "Comprobante VEP/pago"],
  },
  {
    code: "EXP-2026-0092",
    clientName: "Bodega Alto Valle",
    kind: "exportacion",
    lane: "Vino · Argentina → Brasil",
    dueDate: "2026-07-06",
    notes: "Cliente pide visibilidad del certificado sanitario.",
    receivedDocs: ["Factura E", "Packing list", "Documento de transporte"],
  },
  {
    code: "TRA-2026-0031",
    clientName: "Andes Cargo",
    kind: "transito",
    lane: "Chile → Paraguay vía Argentina",
    dueDate: "2026-07-02",
    notes: "Validar ruta y seguro antes de liberar.",
    receivedDocs: ["Documento de transporte", "MANI SIM", "Carta de instrucciones"],
  },
];

export function createSeedState(): DemoState {
  const workspace: Workspace = {
    id: DEMO_WORKSPACE_ID,
    name: "Estudio Demo",
    plan: "starter",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const clientNames = [...new Set(SEED_OPERATIONS.map((op) => op.clientName))];
  const clients: Client[] = clientNames.map((name) => ({
    id: slugify(name),
    workspaceId: workspace.id,
    name,
    contact: "",
    email: "",
    phone: "",
    notes: "",
  }));
  const clientIdByName = new Map(clients.map((c) => [c.name, c.id]));

  const operations: Operation[] = [];
  const operationDocs: Record<string, OperationDoc[]> = {};

  SEED_OPERATIONS.forEach((def) => {
    const operation: Operation = {
      id: def.code,
      workspaceId: workspace.id,
      clientId: clientIdByName.get(def.clientName) ?? slugify(def.clientName),
      code: def.code,
      kind: def.kind,
      lane: def.lane,
      dueDate: def.dueDate,
      notes: def.notes,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    operations.push(operation);
    const docs = buildOperationDocs(operation.id, operation.kind);
    for (const doc of docs) {
      if (def.receivedDocs.includes(doc.name)) {
        doc.received = true;
        doc.receivedAt = operation.createdAt;
      }
    }
    operationDocs[operation.id] = docs;
  });

  return {
    workspace,
    clients,
    operations,
    operationDocs,
    auditEvents: [],
    roi: { hoursPerWeek: 8, costPerHour: 18 },
    readiness: {},
    session: null,
  };
}

export function loadDemoState(): DemoState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    if (!parsed || !Array.isArray(parsed.operations) || !parsed.workspace) return null;
    return { ...createSeedState(), ...parsed };
  } catch {
    return null;
  }
}

export function saveDemoState(state: DemoState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}

export const PLAN_OPTIONS: { id: PlanId; name: string; desc: string }[] = [
  { id: "starter", name: "Starter", desc: "USD 200–500/mes. 1 estudio chico, portal y checklists." },
  { id: "operacion", name: "Operación", desc: "Fee por legajo/operación, alineado con volumen real." },
  { id: "midmarket", name: "Mid-market", desc: "USD 2k–5k/mes. Multi-sucursal, roles, auditoría y soporte." },
  { id: "enterprise", name: "Enterprise", desc: "Integraciones/OCR/API sólo con contrato, no en el MVP." },
];

export const READINESS_ITEMS = [
  "Backend con autenticación real (NextAuth v5 + sesiones server-side, no localStorage)",
  "Almacenamiento privado de documentos (R2/S3 + signed URLs de 5 minutos)",
  "Registro de auditoría por acción/usuario (audit_events)",
  "Backups automáticos y plan de recuperación",
  "Roles y permisos por workspace/cliente (owner/admin/operator/client_viewer)",
  "Revisión legal/compliance del manejo documental",
];
