/**
 * Minimal ambient type declarations for IndexedDB types that may not be
 * available in all TypeScript lib configurations.
 *
 * These are re-exports / type aliases that let non-DOM tsconfig targets
 * (packages extending base.json with only lib: ["es2022"]) still use
 * IDBKeyRange without pulling in the full DOM lib.
 *
 * At runtime these are always available in the browser and in fake-indexeddb.
 */

// IDBValidKey is the union of types that IndexedDB accepts as keys.
// In practice we only use number[] and Infinity, but the full type is:
export type IDBValidKey = number | string | Date | ArrayBuffer | IDBValidKey[];
