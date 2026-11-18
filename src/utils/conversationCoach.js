import { getCourseDialogue } from '../data/courseDialogues.js';
import { evaluateExercise } from './answer.js';
import { courseSupplement } from '../data/courseSupplement.js';

export const learnerTurns = messages => messages.filter(item => item.role === 'user' && item.kind !== 'command' && typeof item.content === 'string' && item.content.trim());

const greetingStart = /^(?:hi\b|hello\b|hey\b|good (?:morning|afternoon|evening)\b|привет(?:[!,.\s]|$)|здравствуй(?:те)?(?:[!,.\s]|$))/i;
const greetingOnly = /^(?:hi(?: there)?|hello(?: there)?|hey(?: there)?|good (?:morning|afternoon|evening)|привет|здравствуй(?:те)?)[\s!.,?]*$/i;
export const asksLearnerName = /(?:\bwhat(?:['’]s| is) your (?:first )?name\b|\b(?:tell me|share|ask|know|have) (?:me )?your (?:first )?name\b|\bwhat (?:should|can|may|do) i call you\b|\bwhat name (?:do|should) (?:you|i)\b|\byour (?:first )?name(?:[ ,]+please)?\s*\?)/i;

function introducedName(text, answerToNameQuestion) {
  const explicit = text.match(/(?:^|[.!]\s*)(?:(?:hi|hello|hey)[,\s!]+)?(?:my name(?:['’]s| is)? +|(?:you can )?call me +)([a-z][a-z'-]{1,24})\b/i);
  const afterQuestion = answerToNameQuestion
    ? text.match(/^(?:(?:hi|hello|hey)[,\s!]+)?(?:i(?:['’]m| am) +)?([a-z][a-z'-]{1,24})[.!?\s]*$/i)
    : null;
  const name = (explicit || afterQuestion)?.[1];
  if (!name || /^(?:hi|hey|hello|what|why|yes|no|fine|good|sorry|here|there|okay|thanks|unknown|not|is|was|just|please)$/i.test(name)) return '';
  return name[0].toUpperCase() + name.slice(1);
}

export function dialogueContinuity(messages) {
  let learnerName = '';
  let previous = '';
  let alreadyGreeted = false;
  let latestIntroducedName = false;
  for (const item of messages) {
    if (item.kind === 'command' || item.action === 'translate' || typeof item.content !== 'string') continue;
    if (item.role === 'assistant' && item.content.trim()) {
      previous = item.content.trim();
      alreadyGreeted ||= greetingStart.test(previous);
    } else if (item.role === 'user') {
      const name = introducedName(item.content.trim(), asksLearnerName.test(previous));
      latestIntroducedName = !!name;
      if (name) learnerName = name;
    }
  }
  const latest = messages.at(-1);
  const latestIsGreeting = latest?.role === 'user' && greetingOnly.test(latest.content?.trim() || '');
  const continueAfterGreeting = alreadyGreeted && (latestIsGreeting || latestIntroducedName);
  return { learnerName, continueAfterGreeting, latestIntroducedName, previous };
}

export function greetingRestart(reply, continuity) {
  if (!continuity.continueAfterGreeting) return false;
  if (greetingStart.test(reply) || greetingOnly.test(reply)) return true;
  return /^(?:nice|good|great|lovely) to meet you(?:[ ,]+[a-z'-]+)?[.!\s]*$/i.test(reply);
}

export function continuityGuidance(messages, introductions = false) {
  const facts = dialogueContinuity(messages);
  const guidance = [];
  if (facts.learnerName) {
    guidance.push(`The learner already gave their name: ${facts.learnerName}. Never ask for or reconfirm it.`);
  }
  if (facts.continueAfterGreeting) {
    guidance.push('The conversation already started. Continue without greeting or introducing yourself again. Make the next turn specific to the current situation.');
    if (facts.latestIntroducedName) {
      guidance.push(introductions
        ? 'Acknowledge their name and introduce your friend Mia if you have not done so yet. Then invite the learner to respond to Mia or introduce a friend.'
        : 'React to the introduction and add a new detail or ask one new question on the current topic.');
    } else if (facts.previous) {
      guidance.push(asksLearnerName.test(facts.previous) && !facts.learnerName
        ? 'Your last question asked for the learner’s name. Rephrase it simply or introduce the next part of the scene.'
        : 'If your last question is still unanswered, rephrase it simply. Otherwise offer a new opening question on the topic.');
    }
  }
  return guidance.join(' ');
}

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
