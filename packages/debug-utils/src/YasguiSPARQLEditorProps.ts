import type Yasgui from "@triply/yasgui";
import type { CRUDFunctions, Prefixes } from "@graviola/edb-core-types";

export type YasguiSPARQLEditorProps = {
  onInit?: (yasgu: Yasgui) => void;
  prefixes?: Prefixes;
  /** DOM id for the mount node (default `yasgui`). Use a unique value per editor instance. */
  containerId?: string;
  /** Prefill the query editor when YasQE is ready. */
  initialQuery?: string;
  /**
   * When set, YASQE’s Run query uses these CRUD functions (e.g. local Oxigraph) instead of HTTP.
   * Omit to use YASGUI’s default endpoint / requestConfig.
   */
  sparqlCrud?: CRUDFunctions | null;
};
