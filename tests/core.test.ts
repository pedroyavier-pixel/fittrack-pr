import { describe, it, expect, vi, beforeEach } from "vitest";
import { prDate, weekday, weekNumber, shiftDate } from "../src/lib/time";
import { foods, weeklyMenu, menuNutrients } from "../src/data/nutrition";
import { schedule, exercises, recommendLoad } from "../src/data/training";
import { nutrients } from "../src/lib/model";
const remote = vi.hoisted(() => ({
  tables: new Map<string, Map<string, any>>(),
  fail: false,
  hold: undefined as undefined | (() => Promise<void>),
  reads: [] as {
    table: string;
    since?: string;
    cursor?: string;
    returned: number;
  }[],
}));
vi.mock("../src/lib/client", () => ({
  supabase: {
    from: (table: string) => ({
      upsert: async (row: any) => {
        if (remote.hold) await remote.hold();
        if (remote.fail) return { error: new Error("offline") };
        const rows = remote.tables.get(table) || new Map();
        rows.set(row.id, structuredClone(row));
        remote.tables.set(table, rows);
        return { error: null };
      },
      select: () => {
        let user = "",
          since: string | undefined,
          cursor: string | undefined;
        const orders: string[] = [];
        const builder = {
          eq: (_field: string, value: string) => {
            user = value;
            return builder;
          },
          order: (field: string) => {
            orders.push(field);
            return builder;
          },
          gte: (_field: string, value: string) => {
            since = value;
            return builder;
          },
          or: (value: string) => {
            cursor = value;
            return builder;
          },
          limit: async (limit: number) => {
            let rows = [
              ...(remote.tables.get(table) || new Map()).values(),
            ].filter((r: any) => r.user_id === user);
            if (since) rows = rows.filter((r: any) => r.updated_at >= since!);
            if (cursor) {
              const match = cursor.match(
                /^updated_at\.gt\.([^,]+),and\(updated_at\.eq\.([^,]+),id\.gt\.([^)]+)\)$/,
              )!;
              rows = rows.filter(
                (r: any) =>
                  r.updated_at > match[1] ||
                  (r.updated_at === match[2] && r.id > match[3]),
              );
            }
            rows.sort((a: any, b: any) => {
              for (const field of orders) {
                const compared = String(a[field] || "").localeCompare(
                  String(b[field] || ""),
                );
                if (compared) return compared;
              }
              return 0;
            });
            rows = rows.slice(0, limit);
            remote.reads.push({ table, since, cursor, returned: rows.length });
            return { data: structuredClone(rows), error: null };
          },
        };
        return builder;
      },
    }),
  },
}));
import { FitStore, compactQueue, seedId } from "../src/lib/store";
const memory = new Map<string, string>();
beforeEach(() => {
  remote.tables.clear();
  remote.fail = false;
  remote.hold = undefined;
  remote.reads = [];
  memory.clear();
  vi.stubGlobal("navigator", { onLine: false });
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => memory.get(k) || null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
  });
});
describe("fecha calendario Puerto Rico", () => {
  it("cambia a medianoche PR y no UTC ni zona del teléfono", () => {
    expect(prDate(new Date("2026-11-09T03:59:59Z"))).toBe("2026-11-08");
    expect(prDate(new Date("2026-11-09T04:00:00Z"))).toBe("2026-11-09");
  });
  it("calendario lunes, miércoles y domingo correcto", () => {
    expect(schedule.find((d) => d.day === weekday("2026-11-09"))?.title).toBe(
      "Upper A",
    );
    expect(schedule.find((d) => d.day === weekday("2026-11-11"))?.type).toBe(
      "recovery",
    );
    expect(schedule.find((d) => d.day === weekday("2026-11-08"))?.type).toBe(
      "rest",
    );
  });
  it("semanas y límites de mes", () => {
    expect(weekNumber("2026-11-09", "2026-11-16")).toBe(2);
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});
describe("nutrición real", () => {
  it("185g arroz recalcula sin modificar catálogo", () => {
    const rice = foods.find((f) => f.id === "rice")!;
    expect(nutrients(rice, 185).kcal).toBeCloseTo(240.5);
    expect(nutrients(rice, 150).kcal).toBe(195);
    expect(rice.kcal).toBe(130);
  });
  it("café cuenta sólo al registrarse y dos tazas duplican el real", () => {
    const one =
      nutrients(foods.find((f) => f.id === "milk")!, 118).kcal +
      nutrients(foods.find((f) => f.id === "espresso")!, 30).kcal;
    expect(one).toBeCloseTo(76.94, 1);
    const s = new FitStore("a");
    expect(s.list("food_logs", "2026-11-08")).toHaveLength(0);
    for (let i = 0; i < 2; i++)
      s.save(
        "food_logs",
        { kcal: one, coffee: true },
        { local_date: "2026-11-08" },
      );
    expect(
      s.list("food_logs", "2026-11-08").reduce((n, r) => n + r.data.kcal, 0),
    ).toBeCloseTo(one * 2);
    expect(s.list("food_logs", "2026-11-09")).toHaveLength(0);
    expect(s.list("food_logs", "2026-11-08")).toHaveLength(2);
  });
  it("7 días cuatro comidas calculadas cerca del objetivo", () => {
    expect(new Set(weeklyMenu.map((d) => d.day)).size).toBe(7);
    for (const day of weeklyMenu) {
      const n = menuNutrients(day);
      expect(day.meals).toHaveLength(4);
      expect(n.kcal).toBeGreaterThan(2050);
      expect(n.kcal).toBeLessThan(2150);
      expect(n.protein).toBeGreaterThan(165);
      expect(n.protein).toBeLessThan(175);
    }
  });
});
describe("entrenamiento y recuperación", () => {
  it("mantiene series programadas y sólo sugiere carga con evidencia", () => {
    expect(exercises.every((e) => e.sets === 3)).toBe(true);
    const e = exercises[0];
    expect(recommendLoad(e, []).provisional).toBe(true);
    const sets = Array.from({ length: 3 }, () => ({
      weightLb: 100,
      reps: e.maxReps,
      rir: 2,
      techniqueGood: true,
      completed: true,
    }));
    expect(recommendLoad(e, sets).action).toBe("increase");
    expect(recommendLoad(e, sets.slice(0, 2)).action).toBe("maintain");
    expect(
      recommendLoad(
        e,
        sets.map((s) => ({ ...s, rir: undefined })),
      ).action,
    ).toBe("maintain");
  });
  it("recupera 3 series diferentes después de cerrar y no duplica al reconectar", async () => {
    let s = new FitStore("a");
    const session = s.save(
      "workout_sessions",
      { title: "Upper A" },
      { local_date: "2026-11-09" },
    );
    for (let i = 1; i <= 3; i++)
      s.save(
        "workout_sets",
        { weightLb: 40 + i * 5, reps: 10 - i, completed: true },
        {
          id: seedId("a", "set" + i),
          session_id: session.id,
          local_date: "2026-11-09",
        },
      );
    s = new FitStore("a");
    expect(s.list("workout_sets")).toHaveLength(3);
    expect(s.list("workout_sets").map((r) => r.data.weightLb)).toEqual([
      45, 50, 55,
    ]);
    vi.stubGlobal("navigator", { onLine: true });
    await s.sync();
    await s.sync();
    expect(remote.tables.get("fittrack_workout_sets")?.size).toBe(3);
    expect(s.cache.queue).toHaveLength(0);
  });
  it("actualizar padre no lo mueve detrás de una serie pendiente", () => {
    const s = new FitStore("a");
    const p = s.save(
      "workout_sessions",
      { title: "A" },
      { local_date: "2026-11-08" },
    );
    s.save(
      "workout_sets",
      { reps: 8 },
      { session_id: p.id, local_date: "2026-11-08" },
    );
    s.save(
      "workout_sessions",
      { title: "A", notes: "new" },
      { id: p.id, local_date: "2026-11-08" },
    );
    expect(s.cache.queue[0].table).toBe("workout_sessions");
  });
  it("conserva cambios hechos mientras llega un guardado anterior", async () => {
    const s = new FitStore("a");
    const r = s.save(
      "food_logs",
      { amount: 150 },
      { local_date: "2026-11-08" },
    );
    let release!: () => void;
    let held = false;
    remote.hold = async () => {
      if (!held) {
        held = true;
        await new Promise<void>((resolve) => (release = resolve));
      }
    };
    vi.stubGlobal("navigator", { onLine: true });
    const pending = s.sync();
    s.save(
      "food_logs",
      { amount: 185 },
      { id: r.id, local_date: "2026-11-08" },
    );
    release();
    await pending;
    expect(remote.tables.get("fittrack_food_logs")?.get(r.id).data.amount).toBe(
      185,
    );
    expect(s.cache.queue).toHaveLength(0);
  });
  it("un fallo conserva cola y separa cachés de usuarios", async () => {
    const a = new FitStore("a");
    a.save("food_logs", { kcal: 200 }, { local_date: "2026-11-08" });
    vi.stubGlobal("navigator", { onLine: true });
    remote.fail = true;
    await a.sync();
    expect(a.cache.queue).toHaveLength(1);
    expect(new FitStore("b").list("food_logs")).toHaveLength(0);
    remote.fail = false;
    await a.sync();
    expect(a.cache.queue).toHaveLength(0);
  });
  it("eliminación sincronizada no resucita al abrir otro dispositivo", async () => {
    const a = new FitStore("a");
    const r = a.save("food_logs", { kcal: 200 }, { local_date: "2026-11-08" });
    a.remove("food_logs", r);
    vi.stubGlobal("navigator", { onLine: true });
    await a.sync();
    memory.clear();
    const b = new FitStore("a");
    await b.sync();
    expect(b.list("food_logs")).toHaveLength(0);
    expect(b.all("food_logs")[0].deleted_at).toBeTruthy();
  });
});

describe("durable cache and incremental history", () => {
  const row = (id: string, date: string, stamp: string) => ({
    id,
    user_id: "a",
    local_date: date,
    updated_at: stamp,
    data: { amount: 100 },
  });
  it("bounds synced dated rows to 30 PR calendar days while retaining pending old rows and parents", () => {
    const today = prDate(),
      recent = shiftDate(today, -29),
      old = shiftDate(today, -30);
    const s = new FitStore("a");
    const oldSession = row("old-session", old, "2026-01-01T00:00:00Z");
    s.cache.rows = {
      food_logs: [
        row("old", old, "2026-01-01T00:00:00Z"),
        row("recent", recent, "2026-01-02T00:00:00Z"),
      ],
      workout_sessions: [oldSession],
      user_profiles: [{ id: "profile", user_id: "a", data: { name: "Test" } }],
    };
    s.save(
      "workout_sets",
      { reps: 8 },
      { id: "pending-set", session_id: oldSession.id, local_date: old },
    );
    const restored = new FitStore("a");
    expect(restored.list("food_logs").map((r) => r.id)).toEqual(["recent"]);
    expect(restored.list("user_profiles")).toHaveLength(1);
    expect(restored.list("workout_sets")[0].id).toBe("pending-set");
    expect(restored.list("workout_sessions")[0].id).toBe("old-session");
    expect(restored.cache.queue).toHaveLength(1);
    expect(s.list("food_logs")).toHaveLength(2);
  });
  it("restores full old history from server after reopening, then merges deltas without losing untouched rows", async () => {
    const today = prDate(),
      old = shiftDate(today, -90);
    remote.tables.set(
      "fittrack_food_logs",
      new Map([
        ["old", row("old", old, "2026-01-01T00:00:00Z")],
        ["new", row("new", today, "2026-01-02T00:00:00Z")],
      ]),
    );
    const first = new FitStore("a");
    vi.stubGlobal("navigator", { onLine: true });
    await first.sync();
    expect(first.list("food_logs")).toHaveLength(2);
    const reopened = new FitStore("a");
    expect(reopened.list("food_logs").map((r) => r.id)).toEqual(["new"]);
    await reopened.sync();
    expect(reopened.list("food_logs")).toHaveLength(2);
    const reads = remote.reads.filter((r) => r.table === "fittrack_food_logs");
    expect(reads.at(-1)?.since).toBeUndefined();
    remote.tables
      .get("fittrack_food_logs")!
      .set("new", {
        ...row("new", today, "2026-01-03T00:00:00Z"),
        data: { amount: 185 },
      });
    await reopened.sync();
    expect(reopened.list("food_logs")).toHaveLength(2);
    expect(
      reopened.list("food_logs").find((r) => r.id === "new")?.data.amount,
    ).toBe(185);
    expect(
      remote.reads.filter((r) => r.table === "fittrack_food_logs").at(-1)
        ?.since,
    ).toBe("2026-01-02T00:00:00Z");
  });
  it("paginates equal timestamps by ID and preserves all 1002 rows", async () => {
    const today = prDate();
    const rows = Array.from({ length: 1002 }, (_, i) =>
      row(String(i).padStart(5, "0"), today, "2026-01-01T00:00:00Z"),
    );
    remote.tables.set(
      "fittrack_food_logs",
      new Map(rows.map((r) => [r.id, r])),
    );
    const s = new FitStore("a");
    vi.stubGlobal("navigator", { onLine: true });
    await s.sync();
    expect(s.list("food_logs")).toHaveLength(1002);
    const pages = remote.reads.filter((r) => r.table === "fittrack_food_logs");
    expect(pages.map((p) => p.returned)).toEqual([1000, 2]);
    expect(pages[1].cursor).toContain("id.gt.00999");
  });
});
