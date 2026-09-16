import type {
  IRIToStringFn,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import type { StagedChangeSet, StagedEntity } from "./types";

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
  const field = primaryFields[typeName]?.label;
  const value = field ? entity.document[field] : undefined;
  if (typeof value === "string" && value.length > 0) return value;
  return entity.entityIRI;
};

/** Render the staged creation tree as a multi-line string. */
export const renderCreationTree = (
  changeSet: StagedChangeSet,
  options: FormatCreationTreeOptions,
): string => {
  const { typeIRItoTypeName, primaryFields, heading } = options;
  const entities = changeSet.list();
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

  lines.push(heading ?? `Staged change set ${changeSet.changeSetIRI}:`);
  lines.push("");
  for (const root of changeSet.roots()) {
    printNode(root, 0);
  }
  lines.push("");
  lines.push(`Total staged entities: ${entities.length}`);
  lines.push(`RDF triples in dataset: ${changeSet.dataset.size}`);
  return lines.join("\n");
};

/** Print the staged creation tree with provenance and strategy traces. */
export const formatCreationTree = (
  changeSet: StagedChangeSet,
  options: FormatCreationTreeOptions,
): void => {
  console.log(renderCreationTree(changeSet, options));
};
