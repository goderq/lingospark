export const mainTabs = [
  ['home', 'sparkles', 'Сегодня'], ['learn', 'map', 'Обучение'],
  ['world', 'earth', 'Жизнь'], ['ai', 'chatbubbles', 'ИИ'], ['profile', 'person-circle', 'Профиль'],
];
// Old shortcuts and saved recents keep working after moving words into Learning.
export function navigationTarget(target) {
  if (mainTabs.some(([id]) => id === target)) return { tab: target, overlay: null };
  if (target === 'lingoWorld') return { tab: 'world', overlay: null };
  if (target === 'course' || target === 'review') return { tab: 'learn', overlay: { type: target } };
  return { overlay: { type: target } };
}

export function practiceAlias(type) {
  if (['practice', 'adaptive', 'skillSprint', 'dailyChallenge'].includes(type)) return { initialMode: 'learn' };
  if (['unifiedReview', 'reviewCalendar', 'spaced', 'spacedRepetition', 'weakTenses', 'mistakes'].includes(type)) return { review: true };
  if (['tenseChallenge', 'dailyMixedExam'].includes(type)) return { initialMode: 'exam', initialSkill: 'grammar' };
  if (type === 'writtenVocabulary') return { initialSkill: 'vocabulary' };
  if (type === 'sentenceBuilder') return { initialSkill: 'writing' };
  return null;
}
