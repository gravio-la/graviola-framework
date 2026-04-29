import type { JSONSchema7 } from "json-schema";
import type { DetailRendererProps } from "../types";
import { pickAnyOfBranch, pickOneOfBranch } from "../combinators/pickBranch";

export function AnyOfDetailRenderer(props: DetailRendererProps) {
  const branches = (props.schema as JSONSchema7).anyOf as
    | JSONSchema7[]
    | undefined;
  if (!branches?.length || !props.resolveRenderer) return null;
  const chosen = pickAnyOfBranch(branches, props.data);
  if (!chosen) return null;
  return props.resolveRenderer(chosen);
}

export function OneOfDetailRenderer(props: DetailRendererProps) {
  const branches = (props.schema as JSONSchema7).oneOf as
    | JSONSchema7[]
    | undefined;
  if (!branches?.length || !props.resolveRenderer) return null;
  const chosen = pickOneOfBranch(branches, props.data);
  if (!chosen) return null;
  return props.resolveRenderer(chosen);
}
