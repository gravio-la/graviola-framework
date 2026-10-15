import { uploadedAssetToEntity } from "@graviola/asset-client";
import type { UploadedAsset } from "@graviola/edb-core-types";
import {
  useAssetService,
  useCRUDWithQueryClient,
} from "@graviola/edb-state-hooks";
import type { JSONSchema7 } from "json-schema";
import { useCallback, useRef } from "react";

type PendingSave = {
  entity: Record<string, unknown>;
  resolve: (iri: string) => void;
  reject: (e: unknown) => void;
};

export function usePersistUploadedAsset(options: {
  typeIRI: string | undefined;
  typeName: string | undefined;
  classSchema: JSONSchema7 | undefined;
}) {
  const { typeIRI, typeName, classSchema } = options;
  const assetService = useAssetService();
  const queueRef = useRef<PendingSave[]>([]);
  const drainingRef = useRef(false);

  const { saveMutation } = useCRUDWithQueryClient({
    typeIRI,
    queryOptions: { enabled: false },
  });

  const drainQueue = useCallback(async () => {
    if (drainingRef.current || !typeIRI || !typeName) return;
    drainingRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const job = queueRef.current.shift();
        if (!job) break;
        try {
          const result = await saveMutation.mutateAsync(job.entity);
          const savedIri =
            (result.mainDocument?.["@id"] as string | undefined) ??
            (job.entity["@id"] as string | undefined) ??
            "";
          job.resolve(savedIri);
        } catch (e) {
          job.reject(e);
        }
      }
    } finally {
      drainingRef.current = false;
      if (queueRef.current.length > 0) {
        void drainQueue();
      }
    }
  }, [saveMutation, typeIRI, typeName]);

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
        queueRef.current.push({ entity, resolve, reject });
        void drainQueue();
      });
    },
    [assetService, typeIRI, typeName, classSchema, drainQueue],
  );

  return { persistUploaded, assetService };
}
