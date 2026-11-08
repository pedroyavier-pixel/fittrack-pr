import { describe, it, expect, vi, beforeEach } from "vitest";
import { prDate, weekday, weekNumber, shiftDate } from "../src/lib/time";
import { foods, weeklyMenu, menuNutrients } from "../src/data/nutrition";
import { schedule, exercises, recommendLoad } from "../src/data/training";
import { nutrients } from "../src/lib/model";
const remote = vi.hoisted(() => ({
  tables: new Map<string, Map<string, any>>(),
  fail: false,
  hold: undefined as undefined | (() => Promise<void>),
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
      select: () => ({
        eq: (_field: string, user: string) => ({
          order: () => ({
            range: async (start: number, end: number) => ({
              data: [...(remote.tables.get(table) || new Map()).values()]
                .filter((r: any) => r.user_id === user)
                .slice(start, end + 1),
              error: null,
            }),
          }),
        }),
      }),
    }),
  },
}));
import { FitStore, compactQueue, seedId } from "../src/lib/store";
const memory = new Map<string, string>();
beforeEach(() => {
  remote.tables.clear();
  remote.fail = false;
  remote.hold = undefined;
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
