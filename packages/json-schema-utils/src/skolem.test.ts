import { describe, expect, test } from "bun:test";
import { assignSkolemIris, contentHash8, skolemListMemberIri } from ".";

describe("skolem list member IRIs", () => {
  const root = "http://ex/Item/1";

  test("is deterministic for same content", () => {
    const a = skolemListMemberIri(root, "photos", "/a.jpg");
    const b = skolemListMemberIri(root, "photos", "/a.jpg");
    expect(a).toBe(b);
    expect(a).toContain("#photos/");
  });

  test("is stable under reordering (hash from content, not index)", () => {
    const assigned = assignSkolemIris(root, "photos", ["/b.jpg", "/a.jpg"]);
    const reordered = assignSkolemIris(root, "photos", ["/a.jpg", "/b.jpg"]);
    const byValue = (rows: typeof assigned) =>
      Object.fromEntries(rows.map((r) => [r.member, r.iri]));
    expect(byValue(assigned)).toEqual(byValue(reordered));
  });

  test("suffixes identical siblings", () => {
    const assigned = assignSkolemIris(root, "photos", ["/a.jpg", "/a.jpg"]);
    expect(assigned[0].iri).not.toContain("~");
    expect(assigned[1].iri).toContain("~1");
    expect(assigned[0].hash).toBe(assigned[1].hash);
  });

  test("depth-2 paths include parent hash", () => {
    const media = { url: "/x.jpg", notes: ["n1"] };
    const mediaHash = contentHash8(media);
    const noteIri = skolemListMemberIri(
      root,
      `media/${mediaHash}/copyright/notes`,
      "n1",
    );
    expect(noteIri).toContain(`#media/${mediaHash}/copyright/notes/`);
  });
});
