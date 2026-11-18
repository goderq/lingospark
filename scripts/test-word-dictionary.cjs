const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const load = require('./load-data.cjs');
const { wordBank, extendedWordBank } = load(require('node:path').join(__dirname, '../src/data/wordBank'));
const { wordExpansion } = load(require('node:path').join(__dirname, '../src/data/wordExpansion'));
const { dictionaryWithoutDuplicates, searchDictionary, wordLearningState, normalizeWordQuery, wordAmountLabel } = load(require('node:path').join(__dirname, '../src/utils/wordDictionary'));
const legacy = require('../src/data/wordBank.json');
const supplement = require('../src/data/wordSupplement.json');
const byEnglish = new Map(extendedWordBank.map(word => [word.english, word]));
assert.equal(byEnglish.size, extendedWordBank.length);
assert.equal(new Set(extendedWordBank.map(word => word.id)).size, extendedWordBank.length);
assert.ok(wordExpansion.length >= 250);
assert.equal(extendedWordBank.length, legacy.length + wordExpansion.length + supplement.length);
assert.ok(supplement.length >= 4000);
const compactKey = english => english.toLowerCase().replace(/[-']/g, '');
const spellings = new Set([...legacy.map(([english]) => english), ...wordExpansion.map(word => word.english)].map(compactKey));
for (const [english, russian, part] of supplement) {
  const key = compactKey(english);
  assert.ok(!spellings.has(key), `duplicate or spelling variant: ${english}`);
  spellings.add(key);
  assert.match(english, /^[a-z]{3,24}(?:-[a-z]{2,15})?$/);
  assert.match(russian, /^[а-яё]+(?:[ -][а-яё]+){0,2}$/);
  assert.ok(['n', 'v', 'adj', 'adv', 'interj'].includes(part));
  const entry = byEnglish.get(english);
  assert.equal(entry?.id, `dictionary-${english}`);
  assert.equal(entry?.russian, russian);
  assert.ok(entry.partOfSpeech && ['B1', 'B2', 'C1'].includes(entry.level));
}
assert.equal(searchDictionary(extendedWordBank, 'lullaby')[0].russian, 'колыбельная');
assert.equal(searchDictionary(extendedWordBank, 'muffin')[0].russian, 'кекс');
for (const [english, russian, transcription, id] of legacy) {
  const word = byEnglish.get(english);
  assert.equal(word.id, `bank-${id}`, `${english}: saved progress ID changed`);
  assert.equal(word.transcription, transcription);
}
for (const entry of wordExpansion) {
  assert.match(entry.english, /^[a-z]+(?:-[a-z]+)*$/);
  assert.ok(!legacy.some(([english]) => english === entry.english), `duplicate ${entry.english}`);
  assert.ok(['A1', 'A2', 'B1', 'B2', 'C1'].includes(entry.level));
  assert.ok(entry.partOfSpeech);
  assert.match(entry.translation, /[а-яё]/i);
  assert.ok(!/[a-z]|[<>={}]/i.test(entry.translation));
  assert.ok(entry.translation.split(';').length <= 3);
  assert.match(entry.example, /[.!?]$/);
  assert.match(entry.exampleRu, /[.!?]$/);
  assert.match(entry.exampleRu, /[а-яё]/i);
  assert.ok(entry.example.toLowerCase().includes(entry.english), `${entry.english}: unrelated example`);
  const word = byEnglish.get(entry.english);
  assert.equal(word.level, entry.level);
  assert.equal(word.example, entry.example);
  assert.ok(wordBank.includes(word));
  assert.equal(searchDictionary(extendedWordBank, entry.english)[0].id, word.id);
}
assert.equal(normalizeWordQuery('  ЩЁТКА  '), 'щетка');
assert.equal(searchDictionary(extendedWordBank, 'ЩЕТКА')[0].english, 'toothbrush');
assert.equal(searchDictionary(extendedWordBank, '  BACKPACK  ')[0].english, 'backpack');
const backpack = byEnglish.get('backpack');
assert.equal(searchDictionary(extendedWordBank, 'мой рюкзак', { [backpack.id]: 'Мой рюкзак' })[0], backpack);
const custom = { id: 'custom-test', english: 'tea break', russian: 'перерыв на чай' };
assert.equal(searchDictionary([custom], 'перерыв')[0], custom);
assert.deepEqual(dictionaryWithoutDuplicates([{ ...backpack, english: ' BACKPACK ' }, backpack]).map(word => word.english), [' BACKPACK ']);
assert.equal(searchDictionary(extendedWordBank, ''), extendedWordBank, 'empty search should reuse the original array');
assert.deepEqual(searchDictionary(extendedWordBank, 'zzzz-not-a-word'), []);
const today = '2026-11-18';
assert.equal(wordLearningState(undefined, today), 'new');
assert.equal(wordLearningState({ total: 1, dueDate: '2026-11-19' }, today), 'learning');
assert.equal(wordLearningState({ interval: 14, successfulDays: 3, dueDate: '2026-11-19' }, today), 'learned');
assert.equal(wordLearningState({ interval: 14, successfulDays: 3, dueDate: today }, today), 'due', 'due repeat takes priority over mastery');
assert.deepEqual([1, 2, 5, 11, 21, 24].map(wordAmountLabel), ['1 слово', '2 слова', '5 слов', '11 слов', '21 слово', '24 слова']);
const times = [];
for (let i = 0; i < 60; i++) { const start = performance.now(); searchDictionary(extendedWordBank, ['е', 'back', 'при', 'head', 'щетка', 'work'][i % 6]); times.push(performance.now() - start); }
times.sort((a, b) => a - b);
console.log(`Dictionary passed: ${extendedWordBank.length} unique words, ${wordExpansion.length} authored additions and ${supplement.length} cross-checked entries, legacy IDs unchanged, search/status checks. Search median ${times[30].toFixed(2)} ms, p95 ${times[57].toFixed(2)} ms in Node (not iPhone FPS).`);
