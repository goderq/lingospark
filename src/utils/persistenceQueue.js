// Native storage calls may finish in any order. Keep at most one write active
// and one latest pending snapshot; serialize only when it is actually written.
export function createPersistenceQueue({ write, delay = 350, onError = () => {} }) {
  let pending = null, timer = null, running = null, disposed = false;
  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (running) return running.then(() => pending || running ? flush() : undefined);
    if (!pending) return Promise.resolve();
    const job = pending;
    pending = null;
    running = Promise.resolve().then(() => write(job.snapshot, job.modifiedAt)).catch(error => {
      if (!pending) pending = job;
      onError(error);
      // Do not spin on storage failure. The next edit/foreground flush retries.
      throw error;
    }).finally(() => { running = null; });
    return running.then(() => pending ? flush() : undefined);
  };
  return {
    enqueue(snapshot, modifiedAt) {
      if (disposed) return;
      pending = { snapshot, modifiedAt };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { flush().catch(() => {}); }, delay);
    },
    flush,
    dispose() { disposed = true; if (timer) clearTimeout(timer); timer = null; return flush(); },
  };
}
