import type { AsyncOxigraph } from "@graviola/async-oxigraph";
import { RDFMimetype } from "@graviola/async-oxigraph";
import type { Store } from "oxigraph/web";

/** N-Quads — required when the store may contain named graphs */
export async function dumpAsyncOxigraph(ao: AsyncOxigraph): Promise<string> {
  const res = await ao.dump(RDFMimetype.NQUADS);
  if (res.error) {
    throw new Error(String(res.error));
  }
  const data = res.data;
  return typeof data === "string" ? data : "";
}

/** N-Quads — same rationale as {@link dumpAsyncOxigraph}. */
export function dumpSyncStore(store: Store): string {
  return store.dump({ format: "application/n-quads" });
}
