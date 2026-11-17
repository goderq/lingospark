import { learningJourneys, getJourney } from '../data/learningJourney.js';
import { isJourneyUnlocked, stageAvailable } from './learningJourney.js';

export function nextLearningStep(progress, requestedId) {
  const requested = getJourney(requestedId);
  const first = learningJourneys.find(topic => !progress.completed?.includes(topic.id));
  const topic = requested && isJourneyUnlocked(progress, requested.id) ? requested : first || learningJourneys[0];
  const draft = progress.journeys?.[topic.id]?.draft;
  const stage = topic.stages.find(item => item.id === draft?.stageId && stageAvailable(progress, topic.id, item.id)) || topic.stages.find(item => !progress.journeys?.[topic.id]?.stages?.[item.id]?.completedAt);
  return { topicId: topic.id, title: topic.title, stageId: stage?.id || null, stageTitle: stage?.title || 'Самопроверка темы', resumed: !!draft && stage?.id === draft.stageId, locked: !!requested && requested.id !== topic.id };
}

export function readQuickSession(saved, progress) {
  if (!saved || saved.version !== 1 || typeof saved.id !== 'string' || !getJourney(saved.topicId) || !isJourneyUnlocked(progress, saved.topicId) || !Number.isInteger(saved.step) || saved.step < 0 || saved.step > 3 || !Array.isArray(saved.results) || saved.results.length !== saved.step) return null;
  const journey = getJourney(saved.topicId);
  if (saved.stageId && !journey.stages.some(item => item.id === saved.stageId && stageAvailable(progress, journey.id, item.id))) return null;
  if (saved.results.some(item => !item || !Number.isInteger(item.correct) || !Number.isInteger(item.total) || item.correct < 0 || item.total < item.correct || typeof item.skipped !== 'boolean')) return null;
  return saved;
}
