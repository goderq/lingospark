import { eventDay } from './studyEvents.js';
import { localDay } from './notificationPlans.js';

export function planEventReminders({ events, enabled, results = {}, hour, now = Date.now() }) {
  const plans = new Map();
  for (const event of events) {
    const result = results[event.id];
    if (!enabled[event.id] || !result || result.badgeAt || !Number.isFinite(Date.parse(event.starts_on))) continue;
    const date = new Date(Math.max(now, Date.parse(event.starts_on)));
    date.setHours(hour, 0, 0, 0);
    for (let offset = 0; offset <= event.topics.length; offset++, date.setDate(date.getDate() + 1)) {
      const fireAt = date.getTime();
      const day = eventDay(event, fireAt);
      if (fireAt <= now || day < 0 || day >= event.topics.length ||
        !event.topics.some((_, index) => index <= day && !result.days?.[index])) continue;
      const key = localDay(fireAt);
      if (!plans.has(key)) plans.set(key, { eventId: event.id, title: event.name, fireAt, day: key });
    }
  }
  return [...plans.values()].sort((first, second) => first.fireAt - second.fireAt).slice(0, 15);
}
