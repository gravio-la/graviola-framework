import { describe, expect, test } from "bun:test";
import { adaptColumnFragmentToMrt } from "./index";

describe("adaptColumnFragmentToMrt", () => {
  test("keeps id and accessorFn fields", () => {
    const fragment = {
      id: "name",
      accessorFn: (row: any) => row.name,
    };
    const adapted = adaptColumnFragmentToMrt(fragment);
    expect(adapted.id).toBe("name");
    expect(typeof adapted.accessorFn).toBe("function");
  });
});
