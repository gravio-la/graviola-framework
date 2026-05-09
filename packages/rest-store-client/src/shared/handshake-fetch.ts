import type { GraviolaStoreHandshakeResponse } from "../handshake-types";
import { throwIfNotOk } from "./errors";
import type { RestTransport } from "./fetcher";

export const fetchGraviolaStoreHandshake = async (
  transport: RestTransport,
  handshakePath: string,
): Promise<GraviolaStoreHandshakeResponse> => {
  const path = handshakePath.replace(/^\/+/, "");
  const res = await transport.get(path, {
    headers: { Accept: "application/json" },
  });
  await throwIfNotOk(res);
  return (await res.json()) as GraviolaStoreHandshakeResponse;
};
