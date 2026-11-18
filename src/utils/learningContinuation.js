import { learningJourneys, getJourney } from '../data/learningJourney.js';
import { isJourneyUnlocked, stageAvailable, readJourneyDraft } from './learningJourney.js';
import { readLessonSession } from './lessonSession.js';
import { validatePracticeSession } from './unifiedReview.js';

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

export function savedStudyTargets(progress, lessons) {
  const targets = [];
  const quick = readQuickSession(progress.quickSession, progress);
  if (quick && quick.step < 3) targets.push({ type: 'quickSession', id: quick.id });
  const lesson = lessons.find(item => item.id === progress.lessonDraft?.lessonId);
  if (lesson && readLessonSession(lesson, progress.lessonDraft).lessonId) targets.push({ type: 'lesson', id: lesson.id });
  for (const [topicId, entry] of Object.entries(progress.journeys || {})) {
    const draft = entry?.draft;
    if (draft && stageAvailable(progress, topicId, draft.stageId) && readJourneyDraft(topicId, draft.stageId, draft).attemptId) {
      targets.push({ type: 'journey', id: topicId, stageId: draft.stageId });
    }
  }
  return targets;
}

export function todayStudyAction(progress, lessons, reviewCount) {
  const target = savedStudyTargets(progress, lessons)[0];
  if (target) return { kind: 'resume', target };
  const draft = progress.practiceDrafts?.['unified-review'];
  if (draft?.mode === 'review' && validatePracticeSession(draft)) {
    return { kind: 'resume', target: { type: 'unifiedReview' } };
  }
  if (reviewCount) return { kind: 'review', count: reviewCount, target: { type: 'unifiedReview' } };
  if (learningJourneys.every(topic => progress.completed?.includes(topic.id))) return { kind: 'browse', target: { type: 'learn' } };
  const step = nextLearningStep(progress);
  return { kind: 'next', step, target: { type: step.stageId ? 'journey' : 'courseTest', id: step.topicId, stageId: step.stageId } };
}
