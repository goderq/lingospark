const assert = require("node:assert/strict");
const {
  chooseInitialProgressSource,
  learningProgressScore,
} = require("../src/utils/cloudSyncRules");

const fresh = { onboarded: true, name: "Новый профиль", settings: {} };
const learned = { ...fresh, totalXP: 120, completed: ["intro"] };
const wordsLearned = {
  ...fresh,
  reviewStats: { hello: { interval: 2, correct: 1 } },
};
const older = "2026-11-10T10:00:00.000Z";
const newer = "2026-11-11T10:00:00.000Z";

assert.equal(learningProgressScore(fresh), 0);
assert.ok(learningProgressScore(learned) > 0);
assert.ok(learningProgressScore(wordsLearned) > 0);

assert.equal(
  chooseInitialProgressSource({
    local: fresh,
    cloud: learned,
    localUpdatedAt: newer,
    cloudUpdatedAt: older,
  }),
  "cloud",
  "reinstall must restore cloud even when onboarding made local data newer",
);
assert.equal(
  chooseInitialProgressSource({
    local: learned,
    cloud: fresh,
    localUpdatedAt: older,
    cloudUpdatedAt: newer,
  }),
  "local",
  "an empty cloud row must not erase real local learning",
);
assert.equal(
  chooseInitialProgressSource({
    local: { ...learned, totalXP: 200 },
    cloud: learned,
    localUpdatedAt: newer,
    cloudUpdatedAt: older,
  }),
  "local",
  "newer offline learning must upload",
);
assert.equal(
  chooseInitialProgressSource({
    local: learned,
    cloud: { ...learned, totalXP: 200 },
    localUpdatedAt: older,
    cloudUpdatedAt: newer,
  }),
  "cloud",
  "newer cloud learning must restore",
);
assert.equal(
  chooseInitialProgressSource({ local: learned, cloud: null }),
  "local",
  "a new account must upload its local progress",
);

console.log("cloud sync rules: 5 scenarios passed");
