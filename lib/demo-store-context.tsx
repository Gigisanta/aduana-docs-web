"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { buildOperationDocs } from "./domain";
import { createSeedState, loadDemoState, saveDemoState, type DemoState } from "./demo-data";
import type { Client, Operation, OperationKind, PlanId } from "./types";

interface NewOperationInput {
  code: string;
  kind: OperationKind;
  clientName: string;
  lane: string;
  dueDate: string;
  notes: string;
}

interface ClientInput {
  name: string;
  contact: string;
  email: string;
  phone: string;
  notes: string;
}

interface DemoStoreValue {
  state: DemoState;
  hydrated: boolean;
  startSession: (workspaceName: string) => void;
  logout: () => void;
  createOperation: (input: NewOperationInput) => { ok: true } | { ok: false; error: string };
  toggleOperationDoc: (operationId: string, docName: string, received: boolean) => void;
  deleteOperation: (operationId: string) => void;
  upsertClient: (clientId: string | null, input: ClientInput) => { ok: true } | { ok: false; error: string };
  deleteClient: (clientId: string) => void;
  setWorkspaceName: (name: string) => void;
  setPlan: (plan: PlanId) => void;
  toggleReadiness: (index: number) => void;
  setRoi: (hoursPerWeek: number, costPerHour: number) => void;
  resetDemo: () => void;
}

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

function slugifyLocal(input: string): string {
  const slug = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "cliente";
}

