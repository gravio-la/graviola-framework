import { uploadedAssetToEntity } from "@graviola/asset-client";
import type { UploadedAsset } from "@graviola/edb-core-types";
import {
  useAdbContext,
  useAssetService,
  useCRUDWithQueryClient,
  useDispatchIntent,
} from "@graviola/edb-state-hooks";
import type { JSONSchema7 } from "json-schema";
import { useCallback, useEffect, useRef, useState } from "react";

type PendingSave = {
  entity: Record<string, unknown>;
  iri: string;
  resolve: (iri: string) => void;
  reject: (e: unknown) => void;
};

export function usePersistUploadedAsset(options: {
  typeIRI: string | undefined;
  typeName: string | undefined;
  classSchema: JSONSchema7 | undefined;
}) {
  const { typeIRI, typeName, classSchema } = options;
  const dispatchIntent = useDispatchIntent();
  const assetService = useAssetService();
  const [pending, setPending] = useState<PendingSave | null>(null);
  const pendingRef = useRef<PendingSave | null>(null);

  const { saveMutation } = useCRUDWithQueryClient({
    entityIRI: pending?.iri,
    typeIRI,
    queryOptions: { enabled: false },
  });

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    if (!pending?.iri) return;
    const job = pendingRef.current;
    if (!job || !typeIRI || !typeName) return;
    let cancelled = false;
    saveMutation
      .mutateAsync(job.entity)
      .then((result) => {
        if (cancelled) return;
        const savedIri =
          (result.mainDocument?.["@id"] as string | undefined) ?? job.iri;
        dispatchIntent({
          kind: "entity-saved",
          typeName,
          entityIRI: savedIri,
          created: true,
          origin: { source: "asset-renderer:upload" },
        });
        job.resolve(savedIri);
        setPending(null);
      })
      .catch((e) => {
        if (cancelled) return;
        dispatchIntent({
          kind: "entity-save-failed",
          typeName,
          entityIRI: job.iri,
          error: e instanceof Error ? e : new Error(String(e)),
          origin: { source: "asset-renderer:upload" },
        });
        job.reject(e);
        setPending(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pending?.iri, typeIRI, typeName, saveMutation, dispatchIntent]);

  const persistUploaded = useCallback(
    (asset: UploadedAsset, caption?: string) => {
      if (!assetService || !typeIRI || !typeName) {
        return Promise.reject(
          new Error("Asset service or type metadata is missing"),
        );
      }
      const iri = asset.iri ?? assetService.iriFor(asset);
      const entity = uploadedAssetToEntity(asset, {
        iri,
        typeIRI,
        classSchema,
        caption,
      });
      return new Promise<string>((resolve, reject) => {
        setPending({ entity, iri, resolve, reject });
      });
    },
    [assetService, typeIRI, typeName, classSchema],
  );

  return { persistUploaded, assetService };
}
