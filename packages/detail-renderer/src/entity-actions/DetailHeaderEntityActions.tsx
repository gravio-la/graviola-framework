import type { JSONSchema7 } from "json-schema";
import type { DetailTesterContext } from "@graviola/edb-detail-renderer-core";

import { EntityActionsBar } from "./EntityActionsBar";

export function DetailHeaderEntityActions({
  schema,
  data,
  ctx,
  onCustomAction,
}: {
  schema: JSONSchema7;
  data: unknown;
  ctx: DetailTesterContext;
  onCustomAction?: (actionId: string) => void;
}) {
  return (
    <EntityActionsBar
      surface="detail"
      schema={schema}
      data={data}
      ctx={ctx}
      maxVisible={2}
      onCustomAction={onCustomAction}
    />
  );
}
