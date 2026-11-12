const assert = require("node:assert/strict");
const bank = require("../src/data/wordBank.json");

const levelForIndex = (index) => index < 800 ? "A1" : index < 2000 ? "A2" : index < 3800 ? "B1" : index < 6000 ? "B2" : "C1";
const limits = { A1: 700, A2: 950, B1: 1250, B2: 900, C1: 550 };
const blocked = /(?:porn|masturb|orgasm|erotica|sexual|whore|prostitut|порно|мастурб|оргазм|проститут|шлюх|дроч)/i;
const counts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 };
const core = [];

for (const [index, entry] of bank.entries()) {
  const [english, translation] = entry;
  const level = levelForIndex(index);
  if (blocked.test(`${english} ${translation}`)) continue;
  if (english.length === 1 && !["a", "i"].includes(english)) continue;
  if (counts[level] >= limits[level]) continue;
  counts[level] += 1;
  core.push(entry);
}

assert.ok(core.length >= 4000 && core.length <= 5000, `unexpected core size: ${core.length}`);
assert.deepEqual(counts, limits);
assert.ok(core.every(([english, translation]) => !blocked.test(`${english} ${translation}`)));
console.log(`core dictionary audit: ${core.length} useful words across A1-C1, ${bank.length} extended`);
