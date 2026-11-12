// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Onboarding } from "../src/components/Onboarding";
import { FitStore } from "../src/lib/store";
import { cardioActivities } from "../src/data/conditioning";
vi.mock("../src/lib/client", () => ({ supabase: {} }));
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: false,
  });
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const next = () =>
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
const choose = (name: string, value: string) =>
  fireEvent.change(screen.getByRole("combobox", { name }), {
    target: { value },
  });
function scope() {
  choose("¿En qué grupo de edad estás?", "30-49");
  choose(
    "¿Tienes alguna situación que requiere adaptar el ejercicio o dudas sobre si es adecuado para ti? Por ejemplo: dolor o lesión que limita el movimiento, embarazo o posparto, una condición médica o una indicación profesional.",
    "no",
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: /Entiendo el alcance de la guía/ }),
  );
  next();
}
function profile(sex = "female") {
  fireEvent.change(screen.getByRole("textbox",{name:/Tu nombre o apodo/}),{target:{value:"Alex"}});
  choose("Sexo biológico", sex);
  choose("¿Cómo es tu actividad fuera del entrenamiento?", "standing");
  choose("¿Cuál es tu experiencia actual?", "regular");
  next();
}
function goal(style = "mixed") {
  choose("¿Qué te gustaría priorizar?", "recomp");
  choose("¿Dónde y con qué prefieres entrenar?", "hybrid");
  choose("¿Qué estilo de entrenamiento te interesa?", style);
  choose("¿En qué horizonte te gustaría trabajar?", "3-6");
  next();
}
function agenda() {
  choose("¿Qué impacto prefieres para el cardio?", "low");
  fireEvent.click(screen.getByRole("checkbox", { name: /^Caminata / }));
  next();
}
function foodReview() {
  fireEvent.click(
    screen.getByRole("radio", { name: "Ninguna de las opciones indicadas" }),
  );
  next();
}

