import assert from 'node:assert/strict';
import { createPersistenceQueue } from '../src/utils/persistenceQueue.js';
import { createSelectorStore, shallowEqual } from '../src/utils/selectorStore.js';
import { createResourceGate } from '../src/utils/resourceGate.js';
import { budgetMessages, recentTranscript } from '../src/utils/contextBudget.js';
import { backupEnvelope, parseBackup, snapshotKey, recoverStoredProgress } from '../src/utils/snapshot.js';
import { sampleWithoutReplacement, wordCandidates } from '../src/utils/sampling.js';
import { readWordSession } from '../src/utils/wordSession.js';
import { readStudyDraft, studySourceKey } from '../src/utils/studyDraft.js';
import { cloudDecision } from '../src/utils/cloudDecision.js';
import { writeCloud } from '../src/services/cloudTransport.js';
import { applyRewardPolicy } from '../src/utils/rewardPolicy.js';
import { advanceWordReview, wordEstablished } from '../src/utils/wordSchedule.js';

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const tick = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const first = deferred(), second = deferred(), writes = [];
let persisted;
const queue = createPersistenceQueue({ delay: 100000, write: async snapshot => { writes.push(snapshot.value); await (snapshot.value === 1 ? first.promise : second.promise); persisted = snapshot.value; } });
queue.enqueue({ value: 1 }, 'one'); const saving = queue.flush(); await tick();
queue.enqueue({ value: 2 }, 'two'); queue.enqueue({ value: 3 }, 'three');
const flushA = queue.flush(), flushB = queue.flush();
assert.deepEqual(writes, [1]); first.resolve(); await tick();
assert.deepEqual(writes, [1, 3], 'intermediate keystrokes must be coalesced');
second.resolve(); await Promise.all([saving, flushA, flushB]); assert.equal(persisted, 3);
await queue.dispose();
let attempts = 0;
const retryQueue = createPersistenceQueue({ delay: 100000, write: async () => { if (++attempts === 1) throw new Error('disk'); } });
retryQueue.enqueue({}, 'now'); await assert.rejects(retryQueue.flush(), /disk/); await retryQueue.flush(); assert.equal(attempts, 2); await retryQueue.dispose();

const store = createSelectorStore({ ready: true, progress: { onboarded: true, lessonDraft: null } });
let navigationUpdates = 0, typingUpdates = 0;
let selected = { ready: true, onboarded: true };
store.subscribe(() => { const state = store.getSnapshot(); const next = { ready: state.ready, onboarded: state.progress.onboarded }; if (!shallowEqual(selected, next)) { selected = next; navigationUpdates++; } });
store.subscribe(() => typingUpdates++);
for (let i = 0; i < 100; i++) store.publish({ ready: true, progress: { onboarded: true, lessonDraft: { typed: 'x'.repeat(i) } } });
assert.equal(navigationUpdates, 0, 'typing must not change the navigation selection'); assert.equal(typingUpdates, 100);

const gate = createResourceGate(), blocked = deferred(), events = [];
gate.register('llm', async () => events.push('release-llm'), async () => { events.push('cancel-llm'); blocked.resolve(); });
gate.register('stt', async () => events.push('release-stt'));
const generation = gate.run('llm', async () => { events.push('llm-start'); await blocked.promise; events.push('llm-end'); });
const transcription = gate.run('stt', async () => { events.push('stt-start'); });
await tick(); assert.deepEqual(events, ['llm-start']); blocked.resolve(); await Promise.all([generation, transcription]);
assert.deepEqual(events, ['llm-start', 'llm-end', 'release-llm', 'stt-start']);
await gate.release('llm'); assert.equal(gate.state().resident, 'stt', 'releasing an absent LLM must not evict STT');
await gate.releaseAll(); assert.equal(gate.state().resident, null);
const cancelGate = createResourceGate(), waiting = deferred();
cancelGate.register('llm', async () => {}, async () => waiting.resolve());
const activeJob = cancelGate.run('llm', () => waiting.promise); await tick(); await cancelGate.releaseAll(); await activeJob;
assert.equal(cancelGate.state().resident, null);

