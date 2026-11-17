export function sampleWithoutReplacement(pool, amount, random = Math.random) {
  const count = Math.min(pool.length, Math.max(0, Math.floor(amount)));
  const swaps = new Map(), result = [];
  for (let i = 0; i < count; i++) {
    const remaining = pool.length - i;
    const index = Math.floor(random() * remaining);
    result.push(pool[swaps.get(index) ?? index]);
    swaps.set(index, swaps.get(remaining - 1) ?? remaining - 1);
  }
  return result;
}
const gcd = (a, b) => b ? gcd(b, a % b) : a;
export function wordCandidates(pool, activeId, start, amount) {
  let step = 997;
  while (pool.length > 1 && gcd(step, pool.length) !== 1) step++;
  const result = [], used = new Set([activeId]);
  for (let offset = 1; offset < pool.length && result.length < amount; offset++) {
    const word = pool[(Math.max(start, 0) + offset * step) % pool.length];
    if (!used.has(word.id)) { used.add(word.id); result.push(word); }
  }
  return result;
}
