import { isClarification } from './tutorTurn.js';

export function isVoicePracticeTurn(text) {
  const line = String(text || '').trim();
  return /[a-z]/i.test(line) && !isClarification(line) &&
    !/^(?:i(?:['’]m| am) sorry|uh+|um+)[.!?,\s]*$/i.test(line);
}

export function doctorOpeningClarification(scenario, messages) {
  if (scenario.id !== 'doctor' || messages.length !== 2 || messages[0].content !== scenario.opening) return null;
  const learner = messages[1];
  if (learner.role !== 'user' || isVoicePracticeTurn(learner.content)) return null;
  return 'No problem. How are you feeling today?';
}

export function parseVoiceCoachReply(output, mode) {
  const [spoken, note] = String(output || '').trim().split(/\n+\s*РУССКИЙ КОММЕНТАРИЙ\s*:/i, 2);
  const text = spoken.trim();
  if (!/[a-z]/i.test(text) || /\p{Script=Cyrillic}|\x60{3}|<\|/u.test(text)) return null;
  const comment = note?.trim();
  return {
    text,
    ...(mode !== 'english' && comment && /[а-яё]/i.test(comment) && comment.length <= 220 && !/\n/.test(comment) ? { comment } : {}),
  };
}
