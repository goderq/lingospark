import { getJourney, learningJourneys } from '../data/learningJourney.js';
import { evaluateExercise } from './answer.js';
import { trainingPassed } from './trainingResult.js';

export function courseTestPassed(progress, lesson, result) {
  const journey = getJourney(lesson?.id);
  if (!journey || result?.source !== 'course-test' || result.total !== lesson.exercises.length || !trainingPassed(result.correct, result.total)) return false;
  if (!isJourneyUnlocked(progress, lesson.id)) return false;
  return progress.completed?.includes(lesson.id) || journey.stages.every(stage => progress.journeys?.[lesson.id]?.stages?.[stage.id]?.completedAt);
}

export function stageAvailable(progress, topicId, stageId) {
  const journey = getJourney(topicId);
  const index = journey?.stages.findIndex(stage => stage.id === stageId) ?? -1;
  return isJourneyUnlocked(progress, topicId) && index >= 0 && journey.stages.slice(0, index).every(stage => progress.journeys?.[topicId]?.stages?.[stage.id]?.completedAt);
}

export function isJourneyUnlocked(progress, topicId) {
  const index = learningJourneys.findIndex(journey => journey.id === topicId);
  return index >= 0 && learningJourneys.slice(0, index).every(journey => progress.completed?.includes(journey.id));
}

export function gradeJourneyStage(topicId, stageId, responses) {
  const stage = getJourney(topicId)?.stages.find(item => item.id === stageId);
  if (!stage || !Array.isArray(responses) || responses.length !== stage.exercises.length) return null;
  if (responses.some((response, index) => !response || response.id !== stage.exercises[index].id || typeof response.input !== 'string')) return null;
  const correct = stage.exercises.filter((exercise, i) => evaluateExercise(exercise, responses[i].input).correct).length;
  const accuracy = Math.round(correct / stage.exercises.length * 100);
  return { correct, total: stage.exercises.length, accuracy, passed: accuracy >= 80 };
}

export function readJourneyDraft(topicId, stageId, draft) {
  const stage = getJourney(topicId)?.stages.find(item => item.id === stageId);
  if (!stage || !draft || draft.stageId !== stageId || draft.version !== 1 || typeof draft.attemptId !== 'string') return {};
  if (!Number.isInteger(draft.index) || draft.index < 0 || draft.index >= stage.exercises.length) return {};
  if (!Array.isArray(draft.responses) || draft.responses.length !== draft.index + (draft.checked ? 1 : 0)) return {};
  if (draft.responses.some((answer, i) => !answer || answer.id !== stage.exercises[i].id || typeof answer.input !== 'string')) return {};
  if (typeof draft.input !== 'string' || !Array.isArray(draft.built) || new Set(draft.built).size !== draft.built.length) return {};
  const exercise = stage.exercises[draft.index];
  if (draft.built.some(tile => !Number.isInteger(tile) || tile < 0 || tile >= (exercise.options?.length || 0))) return {};
  const current = exercise.type === 'build' ? draft.built.map(tile => exercise.options[tile]).join(' ') : draft.input;
  if (draft.checked && draft.responses[draft.index].input !== current) return {};
  return draft;
}

export function finishJourneyStage(progress, topicId, stageId, responses, attemptId, now = Date.now()) {
  if (!stageAvailable(progress, topicId, stageId) || !attemptId) return progress;
  const grade = gradeJourneyStage(topicId, stageId, responses);
  const topic = progress.journeys?.[topicId] || {};
  const previous = topic.stages?.[stageId] || {};
  if (!grade || previous.attemptId === attemptId) return progress;
  return { ...progress, journeys: { ...progress.journeys, [topicId]: {
    ...topic, draft: null,
    stages: { ...topic.stages, [stageId]: {
      attempts: (previous.attempts || 0) + 1, accuracy: grade.accuracy,
      bestAccuracy: Math.max(previous.bestAccuracy || 0, grade.accuracy),
      completedAt: previous.completedAt || (grade.passed ? now : null), lastAttemptAt: now, attemptId,
    } },
  } } };
}

