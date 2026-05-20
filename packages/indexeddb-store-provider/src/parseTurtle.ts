import N3 from "n3";

export type ParseTurtleResult = {
  quads: N3.Quad[];
  /** Total quad callbacks from the parser for the full document. */
  quadsInDocument: number;
  /** True when a maxQuads limit was applied and the file contained more quads. */
  capped: boolean;
};

/** Parse Turtle into RDFJS quads; optional hard cap on how many are retained for import. */
export function parseTurtle(
  turtle: string,
  options?: { maxQuads?: number },
): Promise<ParseTurtleResult> {
  const max = options?.maxQuads;
  return new Promise((resolve, reject) => {
    const quads: N3.Quad[] = [];
    let quadsInDocument = 0;
    let capped = false;
    new N3.Parser().parse(turtle, (err, quad) => {
      if (err) return reject(err);
      if (quad) {
        quadsInDocument++;
        if (max === undefined || quads.length < max) {
          quads.push(quad);
        } else {
          capped = true;
        }
      } else {
        resolve({ quads, quadsInDocument, capped });
      }
    });
  });
}
