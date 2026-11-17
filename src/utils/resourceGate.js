export function createResourceGate() {
  let tail = Promise.resolve(), active = null, resident = null, pending = 0;
  const handlers = new Map();
  const schedule = task => {
    pending++;
    const job = tail.then(async () => { pending--; return task(); });
    tail = job.catch(() => {});
    return job;
  };
  return {
    register(kind, release, cancel = async () => {}) { handlers.set(kind, { release, cancel }); },
    run(kind, task) {
      return schedule(async () => {
        if (resident && resident !== kind) { await handlers.get(resident)?.release(); resident = null; }
        active = kind; resident = kind;
        try { return await task(); } finally { active = null; }
      });
    },
    async releaseAll() {
      try { await handlers.get(active)?.cancel(); } catch {}
      return schedule(async () => { if (resident) await handlers.get(resident)?.release(); resident = null; });
    },
    release(kind) { return schedule(async () => { if (resident === kind) { await handlers.get(kind)?.release(); resident = null; } }); },
    state: () => ({ active, resident, pending }),
  };
}
