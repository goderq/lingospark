const arraySize = (value) => (Array.isArray(value) ? value.length : 0);
const objectSize = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value).length
    : 0;
const positive = (value) =>
  Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;

// Profile fields, settings and onboarding are deliberately excluded. A fresh
// installation changes those values before sign-in, but that is not learning
// progress and must never win over an existing cloud save.
function learningProgressScore(progress = {}) {
  const arrays = [
    "completed",
    "completedTenses",
    "completedBosses",
    "completedGrammarTracks",
    "writingCompleted",
    "workCompleted",
    "readingCompleted",
    "careerCompleted",
    "notebook",
    "favorites",
    "mistakes",
    "ownedRewards",
    "customWords",
  ];
  const maps = [
    "levelExamBest",
    "lexicalReviewStats",
    "branchingResults",
    "marathons",
    "dailyExams",
    "courseCheckpoints",
    "lessonResults",
    "dailyChallenges",
    "missionResults",
    "reviewStats",
    "practiceResults",
    "reviewQueue",
    "activity",
  ];

  let score = arrays.reduce(
    (sum, key) => sum + arraySize(progress[key]) * 10,
    0,
  );
  score += maps.reduce(
    (sum, key) => sum + objectSize(progress[key]) * 10,
    0,
  );
  score += Object.values(progress.groupStudyResults || {}).filter(result => result?.status === 'completed').length * 10;
  // Opening a topic creates a draft, but is not completed learning. Only
  // actual submitted answers/attempts may compete with an existing cloud save.
  for (const topic of Object.values(progress.journeys || {})) {
    score += Object.values(topic?.stages || {}).reduce((sum, stage) => sum + positive(stage?.attempts) * 10, 0);
    score += arraySize(topic?.draft?.responses) * 10;
  }
  score += Object.values(progress.practiceDrafts || {}).reduce((sum, draft) => sum + arraySize(draft?.responses) * 10, 0);
  score += Object.values(progress.studyDrafts || {}).reduce((sum, draft) => sum + (draft?.selected || draft?.index > 0 || draft?.gateSelected || draft?.gateIndex > 0 ? 10 : 0), 0);
  score += [
    "totalXP",
    "dailyXP",
    "streak",
    "tenseExamBest",
    "c1ExamBest",
    "fullIeltsBest",
    "coins",
  ].reduce((sum, key) => sum + positive(progress[key]), 0);

  const stats = progress.stats || {};
  score += Object.values(stats).reduce(
    (sum, value) => sum + positive(value),
    0,
  );
  const actions = progress.dailyActions || {};
  score += Object.entries(actions).reduce(
    (sum, [key, value]) => sum + (key === "date" ? 0 : positive(value)),
    0,
  );

  const words = progress.wordPreferences || {};
  score +=
    arraySize(words.favorites) * 10 +
    arraySize(words.hard) * 10 +
    arraySize(words.hidden) * 10 +
    objectSize(words.customTranslations) * 10;

  const ielts = progress.ieltsProgress || {};
  score += positive(ielts.readingBest) + positive(ielts.listeningBest);
  score +=
    arraySize(ielts.writingCompleted) * 10 +
    arraySize(ielts.speakingCompleted) * 10;

  for (const story of [progress.storyGame, progress.seasonTwo]) {
    score += positive(story?.chapter) + positive(story?.score);
    score += arraySize(story?.choices) * 10;
    if (story?.completed) score += 10;
  }

  const world = progress.world || {};
  score +=
    arraySize(world.completed) * 10 +
    arraySize(world.inventory) * 10 +
    arraySize(world.history) * 10 +
    arraySize(world.messages) * 10 +
    arraySize(world.homeItems) * 10;
  score +=
    objectSize(world.stars) * 10 +
    objectSize(world.decisions) * 10 +
    objectSize(world.relationships) * 10 +
    objectSize(world.events) * 10 +
    objectSize(world.replies) * 10;
  score += positive(world.reputation);
  if (world.career) score += 10;
  for (const path of Object.values(world.lifePaths || {})) {
    score += arraySize(path.completed) * 10 + objectSize(path.decisions) * 10 + arraySize(path.endings) * 10;
  }
  if (world.rental?.completed) score += 10;
  score += arraySize(world.rentalHistory) * 10;
  if (world.draft || world.pathDraft) score += 10;
  if (progress.c1Certificate || progress.unlockedAll || progress.lessonDraft)
    score += 10;

  return score;
}

function chooseInitialProgressSource({
  local,
  cloud,
  localUpdatedAt,
  cloudUpdatedAt,
}) {
  if (!cloud || !objectSize(cloud)) return "local";

  const localScore = learningProgressScore(local);
  const cloudScore = learningProgressScore(cloud);

  // The cloud is the canonical copy after reinstall. This also restores the
  // user's profile/settings when neither side has completed learning yet.
  if (localScore === 0) return "cloud";
  if (cloudScore === 0) return "local";

  const localTime = Date.parse(localUpdatedAt || "");
  const cloudTime = Date.parse(cloudUpdatedAt || "");
  if (!Number.isFinite(localTime)) return "cloud";
  if (!Number.isFinite(cloudTime)) return "local";
  return localTime > cloudTime ? "local" : "cloud";
}

function chooseAccountBootstrap({ localOwner, userId, cloud, ...progressState }) {
  if (localOwner && userId && localOwner !== userId) {
    return cloud && objectSize(cloud) ? "cloud" : "clean";
  }
  return chooseInitialProgressSource({ cloud, ...progressState });
}

module.exports = {
  chooseAccountBootstrap,
  chooseInitialProgressSource,
  learningProgressScore,
};
