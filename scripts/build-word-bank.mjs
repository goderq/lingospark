import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { wordOverrides, preferredPartsOfSpeech, wordTranscriptionOverrides } from "./word-overrides.mjs";

const FREEDICT_VERSION = "2025.11.23";
const FREEDICT_URL = `https://download.freedict.org/dictionaries/eng-rus/${FREEDICT_VERSION}/freedict-eng-rus-${FREEDICT_VERSION}.src.tar.xz`;
const MUSE_URL = "https://dl.fbaipublicfiles.com/arrival/dictionaries/en-ru.txt";
const outputUrl = new URL("../src/data/wordBank.json", import.meta.url);
const sourcePath = process.argv[2];
const existing = JSON.parse(
  await readFile(sourcePath || outputUrl, "utf8"),
);
const workDir = await mkdtemp(join(tmpdir(), "lingospark-dictionary-"));

const download = async (url, name) => {
  const path = join(workDir, name);
  execFileSync("curl", ["-fsSL", url, "-o", path]);
  return path;
};

const archive = await download(FREEDICT_URL, "eng-rus.tar.xz");
execFileSync("tar", ["-xJf", archive, "-C", workDir]);
const tei = await readFile(join(workDir, "eng-rus", "eng-rus.tei"), "utf8");
const musePath = await download(MUSE_URL, "muse-en-ru.txt");
const muse = await readFile(musePath, "utf8");

const cleanText = (value = "") =>
  value
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[\u0300\u0301]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const validRussian = (value) =>
  /[а-яё]/i.test(value) &&
  value.length <= 80 &&
  !/[a-z]{2,}/i.test(value) &&
  !/[|<>{}=]/.test(value) &&
  !/перевод|thumb|wikipedia|http|category/i.test(value);

const freedict = new Map();
for (const match of tei.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/g)) {
  const body = match[1];
  const english = cleanText(body.match(/<orth(?:\s[^>]*)?>([\s\S]*?)<\/orth>/)?.[1]).toLowerCase();
  if (!/^[a-z][a-z'-]*$/.test(english)) continue;
  const partOfSpeech = cleanText(body.match(/<pos(?:\s[^>]*)?>([\s\S]*?)<\/pos>/)?.[1]).toLowerCase();
  const transcription = cleanText(body.match(/<pron(?:\s[^>]*)?>([\s\S]*?)<\/pron>/)?.[1]);
  const translations = [...body.matchAll(/<quote(?:\s[^>]*)?>([\s\S]*?)<\/quote>/g)]
    .map((quote) => cleanText(quote[1]))
    .filter(validRussian);
  if (!translations.length) continue;
  if (!freedict.has(english)) freedict.set(english, []);
  freedict.get(english).push({ partOfSpeech, transcription, translations });
}

const museTranslations = new Map();
for (const line of muse.split("\n")) {
  const separator = line.indexOf(" ");
  if (separator < 1) continue;
  const english = line.slice(0, separator).toLowerCase();
  const russian = cleanText(line.slice(separator + 1));
  if (!/^[a-z][a-z'-]*$/.test(english) || !validRussian(russian)) continue;
  if (!museTranslations.has(english)) museTranslations.set(english, []);
  museTranslations.get(english).push(russian);
}

const unique = (values) => {
  const seen = new Set();
  return values.filter((value) => {
    const key = value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const partScore = (word, partOfSpeech) => {
  const preferred = preferredPartsOfSpeech[word] || [];
  const preferredIndex = preferred.findIndex((value) => partOfSpeech.startsWith(value));
  if (preferredIndex >= 0) return 100 - preferredIndex;
  if (/^(pn|proper|abbreviation|prefix|suffix|symbol)/.test(partOfSpeech)) return -20;
  const general = ["n", "v", "adj", "adv", "pronoun", "determiner", "preposition", "conjunction"];
  const index = general.findIndex((value) => partOfSpeech.startsWith(value));
  return index < 0 ? 0 : 20 - index;
};

const nominativePlural = (values) =>
  values.find((value) => /(?:ы|и|а|я)$/i.test(value)) || values[0];

const result = [];
const coverage = { override: 0, freedict: 0, muse: 0, dropped: 0 };
for (const [sourceIndex, sourceEntry] of existing.entries()) {
  const [english, oldTranslation, oldTranscription = "", savedIndex] = sourceEntry;
  const stableIndex = Number.isInteger(savedIndex) ? savedIndex : sourceIndex;
  const override = wordOverrides[english];
  const entries = [...(freedict.get(english) || [])].sort(
    (a, b) => partScore(english, b.partOfSpeech) - partScore(english, a.partOfSpeech),
  );
  const preferred = preferredPartsOfSpeech[english] || [];
  const preferredEntries = preferred.length
    ? entries.filter((entry) =>
        preferred.some((part) => entry.partOfSpeech.startsWith(part)),
      )
    : entries.filter((entry) => partScore(english, entry.partOfSpeech) >= 0);
  const selectedEntries = preferredEntries.length ? preferredEntries : entries;
  const freeValues = unique(selectedEntries.flatMap((entry) => entry.translations));
  const museValues = unique(museTranslations.get(english) || []);
  let primary;
  let variants = [];

  if (override) {
    [primary, ...variants] = override.split(";").map((value) => value.trim());
    coverage.override += 1;
  } else if (freeValues.length) {
    const museKeys = new Set(
      museValues.map((value) => value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е")),
    );
    primary =
      freeValues.find((value) =>
        museKeys.has(value.toLocaleLowerCase("ru-RU").replace(/ё/g, "е")),
      ) || freeValues[0];
    variants = freeValues.filter((value) => value !== primary);
    coverage.freedict += 1;
  } else if (museValues.length) {
    primary = english.endsWith("s") ? nominativePlural(museValues) : museValues[0];
    variants = museValues.filter((value) => value !== primary);
    coverage.muse += 1;
  } else {
    coverage.dropped += 1;
    continue;
  }

  const alternatives = unique(
    override ? variants : [...variants, ...freeValues, ...museValues],
  )
    .filter((value) => value !== primary && validRussian(value));
  const newTranscription = selectedEntries[0]?.transcription;
  const transcription = newTranscription && newTranscription.length <= 45 && !/[<!>{}=]/.test(newTranscription)
    ? newTranscription
    : oldTranscription === "[]" ? "" : oldTranscription;
  const selectedTranslations = override
    ? unique([primary, ...alternatives]).slice(0, 3)
    : [primary];
  result.push([
    english,
    selectedTranslations.join("; "),
    wordTranscriptionOverrides[english] || transcription,
    stableIndex,
  ]);
}

if (result.length < 8000) throw new Error(`Only ${result.length} trustworthy words remain`);
await writeFile(outputUrl, JSON.stringify(result));
console.log(`Generated ${result.length} reviewed English-Russian words.`);
console.log(coverage);
