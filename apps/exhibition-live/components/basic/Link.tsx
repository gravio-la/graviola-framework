import { useModifiedRouter } from "@graviola/edb-state-hooks";
import { Link as MuiLink, LinkProps } from "@mui/material";
import React, { useMemo } from "react";

type ExtendedLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  keyof LinkProps
> &
  LinkProps & {
    skipLocaleHandling?: boolean;
    children?: React.ReactNode;
  };
export const Link = ({
  children,
  skipLocaleHandling,
  ...rest
}: ExtendedLinkProps) => {
  const router = useModifiedRouter();

  let href = useMemo(() => {
    const locale = rest.locale || router.query.locale || "";
    let href_ = rest.href || router.asPath;
    let skipLocaleHandling_ = skipLocaleHandling;
    if (href_.toString().indexOf("http") === 0) skipLocaleHandling_ = true;
    if (locale && !skipLocaleHandling_) {
      href_ = href_
        ? `/${locale}${href_}`
        : router.pathname.replace("[locale]", locale.toString());
    }
    return href_;
  }, [rest.locale, rest.href, router, skipLocaleHandling]);

  return <MuiLink href={href} {...rest} />;
};
