import { readFile } from "node:fs/promises";
import { wordOverrides } from "./word-overrides.mjs";

const bank = JSON.parse(await readFile(new URL("../src/data/wordBank.json", import.meta.url), "utf8"));
const errors = [];
const seen = new Set();
const stableIds = new Set();
for (const [index, [english, translation, transcription, stableId]] of bank.entries()) {
  if (!/^[a-z][a-z'-]*$/.test(english)) errors.push(`${index}: bad English`);
  if (seen.has(english)) errors.push(`${index}: duplicate ${english}`);
  seen.add(english);
  if (!Number.isInteger(stableId) || stableId < 0)
    errors.push(`${english}: invalid stable id`);
  if (stableIds.has(stableId)) errors.push(`${english}: duplicate stable id ${stableId}`);
  stableIds.add(stableId);
  if (!/[а-яё]/i.test(translation)) errors.push(`${english}: no Russian text`);
  if (/[|<>{}=]/.test(translation) || /[a-z]{2,}/i.test(translation))
    errors.push(`${english}: contaminated translation: ${translation}`);
  if (translation.length > 720) errors.push(`${english}: translation too long`);
  if (translation.split(";").length > 3)
    errors.push(`${english}: too many meanings`);
  if (transcription && transcription.length > 45) errors.push(`${english}: transcription too long`);
}
for (const [english, expected] of Object.entries(wordOverrides)) {
  const entry = bank.find(([word]) => word === english);
  if (!entry) errors.push(`required word is missing: ${english}`);
  else if (!entry[1].startsWith(expected.split(";")[0]))
    errors.push(`${english}: expected ${expected}, received ${entry[1]}`);
}
if (bank.length < 8000) errors.push(`dictionary is too small: ${bank.length}`);
if (errors.length) {
  console.error(errors.slice(0, 100).join("\n"));
  process.exit(1);
}
console.log(`Dictionary audit passed: ${bank.length} unique reviewed words.`);
