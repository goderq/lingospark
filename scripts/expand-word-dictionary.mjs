import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const [teiPath, musePath, openRussianDir] = process.argv.slice(2);
if (!teiPath || !musePath) {
  throw new Error('Usage: node scripts/expand-word-dictionary.mjs eng-rus.tei muse-en-ru.txt [openrussian-directory]');
}

const require = createRequire(import.meta.url);
const load = require('./load-data.cjs');
const legacy = require('../src/data/wordBank.json');
const { wordPhrasePacks } = load(fileURLToPath(new URL('../src/data/wordPhrasePacks.js', import.meta.url)));
const { wordExpansion } = load(fileURLToPath(new URL('../src/data/wordExpansion.js', import.meta.url)));
const [tei, muse] = await Promise.all([readFile(teiPath, 'utf8'), readFile(musePath, 'utf8')]);
const englishKey = value => value.toLowerCase().replace(/[-']/g, '');
const russianKey = value => value.toLowerCase().replace(/ё/g, 'е');
const seen = new Set([...legacy.map(([english]) => english), ...wordExpansion.map(word => word.english), ...wordPhrasePacks.flatMap(pack => pack.words.map(word => word.english))].map(englishKey));
const englishPattern = /^[a-z]{3,24}(?:-[a-z]{2,15})?$/;
const russianPattern = /^[а-яё]+(?:[ -][а-яё]+){0,2}$/;
const excluded = /(?:porn|masturb|orgasm|whore|prostitut|erotica|порно|мастурб|оргазм|шлюх|проститут|дроч)/i;
const formDefinition = /^(?:\([^)]*\)\s*)?(?:(?:the )?(?:(?:simple |third-person |present |past |first-person |second-person |indicative )*(?:plural|singular|participle|tense))\b.*?\bof\b|alternative (?:spelling|form) of|misspelling of|abbreviation of|initialism of|obsolete form of)/i;
// The cross-check may surface a valid but uncommon or incomplete sense.
const editorialGlosses = new Map([
  ['coronation', 'коронация'],
  ['fricative', 'щелевой согласный'],
  ['primer', 'грунтовка'],
]);
const partsOfSpeech = new Set(['n', 'v', 'adj', 'adv', 'interj']);
const russianEndings = {
  v: /(?:ть|ти|чь)(?:ся|сь)?$/,
  adj: /(?:ый|ий|ой|ая|яя|ое|ее|ые|ие)$/,
};

const museByWord = new Map();
const englishRank = new Map();
for (const line of muse.split(/\r?\n/)) {
  const separator = line.indexOf(' ');
  if (separator < 1) continue;
  const english = line.slice(0, separator);
  if (!englishRank.has(english)) englishRank.set(english, englishRank.size);
  if (openRussianDir || !englishPattern.test(english) || seen.has(englishKey(english))) continue;
  const russian = line.slice(separator + 1).trim();
  if (!russianPattern.test(russian)) continue;
  if (!museByWord.has(english)) museByWord.set(english, new Set());
  museByWord.get(english).add(russianKey(russian));
}

const openRussian = new Map();
if (openRussianDir) {
  const firstExpansion = require('../src/data/wordSupplement.json');
  for (const [english] of firstExpansion) seen.add(englishKey(english));
  const tables = { nouns: 'n', verbs: 'v', adjectives: 'adj', others: 'adv' };
  const sources = await Promise.all(Object.entries(tables).map(async ([table, part]) => {
    const source = await readFile(join(openRussianDir, `${table}.csv`), 'utf8');
    return [part, source];
  }));
  for (const [part, source] of sources) {
    for (const row of source.split(/\r?\n/).slice(1)) {
      const [russian, , translations] = row.split('\t', 4);
      if (!translations || !russianPattern.test(russian)) continue;
      for (const english of translations.split(/[,;]/).map(value => value.trim())) {
        if (!englishPattern.test(english) || (englishRank.get(english) ?? Infinity) >= 35000 || seen.has(englishKey(english))) continue;
        const key = `${part}:${english}`;
        if (!openRussian.has(key)) openRussian.set(key, new Set());
        openRussian.get(key).add(russianKey(russian));
      }
    }
  }
}

const matchesByWord = new Map();
for (const [, entry] of tei.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)) {
  const english = entry.match(/<orth>([^<]+)<\/orth>/)?.[1];
  const part = entry.match(/<pos>([^<]+)<\/pos>/)?.[1];
  const translations = openRussianDir ? openRussian.get(`${part}:${english}`) : museByWord.get(english);
  if (!translations || excluded.test(english)) continue;
  if (!partsOfSpeech.has(part)) continue;
  const definitions = [...entry.matchAll(/<def\b[^>]*>([\s\S]*?)<\/def>/g)].map(([, value]) => value.trim());
  if (!definitions.some(value => !formDefinition.test(value) && !/^\([^)]*(?:archaic|obsolete|offensive|slang)[^)]*\)/i.test(value))) continue;

  for (const [, quote] of entry.matchAll(/<quote>([^<]*)<\/quote>/g)) {
    const translation = quote
      .replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, '$1')
      .replace(/[\u0300\u0301]/g, '')
      .normalize('NFC')
      .trim();
    if (!russianPattern.test(translation) || excluded.test(translation) || !translations.has(russianKey(translation))) continue;
    if (russianEndings[part] && !russianEndings[part].test(translation)) continue;
    if (!matchesByWord.has(english)) matchesByWord.set(english, [english, translation, part]);
    break;
  }
}

const candidates = openRussianDir
  ? [...matchesByWord.keys()].sort((a, b) => englishRank.get(a) - englishRank.get(b))
  : museByWord.keys();
const result = [];
for (const english of candidates) {
  const key = englishKey(english);
  if (seen.has(key) || !matchesByWord.has(english)) continue;
  const [word, russian, part] = matchesByWord.get(english);
  result.push([word, (openRussianDir && editorialGlosses.get(word)) || russian, part]);
  seen.add(key);
}
if (result.length < (openRussianDir ? 1200 : 4000)) throw new Error(`Only ${result.length} words passed the cross-check`);
const output = openRussianDir ? 'wordReferenceSupplement.json' : 'wordSupplement.json';
await writeFile(new URL(`../src/data/${output}`, import.meta.url), `[\n${result.map(row => JSON.stringify(row)).join(',\n')}\n]\n`);
console.log(`Expanded the dictionary with ${result.length} cross-checked entries.`);
