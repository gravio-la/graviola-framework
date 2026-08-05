import type { IRIToStringFn, StringToIRIFn } from "@graviola/edb-core-types";
import { assignSkolemIris, contentHash8 } from "@graviola/json-schema-utils";
import type {
  PersistencePropertyDescriptor,
  PersistenceManifest,
} from "@graviola/json-schema-prisma-utils";

import { AbstractPrismaClient, PropertiesAndConnects } from "../types";

export type GetPropertiesOptions = {
  IRItoId?: IRIToStringFn;
  typeNameToTypeIRI?: StringToIRIFn;
  typeIsNotIRI?: boolean;
  debug?: boolean;
  /** Root entity IRI (JSON-LD @id) for skolem generation */
  rootEntityIRI?: string;
  persistenceManifest?: PersistenceManifest;
};

function descriptorFor(
  manifest: PersistenceManifest | undefined,
  typeName: string,
  propName: string,
): PersistencePropertyDescriptor | undefined {
  return manifest?.types?.[typeName]?.[propName];
}

function stripAtId(obj: Record<string, unknown>): Record<string, unknown> {
  const { ["@id"]: _id, ...rest } = obj;
  return rest;
}

/**
 * Build nested create payload for a childTable primitive list.
 */
function createPrimitiveChildRows(
  rootEntityIRI: string,
  propertyPath: string,
  values: unknown[],
  IRItoId?: IRIToStringFn,
): { id: string; value: unknown; position: number }[] {
  const assigned = assignSkolemIris(rootEntityIRI, propertyPath, values);
  return assigned.map(({ member, iri }, position) => ({
    id: IRItoId ? IRItoId(iri) : iri,
    value: member,
    position,
  }));
}

/**
 * Build nested create payload for a childTable anonymous object list.
 * Recurses into nested childTable properties via the descriptor.
 */
function createAnonymousChildRows(
  rootEntityIRI: string,
  propertyPath: string,
  members: Record<string, unknown>[],
  descriptor: PersistencePropertyDescriptor,
  IRItoId?: IRIToStringFn,
): Record<string, unknown>[] {
  const assigned = assignSkolemIris(rootEntityIRI, propertyPath, members);
  return assigned.map(({ member, iri, hash }, position) => {
    const row: Record<string, unknown> = {
      id: IRItoId ? IRItoId(iri) : iri,
      position,
    };
    const nested = descriptor.properties ?? {};
    for (const [key, subDesc] of Object.entries(nested)) {
      const value = member[key];
      if (value == null) continue;

      if (subDesc.representation === "scalar") {
        row[key] = value;
        continue;
      }

      if (
        subDesc.representation === "flattened" &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        // Flatten singular object into underscore columns; nested lists become nested creates
        const flatObj = value as Record<string, unknown>;
        const flatProps = subDesc.properties ?? {};
        for (const [fk, fd] of Object.entries(flatProps)) {
          const fv = flatObj[fk];
          if (fv == null) continue;
          if (fd.representation === "scalar") {
            row[`${key}_${fk}`] = fv;
          } else if (
            fd.representation === "childTable" &&
            Array.isArray(fv) &&
            fd.valueType
          ) {
            row[`${key}_${fk}`] = {
              create: createPrimitiveChildRows(
                rootEntityIRI,
                `${propertyPath}/${hash}/${key}/${fk}`,
                fv,
                IRItoId,
              ),
            };
          } else if (
            fd.representation === "childTable" &&
            Array.isArray(fv) &&
            !fd.valueType
          ) {
            row[`${key}_${fk}`] = {
              create: createAnonymousChildRows(
                rootEntityIRI,
                `${propertyPath}/${hash}/${key}/${fk}`,
                fv as Record<string, unknown>[],
                fd,
                IRItoId,
              ),
            };
          }
        }
        continue;
      }

      if (
        subDesc.representation === "childTable" &&
        Array.isArray(value) &&
        subDesc.valueType
      ) {
        row[key] = {
          create: createPrimitiveChildRows(
            rootEntityIRI,
            `${propertyPath}/${hash}/${key}`,
            value,
            IRItoId,
          ),
        };
        continue;
      }

      if (
        subDesc.representation === "childTable" &&
        Array.isArray(value) &&
        !subDesc.valueType
      ) {
        row[key] = {
          create: createAnonymousChildRows(
            rootEntityIRI,
            `${propertyPath}/${hash}/${key}`,
            value as Record<string, unknown>[],
            subDesc,
            IRItoId,
          ),
        };
      }
    }
    return row;
  });
}

/**
 * Prepare embedded Mongo members: strip transparent @id before write.
 */
function prepareEmbeddedMembers(members: unknown[]): unknown[] {
  return members.map((m) => {
    if (m && typeof m === "object" && !Array.isArray(m)) {
      const stripped = stripAtId(m as Record<string, unknown>);
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(stripped)) {
        if (Array.isArray(v)) {
          out[k] = prepareEmbeddedMembers(v);
        } else if (v && typeof v === "object") {
          out[k] = prepareEmbeddedMembers([v])[0];
        } else {
          out[k] = v;
        }
      }
      return out;
    }
    return m;
  });
}

