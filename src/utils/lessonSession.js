export const lessonContentKey = lesson => {
  const content = JSON.stringify(lesson.exercises.map(({ id, type, prompt, answer, answers, options }) => ({ id, type, prompt, answer, answers, options })));
  let hash = 2166136261;
  for (let i = 0; i < content.length; i++) hash = Math.imul(hash ^ content.charCodeAt(i), 16777619);
  return `${lesson.id}:${hash >>> 0}`;
};

export function readLessonSession(lesson, draft) {
  if (!draft || draft.lessonId !== lesson.id || draft.version !== 2 || draft.contentKey !== lessonContentKey(lesson)) return {};
  if (!Number.isInteger(draft.index) || draft.index < 0 || draft.index >= lesson.exercises.length) return {};
  if (!Number.isInteger(draft.correctCount) || draft.correctCount < 0 || draft.correctCount > draft.index + (draft.checked ? 1 : 0)) return {};
  if (!Array.isArray(draft.lessonMistakes) || draft.lessonMistakes.some(entry => !lesson.exercises.some(e => e.id === entry.exercise?.id))) return {};
  if (new Set(draft.lessonMistakes.map(entry => entry.exercise.id)).size !== draft.lessonMistakes.length) return {};
  if (draft.correctCount + draft.lessonMistakes.length !== draft.index + (draft.checked ? 1 : 0)) return {};
  if (draft.remediation && (!draft.lessonMistakes.length || !Number.isInteger(draft.remediationIndex) || draft.remediationIndex >= draft.lessonMistakes.length || draft.remediationIndex < 0)) return {};
  if (draft.conversation && ![0, 1].includes(draft.conversationStep)) return {};
  return draft;
}
