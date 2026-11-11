import { describe, expect, it } from "vitest";
import { exercises, recommendLoad, type Exercise } from "../src/data/training";

const exercise = (id: string) => exercises.find((e) => e.id === id) as Exercise;
const topSets = (e: Exercise, weightLb = 0) =>
  Array.from({ length: e.sets }, () => ({
    weightLb,
    reps: e.maxReps,
    rir: 2,
    techniqueGood: true,
    completed: true,
    sessionId: "latest",
  }));

describe("Progresión de variantes domésticas sin lastre", () => {
  it.each(["chair-squat", "glute-bridge", "wall-push-up"])(
    "%s conserva BW después de completar el rango con margen",
    (id) => {
      const e = exercise(id);
      const recommendation = recommendLoad(e, topSets(e));
      expect(recommendation).toMatchObject({
        weightLb: 0,
        action: "maintain",
        provisional: false,
      });
      expect(recommendation.reason).toContain("BW");
      expect(recommendation.reason).toMatch(/control|técnica/);
    },
  );
  it.each(["chair-squat", "glute-bridge", "wall-push-up"])(
    "%s mantiene la recomendación sin lastre aunque exista una carga externa anterior",
    (id) => {
      const e = exercise(id);
      expect(recommendLoad(e, topSets(e, 10))).toMatchObject({
        weightLb: 0,
        action: "maintain",
      });
      expect(recommendLoad({ ...e, trialLb: 10 }, [])).toMatchObject({
        weightLb: 0,
        action: "trial",
        provisional: true,
      });
    },
  );
  it.each(["dumbbell-row", "dumbbell-rdl"])(
    "%s sigue permitiendo doble progresión con mancuernas",
    (id) => {
      const e = exercise(id);
      expect(recommendLoad(e, topSets(e, 10))).toMatchObject({
        weightLb: 10 + e.stepLb,
        action: "increase",
        provisional: false,
      });
    },
  );
  it("conserva el comportamiento de las push-ups originales", () => {
    const e = exercise("push-ups");
    expect(recommendLoad(e, topSets(e, 5))).toMatchObject({
      weightLb: 5 + e.stepLb,
      action: "increase",
    });
  });
});
