import type {
  Client,
  ExportRow,
  Operation,
  OperationDoc,
  OperationKind,
  OperationStatus,
} from "./types";

export const DOC_TEMPLATES: Record<OperationKind, string[]> = {
  importacion: [
    "Factura comercial",
    "Packing list",
    "BL/AWB/CRT",
    "SEDI",
    "Certificado de origen",
    "Permiso VUCE si aplica",
    "Comprobante VEP/pago",
  ],
  exportacion: [
    "Factura E",
    "Packing list",
    "EC18 / permiso de embarque",
    "Certificado sanitario/origen si aplica",
    "Documento de transporte",
    "Ingreso zona primaria",
  ],
  transito: [
    "Documento de transporte",
    "MANI SIM",
    "MIC/DTA o ruta ISTA",
    "Seguro",
    "Carta de instrucciones",
  ],
  temporal: [
    "Factura proforma/comercial",
    "Packing list",
    "Garantía / caución",
    "Destinación temporal",
    "Vencimiento de reexportación",
    "Permiso sectorial si aplica",
  ],
};

export const KIND_LABELS: Record<OperationKind, string> = {
  importacion: "Importación",
  exportacion: "Exportación",
  transito: "Tránsito",
  temporal: "Temporal",
};

const RISK_KEYWORD = /SEDI|MANI|VUCE|Garant[ií]a|Certificado|Seguro/i;

/** Doc names required for a given operation kind. */
export function checklistFor(kind: OperationKind): string[] {
  return DOC_TEMPLATES[kind] ?? DOC_TEMPLATES.importacion;
}

/** Builds the full OperationDoc row set for a freshly created operation. */
export function buildOperationDocs(operationId: string, kind: OperationKind): OperationDoc[] {
  return checklistFor(kind).map((name, index) => ({
    id: `${operationId}-doc-${index}`,
    operationId,
    name,
    required: true,
    received: false,
    receivedAt: null,
  }));
}

export function missingDocs(docs: OperationDoc[]): OperationDoc[] {
  return docs.filter((doc) => !doc.received);
}

export function completionPct(docs: OperationDoc[]): number {
  if (docs.length === 0) return 100;
  const done = docs.length - missingDocs(docs).length;
  return Math.round((done / docs.length) * 100);
}

/** Whole days until `dueDate` (ISO yyyy-mm-dd), counted at end of that day. Negative = overdue. */
export function daysUntil(dueDate: string, now: Date = new Date()): number {
  const due = new Date(`${dueDate}T23:59:59`);
  return Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
}

export function riskScore(docs: OperationDoc[], dueDate: string, now: Date = new Date()): number {
  const missing = missingDocs(docs);
  const days = daysUntil(dueDate, now);
  let score = missing.length * 18;
  if (days < 0) score += 35;
  else if (days <= 2) score += 18;
  if (missing.some((doc) => RISK_KEYWORD.test(doc.name))) score += 14;
  return Math.min(100, score);
}

export function operationStatus(docs: OperationDoc[], dueDate: string, now: Date = new Date()): OperationStatus {
  return riskScore(docs, dueDate, now) >= 45 || missingDocs(docs).length >= 2 ? "risk" : "ready";
}

export function formatDueLabel(dueDate: string, now: Date = new Date()): string {
  const d = daysUntil(dueDate, now);
  if (d < 0) return `vencido hace ${Math.abs(d)} día(s)`;
  if (d === 0) return "vence hoy";
  return `vence en ${d} día(s)`;
}

export type DeadlineWindow = 7 | 14 | 30 | "all";

export function withinDeadlineWindow(dueDate: string, window: DeadlineWindow, now: Date = new Date()): boolean {
  if (window === "all") return true;
  return daysUntil(dueDate, now) <= window;
}

export function buildExportRows(
  operations: Operation[],
  docsByOperation: Record<string, OperationDoc[]>,
  clientsById: Record<string, Client>,
  now: Date = new Date(),
): ExportRow[] {
  return operations.map((op) => {
    const docs = docsByOperation[op.id] ?? [];
    return {
      legajo: op.code,
      cliente: clientsById[op.clientId]?.name ?? "Sin cliente",
      tipo: KIND_LABELS[op.kind] ?? op.kind,
      ruta: op.lane,
      vencimiento: op.dueDate,
      avance: `${completionPct(docs)}%`,
      riesgo: riskScore(docs, op.dueDate, now),
      faltantes: missingDocs(docs)
        .map((d) => d.name)
        .join(" | "),
    };
  });
}

export function toCsv<T extends object>(rows: T[]): string {
  if (rows.length === 0) return "";
  const first = rows[0];
  if (!first) return "";
  const headers = Object.keys(first) as (keyof T)[];
  const lines = rows.map((row) =>
    headers.map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "cliente";
}

export interface DocumentMatrixRow {
  operationCode: string;
  clientName: string;
  kindLabel: string;
  docName: string;
  status: "Falta" | "Recibido";
}

export function buildDocumentMatrix(
  operations: Operation[],
  docsByOperation: Record<string, OperationDoc[]>,
  clientsById: Record<string, Client>,
): DocumentMatrixRow[] {
  const rows: DocumentMatrixRow[] = [];
  for (const op of operations) {
    const docs = docsByOperation[op.id] ?? [];
    for (const doc of docs) {
      rows.push({
        operationCode: op.code,
        clientName: clientsById[op.clientId]?.name ?? "Sin cliente",
        kindLabel: KIND_LABELS[op.kind] ?? op.kind,
        docName: doc.name,
        status: doc.received ? "Recibido" : "Falta",
      });
    }
  }
  return rows;
}
