export type PutBody = ReadableStream<Uint8Array> | Blob | Uint8Array;

export interface StorageStat {
  size: number;
  mtimeMs?: number;
}

export interface StorageAdapter {
  put(key: string, body: PutBody): Promise<void>;
  /** Create only if key absent; returns false when the key already exists. */
  putExclusive(key: string, body: PutBody): Promise<boolean>;
  getStream(key: string): Promise<ReadableStream<Uint8Array>>;
  stat(key: string): Promise<StorageStat | undefined>;
  delete(key: string): Promise<void>;
  absolutePath(key: string): string;
}