function nowIso(): string {
  return new Date().toISOString();
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadDemoState();
    if (loaded) setState(loaded);
    setHydrated(true);
    // ponytail: single localStorage blob, loaded once on mount to avoid SSR/client mismatch.
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveDemoState(state);
  }, [state, hydrated]);

  const logAudit = useCallback(
    (action: string, entityType: "operation" | "client" | "workspace" | "document", entityId: string) => {
      setState((prev) => ({
        ...prev,
        auditEvents: [
          {
            id: `audit-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
            workspaceId: prev.workspace.id,
            actorLabel: prev.session?.workspaceName ?? "demo",
            action,
            entityType,
            entityId,
            createdAt: nowIso(),
          },
          ...prev.auditEvents,
        ].slice(0, 200),
      }));
    },
    [],
  );

  const startSession = useCallback((workspaceName: string) => {
    const name = workspaceName.trim() || "Estudio Demo";
    setState((prev) => ({
      ...prev,
      workspace: { ...prev.workspace, name },
      session: { workspaceName: name, enteredAt: nowIso() },
    }));
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, session: null }));
  }, []);

  const ensureClient = useCallback((prev: DemoState, name: string): { clients: Client[]; clientId: string } => {
    const existing = prev.clients.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return { clients: prev.clients, clientId: existing.id };
    const newClient: Client = {
      id: slugifyLocal(name),
      workspaceId: prev.workspace.id,
      name,
      contact: "",
      email: "",
      phone: "",
      notes: "",
    };
    return { clients: [...prev.clients, newClient], clientId: newClient.id };
  }, []);

  const createOperation = useCallback(
    (input: NewOperationInput): { ok: true } | { ok: false; error: string } => {
      const code = input.code.trim().toUpperCase();
      if (!code) return { ok: false, error: "El código de legajo es obligatorio." };
      let error = "";
      setState((prev) => {
        if (prev.operations.some((op) => op.code === code)) {
          error = `Ya existe el legajo ${code}.`;
          return prev;
        }
        const clientName = input.clientName.trim();
        const { clients, clientId } = ensureClient(prev, clientName || "Sin cliente");
        const operation: Operation = {
          id: code,
          workspaceId: prev.workspace.id,
          clientId,
          code,
          kind: input.kind,
          lane: input.lane.trim() || "Ruta sin definir",
          dueDate: input.dueDate,
          notes: input.notes.trim(),
          createdAt: nowIso(),
        };
        return {
          ...prev,
          clients,
          operations: [operation, ...prev.operations],
          operationDocs: {
            ...prev.operationDocs,
            [operation.id]: buildOperationDocs(operation.id, operation.kind),
          },
        };
      });
      if (error) return { ok: false, error };
      logAudit("legajo_creado", "operation", code);
      return { ok: true };
    },
    [ensureClient, logAudit],
  );

  const toggleOperationDoc = useCallback((operationId: string, docName: string, received: boolean) => {
    setState((prev) => {
      const docs = prev.operationDocs[operationId];
      if (!docs) return prev;
      return {
        ...prev,
        operationDocs: {
          ...prev.operationDocs,
          [operationId]: docs.map((doc) =>
            doc.name === docName ? { ...doc, received, receivedAt: received ? nowIso() : null } : doc,
          ),
        },
      };
    });
  }, []);

  const deleteOperation = useCallback(
    (operationId: string) => {
      setState((prev) => {
        const { [operationId]: _removed, ...restDocs } = prev.operationDocs;
        return {
          ...prev,
          operations: prev.operations.filter((op) => op.id !== operationId),
          operationDocs: restDocs,
        };
      });
      logAudit("legajo_eliminado", "operation", operationId);
    },
    [logAudit],
  );

  const upsertClient = useCallback(
    (clientId: string | null, input: ClientInput): { ok: true } | { ok: false; error: string } => {
      const name = input.name.trim();
      if (!name) return { ok: false, error: "El nombre del cliente es obligatorio." };
      const trimmedInput: ClientInput = { ...input, name };
      let error = "";
      setState((prev) => {
        if (clientId) {
          return {
            ...prev,
            clients: prev.clients.map((c) => (c.id === clientId ? { ...c, ...trimmedInput } : c)),
          };
        }
        if (prev.clients.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
          error = `Ya existe un cliente "${name}".`;
          return prev;
        }
        const newClient: Client = { id: slugifyLocal(name), workspaceId: prev.workspace.id, ...trimmedInput };
        return { ...prev, clients: [...prev.clients, newClient] };
      });
      if (error) return { ok: false, error };
      logAudit(clientId ? "cliente_actualizado" : "cliente_creado", "client", clientId ?? slugifyLocal(name));
      return { ok: true };
    },
    [logAudit],
  );

  const deleteClient = useCallback(
    (clientId: string) => {
      setState((prev) => ({ ...prev, clients: prev.clients.filter((c) => c.id !== clientId) }));
      logAudit("cliente_eliminado", "client", clientId);
    },
    [logAudit],
  );

  const setWorkspaceName = useCallback((name: string) => {
    const trimmed = name.trim() || "Estudio Demo";
    setState((prev) => ({
      ...prev,
      workspace: { ...prev.workspace, name: trimmed },
      session: prev.session ? { ...prev.session, workspaceName: trimmed } : prev.session,
    }));
  }, []);

  const setPlan = useCallback((plan: PlanId) => {
    setState((prev) => ({ ...prev, workspace: { ...prev.workspace, plan } }));
  }, []);

  const toggleReadiness = useCallback((index: number) => {
    setState((prev) => ({ ...prev, readiness: { ...prev.readiness, [index]: !prev.readiness[index] } }));
  }, []);

  const setRoi = useCallback((hoursPerWeek: number, costPerHour: number) => {
    setState((prev) => ({ ...prev, roi: { hoursPerWeek, costPerHour } }));
  }, []);

  const resetDemo = useCallback(() => {
    setState((prev) => {
      const seed = createSeedState();
      return { ...seed, workspace: { ...seed.workspace, name: prev.workspace.name }, session: prev.session };
    });
  }, []);

  const value = useMemo<DemoStoreValue>(
    () => ({
      state,
      hydrated,
      startSession,
      logout,
      createOperation,
      toggleOperationDoc,
      deleteOperation,
      upsertClient,
      deleteClient,
      setWorkspaceName,
      setPlan,
      toggleReadiness,
      setRoi,
      resetDemo,
    }),
    [
      state,
      hydrated,
      startSession,
      logout,
      createOperation,
      toggleOperationDoc,
      deleteOperation,
      upsertClient,
      deleteClient,
      setWorkspaceName,
      setPlan,
      toggleReadiness,
      setRoi,
      resetDemo,
    ],
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore(): DemoStoreValue {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return ctx;
}
