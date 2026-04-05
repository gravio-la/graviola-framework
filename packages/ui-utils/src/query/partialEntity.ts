export const isPartiallyLoadedEntity = (entity: any) => {
  if (
    typeof entity !== "object" ||
    entity === null ||
    Array.isArray(entity) ||
    !entity["@id"]
  )
    return false;
  const keys = Object.keys(entity);
  if (keys.includes("__label") || keys.includes("__draft")) return true;
  if (keys.length <= 2) return true; // @id and @type
  return false;
};

export const queryOptionMixinBasedOnEntity = (entity: any) =>
  isPartiallyLoadedEntity(entity)
    ? { placeholderData: { document: entity } }
    : { initialData: { document: entity } };
