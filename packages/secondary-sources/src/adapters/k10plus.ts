import { registerAdapter } from "./registry";

/** Stub adapter — discoverable; full SRU wiring deferred. */
export function registerK10PlusAdapter(): void {
  registerAdapter({
    id: "k10plus",
    label: "K10plus (SRU)",
    description:
      "K10plus catalog search via SRU (stub — returns empty until configured)",
    search: async () => [],
    getEntity: async (iri) => ({ "@id": iri, note: "K10plus adapter stub" }),
  });
}
