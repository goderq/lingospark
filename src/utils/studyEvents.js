const DAY = 86400000;
const idPattern = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export const eventDate = now => new Date(now).toISOString().slice(0, 10);

export function eventDay(event, now = Date.now()) {
  return Math.floor((Date.parse(eventDate(now)) - Date.parse(event.starts_on)) / DAY);
}

export const eventPracticeKey = (eventId, index) => 'study-event-' + eventId + '-' + index;

export function canOpenEventDay(event, index, now = Date.now()) {
  const day = eventDay(event, now);
  return Number.isInteger(index) && index >= 0 && index <= day && day < event.topics.length;
}

export function recordStudyEvent(progress, draftKey, assignment, now) {
  const event = assignment?.event;
  const index = assignment?.index;
  if (!event || !idPattern.test(event.id) || draftKey !== eventPracticeKey(event.id, index) || !canOpenEventDay(event, index, now)) {
    return progress;
  }
  const previous = progress.studyEventResults?.[event.id];
  if (previous?.days?.[index]) return progress;
  const days = { ...previous?.days, [index]: true };
  const badgeAt = previous?.badgeAt || (event.topics.every((_, day) => days[day]) ? now : null);
  const entry = { name: event.name, days, badgeAt };
  return { ...progress, studyEventResults: { ...progress.studyEventResults, [event.id]: entry } };
}

export const eventBadges = progress => Object.entries(progress.studyEventResults || {})
  .filter(([, item]) => item?.badgeAt).sort((a, b) => b[1].badgeAt - a[1].badgeAt)
  .map(([id, item]) => ({ id, name: item.name }));
