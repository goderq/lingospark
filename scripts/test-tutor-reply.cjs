const assert = require('node:assert/strict');
const path = require('node:path');
const load = require('./load-data.cjs');
const reply = load(path.join(__dirname, '../src/utils/tutorReply'));
const { keyboardOverlap } = load(path.join(__dirname, '../src/utils/keyboardLayout'));
const messages = [{ id: 'a', role: 'assistant', content: 'Hi! How are you?' }, { role: 'user', content: 'what' }];
assert.equal(reply.tutorReplyLanguage(messages), 'english');
assert.ok(reply.findTutorReplyProblems({ reply: 'Привет! Как дела?', messages }).includes('reply must be in English'));
assert.ok(reply.findTutorReplyProblems({ reply: 'Hi! How are you?', messages }).some(item => item.includes('repeats')));
assert.ok(reply.findTutorReplyProblems({ reply: 'Hi! How are you?', messages: [{ id: 'welcome-1', role: 'assistant', content: 'Hi! How are you?' }, { role: 'user', content: 'hi' }] }).some(item => item.includes('repeats')), 'English opening questions must not be repeated');
assert.ok(reply.findTutorReplyProblems({ reply: 'Hello! What is your name?', messages }).some(item => item.includes('clarify')));
assert.deepEqual(reply.findTutorReplyProblems({ reply: 'Hi! How are you?', messages: [messages[0], { role: 'user', content: 'Could you repeat that, please?' }] }), [], 'an explicitly requested repetition is legitimate');
assert.deepEqual(reply.findTutorReplyProblems({ reply: 'Как дела?', messages: [messages[0], { role: 'user', kind: 'command', action: 'translate', content: 'Переведи ответ' }], dialogueMode: 'story' }), [], 'a translation does not have to continue the story');
assert.deepEqual(reply.findTutorReplyProblems({ reply: 'I was asking how you feel today. Are you happy or tired?', messages }), []);
assert.equal(reply.tutorReplyLanguage([{ role: 'user', content: 'Переведи ответ на русский' }]), 'bilingual');
assert.equal(reply.tutorReplyLanguage([{ role: 'user', kind: 'command', action: 'retry', content: 'Ответь иначе. Старый ответ: Привет' }]), 'english');
assert.equal(reply.tutorReplyLanguage([{ role: 'user', kind: 'command', action: 'translate', content: 'Переведи' }]), 'russian');
assert.ok(reply.findTutorReplyProblems({ reply: 'Choose tea or coffee. Which one do you prefer?', messages: [{ role: 'assistant', content: 'I have two drinks. Which one do you prefer?' }, { role: 'user', content: 'tea' }] }).some(item => item.includes('repeats')));
const frame = { x: 0, y: 59, width: 390, height: 751 };
assert.equal(keyboardOverlap(frame, { height: 320, screenY: 524 }), 286, 'safe area origin must be included');
assert.equal(keyboardOverlap(frame, { height: 320, screenY: 844 }), 0, 'keyboard moved offscreen');
assert.equal(keyboardOverlap(frame, { height: 0, screenY: 524 }), 0);
assert.equal(keyboardOverlap({ ...frame, height: 465 }, { height: 320, screenY: 524 }), 0, 'a resized Android window must not subtract keyboard height twice');
assert.equal(keyboardOverlap(frame, { height: 320, screenY: 524, screenX: 500, width: 200 }), 0);

