export interface SpeaksNative<Lang extends string, Result = unknown> {
  nativeQuery(
    lang: Lang,
    query: string,
    options?: Record<string, unknown>,
  ): Promise<Result>;
}
