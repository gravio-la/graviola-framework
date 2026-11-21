import type { ChildrenListingOptions, ChildrenListingResult } from "./types";

type Lister<T> = (
  opts?: ChildrenListingOptions,
) => Promise<ChildrenListingResult<T>>;

/**
 * Merge two listing calls so “containers” appear before “members”.
 * Domain-agnostic: callers decide what is a container vs member.
 *
 * Limit applies to the combined list (containers first, then members).
 * `hasMore` is true if either source reports more or the combined total
 * exceeds the requested limit.
 */
export async function composeChildrenFirst<T = Record<string, unknown>>(
  listContainers: Lister<T>,
  listMembers: Lister<T>,
  opts?: ChildrenListingOptions,
): Promise<ChildrenListingResult<T>> {
  const limit = opts?.limit;
  const offset = opts?.offset ?? 0;

  // Fetch enough from each side to fill offset+limit after merge.
  // Without a limit, fetch both fully (adapter may still cap).
  const need = limit != null ? offset + limit : undefined;
  const halfOpts: ChildrenListingOptions | undefined =
    need != null
      ? { ...opts, offset: 0, limit: need }
      : opts
        ? { ...opts, offset: 0 }
        : undefined;

  const [containers, members] = await Promise.all([
    listContainers(halfOpts),
    listMembers(halfOpts),
  ]);

  const merged = [...containers.documents, ...members.documents];
  const totalEstimate =
    (containers.estimatedTotalHits ?? containers.documents.length) +
    (members.estimatedTotalHits ?? members.documents.length);

  const sliced =
    need != null ? merged.slice(offset, offset + limit!) : merged.slice(offset);

  const hasMore =
    Boolean(containers.hasMore) ||
    Boolean(members.hasMore) ||
    (limit != null && offset + sliced.length < merged.length) ||
    (limit != null &&
      (containers.estimatedTotalHits != null ||
        members.estimatedTotalHits != null) &&
      offset + sliced.length < totalEstimate);

  return {
    documents: sliced,
    estimatedTotalHits: totalEstimate,
    hasMore,
  };
}
