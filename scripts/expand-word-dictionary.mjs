import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const [teiPath, musePath] = process.argv.slice(2);
if (!teiPath || !musePath) {
  throw new Error('Usage: node scripts/expand-word-dictionary.mjs eng-rus.tei muse-en-ru.txt');
}

const require = createRequire(import.meta.url);
const load = require('./load-data.cjs');
const legacy = require('../src/data/wordBank.json');
const { wordExpansion } = load(fileURLToPath(new URL('../src/data/wordExpansion.js', import.meta.url)));
const [tei, muse] = await Promise.all([readFile(teiPath, 'utf8'), readFile(musePath, 'utf8')]);
const englishKey = value => value.toLowerCase().replace(/[-']/g, '');
const russianKey = value => value.toLowerCase().replace(/ё/g, 'е');
const seen = new Set([...legacy.map(([english]) => english), ...wordExpansion.map(word => word.english)].map(englishKey));
const englishPattern = /^[a-z]{3,24}(?:-[a-z]{2,15})?$/;
const russianPattern = /^[а-яё]+(?:[ -][а-яё]+){0,2}$/;
const excluded = /(?:porn|masturb|orgasm|whore|prostitut|erotica|порно|мастурб|оргазм|шлюх|проститут|дроч)/i;
const formDefinition = /^(?:\([^)]*\)\s*)?(?:(?:the )?(?:(?:simple |third-person |present |past |first-person |second-person |indicative )*(?:plural|singular|participle|tense))\b.*?\bof\b|alternative (?:spelling|form) of|misspelling of|abbreviation of|initialism of|obsolete form of)/i;
const partsOfSpeech = new Set(['n', 'v', 'adj', 'adv', 'interj']);
const russianEndings = {
  v: /(?:ть|ти|чь)(?:ся|сь)?$/,
  adj: /(?:ый|ий|ой|ая|яя|ое|ее|ые|ие)$/,
};

const museByWord = new Map();
for (const line of muse.split(/\r?\n/)) {
  const separator = line.indexOf(' ');
  if (separator < 1) continue;
  const english = line.slice(0, separator);
  const russian = line.slice(separator + 1).trim();
  if (!englishPattern.test(english) || !russian || !russianPattern.test(russian) || seen.has(englishKey(english))) continue;
  if (!museByWord.has(english)) museByWord.set(english, new Set());
  museByWord.get(english).add(russianKey(russian));
}

const matchesByWord = new Map();
for (const [, entry] of tei.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/g)) {
  const english = entry.match(/<orth>([^<]+)<\/orth>/)?.[1];
  const translations = museByWord.get(english);
  if (!translations || excluded.test(english)) continue;
  const part = entry.match(/<pos>([^<]+)<\/pos>/)?.[1];
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

const result = [];
for (const english of museByWord.keys()) {
  const key = englishKey(english);
  if (seen.has(key) || !matchesByWord.has(english)) continue;
  result.push(matchesByWord.get(english));
  seen.add(key);
}
if (result.length < 4000) throw new Error(`Only ${result.length} words passed the cross-check`);
await writeFile(new URL('../src/data/wordSupplement.json', import.meta.url), `[\n${result.map(row => JSON.stringify(row)).join(',\n')}\n]\n`);
console.log(`Expanded the dictionary with ${result.length} cross-checked entries.`);
