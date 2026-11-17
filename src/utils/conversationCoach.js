import { getCourseDialogue } from '../data/courseDialogues.js';
import { evaluateExercise } from './answer.js';
import { courseSupplement } from '../data/courseSupplement.js';

export const learnerTurns = messages => messages.filter(item => item.role === 'user' && item.kind !== 'command' && typeof item.content === 'string' && item.content.trim());

export function dialogueGuidance(messages) {
  const turns = learnerTurns(messages);
  if (!turns.length) return '';
  const last = turns.at(-1).content.trim();
  const beats = [
    'Предложи один конкретный выбор внутри ситуации, опираясь на ответ ученика.',
    'Добавь небольшое правдоподобное изменение условий и дай ученику на него отреагировать.',
    'Попроси уточнить одну важную деталь, которую ученик ещё не сообщил.',
    'Коротко подведи итог договорённости и предложи ученику подтвердить или изменить её.',
  ];
  const move = /\?\s*$/.test(last) ? 'Сначала прямо ответь на вопрос ученика. Затем продвинь ситуацию на один шаг.' : last.split(/\s+/).length < 4 ? 'Реплика короткая: предложи один конкретный выбор из двух вариантов. Не отвечай за ученика и не проси абстрактно «больше деталей».' : beats[(turns.length - 1) % beats.length];
  const questions = messages.filter(item => item.role === 'assistant' && typeof item.content === 'string').slice(-2).flatMap(item => item.content.match(/[^.!?\n]*\?/g) || []).map(text => text.trim().slice(0, 180));
  return `\nСЛЕДУЮЩИЙ ХОД В ДИАЛОГЕ: ${move} Не более одного вопроса за ход. Не задавай заново уже отвеченный вопрос; при неясности скажи, что именно нужно уточнить.${questions.length ? ` Недавние вопросы, которые не нужно повторять дословно: ${questions.join(' / ')}` : ''} Завершение ситуации допустимо: не растягивай разговор бесконечными вопросами.`;
}

export function courseDialogueEvidence(topicId, messages) {
  if (!courseSupplement[topicId]) return [];
  const turns = learnerTurns(messages);
  return getCourseDialogue(topicId).map(step => ({
    prompt: step.prompt, example: step.answer,
    matched: turns.some(turn => evaluateExercise({ ...step, type: 'translate' }, turn.content).correct),
  }));
}
