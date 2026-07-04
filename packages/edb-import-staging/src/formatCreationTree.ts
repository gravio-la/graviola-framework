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
  const field = primaryFields[typeName]?.label ?? "title";
  const value = entity.document[field];
  if (typeof value === "string" && value.length > 0) return value;
  return entity.entityIRI;
};

/** Print the staged creation tree with provenance and strategy traces. */
export const formatCreationTree = (
  changeSet: StagedChangeSet,
  options: FormatCreationTreeOptions,
): void => {
  const { typeIRItoTypeName, primaryFields, heading } = options;
  const entities = changeSet.list();

  const printNode = (entity: StagedEntity, depth: number) => {
    const typeName = typeIRItoTypeName(entity.typeIRI);
    const indent = "  ".repeat(depth);
    const trace = entity.trace;
    console.log(
      `${indent}- [${entity.reviewState}] ${typeName}: ${labelFor(entity, typeIRItoTypeName, primaryFields)} (${entity.entityIRI})`,
    );
    console.log(
      `${indent}  provenance: ${entity.provenance.method}${entity.provenance.mappingId ? ` / ${entity.provenance.mappingId}` : ""}${entity.provenance.sourceRef ? ` ← ${entity.provenance.sourceRef}` : ""}`,
    );
    console.log(
      `${indent}  trace: ${trace.decision}${trace.matchMethod ? ` via ${trace.matchMethod}` : ""} path=[${trace.mappingPath.join(" → ")}]`,
    );

    for (const child of changeSet.childrenOf(entity.entityIRI)) {
      printNode(child, depth + 1);
    }
  };

  console.log(heading ?? `Staged change set ${changeSet.changeSetIRI}:\n`);
  for (const root of changeSet.roots()) {
    printNode(root, 0);
  }
  console.log(`\nTotal staged entities: ${entities.length}`);
  console.log(`RDF triples in dataset: ${changeSet.dataset.size}`);
};
