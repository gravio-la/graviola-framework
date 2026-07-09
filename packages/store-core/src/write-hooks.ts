export type WriteDocumentContext<TDocument = Record<string, unknown>> = {
  typeName: string;
  entityIRI: string;
  document: TDocument;
  previousDocument?: TDocument | null;
};

export type WriteDocumentInterceptor<TDocument = Record<string, unknown>> = (
  ctx: WriteDocumentContext<TDocument>,
) => TDocument | Promise<TDocument>;

export const noopWriteDocumentInterceptor: WriteDocumentInterceptor = (ctx) =>
  ctx.document;

export function composeWriteDocumentInterceptors<
  TDocument = Record<string, unknown>,
>(
  ...interceptors: WriteDocumentInterceptor<TDocument>[]
): WriteDocumentInterceptor<TDocument> {
  return async (ctx) => {
    let document = ctx.document;
    for (const interceptor of interceptors) {
      document = await interceptor({ ...ctx, document });
    }
    return document;
  };
}
