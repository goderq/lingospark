import { groupPracticeDeck } from './groupStudy.js';

const DAY = 86400000;
const idPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
export const eventFormats = { mixed: 'Смешанная практика', listening: 'Аудирование', dialogue: 'Диалог', phrases: 'Собрать фразы' };
const formatSkills = { listening: 'listening', dialogue: 'conversation', phrases: 'writing' };

export const eventPracticeDeck = (topic, format) => formatSkills[format]
  ? groupPracticeDeck(topic, 5, formatSkills[format]) : groupPracticeDeck(topic, 1);

export const eventDate = now => new Date(now).toISOString().slice(0, 10);

export function eventDay(event, now = Date.now()) {
  return Math.floor((Date.parse(eventDate(now)) - Date.parse(event.starts_on)) / DAY);
}

export const eventPracticeKey = (eventId, index) => 'study-event-' + eventId + '-' + index;

export function canOpenEventDay(event, index, now = Date.now()) {
  const day = eventDay(event, now);
  return Number.isInteger(index) && index >= 0 && index <= day && day < event.topics.length;
}

export function joinStudyEvent(progress, event, now = Date.now(), started = false) {
  if (!event || !idPattern.test(event.id) || !Array.isArray(event.topics) || !event.topics.length ||
    !(eventDay(event, now) < event.topics.length)) return progress;
  const previous = progress.studyEventResults?.[event.id];
  if (previous && (!started || previous.started || Object.keys(previous.days || {}).length)) return progress;
  const entry = { name: event.name, days: {}, ...previous, joined: true, ...(started && { started: true }) };
  return { ...progress, studyEventResults: { ...progress.studyEventResults, [event.id]: entry } };
}

export function recordStudyEvent(progress, draftKey, assignment, now, grades) {
  const event = assignment?.event;
  const index = assignment?.index;
  if (!event || !idPattern.test(event.id) || draftKey !== eventPracticeKey(event.id, index) || !canOpenEventDay(event, index, now)) {
    return progress;
  }
  const previous = progress.studyEventResults?.[event.id];
  if (previous?.days?.[index]) return progress;
  const days = { ...previous?.days, [index]: true };
  const badgeAt = previous?.badgeAt || (event.topics.every((_, day) => days[day]) ? now : null);
  const answers = Object.fromEntries(grades.map(({ item, correct }) => [item.id, correct]));
  const { id, name, starts_on, ends_on, topics, formats } = event;
  const entry = { ...previous, name, joined: true, started: true, days, badgeAt,
    event: { id, name, starts_on, ends_on, topics, formats },
    answers: { ...previous?.answers, [index]: answers } };
  return { ...progress, studyEventResults: { ...progress.studyEventResults, [event.id]: entry } };
}

export const eventBadges = progress => Object.entries(progress.studyEventResults || {})
  .filter(([, item]) => item?.badgeAt).sort((a, b) => b[1].badgeAt - a[1].badgeAt)
  .map(([id, item]) => ({ id, name: item.name }));

export const eventHistory = progress => Object.entries(progress.studyEventResults || {})
  .filter(([id, item]) => item?.event?.id === id && Array.isArray(item.event.topics) && item.event.topics.length)
  .sort(([, a], [, b]) => String(b.event.starts_on).localeCompare(String(a.event.starts_on)))
  .map(([id, { name, event, badgeAt }]) => ({ id, name, event, badgeAt }));
