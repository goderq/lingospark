import { asksLearnerName, dialogueContinuity, greetingRestart, isClarification, isSimpleGreeting } from './conversationCoach.js';
import { echoesLearnerFact, tutorTurn, tutorTurnProblem } from './tutorTurn.js';

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
  const clarification = user?.kind !== 'command' && isClarification(user?.content);
  const repeatRequested = /^(?:(?:can|could|would) you\s+)?(?:please\s+)?(?:repeat\b|say (?:that|it) again\b)|^(?:пожалуйста[, ]*)?повтори/i.test(user?.content?.trim() || '');
  if (language === 'english' && user?.kind !== 'command' && !repeatRequested) {
    const continuity = dialogueContinuity(messages);
    if (continuity.learnerName && asksLearnerName.test(text)) problems.push('asks for the learner name already given');
    if (greetingRestart(text, continuity)) problems.push('gives only a greeting or introduction without continuing');
  }
  const tokens = new Set(normalized.split(' ').filter(Boolean));
  const questions = text.match(/[^.!?\n]*\?/g) || [];
  if (!repeatRequested && prior.some(item => {
    const old = normalize(item.content), oldTokens = new Set(old.split(' ').filter(Boolean));
    if (normalized && normalized === old) return true;
    const common = [...tokens].filter(word => oldTokens.has(word)).length;
    if (!clarification && tokens.size >= 4 && oldTokens.size >= 4 && common / Math.max(tokens.size, oldTokens.size) >= 0.78) return true;
    const oldQuestions = (item.content.match(/[^.!?\n]*\?/g) || []).map(normalize);
    return language === 'english' && questions.some(question => normalize(question).split(' ').length >= 3 && oldQuestions.includes(normalize(question)));
  })) problems.push('repeats a recent answer or question');
  if (clarification && (/^(?:hi|hello|hey|привет)\b/i.test(text) || !/\?|mean|asking|asked|question|simpl|choose|prefer|or\b/i.test(text))) problems.push('clarify the previous question instead of restarting the greeting');
  if (language === 'english' && dialogueMode === 'conversation' && user?.kind !== 'command' && !repeatRequested) {
    const turn = tutorTurn(messages);
    if ((turn || clarification) && echoesLearnerFact(messages, text)) problems.push('copies the learner’s personal fact in the tutor’s voice');
    const problem = tutorTurnProblem(turn, text);
    if (problem) problems.push(problem);
  }
  if (dialogueMode === 'story' && !/\bA[).:]|\bB[).:]|choice|what (?:do|would) you/i.test(text)) problems.push('story needs a choice for the learner');
  return problems;
}
export function assertTutorReplyNotAborted(signal) {
  if (signal?.aborted) { const error = new Error('Ответ остановлен'); error.name = 'AbortError'; throw error; }
}
const openingQuestions = {
  'Свободный разговор': ['Let’s start with something easy. What do you like to do in your free time?', 'Let’s talk about your day. What did you do this morning?'],
  Путешествия: ['Let’s talk about travel. Where would you like to go on your next trip?', 'Do you prefer going by train or by plane?'],
  Работа: ['Let’s talk about work. What does a normal day look like for you?', 'What kind of work would you like to do?'],
};

// The built-in welcome can hand off a standalone greeting without inference.
export function openingQuestionForGreeting({ messages, topic, dialogueMode = 'conversation', courseContext, scenarioContext }) {
  if (dialogueMode !== 'conversation' || courseContext || scenarioContext || messages.length !== 2) return null;
  const [welcome, latest] = messages;
  if (welcome.role !== 'assistant' || !String(welcome.id || '').startsWith('welcome') ||
    latest.role !== 'user' || latest.kind === 'command' || !isSimpleGreeting(latest.content)) return null;
  if (!Object.hasOwn(openingQuestions, topic)) return null;
  return openingQuestions[topic].find(reply => !findTutorReplyProblems({ reply, messages }).length) || null;
}

// Check the draft and one repair before trying an app reply for a recognized turn.
export async function generateTutorReply({ generate, repair, messages, dialogueMode, qualityMode = false, allowContextRecovery = false, onStatus, signal }) {
  assertTutorReplyNotAborted(signal); onStatus?.('thinking');
  const draft = await generate();
  assertTutorReplyNotAborted(signal);
  onStatus?.('checking');
  const problems = findTutorReplyProblems({ reply: draft?.text, messages, dialogueMode });
  const validDraft = problems.length ? null : { ...draft, quality: { checked: 'format', source: 'model' } };
  if (!qualityMode && validDraft) return validDraft;
  onStatus?.('rewriting');
  const improved = await repair(draft?.text || '', problems);
  assertTutorReplyNotAborted(signal);
  const remaining = findTutorReplyProblems({ reply: improved?.text, messages, dialogueMode });
  if (remaining.length) {
    if (validDraft) return validDraft;
    const recovery = allowContextRecovery && tutorReplyLanguage(messages) === 'english'
      ? tutorTurn(messages)?.replies.find(text => !findTutorReplyProblems({ reply: text, messages, dialogueMode }).length)
      : null;
    if (recovery) return { text: recovery, quality: { source: 'context-recovery' } };
    const error = new Error(tutorReplyLanguage(messages) === 'russian'
      ? 'Модель не выдала перевод на русский. Попробуй ещё раз или выбери другую модель.'
      : 'Не удалось получить подходящий ответ. Попробуй ещё раз или измени реплику.');
    error.code = 'TUTOR_REPLY_INVALID'; throw error;
  }
  return { ...improved, quality: { checked: 'repaired', source: 'model' } };
}
