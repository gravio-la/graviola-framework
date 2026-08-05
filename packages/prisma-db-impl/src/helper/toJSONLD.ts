import { StringToIRIFn } from "@graviola/edb-core-types";
import { filterUndefOrNull } from "@graviola/edb-core-utils";
import { assignSkolemIris } from "@graviola/json-schema-utils";
import type {
  PersistenceManifest,
  PersistencePropertyDescriptor,
} from "@graviola/json-schema-prisma-utils";
import merge from "lodash-es/merge";

export const splitUpLoDashConnectedEntry = (str: string, value: any) => {
  const parts = str.split("_");
  return parts.reduceRight((acc, part) => ({ [part]: acc }), value);
};

export type ToJSONLDOptions = {
  idToIRI?: StringToIRIFn;
  typeNameToTypeIRI?: StringToIRIFn;
  persistenceManifest?: PersistenceManifest;
  /** Current type name for looking up manifest descriptors */
  typeName?: string;
  /** Root entity IRI for computing embedded skolem @ids */
  rootEntityIRI?: string;
  /** Property path prefix for nested skolemization */
  propertyPathPrefix?: string;
};

function isPrimitiveChildRow(
  v: unknown,
): v is { value: unknown; position?: number } {
  return (
    v != null &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    "value" in (v as object) &&
    Object.keys(v as object).every(
      (k) => ["id", "value", "position"].includes(k) || k.endsWith("_id"),
    )
  );
}

function collapsePrimitiveRows(rows: unknown[]): unknown[] {
  return [...rows]
    .map((r) => r as { value: unknown; position?: number })
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((r) => r.value);
}

function reinflateAnonymousRow(
  row: Record<string, unknown>,
  descriptor: PersistencePropertyDescriptor | undefined,
  options: ToJSONLDOptions,
  propertyPath: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Rebuild @id from id column
  if (typeof row.id === "string") {
    result["@id"] = options.idToIRI ? options.idToIRI(row.id) : row.id;
  }

  const nested = descriptor?.properties ?? {};
  const handledKeys = new Set<string>(["id", "position"]);

  // Collect underscore-flattened groups
  const flatGroups = new Map<string, Record<string, unknown>>();

  for (const [key, value] of Object.entries(row)) {
    if (key === "id" || key === "position" || key.endsWith("_id")) {
      handledKeys.add(key);
      continue;
    }

    // Flattened nested list: copyright_notes → fold into copyright.notes later
    const flatMatch = key.includes("_")
      ? (() => {
          const [group, ...rest] = key.split("_");
          const restKey = rest.join("_");
          const flatDesc = nested[group];
          if (
            flatDesc?.representation === "flattened" &&
            flatDesc.properties?.[restKey]
          ) {
            return { group, restKey, fd: flatDesc.properties[restKey] };
          }
          return null;
        })()
      : null;

    if (flatMatch) {
      if (!flatGroups.has(flatMatch.group)) flatGroups.set(flatMatch.group, {});
      const groupObj = flatGroups.get(flatMatch.group)!;
      if (
        Array.isArray(value) &&
        (flatMatch.fd.representation === "childTable" ||
          (value.length > 0 && isPrimitiveChildRow(value[0])))
      ) {
        groupObj[flatMatch.restKey] = collapsePrimitiveRows(value);
      } else if (Array.isArray(value)) {
        groupObj[flatMatch.restKey] = value;
      } else {
        groupObj[flatMatch.restKey] = value;
      }
      handledKeys.add(key);
      continue;
    }

    const subDesc = nested[key];

    // Child table primitive list on this row
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      isPrimitiveChildRow(value[0])
    ) {
      result[key] = collapsePrimitiveRows(value);
      handledKeys.add(key);
      continue;
    }

    // Child table anonymous list
    if (
      Array.isArray(value) &&
      subDesc?.representation === "childTable" &&
      !subDesc.valueType
    ) {
      const parentHash =
        typeof row.id === "string"
          ? (String(row.id).split("/").pop() ?? contentHashFallback(row))
          : "0";
      result[key] = value
        .map((item) => item as Record<string, unknown>)
        .sort(
          (a, b) =>
            ((a.position as number) ?? 0) - ((b.position as number) ?? 0),
        )
        .map((item) =>
          reinflateAnonymousRow(
            item,
            subDesc,
            options,
            `${propertyPath}/${parentHash}/${key}`,
          ),
        );
      handledKeys.add(key);
      continue;
    }

    // Underscore-flattened field (copyright_year) or nested list (copyright_notes)
    if (key.includes("_") && !subDesc) {
      const [group, ...rest] = key.split("_");
      const restKey = rest.join("_");
      if (!flatGroups.has(group)) flatGroups.set(group, {});
      const groupObj = flatGroups.get(group)!;

      if (
        Array.isArray(value) &&
        value.length > 0 &&
        isPrimitiveChildRow(value[0])
      ) {
        groupObj[restKey] = collapsePrimitiveRows(value);
      } else if (Array.isArray(value)) {
        // Could be nested anonymous under flattened path — rare
        groupObj[restKey] = value;
      } else {
        groupObj[restKey] = value;
      }
      handledKeys.add(key);
      continue;
    }

    if (value !== null && value !== undefined) {
      result[key] = value;
      handledKeys.add(key);
    }
  }

  // Merge flattened groups; also handle nested lists keyed as group_notes
  for (const [group, groupObj] of flatGroups) {
    const flatDesc = nested[group];
    // Re-scan for group_xxx child tables that use the flattened field naming
    if (flatDesc?.representation === "flattened" && flatDesc.properties) {
      for (const [fk, fd] of Object.entries(flatDesc.properties)) {
        const flatKey = `${group}_${fk}`;
        if (flatKey in row && Array.isArray(row[flatKey])) {
          if (fd.representation === "childTable" && fd.valueType) {
            groupObj[fk] = collapsePrimitiveRows(row[flatKey] as unknown[]);
          }
        }
      }
    }
    if (Object.keys(groupObj).length > 0) {
      result[group] = groupObj;
    }
  }

  return result;
}

