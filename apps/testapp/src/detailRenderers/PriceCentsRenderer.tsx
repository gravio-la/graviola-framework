import { Typography } from "@mui/material";
import {
  PropertyRow,
  isControl,
  rankWith,
  type DetailRendererProps,
  type DetailRendererRegistryEntry,
  type Tester,
} from "@graviola/edb-detail-renderer";
import type { ControlElement } from "@jsonforms/core";

const isPriceByName: Tester = (uischema) => {
  if (!isControl(uischema)) return false;
  const scope = (uischema as ControlElement).scope ?? "";
  return scope.endsWith("/basePrice") || scope.endsWith("/price");
};

export function PriceCentsRenderer({ label, data }: DetailRendererProps) {
  if (data == null || data === "") return null;
  const cents = typeof data === "number" ? data : Number(data);
  if (!Number.isFinite(cents)) return null;

  const display = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);

  return (
    <PropertyRow label={label}>
      <Typography variant="body2">{display}</Typography>
    </PropertyRow>
  );
}

export const priceCentsRendererEntry: DetailRendererRegistryEntry = {
  tester: rankWith(9, isPriceByName),
  renderer: PriceCentsRenderer,
};
