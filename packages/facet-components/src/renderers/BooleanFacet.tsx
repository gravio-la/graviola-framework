import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import type { FacetRendererProps } from "../registry";

export function BooleanFacet({
  selectedValues,
  onToggle,
  buckets,
}: FacetRendererProps) {
  const trueBucket = buckets.find((b) => b.value === true);
  const checked = selectedValues.includes(true);
  return (
    <FormControlLabel
      control={<Switch checked={checked} onChange={() => onToggle(true)} />}
      label={trueBucket ? `Yes (${trueBucket.count})` : "Yes"}
    />
  );
}

export const booleanTester = (
  descriptor: { valueType: string },
  _buckets: unknown[],
): number => (descriptor.valueType === "boolean" ? 8 : 0);