const messages = [{ role: 'system', content: 'a'.repeat(2000) + 'KEEP_COURSE_GOAL' }, ...Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'b'.repeat(150) })), { role: 'user', content: 'Latest exact sentence' }];
const budgeted = budgetMessages(messages, 1800);
assert.equal(budgeted.at(-1).content, 'Latest exact sentence'); assert.ok(budgeted[0].content.includes('KEEP_COURSE_GOAL'));
assert.ok(budgeted.reduce((n, item) => n + item.content.length, 0) <= 1800);
assert.throws(() => budgetMessages([{ role: 'user', content: 'x'.repeat(3000) }], 1200), /длинное/);
const transcript = recentTranscript(messages);
assert.ok(transcript.text.endsWith('Latest exact sentence')); assert.ok(transcript.included < transcript.total);
assert.ok(transcript.text.startsWith('Ученик:') || transcript.text.startsWith('Преподаватель:'));
assert.throws(() => recentTranscript([{ role: 'user', content: 'x'.repeat(1000) }]), /длинная/);

const local = { name: 'Learner', completed: ['greetings'], totalXP: 20 };
const remote = { progress: { ...local, completed: ['greetings', 'cafe'], totalXP: 45 }, revision: 3 };
assert.equal(cloudDecision({ local, remote, userId: 'u' }), 'conflict', 'a later timestamp alone must not silently replace learning');
assert.equal(cloudDecision({ local: { name: 'Fresh', completed: [] }, remote, userId: 'u' }), 'cloud');
assert.equal(cloudDecision({ local, remote, userId: 'u', base: { key: snapshotKey(local), revision: 2 } }), 'cloud');
assert.equal(cloudDecision({ local, remote, userId: 'u', base: { key: snapshotKey(remote.progress), revision: 3 } }), 'local');
assert.equal(cloudDecision({ local, remote, owner: 'other', userId: 'u' }), 'cloud');
assert.equal(cloudDecision({ local, remote: null, owner: 'other', userId: 'u' }), 'clean');
const envelope = backupEnvelope(local);
assert.deepEqual(parseBackup(JSON.parse(JSON.stringify(envelope))), local);
assert.equal(snapshotKey({ a: 1, b: 2 }), snapshotKey({ b: 2, a: 1 }));
assert.throws(() => parseBackup({ ...envelope, progress: { ...local, totalXP: 999 } }), /повреждена/);
assert.throws(() => parseBackup({ ...envelope, backupVersion: 99 }), /новой/);
assert.deepEqual(parseBackup({ ...local, backupVersion: 1 }).completed, local.completed);
assert.equal(recoverStoredProgress(null, null), null);
assert.equal(recoverStoredProgress(JSON.stringify(local), '{broken').recovered, false);
assert.deepEqual(recoverStoredProgress('{broken', JSON.stringify(local)), { progress: local, raw: JSON.stringify(local), recovered: true });
assert.throws(() => recoverStoredProgress('{broken', '{also broken'), /локальные копии/);
assert.throws(() => parseBackup({ ...local, studyDrafts: [] }), /studyDrafts/);
assert.equal(cloudDecision({ local: { completed: [], journeys: { greetings: { stages: { words: { attempts: 1 } } } } }, remote, userId: 'u' }), 'conflict');

