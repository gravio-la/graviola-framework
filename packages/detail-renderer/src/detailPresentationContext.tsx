import React, { createContext, useContext } from "react";

export type DetailPresentationFlags = {
  /** Compact label+value chip in a meta strip row. */
  metaStrip?: boolean;
  /** Inline leaf values for compact object rows. */
  compactLeafInline?: boolean;
  /** Hide per-field labels when only a few inline values. */
  hideInlineLabels?: boolean;
  /** Right-align numbers in a fixed column (compact ingredient rows). */
  compactNumericColumn?: boolean;
  /** Entity refs as plain text links without chip avatars. */
  compactEntityLink?: boolean;
};

const DetailPresentationContext = createContext<DetailPresentationFlags | null>(
  null,
);

export function DetailPresentationProvider({
  value,
  children,
}: {
  value: DetailPresentationFlags;
  children: React.ReactNode;
}) {
  return (
    <DetailPresentationContext.Provider value={value}>
      {children}
    </DetailPresentationContext.Provider>
  );
}

export function useDetailPresentation(): DetailPresentationFlags {
  return useContext(DetailPresentationContext) ?? {};
}
