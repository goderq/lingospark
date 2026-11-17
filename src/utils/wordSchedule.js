const DAY = 86400000;
export const wordEstablished = stats => (stats?.interval || 0) >= 14 && (stats?.successfulDays || 0) >= 3;
export function advanceWordReview(previous = {}, correct, now = Date.now(), independent = true) {
  const today = new Date(now).toISOString().slice(0, 10);
  const due = !previous.dueDate || previous.dueDate <= today;
  const eligible = independent && due && previous.lastReviewDate !== today;
  const interval = !correct ? 0 : eligible ? [1, 3, 7, 14, 30].find(value => value > (previous.interval || 0)) || 30 : previous.interval || 1;
  const successfulDays = !correct ? 0 : (previous.successfulDays || 0) + (eligible ? 1 : 0);
  const dueDate = correct && !eligible && previous.dueDate > today ? previous.dueDate : new Date(now + (correct ? interval : 0) * DAY).toISOString().slice(0, 10);
  return { ...previous, total: (previous.total || 0) + 1, correct: (previous.correct || 0) + (correct ? 1 : 0), interval, dueDate, successfulDays, lastReviewDate: today };
}
