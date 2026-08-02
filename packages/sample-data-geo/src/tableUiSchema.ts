/**
 * Plain TableUiSchema-shaped object (no runtime dep on table-types).
 * Compatible with `@graviola/edb-table-types` TableUiSchema.
 */
export const geoTableUiSchema = {
  type: "Table" as const,
  mode: "whitelist" as const,
  columns: [
    { scope: "#/properties/name", label: "Name", sortable: true },
    { scope: "#/properties/population", label: "Population", sortable: true },
    { scope: "#/properties/description", label: "Description" },
    { scope: "#/properties/latitude", label: "Lat" },
    { scope: "#/properties/longitude", label: "Lon" },
    { scope: "#/properties/partOf", label: "Part of" },
    { scope: "#/properties/contains", label: "Contains" },
    { scope: "#/properties/founded", label: "Founded" },
  ],
  options: {
    defaultSort: { scope: "#/properties/name" },
  },
};
