import { useEffect, useState } from "react";
import { supabase } from "./client";
export const tables = [
  "user_profiles",
  "user_goals",
  "exercise_catalog",
  "food_catalog",
  "workout_plans",
  "workout_plan_exercises",
  "workout_sessions",
  "workout_sets",
  "cardio_logs",
  "recipes",
  "recipe_ingredients",
  "meal_plans",
  "meal_plan_items",
  "food_logs",
  "body_measurements",
] as const;
export type Table = (typeof tables)[number];
export type Row = {
  id: string;
  user_id: string;
  data: Record<string, any>;
  local_date?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  session_id?: string;
  plan_id?: string;
  recipe_id?: string;
  meal_plan_id?: string;
  food_id?: string;
  exercise_id?: string;
};
type Pending = { table: Table; row: Row; revision: number };
type Cache = { rows: Partial<Record<Table, Row[]>>; queue: Pending[] };
export function compactQueue(queue: Pending[], next: Pending) {
  const index = queue.findIndex(
    (p) => p.table === next.table && p.row.id === next.row.id,
  );
  if (index < 0) return [...queue, next];
  return queue.map((p, i) => (i === index ? next : p));
}
export function mergeRows(
  remote: Row[],
  local: Row[],
  pending: Pending[],
  table: Table,
) {
  const byId = new Map(remote.map((r) => [r.id, r]));
  for (const r of local)
    if (pending.some((p) => p.table === table && p.row.id === r.id))
      byId.set(r.id, r);
  return [...byId.values()];
}
export class FitStore {
  userId: string;
  cache: Cache;
  listeners = new Set<() => void>();
  syncing = false;
  error = "";
  online = navigator.onLine;
  revision = 0;
  hydrated = false;
  lastSync = "";
  private timer?: ReturnType<typeof setInterval>;
  private channel?: ReturnType<typeof supabase.channel>;
  private disposed = false;
  constructor(userId: string) {
    this.userId = userId;
    try {
      const raw = localStorage.getItem(this.key);
      this.cache = raw ? JSON.parse(raw) : { rows: {}, queue: [] };
      this.revision = Math.max(0, ...this.cache.queue.map((p) => p.revision));
    } catch {
      this.cache = { rows: {}, queue: [] };
      this.error =
        "No se pudo recuperar el almacenamiento local. Exporta tus registros periódicamente.";
    }
  }
  get key() {
    return `fittrack-v1:${this.userId}`;
  }
  emit() {
    this.listeners.forEach((f) => f());
  }
  persist() {
    localStorage.setItem(this.key, JSON.stringify(this.cache));
  }
  list(table: Table, date?: string) {
    return (this.cache.rows[table] || []).filter(
      (r) => !r.deleted_at && (!date || r.local_date === date),
    );
  }
  all(table: Table) {
    return this.cache.rows[table] || [];
  }
  save(
    table: Table,
    data: Record<string, any>,
    options: Partial<Omit<Row, "data" | "user_id">> = {},
  ) {
    const old = this.all(table).find((r) => r.id === options.id);
    const stamp = new Date().toISOString();
    const row: Row = {
      ...old,
      ...options,
      id: options.id || crypto.randomUUID(),
      user_id: this.userId,
      data,
      created_at: old?.created_at || stamp,
      updated_at: stamp,
      deleted_at: options.deleted_at ?? null,
    };
    const before = this.cache;
    const nextRows = [...this.all(table).filter((r) => r.id !== row.id), row];
    this.cache = {
      rows: { ...this.cache.rows, [table]: nextRows },
      queue: compactQueue(this.cache.queue, {
        table,
        row,
        revision: ++this.revision,
      }),
    };
    try {
      this.persist();
    } catch {
      this.cache = before;
      this.error =
        "El dispositivo no pudo guardar. Libera espacio y vuelve a intentarlo.";
      this.emit();
      throw new Error(this.error);
    }
    this.emit();
    void this.sync();
    return row;
  }
  remove(table: Table, row: Row) {
    return this.save(table, row.data, {
      ...row,
      deleted_at: new Date().toISOString(),
    });
  }
  async sync() {
    if (this.disposed || this.syncing) return;
    this.online = navigator.onLine;
    if (!this.online) {
      this.emit();
      return;
    }
    this.syncing = true;
    this.error = "";
    this.emit();
    try {
      while (this.cache.queue.length) {
        const p = this.cache.queue[0];
        const { error } = await supabase
          .from(`fittrack_${p.table}`)
          .upsert(p.row, { onConflict: "id" });
        if (error) throw error;
        this.cache.queue = this.cache.queue.filter(
          (q) =>
            !(
              q.table === p.table &&
              q.row.id === p.row.id &&
              q.revision === p.revision
            ),
        );
        this.persist();
        this.emit();
      }
      for (const table of tables) {
        const remote: Row[] = [];
        let start = 0;
        while (true) {
          const { data, error } = await supabase
            .from(`fittrack_${table}`)
            .select("*")
            .eq("user_id", this.userId)
            .order("id")
            .range(start, start + 999);
          if (error) throw error;
          remote.push(...data);
          if (data.length < 1000) break;
          start += 1000;
        }
        this.cache.rows[table] = mergeRows(
          remote,
          this.all(table),
          this.cache.queue,
          table,
        );
      }
      this.hydrated = true;
      this.lastSync = new Date().toISOString();
      this.persist();
    } catch (e) {
      this.error =
        e instanceof Error
          ? e.message
          : (e as { message?: string })?.message ||
            "No se pudo sincronizar. Tus cambios permanecen en este dispositivo.";
    } finally {
      this.syncing = false;
      this.emit();
      if (this.cache.queue.length && !this.error && !this.disposed)
        queueMicrotask(() => void this.sync());
    }
  }
  start() {
    const resume = () => void this.sync();
    window.addEventListener("online", resume);
    window.addEventListener("focus", resume);
    const offline = () => {
      this.online = false;
      this.emit();
    };
    window.addEventListener("offline", offline);
    const visibility = () => {
      if (document.visibilityState === "visible") resume();
    };
    document.addEventListener("visibilitychange", visibility);
    this.timer = setInterval(resume, 30000);
    this.channel = supabase
      .channel(`fittrack:${this.userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", filter: `user_id=eq.${this.userId}` },
        () => {
          if (!this.syncing) resume();
        },
      )
      .subscribe();
    void this.sync();
    return () => {
      this.disposed = true;
      clearInterval(this.timer);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", offline);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", visibility);
      if (this.channel) void supabase.removeChannel(this.channel);
    };
  }
}
export function useStore(store: FitStore) {
  const [, render] = useState(0);
  useEffect(() => {
    const update = () => render((x) => x + 1);
    store.listeners.add(update);
    return () => {
      store.listeners.delete(update);
    };
  }, [store]);
  return store;
}
export function seedId(userId: string, key: string) {
  let h1 = 2166136261,
    h2 = 333555777;
  const s = userId + ":" + key;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ s.charCodeAt(i), 2246822519);
  }
  const x =
    (h1 >>> 0).toString(16).padStart(8, "0") +
    (h2 >>> 0).toString(16).padStart(8, "0");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-4${x.slice(13, 16)}-a${x.slice(1, 4)}-${x.slice(4, 16)}`;
}
export function exportFile(
  filename: string,
  content: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
