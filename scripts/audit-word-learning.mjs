import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { curatedExampleCount, wordLearningDetails } from "../src/data/wordLearningData.js";
import { wordExpansion } from '../src/data/wordExpansion.js';

const bank = [...JSON.parse(await readFile(new URL("../src/data/wordBank.json", import.meta.url), "utf8")), ...wordExpansion.map(word => [word.english, word.translation])];
assert.ok(curatedExampleCount >= 50, `only ${curatedExampleCount} curated examples`);

for (const [english, translation] of bank) {
  const details = wordLearningDetails(english, translation);
  assert.ok(details.partOfSpeech, `${english}: missing part of speech`);
  if (details.example) {
    assert.ok(details.exampleRu, `${english}: example has no Russian translation`);
    assert.ok(/[.!?]$/.test(details.example), `${english}: malformed example`);
  }
}

for (const word of ["the", "to", "have", "can", "work", "know"]) {
  const entry = bank.find(([english]) => english === word);
  const details = wordLearningDetails(entry[0], entry[1]);
  assert.ok(details.curated && details.example && details.exampleRu, `${word}: required example missing`);
}

console.log(`word learning audit: ${bank.length} parts of speech, ${curatedExampleCount} curated bilingual examples`);