describe("cuestionario ampliado", () => {
  it("requiere sexo antes de seguir y no asigna cardio ni estilo por defecto", () => {
    render(
      <Onboarding store={new FitStore("new-profile")} onDone={() => {}} />,
    );
    scope();
    expect(
      (screen.getByRole("combobox", { name: "Sexo biológico" }) as HTMLSelectElement)
        .value,
    ).toBe("");
    choose("¿Cómo es tu actividad fuera del entrenamiento?", "active");
    choose("¿Cuál es tu experiencia actual?", "new");
    next();
    expect(screen.getByRole("alert").textContent).toMatch(/nombre/);
    fireEvent.change(screen.getByRole("textbox",{name:/Tu nombre o apodo/}),{target:{value:"Alex"}});
    next();
    expect(screen.getByRole("alert").textContent).toMatch(/sexo/);
    fireEvent.change(screen.getByRole("textbox",{name:/Tu nombre o apodo/}),{target:{value:"Alex"}});
    choose("Sexo biológico", "male");
    next();
    expect(
      (
        screen.getByRole("combobox", {
          name: "¿Qué estilo de entrenamiento te interesa?",
        }) as HTMLSelectElement
      ).value,
    ).toBe("");
    goal();
    for (const activity of cardioActivities) {
      const input = screen.getByRole("checkbox", {
        name: (name: string) => name.startsWith(activity.label + " "),
      });
      expect((input as HTMLInputElement).checked).toBe(false);
    }
    next();
    expect(screen.getByRole("alert").textContent).toMatch(
      /actividad cardiovascular/,
    );
  });

  it("no acepta solo cardio de impacto incompatible y permite selección múltiple con acceso confirmado", () => {
    render(
      <Onboarding store={new FitStore("cardio-selection")} onDone={() => {}} />,
    );
    scope();
    profile();
    goal();
    choose("¿Qué impacto prefieres para el cardio?", "low");
    fireEvent.click(
      screen.getByRole("checkbox", { name: /^Correr \/ trotar / }),
    );
    next();
    expect(screen.getByRole("alert").textContent).toMatch(/compatible/);
    fireEvent.click(screen.getByRole("checkbox", { name: /^Bicicleta / }));
    const access = screen.getByRole("checkbox", {
      name: /Confirmo que tengo acceso al equipo/,
    });
    expect((access as HTMLInputElement).checked).toBe(false);
    fireEvent.click(access);
    next();
    expect(
      screen.getByRole("heading", { name: "Ideas para comer mejor." }),
    ).toBeTruthy();
  });

  it("exige confirmar ninguna o seleccionar exclusiones antes de revisar la guía", () => {
    render(
      <Onboarding store={new FitStore("allergy-review")} onDone={() => {}} />,
    );
    scope();
    profile();
    goal();
    agenda();
    next();
    expect(screen.getByRole("alert").textContent).toMatch(/Confirma/);
    fireEvent.click(
      screen.getByRole("radio", {
        name: "Necesito excluir uno o más de estos ingredientes",
      }),
    );
    next();
    expect(screen.getByRole("alert").textContent).toMatch(/Confirma/);
    for (const label of ["Soya", "Ajonjolí / sésamo", "Mariscos", "Maní"])
      expect(screen.getByRole("checkbox", { name: label })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Soya" }));
    fireEvent.click(
      screen.getByRole("radio", { name: "Ninguna de las opciones indicadas" }),
    );
    next();
    expect(
      screen.getByRole("heading", { name: "Tu guía, antes de guardarla." }),
    ).toBeTruthy();
    expect(screen.getByText(/Ninguno de los indicados/)).toBeTruthy();
  });

  it("guarda sexo, modalidad, alergias, restricción de lactosa y favoritos separados", () => {
    const store = new FitStore("expanded-saved"),
      done = vi.fn();
    render(<Onboarding store={store} onDone={done} />);
    scope();
    profile("female");
    goal();
    agenda();
    fireEvent.click(
      screen.getByRole("radio", {
        name: "Necesito excluir uno o más de estos ingredientes",
      }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "Soya" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Maní" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Evitar lactosa" }));
    fireEvent.click(screen.getByText("Ingredientes que disfrutas · opcional"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Arroz blanco" }));
    next();
    expect(
      screen.getByText(/Caminata\. Preferencia de bajo impacto/),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar y usar esta guía" }),
    );
    expect(done).toHaveBeenCalledTimes(1);
    const saved = store.list("user_profiles")[0].data.personalization;
    expect(saved.sex).toBe("female");
    expect(saved.version).toBe(2);
    expect(saved.cardioChoices).toEqual(["walk"]);
    expect(saved.trainingStyle).toBe("mixed");
    expect(saved.excluded).toEqual(["soy", "peanut"]);
    expect(saved.allergyReviewed).toBe(true);
    expect(saved.dietaryRestrictions).toEqual(["lactose"]);
    expect(saved.favoriteIngredients).toEqual(["rice"]);
  });

  it("muestra estaciones y tiempos del circuito antes de guardarlo", () => {
    render(
      <Onboarding store={new FitStore("circuit-preview")} onDone={() => {}} />,
    );
    scope();
    profile();
    goal("circuit");
    agenda();
    foodReview();
    expect(
      screen.getByRole("heading", { name: "Tu guía, antes de guardarla." }),
    ).toBeTruthy();
    expect(screen.getAllByText(/vueltas/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/repeticiones de referencia por estación/).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/s de trabajo/).length).toBeGreaterThan(0);
  });

  it("reabre respuestas antiguas sin perder preferencias y solicita las preguntas nuevas", () => {
    const store = new FitStore("legacy-edit");
    store.save(
      "user_profiles",
      {
        personalization: {
          age: "30-49",
          unit: "lb",
          weight: "",
          activity: "standing",
          experience: "regular",
          goal: "muscle",
          equipment: "gym",
          cardio: "both",
          days: [2, 5],
          minutes: 45,
          horizon: "3-6",
          preference: "omnivore",
          excluded: ["egg"],
          professionalSupport: "no",
          dietaryCare: "no",
          consent: true,
        },
      },
      { id: "profile" },
    );
    render(<Onboarding store={store} onDone={() => {}} />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Entiendo el alcance/ }),
    );
    next();
    expect(
      (screen.getByRole("combobox", { name: "Sexo biológico" }) as HTMLSelectElement)
        .value,
    ).toBe("");
    profile();
    goal();
    expect(
      (screen.getByRole("checkbox", { name: /^Caminata / }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (
        screen.getByRole("checkbox", {
          name: /^Cuica \/ saltar la cuerda /,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(
      (screen.getByRole("checkbox", { name: "Martes" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      (screen.getByRole("checkbox", { name: "Viernes" }) as HTMLInputElement)
        .checked,
    ).toBe(true);
    expect(
      store.list("user_profiles")[0].data.personalization.excluded,
    ).toEqual(["egg"]);
  });

  it("menores conservan el acceso al registro manual sin pedir sexo ni generar una rutina", () => {
    const store = new FitStore("minor-manual"),
      done = vi.fn();
    render(<Onboarding store={store} onDone={done} />);
    choose("¿En qué grupo de edad estás?", "under18");
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Entiendo el alcance/ }),
    );
    next();
    expect(screen.queryByRole("combobox", { name: "Sexo biológico" })).toBeNull();
    fireEvent.change(screen.getByRole("textbox",{name:/Tu nombre o apodo/}),{target:{value:"Alex"}});
    fireEvent.click(
      screen.getByRole("button", { name: "Usar solo registro manual" }),
    );
    expect(done).toHaveBeenCalledTimes(1);
    expect(
      store.list("workout_plans").every((r) => r.data.exerciseIds.length === 0),
    ).toBe(true);
    expect(
      store.list("meal_plans").every((r) => r.data.meals.length === 0),
    ).toBe(true);
  });
});
