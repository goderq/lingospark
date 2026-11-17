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

assert.equal(evaluateExercise({ answer: 'Мне не нужно идти' }, 'Мне нужно не идти').correct, false, 'negation attachment changes the meaning');
assert.equal(evaluateExercise({ answer: 'Я не могу этого сделать' }, 'Не могу я этого сделать').correct, true, 'natural Russian order keeps negation attached');
assert.equal(evaluateExercise({ answer: 'I am ready' }, 'I’m ready').correct, true);
assert.equal(evaluateExercise({ answer: 'I cannot agree' }, "I can't agree").correct, true);
assert.equal(evaluateExercise({ answer: "I can't agree" }, 'I can agree').status, 'wrong', 'removing English negation must not be merely close');
assert.equal(evaluateExercise({ answer: 'She has finished' }, 'She finished').correct, false);
console.log("exercise engine passed: scripts, accepted variants, punctuation, contractions, Russian word order, negation attachment and English tense changes");
