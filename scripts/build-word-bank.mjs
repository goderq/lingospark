import { readFile, writeFile } from "node:fs/promises";

const source =
  "https://raw.githubusercontent.com/shamilfrontend/english-russian-dictionary/main/top/top10000.json";
const entries = process.argv[2]
  ? JSON.parse(await readFile(process.argv[2], "utf8"))
  : await (async () => {
      const response = await fetch(source);
      if (!response.ok)
        throw new Error(`Dictionary download failed: ${response.status}`);
      return response.json();
    })();
const seen = new Set();
const compact = entries
  .filter(
    (entry) =>
      /^[a-z][a-z'-]*$/i.test(entry.word || "") &&
      /[а-яё]/i.test(entry.translation || "") &&
      entry.translation !== "—",
  )
  .filter((entry) => {
    const word = entry.word.toLowerCase();
    if (seen.has(word)) return false;
    seen.add(word);
    return true;
  })
  .map((entry) => [
    entry.word.toLowerCase(),
    entry.translation.trim(),
    (entry.transcription || "").trim(),
  ]);

if (compact.length < 7000)
  throw new Error(`Only ${compact.length} valid words`);
await writeFile(
  new URL("../src/data/wordBank.json", import.meta.url),
  JSON.stringify(compact),
);
console.log(`Generated ${compact.length} local English-Russian words.`);
