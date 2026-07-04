import type {
  IRIToStringFn,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import type {
  StagedChangeSet,
  StagedEntity,
} from "@graviola/edb-import-staging";

export type FormatCreationTreeOptions = {
  heading?: string;
  typeIRItoTypeName: IRIToStringFn;
  primaryFields: PrimaryFieldDeclaration;
};

const labelFor = (
  entity: StagedEntity,
  typeIRItoTypeName: IRIToStringFn,
  primaryFields: PrimaryFieldDeclaration,
): string => {
  const typeName = typeIRItoTypeName(entity.typeIRI);
  const field = primaryFields[typeName]?.label ?? "title";
  const value = entity.document[field];
  if (typeof value === "string" && value.length > 0) return value;
  return entity.entityIRI;
};

/** String variant of import-staging's formatCreationTree (console-only there). */
export const formatCreationTreeString = (
  changeSet: StagedChangeSet,
  options: FormatCreationTreeOptions,
): string => {
  const { typeIRItoTypeName, primaryFields, heading } = options;
  const lines: string[] = [];

  const printNode = (entity: StagedEntity, depth: number) => {
    const typeName = typeIRItoTypeName(entity.typeIRI);
    const indent = "  ".repeat(depth);
    const trace = entity.trace;
    lines.push(
      `${indent}- [${entity.reviewState}] ${typeName}: ${labelFor(entity, typeIRItoTypeName, primaryFields)} (${entity.entityIRI})`,
    );
    lines.push(
      `${indent}  provenance: ${entity.provenance.method}${entity.provenance.mappingId ? ` / ${entity.provenance.mappingId}` : ""}${entity.provenance.sourceRef ? ` ← ${entity.provenance.sourceRef}` : ""}`,
    );
    lines.push(
      `${indent}  trace: ${trace.decision}${trace.matchMethod ? ` via ${trace.matchMethod}` : ""} path=[${trace.mappingPath.join(" → ")}]`,
    );

    for (const child of changeSet.childrenOf(entity.entityIRI)) {
      printNode(child, depth + 1);
    }
  };

  lines.push(heading ?? `Staged change set ${changeSet.changeSetIRI}:\n`);
  for (const root of changeSet.roots()) {
    printNode(root, 0);
  }
  lines.push(`\nTotal staged entities: ${changeSet.list().length}`);
  lines.push(`RDF triples in dataset: ${changeSet.dataset.size}`);

  return lines.join("\n");
};

export { labelFor };
