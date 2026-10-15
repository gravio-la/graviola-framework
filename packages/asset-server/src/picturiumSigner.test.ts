import { createHmac } from "node:crypto";
import { describe, expect, test } from "bun:test";

import { buildPicturiumUrl, signPicturiumToken } from "./picturiumSigner.js";

describe("picturiumSigner", () => {
  test("token and URL match independent HMAC for fixed inputs", () => {
    const key = "secret";
    const dataDir = "/data";
    const absoluteFilePath = "/data/p1/01J.jpg";
    const params = {
      thumb: "true",
      w: "480",
      q: "80",
      f: "webp",
    };

    const sorted = Object.entries(params).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const data = sorted.map(([k, v]) => `${k}=${v}`).join("&");
    const payload = `p1/01J.jpg?${data}`;
    const expectedToken = createHmac("sha256", key)
      .update(payload, "utf8")
      .digest("hex");

    const token = signPicturiumToken("p1/01J.jpg", params, key);
    expect(token).toBe(expectedToken);
    expect(token).toBe(
      "53f9c271d7d1eb4540dc4ac02b3e20494119ab5c11633780bbee09eaa8cf44b7",
    );

    const url = buildPicturiumUrl({
      baseUrl: "https://img.example",
      absoluteFilePath,
      dataDir,
      key,
      params,
    });
    expect(url).toBe(
      "https://img.example/p1/01J%2Ejpg?f=webp&q=80&thumb=true&token=53f9c271d7d1eb4540dc4ac02b3e20494119ab5c11633780bbee09eaa8cf44b7&w=480",
    );
  });

  test("empty params sign with trailing question mark", () => {
    const key = "secret";
    const payload = "p1/01J.jpg?";
    const expected = createHmac("sha256", key)
      .update(payload, "utf8")
      .digest("hex");
    expect(signPicturiumToken("p1/01J.jpg", {}, key)).toBe(expected);
    expect(expected).toBe(
      "7466c7606e9ed881ce4f29754c70c63aa33157ba16d0293af788ffdb7a454314",
    );
  });
});
