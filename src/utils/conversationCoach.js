import { getCourseDialogue } from '../data/courseDialogues.js';
import { evaluateExercise } from './answer.js';
import { courseSupplement } from '../data/courseSupplement.js';

export const learnerTurns = messages => messages.filter(item => item.role === 'user' && item.kind !== 'command' && typeof item.content === 'string' && item.content.trim());

const greetingStart = /^(?:hi\b|hello\b|hey\b|good (?:morning|afternoon|evening)\b|привет(?:[!,.\s]|$)|здравствуй(?:те)?(?:[!,.\s]|$))/i;
const greetingOnly = /^(?:hi(?: there)?|hello(?: there)?|hey(?: there)?|good (?:morning|afternoon|evening)|привет|здравствуй(?:те)?)[\s!.,?]*$/i;
export const isSimpleGreeting = text => greetingOnly.test(String(text || '').trim());
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
  const latestIsGreeting = latest?.role === 'user' && isSimpleGreeting(latest.content);
  const continueAfterGreeting = alreadyGreeted && (latestIsGreeting || latestIntroducedName);
  return { learnerName, continueAfterGreeting, latestIntroducedName, previous };
}

export function greetingRestart(reply, continuity) {
  if (!continuity.continueAfterGreeting) return false;
  if (isSimpleGreeting(reply) || /^(?:hi|hello|hey)[ ,]+[a-z'’-]+[.!?,\s]*$/i.test(reply)) return true;
  const continuation = reply.replace(/^(?:hi|hello|hey|good (?:morning|afternoon|evening))\b(?:[ ,]+[a-z'’-]+(?=[.!]))?[,.!\s]+/i, '');
  return /^(?:(?:nice|good|great|lovely) to meet you(?:[ ,]+[a-z'’-]+)?|(?:i(?:['’]m| am)|my name is) [a-z'’-]+)[.!\s]*$/i.test(continuation);
}

export function continuityGuidance(messages, introductions = false) {
  const facts = dialogueContinuity(messages);
  const guidance = [];
  if (facts.learnerName) {
    guidance.push(`The learner already gave their name: ${facts.learnerName}. Never ask for or reconfirm it.`);
  }
  if (facts.continueAfterGreeting) {
    guidance.push('The conversation already started. Acknowledge the learner briefly and then add a new detail or question. Avoid introducing yourself again.');
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

export const isClarification = text => /^(?:what|huh|sorry|pardon|what do you mean|что|не понял(?:а)?)[?!.\s]*$/i.test(String(text || '').trim());

export function dialogueGuidance(messages) {
  const last = learnerTurns(messages).at(-1)?.content.trim();
  if (!last) return '';
  const previous = [...messages].reverse().find(item => item.role === 'assistant' && item.action !== 'translate' && item.content?.trim())?.content;
  const question = previous?.match(/[^.!?\n]*\?/g)?.at(-1)?.trim();
  const anchor = question || previous?.trim();
  const reference = anchor ? ` Previous turn: "${anchor.replace(/\s+/g, ' ').slice(-200)}".` : '';
  if (isClarification(last)) {
    return anchor
      ? `Clarify the previous question or statement in simpler English. Keep its topic and make it easier to answer.${reference}`
      : 'Ask which part the learner wants you to explain.';
  }
  if (anchor && /^(?:yes|yeah|yep|sure|of course|no|nope|not really)[.!\s]*$/i.test(last)) {
    return `Treat the short reply as a yes or no to the previous turn. Acknowledge it and move one step forward.${reference}`;
  }
  if (!isSimpleGreeting(last) && !/\?\s*$/.test(last) && last.split(/\s+/).length < 5) {
    return anchor
      ? `Use this short reply as an answer to the previous turn. Follow up on the detail the learner gave.${reference}`
      : 'If the request is incomplete, ask one specific question to clarify what the learner wants.';
  }
  return /\?\s*$/.test(last) ? 'Answer the learner’s question directly.' : 'Use one concrete detail from the learner’s latest message to continue.';
}

const learnerFact = /^(?:i(?:['’]m| am| like| love| enjoy| play| live| work| study| usually| often| have| go| prefer)|my (?:name|hobby|favourite|favorite|job)|we (?:usually|often|play|go|live))\b/i;

export function earlierLearnerFacts(messages) {
  const facts = [];
  for (const turn of learnerTurns(messages).reverse()) {
    const quote = turn.content.trim().replace(/\s+/g, ' ');
    if (quote.length > 120 || /[?\n]/.test(quote) || !learnerFact.test(quote) || facts.includes(quote)) continue;
    facts.unshift(quote);
    if (facts.length === 2) break;
  }
  return facts.length ? `Earlier learner facts (quotes): ${facts.map(text => JSON.stringify(text)).join(' | ')}.` : '';
}

export function courseDialogueEvidence(topicId, messages) {
  if (!courseSupplement[topicId]) return [];
  const turns = learnerTurns(messages);
  return getCourseDialogue(topicId).map(step => ({
    prompt: step.prompt, example: step.answer,
    matched: turns.some(turn => evaluateExercise({ ...step, type: 'translate' }, turn.content).correct),
  }));
}
