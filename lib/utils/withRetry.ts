export async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === retries - 1) throw e;
      console.warn(`Attempt ${i + 1} failed, retrying...`, e);
    }
  }
  throw new Error('unreachable');
}
