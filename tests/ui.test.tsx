// @vitest-environment jsdom
import { act } from "react";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Meals, CoffeeCard } from "../src/components/Nutrition";
import { Workout } from "../src/components/Workout";
import { History } from "../src/components/History";
import { FitTrackShell } from "../src/App";
import { FitStore } from "../src/lib/store";
import { initialize } from "../src/lib/model";
import { initialAnswers, applyGuide } from "../src/lib/personalization";
import { foods } from "../src/data/nutrition";
vi.mock("../src/lib/client", () => ({ supabase: {} }));
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  vi.stubGlobal("confirm", () => true);
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => cleanup());
function StoreMeals({ store, date }: { store: FitStore; date: string }) {
  return <Meals store={store} date={date} />;
}
describe("comidas registradas y cambio de día", () => {
  it("muestra lunes y deja barra vacía hasta confirmar", () => {
    const s = new FitStore("qa");
    render(<StoreMeals store={s} date="2026-11-09" />);
    expect(screen.getAllByText(/Arroz blanco/).length).toBeGreaterThan(0);
    expect(s.list("food_logs")).toHaveLength(0);
  });
  it("conserva185g reales en control después de guardar y volver a abrir", () => {
    const s = new FitStore("qa");
    const r = render(<StoreMeals store={s} date="2026-11-09" />);
    let input = screen.getByRole("spinbutton", {
      name: "Arroz blanco cantidad real",
    }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "185" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Registrar Arroz blanco" }),
    );
    r.rerender(<StoreMeals store={s} date="2026-11-09" />);
    input = screen.getByRole("spinbutton", {
      name: "Arroz blanco cantidad real",
    }) as HTMLInputElement;
    expect(input.value).toBe("185");
    expect(s.list("food_logs")[0].data.kcal).toBe(240.5);
    r.unmount();
    render(<StoreMeals store={new FitStore("qa")} date="2026-11-09" />);
    expect(
      (
        screen.getByRole("spinbutton", {
          name: "Arroz blanco cantidad real",
        }) as HTMLInputElement
      ).value,
    ).toBe("185");
  });
  it("un alimento editado antes de medianoche conserva su snapshot y fecha", () => {
    const s = new FitStore("qa");
    const r = render(<StoreMeals store={s} date="2026-11-09" />);
    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Arroz blanco cantidad real" }),
      { target: { value: "185" } },
    );
    r.rerender(<StoreMeals store={s} date="2026-11-10" />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Registrar Arroz blanco" })[0],
    );
    expect(s.list("food_logs", "2026-11-09")[0].data.foodId).toBe("rice");
    expect(s.list("food_logs", "2026-11-09")[0].data.amount).toBe(185);
    expect(s.list("food_logs", "2026-11-10")).toHaveLength(0);
  });
  it("tres cafés separados no se sobrescriben tras eliminar uno", () => {
    const s = new FitStore("qa");
    const r = render(<CoffeeCard store={s} date="2026-11-09" />);
    fireEvent.click(screen.getByRole("button", { name: "Registrar mi café" }));
    r.rerender(<CoffeeCard store={s} date="2026-11-09" />);
    fireEvent.click(screen.getByRole("button", { name: "Tomé otro café" }));
    const old = s.list("food_logs").find((l) => l.data.foodId === "milk")!;
    s.remove("food_logs", old);
    r.rerender(<CoffeeCard store={s} date="2026-11-09" />);
    fireEvent.click(screen.getByRole("button", { name: "Tomé otro café" }));
    expect(
      s.list("food_logs").filter((l) => l.data.foodId === "milk"),
    ).toHaveLength(2);
    expect(
      s.all("food_logs").filter((l) => l.data.foodId === "milk"),
    ).toHaveLength(3);
  });
  it("registrar pendientes dos veces no duplica el menú", () => {
    const s = new FitStore("qa");
    const r = render(<StoreMeals store={s} date="2026-11-09" />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Registrar pendientes" })[1],
    );
    const first = s.list("food_logs").length;
    r.rerender(<StoreMeals store={s} date="2026-11-09" />);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Registrar pendientes" })[1],
    );
    expect(s.list("food_logs").length).toBe(first);
  });
});
describe("rutina real", () => {
  it("miércoles muestra recuperación sin botón de pesas", () => {
    render(<Workout store={new FitStore("qa")} date="2026-11-11" unit="lb" />);
    expect(
      screen.getAllByText("Día de recuperación activa").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Comenzar entrenamiento" }),
    ).toBeNull();
  });
  it("domingo muestra descanso y caminata opcional", () => {
    render(<Workout store={new FitStore("qa")} date="2026-11-08" unit="lb" />);
    expect(
      screen.getByText(
        "Hoy es tu día de descanso. Recuperarte también es parte del progreso.",
      ),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Comenzar entrenamiento" }),
    ).toBeNull();
  });
  it("una sesión comenzada conserva su fecha tras medianoche", () => {
    const s = new FitStore("qa");
    const r = render(<Workout store={s} date="2026-11-09" unit="lb" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Comenzar entrenamiento" }),
    );
    r.rerender(<Workout store={s} date="2026-11-10" unit="lb" />);
    expect(screen.getByText(/La fecha se fijó al comenzar/)).toBeTruthy();
    expect(s.list("workout_sessions")[0].local_date).toBe("2026-11-09");
  });
});

