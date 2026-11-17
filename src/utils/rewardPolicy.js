const practice = new Set(['recordReview', 'recordDictation', 'recordGrammar']);
const noScore = new Set(['recordDialogue', 'recordStory', 'saveStoryGame', 'saveSeasonTwo', 'recordLexiconReview']);

export function applyRewardPolicy(previous, next, action, now = Date.now()) {
  if (!action || next === previous || ['restoreProgress', 'reset', 'finishOnboarding'].includes(action.name)) return next;
  const earned = (next.coins || 0) - (previous.coins || 0);
  if (earned <= 0) return next;
  const { name, args } = action;
  let eligible = !noScore.has(name);
  if (name === 'completeLesson' && previous.completed?.includes(args[0]?.id)) eligible = false;
  if (name === 'resolveMistake' && !previous.mistakes?.some(item => item.id === args[0])) eligible = false;
  if (practice.has(name) && args[1] !== true) eligible = false;
  const entity = args[0]?.id || (typeof args[0] === 'string' ? args[0] : 'session');
  const score = name === 'recordMission' || name === 'recordBranchingDialogue' ? args[2] : null;
  if (name === 'recordMission' && previous.missionResults?.[entity] && score <= previous.missionResults[entity].score) eligible = false;
  if (name === 'recordBranchingDialogue' && previous.branchingResults?.[entity] && score <= previous.branchingResults[entity].score) eligible = false;
  if (name === 'recordExam' && args[0] <= (previous.stats?.examBest || 0)) eligible = false;
  if (name === 'recordTenseExam' && args[0] <= (previous.tenseExamBest || 0)) eligible = false;
  if (name === 'recordFullIelts' && args[0] <= (previous.fullIeltsBest || 0)) eligible = false;
  if (name === 'completeCourseCheckpoint' && args[1] <= (previous.courseCheckpoints?.[args[0]] || 0)) eligible = false;
  if (name === 'recordLevelExam' && args[1] <= (previous.levelExamBest?.[args[0]] || 0)) eligible = false;
  if (name === 'recordC1Exam' && args[0] <= (previous.c1ExamBest || 0)) eligible = false;
  const date = new Date(now).toISOString().slice(0, 10);
  const ledger = previous.rewardLedger?.date === date ? previous.rewardLedger : { date, keys: [], earned: 0 };
  const key = `${name}:${entity}`;
  if (!eligible || ledger.keys.includes(key) || ledger.keys.length >= 5000) return { ...next, coins: previous.coins || 0 };
  const granted = earned;
  return { ...next, coins: (previous.coins || 0) + granted, rewardLedger: { date, keys: [...ledger.keys, key], earned: ledger.earned + granted } };
}
