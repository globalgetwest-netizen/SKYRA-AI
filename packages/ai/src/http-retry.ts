/**
 * fetch() that automatically retries on transient rate-limit / overload
 * responses (HTTP 429 and 503) with exponential backoff. Free-tier per-minute
 * quotas reset quickly, so a short wait-and-retry usually gets through. If the
 * limit is a hard daily/plan cap, the final response is returned so the caller
 * can surface the real error.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  { retries = 3, waitsMs = [8000, 20000, 40000] }: { retries?: number; waitsMs?: number[] } = {},
): Promise<Response> {
  let res = await fetch(url, init);

  for (let attempt = 0; attempt < retries; attempt++) {
    if (res.status !== 429 && res.status !== 503) return res;
    const wait = waitsMs[attempt] ?? waitsMs[waitsMs.length - 1];
    console.log(`  (rate-limited ${res.status}; retrying in ${Math.round(wait / 1000)}s…)`);
    await sleep(wait);
    res = await fetch(url, init);
  }

  return res;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
