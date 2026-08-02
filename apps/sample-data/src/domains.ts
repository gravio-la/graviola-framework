import type { SampleDomain } from "./pipeline/types";

/**
 * Domain registry. Each domain folder exports a default SampleDomain
 * from `domain.ts`. Add new domains here.
 */
export const loadDomains = async (): Promise<Map<string, SampleDomain>> => {
  const modules = [await import("../domains/geo/domain")] as Array<{
    default: SampleDomain;
  }>;

  const map = new Map<string, SampleDomain>();
  for (const mod of modules) {
    const domain = mod.default;
    if (map.has(domain.name)) {
      throw new Error(`Duplicate sample domain: ${domain.name}`);
    }
    map.set(domain.name, domain);
  }
  return map;
};
