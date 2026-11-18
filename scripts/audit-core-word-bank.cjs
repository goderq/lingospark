const assert = require("node:assert/strict");
const loadData = require('./load-data.cjs');
const { wordBank: core, extendedWordBank: bank, wordCountsByLevel: counts } = loadData(require('node:path').join(__dirname, '../src/data/wordBank.js'));

const limits = { A1: 700, A2: 950, B1: 1250, B2: 900, C1: 550 };
const additions = loadData(require('node:path').join(__dirname, '../src/data/wordExpansion.js')).wordExpansion;
for (const word of additions) limits[word.level] += 1;
const blocked = /(?:porn|masturb|orgasm|erotica|sexual|whore|prostitut|порно|мастурб|оргазм|проститут|шлюх|дроч)/i;

assert.ok(core.length >= 4000 && core.length <= 5000, `unexpected core size: ${core.length}`);
assert.deepEqual(counts, limits);
assert.ok(additions.every(extra => core.some(word => word.id === `extra-${extra.english}`)), 'new authored words must be available in core sessions');
assert.ok(core.every(word => !blocked.test(`${word.english} ${word.fullTranslation}`)));
assert.ok(!core.some(word => ['michael', 'david', 'jane'].includes(word.english)), 'corpus names must not appear as random learning words');
console.log(`core dictionary audit: ${core.length} useful words across A1-C1, ${bank.length} extended`);
