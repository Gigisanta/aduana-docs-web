"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { DemoStoreProvider, useDemoStore } from "@/lib/demo-store-context";
import { PLAN_OPTIONS, READINESS_ITEMS } from "@/lib/demo-data";
import {
  buildDocumentMatrix,
  buildExportRows,
  completionPct,
  daysUntil,
  formatDueLabel,
  KIND_LABELS,
  missingDocs,
  operationStatus,
  riskScore,
  toCsv,
  type DeadlineWindow,
} from "@/lib/domain";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Client, Operation, OperationKind, PlanId } from "@/lib/types";

type RouteId = "panel" | "legajos" | "clientes" | "vencimientos" | "documentos" | "portal" | "config";

const ROUTES: { id: RouteId; label: string }[] = [
  { id: "panel", label: "Panel" },
  { id: "legajos", label: "Legajos" },
  { id: "clientes", label: "Clientes" },
  { id: "vencimientos", label: "Vencimientos" },
  { id: "documentos", label: "Documentos" },
  { id: "portal", label: "Portal cliente" },
  { id: "config", label: "Configuración" },
];

function routeFromHash(): RouteId {
  if (typeof window === "undefined") return "panel";
  const raw = window.location.hash.replace("#app/", "").replace("#app", "");
  return ROUTES.some((r) => r.id === raw) ? (raw as RouteId) : "panel";
}