export const getPropertiesAndConnects = async <
  TPrisma extends AbstractPrismaClient = AbstractPrismaClient,
>(
  typeNameOrigin: string,
  document: any,
  prisma: TPrisma,
  importError: Set<string>,
  prefix: string = "",
  options: GetPropertiesOptions = {},
  middleware?: (
    typeIRI: string | undefined,
    entityIRI: string,
    document: any,
    importError: Set<string>,
  ) => Promise<boolean>,
): Promise<PropertiesAndConnects> => {
  const rootEntityIRI =
    options.rootEntityIRI ??
    (typeof document["@id"] === "string" ? document["@id"] : undefined);

  const { id, ...rest } = Object.fromEntries(
    Object.entries(document)
      .filter(([key, value]) => typeof value !== "object")
      .map(([key, value]) => {
        if (key === "@id" && options.IRItoId) {
          return [
            `${prefix}${key.replace("@", "")}`,
            options.IRItoId(value as string),
          ];
        } else if (
          key === "@type" &&
          options.typeIsNotIRI &&
          options.typeNameToTypeIRI
        ) {
          return [
            `${prefix}${key.replace("@", "")}`,
            options.typeNameToTypeIRI(value as string),
          ];
        } else {
          return [`${prefix}${key.replace("@", "")}`, value];
        }
      }),
  );
  let connects: Record<string, { id: string } | { id: string }[]> = {};
  let properties: Record<string, any> = rest;
  const documentObjects = Object.entries(document).filter(
    ([key, value]) => typeof value === "object",
  ) as [string, any][];

  for (let [key, value] of documentObjects) {
    if (value === null) continue;
    const desc = descriptorFor(
      options.persistenceManifest,
      typeNameOrigin,
      key,
    );

    if (Array.isArray(value)) {
      // Manifest-driven multi-value lists
      if (desc?.representation === "childTable" && desc.valueType) {
        if (!rootEntityIRI) {
          importError.add(`missing @id for skolemizing ${key}`);
          continue;
        }
        properties[key] = {
          create: createPrimitiveChildRows(
            rootEntityIRI,
            key,
            value,
            options.IRItoId,
          ),
        };
        continue;
      }

      if (desc?.representation === "childTable" && !desc.valueType) {
        if (!rootEntityIRI) {
          importError.add(`missing @id for skolemizing ${key}`);
          continue;
        }
        properties[key] = {
          create: createAnonymousChildRows(
            rootEntityIRI,
            key,
            value as Record<string, unknown>[],
            desc,
            options.IRItoId,
          ),
        };
        continue;
      }

      if (
        desc?.representation === "scalarList" ||
        desc?.representation === "embedded"
      ) {
        properties[key] =
          desc.representation === "embedded"
            ? prepareEmbeddedMembers(value)
            : value;
        continue;
      }

      // Legacy / $ref entity arrays → connects
      const connectsTemp: { id: string }[] = [];
      const primitiveFallback: unknown[] = [];
      for (let item of value) {
        if (
          item &&
          typeof item === "object" &&
          typeof item["@id"] === "string"
        ) {
          const connectId = options.IRItoId
            ? options.IRItoId(item["@id"])
            : item["@id"];
          if (middleware) {
            const success = await middleware(
              item["@type"],
              item["@id"],
              item,
              importError,
            );
            if (success) connectsTemp.push({ id: connectId });
          } else {
            connectsTemp.push({ id: connectId });
          }
        } else if (typeof item !== "object") {
          // No manifest: keep legacy scalar-array attempt (may fail on SQLite)
          primitiveFallback.push(item);
        } else if (!item["@id"] && rootEntityIRI) {
          // Anonymous object without manifest — skolemize as best-effort create
          // (should not happen when manifest is present)
          if (options.debug) {
            console.warn(
              `anonymous array member on ${typeNameOrigin}.${key} without childTable manifest`,
            );
          }
        }
      }
      if (connectsTemp.length > 0) connects[key] = connectsTemp;
      if (primitiveFallback.length > 0 && !desc) {
        properties[key] = primitiveFallback;
      }
    } else {
      // Singular object
      if (typeof value["@id"] === "string") {
        const connectId = options.IRItoId
          ? options.IRItoId(value["@id"])
          : value["@id"];
        if (middleware) {
          const success = await middleware(
            value["@type"],
            value["@id"],
            value,
            importError,
          );
          if (success) connects[key] = { id: connectId };
        } else {
          connects[key] = { id: connectId };
        }
      } else if (!value["@id"]) {
        const { properties: subProperties, connects: subConnects } =
          await getPropertiesAndConnects(
            typeNameOrigin,
            value,
            prisma,
            importError,
            `${key}_`,
            { ...options, rootEntityIRI },
            middleware,
          );
        properties = {
          ...properties,
          ...subProperties,
        };
        connects = {
          ...connects,
          ...subConnects,
        };
      }
    }
  }
  return {
    id: typeof id === "string" ? id : undefined,
    properties,
    connects,
  };
};

/** Exported for unit tests */
export const _test = {
  createPrimitiveChildRows,
  createAnonymousChildRows,
  contentHash8,
};
