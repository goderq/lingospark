import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { buildUnifiedReview } from '../src/utils/unifiedReview.js';
import { sampleWithoutReplacement } from '../src/utils/sampling.js';
import { lessons } from '../src/data/course.js';
const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');
const loadData = require('./load-data.cjs');
const oldSource = execFileSync('git', ['show', 'dcfe503:src/utils/unifiedReview.js'], { encoding: 'utf8' });
const compiled = transformSync(oldSource, { babelrc: false, configFile: false, plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')] }).code;
const oldModule = { exports: {} };
new Function('require', 'module', 'exports', compiled)(name => loadData(path.resolve('src/utils', name)), oldModule, oldModule.exports);
const before = oldModule.exports.buildUnifiedReview;
const now = Date.UTC(2026, 10, 17, 12);
const words = Array.from({ length: 10000 }, (_, i) => ({ id: `word-${i}`, english: `sample ${i}`, russian: `пример ${i}` }));
const stats = Object.fromEntries(words.map(word => [word.id, { total: 5, dueDate: '2026-11-16' }]));
const queue = Object.fromEntries(words.map((word, i) => [word.id, { dueAt: now - i * 1000, exercise: { id: word.id, wordId: word.id, type: 'translate', prompt: `Переведи: ${word.english}`, answer: word.russian } }]));
const workloads = [
  { name: '10k due word records, 12-card session', progress: { completed: [], reviewStats: stats }, limit: 12 },
  { name: '10k queued exercises, 12-card session', progress: { completed: [], reviewQueue: queue }, limit: 12 },
  { name: 'Due course check plus 10k word records, 5-card session', progress: { completed: [lessons[0].id], reviewStats: stats, retention: { [lessons[0].id]: { dueAt: now - 1000 } } }, limit: 5 },
];
function measure(fn) {
  for (let i = 0; i < 3; i++) fn();
  const values = Array.from({ length: 30 }, () => { const start = performance.now(); fn(); return performance.now() - start; }).sort((a, b) => a - b);
  return { medianMs: +values[15].toFixed(3), p95Ms: +values[28].toFixed(3) };
}
const rows = workloads.map(workload => {
  const run = fn => {
    const original = Math.random;
    let seed = 12345;
    Math.random = () => { seed = Math.imul(seed, 1664525) + 1013904223 | 0; return (seed >>> 0) / 4294967296; };
    try { return fn(workload.progress, words, lessons, now, workload.limit); } finally { Math.random = original; }
  };
  assert.deepEqual(run(buildUnifiedReview), run(before), 'optimization must preserve due order and contents');
  return { workload: workload.name, before: measure(() => run(before)), after: measure(() => run(buildUnifiedReview)) };
});
for (let i = 0; i < 1000; i++) assert.equal(new Set(sampleWithoutReplacement(words, 50).map(word => word.id)).size, 50);
console.log(JSON.stringify({ scope: 'Node on this workspace, synthetic 10k records, 30 iterations after warm-up. Not iPhone latency, memory, or FPS. Same output checked against dcfe503.', rows, selectionStress: '1000 sessions × 50 cards, no duplicate IDs' }, null, 2));
