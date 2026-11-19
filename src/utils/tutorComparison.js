import { assertTutorReplyNotAborted } from './tutorReply.js';
import { now } from './performance.js';

export const tutorComparisonModels = ['llama-3.2-1b', 'gemma-3-1b'];
const turn = (role, content) => ({ role, content });
export const tutorComparisonCases = [
  {
    id: 'detail', title: 'Короткий ответ с деталью',
    messages: [
      turn('user', 'I play football on Saturdays.'),
      turn('assistant', 'Do you usually play with friends or with a team?'),
      turn('user', 'With friends.'),
    ],
  },
  {
    id: 'yes', title: 'Согласие и следующий шаг',
    messages: [
      turn('user', 'I need a train ticket to York.'),
      turn('assistant', 'Would you like to take the morning train?'),
      turn('user', 'Yes.'),
    ],
  },
  {
    id: 'clarify', title: 'Уточнение предыдущего вопроса',
    messages: [
      turn('user', 'I like football, but I only play at weekends.'),
      turn('assistant', 'Do you play in a league?'),
      turn('user', 'What?'),
    ],
  },
];

export async function runTutorComparison({ models, loadModel, completeTutorMessage, signal, onUpdate, clock = now }) {
  const results = [];
  for (const model of models) {
    assertTutorReplyNotAborted(signal);
    const title = model.shortTitle || model.title;
    onUpdate?.({ model: title });
    try {
      await loadModel(model);
    } catch (error) {
      assertTutorReplyNotAborted(signal);
      results.push({ modelId: model.id, title, error: error.message, cases: [] });
      continue;
    }
    const cases = [];
    for (const scenario of tutorComparisonCases) {
      assertTutorReplyNotAborted(signal);
      onUpdate?.({ model: title, scenario: scenario.title });
      const started = clock();
      try {
        const result = await completeTutorMessage({
          model, level: 'A2', topic: 'Свободный разговор', messages: scenario.messages, signal,
        });
        assertTutorReplyNotAborted(signal);
        cases.push({ id: scenario.id, title: scenario.title, durationMs: Math.round(clock() - started),
          reply: result.text, source: result.quality?.source || 'model', rewritten: result.quality?.checked === 'repaired' });
      } catch (error) {
        assertTutorReplyNotAborted(signal);
        cases.push({ id: scenario.id, title: scenario.title, durationMs: Math.round(clock() - started), error: error.message });
      }
    }
    results.push({ modelId: model.id, title, cases });
  }
  return results;
}
