// Best-effort, per-instance limiter for guest requests. Signed-in users are
// limited with a database count instead, which holds across instances.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5000) {
    for (const [entryKey, times] of hits) {
      if (now - times[times.length - 1] >= windowMs) {
        hits.delete(entryKey);
      }
    }
  }

  return false;
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
