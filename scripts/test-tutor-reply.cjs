const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { transformSync } = require('@babel/core');
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
assert.deepEqual(reply.findTutorReplyProblems({ reply: '«How are you?» — «Как дела?»', messages: [messages[0], { role: 'user', kind: 'command', action: 'translate', content: 'Переведи ответ' }] }), [], 'a translation may quote the original question');
assert.deepEqual(reply.findTutorReplyProblems({ reply: 'I was asking how you feel today. Are you happy or tired?', messages }), []);
assert.equal(reply.tutorReplyLanguage([{ role: 'user', content: 'Переведи ответ на русский' }]), 'bilingual');
assert.equal(reply.tutorReplyLanguage([{ role: 'user', kind: 'command', action: 'retry', content: 'Ответь иначе. Старый ответ: Привет' }]), 'english');
assert.equal(reply.tutorReplyLanguage([{ role: 'user', kind: 'command', action: 'translate', content: 'Переведи' }]), 'bilingual');
assert.ok(reply.findTutorReplyProblems({ reply: 'Choose tea or coffee. Which one do you prefer?', messages: [{ role: 'assistant', content: 'I have two drinks. Which one do you prefer?' }, { role: 'user', content: 'tea' }] }).some(item => item.includes('repeats')));
const frame = { x: 0, y: 59, width: 390, height: 751 };
assert.equal(keyboardOverlap(frame, { height: 320, screenY: 524 }), 286, 'safe area origin must be included');
assert.equal(keyboardOverlap(frame, { height: 320, screenY: 844 }), 0, 'keyboard moved offscreen');
assert.equal(keyboardOverlap(frame, { height: 0, screenY: 524 }), 0);
assert.equal(keyboardOverlap({ ...frame, height: 465 }, { height: 320, screenY: 524 }), 0, 'a resized Android window must not subtract keyboard height twice');
assert.equal(keyboardOverlap(frame, { height: 320, screenY: 524, screenX: 500, width: 200 }), 0);

// Execute the real service and context budgeting, replacing only native storage,
// files and the llama engine. No network or actual model download is performed.
const storage = new Map(), nativeCalls = [], outputs = [], cache = new Map();
const llama = { completion: async (options, onToken) => { nativeCalls.push(options); const text = outputs.shift(); assert.equal(typeof text, 'string', 'unexpected extra model request'); onToken?.({ token: text }); return { text }; }, stopCompletion: async () => {} };
function serviceLoad(filename) {
  const absolute = path.resolve(filename);
  const file = [absolute, absolute + '.js', absolute + '.json'].find(candidate => fs.existsSync(candidate));
  if (file.endsWith('nativeResources.js')) return { withNativeResource: (_, fn) => fn(), registerResource() {}, releaseNativeResource: async () => {} };
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  if (file.endsWith('.json')) { module.exports = JSON.parse(fs.readFileSync(file)); return module.exports; }
  const code = transformSync(fs.readFileSync(file, 'utf8'), { configFile: false, babelrc: false, plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')] }).code;
  const requireMock = name => {
    if (name.startsWith('.')) return serviceLoad(path.resolve(path.dirname(file), name));
    if (name === '@react-native-async-storage/async-storage') return { getItem: async key => storage.get(key) || null, setItem: async (key, value) => storage.set(key, value), removeItem: async key => storage.delete(key) };
    if (name === 'expo-file-system/legacy') return { documentDirectory: '/documents/', EncodingType: { Base64: 'base64' }, getInfoAsync: async () => ({ exists: true, size: 2000000000 }), readAsStringAsync: async () => 'R0dVRg==' };
    if (name === '@pocketpalai/llama.rn') return { initLlama: async () => llama, releaseAllLlama: async () => {} };
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(requireMock, module, module.exports);
  return module.exports;
}
async function main() {
  let repairs = 0;
  await assert.rejects(reply.generateTutorReply({ messages, generate: async () => ({ text: 'Привет! Как дела?' }), repair: async () => { repairs++; return { text: 'Привет! Как дела?' }; } }), { code: 'TUTOR_REPLY_INVALID' });
  assert.equal(repairs, 1, 'repair must be bounded and checked again');
  const controller = new AbortController();
  await assert.rejects(reply.generateTutorReply({ messages, signal: controller.signal, generate: async () => { controller.abort(); return { text: 'A cancelled reply.' }; }, repair: async () => { throw Error('must not repair after cancellation'); } }), { name: 'AbortError' });
  const ai = serviceLoad('src/services/localAi.js');
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
    const tokens = [], stages = [];
    outputs.push('Привет! Как дела?', 'Hello! Would you like to talk about food or travel?');
    const result = await ai.completeTutorMessage({ model: ai.AI_MODELS[0], level, topic: 'Свободный разговор', messages: [{ id: 'welcome-1', role: 'assistant', content: 'Привет! Я преподаватель.' }, { role: 'user', content: 'hi' }], onToken: text => tokens.push(text), onStatus: status => stages.push(status) });
    assert.equal(result.text, 'Hello! Would you like to talk about food or travel?');
    assert.deepEqual(tokens, [result.text], 'unvalidated draft must never be streamed to the screen');
    assert.deepEqual(stages, ['thinking', 'checking', 'rewriting']);
    const generation = nativeCalls.at(-2);
    assert.ok(generation.messages[0].content.includes('REQUIRED: Reply in English only'), 'language rule must survive small-context budgeting');
    assert.ok(!generation.messages.some(item => item.role === 'assistant' && item.content.includes('Привет! Я преподаватель.')), 'Russian onboarding must not become a conversation example');
    assert.ok(!result.quality.confidence, 'presence of grammar notes is not proof of accuracy');
  }
  outputs.push('Hi! How are you?', 'I mean: how do you feel today?');
  const clarified = await ai.completeTutorMessage({ model: ai.AI_MODELS[0], level: 'A2', topic: 'Свободный разговор', messages });
  assert.equal(clarified.text, 'I mean: how do you feel today?');
  outputs.push('«How are you?» — «Как дела?»');
  const translated = await ai.completeTutorMessage({ model: ai.AI_MODELS[0], level: 'A2', topic: 'Свободный разговор', messages: [{ role: 'user', kind: 'command', action: 'translate', content: 'Переведи How are you?' }] });
  assert.ok(translated.text.includes('Как дела'));
  assert.equal(outputs.length, 0);
  console.log('Tutor passed: actual service prompts/context, English A1–C1, short-repeat repair, explicit translation, rejected second failure, cancellation, buffered output and keyboard coordinate cases. Native model quality and keyboard movement still need an iPhone.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
