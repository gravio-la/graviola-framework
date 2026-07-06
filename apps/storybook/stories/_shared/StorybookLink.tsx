import React from "react";

import {
  isStorybookInternalHref,
  resolveStorybookManagerHref,
} from "./storybookHref";

type StorybookLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

/**
 * Anchor for Storybook internal navigation from the docs iframe.
 * Plain left-click navigates the manager shell; modifier / middle-click opens normally.
 */
export function StorybookLink({
  href,
  children,
  onClick,
  target,
  ...props
}: StorybookLinkProps) {
  const internal = href ? isStorybookInternalHref(href) : false;

  const resolvedHref =
    href && internal ? resolveStorybookManagerHref(href) : href;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !href || !internal) return;

    const opensNewTab =
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button === 1 ||
      target === "_blank";

    if (opensNewTab) return;

    e.preventDefault();
    window.parent.location.href = resolveStorybookManagerHref(href);
  };

  return (
    <a
      href={resolvedHref}
      onClick={handleClick}
      target={target ?? (internal ? "_parent" : undefined)}
      {...props}
    >
      {children}
    </a>
  );
}