const pool = Array.from({ length: 997 }, (_, id) => ({ id: String(id) }));
const sampled = sampleWithoutReplacement(pool, 997, () => 0);
assert.equal(new Set(sampled.map(item => item.id)).size, 997);
const candidates = wordCandidates(pool, '0', 0, 4);
assert.equal(candidates.length, 4); assert.ok(candidates.every(item => item.id !== '0'));
const source = { id: 'present', formula: 'do', exercises: [{ answer: 'do' }, { answer: 'does' }] };
const draft = { version: 1, sourceId: source.id, contentKey: studySourceKey(source), index: 1, selected: '', score: 1, learning: true, seed: 33 };
assert.deepEqual(readStudyDraft(draft, [source]), draft);
assert.deepEqual(readStudyDraft(draft, [{ ...source, formula: 'changed' }]), {});
assert.deepEqual(readStudyDraft({ ...draft, score: 2 }, [source]), {});
const wordDraft = { version: 1, sessionId: 'word-1', deck: [{ id: 'hello', english: 'hello', russian: 'привет', level: 'A1', direction: 'en-ru' }], index: 0, phase: 'test', answer: 'привет', letterTiles: [], usedLetters: [], score: 1, checked: true, correct: true, grade: 'correct', editingTranslation: false, translationDraft: '', level: 'A1', mode: 'typing', catalogMode: 'core', directionMode: 'mixed', amount: 10, theme: 'all', statusFilter: 'all', optionSeed: 42 };
assert.deepEqual(readWordSession(JSON.parse(JSON.stringify(wordDraft))), wordDraft);
assert.deepEqual(readWordSession({ ...wordDraft, score: 2 }), {});
assert.deepEqual(readWordSession({ ...wordDraft, deck: [{ ...wordDraft.deck[0], direction: 'invalid' }] }), {});

// Two devices race against the same in-memory row using the actual transport.
let row = { user_id: 'u', revision: 1, progress: local };
const client = { from(table) { assert.equal(table, 'user_progress'); const filters = {}; let payload, inserting = false; return {
  update(value) { payload = value; return this; }, insert(value) { payload = value; inserting = true; return this; },
  eq(key, value) { filters[key] = value; return this; }, select() { return this; }, async maybeSingle() {
    await tick();
    if (inserting) { if (row) return { data: null, error: { code: '23505' } }; row = payload; return { data: row }; }
    assert.equal(filters.user_id, 'u');
    if (row.revision !== filters.revision) return { data: null, error: null };
    row = { ...row, ...payload }; return { data: row, error: null };
  },
}; } };
const race = await Promise.all([writeCloud(client, 'u', { ...local, totalXP: 30 }, 1), writeCloud(client, 'u', { ...local, totalXP: 40 }, 1)]);
assert.equal(race.filter(result => result.data).length, 1); assert.equal(race.filter(result => result.conflict).length, 1); assert.equal(row.revision, 2);
assert.equal((await writeCloud(client, 'u', local, 0)).conflict, true, 'initial insert must not overwrite an existing row');
await assert.rejects(writeCloud(client, 'u', local, -1), /версия/);

const action = { name: 'recordReview', args: [{ id: 'hello' }, true] };
const paid = applyRewardPolicy({ coins: 0 }, { coins: 2 }, action, 100000000);
assert.equal(paid.coins, 2); assert.equal(applyRewardPolicy(paid, { ...paid, coins: 4 }, action, 100000000).coins, 2);
assert.equal(applyRewardPolicy({ coins: 0, completed: ['greetings'] }, { coins: 3 }, { name: 'completeLesson', args: [{ id: 'greetings' }] }).coins, 0);
assert.equal(applyRewardPolicy({ coins: 0 }, { coins: 6 }, { name: 'recordDialogue', args: [] }).coins, 0);

const day = 86400000, start = Date.UTC(2026, 10, 16, 12);
let word = advanceWordReview({}, true, start, false);
for (let i = 0; i < 10; i++) word = advanceWordReview(word, true, start, true);
assert.equal(word.interval, 1); assert.equal(wordEstablished(word), false);
word = advanceWordReview(word, true, start + day); assert.equal(word.successfulDays, 1);
word = advanceWordReview(word, true, start + 4 * day); assert.equal(word.successfulDays, 2);
word = advanceWordReview(word, true, start + 11 * day); assert.equal(wordEstablished(word), true);
word = advanceWordReview(word, false, start + 12 * day); assert.equal(wordEstablished(word), false);
console.log('Architecture passed: ordered/coalesced persistence, selectors, model exclusion/cancellation, context bounds, cloud CAS/conflicts, backup versions, reward replay and spaced word checks.');
