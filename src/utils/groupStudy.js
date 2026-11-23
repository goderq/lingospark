import { getJourney, learningJourneys } from '../data/learningJourney.js';

const PREFIX = 'group-study-';
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export const groupPracticeKey = id => PREFIX + id;
export const groupTopics = learningJourneys.map(({ id, title, level }) => ({ id, title, level }));
export const groupTopicName = id => getJourney(id)?.title;

export function groupPracticeDeck(topicId, perStage = 2) {
  const journey = getJourney(topicId);
  if (!journey) return [];
  return journey.stages.flatMap(stage => stage.exercises.slice(0, perStage).map(item => ({
    ...item, topic: journey.title, skill: stage.skill, context: item.context || item.line,
  }))).slice(0, 10);
}

export function recordGroupStudy(progress, key, grade) {
  if (typeof key !== 'string' || !key.startsWith(PREFIX)) return progress;
  const assignment = key.slice(PREFIX.length);
  if (!uuid.test(assignment)) return progress;
  const previous = progress.groupStudyResults?.[assignment];
  if (!grade && previous) return progress;
  const result = grade ? { status: 'completed', correct: grade.correct, total: grade.total } : { status: 'started' };
  return { ...progress, groupStudyResults: { ...progress.groupStudyResults, [assignment]: result } };
}

export const groupDueDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('.') : '—';
