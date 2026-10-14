import { describe, expect, it } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { DetailPresentationProvider } from "../detailPresentationContext";
import {
  FallbackStringValueRenderer,
  looksLikeNumericDetailString,
} from "./FallbackStringValueRenderer";

const theme = createTheme();

function wrap(
  node: React.ReactElement,
  presentation?: { compactNumericColumn?: boolean },
) {
  return renderToStaticMarkup(
    <ThemeProvider theme={theme}>
      <DetailPresentationProvider value={presentation ?? {}}>
        {node}
      </DetailPresentationProvider>
    </ThemeProvider>,
  );
}

describe("looksLikeNumericDetailString", () => {
  it("accepts quantities and fractions", () => {
    expect(looksLikeNumericDetailString("512")).toBe(true);
    expect(looksLikeNumericDetailString("1 1/2")).toBe(true);
    expect(looksLikeNumericDetailString("9,4")).toBe(true);
    expect(looksLikeNumericDetailString("½")).toBe(true);
  });

  it("rejects non-numeric text", () => {
    expect(looksLikeNumericDetailString("abc")).toBe(false);
  });
});

describe("FallbackStringValueRenderer", () => {
  it("wraps numeric strings in CompactNumericSpan when compactNumericColumn is on", () => {
    const html = wrap(
      <FallbackStringValueRenderer
        value="512"
        schema={{ type: "string" }}
        ctx={{ rootSchema: {}, depth: 0, maxDepth: 6 }}
      />,
      { compactNumericColumn: true },
    );
    expect(html).toContain("graviola-detail-compact-numeric");
    expect(html).toContain("512");
    expect(html).toContain("min-width:6ch");
  });

  it("wraps fraction strings when compactNumericColumn is on", () => {
    const html = wrap(
      <FallbackStringValueRenderer
        value="1 1/2"
        schema={{ type: "string" }}
        ctx={{ rootSchema: {}, depth: 0, maxDepth: 6 }}
      />,
      { compactNumericColumn: true },
    );
    expect(html).toContain("graviola-detail-compact-numeric");
    expect(html).toContain("1 1/2");
  });

  it("does not wrap plain text when compactNumericColumn is on", () => {
    const html = wrap(
      <FallbackStringValueRenderer
        value="abc"
        schema={{ type: "string" }}
        ctx={{ rootSchema: {}, depth: 0, maxDepth: 6 }}
      />,
      { compactNumericColumn: true },
    );
    expect(html).not.toContain("graviola-detail-compact-numeric");
    expect(html).toContain("abc");
  });
});