function contentHashFallback(_row: Record<string, unknown>): string {
  return "x";
}

/**
 * Attach deterministic skolem @id to Mongo embedded members so JSON-LD matches SQL.
 */
function attachEmbeddedSkolemIds(
  members: unknown[],
  rootEntityIRI: string,
  propertyPath: string,
  descriptor: PersistencePropertyDescriptor | undefined,
): unknown[] {
  const objects = members.filter(
    (m) => m && typeof m === "object" && !Array.isArray(m),
  ) as Record<string, unknown>[];
  const assigned = assignSkolemIris(rootEntityIRI, propertyPath, objects);
  return assigned.map(({ member, iri, hash }) => {
    const out: Record<string, unknown> = { ...member, "@id": iri };
    const nested = descriptor?.properties ?? {};
    for (const [key, subDesc] of Object.entries(nested)) {
      const val = out[key];
      if (subDesc.representation === "embedded" && Array.isArray(val)) {
        out[key] = attachEmbeddedSkolemIds(
          val,
          rootEntityIRI,
          `${propertyPath}/${hash}/${key}`,
          subDesc,
        );
      } else if (
        subDesc.representation === "embedded" &&
        val &&
        typeof val === "object" &&
        !Array.isArray(val)
      ) {
        // singular embedded — no @id per plan
      }
    }
    return out;
  });
}

/**
 * Converts a Prisma row to JSON-LD, collapsing child-table multi-value lists
 * and reinflating underscore-flattened singular objects.
 */
