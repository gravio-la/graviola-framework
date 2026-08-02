import type { PrimaryFieldDeclaration } from "@graviola/edb-core-types";

export const geoPrimaryFields: PrimaryFieldDeclaration = {
  Place: { label: "name", description: "description", image: "image" },
  City: { label: "name", description: "description", image: "image" },
  Region: { label: "name", description: "description", image: "image" },
  Country: { label: "name", description: "description", image: "image" },
};

/** Alias for sample-data domain compatibility */
export const primaryFields = geoPrimaryFields;