describe("reloj de la aplicación", () => {
  it("al pasar medianoche PR muestra el día nuevo con0kcal y conserva ayer", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-09T03:59:59Z"));
      const s = new FitStore("clock-qa");
      s.hydrated = true;
      s.start = () => () => {};
      s.save("user_profiles", { name: "Prueba", onboardingRequired: false });
      s.save("user_goals", {
        kcal: 2100,
        protein: 170,
        carbs: 210,
        fat: 64,
        trackingEnabled: true,
      });
      s.save(
        "food_logs",
        { kcal: 100, protein: 10, carbs: 10, fat: 2 },
        { local_date: "2026-11-08" },
      );
      render(<FitTrackShell userId="clock-qa" testStore={s} />);
      expect(
        screen
          .getByRole("progressbar", { name: "Calorías consumidas" })
          .getAttribute("aria-valuenow"),
      ).toBe("100");
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(
        screen
          .getByRole("progressbar", { name: "Calorías consumidas" })
          .getAttribute("aria-valuenow"),
      ).toBe("0");
      expect(screen.getByText(/lunes, 9 de noviembre/i)).toBeTruthy();
      expect(s.list("food_logs", "2026-11-08")).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("fecha histórica de una sesión", () => {
  it("mueve sesión, dos series y cardio vinculado sin duplicar sus datos", () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const s = new FitStore("history-qa");
    const originalDate = "2026-11-09";
    const nextDate = "2026-11-10";
    const session = s.save(
      "workout_sessions",
      {
        title: "Upper A de prueba",
        startedAt: "2026-11-09T20:00:00Z",
        finishedAt: "2026-11-09T21:00:00Z",
        notes: "Técnica controlada",
        exercises: [{ id: "bench", name: "Bench Press" }],
      },
      { local_date: originalDate },
    );
    const children = [1, 2].map((setNumber) =>
      s.save(
        "workout_sets",
        {
          exerciseId: "bench",
          exerciseName: "Bench Press",
          setNumber,
          weightLb: 50 + setNumber * 5,
          reps: 8 + setNumber,
          completed: true,
        },
        { local_date: originalDate, session_id: session.id },
      ),
    );
    const cardio = s.save(
      "cardio_logs",
      { kind: "walk", minutes: 20, steps: 1800 },
      { local_date: originalDate, session_id: session.id },
    );
    const originalData = [session, ...children, cardio].map((row) => ({
      id: row.id,
      data: { ...row.data },
    }));
    const onDate = vi.fn();
    render(<History store={s} date={originalDate} onDate={onDate} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Editar Upper A de prueba" }),
    );
    fireEvent.change(screen.getByLabelText("Fecha", { exact: true }), {
      target: { value: nextDate },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onDate).toHaveBeenCalledWith(nextDate);
    expect(s.list("workout_sessions", originalDate)).toHaveLength(0);
    expect(s.list("workout_sets", originalDate)).toHaveLength(0);
    expect(s.list("cardio_logs", originalDate)).toHaveLength(0);
    expect(s.list("workout_sessions", nextDate)).toHaveLength(1);
    expect(s.list("workout_sets", nextDate)).toHaveLength(2);
    expect(s.list("cardio_logs", nextDate)).toHaveLength(1);
    const moved = [
      ...s.list("workout_sessions"),
      ...s.list("workout_sets"),
      ...s.list("cardio_logs"),
    ];
    expect(moved.map((row) => ({ id: row.id, data: row.data }))).toEqual(
      originalData,
    );
    expect(moved.every((row) => row.local_date === nextDate)).toBe(true);
    expect(
      s.cache.queue.filter((entry) => entry.table === "workout_sets"),
    ).toHaveLength(2);
  });
});

describe("entrada a la guía por cuenta", () => {
  it("una cuenta nueva debe revisar el alcance antes de ver una rutina", () => {
    const s = new FitStore("new-onboarding");
    s.hydrated = true;
    s.start = () => () => {};
    initialize(s);
    render(<FitTrackShell userId={s.userId} testStore={s} />);
    expect(
      screen.getByRole("heading", { name: "Empecemos con calma." }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("progressbar", { name: "Calorías consumidas" }),
    ).toBeNull();
    fireEvent.change(
      screen.getByRole("combobox", { name: "¿En qué grupo de edad estás?" }),
      { target: { value: "under18" } },
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Entiendo el alcance/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(
      screen.getByRole("button", { name: "Usar solo registro manual" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Guardar y usar esta guía" }),
    ).toBeNull();
  });
  it("una cuenta configurada registra consumo sin heredar las calorías ni el café del perfil original", () => {
    const s = new FitStore("new-guide-ready");
    s.hydrated = true;
    s.start = () => () => {};
    initialize(s);
    applyGuide(s, {
      ...initialAnswers,
      age: "30-49",
      activity: "sedentary",
      experience: "new",
      goal: "health",
      equipment: "dumbbells",
      professionalSupport: "no",
      consent: true,
      days: [1, 4],
      excluded: ["dairy"],
    });
    render(<FitTrackShell userId={s.userId} testStore={s} />);
    expect(screen.getByText("Sin objetivo numérico")).toBeTruthy();
    expect(
      screen.queryByRole("progressbar", { name: "Calorías consumidas" }),
    ).toBeNull();
    expect(screen.queryByText("Tu café de todos los días")).toBeNull();
    expect(s.list("user_goals")[0].data.kcal).toBe(0);
  });
});