export const toJSONLD = (
  obj: any,
  visited = new WeakSet(),
  options: ToJSONLDOptions = {},
): any => {
  if (obj && typeof obj === "object") {
    if (obj instanceof Date) {
      return obj.getTime();
    }
    if (visited.has(obj)) {
      return obj;
    }
    visited.add(obj);
    if (Array.isArray(obj)) {
      // Primitive child rows without parent context
      if (obj.length > 0 && isPrimitiveChildRow(obj[0])) {
        return collapsePrimitiveRows(obj);
      }
      return obj.map((item) => toJSONLD(item, visited, options));
    }

    const typeName = options.typeName;
    const manifest = options.persistenceManifest;
    const typeManifest = typeName ? manifest?.types?.[typeName] : undefined;

    // Resolve root IRI for embedded skolemization
    let rootEntityIRI = options.rootEntityIRI;
    if (!rootEntityIRI && typeof obj.id === "string") {
      rootEntityIRI = options.idToIRI ? options.idToIRI(obj.id) : obj.id;
    }

    const specialEntries = Object.entries(obj)
      .filter(([key, value]) => key.includes("_") && value !== null)
      .filter(([key]) => {
        // Keep child-table relation fields that happen to contain underscore
        // (e.g. none expected at top level like Item_photos — those don't have _)
        // Underscore fields are flattened scalars OR flattened-prefix nested lists
        // like copyright_notes — handle copyright_notes via manifest, not splitUp
        if (typeManifest) {
          for (const desc of Object.values(typeManifest)) {
            if (desc.representation === "childTable" && desc.properties) {
              for (const [pk, pd] of Object.entries(desc.properties)) {
                if (pd.representation === "flattened" && pd.properties) {
                  for (const fk of Object.keys(pd.properties)) {
                    if (key === `${pk}_${fk}`) return false; // handle below
                  }
                }
              }
            }
          }
        }
        return true;
      })
      .map(([key, value]: [string, any]) => {
        return splitUpLoDashConnectedEntry(key, value);
      });

    const normalEntries: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null) continue;

      // Skip underscore keys that go through specialEntries (flattened scalars)
      if (key.includes("_")) {
        // Unless it's a nested child list under flattened path handled here
        let handledAsNestedList = false;
        if (typeManifest && Array.isArray(value)) {
          for (const [prop, desc] of Object.entries(typeManifest)) {
            if (desc.representation !== "childTable" || !desc.properties)
              continue;
            for (const [pk, pd] of Object.entries(desc.properties)) {
              if (pd.representation !== "flattened" || !pd.properties) continue;
              for (const [fk, fd] of Object.entries(pd.properties)) {
                if (
                  key === `${pk}_${fk}` &&
                  fd.representation === "childTable"
                ) {
                  // Will be folded when we process the parent child rows
                  handledAsNestedList = true;
                }
              }
            }
          }
        }
        if (!handledAsNestedList) continue;
        continue;
      }

      if (key === "id" && options.idToIRI) {
        normalEntries["@id"] = options.idToIRI(value as string);
        continue;
      }
      if (key === "type" && options.typeNameToTypeIRI) {
        normalEntries["@type"] = options.typeNameToTypeIRI(value as string);
        continue;
      }
      if (key === "id" || key === "type") {
        normalEntries[`@${key}`] = value;
        continue;
      }

      const desc = typeManifest?.[key];

      // Child table of primitives → string[]/number[]
      if (
        desc?.representation === "childTable" &&
        desc.valueType &&
        Array.isArray(value)
      ) {
        normalEntries[key] = collapsePrimitiveRows(value);
        continue;
      }

      // Child table of anonymous objects
      if (
        desc?.representation === "childTable" &&
        !desc.valueType &&
        Array.isArray(value)
      ) {
        normalEntries[key] = [...value]
          .map((item) => item as Record<string, unknown>)
          .sort(
            (a, b) =>
              ((a.position as number) ?? 0) - ((b.position as number) ?? 0),
          )
          .map((item) =>
            reinflateAnonymousRow(
              item,
              desc,
              {
                ...options,
                rootEntityIRI,
              },
              key,
            ),
          );
        continue;
      }

      // Mongo embedded — attach skolem @ids
      if (
        desc?.representation === "embedded" &&
        Array.isArray(value) &&
        rootEntityIRI
      ) {
        normalEntries[key] = attachEmbeddedSkolemIds(
          value,
          rootEntityIRI,
          key,
          desc,
        );
        continue;
      }

      // Scalar list — pass through
      if (desc?.representation === "scalarList" && Array.isArray(value)) {
        normalEntries[key] = value;
        continue;
      }

      // Related entity — recurse with its type if possible
      normalEntries[key] = toJSONLD(value, visited, {
        ...options,
        typeName: undefined, // unknown related type; still maps id/type
        rootEntityIRI: undefined,
      });
    }

    return merge(normalEntries, ...specialEntries);
  }
  return obj;
};

/**
 * Expand a Prisma select object to include child-table relations from the manifest.
 */
export function expandSelectWithManifest(
  select: Record<string, unknown>,
  typeName: string,
  manifest: PersistenceManifest | undefined,
): Record<string, unknown> {
  if (!manifest?.types?.[typeName]) return select;
  const out = { ...select };
  for (const [prop, desc] of Object.entries(manifest.types[typeName])) {
    if (desc.representation === "childTable") {
      out[prop] = buildChildSelect(desc);
    } else if (
      desc.representation === "scalarList" ||
      desc.representation === "embedded"
    ) {
      out[prop] = true;
    }
  }
  return out;
}

function buildChildSelect(
  desc: PersistencePropertyDescriptor,
): Record<string, unknown> {
  const select: Record<string, unknown> = {
    id: true,
    position: true,
  };
  if (desc.valueType) {
    select.value = true;
    return { orderBy: { position: "asc" }, select };
  }
  // Anonymous: scalars + nested child tables + flattened fields
  for (const [key, sub] of Object.entries(desc.properties ?? {})) {
    if (sub.representation === "scalar") {
      select[key] = true;
    } else if (sub.representation === "childTable") {
      select[key] = buildChildSelect(sub);
    } else if (sub.representation === "flattened" && sub.properties) {
      for (const [fk, fd] of Object.entries(sub.properties)) {
        if (fd.representation === "scalar") {
          select[`${key}_${fk}`] = true;
        } else if (fd.representation === "childTable") {
          select[`${key}_${fk}`] = buildChildSelect(fd);
        }
      }
    }
  }
  return { orderBy: { position: "asc" }, select };
}
