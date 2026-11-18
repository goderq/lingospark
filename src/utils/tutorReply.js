import { asksLearnerName, dialogueContinuity, greetingRestart } from './conversationCoach.js';

const lastUser = messages => [...messages].reverse().find(item => item.role === 'user');
const normalize = text => String(text || '').normalize('NFKC').toLowerCase().replace(/[^a-zа-яё0-9]+/gi, ' ').trim();
export function tutorReplyLanguage(messages) {
  const user = lastUser(messages);
  if (user?.kind === 'command') {
    if (user.action === 'translate') return 'russian';
    return user.action === 'example' ? 'bilingual' : 'english';
  }
  return /(?:объясни|переведи|почему|что значит|на русском|по-русски|\btranslate\b|\b(?:explain|say|answer)\b.{0,30}\bin russian\b)/i.test(user?.content || '') ? 'bilingual' : 'english';
}
export function tutorLanguageRule(messages) {
  const language = tutorReplyLanguage(messages);
  if (language === 'russian') return 'Output the Russian translation only.';
  return language === 'english'
    ? 'REQUIRED: Reply in English only, even at A1/A2 and even if the app or past messages are Russian. Use simple English. Russian is only available when explicitly requested. Answer the latest message first. Do not repeat your last greeting or question unless the learner explicitly asks you to repeat it.'
    : 'The learner explicitly requested a translation, bilingual examples or a Russian explanation. Russian is allowed for that request. Keep English examples accurate and continue the requested task.';
}
export function findTutorReplyProblems({ reply, messages, dialogueMode = 'conversation' }) {
  const text = String(reply || '').trim(), problems = [];
  const normalized = normalize(text);
  const language = tutorReplyLanguage(messages);
  if (!normalized) problems.push('empty reply');
  if (text.length > 2400) problems.push('reply too long');
  if (/```|<\|(?:im_|end)|\{\s*"(?:role|content)"/i.test(text)) problems.push('technical output');
  if (language === 'russian') {
    const russianLetters = (text.match(/[а-яё]/gi) || []).length;
    const latinLetters = (text.match(/[a-z]/gi) || []).length;
    if (russianLetters < 2 || russianLetters < latinLetters) problems.push('translation must be in Russian');
    return problems;
  }
  if (language === 'english' && (/[а-яё]/i.test(text) || !/[a-z]/i.test(text))) problems.push('reply must be in English');
  const prior = messages.filter(item => item.role === 'assistant' && item.content?.trim() && (!String(item.id || '').startsWith('welcome') || !/[а-яё]/i.test(item.content))).slice(-4);
  const user = lastUser(messages);
  const repeatRequested = /^(?:(?:can|could|would) you\s+)?(?:please\s+)?(?:repeat\b|say (?:that|it) again\b)|^(?:пожалуйста[, ]*)?повтори/i.test(user?.content?.trim() || '');
  if (language === 'english' && user?.kind !== 'command' && !repeatRequested) {
    const continuity = dialogueContinuity(messages);
    if (continuity.learnerName && asksLearnerName.test(text)) problems.push('asks for the learner name already given');
    if (greetingRestart(text, continuity)) problems.push('restarts the greeting instead of continuing the dialogue');
  }
  const tokens = new Set(normalized.split(' ').filter(Boolean));
  const questions = text.match(/[^.!?\n]*\?/g) || [];
  if (!repeatRequested && prior.some(item => {
    const old = normalize(item.content), oldTokens = new Set(old.split(' ').filter(Boolean));
    if (normalized && normalized === old) return true;
    const common = [...tokens].filter(word => oldTokens.has(word)).length;
    if (tokens.size >= 4 && oldTokens.size >= 4 && common / Math.max(tokens.size, oldTokens.size) >= 0.78) return true;
    const oldQuestions = (item.content.match(/[^.!?\n]*\?/g) || []).map(normalize);
    return language === 'english' && questions.some(question => normalize(question).split(' ').length >= 3 && oldQuestions.includes(normalize(question)));
  })) problems.push('repeats a recent answer or question');
  if (/^(?:what|huh|sorry|pardon|что|не понял)[?!.\s]*$/i.test(user?.content?.trim() || '') && (/^(?:hi|hello|hey|привет)\b/i.test(text) || !/\?|mean|asking|asked|question|simpl|choose|prefer|or\b/i.test(text))) problems.push('clarify the previous question instead of restarting the greeting');
  if (dialogueMode === 'story' && !/\bA[).:]|\bB[).:]|choice|what (?:do|would) you/i.test(text)) problems.push('story needs a choice for the learner');
  return problems;
}
function assertNotAborted(signal) {
  if (signal?.aborted) { const error = new Error('Ответ остановлен'); error.name = 'AbortError'; throw error; }
}
// One bounded repair. Both outputs are checked, including short repeated replies.
// Invalid output is never replaced by a canned greeting or presented as verified.
export async function generateTutorReply({ generate, repair, messages, dialogueMode, qualityMode = false, onStatus, signal }) {
  assertNotAborted(signal); onStatus?.('thinking');
  const draft = await generate();
  assertNotAborted(signal);
  onStatus?.('checking');
  const problems = findTutorReplyProblems({ reply: draft?.text, messages, dialogueMode });
  if (!qualityMode && !problems.length) return { ...draft, quality: { checked: 'format', source: 'model' } };
  onStatus?.('rewriting');
  const improved = await repair(draft?.text || '', problems);
  assertNotAborted(signal);
  const remaining = findTutorReplyProblems({ reply: improved?.text, messages, dialogueMode });
  if (remaining.length) {
    const error = new Error(tutorReplyLanguage(messages) === 'russian'
      ? 'Модель не выдала перевод на русский. Попробуй ещё раз или выбери другую модель.'
      : 'Модель не смогла сформировать ответ без повторов и с нужным языком. Повтори запрос или выбери другую модель в меню.');
    error.code = 'TUTOR_REPLY_INVALID'; throw error;
  }
  return { ...improved, quality: { checked: 'repaired', source: 'model' } };
}
