import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { Window } from "happy-dom";
import React from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// minimal in-test preference store mirroring the hook's contract
let pref: "dropdown" | "finder" | undefined;
const listeners = new Set<() => void>();
const setPref = (m: "dropdown" | "finder") => {
  pref = m;
  listeners.forEach((l) => l());
};

mock.module("@graviola/edb-state-hooks", () => ({
  useAdbContext: () => ({ relationalInputDefault: undefined }),
  resolveRelationalInputMode: (
    explicit: boolean | undefined,
    preference: "dropdown" | "finder" | undefined,
    appDefault?: "dropdown" | "finder",
  ) =>
    explicit === true
      ? "dropdown"
      : explicit === false
        ? "finder"
        : (preference ?? appDefault ?? "dropdown"),
  useRelationalInputPreference: () => {
    const [, force] = React.useReducer((x: number) => x + 1, 0);
    React.useEffect(() => {
      listeners.add(force as () => void);
      return () => {
        listeners.delete(force as () => void);
      };
    }, []);
    return [pref ?? "dropdown", setPref];
  },
}));

mock.module("next-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (_k: string, d?: string) => d ?? _k,
  }),
}));

let lastDropdownOptions: any;
mock.module("./InlineDropdownSemanticFormsRenderer", () => ({
  InlineDropdownSemanticFormsRenderer: (p: any) => {
    lastDropdownOptions = p.uischema.options;
    return <div data-testid="child-dropdown" />;
  },
}));
mock.module("./InlineCondensedSemanticFormsRenderer", () => ({
  InlineCondensedSemanticFormsRenderer: () => (
    <div data-testid="child-finder" />
  ),
}));

const { RelationalFieldRendererComponent, relationalFieldRendererTester } =
  await import("./RelationalFieldRenderer");

const props = (options: Record<string, unknown>) =>
  ({
    uischema: {
      type: "Control",
      scope: "#/properties/x/properties/@id",
      options,
    },
    schema: {},
    path: "x.@id",
  }) as any;

beforeAll(() => {
  const win = new Window();
  (globalThis as any).window = win;
  (globalThis as any).document = win.document;
  (globalThis as any).navigator = win.navigator;
  (globalThis as any).HTMLElement = win.HTMLElement;
});
beforeEach(() => {
  cleanup();
  pref = undefined;
});

describe("RelationalFieldRenderer dispatcher", () => {
  test("defaults to the dropdown child with a finder button option", () => {
    const { getByTestId, queryByTestId } = render(
      <RelationalFieldRendererComponent {...props({ inline: true })} />,
    );
    expect(getByTestId("child-dropdown")).toBeTruthy();
    expect(queryByTestId("child-finder")).toBeNull();
    expect(lastDropdownOptions.finderButton).toBe(true);
  });

  test("user preference finder renders the finder child", () => {
    pref = "finder";
    const { getByTestId } = render(
      <RelationalFieldRendererComponent {...props({ inline: true })} />,
    );
    expect(getByTestId("child-finder")).toBeTruthy();
  });

  test("explicit dropdown:true beats finder preference and hides toggle", () => {
    pref = "finder";
    const { getByTestId, queryByTestId } = render(
      <RelationalFieldRendererComponent
        {...props({ inline: true, dropdown: true })}
      />,
    );
    expect(getByTestId("child-dropdown")).toBeTruthy();
    expect(queryByTestId("relational-toggle")).toBeNull();
  });

  test("explicit dropdown:false beats dropdown preference", () => {
    pref = "dropdown";
    const { getByTestId } = render(
      <RelationalFieldRendererComponent
        {...props({ inline: true, dropdown: false })}
      />,
    );
    expect(getByTestId("child-finder")).toBeTruthy();
  });

  test("toggle flips the global preference and the child", () => {
    const { getByTestId, queryByTestId } = render(
      <RelationalFieldRendererComponent {...props({ inline: true })} />,
    );
    act(() => {
      fireEvent.click(getByTestId("relational-toggle"));
    });
    expect(pref).toBe("finder");
    expect(getByTestId("child-finder")).toBeTruthy();
    expect(queryByTestId("child-dropdown")).toBeNull();
  });
});

describe("relationalFieldRendererTester", () => {
  const run = (options: any) =>
    relationalFieldRendererTester(
      { type: "Control", scope: "#/properties/x", options } as any,
      { type: "object", properties: { x: { type: "string" } } } as any,
      { rootSchema: {}, config: {} } as any,
    );
  test("matches inline and dropdown:true, rank 20", () => {
    expect(run({ inline: true })).toBe(20);
    expect(run({ dropdown: true })).toBe(20);
  });
  test("does not match plain or dropdown:false-only controls", () => {
    expect(run({})).toBe(-1);
    expect(run({ dropdown: false })).toBe(-1);
  });
});
