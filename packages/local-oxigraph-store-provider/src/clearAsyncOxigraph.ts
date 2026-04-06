import type { AsyncOxigraph } from "@graviola/async-oxigraph";

const CLEAR_ALL = "CLEAR ALL";
/** Fallback: default graph only; does not remove named graphs */
const DELETE_DEFAULT_GRAPH = "DELETE WHERE { ?s ?p ?o }";

/**
 * Empties the worker-backed Oxigraph dataset
 */
export async function clearAsyncOxigraphDataset(
  ao: AsyncOxigraph,
): Promise<void> {
  try {
    await ao.query(CLEAR_ALL);
    return;
  } catch {
    // CLEAR ALL unsupported or failed — try default graph only
  }
  try {
    await ao.query(DELETE_DEFAULT_GRAPH);
  } catch (e) {
    throw new Error(`Failed to clear Oxigraph dataset: ${String(e)}`);
  }
}