function todayPlus(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function downloadText(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function clientMap(clients: Client[]): Record<string, Client> {
  return Object.fromEntries(clients.map((client) => [client.id, client]));
}

function AppShell() {
  const store = useDemoStore();
  const { state } = store;
  const [route, setRoute] = useState<RouteId>(routeFromHash);
  const [status, setStatus] = useState("Sistema listo para demo comercial.");

  const riskOps = state.operations.filter((op) => operationStatus(state.operationDocs[op.id] ?? [], op.dueDate) === "risk");
  const missingCount = state.operations.reduce((acc, op) => acc + missingDocs(state.operationDocs[op.id] ?? []).length, 0);
  const savedHours = Math.round(state.roi.hoursPerWeek * 4 * 0.45);
  const savedUsd = Math.round(savedHours * state.roi.costPerHour);

  useEffect(() => {
    const sync = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  if (!state.session) {
    return <Onboarding startSession={store.startSession} />;
  }

  const navigate = (nextRoute: RouteId) => {
    window.history.pushState(null, "", `#app/${nextRoute}`);
    setRoute(nextRoute);
  };

  return (
    <div id="app" className="app-root">
      <header className="topbar">
        <div>
          <a className="brand" href="#home" aria-label="Volver al sitio comercial">
            <span>AD</span>
            <strong>AduanaDocs</strong>
          </a>
          <p>{isSupabaseConfigured() ? "Backend Supabase configurado" : "Demo local · backend Supabase listo por env"}</p>
        </div>
        <div className="topbar-actions">
          <span className="pill ok">{state.operations.length} legajos</span>
          <span className="pill danger">{riskOps.length} en riesgo</span>
          <button className="ghost" type="button" onClick={store.logout}>Cerrar sesión</button>
          <a className="ghost" href="#home">Ver sitio</a>
        </div>
      </header>

      <div className="workspace-shell">
        <aside className="sidebar" aria-label="Módulos de AduanaDocs">
          <div className="workspace-name">
            <small>Workspace</small>
            <strong>{state.workspace.name}</strong>
          </div>
          {ROUTES.map((item) => (
            <button
              key={item.id}
              className={route === item.id ? "active" : ""}
              type="button"
              onClick={() => navigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </aside>
        <main className="workspace-main">
          {route === "panel" && <Panel navigate={navigate} riskOps={riskOps} missingCount={missingCount} savedHours={savedHours} />}
          {route === "legajos" && <Legajos setStatus={setStatus} />}
          {route === "clientes" && <Clientes setStatus={setStatus} />}
          {route === "vencimientos" && <Vencimientos />}
          {route === "documentos" && <Documentos setStatus={setStatus} />}
          {route === "portal" && <Portal setStatus={setStatus} />}
          {route === "config" && <Config setStatus={setStatus} savedUsd={savedUsd} />}
          <output className="status" aria-live="polite">{status}</output>
        </main>
      </div>
    </div>
  );
}

function Onboarding({ startSession }: { startSession: (workspaceName: string) => void }) {
  const [name, setName] = useState("Estudio Demo Aduanero");
  return (
    <main className="onboarding">
      <section className="onboard-card">
        <div className="eyebrow">Sistema real · demo sin backend</div>
        <h1>AduanaDocs</h1>
        <p>
          App SaaS para gestionar legajos, clientes, vencimientos, documentos, portal cliente y auditoría comercial.
          El demo corre local; producción activa Supabase Auth, Postgres, Storage y RLS.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); startSession(name); }}>
          <label htmlFor="workspace">Nombre del estudio / workspace</label>
          <input id="workspace" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="primary" type="submit">Entrar a la app</button>
        </form>
        <div className="proof-grid">
          <span>Multi-módulo</span><span>Supabase-ready</span><span>RLS + auditoría</span><span>Demo vendible</span>
        </div>
      </section>
    </main>
  );
}

function Panel({ navigate, riskOps, missingCount, savedHours }: {
  navigate: (route: RouteId) => void;
  riskOps: Operation[];
  missingCount: number;
  savedHours: number;
}) {
  const { state } = useDemoStore();
  const clientsById = clientMap(state.clients);
  const nextDeadlines = [...state.operations].sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)).slice(0, 5);
  return (
    <section>
      <div className="section-head"><div><span className="eyebrow">Panel</span><h2>Operación aduanera en vivo</h2></div><p>Riesgo, faltantes, vencimientos y acciones rápidas del workspace.</p></div>
      <div className="metrics">
        <Metric label="Legajos activos" value={state.operations.length} />
        <Metric label="En riesgo" value={riskOps.length} tone="danger" />
        <Metric label="Docs faltantes" value={missingCount} tone="warn" />
        <Metric label="Ahorro estimado" value={`${savedHours}h/mes`} tone="ok" />
      </div>
      <div className="grid two">
        <article className="card"><h3>Cola de riesgo</h3>{riskOps.length ? riskOps.map((op) => <OpMini key={op.id} op={op} client={clientsById[op.clientId]} />) : <p className="muted">Sin legajos críticos.</p>}</article>
        <article className="card"><h3>Próximos vencimientos</h3>{nextDeadlines.map((op) => <OpMini key={op.id} op={op} client={clientsById[op.clientId]} />)}</article>
      </div>
      <div className="actions"><button className="primary" onClick={() => navigate("legajos")}>+ Nuevo legajo</button><button onClick={() => navigate("clientes")}>Ver clientes</button><button onClick={() => navigate("documentos")}>Matriz documental</button><button onClick={() => navigate("portal")}>Portal cliente</button></div>
    </section>
  );
}

function Legajos({ setStatus }: { setStatus: (message: string) => void }) {
  const { state, createOperation, toggleOperationDoc, deleteOperation } = useDemoStore();
  const [selectedId, setSelectedId] = useState(state.operations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "risk" | "ready">("all");
  const [form, setForm] = useState({ code: "", kind: "importacion" as OperationKind, clientName: "", dueDate: todayPlus(7), lane: "", notes: "" });
  const clientsById = clientMap(state.clients);
  const selected = state.operations.find((op) => op.id === selectedId) ?? state.operations[0];
  const filtered = state.operations.filter((op) => {
    const docs = state.operationDocs[op.id] ?? [];
    const hay = `${op.code} ${clientsById[op.clientId]?.name ?? ""} ${op.lane} ${docs.map((d) => d.name).join(" ")}`.toLowerCase();
    return (!query || hay.includes(query.toLowerCase())) && (filter === "all" || operationStatus(docs, op.dueDate) === filter);
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = createOperation(form);
    if (!result.ok) { setStatus(result.error); return; }
    setSelectedId(form.code.trim().toUpperCase());
    setStatus(`Legajo ${form.code.trim().toUpperCase()} creado con checklist automático.`);
    setForm({ code: "", kind: "importacion", clientName: "", dueDate: todayPlus(7), lane: "", notes: "" });
  };

  const exportRows = buildExportRows(state.operations, state.operationDocs, clientsById);
  return (
    <section className="module-grid">
      <aside className="card">
        <h2>Nuevo legajo</h2><p className="muted">Alta operativa con checklist por régimen.</p>
        <form className="form-grid" onSubmit={submit}>
          <label>Código<input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="IMP-2026-0201" /></label>
          <label>Tipo<select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as OperationKind })}>{Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Cliente<input required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Metalúrgica Sur" /></label>
          <label>Vencimiento / ETA<input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
          <label className="span-2">Mercadería / ruta<input value={form.lane} onChange={(e) => setForm({ ...form, lane: e.target.value })} placeholder="Autopartes · China → Buenos Aires" /></label>
          <label className="span-2">Notas<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <button className="primary span-2" type="submit">Crear legajo</button>
        </form>
      </aside>
      <section className="card wide">
        <div className="toolbar"><input type="search" placeholder="Buscar operación, cliente o documento" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">Todos</option><option value="risk">En riesgo</option><option value="ready">Listos</option></select></div>
        <div className="op-list">{filtered.map((op) => <button key={op.id} className={op.id === selected?.id ? "op active" : "op"} onClick={() => setSelectedId(op.id)}><span><strong>{op.code} · {clientsById[op.clientId]?.name}</strong><small>{op.lane} · {formatDueLabel(op.dueDate)}</small></span><Badge op={op} docs={state.operationDocs[op.id] ?? []} /></button>)}</div>
        {selected && <article className="detail"><h3>{selected.code} · {clientsById[selected.clientId]?.name}</h3><p>{selected.notes || "Sin notas internas."}</p><div className="progress"><span style={{ width: `${completionPct(state.operationDocs[selected.id] ?? [])}%` }} /></div><p>{completionPct(state.operationDocs[selected.id] ?? [])}% completo · riesgo {riskScore(state.operationDocs[selected.id] ?? [], selected.dueDate)}/100</p><div className="checklist">{(state.operationDocs[selected.id] ?? []).map((doc) => <label key={doc.id} className="check-row"><input type="checkbox" checked={doc.received} onChange={(e) => toggleOperationDoc(selected.id, doc.name, e.target.checked)} /><span>{doc.name}</span><em>{doc.received ? "OK" : "Falta"}</em></label>)}</div><div className="actions"><button className="danger" onClick={() => { deleteOperation(selected.id); setStatus(`Legajo ${selected.code} eliminado.`); }}>Eliminar legajo</button><button onClick={() => { downloadText("legajos.json", JSON.stringify(exportRows, null, 2), "application/json"); setStatus("JSON exportado."); }}>Exportar JSON</button><button onClick={() => { downloadText("legajos.csv", toCsv(exportRows), "text/csv"); setStatus("CSV exportado."); }}>Exportar CSV</button></div></article>}
      </section>
    </section>
  );
}

function Clientes({ setStatus }: { setStatus: (message: string) => void }) {
  const { state, upsertClient, deleteClient } = useDemoStore();
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "", notes: "" });
  const edit = (client: Client) => { setEditing(client); setForm({ name: client.name, contact: client.contact, email: client.email, phone: client.phone, notes: client.notes }); };
  const submit = (event: FormEvent) => { event.preventDefault(); const result = upsertClient(editing?.id ?? null, form); if (!result.ok) { setStatus(result.error); return; } setStatus(editing ? "Cliente actualizado." : "Cliente creado."); setEditing(null); setForm({ name: "", contact: "", email: "", phone: "", notes: "" }); };
  return <section className="module-grid"><aside className="card"><h2>{editing ? "Editar cliente" : "Nuevo cliente"}</h2><form className="form-grid" onSubmit={submit}><label>Razón social<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Contacto<input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></label><label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Teléfono<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label className="span-2">Notas<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label><button className="primary span-2" type="submit">Guardar cliente</button></form></aside><section className="card wide"><h2>Registro de clientes</h2><div className="table">{state.clients.map((client) => { const ops = state.operations.filter((op) => op.clientId === client.id); return <article key={client.id} className="row-card"><strong>{client.name}</strong><span>{client.contact || "Sin contacto"} · {client.email || "sin email"}</span><span>{ops.length} legajo(s)</span><div><button onClick={() => edit(client)}>Editar</button><button className="danger" onClick={() => { deleteClient(client.id); setStatus("Cliente eliminado del demo."); }}>Eliminar</button></div></article>; })}</div></section></section>;
}

function Vencimientos() {
  const { state } = useDemoStore();
  const [windowDays, setWindowDays] = useState<DeadlineWindow>(14);
  const clientsById = clientMap(state.clients);
  const rows = [...state.operations].filter((op) => windowDays === "all" || daysUntil(op.dueDate) <= windowDays).sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
  return <section><div className="section-head"><div><span className="eyebrow">Vencimientos</span><h2>Agenda de ETAs y vencimientos</h2></div><select value={windowDays} onChange={(e) => setWindowDays(e.target.value === "all" ? "all" : Number(e.target.value) as DeadlineWindow)}><option value="7">7 días</option><option value="14">14 días</option><option value="30">30 días</option><option value="all">Todos</option></select></div><div className="card table">{rows.map((op) => <article className="row-card" key={op.id}><strong>{op.code}</strong><span>{clientsById[op.clientId]?.name} · {op.lane}</span><span>{formatDueLabel(op.dueDate)}</span><Badge op={op} docs={state.operationDocs[op.id] ?? []} /></article>)}</div></section>;
}

function Documentos({ setStatus }: { setStatus: (message: string) => void }) {
  const { state } = useDemoStore();
  const [clientId, setClientId] = useState("all");
  const [status, setDocStatus] = useState("all");
  const clientsById = clientMap(state.clients);
  const matrix = buildDocumentMatrix(state.operations, state.operationDocs, clientsById).filter((row) => (clientId === "all" || row.clientName === clientsById[clientId]?.name) && (status === "all" || row.status === status));
  return <section><div className="section-head"><div><span className="eyebrow">Documentos</span><h2>Matriz documental</h2></div><div className="toolbar"><select value={clientId} onChange={(e) => setClientId(e.target.value)}><option value="all">Todos los clientes</option>{state.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={status} onChange={(e) => setDocStatus(e.target.value)}><option value="all">Todos</option><option value="Falta">Faltantes</option><option value="Recibido">Recibidos</option></select><button onClick={() => { downloadText("documentos.csv", toCsv(matrix), "text/csv"); setStatus("Matriz documental exportada."); }}>Exportar CSV</button></div></div><div className="card matrix">{matrix.map((row, i) => <div key={`${row.operationCode}-${row.docName}-${i}`} className="matrix-row"><strong>{row.operationCode}</strong><span>{row.clientName}</span><span>{row.docName}</span><em className={row.status === "Falta" ? "bad" : "good"}>{row.status}</em></div>)}</div></section>;
}

function Portal({ setStatus }: { setStatus: (message: string) => void }) {
  const { state } = useDemoStore();
  const [operationId, setOperationId] = useState(state.operations[0]?.id ?? "");
  const clientsById = clientMap(state.clients);
  const op = state.operations.find((item) => item.id === operationId) ?? state.operations[0];
  if (!op) return <p>No hay legajos.</p>;
  const docs = state.operationDocs[op.id] ?? [];
  const origin = typeof window === "undefined" ? "https://aduana-docs-web.vercel.app" : window.location.origin;
  const share = `Hola, te compartimos el estado del legajo ${op.code}. Faltan: ${missingDocs(docs).map((d) => d.name).join(", ") || "nada"}. Portal demo: ${origin}/portal/demo/${op.id}`;
  return <section><div className="section-head"><div><span className="eyebrow">Portal cliente</span><h2>Vista compartible simulada</h2></div><select value={operationId} onChange={(e) => setOperationId(e.target.value)}>{state.operations.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></div><article className="portal-card"><h3>{op.code} · {clientsById[op.clientId]?.name}</h3><p>{op.lane} · {formatDueLabel(op.dueDate)}</p><div className="checklist">{docs.map((doc) => <div key={doc.id} className="check-row"><span>{doc.name}</span><em>{doc.received ? "Recibido" : "Solicitado"}</em></div>)}</div><button className="primary" onClick={async () => { await navigator.clipboard?.writeText(share); setStatus("Mensaje de portal copiado."); }}>Copiar mensaje para cliente</button></article></section>;
}

function Config({ setStatus, savedUsd }: { setStatus: (message: string) => void; savedUsd: number }) {
  const { state, setWorkspaceName, setPlan, toggleReadiness, resetDemo } = useDemoStore();
  const [workspaceName, setLocalWorkspaceName] = useState(state.workspace.name);
  return <section className="module-grid"><aside className="card"><h2>Configuración</h2><label>Workspace<input value={workspaceName} onChange={(e) => setLocalWorkspaceName(e.target.value)} /></label><button className="primary" onClick={() => { setWorkspaceName(workspaceName); setStatus("Workspace actualizado."); }}>Guardar workspace</button><h3>Plan comercial</h3>{PLAN_OPTIONS.map((plan) => <button key={plan.id} className={state.workspace.plan === plan.id ? "plan active" : "plan"} onClick={() => { setPlan(plan.id as PlanId); setStatus(`Plan ${plan.name} seleccionado.`); }}><strong>{plan.name}</strong><span>{plan.desc}</span></button>)}</aside><section className="card wide"><h2>Checklist para producción paga</h2><p className="muted">El demo ya vende el flujo. Para operar documentos reales hay que completar estos gates.</p>{READINESS_ITEMS.map((item, i) => <label key={item} className="readiness"><input type="checkbox" checked={Boolean(state.readiness[i])} onChange={() => toggleReadiness(i)} />{item}</label>)}<div className="notice"><strong>ROI de referencia:</strong> ahorro estimado USD {savedUsd}/mes. Usar para pilotos concierge, no como promesa contractual.</div><button className="danger" onClick={() => { resetDemo(); setStatus("Datos demo reiniciados."); }}>Reiniciar demo</button></section></section>;
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: "danger" | "warn" | "ok" }) {
  return <div className={`metric ${tone ?? ""}`}><strong>{value}</strong><span>{label}</span></div>;
}

function OpMini({ op, client }: { op: Operation; client?: Client }) {
  return <div className="mini-op"><strong>{op.code}</strong><span>{client?.name ?? "Sin cliente"} · {formatDueLabel(op.dueDate)}</span></div>;
}

function Badge({ op, docs }: { op: Operation; docs: ReturnType<typeof missingDocs> }) {
  const status = operationStatus(docs, op.dueDate);
  return <em className={status === "risk" ? "badge danger" : "badge ok"}>{status === "risk" ? "En riesgo" : "Listo"}</em>;
}

function MarketingIntro() {
  return (
    <section id="home" className="marketing">
      <div><span className="eyebrow">De prototipo a sistema real</span><h1>Gestión documental aduanera lista para pilotos pagos.</h1><p>Legajos, clientes, documentos, vencimientos, portal cliente, auditoría y backend Supabase-ready para pasar de demo a operación real sin inventar integraciones oficiales.</p><a className="primary link-button" href="#app">Entrar a la app</a></div>
      <aside className="card"><h3>Decisión técnica</h3><p>Next.js + Supabase Auth/Postgres/Storage/RLS. Demo local para vender; modo productivo con env vars y migraciones SQL.</p></aside>
    </section>
  );
}

export default function Home() {
  return (
    <DemoStoreProvider>
      <MarketingIntro />
      <AppShell />
    </DemoStoreProvider>
  );
}
