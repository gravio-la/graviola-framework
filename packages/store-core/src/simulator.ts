import type { CapabilityName } from "./descriptor";

/**
 * Synthesizes a missing capability from existing ones.
 */
export type Simulator<
  From extends Partial<Record<CapabilityName, true>>,
  To extends CapabilityName,
> = {
  from: From;
  to: To;
  /** Human-readable identifier for logs/debugging */
  name: string;
  apply: (ctx: unknown) => unknown;
};
