import {
  GRAVIOLA_QUERY_LANG,
  isGraviolaUri,
  parseEntityQuerySpec,
  parseGraviolaUri,
  type EntityEmbedView,
} from "@graviola/entity-ref-core";
import { EntityQueryView, EntityRefView } from "@graviola/entity-embed";
import type { MarkdownPreviewProps } from "@uiw/react-markdown-preview";
import type {
  DetailedHTMLProps,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import { Children, isValidElement } from "react";

function textFromReactNode(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textFromReactNode).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return textFromReactNode(node.props.children);
  }
  return "";
}

function createGraviolaAnchor(defaultView: EntityEmbedView) {
  return function GraviolaAnchor({
    href,
    children,
    ...rest
  }: DetailedHTMLProps<HTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> & {
    href?: string;
  }) {
    if (href && isGraviolaUri(href)) {
      const ref = parseGraviolaUri(href);
      if (ref) {
        const label =
          typeof children === "string"
            ? children
            : Array.isArray(children)
              ? children.join("")
              : ref.label;
        return (
          <EntityRefView
            ref={{
              ...ref,
              // Markdown link text is fallback only; live store label wins after load/refetch.
              label:
                ref.label ?? (typeof label === "string" ? label : undefined),
            }}
            defaultView={defaultView}
          />
        );
      }
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
}

function renderGraviolaQueryFromCodeText(codeText: string): ReactNode | null {
  try {
    const spec = parseEntityQuerySpec(codeText);
    return <EntityQueryView spec={spec} />;
  } catch {
    return null;
  }
}

function GraviolaPre({
  children,
  ...rest
}: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>) {
  const child = Children.toArray(children).find(isValidElement) as
    | ReactElement<{ className?: string; children?: ReactNode }>
    | undefined;
  const className = child?.props?.className ?? "";
  const langMatch = /language-([\w-]+)/.exec(className);
  if (langMatch?.[1] === GRAVIOLA_QUERY_LANG) {
    const codeText = textFromReactNode(child?.props?.children).replace(
      /\n$/,
      "",
    );
    const embed = renderGraviolaQueryFromCodeText(codeText);
    if (embed) {
      return (
        <div className="graviola-query-embed" data-graviola-query-embed="">
          {embed}
        </div>
      );
    }
  }
  return <pre {...rest}>{children}</pre>;
}

function GraviolaCode({
  inline,
  className,
  children,
  ...rest
}: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <code className={className} {...rest}>
      {children}
    </code>
  );
}

/** Build preview components closed over document `defaultView` (MDEditor preview may escape React context). */
export function createLinkedMdPreviewComponents(
  defaultView: EntityEmbedView = "inline",
): NonNullable<MarkdownPreviewProps["components"]> {
  return {
    a: createGraviolaAnchor(defaultView),
    pre: GraviolaPre,
    code: GraviolaCode,
  };
}

export const linkedMdPreviewComponents: NonNullable<
  MarkdownPreviewProps["components"]
> = createLinkedMdPreviewComponents("inline");
