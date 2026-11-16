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
