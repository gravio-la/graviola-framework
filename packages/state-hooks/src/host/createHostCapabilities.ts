import type {
  ActionTarget,
  HostCapabilityDeclaration,
  HostCapabilityId,
  HostCapabilities,
} from "@graviola/edb-core-types";

const ROUTE_CAPABILITIES: HostCapabilityId[] = [
  "open-in-route",
  "open-in-new-tab",
  "open-in-window",
];

export const DEFAULT_HOST_CAPABILITY_DECLARATION: HostCapabilityDeclaration = {
  supports: ["open-in-modal", "edit-entity"],
  entityRoute: () => null,
};

export function createHostCapabilities(
  declaration: HostCapabilityDeclaration = DEFAULT_HOST_CAPABILITY_DECLARATION,
): HostCapabilities {
  const supports = new Set(declaration.supports);

  const entityHref = (target: ActionTarget): string | null => {
    if (!target.entityIRI || !declaration.entityRoute) return null;
    return declaration.entityRoute({
      ...target,
      entityIRI: target.entityIRI,
    });
  };

  const has = (id: HostCapabilityId, target?: ActionTarget): boolean => {
    if (!supports.has(id)) return false;
    if (ROUTE_CAPABILITIES.includes(id)) {
      if (!target?.entityIRI) return false;
      return entityHref(target) != null;
    }
    return true;
  };

  return { has, entityHref };
}
