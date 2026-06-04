import type { DetailRendererProps } from "@graviola/edb-detail-renderer-core";

import { EnumValueRenderer } from "../value-renderers/EnumValueRenderer";
import { renderValueWithRow } from "../value-renderers/renderValue";

function enumFallback(props: DetailRendererProps) {
  return (
    <EnumValueRenderer
      value={props.data}
      schema={props.schema}
      ctx={props.ctx}
    />
  );
}

export function EnumRenderer(props: DetailRendererProps) {
  return renderValueWithRow(props, enumFallback);
}
