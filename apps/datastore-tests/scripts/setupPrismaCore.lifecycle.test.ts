import { describe, expect, it } from "bun:test";
import { applyFrameworkNativeLifecycleColumns } from "./setupPrismaCore";

describe("applyFrameworkNativeLifecycleColumns", () => {
  it("adds Prisma native lifecycle attributes to inline entityMeta columns", () => {
    const input = `model Category {
  id String @id
  entityMeta_created DateTime?
  entityMeta_modified DateTime?
  entityMeta_schemaFingerprint String?
}`;
    const out = applyFrameworkNativeLifecycleColumns(input);
    expect(out).toContain("entityMeta_created DateTime @default(now())");
    expect(out).toContain("entityMeta_modified DateTime @updatedAt");
  });
});