export function skillEvidence(progress) {
  const labels = { vocabulary: 'Словарь', grammar: 'Грамматика', listening: 'Понимание на слух', writing: 'Письменные фразы', conversation: 'Диалог' };
  const result = Object.fromEntries(Object.keys(labels).map(id => [id, { id, title: labels[id], evidence: [], attempts: 0 }]));
  for (const [topicId, state] of Object.entries(progress.journeys || {})) {
    const journey = getJourney(topicId);
    if (!journey) continue;
    for (const stage of journey.stages) {
      const saved = state.stages?.[stage.id];
      if (!saved?.attempts) continue;
      result[stage.skill].attempts += saved.attempts;
      result[stage.skill].evidence.push({ title: `${journey.title} · ${stage.title}`, detail: `Последняя попытка ${saved.accuracy}% · лучший результат ${saved.bestAccuracy}%`, completed: !!saved.completedAt });
    }
  }
  const wordAttempts = Object.values(progress.reviewStats || {}).reduce((sum, entry) => sum + (entry.total || 0), 0);
  for (const skill of Object.values(result)) {
    const totals = Object.values(progress.practiceResults || {}).reduce((sum, session) => ({ total: sum.total + (session.skills?.[skill.id]?.total || 0), unaided: sum.unaided + (session.skills?.[skill.id]?.unaided || 0) }), { total: 0, unaided: 0 });
    if (totals.total) skill.evidence.push({ title: 'Последние сессии общей практики', detail: `Самостоятельно верно ${totals.unaided} из ${totals.total} · хранится до 50 последних сессий` });
  }
  if (wordAttempts) result.vocabulary.evidence.push({ title: 'Карточки слов', detail: `${wordAttempts} ответов · ${Object.keys(progress.reviewStats).length} слов в практике` });
  if (progress.completedTenses?.length) result.grammar.evidence.push({ title: 'Курс времён', detail: `${progress.completedTenses.length} блоков пройдено` });
  if (progress.completedGrammarTracks?.length) result.grammar.evidence.push({ title: 'Академия грамматики', detail: `${progress.completedGrammarTracks.length} курсов пройдено` });
  if (progress.stats?.dictationTotal) result.listening.evidence.push({ title: 'Диктанты', detail: `Верных ответов ${progress.stats.dictationCorrect || 0} из ${progress.stats.dictationTotal}` });
  if (progress.writingCompleted?.length) result.writing.evidence.push({ title: 'Письменные работы', detail: `${progress.writingCompleted.length} работ сохранено; само завершение не подтверждает правильность текста` });
  if (progress.stats?.dialoguesCompleted) result.conversation.evidence.push({ title: 'Учебные диалоги', detail: `${progress.stats.dialoguesCompleted} сцен завершено; это не оценка устной речи` });
  if (progress.completed?.length) result.grammar.evidence.push({ title: 'Курсы', detail: `${progress.completed.length} уроков пройдено; смешанные задания не дают отдельной оценки каждого навыка` });
  return Object.values(result);
}

export function courseTutorContext(practice, level, topic, progress = {}) {
  const journey = practice?.topicId ? getJourney(practice.topicId) : learningJourneys.find(item => item.ai.topic === practice?.topic);
  if (!journey || level !== journey.ai.level || topic !== journey.ai.topic) return '';
  const mistakes = (progress.mistakes || []).filter(item => practice.focusMistakeIds?.includes(item.id) && item.topic === journey.title).slice(0, 3);
  const focus = mistakes.length ? `\nМатериал для мягкого повторения: ${mistakes.map(item => `${item.prompt}: ${item.answer}`).join('; ')}. Не навязывай эти ошибки реплике, если ученик их не допустил.` : '';
  return `\nТЕКУЩАЯ ПРАКТИКА ПО УРОКУ «${journey.title}» (главная цель этого разговора): ${journey.ai.instruction}${focus}\nНе объявляй урок или уровень пройденным на основании разговора.`;
}
