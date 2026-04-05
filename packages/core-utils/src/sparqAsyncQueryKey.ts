/**
 * Optional correlation between TanStack Query (or any caller) and SPARQL logs:
 * wrap `queryFn` with `runWithSparqlQueryKey(JSON.stringify(queryKey), () => ...)`.
 * Only one concurrent key is tracked; parallel overlapping async work may show the wrong key.
 */
let slot: string | undefined;

export function runWithSparqlQueryKey<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = slot;
  slot = key;
  return Promise.resolve(fn()).finally(() => {
    slot = prev;
  });
}

export function peekSparqlAsyncQueryKey(): string | undefined {
  return slot;
}
