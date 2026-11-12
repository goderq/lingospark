import assert from "node:assert/strict";
import { evaluateExercise } from "../src/utils/answer.js";

assert.equal(
  evaluateExercise({ answer: "Я хотел бы записаться на приём" }, "На прием я хотел бы записаться").correct,
  true,
  "natural Russian word order and е/ё must be accepted",
);
assert.equal(
  evaluateExercise({ answer: "Я согласен" }, "I agree — я согласен").correct,
  false,
  "a bilingual answer must not be accepted",
);
assert.equal(
  evaluateExercise({ answer: "Could you help me?" }, "could you help me").correct,
  true,
  "case and punctuation must not change correctness",
);
assert.equal(
  evaluateExercise(
    { answer: "I have already finished", answers: ["I've already finished"] },
    "I've already finished",
  ).correct,
  true,
  "accepted variants must use the same evaluator",
);
assert.equal(
  evaluateExercise({ answer: "She has lived here for five years" }, "She lived here five years").correct,
  false,
  "a changed tense must remain incorrect",
);

console.log("exercise engine: 5 shared evaluation scenarios passed");