// Real service and budgeting with only native files/storage/engine replaced.
const { serviceLoad, nativeCalls, outputs, storage } = require('./mock-local-ai.cjs')();
async function main() {
  let repairs = 0;
  await assert.rejects(reply.generateTutorReply({ messages, generate: async () => ({ text: 'Привет! Как дела?' }), repair: async () => { repairs++; return { text: 'Привет! Как дела?' }; } }), { code: 'TUTOR_REPLY_INVALID' });
  assert.equal(repairs, 1, 'repair must be bounded and checked again');
  const validBeforeRewrite = 'I meant to ask how you feel today. Are you tired or excited?';
  assert.equal((await reply.generateTutorReply({
    messages, qualityMode: true,
    generate: async () => ({ text: validBeforeRewrite }),
    repair: async () => ({ text: 'Hi! How are you?' }),
  })).text, validBeforeRewrite, 'an optional rewrite must not discard a valid original');
  const controller = new AbortController();
  await assert.rejects(reply.generateTutorReply({ messages, signal: controller.signal, generate: async () => { controller.abort(); return { text: 'A cancelled reply.' }; }, repair: async () => { throw Error('must not repair after cancellation'); } }), { name: 'AbortError' });
  const ai = serviceLoad('src/services/localAi.js');
  await Promise.all([ai.saveTutorSession({ id: 'first' }), ai.saveTutorSession({ id: 'second' })]);
  assert.deepEqual((await ai.loadTutorSessions()).map(session => session.id).sort(), ['first', 'second']);
  await Promise.all([ai.deleteTutorSession('first'), ai.saveTutorSession({ id: 'third' })]);
  assert.deepEqual((await ai.loadTutorSessions()).map(session => session.id).sort(), ['second', 'third']);
  await Promise.all([ai.saveTutorSession({ id: 'fourth' }), ai.clearTutorSessions()]);
  assert.deepEqual(await ai.loadTutorSessions(), []);
  const historyKey = '@lingospark/ai-tutor-sessions-v1';
  storage.set(historyKey, 'unreadable data');
  await assert.rejects(ai.saveTutorSession({ id: 'must-not-overwrite' }));
  assert.equal(storage.get(historyKey), 'unreadable data');
  await ai.clearTutorSessions();
  await ai.saveTutorSession({ id: 'after-error' });
  assert.equal((await ai.loadTutorSessions())[0].id, 'after-error');
  const screenshotMessages = [
    { id: 'welcome-shot', role: 'assistant', content: 'Hi! I’m Lingo. Let’s speak English. What would you like to talk about today?' },
    { id: 'user-hi', role: 'user', kind: 'message', content: 'hi' },
  ];
  const gemmaOpeningArgs = { model: ai.AI_MODELS.find(model => model.family === 'gemma'), level: 'A2', topic: 'Свободный разговор' };
  const nativeBeforeGreeting = nativeCalls.length;
  const greeting = await ai.completeTutorMessage({ ...gemmaOpeningArgs, messages: screenshotMessages });
  assert.equal(greeting.quality.source, 'local-opening');
  assert.match(greeting.text, /What do you like to do/);
  assert.equal(nativeCalls.length, nativeBeforeGreeting, 'short first greetings should bypass inference');
  assert.deepEqual(reply.findTutorReplyProblems({ messages: screenshotMessages, reply: 'Hi! Have you read a good book lately?' }), []);
  assert.ok(reply.findTutorReplyProblems({ messages: screenshotMessages, reply: 'Hi!' }).some(reason => /without continuing/.test(reason)));
  assert.ok(reply.findTutorReplyProblems({ messages: screenshotMessages, reply: screenshotMessages[0].content }).some(reason => /repeats/.test(reason)));
  assert.equal(reply.openingQuestionForGreeting({ ...gemmaOpeningArgs, messages: screenshotMessages, dialogueMode: 'roleplay' }), null);
  assert.equal(reply.openingQuestionForGreeting({ ...gemmaOpeningArgs, messages: screenshotMessages, courseContext: 'Speak about an assignment.' }), null);
  assert.equal(reply.openingQuestionForGreeting({ ...gemmaOpeningArgs, messages: [screenshotMessages[0], { role: 'user', content: 'Hi, can you help me?' }] }), null);
  const duplicateOpening = [{ ...screenshotMessages[0], content: greeting.text }, screenshotMessages[1]];
  assert.notEqual((await ai.completeTutorMessage({ ...gemmaOpeningArgs, messages: duplicateOpening })).text, greeting.text);
  const abortedOpening = new AbortController();
  abortedOpening.abort();
  await assert.rejects(ai.completeTutorMessage({ ...gemmaOpeningArgs, messages: screenshotMessages, signal: abortedOpening.signal }), { name: 'AbortError' });
  outputs.push('I enjoy cooking too. What do you like to cook?');
  const followUp = await ai.completeTutorMessage({ ...gemmaOpeningArgs, messages: [
    ...screenshotMessages, { id: 'assistant-opening', role: 'assistant', content: greeting.text },
    { role: 'user', content: 'I enjoy cooking.' },
  ] });
  assert.equal(followUp.quality.source, 'model');
  assert.match(nativeCalls.at(-1).messages.map(message => message.content).join(' '), /What do you like to do/);
  for (const model of ai.AI_MODELS) for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
    const tokens = [], stages = [];
    outputs.push('Привет! Как дела?', 'Would you like to talk about food or travel?');
    const result = await ai.completeTutorMessage({ model, level, topic: 'Свободный разговор', messages: [{ id: 'welcome-1', role: 'assistant', content: 'Привет! Я преподаватель.' }, { role: 'user', content: 'I would like to practise English.' }], onToken: text => tokens.push(text), onStatus: status => stages.push(status) });
    assert.equal(result.text, 'Would you like to talk about food or travel?');
    assert.deepEqual(tokens, [result.text], 'unvalidated draft must never be streamed to the screen');
    assert.deepEqual(stages, ['thinking', 'checking', 'rewriting']);
    const generation = nativeCalls.at(-2);
    assert.equal(generation.jinja, true);
    assert.ok(generation.stop.includes(model.family === 'llama' ? '<|eot_id|>' : model.family === 'gemma' ? '<end_of_turn>' : '<|im_end|>'));
    if (model.family === 'gemma') assert.ok(!generation.messages.some(item => item.role === 'system'), 'Gemma must receive folded instructions');
    assert.ok(generation.messages[0].content.includes('REQUIRED: Reply in English only'), 'language rule must survive small-context budgeting');
    assert.ok(!generation.messages.some(item => item.role === 'assistant' && item.content.includes('Привет! Я преподаватель.')), 'Russian onboarding must not become a conversation example');
    assert.ok(!result.quality.confidence, 'presence of grammar notes is not proof of accuracy');
  }
  outputs.push('Hi! How are you?', 'I mean: how do you feel today?');
  const clarified = await ai.completeTutorMessage({ model: ai.AI_MODELS[0], level: 'A2', topic: 'Свободный разговор', messages });
  assert.equal(clarified.text, 'I mean: how do you feel today?');
  const gemma = ai.AI_MODELS.find(model => model.family === 'gemma');
  const { greetingJourney } = load(path.join(__dirname, '../src/data/learningJourney'));
  const opening = { role: 'assistant', content: "Hi! My name is Sam. Can you tell me your name?" };
  const course = { model: gemma, level: 'A1', topic: greetingJourney.ai.topic, courseContext: greetingJourney.ai.instruction };
  outputs.push('Hello!', 'What should I call you?');
  assert.equal((await ai.completeTutorMessage({ ...course, messages: [opening, { role: 'user', content: 'привет' }] })).text, 'What should I call you?');
  const introduction = [opening, { role: 'user', content: 'hi my name anna' }];
  assert.ok(reply.findTutorReplyProblems({ messages: introduction, reply: 'May I ask your name?' }).includes('asks for the learner name already given'));
  assert.deepEqual(reply.findTutorReplyProblems({ messages: introduction, reply: 'Nice to meet you, Anna! This is my friend Mia.' }), []);
  outputs.push('Hi Anna! My name is Sam. What is your name?', 'Nice to meet you, Anna. This is my friend Mia. Do you know her?');
  const continued = await ai.completeTutorMessage({ ...course, messages: introduction });
  assert.match(continued.text, /my friend Mia/);
  for (const call of nativeCalls.slice(-2)) {
    assert.match(call.messages[0].content, /The learner already gave their name/);
    assert.match(call.messages[0].content, /friend Mia/);
  }
  assert.ok(!reply.findTutorReplyProblems({ messages: introduction, reply: 'What is your friend’s name?' }).includes('asks for the learner name already given'));
  const source = 'Okay! What do you think about the weather?';
  const wrongTranslation = source + '\nThe translation is: ' + source;
  const translation = 'Хорошо! Что ты думаешь о погоде?';
  const translationArgs = {
    model: ai.AI_MODELS.find(model => model.family === 'gemma'),
    level: 'A2',
    topic: 'Свободный разговор',
    dialogueMode: 'story',
    messages: [{ role: 'assistant', content: 'Unrelated chat history.' }, { role: 'user', kind: 'command', action: 'translate', content: source, translationSource: source }],
  };
  outputs.push(wrongTranslation, translation);
  const translated = await ai.completeTutorMessage(translationArgs);
  assert.equal(translated.text, translation);
  for (const call of nativeCalls.slice(-2)) {
    assert.match(call.messages.map(item => item.content).join('\n'), /Output only the Russian translation/);
    assert.ok(call.messages.at(-1).content.endsWith(source));
    assert.ok(!call.messages.some(item => item.content.includes('Unrelated chat history.')));
  }
  outputs.push(wrongTranslation, wrongTranslation);
  await assert.rejects(ai.completeTutorMessage(translationArgs), /не выдала перевод на русский/);
  const { interviewContext, interviewProgress } = load(path.join(__dirname, '../src/utils/interview'));
  const interviewMessages = [{ role: 'user', id: 'candidate-1', content: 'I have experience in customer service.', interviewStepId: 'intro' }];
  const scenarioContext = interviewContext(interviewProgress([]), interviewProgress(interviewMessages));
  for (const model of ai.AI_MODELS.slice(0, 3)) {
    outputs.push('Спасибо за ответ.', 'Customer service experience is relevant to this role.');
    await ai.completeTutorMessage({ model, level: 'A2', topic: 'Работа', dialogueMode: 'interview', messages: interviewMessages, scenarioContext });
    for (const call of nativeCalls.slice(-2)) {
      assert.match(call.messages[0].content, /React to a concrete detail/, 'interview guidance survives context budgeting and repair');
    }
  }
  assert.equal(outputs.length, 0);
  console.log('Tutor passed: actual service prompts/context, English A1–C1, short-repeat repair, explicit translation, rejected second failure, cancellation, buffered output and keyboard coordinate cases. Native model quality and keyboard movement still need an iPhone.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
