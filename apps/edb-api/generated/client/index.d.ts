/**
 * Client
 **/

import * as runtime from "./runtime/client.js";
import $Types = runtime.Types; // general types
import $Public = runtime.Types.Public;
import $Utils = runtime.Types.Utils;
import $Extensions = runtime.Types.Extensions;
import $Result = runtime.Types.Result;

export type PrismaPromise<T> = $Public.PrismaPromise<T>;

/**
 * Model Occupation
 *
 */
export type Occupation = $Result.DefaultSelection<Prisma.$OccupationPayload>;
/**
 * Model Person
 *
 */
export type Person = $Result.DefaultSelection<Prisma.$PersonPayload>;
/**
 * Model Place
 *
 */
export type Place = $Result.DefaultSelection<Prisma.$PlacePayload>;
/**
 * Model Corporation
 *
 */
export type Corporation = $Result.DefaultSelection<Prisma.$CorporationPayload>;
/**
 * Model Location
 *
 */
export type Location = $Result.DefaultSelection<Prisma.$LocationPayload>;
/**
 * Model Exhibition
 *
 */
export type Exhibition = $Result.DefaultSelection<Prisma.$ExhibitionPayload>;

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Occupations
 * const occupations = await prisma.occupation.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = "log" extends keyof ClientOptions
    ? ClientOptions["log"] extends Array<Prisma.LogLevel | Prisma.LogDefinition>
      ? Prisma.GetEvents<ClientOptions["log"]>
      : never
    : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>["other"] };

  /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Occupations
   * const occupations = await prisma.occupation.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(
    optionsArg?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>,
  );
  $on<V extends U>(
    eventType: V,
    callback: (
      event: V extends "query" ? Prisma.QueryEvent : Prisma.LogEvent,
    ) => void,
  ): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(
    query: string,
    ...values: any[]
  ): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(
    query: string,
    ...values: any[]
  ): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(
    arg: [...P],
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;

  $transaction<R>(
    fn: (
      prisma: Omit<PrismaClient, runtime.ITXClientDenyList>,
    ) => $Utils.JsPromise<R>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): $Utils.JsPromise<R>;

  $extends: $Extensions.ExtendsHook<
    "extends",
    Prisma.TypeMapCb<ClientOptions>,
    ExtArgs,
    $Utils.Call<
      Prisma.TypeMapCb<ClientOptions>,
      {
        extArgs: ExtArgs;
      }
    >
  >;

  /**
   * `prisma.occupation`: Exposes CRUD operations for the **Occupation** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Occupations
   * const occupations = await prisma.occupation.findMany()
   * ```
   */
  get occupation(): Prisma.OccupationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.person`: Exposes CRUD operations for the **Person** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more People
   * const people = await prisma.person.findMany()
   * ```
   */
  get person(): Prisma.PersonDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.place`: Exposes CRUD operations for the **Place** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Places
   * const places = await prisma.place.findMany()
   * ```
   */
  get place(): Prisma.PlaceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.corporation`: Exposes CRUD operations for the **Corporation** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Corporations
   * const corporations = await prisma.corporation.findMany()
   * ```
   */
  get corporation(): Prisma.CorporationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.location`: Exposes CRUD operations for the **Location** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Locations
   * const locations = await prisma.location.findMany()
   * ```
   */
  get location(): Prisma.LocationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.exhibition`: Exposes CRUD operations for the **Exhibition** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Exhibitions
   * const exhibitions = await prisma.exhibition.findMany()
   * ```
   */
  get exhibition(): Prisma.ExhibitionDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF;

  export type PrismaPromise<T> = $Public.PrismaPromise<T>;

  /**
   * Validator
   */
  export import validator = runtime.Public.validator;

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError;
  export import PrismaClientValidationError = runtime.PrismaClientValidationError;

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag;
  export import empty = runtime.empty;
  export import join = runtime.join;
  export import raw = runtime.raw;
  export import Sql = runtime.Sql;

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal;

  export type DecimalJsLike = runtime.DecimalJsLike;

  /**
   * Extensions
   */
  export import Extension = $Extensions.UserArgs;
  export import getExtensionContext = runtime.Extensions.getExtensionContext;
  export import Args = $Public.Args;
  export import Payload = $Public.Payload;
  export import Result = $Public.Result;
  export import Exact = $Public.Exact;

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string;
    engine: string;
  };

  export const prismaVersion: PrismaVersion;

  /**
   * Utility Types
   */

  export import Bytes = runtime.Bytes;
  export import JsonObject = runtime.JsonObject;
  export import JsonArray = runtime.JsonArray;
  export import JsonValue = runtime.JsonValue;
  export import InputJsonObject = runtime.InputJsonObject;
  export import InputJsonArray = runtime.InputJsonArray;
  export import InputJsonValue = runtime.InputJsonValue;

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
     * Type of `Prisma.DbNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class DbNull {
      private DbNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.JsonNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class JsonNull {
      private JsonNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.AnyNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class AnyNull {
      private AnyNull: never;
      private constructor();
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull;

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull;

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull;

  type SelectAndInclude = {
    select: any;
    include: any;
  };

  type SelectAndOmit = {
    select: any;
    omit: any;
  };

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> =
    T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<
    T extends (...args: any) => $Utils.JsPromise<any>,
  > = PromiseType<ReturnType<T>>;

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K;
  }[keyof T];

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K;
  };

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>;

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & (T extends SelectAndInclude
    ? "Please either choose `select` or `include`."
    : T extends SelectAndOmit
      ? "Please either choose `select` or `omit`."
      : {});

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & K;

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> = T extends object
    ? U extends object
      ? (Without<T, U> & U) | (Without<U, T> & T)
      : U
    : T;

  /**
   * Is T a Record?
   */
  type IsObject<T extends any> =
    T extends Array<any>
      ? False
      : T extends Date
        ? False
        : T extends Uint8Array
          ? False
          : T extends BigInt
            ? False
            : T extends object
              ? True
              : False;

  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O>; // With K possibilities
    }[K];

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<
    __Either<O, K>
  >;

  type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
  }[strict];

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1,
  > = O extends unknown ? _Either<O, K, strict> : never;

  export type Union = any;

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
  } & {};

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never;

  export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<
    Overwrite<
      U,
      {
        [K in keyof U]-?: At<U, K>;
      }
    >
  >;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O
    ? O[K]
    : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown
    ? AtStrict<O, K>
    : never;
  export type At<
    O extends object,
    K extends Key,
    strict extends Boolean = 1,
  > = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function
    ? A
    : {
        [K in keyof A]: A[K];
      } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
      ?
          | (K extends keyof O ? { [P in K]: O[P] } & O : O)
          | ({ [P in keyof O as P extends K ? P : never]-?: O[P] } & O)
      : never
  >;

  type _Strict<U, _U = U> = U extends unknown
    ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>>
    : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False;

  // /**
  // 1
  // */
  export type True = 1;

  /**
  0
  */
  export type False = 0;

  export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
  }[B];

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
      ? 1
      : 0;

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >;

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0;
      1: 1;
    };
    1: {
      0: 1;
      1: 1;
    };
  }[B1][B2];

  export type Keys<U extends Union> = U extends unknown ? keyof U : never;

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object
    ? {
        [P in keyof T]: P extends keyof O ? O[P] : never;
      }
    : never;

  type FieldPaths<
    T,
    U = Omit<T, "_avg" | "_sum" | "_count" | "_min" | "_max">,
  > = IsObject<T> extends True ? U : T;

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<"OR", K>, Extends<"AND", K>>,
      Extends<"NOT", K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<
            UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never
          >
        : never
      : {} extends FieldPaths<T[K]>
        ? never
        : K;
  }[keyof T];

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<
    T,
    K extends Enumerable<keyof T> | keyof T,
  > = Prisma__Pick<T, MaybeTupleToUnion<K>>;

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}`
    ? never
    : T;

  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;

  type FieldRefInputType<Model, FieldType> = Model extends never
    ? never
    : FieldRef<Model, FieldType>;

  export const ModelName: {
    Occupation: "Occupation";
    Person: "Person";
    Place: "Place";
    Corporation: "Corporation";
    Location: "Location";
    Exhibition: "Exhibition";
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName];

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<
    { extArgs: $Extensions.InternalArgs },
    $Utils.Record<string, any>
  > {
    returns: Prisma.TypeMap<
      this["params"]["extArgs"],
      ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}
    >;
  }

  export type TypeMap<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > = {
    globalOmitOptions: {
      omit: GlobalOmitOptions;
    };
    meta: {
      modelProps:
        | "occupation"
        | "person"
        | "place"
        | "corporation"
        | "location"
        | "exhibition";
      txIsolationLevel: Prisma.TransactionIsolationLevel;
    };
    model: {
      Occupation: {
        payload: Prisma.$OccupationPayload<ExtArgs>;
        fields: Prisma.OccupationFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.OccupationFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.OccupationFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>;
          };
          findFirst: {
            args: Prisma.OccupationFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.OccupationFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>;
          };
          findMany: {
            args: Prisma.OccupationFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>[];
          };
          create: {
            args: Prisma.OccupationCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>;
          };
          createMany: {
            args: Prisma.OccupationCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.OccupationCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>[];
          };
          delete: {
            args: Prisma.OccupationDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>;
          };
          update: {
            args: Prisma.OccupationUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>;
          };
          deleteMany: {
            args: Prisma.OccupationDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.OccupationUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.OccupationUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>[];
          };
          upsert: {
            args: Prisma.OccupationUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$OccupationPayload>;
          };
          aggregate: {
            args: Prisma.OccupationAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateOccupation>;
          };
          groupBy: {
            args: Prisma.OccupationGroupByArgs<ExtArgs>;
            result: $Utils.Optional<OccupationGroupByOutputType>[];
          };
          count: {
            args: Prisma.OccupationCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<OccupationCountAggregateOutputType>
              | number;
          };
        };
      };
      Person: {
        payload: Prisma.$PersonPayload<ExtArgs>;
        fields: Prisma.PersonFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.PersonFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.PersonFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>;
          };
          findFirst: {
            args: Prisma.PersonFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.PersonFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>;
          };
          findMany: {
            args: Prisma.PersonFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>[];
          };
          create: {
            args: Prisma.PersonCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>;
          };
          createMany: {
            args: Prisma.PersonCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.PersonCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>[];
          };
          delete: {
            args: Prisma.PersonDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>;
          };
          update: {
            args: Prisma.PersonUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>;
          };
          deleteMany: {
            args: Prisma.PersonDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.PersonUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.PersonUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>[];
          };
          upsert: {
            args: Prisma.PersonUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PersonPayload>;
          };
          aggregate: {
            args: Prisma.PersonAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregatePerson>;
          };
          groupBy: {
            args: Prisma.PersonGroupByArgs<ExtArgs>;
            result: $Utils.Optional<PersonGroupByOutputType>[];
          };
          count: {
            args: Prisma.PersonCountArgs<ExtArgs>;
            result: $Utils.Optional<PersonCountAggregateOutputType> | number;
          };
        };
      };
      Place: {
        payload: Prisma.$PlacePayload<ExtArgs>;
        fields: Prisma.PlaceFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.PlaceFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.PlaceFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>;
          };
          findFirst: {
            args: Prisma.PlaceFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.PlaceFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>;
          };
          findMany: {
            args: Prisma.PlaceFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>[];
          };
          create: {
            args: Prisma.PlaceCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>;
          };
          createMany: {
            args: Prisma.PlaceCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.PlaceCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>[];
          };
          delete: {
            args: Prisma.PlaceDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>;
          };
          update: {
            args: Prisma.PlaceUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>;
          };
          deleteMany: {
            args: Prisma.PlaceDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.PlaceUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.PlaceUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>[];
          };
          upsert: {
            args: Prisma.PlaceUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlacePayload>;
          };
          aggregate: {
            args: Prisma.PlaceAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregatePlace>;
          };
          groupBy: {
            args: Prisma.PlaceGroupByArgs<ExtArgs>;
            result: $Utils.Optional<PlaceGroupByOutputType>[];
          };
          count: {
            args: Prisma.PlaceCountArgs<ExtArgs>;
            result: $Utils.Optional<PlaceCountAggregateOutputType> | number;
          };
        };
      };
      Corporation: {
        payload: Prisma.$CorporationPayload<ExtArgs>;
        fields: Prisma.CorporationFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.CorporationFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.CorporationFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>;
          };
          findFirst: {
            args: Prisma.CorporationFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.CorporationFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>;
          };
          findMany: {
            args: Prisma.CorporationFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>[];
          };
          create: {
            args: Prisma.CorporationCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>;
          };
          createMany: {
            args: Prisma.CorporationCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.CorporationCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>[];
          };
          delete: {
            args: Prisma.CorporationDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>;
          };
          update: {
            args: Prisma.CorporationUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>;
          };
          deleteMany: {
            args: Prisma.CorporationDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.CorporationUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.CorporationUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>[];
          };
          upsert: {
            args: Prisma.CorporationUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$CorporationPayload>;
          };
          aggregate: {
            args: Prisma.CorporationAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateCorporation>;
          };
          groupBy: {
            args: Prisma.CorporationGroupByArgs<ExtArgs>;
            result: $Utils.Optional<CorporationGroupByOutputType>[];
          };
          count: {
            args: Prisma.CorporationCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<CorporationCountAggregateOutputType>
              | number;
          };
        };
      };
      Location: {
        payload: Prisma.$LocationPayload<ExtArgs>;
        fields: Prisma.LocationFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.LocationFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.LocationFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>;
          };
          findFirst: {
            args: Prisma.LocationFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.LocationFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>;
          };
          findMany: {
            args: Prisma.LocationFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[];
          };
          create: {
            args: Prisma.LocationCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>;
          };
          createMany: {
            args: Prisma.LocationCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.LocationCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[];
          };
          delete: {
            args: Prisma.LocationDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>;
          };
          update: {
            args: Prisma.LocationUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>;
          };
          deleteMany: {
            args: Prisma.LocationDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.LocationUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.LocationUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>[];
          };
          upsert: {
            args: Prisma.LocationUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$LocationPayload>;
          };
          aggregate: {
            args: Prisma.LocationAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateLocation>;
          };
          groupBy: {
            args: Prisma.LocationGroupByArgs<ExtArgs>;
            result: $Utils.Optional<LocationGroupByOutputType>[];
          };
          count: {
            args: Prisma.LocationCountArgs<ExtArgs>;
            result: $Utils.Optional<LocationCountAggregateOutputType> | number;
          };
        };
      };
      Exhibition: {
        payload: Prisma.$ExhibitionPayload<ExtArgs>;
        fields: Prisma.ExhibitionFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.ExhibitionFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.ExhibitionFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>;
          };
          findFirst: {
            args: Prisma.ExhibitionFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.ExhibitionFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>;
          };
          findMany: {
            args: Prisma.ExhibitionFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>[];
          };
          create: {
            args: Prisma.ExhibitionCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>;
          };
          createMany: {
            args: Prisma.ExhibitionCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.ExhibitionCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>[];
          };
          delete: {
            args: Prisma.ExhibitionDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>;
          };
          update: {
            args: Prisma.ExhibitionUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>;
          };
          deleteMany: {
            args: Prisma.ExhibitionDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.ExhibitionUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.ExhibitionUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>[];
          };
          upsert: {
            args: Prisma.ExhibitionUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$ExhibitionPayload>;
          };
          aggregate: {
            args: Prisma.ExhibitionAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateExhibition>;
          };
          groupBy: {
            args: Prisma.ExhibitionGroupByArgs<ExtArgs>;
            result: $Utils.Optional<ExhibitionGroupByOutputType>[];
          };
          count: {
            args: Prisma.ExhibitionCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<ExhibitionCountAggregateOutputType>
              | number;
          };
        };
      };
    };
  } & {
    other: {
      payload: any;
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
      };
    };
  };
  export const defineExtension: $Extensions.ExtendsHook<
    "define",
    Prisma.TypeMapCb,
    $Extensions.DefaultArgs
  >;
  export type DefaultPrismaClient = PrismaClient;
  export type ErrorFormat = "pretty" | "colorless" | "minimal";
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    };
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory;
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string;
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig;
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[];
  }
  export type GlobalOmitConfig = {
    occupation?: OccupationOmit;
    person?: PersonOmit;
    place?: PlaceOmit;
    corporation?: CorporationOmit;
    location?: LocationOmit;
    exhibition?: ExhibitionOmit;
  };

  /* Types for Logging */
  export type LogLevel = "info" | "query" | "warn" | "error";
  export type LogDefinition = {
    level: LogLevel;
    emit: "stdout" | "event";
  };

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T["level"] : T
  >;

  export type GetEvents<T extends any[]> =
    T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;

  export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
  };

  export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
  };
  /* End Types for Logging */

  export type PrismaAction =
    | "findUnique"
    | "findUniqueOrThrow"
    | "findMany"
    | "findFirst"
    | "findFirstOrThrow"
    | "create"
    | "createMany"
    | "createManyAndReturn"
    | "update"
    | "updateMany"
    | "updateManyAndReturn"
    | "upsert"
    | "delete"
    | "deleteMany"
    | "executeRaw"
    | "queryRaw"
    | "aggregate"
    | "count"
    | "runCommandRaw"
    | "findRaw"
    | "groupBy";

  // tested in getLogLevel.test.ts
  export function getLogLevel(
    log: Array<LogLevel | LogDefinition>,
  ): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<
    Prisma.DefaultPrismaClient,
    runtime.ITXClientDenyList
  >;

  export type Datasource = {
    url?: string;
  };

  /**
   * Count Types
   */

  /**
   * Count Type OccupationCountOutputType
   */

  export type OccupationCountOutputType = {
    parent_to_Occupation_reverse: number;
    profession_to_Person_reverse: number;
  };

  export type OccupationCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent_to_Occupation_reverse?:
      | boolean
      | OccupationCountOutputTypeCountParent_to_Occupation_reverseArgs;
    profession_to_Person_reverse?:
      | boolean
      | OccupationCountOutputTypeCountProfession_to_Person_reverseArgs;
  };

  // Custom InputTypes
  /**
   * OccupationCountOutputType without action
   */
  export type OccupationCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the OccupationCountOutputType
     */
    select?: OccupationCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * OccupationCountOutputType without action
   */
  export type OccupationCountOutputTypeCountParent_to_Occupation_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: OccupationWhereInput;
  };

  /**
   * OccupationCountOutputType without action
   */
  export type OccupationCountOutputTypeCountProfession_to_Person_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PersonWhereInput;
  };

  /**
   * Count Type PersonCountOutputType
   */

  export type PersonCountOutputType = {
    profession: number;
    memberOfCorp: number;
  };

  export type PersonCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    profession?: boolean | PersonCountOutputTypeCountProfessionArgs;
    memberOfCorp?: boolean | PersonCountOutputTypeCountMemberOfCorpArgs;
  };

  // Custom InputTypes
  /**
   * PersonCountOutputType without action
   */
  export type PersonCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PersonCountOutputType
     */
    select?: PersonCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * PersonCountOutputType without action
   */
  export type PersonCountOutputTypeCountProfessionArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: OccupationWhereInput;
  };

  /**
   * PersonCountOutputType without action
   */
  export type PersonCountOutputTypeCountMemberOfCorpArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CorporationWhereInput;
  };

  /**
   * Count Type PlaceCountOutputType
   */

  export type PlaceCountOutputType = {
    birthPlace_to_Person_reverse: number;
    parent_to_Place_reverse: number;
  };

  export type PlaceCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    birthPlace_to_Person_reverse?:
      | boolean
      | PlaceCountOutputTypeCountBirthPlace_to_Person_reverseArgs;
    parent_to_Place_reverse?:
      | boolean
      | PlaceCountOutputTypeCountParent_to_Place_reverseArgs;
  };

  // Custom InputTypes
  /**
   * PlaceCountOutputType without action
   */
  export type PlaceCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the PlaceCountOutputType
     */
    select?: PlaceCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * PlaceCountOutputType without action
   */
  export type PlaceCountOutputTypeCountBirthPlace_to_Person_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PersonWhereInput;
  };

  /**
   * PlaceCountOutputType without action
   */
  export type PlaceCountOutputTypeCountParent_to_Place_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PlaceWhereInput;
  };

  /**
   * Count Type CorporationCountOutputType
   */

  export type CorporationCountOutputType = {
    memberOfCorp_to_Person_reverse: number;
    parent_to_Corporation_reverse: number;
  };

  export type CorporationCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    memberOfCorp_to_Person_reverse?:
      | boolean
      | CorporationCountOutputTypeCountMemberOfCorp_to_Person_reverseArgs;
    parent_to_Corporation_reverse?:
      | boolean
      | CorporationCountOutputTypeCountParent_to_Corporation_reverseArgs;
  };

  // Custom InputTypes
  /**
   * CorporationCountOutputType without action
   */
  export type CorporationCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the CorporationCountOutputType
     */
    select?: CorporationCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * CorporationCountOutputType without action
   */
  export type CorporationCountOutputTypeCountMemberOfCorp_to_Person_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PersonWhereInput;
  };

  /**
   * CorporationCountOutputType without action
   */
  export type CorporationCountOutputTypeCountParent_to_Corporation_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CorporationWhereInput;
  };

  /**
   * Count Type LocationCountOutputType
   */

  export type LocationCountOutputType = {
    parent_to_Location_reverse: number;
    location_to_Place_reverse: number;
    location_to_Corporation_reverse: number;
  };

  export type LocationCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent_to_Location_reverse?:
      | boolean
      | LocationCountOutputTypeCountParent_to_Location_reverseArgs;
    location_to_Place_reverse?:
      | boolean
      | LocationCountOutputTypeCountLocation_to_Place_reverseArgs;
    location_to_Corporation_reverse?:
      | boolean
      | LocationCountOutputTypeCountLocation_to_Corporation_reverseArgs;
  };

  // Custom InputTypes
  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the LocationCountOutputType
     */
    select?: LocationCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountParent_to_Location_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: LocationWhereInput;
  };

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountLocation_to_Place_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PlaceWhereInput;
  };

  /**
   * LocationCountOutputType without action
   */
  export type LocationCountOutputTypeCountLocation_to_Corporation_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CorporationWhereInput;
  };

  /**
   * Models
   */

  /**
   * Model Occupation
   */

  export type AggregateOccupation = {
    _count: OccupationCountAggregateOutputType | null;
    _min: OccupationMinAggregateOutputType | null;
    _max: OccupationMaxAggregateOutputType | null;
  };

  export type OccupationMinAggregateOutputType = {
    title: string | null;
    description: string | null;
    parent_id: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type OccupationMaxAggregateOutputType = {
    title: string | null;
    description: string | null;
    parent_id: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type OccupationCountAggregateOutputType = {
    title: number;
    description: number;
    parent_id: number;
    idAuthority_authority: number;
    idAuthority_id: number;
    type: number;
    id: number;
    _all: number;
  };

  export type OccupationMinAggregateInputType = {
    title?: true;
    description?: true;
    parent_id?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type OccupationMaxAggregateInputType = {
    title?: true;
    description?: true;
    parent_id?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type OccupationCountAggregateInputType = {
    title?: true;
    description?: true;
    parent_id?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
    _all?: true;
  };

  export type OccupationAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Occupation to aggregate.
     */
    where?: OccupationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Occupations to fetch.
     */
    orderBy?:
      | OccupationOrderByWithRelationInput
      | OccupationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: OccupationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Occupations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Occupations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Occupations
     **/
    _count?: true | OccupationCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: OccupationMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: OccupationMaxAggregateInputType;
  };

  export type GetOccupationAggregateType<T extends OccupationAggregateArgs> = {
    [P in keyof T & keyof AggregateOccupation]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOccupation[P]>
      : GetScalarType<T[P], AggregateOccupation[P]>;
  };

  export type OccupationGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: OccupationWhereInput;
    orderBy?:
      | OccupationOrderByWithAggregationInput
      | OccupationOrderByWithAggregationInput[];
    by: OccupationScalarFieldEnum[] | OccupationScalarFieldEnum;
    having?: OccupationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: OccupationCountAggregateInputType | true;
    _min?: OccupationMinAggregateInputType;
    _max?: OccupationMaxAggregateInputType;
  };

  export type OccupationGroupByOutputType = {
    title: string | null;
    description: string | null;
    parent_id: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string;
    _count: OccupationCountAggregateOutputType | null;
    _min: OccupationMinAggregateOutputType | null;
    _max: OccupationMaxAggregateOutputType | null;
  };

  type GetOccupationGroupByPayload<T extends OccupationGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<OccupationGroupByOutputType, T["by"]> & {
          [P in keyof T & keyof OccupationGroupByOutputType]: P extends "_count"
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OccupationGroupByOutputType[P]>
            : GetScalarType<T[P], OccupationGroupByOutputType[P]>;
        }
      >
    >;

  export type OccupationSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      parent_id?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      parent?: boolean | Occupation$parentArgs<ExtArgs>;
      parent_to_Occupation_reverse?:
        | boolean
        | Occupation$parent_to_Occupation_reverseArgs<ExtArgs>;
      profession_to_Person_reverse?:
        | boolean
        | Occupation$profession_to_Person_reverseArgs<ExtArgs>;
      _count?: boolean | OccupationCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["occupation"]
  >;

  export type OccupationSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      parent_id?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      parent?: boolean | Occupation$parentArgs<ExtArgs>;
    },
    ExtArgs["result"]["occupation"]
  >;

  export type OccupationSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      parent_id?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      parent?: boolean | Occupation$parentArgs<ExtArgs>;
    },
    ExtArgs["result"]["occupation"]
  >;

  export type OccupationSelectScalar = {
    title?: boolean;
    description?: boolean;
    parent_id?: boolean;
    idAuthority_authority?: boolean;
    idAuthority_id?: boolean;
    type?: boolean;
    id?: boolean;
  };

  export type OccupationOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | "title"
    | "description"
    | "parent_id"
    | "idAuthority_authority"
    | "idAuthority_id"
    | "type"
    | "id",
    ExtArgs["result"]["occupation"]
  >;
  export type OccupationInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent?: boolean | Occupation$parentArgs<ExtArgs>;
    parent_to_Occupation_reverse?:
      | boolean
      | Occupation$parent_to_Occupation_reverseArgs<ExtArgs>;
    profession_to_Person_reverse?:
      | boolean
      | Occupation$profession_to_Person_reverseArgs<ExtArgs>;
    _count?: boolean | OccupationCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type OccupationIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent?: boolean | Occupation$parentArgs<ExtArgs>;
  };
  export type OccupationIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent?: boolean | Occupation$parentArgs<ExtArgs>;
  };

  export type $OccupationPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: "Occupation";
    objects: {
      parent: Prisma.$OccupationPayload<ExtArgs> | null;
      parent_to_Occupation_reverse: Prisma.$OccupationPayload<ExtArgs>[];
      profession_to_Person_reverse: Prisma.$PersonPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        title: string | null;
        description: string | null;
        parent_id: string | null;
        idAuthority_authority: string | null;
        idAuthority_id: string | null;
        type: string | null;
        id: string;
      },
      ExtArgs["result"]["occupation"]
    >;
    composites: {};
  };

  type OccupationGetPayload<
    S extends boolean | null | undefined | OccupationDefaultArgs,
  > = $Result.GetResult<Prisma.$OccupationPayload, S>;

  type OccupationCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    OccupationFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: OccupationCountAggregateInputType | true;
  };

  export interface OccupationDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["Occupation"];
      meta: { name: "Occupation" };
    };
    /**
     * Find zero or one Occupation that matches the filter.
     * @param {OccupationFindUniqueArgs} args - Arguments to find a Occupation
     * @example
     * // Get one Occupation
     * const occupation = await prisma.occupation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OccupationFindUniqueArgs>(
      args: SelectSubset<T, OccupationFindUniqueArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "findUnique",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Occupation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OccupationFindUniqueOrThrowArgs} args - Arguments to find a Occupation
     * @example
     * // Get one Occupation
     * const occupation = await prisma.occupation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OccupationFindUniqueOrThrowArgs>(
      args: SelectSubset<T, OccupationFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Occupation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccupationFindFirstArgs} args - Arguments to find a Occupation
     * @example
     * // Get one Occupation
     * const occupation = await prisma.occupation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OccupationFindFirstArgs>(
      args?: SelectSubset<T, OccupationFindFirstArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "findFirst",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Occupation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccupationFindFirstOrThrowArgs} args - Arguments to find a Occupation
     * @example
     * // Get one Occupation
     * const occupation = await prisma.occupation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OccupationFindFirstOrThrowArgs>(
      args?: SelectSubset<T, OccupationFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "findFirstOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Occupations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccupationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Occupations
     * const occupations = await prisma.occupation.findMany()
     *
     * // Get first 10 Occupations
     * const occupations = await prisma.occupation.findMany({ take: 10 })
     *
     * // Only select the `title`
     * const occupationWithTitleOnly = await prisma.occupation.findMany({ select: { title: true } })
     *
     */
    findMany<T extends OccupationFindManyArgs>(
      args?: SelectSubset<T, OccupationFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "findMany",
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Occupation.
     * @param {OccupationCreateArgs} args - Arguments to create a Occupation.
     * @example
     * // Create one Occupation
     * const Occupation = await prisma.occupation.create({
     *   data: {
     *     // ... data to create a Occupation
     *   }
     * })
     *
     */
    create<T extends OccupationCreateArgs>(
      args: SelectSubset<T, OccupationCreateArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "create",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Occupations.
     * @param {OccupationCreateManyArgs} args - Arguments to create many Occupations.
     * @example
     * // Create many Occupations
     * const occupation = await prisma.occupation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends OccupationCreateManyArgs>(
      args?: SelectSubset<T, OccupationCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Occupations and returns the data saved in the database.
     * @param {OccupationCreateManyAndReturnArgs} args - Arguments to create many Occupations.
     * @example
     * // Create many Occupations
     * const occupation = await prisma.occupation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Occupations and only return the `title`
     * const occupationWithTitleOnly = await prisma.occupation.createManyAndReturn({
     *   select: { title: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends OccupationCreateManyAndReturnArgs>(
      args?: SelectSubset<T, OccupationCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "createManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Occupation.
     * @param {OccupationDeleteArgs} args - Arguments to delete one Occupation.
     * @example
     * // Delete one Occupation
     * const Occupation = await prisma.occupation.delete({
     *   where: {
     *     // ... filter to delete one Occupation
     *   }
     * })
     *
     */
    delete<T extends OccupationDeleteArgs>(
      args: SelectSubset<T, OccupationDeleteArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "delete",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Occupation.
     * @param {OccupationUpdateArgs} args - Arguments to update one Occupation.
     * @example
     * // Update one Occupation
     * const occupation = await prisma.occupation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends OccupationUpdateArgs>(
      args: SelectSubset<T, OccupationUpdateArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "update",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Occupations.
     * @param {OccupationDeleteManyArgs} args - Arguments to filter Occupations to delete.
     * @example
     * // Delete a few Occupations
     * const { count } = await prisma.occupation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends OccupationDeleteManyArgs>(
      args?: SelectSubset<T, OccupationDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Occupations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccupationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Occupations
     * const occupation = await prisma.occupation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends OccupationUpdateManyArgs>(
      args: SelectSubset<T, OccupationUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Occupations and returns the data updated in the database.
     * @param {OccupationUpdateManyAndReturnArgs} args - Arguments to update many Occupations.
     * @example
     * // Update many Occupations
     * const occupation = await prisma.occupation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Occupations and only return the `title`
     * const occupationWithTitleOnly = await prisma.occupation.updateManyAndReturn({
     *   select: { title: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends OccupationUpdateManyAndReturnArgs>(
      args: SelectSubset<T, OccupationUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "updateManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Occupation.
     * @param {OccupationUpsertArgs} args - Arguments to update or create a Occupation.
     * @example
     * // Update or create a Occupation
     * const occupation = await prisma.occupation.upsert({
     *   create: {
     *     // ... data to create a Occupation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Occupation we want to update
     *   }
     * })
     */
    upsert<T extends OccupationUpsertArgs>(
      args: SelectSubset<T, OccupationUpsertArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "upsert",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Occupations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccupationCountArgs} args - Arguments to filter Occupations to count.
     * @example
     * // Count the number of Occupations
     * const count = await prisma.occupation.count({
     *   where: {
     *     // ... the filter for the Occupations we want to count
     *   }
     * })
     **/
    count<T extends OccupationCountArgs>(
      args?: Subset<T, OccupationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], OccupationCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Occupation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccupationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends OccupationAggregateArgs>(
      args: Subset<T, OccupationAggregateArgs>,
    ): Prisma.PrismaPromise<GetOccupationAggregateType<T>>;

    /**
     * Group by Occupation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OccupationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends OccupationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<"skip", Keys<T>>,
        Extends<"take", Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OccupationGroupByArgs["orderBy"] }
        : { orderBy?: OccupationGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T["orderBy"]>>
      >,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      "Field ",
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, OccupationGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetOccupationGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Occupation model
     */
    readonly fields: OccupationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Occupation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OccupationClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    parent<T extends Occupation$parentArgs<ExtArgs> = {}>(
      args?: Subset<T, Occupation$parentArgs<ExtArgs>>,
    ): Prisma__OccupationClient<
      $Result.GetResult<
        Prisma.$OccupationPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    parent_to_Occupation_reverse<
      T extends Occupation$parent_to_Occupation_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Occupation$parent_to_Occupation_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$OccupationPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    profession_to_Person_reverse<
      T extends Occupation$profession_to_Person_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Occupation$profession_to_Person_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$PersonPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Occupation model
   */
  interface OccupationFieldRefs {
    readonly title: FieldRef<"Occupation", "String">;
    readonly description: FieldRef<"Occupation", "String">;
    readonly parent_id: FieldRef<"Occupation", "String">;
    readonly idAuthority_authority: FieldRef<"Occupation", "String">;
    readonly idAuthority_id: FieldRef<"Occupation", "String">;
    readonly type: FieldRef<"Occupation", "String">;
    readonly id: FieldRef<"Occupation", "String">;
  }

  // Custom InputTypes
  /**
   * Occupation findUnique
   */
  export type OccupationFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * Filter, which Occupation to fetch.
     */
    where: OccupationWhereUniqueInput;
  };

  /**
   * Occupation findUniqueOrThrow
   */
  export type OccupationFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * Filter, which Occupation to fetch.
     */
    where: OccupationWhereUniqueInput;
  };

  /**
   * Occupation findFirst
   */
  export type OccupationFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * Filter, which Occupation to fetch.
     */
    where?: OccupationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Occupations to fetch.
     */
    orderBy?:
      | OccupationOrderByWithRelationInput
      | OccupationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Occupations.
     */
    cursor?: OccupationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Occupations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Occupations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Occupations.
     */
    distinct?: OccupationScalarFieldEnum | OccupationScalarFieldEnum[];
  };

  /**
   * Occupation findFirstOrThrow
   */
  export type OccupationFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * Filter, which Occupation to fetch.
     */
    where?: OccupationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Occupations to fetch.
     */
    orderBy?:
      | OccupationOrderByWithRelationInput
      | OccupationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Occupations.
     */
    cursor?: OccupationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Occupations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Occupations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Occupations.
     */
    distinct?: OccupationScalarFieldEnum | OccupationScalarFieldEnum[];
  };

  /**
   * Occupation findMany
   */
  export type OccupationFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * Filter, which Occupations to fetch.
     */
    where?: OccupationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Occupations to fetch.
     */
    orderBy?:
      | OccupationOrderByWithRelationInput
      | OccupationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Occupations.
     */
    cursor?: OccupationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Occupations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Occupations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Occupations.
     */
    distinct?: OccupationScalarFieldEnum | OccupationScalarFieldEnum[];
  };

  /**
   * Occupation create
   */
  export type OccupationCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * The data needed to create a Occupation.
     */
    data: XOR<OccupationCreateInput, OccupationUncheckedCreateInput>;
  };

  /**
   * Occupation createMany
   */
  export type OccupationCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Occupations.
     */
    data: OccupationCreateManyInput | OccupationCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * Occupation createManyAndReturn
   */
  export type OccupationCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * The data used to create many Occupations.
     */
    data: OccupationCreateManyInput | OccupationCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Occupation update
   */
  export type OccupationUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * The data needed to update a Occupation.
     */
    data: XOR<OccupationUpdateInput, OccupationUncheckedUpdateInput>;
    /**
     * Choose, which Occupation to update.
     */
    where: OccupationWhereUniqueInput;
  };

  /**
   * Occupation updateMany
   */
  export type OccupationUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Occupations.
     */
    data: XOR<
      OccupationUpdateManyMutationInput,
      OccupationUncheckedUpdateManyInput
    >;
    /**
     * Filter which Occupations to update
     */
    where?: OccupationWhereInput;
    /**
     * Limit how many Occupations to update.
     */
    limit?: number;
  };

  /**
   * Occupation updateManyAndReturn
   */
  export type OccupationUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * The data used to update Occupations.
     */
    data: XOR<
      OccupationUpdateManyMutationInput,
      OccupationUncheckedUpdateManyInput
    >;
    /**
     * Filter which Occupations to update
     */
    where?: OccupationWhereInput;
    /**
     * Limit how many Occupations to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Occupation upsert
   */
  export type OccupationUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * The filter to search for the Occupation to update in case it exists.
     */
    where: OccupationWhereUniqueInput;
    /**
     * In case the Occupation found by the `where` argument doesn't exist, create a new Occupation with this data.
     */
    create: XOR<OccupationCreateInput, OccupationUncheckedCreateInput>;
    /**
     * In case the Occupation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OccupationUpdateInput, OccupationUncheckedUpdateInput>;
  };

  /**
   * Occupation delete
   */
  export type OccupationDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    /**
     * Filter which Occupation to delete.
     */
    where: OccupationWhereUniqueInput;
  };

  /**
   * Occupation deleteMany
   */
  export type OccupationDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Occupations to delete
     */
    where?: OccupationWhereInput;
    /**
     * Limit how many Occupations to delete.
     */
    limit?: number;
  };

  /**
   * Occupation.parent
   */
  export type Occupation$parentArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    where?: OccupationWhereInput;
  };

  /**
   * Occupation.parent_to_Occupation_reverse
   */
  export type Occupation$parent_to_Occupation_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    where?: OccupationWhereInput;
    orderBy?:
      | OccupationOrderByWithRelationInput
      | OccupationOrderByWithRelationInput[];
    cursor?: OccupationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: OccupationScalarFieldEnum | OccupationScalarFieldEnum[];
  };

  /**
   * Occupation.profession_to_Person_reverse
   */
  export type Occupation$profession_to_Person_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    where?: PersonWhereInput;
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[];
    cursor?: PersonWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[];
  };

  /**
   * Occupation without action
   */
  export type OccupationDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
  };

  /**
   * Model Person
   */

  export type AggregatePerson = {
    _count: PersonCountAggregateOutputType | null;
    _avg: PersonAvgAggregateOutputType | null;
    _sum: PersonSumAggregateOutputType | null;
    _min: PersonMinAggregateOutputType | null;
    _max: PersonMaxAggregateOutputType | null;
  };

  export type PersonAvgAggregateOutputType = {
    birthDate: number | null;
    deathDate: number | null;
  };

  export type PersonSumAggregateOutputType = {
    birthDate: number | null;
    deathDate: number | null;
  };

  export type PersonMinAggregateOutputType = {
    name: string | null;
    description: string | null;
    birthDate: number | null;
    deathDate: number | null;
    gender: string | null;
    personDeceased: boolean | null;
    externalId: string | null;
    birthPlace_id: string | null;
    image: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type PersonMaxAggregateOutputType = {
    name: string | null;
    description: string | null;
    birthDate: number | null;
    deathDate: number | null;
    gender: string | null;
    personDeceased: boolean | null;
    externalId: string | null;
    birthPlace_id: string | null;
    image: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type PersonCountAggregateOutputType = {
    name: number;
    description: number;
    birthDate: number;
    deathDate: number;
    gender: number;
    personDeceased: number;
    externalId: number;
    birthPlace_id: number;
    image: number;
    nameVariant: number;
    idAuthority_authority: number;
    idAuthority_id: number;
    type: number;
    id: number;
    _all: number;
  };

  export type PersonAvgAggregateInputType = {
    birthDate?: true;
    deathDate?: true;
  };

  export type PersonSumAggregateInputType = {
    birthDate?: true;
    deathDate?: true;
  };

  export type PersonMinAggregateInputType = {
    name?: true;
    description?: true;
    birthDate?: true;
    deathDate?: true;
    gender?: true;
    personDeceased?: true;
    externalId?: true;
    birthPlace_id?: true;
    image?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type PersonMaxAggregateInputType = {
    name?: true;
    description?: true;
    birthDate?: true;
    deathDate?: true;
    gender?: true;
    personDeceased?: true;
    externalId?: true;
    birthPlace_id?: true;
    image?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type PersonCountAggregateInputType = {
    name?: true;
    description?: true;
    birthDate?: true;
    deathDate?: true;
    gender?: true;
    personDeceased?: true;
    externalId?: true;
    birthPlace_id?: true;
    image?: true;
    nameVariant?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
    _all?: true;
  };

  export type PersonAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Person to aggregate.
     */
    where?: PersonWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of People to fetch.
     */
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PersonWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` People from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` People.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned People
     **/
    _count?: true | PersonCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: PersonAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: PersonSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: PersonMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: PersonMaxAggregateInputType;
  };

  export type GetPersonAggregateType<T extends PersonAggregateArgs> = {
    [P in keyof T & keyof AggregatePerson]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePerson[P]>
      : GetScalarType<T[P], AggregatePerson[P]>;
  };

  export type PersonGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PersonWhereInput;
    orderBy?:
      | PersonOrderByWithAggregationInput
      | PersonOrderByWithAggregationInput[];
    by: PersonScalarFieldEnum[] | PersonScalarFieldEnum;
    having?: PersonScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PersonCountAggregateInputType | true;
    _avg?: PersonAvgAggregateInputType;
    _sum?: PersonSumAggregateInputType;
    _min?: PersonMinAggregateInputType;
    _max?: PersonMaxAggregateInputType;
  };

  export type PersonGroupByOutputType = {
    name: string | null;
    description: string | null;
    birthDate: number | null;
    deathDate: number | null;
    gender: string | null;
    personDeceased: boolean | null;
    externalId: string | null;
    birthPlace_id: string | null;
    image: string | null;
    nameVariant: string[];
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string;
    _count: PersonCountAggregateOutputType | null;
    _avg: PersonAvgAggregateOutputType | null;
    _sum: PersonSumAggregateOutputType | null;
    _min: PersonMinAggregateOutputType | null;
    _max: PersonMaxAggregateOutputType | null;
  };

  type GetPersonGroupByPayload<T extends PersonGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<PersonGroupByOutputType, T["by"]> & {
          [P in keyof T & keyof PersonGroupByOutputType]: P extends "_count"
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PersonGroupByOutputType[P]>
            : GetScalarType<T[P], PersonGroupByOutputType[P]>;
        }
      >
    >;

  export type PersonSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      name?: boolean;
      description?: boolean;
      birthDate?: boolean;
      deathDate?: boolean;
      gender?: boolean;
      personDeceased?: boolean;
      externalId?: boolean;
      birthPlace_id?: boolean;
      image?: boolean;
      nameVariant?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      profession?: boolean | Person$professionArgs<ExtArgs>;
      birthPlace?: boolean | Person$birthPlaceArgs<ExtArgs>;
      memberOfCorp?: boolean | Person$memberOfCorpArgs<ExtArgs>;
      _count?: boolean | PersonCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["person"]
  >;

  export type PersonSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      name?: boolean;
      description?: boolean;
      birthDate?: boolean;
      deathDate?: boolean;
      gender?: boolean;
      personDeceased?: boolean;
      externalId?: boolean;
      birthPlace_id?: boolean;
      image?: boolean;
      nameVariant?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      birthPlace?: boolean | Person$birthPlaceArgs<ExtArgs>;
    },
    ExtArgs["result"]["person"]
  >;

  export type PersonSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      name?: boolean;
      description?: boolean;
      birthDate?: boolean;
      deathDate?: boolean;
      gender?: boolean;
      personDeceased?: boolean;
      externalId?: boolean;
      birthPlace_id?: boolean;
      image?: boolean;
      nameVariant?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      birthPlace?: boolean | Person$birthPlaceArgs<ExtArgs>;
    },
    ExtArgs["result"]["person"]
  >;

  export type PersonSelectScalar = {
    name?: boolean;
    description?: boolean;
    birthDate?: boolean;
    deathDate?: boolean;
    gender?: boolean;
    personDeceased?: boolean;
    externalId?: boolean;
    birthPlace_id?: boolean;
    image?: boolean;
    nameVariant?: boolean;
    idAuthority_authority?: boolean;
    idAuthority_id?: boolean;
    type?: boolean;
    id?: boolean;
  };

  export type PersonOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | "name"
    | "description"
    | "birthDate"
    | "deathDate"
    | "gender"
    | "personDeceased"
    | "externalId"
    | "birthPlace_id"
    | "image"
    | "nameVariant"
    | "idAuthority_authority"
    | "idAuthority_id"
    | "type"
    | "id",
    ExtArgs["result"]["person"]
  >;
  export type PersonInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    profession?: boolean | Person$professionArgs<ExtArgs>;
    birthPlace?: boolean | Person$birthPlaceArgs<ExtArgs>;
    memberOfCorp?: boolean | Person$memberOfCorpArgs<ExtArgs>;
    _count?: boolean | PersonCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type PersonIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    birthPlace?: boolean | Person$birthPlaceArgs<ExtArgs>;
  };
  export type PersonIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    birthPlace?: boolean | Person$birthPlaceArgs<ExtArgs>;
  };

  export type $PersonPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: "Person";
    objects: {
      profession: Prisma.$OccupationPayload<ExtArgs>[];
      birthPlace: Prisma.$PlacePayload<ExtArgs> | null;
      memberOfCorp: Prisma.$CorporationPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        name: string | null;
        description: string | null;
        birthDate: number | null;
        deathDate: number | null;
        gender: string | null;
        personDeceased: boolean | null;
        externalId: string | null;
        birthPlace_id: string | null;
        image: string | null;
        nameVariant: string[];
        idAuthority_authority: string | null;
        idAuthority_id: string | null;
        type: string | null;
        id: string;
      },
      ExtArgs["result"]["person"]
    >;
    composites: {};
  };

  type PersonGetPayload<
    S extends boolean | null | undefined | PersonDefaultArgs,
  > = $Result.GetResult<Prisma.$PersonPayload, S>;

  type PersonCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<PersonFindManyArgs, "select" | "include" | "distinct" | "omit"> & {
    select?: PersonCountAggregateInputType | true;
  };

  export interface PersonDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["Person"];
      meta: { name: "Person" };
    };
    /**
     * Find zero or one Person that matches the filter.
     * @param {PersonFindUniqueArgs} args - Arguments to find a Person
     * @example
     * // Get one Person
     * const person = await prisma.person.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PersonFindUniqueArgs>(
      args: SelectSubset<T, PersonFindUniqueArgs<ExtArgs>>,
    ): Prisma__PersonClient<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "findUnique",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Person that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PersonFindUniqueOrThrowArgs} args - Arguments to find a Person
     * @example
     * // Get one Person
     * const person = await prisma.person.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PersonFindUniqueOrThrowArgs>(
      args: SelectSubset<T, PersonFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__PersonClient<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Person that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonFindFirstArgs} args - Arguments to find a Person
     * @example
     * // Get one Person
     * const person = await prisma.person.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PersonFindFirstArgs>(
      args?: SelectSubset<T, PersonFindFirstArgs<ExtArgs>>,
    ): Prisma__PersonClient<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "findFirst",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Person that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonFindFirstOrThrowArgs} args - Arguments to find a Person
     * @example
     * // Get one Person
     * const person = await prisma.person.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PersonFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PersonFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__PersonClient<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "findFirstOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more People that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all People
     * const people = await prisma.person.findMany()
     *
     * // Get first 10 People
     * const people = await prisma.person.findMany({ take: 10 })
     *
     * // Only select the `name`
     * const personWithNameOnly = await prisma.person.findMany({ select: { name: true } })
     *
     */
    findMany<T extends PersonFindManyArgs>(
      args?: SelectSubset<T, PersonFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "findMany",
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Person.
     * @param {PersonCreateArgs} args - Arguments to create a Person.
     * @example
     * // Create one Person
     * const Person = await prisma.person.create({
     *   data: {
     *     // ... data to create a Person
     *   }
     * })
     *
     */
    create<T extends PersonCreateArgs>(
      args: SelectSubset<T, PersonCreateArgs<ExtArgs>>,
    ): Prisma__PersonClient<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "create",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many People.
     * @param {PersonCreateManyArgs} args - Arguments to create many People.
     * @example
     * // Create many People
     * const person = await prisma.person.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PersonCreateManyArgs>(
      args?: SelectSubset<T, PersonCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many People and returns the data saved in the database.
     * @param {PersonCreateManyAndReturnArgs} args - Arguments to create many People.
     * @example
     * // Create many People
     * const person = await prisma.person.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many People and only return the `name`
     * const personWithNameOnly = await prisma.person.createManyAndReturn({
     *   select: { name: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PersonCreateManyAndReturnArgs>(
      args?: SelectSubset<T, PersonCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "createManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Person.
     * @param {PersonDeleteArgs} args - Arguments to delete one Person.
     * @example
     * // Delete one Person
     * const Person = await prisma.person.delete({
     *   where: {
     *     // ... filter to delete one Person
     *   }
     * })
     *
     */
    delete<T extends PersonDeleteArgs>(
      args: SelectSubset<T, PersonDeleteArgs<ExtArgs>>,
    ): Prisma__PersonClient<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "delete",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Person.
     * @param {PersonUpdateArgs} args - Arguments to update one Person.
     * @example
     * // Update one Person
     * const person = await prisma.person.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PersonUpdateArgs>(
      args: SelectSubset<T, PersonUpdateArgs<ExtArgs>>,
    ): Prisma__PersonClient<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "update",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more People.
     * @param {PersonDeleteManyArgs} args - Arguments to filter People to delete.
     * @example
     * // Delete a few People
     * const { count } = await prisma.person.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PersonDeleteManyArgs>(
      args?: SelectSubset<T, PersonDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more People.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many People
     * const person = await prisma.person.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PersonUpdateManyArgs>(
      args: SelectSubset<T, PersonUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more People and returns the data updated in the database.
     * @param {PersonUpdateManyAndReturnArgs} args - Arguments to update many People.
     * @example
     * // Update many People
     * const person = await prisma.person.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more People and only return the `name`
     * const personWithNameOnly = await prisma.person.updateManyAndReturn({
     *   select: { name: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PersonUpdateManyAndReturnArgs>(
      args: SelectSubset<T, PersonUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "updateManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Person.
     * @param {PersonUpsertArgs} args - Arguments to update or create a Person.
     * @example
     * // Update or create a Person
     * const person = await prisma.person.upsert({
     *   create: {
     *     // ... data to create a Person
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Person we want to update
     *   }
     * })
     */
    upsert<T extends PersonUpsertArgs>(
      args: SelectSubset<T, PersonUpsertArgs<ExtArgs>>,
    ): Prisma__PersonClient<
      $Result.GetResult<
        Prisma.$PersonPayload<ExtArgs>,
        T,
        "upsert",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of People.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonCountArgs} args - Arguments to filter People to count.
     * @example
     * // Count the number of People
     * const count = await prisma.person.count({
     *   where: {
     *     // ... the filter for the People we want to count
     *   }
     * })
     **/
    count<T extends PersonCountArgs>(
      args?: Subset<T, PersonCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], PersonCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Person.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends PersonAggregateArgs>(
      args: Subset<T, PersonAggregateArgs>,
    ): Prisma.PrismaPromise<GetPersonAggregateType<T>>;

    /**
     * Group by Person.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PersonGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends PersonGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<"skip", Keys<T>>,
        Extends<"take", Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PersonGroupByArgs["orderBy"] }
        : { orderBy?: PersonGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T["orderBy"]>>
      >,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      "Field ",
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, PersonGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetPersonGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Person model
     */
    readonly fields: PersonFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Person.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PersonClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    profession<T extends Person$professionArgs<ExtArgs> = {}>(
      args?: Subset<T, Person$professionArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$OccupationPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    birthPlace<T extends Person$birthPlaceArgs<ExtArgs> = {}>(
      args?: Subset<T, Person$birthPlaceArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    memberOfCorp<T extends Person$memberOfCorpArgs<ExtArgs> = {}>(
      args?: Subset<T, Person$memberOfCorpArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$CorporationPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Person model
   */
  interface PersonFieldRefs {
    readonly name: FieldRef<"Person", "String">;
    readonly description: FieldRef<"Person", "String">;
    readonly birthDate: FieldRef<"Person", "Int">;
    readonly deathDate: FieldRef<"Person", "Int">;
    readonly gender: FieldRef<"Person", "String">;
    readonly personDeceased: FieldRef<"Person", "Boolean">;
    readonly externalId: FieldRef<"Person", "String">;
    readonly birthPlace_id: FieldRef<"Person", "String">;
    readonly image: FieldRef<"Person", "String">;
    readonly nameVariant: FieldRef<"Person", "String[]">;
    readonly idAuthority_authority: FieldRef<"Person", "String">;
    readonly idAuthority_id: FieldRef<"Person", "String">;
    readonly type: FieldRef<"Person", "String">;
    readonly id: FieldRef<"Person", "String">;
  }

  // Custom InputTypes
  /**
   * Person findUnique
   */
  export type PersonFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * Filter, which Person to fetch.
     */
    where: PersonWhereUniqueInput;
  };

  /**
   * Person findUniqueOrThrow
   */
  export type PersonFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * Filter, which Person to fetch.
     */
    where: PersonWhereUniqueInput;
  };

  /**
   * Person findFirst
   */
  export type PersonFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * Filter, which Person to fetch.
     */
    where?: PersonWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of People to fetch.
     */
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for People.
     */
    cursor?: PersonWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` People from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` People.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of People.
     */
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[];
  };

  /**
   * Person findFirstOrThrow
   */
  export type PersonFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * Filter, which Person to fetch.
     */
    where?: PersonWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of People to fetch.
     */
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for People.
     */
    cursor?: PersonWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` People from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` People.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of People.
     */
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[];
  };

  /**
   * Person findMany
   */
  export type PersonFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * Filter, which People to fetch.
     */
    where?: PersonWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of People to fetch.
     */
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing People.
     */
    cursor?: PersonWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` People from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` People.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of People.
     */
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[];
  };

  /**
   * Person create
   */
  export type PersonCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * The data needed to create a Person.
     */
    data: XOR<PersonCreateInput, PersonUncheckedCreateInput>;
  };

  /**
   * Person createMany
   */
  export type PersonCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many People.
     */
    data: PersonCreateManyInput | PersonCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * Person createManyAndReturn
   */
  export type PersonCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * The data used to create many People.
     */
    data: PersonCreateManyInput | PersonCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Person update
   */
  export type PersonUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * The data needed to update a Person.
     */
    data: XOR<PersonUpdateInput, PersonUncheckedUpdateInput>;
    /**
     * Choose, which Person to update.
     */
    where: PersonWhereUniqueInput;
  };

  /**
   * Person updateMany
   */
  export type PersonUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update People.
     */
    data: XOR<PersonUpdateManyMutationInput, PersonUncheckedUpdateManyInput>;
    /**
     * Filter which People to update
     */
    where?: PersonWhereInput;
    /**
     * Limit how many People to update.
     */
    limit?: number;
  };

  /**
   * Person updateManyAndReturn
   */
  export type PersonUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * The data used to update People.
     */
    data: XOR<PersonUpdateManyMutationInput, PersonUncheckedUpdateManyInput>;
    /**
     * Filter which People to update
     */
    where?: PersonWhereInput;
    /**
     * Limit how many People to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Person upsert
   */
  export type PersonUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * The filter to search for the Person to update in case it exists.
     */
    where: PersonWhereUniqueInput;
    /**
     * In case the Person found by the `where` argument doesn't exist, create a new Person with this data.
     */
    create: XOR<PersonCreateInput, PersonUncheckedCreateInput>;
    /**
     * In case the Person was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PersonUpdateInput, PersonUncheckedUpdateInput>;
  };

  /**
   * Person delete
   */
  export type PersonDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    /**
     * Filter which Person to delete.
     */
    where: PersonWhereUniqueInput;
  };

  /**
   * Person deleteMany
   */
  export type PersonDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which People to delete
     */
    where?: PersonWhereInput;
    /**
     * Limit how many People to delete.
     */
    limit?: number;
  };

  /**
   * Person.profession
   */
  export type Person$professionArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Occupation
     */
    select?: OccupationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Occupation
     */
    omit?: OccupationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: OccupationInclude<ExtArgs> | null;
    where?: OccupationWhereInput;
    orderBy?:
      | OccupationOrderByWithRelationInput
      | OccupationOrderByWithRelationInput[];
    cursor?: OccupationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: OccupationScalarFieldEnum | OccupationScalarFieldEnum[];
  };

  /**
   * Person.birthPlace
   */
  export type Person$birthPlaceArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    where?: PlaceWhereInput;
  };

  /**
   * Person.memberOfCorp
   */
  export type Person$memberOfCorpArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    where?: CorporationWhereInput;
    orderBy?:
      | CorporationOrderByWithRelationInput
      | CorporationOrderByWithRelationInput[];
    cursor?: CorporationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: CorporationScalarFieldEnum | CorporationScalarFieldEnum[];
  };

  /**
   * Person without action
   */
  export type PersonDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
  };

  /**
   * Model Place
   */

  export type AggregatePlace = {
    _count: PlaceCountAggregateOutputType | null;
    _min: PlaceMinAggregateOutputType | null;
    _max: PlaceMaxAggregateOutputType | null;
  };

  export type PlaceMinAggregateOutputType = {
    title: string | null;
    description: string | null;
    titleVariants: string | null;
    location_id: string | null;
    parent_id: string | null;
    image: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type PlaceMaxAggregateOutputType = {
    title: string | null;
    description: string | null;
    titleVariants: string | null;
    location_id: string | null;
    parent_id: string | null;
    image: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type PlaceCountAggregateOutputType = {
    title: number;
    description: number;
    titleVariants: number;
    location_id: number;
    parent_id: number;
    image: number;
    idAuthority_authority: number;
    idAuthority_id: number;
    type: number;
    id: number;
    _all: number;
  };

  export type PlaceMinAggregateInputType = {
    title?: true;
    description?: true;
    titleVariants?: true;
    location_id?: true;
    parent_id?: true;
    image?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type PlaceMaxAggregateInputType = {
    title?: true;
    description?: true;
    titleVariants?: true;
    location_id?: true;
    parent_id?: true;
    image?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type PlaceCountAggregateInputType = {
    title?: true;
    description?: true;
    titleVariants?: true;
    location_id?: true;
    parent_id?: true;
    image?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
    _all?: true;
  };

  export type PlaceAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Place to aggregate.
     */
    where?: PlaceWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Places to fetch.
     */
    orderBy?: PlaceOrderByWithRelationInput | PlaceOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PlaceWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Places from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Places.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Places
     **/
    _count?: true | PlaceCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: PlaceMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: PlaceMaxAggregateInputType;
  };

  export type GetPlaceAggregateType<T extends PlaceAggregateArgs> = {
    [P in keyof T & keyof AggregatePlace]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlace[P]>
      : GetScalarType<T[P], AggregatePlace[P]>;
  };

  export type PlaceGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PlaceWhereInput;
    orderBy?:
      | PlaceOrderByWithAggregationInput
      | PlaceOrderByWithAggregationInput[];
    by: PlaceScalarFieldEnum[] | PlaceScalarFieldEnum;
    having?: PlaceScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PlaceCountAggregateInputType | true;
    _min?: PlaceMinAggregateInputType;
    _max?: PlaceMaxAggregateInputType;
  };

  export type PlaceGroupByOutputType = {
    title: string | null;
    description: string | null;
    titleVariants: string | null;
    location_id: string | null;
    parent_id: string | null;
    image: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string;
    _count: PlaceCountAggregateOutputType | null;
    _min: PlaceMinAggregateOutputType | null;
    _max: PlaceMaxAggregateOutputType | null;
  };

  type GetPlaceGroupByPayload<T extends PlaceGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<PlaceGroupByOutputType, T["by"]> & {
          [P in keyof T & keyof PlaceGroupByOutputType]: P extends "_count"
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PlaceGroupByOutputType[P]>
            : GetScalarType<T[P], PlaceGroupByOutputType[P]>;
        }
      >
    >;

  export type PlaceSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      titleVariants?: boolean;
      location_id?: boolean;
      parent_id?: boolean;
      image?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      birthPlace_to_Person_reverse?:
        | boolean
        | Place$birthPlace_to_Person_reverseArgs<ExtArgs>;
      location?: boolean | Place$locationArgs<ExtArgs>;
      parent?: boolean | Place$parentArgs<ExtArgs>;
      parent_to_Place_reverse?:
        | boolean
        | Place$parent_to_Place_reverseArgs<ExtArgs>;
      _count?: boolean | PlaceCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["place"]
  >;

  export type PlaceSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      titleVariants?: boolean;
      location_id?: boolean;
      parent_id?: boolean;
      image?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      location?: boolean | Place$locationArgs<ExtArgs>;
      parent?: boolean | Place$parentArgs<ExtArgs>;
    },
    ExtArgs["result"]["place"]
  >;

  export type PlaceSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      titleVariants?: boolean;
      location_id?: boolean;
      parent_id?: boolean;
      image?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      location?: boolean | Place$locationArgs<ExtArgs>;
      parent?: boolean | Place$parentArgs<ExtArgs>;
    },
    ExtArgs["result"]["place"]
  >;

  export type PlaceSelectScalar = {
    title?: boolean;
    description?: boolean;
    titleVariants?: boolean;
    location_id?: boolean;
    parent_id?: boolean;
    image?: boolean;
    idAuthority_authority?: boolean;
    idAuthority_id?: boolean;
    type?: boolean;
    id?: boolean;
  };

  export type PlaceOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | "title"
    | "description"
    | "titleVariants"
    | "location_id"
    | "parent_id"
    | "image"
    | "idAuthority_authority"
    | "idAuthority_id"
    | "type"
    | "id",
    ExtArgs["result"]["place"]
  >;
  export type PlaceInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    birthPlace_to_Person_reverse?:
      | boolean
      | Place$birthPlace_to_Person_reverseArgs<ExtArgs>;
    location?: boolean | Place$locationArgs<ExtArgs>;
    parent?: boolean | Place$parentArgs<ExtArgs>;
    parent_to_Place_reverse?:
      | boolean
      | Place$parent_to_Place_reverseArgs<ExtArgs>;
    _count?: boolean | PlaceCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type PlaceIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    location?: boolean | Place$locationArgs<ExtArgs>;
    parent?: boolean | Place$parentArgs<ExtArgs>;
  };
  export type PlaceIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    location?: boolean | Place$locationArgs<ExtArgs>;
    parent?: boolean | Place$parentArgs<ExtArgs>;
  };

  export type $PlacePayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: "Place";
    objects: {
      birthPlace_to_Person_reverse: Prisma.$PersonPayload<ExtArgs>[];
      location: Prisma.$LocationPayload<ExtArgs> | null;
      parent: Prisma.$PlacePayload<ExtArgs> | null;
      parent_to_Place_reverse: Prisma.$PlacePayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        title: string | null;
        description: string | null;
        titleVariants: string | null;
        location_id: string | null;
        parent_id: string | null;
        image: string | null;
        idAuthority_authority: string | null;
        idAuthority_id: string | null;
        type: string | null;
        id: string;
      },
      ExtArgs["result"]["place"]
    >;
    composites: {};
  };

  type PlaceGetPayload<
    S extends boolean | null | undefined | PlaceDefaultArgs,
  > = $Result.GetResult<Prisma.$PlacePayload, S>;

  type PlaceCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<PlaceFindManyArgs, "select" | "include" | "distinct" | "omit"> & {
    select?: PlaceCountAggregateInputType | true;
  };

  export interface PlaceDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["Place"];
      meta: { name: "Place" };
    };
    /**
     * Find zero or one Place that matches the filter.
     * @param {PlaceFindUniqueArgs} args - Arguments to find a Place
     * @example
     * // Get one Place
     * const place = await prisma.place.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlaceFindUniqueArgs>(
      args: SelectSubset<T, PlaceFindUniqueArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "findUnique",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Place that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlaceFindUniqueOrThrowArgs} args - Arguments to find a Place
     * @example
     * // Get one Place
     * const place = await prisma.place.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlaceFindUniqueOrThrowArgs>(
      args: SelectSubset<T, PlaceFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Place that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaceFindFirstArgs} args - Arguments to find a Place
     * @example
     * // Get one Place
     * const place = await prisma.place.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlaceFindFirstArgs>(
      args?: SelectSubset<T, PlaceFindFirstArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "findFirst",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Place that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaceFindFirstOrThrowArgs} args - Arguments to find a Place
     * @example
     * // Get one Place
     * const place = await prisma.place.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlaceFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PlaceFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "findFirstOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Places that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Places
     * const places = await prisma.place.findMany()
     *
     * // Get first 10 Places
     * const places = await prisma.place.findMany({ take: 10 })
     *
     * // Only select the `title`
     * const placeWithTitleOnly = await prisma.place.findMany({ select: { title: true } })
     *
     */
    findMany<T extends PlaceFindManyArgs>(
      args?: SelectSubset<T, PlaceFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "findMany",
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Place.
     * @param {PlaceCreateArgs} args - Arguments to create a Place.
     * @example
     * // Create one Place
     * const Place = await prisma.place.create({
     *   data: {
     *     // ... data to create a Place
     *   }
     * })
     *
     */
    create<T extends PlaceCreateArgs>(
      args: SelectSubset<T, PlaceCreateArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "create",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Places.
     * @param {PlaceCreateManyArgs} args - Arguments to create many Places.
     * @example
     * // Create many Places
     * const place = await prisma.place.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PlaceCreateManyArgs>(
      args?: SelectSubset<T, PlaceCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Places and returns the data saved in the database.
     * @param {PlaceCreateManyAndReturnArgs} args - Arguments to create many Places.
     * @example
     * // Create many Places
     * const place = await prisma.place.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Places and only return the `title`
     * const placeWithTitleOnly = await prisma.place.createManyAndReturn({
     *   select: { title: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PlaceCreateManyAndReturnArgs>(
      args?: SelectSubset<T, PlaceCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "createManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Place.
     * @param {PlaceDeleteArgs} args - Arguments to delete one Place.
     * @example
     * // Delete one Place
     * const Place = await prisma.place.delete({
     *   where: {
     *     // ... filter to delete one Place
     *   }
     * })
     *
     */
    delete<T extends PlaceDeleteArgs>(
      args: SelectSubset<T, PlaceDeleteArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "delete",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Place.
     * @param {PlaceUpdateArgs} args - Arguments to update one Place.
     * @example
     * // Update one Place
     * const place = await prisma.place.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PlaceUpdateArgs>(
      args: SelectSubset<T, PlaceUpdateArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "update",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Places.
     * @param {PlaceDeleteManyArgs} args - Arguments to filter Places to delete.
     * @example
     * // Delete a few Places
     * const { count } = await prisma.place.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PlaceDeleteManyArgs>(
      args?: SelectSubset<T, PlaceDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Places.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Places
     * const place = await prisma.place.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PlaceUpdateManyArgs>(
      args: SelectSubset<T, PlaceUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Places and returns the data updated in the database.
     * @param {PlaceUpdateManyAndReturnArgs} args - Arguments to update many Places.
     * @example
     * // Update many Places
     * const place = await prisma.place.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Places and only return the `title`
     * const placeWithTitleOnly = await prisma.place.updateManyAndReturn({
     *   select: { title: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PlaceUpdateManyAndReturnArgs>(
      args: SelectSubset<T, PlaceUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "updateManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Place.
     * @param {PlaceUpsertArgs} args - Arguments to update or create a Place.
     * @example
     * // Update or create a Place
     * const place = await prisma.place.upsert({
     *   create: {
     *     // ... data to create a Place
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Place we want to update
     *   }
     * })
     */
    upsert<T extends PlaceUpsertArgs>(
      args: SelectSubset<T, PlaceUpsertArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "upsert",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Places.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaceCountArgs} args - Arguments to filter Places to count.
     * @example
     * // Count the number of Places
     * const count = await prisma.place.count({
     *   where: {
     *     // ... the filter for the Places we want to count
     *   }
     * })
     **/
    count<T extends PlaceCountArgs>(
      args?: Subset<T, PlaceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], PlaceCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Place.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends PlaceAggregateArgs>(
      args: Subset<T, PlaceAggregateArgs>,
    ): Prisma.PrismaPromise<GetPlaceAggregateType<T>>;

    /**
     * Group by Place.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends PlaceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<"skip", Keys<T>>,
        Extends<"take", Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlaceGroupByArgs["orderBy"] }
        : { orderBy?: PlaceGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T["orderBy"]>>
      >,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      "Field ",
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, PlaceGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors
      ? GetPlaceGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Place model
     */
    readonly fields: PlaceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Place.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlaceClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    birthPlace_to_Person_reverse<
      T extends Place$birthPlace_to_Person_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Place$birthPlace_to_Person_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$PersonPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    location<T extends Place$locationArgs<ExtArgs> = {}>(
      args?: Subset<T, Place$locationArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    parent<T extends Place$parentArgs<ExtArgs> = {}>(
      args?: Subset<T, Place$parentArgs<ExtArgs>>,
    ): Prisma__PlaceClient<
      $Result.GetResult<
        Prisma.$PlacePayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    parent_to_Place_reverse<
      T extends Place$parent_to_Place_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Place$parent_to_Place_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$PlacePayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Place model
   */
  interface PlaceFieldRefs {
    readonly title: FieldRef<"Place", "String">;
    readonly description: FieldRef<"Place", "String">;
    readonly titleVariants: FieldRef<"Place", "String">;
    readonly location_id: FieldRef<"Place", "String">;
    readonly parent_id: FieldRef<"Place", "String">;
    readonly image: FieldRef<"Place", "String">;
    readonly idAuthority_authority: FieldRef<"Place", "String">;
    readonly idAuthority_id: FieldRef<"Place", "String">;
    readonly type: FieldRef<"Place", "String">;
    readonly id: FieldRef<"Place", "String">;
  }

  // Custom InputTypes
  /**
   * Place findUnique
   */
  export type PlaceFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * Filter, which Place to fetch.
     */
    where: PlaceWhereUniqueInput;
  };

  /**
   * Place findUniqueOrThrow
   */
  export type PlaceFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * Filter, which Place to fetch.
     */
    where: PlaceWhereUniqueInput;
  };

  /**
   * Place findFirst
   */
  export type PlaceFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * Filter, which Place to fetch.
     */
    where?: PlaceWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Places to fetch.
     */
    orderBy?: PlaceOrderByWithRelationInput | PlaceOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Places.
     */
    cursor?: PlaceWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Places from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Places.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Places.
     */
    distinct?: PlaceScalarFieldEnum | PlaceScalarFieldEnum[];
  };

  /**
   * Place findFirstOrThrow
   */
  export type PlaceFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * Filter, which Place to fetch.
     */
    where?: PlaceWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Places to fetch.
     */
    orderBy?: PlaceOrderByWithRelationInput | PlaceOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Places.
     */
    cursor?: PlaceWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Places from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Places.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Places.
     */
    distinct?: PlaceScalarFieldEnum | PlaceScalarFieldEnum[];
  };

  /**
   * Place findMany
   */
  export type PlaceFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * Filter, which Places to fetch.
     */
    where?: PlaceWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Places to fetch.
     */
    orderBy?: PlaceOrderByWithRelationInput | PlaceOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Places.
     */
    cursor?: PlaceWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Places from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Places.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Places.
     */
    distinct?: PlaceScalarFieldEnum | PlaceScalarFieldEnum[];
  };

  /**
   * Place create
   */
  export type PlaceCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * The data needed to create a Place.
     */
    data: XOR<PlaceCreateInput, PlaceUncheckedCreateInput>;
  };

  /**
   * Place createMany
   */
  export type PlaceCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Places.
     */
    data: PlaceCreateManyInput | PlaceCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * Place createManyAndReturn
   */
  export type PlaceCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * The data used to create many Places.
     */
    data: PlaceCreateManyInput | PlaceCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Place update
   */
  export type PlaceUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * The data needed to update a Place.
     */
    data: XOR<PlaceUpdateInput, PlaceUncheckedUpdateInput>;
    /**
     * Choose, which Place to update.
     */
    where: PlaceWhereUniqueInput;
  };

  /**
   * Place updateMany
   */
  export type PlaceUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Places.
     */
    data: XOR<PlaceUpdateManyMutationInput, PlaceUncheckedUpdateManyInput>;
    /**
     * Filter which Places to update
     */
    where?: PlaceWhereInput;
    /**
     * Limit how many Places to update.
     */
    limit?: number;
  };

  /**
   * Place updateManyAndReturn
   */
  export type PlaceUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * The data used to update Places.
     */
    data: XOR<PlaceUpdateManyMutationInput, PlaceUncheckedUpdateManyInput>;
    /**
     * Filter which Places to update
     */
    where?: PlaceWhereInput;
    /**
     * Limit how many Places to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Place upsert
   */
  export type PlaceUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * The filter to search for the Place to update in case it exists.
     */
    where: PlaceWhereUniqueInput;
    /**
     * In case the Place found by the `where` argument doesn't exist, create a new Place with this data.
     */
    create: XOR<PlaceCreateInput, PlaceUncheckedCreateInput>;
    /**
     * In case the Place was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlaceUpdateInput, PlaceUncheckedUpdateInput>;
  };

  /**
   * Place delete
   */
  export type PlaceDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    /**
     * Filter which Place to delete.
     */
    where: PlaceWhereUniqueInput;
  };

  /**
   * Place deleteMany
   */
  export type PlaceDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Places to delete
     */
    where?: PlaceWhereInput;
    /**
     * Limit how many Places to delete.
     */
    limit?: number;
  };

  /**
   * Place.birthPlace_to_Person_reverse
   */
  export type Place$birthPlace_to_Person_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    where?: PersonWhereInput;
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[];
    cursor?: PersonWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[];
  };

  /**
   * Place.location
   */
  export type Place$locationArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    where?: LocationWhereInput;
  };

  /**
   * Place.parent
   */
  export type Place$parentArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    where?: PlaceWhereInput;
  };

  /**
   * Place.parent_to_Place_reverse
   */
  export type Place$parent_to_Place_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    where?: PlaceWhereInput;
    orderBy?: PlaceOrderByWithRelationInput | PlaceOrderByWithRelationInput[];
    cursor?: PlaceWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: PlaceScalarFieldEnum | PlaceScalarFieldEnum[];
  };

  /**
   * Place without action
   */
  export type PlaceDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
  };

  /**
   * Model Corporation
   */

  export type AggregateCorporation = {
    _count: CorporationCountAggregateOutputType | null;
    _min: CorporationMinAggregateOutputType | null;
    _max: CorporationMaxAggregateOutputType | null;
  };

  export type CorporationMinAggregateOutputType = {
    name: string | null;
    description: string | null;
    parent_id: string | null;
    location_id: string | null;
    image: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type CorporationMaxAggregateOutputType = {
    name: string | null;
    description: string | null;
    parent_id: string | null;
    location_id: string | null;
    image: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type CorporationCountAggregateOutputType = {
    name: number;
    description: number;
    parent_id: number;
    location_id: number;
    image: number;
    nameVariant: number;
    idAuthority_authority: number;
    idAuthority_id: number;
    type: number;
    id: number;
    _all: number;
  };

  export type CorporationMinAggregateInputType = {
    name?: true;
    description?: true;
    parent_id?: true;
    location_id?: true;
    image?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type CorporationMaxAggregateInputType = {
    name?: true;
    description?: true;
    parent_id?: true;
    location_id?: true;
    image?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type CorporationCountAggregateInputType = {
    name?: true;
    description?: true;
    parent_id?: true;
    location_id?: true;
    image?: true;
    nameVariant?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
    _all?: true;
  };

  export type CorporationAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Corporation to aggregate.
     */
    where?: CorporationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Corporations to fetch.
     */
    orderBy?:
      | CorporationOrderByWithRelationInput
      | CorporationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: CorporationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Corporations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Corporations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Corporations
     **/
    _count?: true | CorporationCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: CorporationMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: CorporationMaxAggregateInputType;
  };

  export type GetCorporationAggregateType<T extends CorporationAggregateArgs> =
    {
      [P in keyof T & keyof AggregateCorporation]: P extends "_count" | "count"
        ? T[P] extends true
          ? number
          : GetScalarType<T[P], AggregateCorporation[P]>
        : GetScalarType<T[P], AggregateCorporation[P]>;
    };

  export type CorporationGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: CorporationWhereInput;
    orderBy?:
      | CorporationOrderByWithAggregationInput
      | CorporationOrderByWithAggregationInput[];
    by: CorporationScalarFieldEnum[] | CorporationScalarFieldEnum;
    having?: CorporationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: CorporationCountAggregateInputType | true;
    _min?: CorporationMinAggregateInputType;
    _max?: CorporationMaxAggregateInputType;
  };

  export type CorporationGroupByOutputType = {
    name: string | null;
    description: string | null;
    parent_id: string | null;
    location_id: string | null;
    image: string | null;
    nameVariant: string[];
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string;
    _count: CorporationCountAggregateOutputType | null;
    _min: CorporationMinAggregateOutputType | null;
    _max: CorporationMaxAggregateOutputType | null;
  };

  type GetCorporationGroupByPayload<T extends CorporationGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<CorporationGroupByOutputType, T["by"]> & {
          [P in keyof T &
            keyof CorporationGroupByOutputType]: P extends "_count"
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CorporationGroupByOutputType[P]>
            : GetScalarType<T[P], CorporationGroupByOutputType[P]>;
        }
      >
    >;

  export type CorporationSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      name?: boolean;
      description?: boolean;
      parent_id?: boolean;
      location_id?: boolean;
      image?: boolean;
      nameVariant?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      memberOfCorp_to_Person_reverse?:
        | boolean
        | Corporation$memberOfCorp_to_Person_reverseArgs<ExtArgs>;
      parent?: boolean | Corporation$parentArgs<ExtArgs>;
      location?: boolean | Corporation$locationArgs<ExtArgs>;
      parent_to_Corporation_reverse?:
        | boolean
        | Corporation$parent_to_Corporation_reverseArgs<ExtArgs>;
      _count?: boolean | CorporationCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["corporation"]
  >;

  export type CorporationSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      name?: boolean;
      description?: boolean;
      parent_id?: boolean;
      location_id?: boolean;
      image?: boolean;
      nameVariant?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      parent?: boolean | Corporation$parentArgs<ExtArgs>;
      location?: boolean | Corporation$locationArgs<ExtArgs>;
    },
    ExtArgs["result"]["corporation"]
  >;

  export type CorporationSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      name?: boolean;
      description?: boolean;
      parent_id?: boolean;
      location_id?: boolean;
      image?: boolean;
      nameVariant?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      parent?: boolean | Corporation$parentArgs<ExtArgs>;
      location?: boolean | Corporation$locationArgs<ExtArgs>;
    },
    ExtArgs["result"]["corporation"]
  >;

  export type CorporationSelectScalar = {
    name?: boolean;
    description?: boolean;
    parent_id?: boolean;
    location_id?: boolean;
    image?: boolean;
    nameVariant?: boolean;
    idAuthority_authority?: boolean;
    idAuthority_id?: boolean;
    type?: boolean;
    id?: boolean;
  };

  export type CorporationOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | "name"
    | "description"
    | "parent_id"
    | "location_id"
    | "image"
    | "nameVariant"
    | "idAuthority_authority"
    | "idAuthority_id"
    | "type"
    | "id",
    ExtArgs["result"]["corporation"]
  >;
  export type CorporationInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    memberOfCorp_to_Person_reverse?:
      | boolean
      | Corporation$memberOfCorp_to_Person_reverseArgs<ExtArgs>;
    parent?: boolean | Corporation$parentArgs<ExtArgs>;
    location?: boolean | Corporation$locationArgs<ExtArgs>;
    parent_to_Corporation_reverse?:
      | boolean
      | Corporation$parent_to_Corporation_reverseArgs<ExtArgs>;
    _count?: boolean | CorporationCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type CorporationIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent?: boolean | Corporation$parentArgs<ExtArgs>;
    location?: boolean | Corporation$locationArgs<ExtArgs>;
  };
  export type CorporationIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent?: boolean | Corporation$parentArgs<ExtArgs>;
    location?: boolean | Corporation$locationArgs<ExtArgs>;
  };

  export type $CorporationPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: "Corporation";
    objects: {
      memberOfCorp_to_Person_reverse: Prisma.$PersonPayload<ExtArgs>[];
      parent: Prisma.$CorporationPayload<ExtArgs> | null;
      location: Prisma.$LocationPayload<ExtArgs> | null;
      parent_to_Corporation_reverse: Prisma.$CorporationPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        name: string | null;
        description: string | null;
        parent_id: string | null;
        location_id: string | null;
        image: string | null;
        nameVariant: string[];
        idAuthority_authority: string | null;
        idAuthority_id: string | null;
        type: string | null;
        id: string;
      },
      ExtArgs["result"]["corporation"]
    >;
    composites: {};
  };

  type CorporationGetPayload<
    S extends boolean | null | undefined | CorporationDefaultArgs,
  > = $Result.GetResult<Prisma.$CorporationPayload, S>;

  type CorporationCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    CorporationFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: CorporationCountAggregateInputType | true;
  };

  export interface CorporationDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["Corporation"];
      meta: { name: "Corporation" };
    };
    /**
     * Find zero or one Corporation that matches the filter.
     * @param {CorporationFindUniqueArgs} args - Arguments to find a Corporation
     * @example
     * // Get one Corporation
     * const corporation = await prisma.corporation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CorporationFindUniqueArgs>(
      args: SelectSubset<T, CorporationFindUniqueArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "findUnique",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Corporation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CorporationFindUniqueOrThrowArgs} args - Arguments to find a Corporation
     * @example
     * // Get one Corporation
     * const corporation = await prisma.corporation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CorporationFindUniqueOrThrowArgs>(
      args: SelectSubset<T, CorporationFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Corporation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CorporationFindFirstArgs} args - Arguments to find a Corporation
     * @example
     * // Get one Corporation
     * const corporation = await prisma.corporation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CorporationFindFirstArgs>(
      args?: SelectSubset<T, CorporationFindFirstArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "findFirst",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Corporation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CorporationFindFirstOrThrowArgs} args - Arguments to find a Corporation
     * @example
     * // Get one Corporation
     * const corporation = await prisma.corporation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CorporationFindFirstOrThrowArgs>(
      args?: SelectSubset<T, CorporationFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "findFirstOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Corporations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CorporationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Corporations
     * const corporations = await prisma.corporation.findMany()
     *
     * // Get first 10 Corporations
     * const corporations = await prisma.corporation.findMany({ take: 10 })
     *
     * // Only select the `name`
     * const corporationWithNameOnly = await prisma.corporation.findMany({ select: { name: true } })
     *
     */
    findMany<T extends CorporationFindManyArgs>(
      args?: SelectSubset<T, CorporationFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "findMany",
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Corporation.
     * @param {CorporationCreateArgs} args - Arguments to create a Corporation.
     * @example
     * // Create one Corporation
     * const Corporation = await prisma.corporation.create({
     *   data: {
     *     // ... data to create a Corporation
     *   }
     * })
     *
     */
    create<T extends CorporationCreateArgs>(
      args: SelectSubset<T, CorporationCreateArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "create",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Corporations.
     * @param {CorporationCreateManyArgs} args - Arguments to create many Corporations.
     * @example
     * // Create many Corporations
     * const corporation = await prisma.corporation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends CorporationCreateManyArgs>(
      args?: SelectSubset<T, CorporationCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Corporations and returns the data saved in the database.
     * @param {CorporationCreateManyAndReturnArgs} args - Arguments to create many Corporations.
     * @example
     * // Create many Corporations
     * const corporation = await prisma.corporation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Corporations and only return the `name`
     * const corporationWithNameOnly = await prisma.corporation.createManyAndReturn({
     *   select: { name: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends CorporationCreateManyAndReturnArgs>(
      args?: SelectSubset<T, CorporationCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "createManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Corporation.
     * @param {CorporationDeleteArgs} args - Arguments to delete one Corporation.
     * @example
     * // Delete one Corporation
     * const Corporation = await prisma.corporation.delete({
     *   where: {
     *     // ... filter to delete one Corporation
     *   }
     * })
     *
     */
    delete<T extends CorporationDeleteArgs>(
      args: SelectSubset<T, CorporationDeleteArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "delete",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Corporation.
     * @param {CorporationUpdateArgs} args - Arguments to update one Corporation.
     * @example
     * // Update one Corporation
     * const corporation = await prisma.corporation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends CorporationUpdateArgs>(
      args: SelectSubset<T, CorporationUpdateArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "update",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Corporations.
     * @param {CorporationDeleteManyArgs} args - Arguments to filter Corporations to delete.
     * @example
     * // Delete a few Corporations
     * const { count } = await prisma.corporation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends CorporationDeleteManyArgs>(
      args?: SelectSubset<T, CorporationDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Corporations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CorporationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Corporations
     * const corporation = await prisma.corporation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends CorporationUpdateManyArgs>(
      args: SelectSubset<T, CorporationUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Corporations and returns the data updated in the database.
     * @param {CorporationUpdateManyAndReturnArgs} args - Arguments to update many Corporations.
     * @example
     * // Update many Corporations
     * const corporation = await prisma.corporation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Corporations and only return the `name`
     * const corporationWithNameOnly = await prisma.corporation.updateManyAndReturn({
     *   select: { name: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends CorporationUpdateManyAndReturnArgs>(
      args: SelectSubset<T, CorporationUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "updateManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Corporation.
     * @param {CorporationUpsertArgs} args - Arguments to update or create a Corporation.
     * @example
     * // Update or create a Corporation
     * const corporation = await prisma.corporation.upsert({
     *   create: {
     *     // ... data to create a Corporation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Corporation we want to update
     *   }
     * })
     */
    upsert<T extends CorporationUpsertArgs>(
      args: SelectSubset<T, CorporationUpsertArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "upsert",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Corporations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CorporationCountArgs} args - Arguments to filter Corporations to count.
     * @example
     * // Count the number of Corporations
     * const count = await prisma.corporation.count({
     *   where: {
     *     // ... the filter for the Corporations we want to count
     *   }
     * })
     **/
    count<T extends CorporationCountArgs>(
      args?: Subset<T, CorporationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], CorporationCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Corporation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CorporationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends CorporationAggregateArgs>(
      args: Subset<T, CorporationAggregateArgs>,
    ): Prisma.PrismaPromise<GetCorporationAggregateType<T>>;

    /**
     * Group by Corporation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CorporationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends CorporationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<"skip", Keys<T>>,
        Extends<"take", Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CorporationGroupByArgs["orderBy"] }
        : { orderBy?: CorporationGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T["orderBy"]>>
      >,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      "Field ",
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, CorporationGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetCorporationGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Corporation model
     */
    readonly fields: CorporationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Corporation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CorporationClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    memberOfCorp_to_Person_reverse<
      T extends Corporation$memberOfCorp_to_Person_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Corporation$memberOfCorp_to_Person_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$PersonPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    parent<T extends Corporation$parentArgs<ExtArgs> = {}>(
      args?: Subset<T, Corporation$parentArgs<ExtArgs>>,
    ): Prisma__CorporationClient<
      $Result.GetResult<
        Prisma.$CorporationPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    location<T extends Corporation$locationArgs<ExtArgs> = {}>(
      args?: Subset<T, Corporation$locationArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    parent_to_Corporation_reverse<
      T extends Corporation$parent_to_Corporation_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Corporation$parent_to_Corporation_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$CorporationPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Corporation model
   */
  interface CorporationFieldRefs {
    readonly name: FieldRef<"Corporation", "String">;
    readonly description: FieldRef<"Corporation", "String">;
    readonly parent_id: FieldRef<"Corporation", "String">;
    readonly location_id: FieldRef<"Corporation", "String">;
    readonly image: FieldRef<"Corporation", "String">;
    readonly nameVariant: FieldRef<"Corporation", "String[]">;
    readonly idAuthority_authority: FieldRef<"Corporation", "String">;
    readonly idAuthority_id: FieldRef<"Corporation", "String">;
    readonly type: FieldRef<"Corporation", "String">;
    readonly id: FieldRef<"Corporation", "String">;
  }

  // Custom InputTypes
  /**
   * Corporation findUnique
   */
  export type CorporationFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * Filter, which Corporation to fetch.
     */
    where: CorporationWhereUniqueInput;
  };

  /**
   * Corporation findUniqueOrThrow
   */
  export type CorporationFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * Filter, which Corporation to fetch.
     */
    where: CorporationWhereUniqueInput;
  };

  /**
   * Corporation findFirst
   */
  export type CorporationFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * Filter, which Corporation to fetch.
     */
    where?: CorporationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Corporations to fetch.
     */
    orderBy?:
      | CorporationOrderByWithRelationInput
      | CorporationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Corporations.
     */
    cursor?: CorporationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Corporations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Corporations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Corporations.
     */
    distinct?: CorporationScalarFieldEnum | CorporationScalarFieldEnum[];
  };

  /**
   * Corporation findFirstOrThrow
   */
  export type CorporationFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * Filter, which Corporation to fetch.
     */
    where?: CorporationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Corporations to fetch.
     */
    orderBy?:
      | CorporationOrderByWithRelationInput
      | CorporationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Corporations.
     */
    cursor?: CorporationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Corporations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Corporations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Corporations.
     */
    distinct?: CorporationScalarFieldEnum | CorporationScalarFieldEnum[];
  };

  /**
   * Corporation findMany
   */
  export type CorporationFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * Filter, which Corporations to fetch.
     */
    where?: CorporationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Corporations to fetch.
     */
    orderBy?:
      | CorporationOrderByWithRelationInput
      | CorporationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Corporations.
     */
    cursor?: CorporationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Corporations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Corporations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Corporations.
     */
    distinct?: CorporationScalarFieldEnum | CorporationScalarFieldEnum[];
  };

  /**
   * Corporation create
   */
  export type CorporationCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * The data needed to create a Corporation.
     */
    data: XOR<CorporationCreateInput, CorporationUncheckedCreateInput>;
  };

  /**
   * Corporation createMany
   */
  export type CorporationCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Corporations.
     */
    data: CorporationCreateManyInput | CorporationCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * Corporation createManyAndReturn
   */
  export type CorporationCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * The data used to create many Corporations.
     */
    data: CorporationCreateManyInput | CorporationCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Corporation update
   */
  export type CorporationUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * The data needed to update a Corporation.
     */
    data: XOR<CorporationUpdateInput, CorporationUncheckedUpdateInput>;
    /**
     * Choose, which Corporation to update.
     */
    where: CorporationWhereUniqueInput;
  };

  /**
   * Corporation updateMany
   */
  export type CorporationUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Corporations.
     */
    data: XOR<
      CorporationUpdateManyMutationInput,
      CorporationUncheckedUpdateManyInput
    >;
    /**
     * Filter which Corporations to update
     */
    where?: CorporationWhereInput;
    /**
     * Limit how many Corporations to update.
     */
    limit?: number;
  };

  /**
   * Corporation updateManyAndReturn
   */
  export type CorporationUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * The data used to update Corporations.
     */
    data: XOR<
      CorporationUpdateManyMutationInput,
      CorporationUncheckedUpdateManyInput
    >;
    /**
     * Filter which Corporations to update
     */
    where?: CorporationWhereInput;
    /**
     * Limit how many Corporations to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Corporation upsert
   */
  export type CorporationUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * The filter to search for the Corporation to update in case it exists.
     */
    where: CorporationWhereUniqueInput;
    /**
     * In case the Corporation found by the `where` argument doesn't exist, create a new Corporation with this data.
     */
    create: XOR<CorporationCreateInput, CorporationUncheckedCreateInput>;
    /**
     * In case the Corporation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CorporationUpdateInput, CorporationUncheckedUpdateInput>;
  };

  /**
   * Corporation delete
   */
  export type CorporationDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    /**
     * Filter which Corporation to delete.
     */
    where: CorporationWhereUniqueInput;
  };

  /**
   * Corporation deleteMany
   */
  export type CorporationDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Corporations to delete
     */
    where?: CorporationWhereInput;
    /**
     * Limit how many Corporations to delete.
     */
    limit?: number;
  };

  /**
   * Corporation.memberOfCorp_to_Person_reverse
   */
  export type Corporation$memberOfCorp_to_Person_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Person
     */
    select?: PersonSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Person
     */
    omit?: PersonOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PersonInclude<ExtArgs> | null;
    where?: PersonWhereInput;
    orderBy?: PersonOrderByWithRelationInput | PersonOrderByWithRelationInput[];
    cursor?: PersonWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: PersonScalarFieldEnum | PersonScalarFieldEnum[];
  };

  /**
   * Corporation.parent
   */
  export type Corporation$parentArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    where?: CorporationWhereInput;
  };

  /**
   * Corporation.location
   */
  export type Corporation$locationArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    where?: LocationWhereInput;
  };

  /**
   * Corporation.parent_to_Corporation_reverse
   */
  export type Corporation$parent_to_Corporation_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    where?: CorporationWhereInput;
    orderBy?:
      | CorporationOrderByWithRelationInput
      | CorporationOrderByWithRelationInput[];
    cursor?: CorporationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: CorporationScalarFieldEnum | CorporationScalarFieldEnum[];
  };

  /**
   * Corporation without action
   */
  export type CorporationDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
  };

  /**
   * Model Location
   */

  export type AggregateLocation = {
    _count: LocationCountAggregateOutputType | null;
    _min: LocationMinAggregateOutputType | null;
    _max: LocationMaxAggregateOutputType | null;
  };

  export type LocationMinAggregateOutputType = {
    title: string | null;
    titleVariants: string | null;
    description: string | null;
    image: string | null;
    parent_id: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type LocationMaxAggregateOutputType = {
    title: string | null;
    titleVariants: string | null;
    description: string | null;
    image: string | null;
    parent_id: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type LocationCountAggregateOutputType = {
    title: number;
    titleVariants: number;
    description: number;
    image: number;
    parent_id: number;
    idAuthority_authority: number;
    idAuthority_id: number;
    type: number;
    id: number;
    _all: number;
  };

  export type LocationMinAggregateInputType = {
    title?: true;
    titleVariants?: true;
    description?: true;
    image?: true;
    parent_id?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type LocationMaxAggregateInputType = {
    title?: true;
    titleVariants?: true;
    description?: true;
    image?: true;
    parent_id?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type LocationCountAggregateInputType = {
    title?: true;
    titleVariants?: true;
    description?: true;
    image?: true;
    parent_id?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
    _all?: true;
  };

  export type LocationAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Location to aggregate.
     */
    where?: LocationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Locations to fetch.
     */
    orderBy?:
      | LocationOrderByWithRelationInput
      | LocationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: LocationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Locations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Locations
     **/
    _count?: true | LocationCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: LocationMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: LocationMaxAggregateInputType;
  };

  export type GetLocationAggregateType<T extends LocationAggregateArgs> = {
    [P in keyof T & keyof AggregateLocation]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocation[P]>
      : GetScalarType<T[P], AggregateLocation[P]>;
  };

  export type LocationGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: LocationWhereInput;
    orderBy?:
      | LocationOrderByWithAggregationInput
      | LocationOrderByWithAggregationInput[];
    by: LocationScalarFieldEnum[] | LocationScalarFieldEnum;
    having?: LocationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: LocationCountAggregateInputType | true;
    _min?: LocationMinAggregateInputType;
    _max?: LocationMaxAggregateInputType;
  };

  export type LocationGroupByOutputType = {
    title: string | null;
    titleVariants: string | null;
    description: string | null;
    image: string | null;
    parent_id: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string;
    _count: LocationCountAggregateOutputType | null;
    _min: LocationMinAggregateOutputType | null;
    _max: LocationMaxAggregateOutputType | null;
  };

  type GetLocationGroupByPayload<T extends LocationGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<LocationGroupByOutputType, T["by"]> & {
          [P in keyof T & keyof LocationGroupByOutputType]: P extends "_count"
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocationGroupByOutputType[P]>
            : GetScalarType<T[P], LocationGroupByOutputType[P]>;
        }
      >
    >;

  export type LocationSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      titleVariants?: boolean;
      description?: boolean;
      image?: boolean;
      parent_id?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      parent?: boolean | Location$parentArgs<ExtArgs>;
      parent_to_Location_reverse?:
        | boolean
        | Location$parent_to_Location_reverseArgs<ExtArgs>;
      location_to_Place_reverse?:
        | boolean
        | Location$location_to_Place_reverseArgs<ExtArgs>;
      location_to_Corporation_reverse?:
        | boolean
        | Location$location_to_Corporation_reverseArgs<ExtArgs>;
      _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs["result"]["location"]
  >;

  export type LocationSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      titleVariants?: boolean;
      description?: boolean;
      image?: boolean;
      parent_id?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      parent?: boolean | Location$parentArgs<ExtArgs>;
    },
    ExtArgs["result"]["location"]
  >;

  export type LocationSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      titleVariants?: boolean;
      description?: boolean;
      image?: boolean;
      parent_id?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
      parent?: boolean | Location$parentArgs<ExtArgs>;
    },
    ExtArgs["result"]["location"]
  >;

  export type LocationSelectScalar = {
    title?: boolean;
    titleVariants?: boolean;
    description?: boolean;
    image?: boolean;
    parent_id?: boolean;
    idAuthority_authority?: boolean;
    idAuthority_id?: boolean;
    type?: boolean;
    id?: boolean;
  };

  export type LocationOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | "title"
    | "titleVariants"
    | "description"
    | "image"
    | "parent_id"
    | "idAuthority_authority"
    | "idAuthority_id"
    | "type"
    | "id",
    ExtArgs["result"]["location"]
  >;
  export type LocationInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent?: boolean | Location$parentArgs<ExtArgs>;
    parent_to_Location_reverse?:
      | boolean
      | Location$parent_to_Location_reverseArgs<ExtArgs>;
    location_to_Place_reverse?:
      | boolean
      | Location$location_to_Place_reverseArgs<ExtArgs>;
    location_to_Corporation_reverse?:
      | boolean
      | Location$location_to_Corporation_reverseArgs<ExtArgs>;
    _count?: boolean | LocationCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type LocationIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent?: boolean | Location$parentArgs<ExtArgs>;
  };
  export type LocationIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    parent?: boolean | Location$parentArgs<ExtArgs>;
  };

  export type $LocationPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: "Location";
    objects: {
      parent: Prisma.$LocationPayload<ExtArgs> | null;
      parent_to_Location_reverse: Prisma.$LocationPayload<ExtArgs>[];
      location_to_Place_reverse: Prisma.$PlacePayload<ExtArgs>[];
      location_to_Corporation_reverse: Prisma.$CorporationPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        title: string | null;
        titleVariants: string | null;
        description: string | null;
        image: string | null;
        parent_id: string | null;
        idAuthority_authority: string | null;
        idAuthority_id: string | null;
        type: string | null;
        id: string;
      },
      ExtArgs["result"]["location"]
    >;
    composites: {};
  };

  type LocationGetPayload<
    S extends boolean | null | undefined | LocationDefaultArgs,
  > = $Result.GetResult<Prisma.$LocationPayload, S>;

  type LocationCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<LocationFindManyArgs, "select" | "include" | "distinct" | "omit"> & {
    select?: LocationCountAggregateInputType | true;
  };

  export interface LocationDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["Location"];
      meta: { name: "Location" };
    };
    /**
     * Find zero or one Location that matches the filter.
     * @param {LocationFindUniqueArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocationFindUniqueArgs>(
      args: SelectSubset<T, LocationFindUniqueArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "findUnique",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Location that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LocationFindUniqueOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocationFindUniqueOrThrowArgs>(
      args: SelectSubset<T, LocationFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Location that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocationFindFirstArgs>(
      args?: SelectSubset<T, LocationFindFirstArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "findFirst",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Location that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindFirstOrThrowArgs} args - Arguments to find a Location
     * @example
     * // Get one Location
     * const location = await prisma.location.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocationFindFirstOrThrowArgs>(
      args?: SelectSubset<T, LocationFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "findFirstOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Locations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locations
     * const locations = await prisma.location.findMany()
     *
     * // Get first 10 Locations
     * const locations = await prisma.location.findMany({ take: 10 })
     *
     * // Only select the `title`
     * const locationWithTitleOnly = await prisma.location.findMany({ select: { title: true } })
     *
     */
    findMany<T extends LocationFindManyArgs>(
      args?: SelectSubset<T, LocationFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "findMany",
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Location.
     * @param {LocationCreateArgs} args - Arguments to create a Location.
     * @example
     * // Create one Location
     * const Location = await prisma.location.create({
     *   data: {
     *     // ... data to create a Location
     *   }
     * })
     *
     */
    create<T extends LocationCreateArgs>(
      args: SelectSubset<T, LocationCreateArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "create",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Locations.
     * @param {LocationCreateManyArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends LocationCreateManyArgs>(
      args?: SelectSubset<T, LocationCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Locations and returns the data saved in the database.
     * @param {LocationCreateManyAndReturnArgs} args - Arguments to create many Locations.
     * @example
     * // Create many Locations
     * const location = await prisma.location.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Locations and only return the `title`
     * const locationWithTitleOnly = await prisma.location.createManyAndReturn({
     *   select: { title: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends LocationCreateManyAndReturnArgs>(
      args?: SelectSubset<T, LocationCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "createManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Location.
     * @param {LocationDeleteArgs} args - Arguments to delete one Location.
     * @example
     * // Delete one Location
     * const Location = await prisma.location.delete({
     *   where: {
     *     // ... filter to delete one Location
     *   }
     * })
     *
     */
    delete<T extends LocationDeleteArgs>(
      args: SelectSubset<T, LocationDeleteArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "delete",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Location.
     * @param {LocationUpdateArgs} args - Arguments to update one Location.
     * @example
     * // Update one Location
     * const location = await prisma.location.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends LocationUpdateArgs>(
      args: SelectSubset<T, LocationUpdateArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "update",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Locations.
     * @param {LocationDeleteManyArgs} args - Arguments to filter Locations to delete.
     * @example
     * // Delete a few Locations
     * const { count } = await prisma.location.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends LocationDeleteManyArgs>(
      args?: SelectSubset<T, LocationDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends LocationUpdateManyArgs>(
      args: SelectSubset<T, LocationUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Locations and returns the data updated in the database.
     * @param {LocationUpdateManyAndReturnArgs} args - Arguments to update many Locations.
     * @example
     * // Update many Locations
     * const location = await prisma.location.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Locations and only return the `title`
     * const locationWithTitleOnly = await prisma.location.updateManyAndReturn({
     *   select: { title: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends LocationUpdateManyAndReturnArgs>(
      args: SelectSubset<T, LocationUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "updateManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Location.
     * @param {LocationUpsertArgs} args - Arguments to update or create a Location.
     * @example
     * // Update or create a Location
     * const location = await prisma.location.upsert({
     *   create: {
     *     // ... data to create a Location
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Location we want to update
     *   }
     * })
     */
    upsert<T extends LocationUpsertArgs>(
      args: SelectSubset<T, LocationUpsertArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "upsert",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Locations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationCountArgs} args - Arguments to filter Locations to count.
     * @example
     * // Count the number of Locations
     * const count = await prisma.location.count({
     *   where: {
     *     // ... the filter for the Locations we want to count
     *   }
     * })
     **/
    count<T extends LocationCountArgs>(
      args?: Subset<T, LocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], LocationCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends LocationAggregateArgs>(
      args: Subset<T, LocationAggregateArgs>,
    ): Prisma.PrismaPromise<GetLocationAggregateType<T>>;

    /**
     * Group by Location.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends LocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<"skip", Keys<T>>,
        Extends<"take", Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocationGroupByArgs["orderBy"] }
        : { orderBy?: LocationGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T["orderBy"]>>
      >,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      "Field ",
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, LocationGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetLocationGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Location model
     */
    readonly fields: LocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Location.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocationClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    parent<T extends Location$parentArgs<ExtArgs> = {}>(
      args?: Subset<T, Location$parentArgs<ExtArgs>>,
    ): Prisma__LocationClient<
      $Result.GetResult<
        Prisma.$LocationPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    parent_to_Location_reverse<
      T extends Location$parent_to_Location_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Location$parent_to_Location_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$LocationPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    location_to_Place_reverse<
      T extends Location$location_to_Place_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Location$location_to_Place_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$PlacePayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    location_to_Corporation_reverse<
      T extends Location$location_to_Corporation_reverseArgs<ExtArgs> = {},
    >(
      args?: Subset<T, Location$location_to_Corporation_reverseArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$CorporationPayload<ExtArgs>,
          T,
          "findMany",
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Location model
   */
  interface LocationFieldRefs {
    readonly title: FieldRef<"Location", "String">;
    readonly titleVariants: FieldRef<"Location", "String">;
    readonly description: FieldRef<"Location", "String">;
    readonly image: FieldRef<"Location", "String">;
    readonly parent_id: FieldRef<"Location", "String">;
    readonly idAuthority_authority: FieldRef<"Location", "String">;
    readonly idAuthority_id: FieldRef<"Location", "String">;
    readonly type: FieldRef<"Location", "String">;
    readonly id: FieldRef<"Location", "String">;
  }

  // Custom InputTypes
  /**
   * Location findUnique
   */
  export type LocationFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput;
  };

  /**
   * Location findUniqueOrThrow
   */
  export type LocationFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * Filter, which Location to fetch.
     */
    where: LocationWhereUniqueInput;
  };

  /**
   * Location findFirst
   */
  export type LocationFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Locations to fetch.
     */
    orderBy?:
      | LocationOrderByWithRelationInput
      | LocationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Locations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[];
  };

  /**
   * Location findFirstOrThrow
   */
  export type LocationFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * Filter, which Location to fetch.
     */
    where?: LocationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Locations to fetch.
     */
    orderBy?:
      | LocationOrderByWithRelationInput
      | LocationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Locations.
     */
    cursor?: LocationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Locations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[];
  };

  /**
   * Location findMany
   */
  export type LocationFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * Filter, which Locations to fetch.
     */
    where?: LocationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Locations to fetch.
     */
    orderBy?:
      | LocationOrderByWithRelationInput
      | LocationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Locations.
     */
    cursor?: LocationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Locations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Locations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Locations.
     */
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[];
  };

  /**
   * Location create
   */
  export type LocationCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * The data needed to create a Location.
     */
    data: XOR<LocationCreateInput, LocationUncheckedCreateInput>;
  };

  /**
   * Location createMany
   */
  export type LocationCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * Location createManyAndReturn
   */
  export type LocationCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * The data used to create many Locations.
     */
    data: LocationCreateManyInput | LocationCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Location update
   */
  export type LocationUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * The data needed to update a Location.
     */
    data: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>;
    /**
     * Choose, which Location to update.
     */
    where: LocationWhereUniqueInput;
  };

  /**
   * Location updateMany
   */
  export type LocationUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Locations.
     */
    data: XOR<
      LocationUpdateManyMutationInput,
      LocationUncheckedUpdateManyInput
    >;
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput;
    /**
     * Limit how many Locations to update.
     */
    limit?: number;
  };

  /**
   * Location updateManyAndReturn
   */
  export type LocationUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * The data used to update Locations.
     */
    data: XOR<
      LocationUpdateManyMutationInput,
      LocationUncheckedUpdateManyInput
    >;
    /**
     * Filter which Locations to update
     */
    where?: LocationWhereInput;
    /**
     * Limit how many Locations to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Location upsert
   */
  export type LocationUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * The filter to search for the Location to update in case it exists.
     */
    where: LocationWhereUniqueInput;
    /**
     * In case the Location found by the `where` argument doesn't exist, create a new Location with this data.
     */
    create: XOR<LocationCreateInput, LocationUncheckedCreateInput>;
    /**
     * In case the Location was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocationUpdateInput, LocationUncheckedUpdateInput>;
  };

  /**
   * Location delete
   */
  export type LocationDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    /**
     * Filter which Location to delete.
     */
    where: LocationWhereUniqueInput;
  };

  /**
   * Location deleteMany
   */
  export type LocationDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Locations to delete
     */
    where?: LocationWhereInput;
    /**
     * Limit how many Locations to delete.
     */
    limit?: number;
  };

  /**
   * Location.parent
   */
  export type Location$parentArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    where?: LocationWhereInput;
  };

  /**
   * Location.parent_to_Location_reverse
   */
  export type Location$parent_to_Location_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
    where?: LocationWhereInput;
    orderBy?:
      | LocationOrderByWithRelationInput
      | LocationOrderByWithRelationInput[];
    cursor?: LocationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: LocationScalarFieldEnum | LocationScalarFieldEnum[];
  };

  /**
   * Location.location_to_Place_reverse
   */
  export type Location$location_to_Place_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Place
     */
    select?: PlaceSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Place
     */
    omit?: PlaceOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaceInclude<ExtArgs> | null;
    where?: PlaceWhereInput;
    orderBy?: PlaceOrderByWithRelationInput | PlaceOrderByWithRelationInput[];
    cursor?: PlaceWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: PlaceScalarFieldEnum | PlaceScalarFieldEnum[];
  };

  /**
   * Location.location_to_Corporation_reverse
   */
  export type Location$location_to_Corporation_reverseArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Corporation
     */
    select?: CorporationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Corporation
     */
    omit?: CorporationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CorporationInclude<ExtArgs> | null;
    where?: CorporationWhereInput;
    orderBy?:
      | CorporationOrderByWithRelationInput
      | CorporationOrderByWithRelationInput[];
    cursor?: CorporationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: CorporationScalarFieldEnum | CorporationScalarFieldEnum[];
  };

  /**
   * Location without action
   */
  export type LocationDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Location
     */
    select?: LocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Location
     */
    omit?: LocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LocationInclude<ExtArgs> | null;
  };

  /**
   * Model Exhibition
   */

  export type AggregateExhibition = {
    _count: ExhibitionCountAggregateOutputType | null;
    _min: ExhibitionMinAggregateOutputType | null;
    _max: ExhibitionMaxAggregateOutputType | null;
  };

  export type ExhibitionMinAggregateOutputType = {
    title: string | null;
    description: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type ExhibitionMaxAggregateOutputType = {
    title: string | null;
    description: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string | null;
  };

  export type ExhibitionCountAggregateOutputType = {
    title: number;
    description: number;
    idAuthority_authority: number;
    idAuthority_id: number;
    type: number;
    id: number;
    _all: number;
  };

  export type ExhibitionMinAggregateInputType = {
    title?: true;
    description?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type ExhibitionMaxAggregateInputType = {
    title?: true;
    description?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
  };

  export type ExhibitionCountAggregateInputType = {
    title?: true;
    description?: true;
    idAuthority_authority?: true;
    idAuthority_id?: true;
    type?: true;
    id?: true;
    _all?: true;
  };

  export type ExhibitionAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Exhibition to aggregate.
     */
    where?: ExhibitionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Exhibitions to fetch.
     */
    orderBy?:
      | ExhibitionOrderByWithRelationInput
      | ExhibitionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ExhibitionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Exhibitions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Exhibitions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Exhibitions
     **/
    _count?: true | ExhibitionCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: ExhibitionMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: ExhibitionMaxAggregateInputType;
  };

  export type GetExhibitionAggregateType<T extends ExhibitionAggregateArgs> = {
    [P in keyof T & keyof AggregateExhibition]: P extends "_count" | "count"
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateExhibition[P]>
      : GetScalarType<T[P], AggregateExhibition[P]>;
  };

  export type ExhibitionGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: ExhibitionWhereInput;
    orderBy?:
      | ExhibitionOrderByWithAggregationInput
      | ExhibitionOrderByWithAggregationInput[];
    by: ExhibitionScalarFieldEnum[] | ExhibitionScalarFieldEnum;
    having?: ExhibitionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ExhibitionCountAggregateInputType | true;
    _min?: ExhibitionMinAggregateInputType;
    _max?: ExhibitionMaxAggregateInputType;
  };

  export type ExhibitionGroupByOutputType = {
    title: string | null;
    description: string | null;
    idAuthority_authority: string | null;
    idAuthority_id: string | null;
    type: string | null;
    id: string;
    _count: ExhibitionCountAggregateOutputType | null;
    _min: ExhibitionMinAggregateOutputType | null;
    _max: ExhibitionMaxAggregateOutputType | null;
  };

  type GetExhibitionGroupByPayload<T extends ExhibitionGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<ExhibitionGroupByOutputType, T["by"]> & {
          [P in keyof T & keyof ExhibitionGroupByOutputType]: P extends "_count"
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ExhibitionGroupByOutputType[P]>
            : GetScalarType<T[P], ExhibitionGroupByOutputType[P]>;
        }
      >
    >;

  export type ExhibitionSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
    },
    ExtArgs["result"]["exhibition"]
  >;

  export type ExhibitionSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
    },
    ExtArgs["result"]["exhibition"]
  >;

  export type ExhibitionSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      title?: boolean;
      description?: boolean;
      idAuthority_authority?: boolean;
      idAuthority_id?: boolean;
      type?: boolean;
      id?: boolean;
    },
    ExtArgs["result"]["exhibition"]
  >;

  export type ExhibitionSelectScalar = {
    title?: boolean;
    description?: boolean;
    idAuthority_authority?: boolean;
    idAuthority_id?: boolean;
    type?: boolean;
    id?: boolean;
  };

  export type ExhibitionOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | "title"
    | "description"
    | "idAuthority_authority"
    | "idAuthority_id"
    | "type"
    | "id",
    ExtArgs["result"]["exhibition"]
  >;

  export type $ExhibitionPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: "Exhibition";
    objects: {};
    scalars: $Extensions.GetPayloadResult<
      {
        title: string | null;
        description: string | null;
        idAuthority_authority: string | null;
        idAuthority_id: string | null;
        type: string | null;
        id: string;
      },
      ExtArgs["result"]["exhibition"]
    >;
    composites: {};
  };

  type ExhibitionGetPayload<
    S extends boolean | null | undefined | ExhibitionDefaultArgs,
  > = $Result.GetResult<Prisma.$ExhibitionPayload, S>;

  type ExhibitionCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    ExhibitionFindManyArgs,
    "select" | "include" | "distinct" | "omit"
  > & {
    select?: ExhibitionCountAggregateInputType | true;
  };

  export interface ExhibitionDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>["model"]["Exhibition"];
      meta: { name: "Exhibition" };
    };
    /**
     * Find zero or one Exhibition that matches the filter.
     * @param {ExhibitionFindUniqueArgs} args - Arguments to find a Exhibition
     * @example
     * // Get one Exhibition
     * const exhibition = await prisma.exhibition.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ExhibitionFindUniqueArgs>(
      args: SelectSubset<T, ExhibitionFindUniqueArgs<ExtArgs>>,
    ): Prisma__ExhibitionClient<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "findUnique",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Exhibition that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ExhibitionFindUniqueOrThrowArgs} args - Arguments to find a Exhibition
     * @example
     * // Get one Exhibition
     * const exhibition = await prisma.exhibition.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ExhibitionFindUniqueOrThrowArgs>(
      args: SelectSubset<T, ExhibitionFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__ExhibitionClient<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "findUniqueOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Exhibition that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExhibitionFindFirstArgs} args - Arguments to find a Exhibition
     * @example
     * // Get one Exhibition
     * const exhibition = await prisma.exhibition.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ExhibitionFindFirstArgs>(
      args?: SelectSubset<T, ExhibitionFindFirstArgs<ExtArgs>>,
    ): Prisma__ExhibitionClient<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "findFirst",
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Exhibition that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExhibitionFindFirstOrThrowArgs} args - Arguments to find a Exhibition
     * @example
     * // Get one Exhibition
     * const exhibition = await prisma.exhibition.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ExhibitionFindFirstOrThrowArgs>(
      args?: SelectSubset<T, ExhibitionFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__ExhibitionClient<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "findFirstOrThrow",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Exhibitions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExhibitionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Exhibitions
     * const exhibitions = await prisma.exhibition.findMany()
     *
     * // Get first 10 Exhibitions
     * const exhibitions = await prisma.exhibition.findMany({ take: 10 })
     *
     * // Only select the `title`
     * const exhibitionWithTitleOnly = await prisma.exhibition.findMany({ select: { title: true } })
     *
     */
    findMany<T extends ExhibitionFindManyArgs>(
      args?: SelectSubset<T, ExhibitionFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "findMany",
        GlobalOmitOptions
      >
    >;

    /**
     * Create a Exhibition.
     * @param {ExhibitionCreateArgs} args - Arguments to create a Exhibition.
     * @example
     * // Create one Exhibition
     * const Exhibition = await prisma.exhibition.create({
     *   data: {
     *     // ... data to create a Exhibition
     *   }
     * })
     *
     */
    create<T extends ExhibitionCreateArgs>(
      args: SelectSubset<T, ExhibitionCreateArgs<ExtArgs>>,
    ): Prisma__ExhibitionClient<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "create",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Exhibitions.
     * @param {ExhibitionCreateManyArgs} args - Arguments to create many Exhibitions.
     * @example
     * // Create many Exhibitions
     * const exhibition = await prisma.exhibition.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ExhibitionCreateManyArgs>(
      args?: SelectSubset<T, ExhibitionCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Exhibitions and returns the data saved in the database.
     * @param {ExhibitionCreateManyAndReturnArgs} args - Arguments to create many Exhibitions.
     * @example
     * // Create many Exhibitions
     * const exhibition = await prisma.exhibition.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Exhibitions and only return the `title`
     * const exhibitionWithTitleOnly = await prisma.exhibition.createManyAndReturn({
     *   select: { title: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ExhibitionCreateManyAndReturnArgs>(
      args?: SelectSubset<T, ExhibitionCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "createManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Delete a Exhibition.
     * @param {ExhibitionDeleteArgs} args - Arguments to delete one Exhibition.
     * @example
     * // Delete one Exhibition
     * const Exhibition = await prisma.exhibition.delete({
     *   where: {
     *     // ... filter to delete one Exhibition
     *   }
     * })
     *
     */
    delete<T extends ExhibitionDeleteArgs>(
      args: SelectSubset<T, ExhibitionDeleteArgs<ExtArgs>>,
    ): Prisma__ExhibitionClient<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "delete",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Exhibition.
     * @param {ExhibitionUpdateArgs} args - Arguments to update one Exhibition.
     * @example
     * // Update one Exhibition
     * const exhibition = await prisma.exhibition.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ExhibitionUpdateArgs>(
      args: SelectSubset<T, ExhibitionUpdateArgs<ExtArgs>>,
    ): Prisma__ExhibitionClient<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "update",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Exhibitions.
     * @param {ExhibitionDeleteManyArgs} args - Arguments to filter Exhibitions to delete.
     * @example
     * // Delete a few Exhibitions
     * const { count } = await prisma.exhibition.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ExhibitionDeleteManyArgs>(
      args?: SelectSubset<T, ExhibitionDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Exhibitions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExhibitionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Exhibitions
     * const exhibition = await prisma.exhibition.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ExhibitionUpdateManyArgs>(
      args: SelectSubset<T, ExhibitionUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Exhibitions and returns the data updated in the database.
     * @param {ExhibitionUpdateManyAndReturnArgs} args - Arguments to update many Exhibitions.
     * @example
     * // Update many Exhibitions
     * const exhibition = await prisma.exhibition.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Exhibitions and only return the `title`
     * const exhibitionWithTitleOnly = await prisma.exhibition.updateManyAndReturn({
     *   select: { title: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ExhibitionUpdateManyAndReturnArgs>(
      args: SelectSubset<T, ExhibitionUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "updateManyAndReturn",
        GlobalOmitOptions
      >
    >;

    /**
     * Create or update one Exhibition.
     * @param {ExhibitionUpsertArgs} args - Arguments to update or create a Exhibition.
     * @example
     * // Update or create a Exhibition
     * const exhibition = await prisma.exhibition.upsert({
     *   create: {
     *     // ... data to create a Exhibition
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Exhibition we want to update
     *   }
     * })
     */
    upsert<T extends ExhibitionUpsertArgs>(
      args: SelectSubset<T, ExhibitionUpsertArgs<ExtArgs>>,
    ): Prisma__ExhibitionClient<
      $Result.GetResult<
        Prisma.$ExhibitionPayload<ExtArgs>,
        T,
        "upsert",
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Exhibitions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExhibitionCountArgs} args - Arguments to filter Exhibitions to count.
     * @example
     * // Count the number of Exhibitions
     * const count = await prisma.exhibition.count({
     *   where: {
     *     // ... the filter for the Exhibitions we want to count
     *   }
     * })
     **/
    count<T extends ExhibitionCountArgs>(
      args?: Subset<T, ExhibitionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<"select", any>
        ? T["select"] extends true
          ? number
          : GetScalarType<T["select"], ExhibitionCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Exhibition.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExhibitionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends ExhibitionAggregateArgs>(
      args: Subset<T, ExhibitionAggregateArgs>,
    ): Prisma.PrismaPromise<GetExhibitionAggregateType<T>>;

    /**
     * Group by Exhibition.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ExhibitionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends ExhibitionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<"skip", Keys<T>>,
        Extends<"take", Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ExhibitionGroupByArgs["orderBy"] }
        : { orderBy?: ExhibitionGroupByArgs["orderBy"] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T["orderBy"]>>
      >,
      ByFields extends MaybeTupleToUnion<T["by"]>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T["having"]>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T["by"] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      "Field ",
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : "take" extends Keys<T>
            ? "orderBy" extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : "skip" extends Keys<T>
              ? "orderBy" extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, ExhibitionGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetExhibitionGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Exhibition model
     */
    readonly fields: ExhibitionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Exhibition.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ExhibitionClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?:
        | ((value: T) => TResult1 | PromiseLike<TResult1>)
        | undefined
        | null,
      onrejected?:
        | ((reason: any) => TResult2 | PromiseLike<TResult2>)
        | undefined
        | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?:
        | ((reason: any) => TResult | PromiseLike<TResult>)
        | undefined
        | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Exhibition model
   */
  interface ExhibitionFieldRefs {
    readonly title: FieldRef<"Exhibition", "String">;
    readonly description: FieldRef<"Exhibition", "String">;
    readonly idAuthority_authority: FieldRef<"Exhibition", "String">;
    readonly idAuthority_id: FieldRef<"Exhibition", "String">;
    readonly type: FieldRef<"Exhibition", "String">;
    readonly id: FieldRef<"Exhibition", "String">;
  }

  // Custom InputTypes
  /**
   * Exhibition findUnique
   */
  export type ExhibitionFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * Filter, which Exhibition to fetch.
     */
    where: ExhibitionWhereUniqueInput;
  };

  /**
   * Exhibition findUniqueOrThrow
   */
  export type ExhibitionFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * Filter, which Exhibition to fetch.
     */
    where: ExhibitionWhereUniqueInput;
  };

  /**
   * Exhibition findFirst
   */
  export type ExhibitionFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * Filter, which Exhibition to fetch.
     */
    where?: ExhibitionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Exhibitions to fetch.
     */
    orderBy?:
      | ExhibitionOrderByWithRelationInput
      | ExhibitionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Exhibitions.
     */
    cursor?: ExhibitionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Exhibitions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Exhibitions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Exhibitions.
     */
    distinct?: ExhibitionScalarFieldEnum | ExhibitionScalarFieldEnum[];
  };

  /**
   * Exhibition findFirstOrThrow
   */
  export type ExhibitionFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * Filter, which Exhibition to fetch.
     */
    where?: ExhibitionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Exhibitions to fetch.
     */
    orderBy?:
      | ExhibitionOrderByWithRelationInput
      | ExhibitionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Exhibitions.
     */
    cursor?: ExhibitionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Exhibitions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Exhibitions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Exhibitions.
     */
    distinct?: ExhibitionScalarFieldEnum | ExhibitionScalarFieldEnum[];
  };

  /**
   * Exhibition findMany
   */
  export type ExhibitionFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * Filter, which Exhibitions to fetch.
     */
    where?: ExhibitionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Exhibitions to fetch.
     */
    orderBy?:
      | ExhibitionOrderByWithRelationInput
      | ExhibitionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Exhibitions.
     */
    cursor?: ExhibitionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Exhibitions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Exhibitions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Exhibitions.
     */
    distinct?: ExhibitionScalarFieldEnum | ExhibitionScalarFieldEnum[];
  };

  /**
   * Exhibition create
   */
  export type ExhibitionCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * The data needed to create a Exhibition.
     */
    data: XOR<ExhibitionCreateInput, ExhibitionUncheckedCreateInput>;
  };

  /**
   * Exhibition createMany
   */
  export type ExhibitionCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many Exhibitions.
     */
    data: ExhibitionCreateManyInput | ExhibitionCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * Exhibition createManyAndReturn
   */
  export type ExhibitionCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * The data used to create many Exhibitions.
     */
    data: ExhibitionCreateManyInput | ExhibitionCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * Exhibition update
   */
  export type ExhibitionUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * The data needed to update a Exhibition.
     */
    data: XOR<ExhibitionUpdateInput, ExhibitionUncheckedUpdateInput>;
    /**
     * Choose, which Exhibition to update.
     */
    where: ExhibitionWhereUniqueInput;
  };

  /**
   * Exhibition updateMany
   */
  export type ExhibitionUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update Exhibitions.
     */
    data: XOR<
      ExhibitionUpdateManyMutationInput,
      ExhibitionUncheckedUpdateManyInput
    >;
    /**
     * Filter which Exhibitions to update
     */
    where?: ExhibitionWhereInput;
    /**
     * Limit how many Exhibitions to update.
     */
    limit?: number;
  };

  /**
   * Exhibition updateManyAndReturn
   */
  export type ExhibitionUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * The data used to update Exhibitions.
     */
    data: XOR<
      ExhibitionUpdateManyMutationInput,
      ExhibitionUncheckedUpdateManyInput
    >;
    /**
     * Filter which Exhibitions to update
     */
    where?: ExhibitionWhereInput;
    /**
     * Limit how many Exhibitions to update.
     */
    limit?: number;
  };

  /**
   * Exhibition upsert
   */
  export type ExhibitionUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * The filter to search for the Exhibition to update in case it exists.
     */
    where: ExhibitionWhereUniqueInput;
    /**
     * In case the Exhibition found by the `where` argument doesn't exist, create a new Exhibition with this data.
     */
    create: XOR<ExhibitionCreateInput, ExhibitionUncheckedCreateInput>;
    /**
     * In case the Exhibition was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ExhibitionUpdateInput, ExhibitionUncheckedUpdateInput>;
  };

  /**
   * Exhibition delete
   */
  export type ExhibitionDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
    /**
     * Filter which Exhibition to delete.
     */
    where: ExhibitionWhereUniqueInput;
  };

  /**
   * Exhibition deleteMany
   */
  export type ExhibitionDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which Exhibitions to delete
     */
    where?: ExhibitionWhereInput;
    /**
     * Limit how many Exhibitions to delete.
     */
    limit?: number;
  };

  /**
   * Exhibition without action
   */
  export type ExhibitionDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the Exhibition
     */
    select?: ExhibitionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Exhibition
     */
    omit?: ExhibitionOmit<ExtArgs> | null;
  };

  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: "ReadUncommitted";
    ReadCommitted: "ReadCommitted";
    RepeatableRead: "RepeatableRead";
    Serializable: "Serializable";
  };

  export type TransactionIsolationLevel =
    (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];

  export const OccupationScalarFieldEnum: {
    title: "title";
    description: "description";
    parent_id: "parent_id";
    idAuthority_authority: "idAuthority_authority";
    idAuthority_id: "idAuthority_id";
    type: "type";
    id: "id";
  };

  export type OccupationScalarFieldEnum =
    (typeof OccupationScalarFieldEnum)[keyof typeof OccupationScalarFieldEnum];

  export const PersonScalarFieldEnum: {
    name: "name";
    description: "description";
    birthDate: "birthDate";
    deathDate: "deathDate";
    gender: "gender";
    personDeceased: "personDeceased";
    externalId: "externalId";
    birthPlace_id: "birthPlace_id";
    image: "image";
    nameVariant: "nameVariant";
    idAuthority_authority: "idAuthority_authority";
    idAuthority_id: "idAuthority_id";
    type: "type";
    id: "id";
  };

  export type PersonScalarFieldEnum =
    (typeof PersonScalarFieldEnum)[keyof typeof PersonScalarFieldEnum];

  export const PlaceScalarFieldEnum: {
    title: "title";
    description: "description";
    titleVariants: "titleVariants";
    location_id: "location_id";
    parent_id: "parent_id";
    image: "image";
    idAuthority_authority: "idAuthority_authority";
    idAuthority_id: "idAuthority_id";
    type: "type";
    id: "id";
  };

  export type PlaceScalarFieldEnum =
    (typeof PlaceScalarFieldEnum)[keyof typeof PlaceScalarFieldEnum];

  export const CorporationScalarFieldEnum: {
    name: "name";
    description: "description";
    parent_id: "parent_id";
    location_id: "location_id";
    image: "image";
    nameVariant: "nameVariant";
    idAuthority_authority: "idAuthority_authority";
    idAuthority_id: "idAuthority_id";
    type: "type";
    id: "id";
  };

  export type CorporationScalarFieldEnum =
    (typeof CorporationScalarFieldEnum)[keyof typeof CorporationScalarFieldEnum];

  export const LocationScalarFieldEnum: {
    title: "title";
    titleVariants: "titleVariants";
    description: "description";
    image: "image";
    parent_id: "parent_id";
    idAuthority_authority: "idAuthority_authority";
    idAuthority_id: "idAuthority_id";
    type: "type";
    id: "id";
  };

  export type LocationScalarFieldEnum =
    (typeof LocationScalarFieldEnum)[keyof typeof LocationScalarFieldEnum];

  export const ExhibitionScalarFieldEnum: {
    title: "title";
    description: "description";
    idAuthority_authority: "idAuthority_authority";
    idAuthority_id: "idAuthority_id";
    type: "type";
    id: "id";
  };

  export type ExhibitionScalarFieldEnum =
    (typeof ExhibitionScalarFieldEnum)[keyof typeof ExhibitionScalarFieldEnum];

  export const SortOrder: {
    asc: "asc";
    desc: "desc";
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

  export const QueryMode: {
    default: "default";
    insensitive: "insensitive";
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];

  export const NullsOrder: {
    first: "first";
    last: "last";
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];

  /**
   * Field references
   */

  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    "String"
  >;

  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    "String[]"
  >;

  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    "Int"
  >;

  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    "Int[]"
  >;

  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    "Boolean"
  >;

  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    "Float"
  >;

  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    "Float[]"
  >;

  /**
   * Deep Input Types
   */

  export type OccupationWhereInput = {
    AND?: OccupationWhereInput | OccupationWhereInput[];
    OR?: OccupationWhereInput[];
    NOT?: OccupationWhereInput | OccupationWhereInput[];
    title?: StringNullableFilter<"Occupation"> | string | null;
    description?: StringNullableFilter<"Occupation"> | string | null;
    parent_id?: StringNullableFilter<"Occupation"> | string | null;
    idAuthority_authority?: StringNullableFilter<"Occupation"> | string | null;
    idAuthority_id?: StringNullableFilter<"Occupation"> | string | null;
    type?: StringNullableFilter<"Occupation"> | string | null;
    id?: StringFilter<"Occupation"> | string;
    parent?: XOR<
      OccupationNullableScalarRelationFilter,
      OccupationWhereInput
    > | null;
    parent_to_Occupation_reverse?: OccupationListRelationFilter;
    profession_to_Person_reverse?: PersonListRelationFilter;
  };

  export type OccupationOrderByWithRelationInput = {
    title?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    parent_id?: SortOrderInput | SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    parent?: OccupationOrderByWithRelationInput;
    parent_to_Occupation_reverse?: OccupationOrderByRelationAggregateInput;
    profession_to_Person_reverse?: PersonOrderByRelationAggregateInput;
  };

  export type OccupationWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: OccupationWhereInput | OccupationWhereInput[];
      OR?: OccupationWhereInput[];
      NOT?: OccupationWhereInput | OccupationWhereInput[];
      title?: StringNullableFilter<"Occupation"> | string | null;
      description?: StringNullableFilter<"Occupation"> | string | null;
      parent_id?: StringNullableFilter<"Occupation"> | string | null;
      idAuthority_authority?:
        | StringNullableFilter<"Occupation">
        | string
        | null;
      idAuthority_id?: StringNullableFilter<"Occupation"> | string | null;
      type?: StringNullableFilter<"Occupation"> | string | null;
      parent?: XOR<
        OccupationNullableScalarRelationFilter,
        OccupationWhereInput
      > | null;
      parent_to_Occupation_reverse?: OccupationListRelationFilter;
      profession_to_Person_reverse?: PersonListRelationFilter;
    },
    "id"
  >;

  export type OccupationOrderByWithAggregationInput = {
    title?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    parent_id?: SortOrderInput | SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    _count?: OccupationCountOrderByAggregateInput;
    _max?: OccupationMaxOrderByAggregateInput;
    _min?: OccupationMinOrderByAggregateInput;
  };

  export type OccupationScalarWhereWithAggregatesInput = {
    AND?:
      | OccupationScalarWhereWithAggregatesInput
      | OccupationScalarWhereWithAggregatesInput[];
    OR?: OccupationScalarWhereWithAggregatesInput[];
    NOT?:
      | OccupationScalarWhereWithAggregatesInput
      | OccupationScalarWhereWithAggregatesInput[];
    title?: StringNullableWithAggregatesFilter<"Occupation"> | string | null;
    description?:
      | StringNullableWithAggregatesFilter<"Occupation">
      | string
      | null;
    parent_id?:
      | StringNullableWithAggregatesFilter<"Occupation">
      | string
      | null;
    idAuthority_authority?:
      | StringNullableWithAggregatesFilter<"Occupation">
      | string
      | null;
    idAuthority_id?:
      | StringNullableWithAggregatesFilter<"Occupation">
      | string
      | null;
    type?: StringNullableWithAggregatesFilter<"Occupation"> | string | null;
    id?: StringWithAggregatesFilter<"Occupation"> | string;
  };

  export type PersonWhereInput = {
    AND?: PersonWhereInput | PersonWhereInput[];
    OR?: PersonWhereInput[];
    NOT?: PersonWhereInput | PersonWhereInput[];
    name?: StringNullableFilter<"Person"> | string | null;
    description?: StringNullableFilter<"Person"> | string | null;
    birthDate?: IntNullableFilter<"Person"> | number | null;
    deathDate?: IntNullableFilter<"Person"> | number | null;
    gender?: StringNullableFilter<"Person"> | string | null;
    personDeceased?: BoolNullableFilter<"Person"> | boolean | null;
    externalId?: StringNullableFilter<"Person"> | string | null;
    birthPlace_id?: StringNullableFilter<"Person"> | string | null;
    image?: StringNullableFilter<"Person"> | string | null;
    nameVariant?: StringNullableListFilter<"Person">;
    idAuthority_authority?: StringNullableFilter<"Person"> | string | null;
    idAuthority_id?: StringNullableFilter<"Person"> | string | null;
    type?: StringNullableFilter<"Person"> | string | null;
    id?: StringFilter<"Person"> | string;
    profession?: OccupationListRelationFilter;
    birthPlace?: XOR<PlaceNullableScalarRelationFilter, PlaceWhereInput> | null;
    memberOfCorp?: CorporationListRelationFilter;
  };

  export type PersonOrderByWithRelationInput = {
    name?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    birthDate?: SortOrderInput | SortOrder;
    deathDate?: SortOrderInput | SortOrder;
    gender?: SortOrderInput | SortOrder;
    personDeceased?: SortOrderInput | SortOrder;
    externalId?: SortOrderInput | SortOrder;
    birthPlace_id?: SortOrderInput | SortOrder;
    image?: SortOrderInput | SortOrder;
    nameVariant?: SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    profession?: OccupationOrderByRelationAggregateInput;
    birthPlace?: PlaceOrderByWithRelationInput;
    memberOfCorp?: CorporationOrderByRelationAggregateInput;
  };

  export type PersonWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: PersonWhereInput | PersonWhereInput[];
      OR?: PersonWhereInput[];
      NOT?: PersonWhereInput | PersonWhereInput[];
      name?: StringNullableFilter<"Person"> | string | null;
      description?: StringNullableFilter<"Person"> | string | null;
      birthDate?: IntNullableFilter<"Person"> | number | null;
      deathDate?: IntNullableFilter<"Person"> | number | null;
      gender?: StringNullableFilter<"Person"> | string | null;
      personDeceased?: BoolNullableFilter<"Person"> | boolean | null;
      externalId?: StringNullableFilter<"Person"> | string | null;
      birthPlace_id?: StringNullableFilter<"Person"> | string | null;
      image?: StringNullableFilter<"Person"> | string | null;
      nameVariant?: StringNullableListFilter<"Person">;
      idAuthority_authority?: StringNullableFilter<"Person"> | string | null;
      idAuthority_id?: StringNullableFilter<"Person"> | string | null;
      type?: StringNullableFilter<"Person"> | string | null;
      profession?: OccupationListRelationFilter;
      birthPlace?: XOR<
        PlaceNullableScalarRelationFilter,
        PlaceWhereInput
      > | null;
      memberOfCorp?: CorporationListRelationFilter;
    },
    "id"
  >;

  export type PersonOrderByWithAggregationInput = {
    name?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    birthDate?: SortOrderInput | SortOrder;
    deathDate?: SortOrderInput | SortOrder;
    gender?: SortOrderInput | SortOrder;
    personDeceased?: SortOrderInput | SortOrder;
    externalId?: SortOrderInput | SortOrder;
    birthPlace_id?: SortOrderInput | SortOrder;
    image?: SortOrderInput | SortOrder;
    nameVariant?: SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    _count?: PersonCountOrderByAggregateInput;
    _avg?: PersonAvgOrderByAggregateInput;
    _max?: PersonMaxOrderByAggregateInput;
    _min?: PersonMinOrderByAggregateInput;
    _sum?: PersonSumOrderByAggregateInput;
  };

  export type PersonScalarWhereWithAggregatesInput = {
    AND?:
      | PersonScalarWhereWithAggregatesInput
      | PersonScalarWhereWithAggregatesInput[];
    OR?: PersonScalarWhereWithAggregatesInput[];
    NOT?:
      | PersonScalarWhereWithAggregatesInput
      | PersonScalarWhereWithAggregatesInput[];
    name?: StringNullableWithAggregatesFilter<"Person"> | string | null;
    description?: StringNullableWithAggregatesFilter<"Person"> | string | null;
    birthDate?: IntNullableWithAggregatesFilter<"Person"> | number | null;
    deathDate?: IntNullableWithAggregatesFilter<"Person"> | number | null;
    gender?: StringNullableWithAggregatesFilter<"Person"> | string | null;
    personDeceased?:
      | BoolNullableWithAggregatesFilter<"Person">
      | boolean
      | null;
    externalId?: StringNullableWithAggregatesFilter<"Person"> | string | null;
    birthPlace_id?:
      | StringNullableWithAggregatesFilter<"Person">
      | string
      | null;
    image?: StringNullableWithAggregatesFilter<"Person"> | string | null;
    nameVariant?: StringNullableListFilter<"Person">;
    idAuthority_authority?:
      | StringNullableWithAggregatesFilter<"Person">
      | string
      | null;
    idAuthority_id?:
      | StringNullableWithAggregatesFilter<"Person">
      | string
      | null;
    type?: StringNullableWithAggregatesFilter<"Person"> | string | null;
    id?: StringWithAggregatesFilter<"Person"> | string;
  };

  export type PlaceWhereInput = {
    AND?: PlaceWhereInput | PlaceWhereInput[];
    OR?: PlaceWhereInput[];
    NOT?: PlaceWhereInput | PlaceWhereInput[];
    title?: StringNullableFilter<"Place"> | string | null;
    description?: StringNullableFilter<"Place"> | string | null;
    titleVariants?: StringNullableFilter<"Place"> | string | null;
    location_id?: StringNullableFilter<"Place"> | string | null;
    parent_id?: StringNullableFilter<"Place"> | string | null;
    image?: StringNullableFilter<"Place"> | string | null;
    idAuthority_authority?: StringNullableFilter<"Place"> | string | null;
    idAuthority_id?: StringNullableFilter<"Place"> | string | null;
    type?: StringNullableFilter<"Place"> | string | null;
    id?: StringFilter<"Place"> | string;
    birthPlace_to_Person_reverse?: PersonListRelationFilter;
    location?: XOR<
      LocationNullableScalarRelationFilter,
      LocationWhereInput
    > | null;
    parent?: XOR<PlaceNullableScalarRelationFilter, PlaceWhereInput> | null;
    parent_to_Place_reverse?: PlaceListRelationFilter;
  };

  export type PlaceOrderByWithRelationInput = {
    title?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    titleVariants?: SortOrderInput | SortOrder;
    location_id?: SortOrderInput | SortOrder;
    parent_id?: SortOrderInput | SortOrder;
    image?: SortOrderInput | SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    birthPlace_to_Person_reverse?: PersonOrderByRelationAggregateInput;
    location?: LocationOrderByWithRelationInput;
    parent?: PlaceOrderByWithRelationInput;
    parent_to_Place_reverse?: PlaceOrderByRelationAggregateInput;
  };

  export type PlaceWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: PlaceWhereInput | PlaceWhereInput[];
      OR?: PlaceWhereInput[];
      NOT?: PlaceWhereInput | PlaceWhereInput[];
      title?: StringNullableFilter<"Place"> | string | null;
      description?: StringNullableFilter<"Place"> | string | null;
      titleVariants?: StringNullableFilter<"Place"> | string | null;
      location_id?: StringNullableFilter<"Place"> | string | null;
      parent_id?: StringNullableFilter<"Place"> | string | null;
      image?: StringNullableFilter<"Place"> | string | null;
      idAuthority_authority?: StringNullableFilter<"Place"> | string | null;
      idAuthority_id?: StringNullableFilter<"Place"> | string | null;
      type?: StringNullableFilter<"Place"> | string | null;
      birthPlace_to_Person_reverse?: PersonListRelationFilter;
      location?: XOR<
        LocationNullableScalarRelationFilter,
        LocationWhereInput
      > | null;
      parent?: XOR<PlaceNullableScalarRelationFilter, PlaceWhereInput> | null;
      parent_to_Place_reverse?: PlaceListRelationFilter;
    },
    "id"
  >;

  export type PlaceOrderByWithAggregationInput = {
    title?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    titleVariants?: SortOrderInput | SortOrder;
    location_id?: SortOrderInput | SortOrder;
    parent_id?: SortOrderInput | SortOrder;
    image?: SortOrderInput | SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    _count?: PlaceCountOrderByAggregateInput;
    _max?: PlaceMaxOrderByAggregateInput;
    _min?: PlaceMinOrderByAggregateInput;
  };

  export type PlaceScalarWhereWithAggregatesInput = {
    AND?:
      | PlaceScalarWhereWithAggregatesInput
      | PlaceScalarWhereWithAggregatesInput[];
    OR?: PlaceScalarWhereWithAggregatesInput[];
    NOT?:
      | PlaceScalarWhereWithAggregatesInput
      | PlaceScalarWhereWithAggregatesInput[];
    title?: StringNullableWithAggregatesFilter<"Place"> | string | null;
    description?: StringNullableWithAggregatesFilter<"Place"> | string | null;
    titleVariants?: StringNullableWithAggregatesFilter<"Place"> | string | null;
    location_id?: StringNullableWithAggregatesFilter<"Place"> | string | null;
    parent_id?: StringNullableWithAggregatesFilter<"Place"> | string | null;
    image?: StringNullableWithAggregatesFilter<"Place"> | string | null;
    idAuthority_authority?:
      | StringNullableWithAggregatesFilter<"Place">
      | string
      | null;
    idAuthority_id?:
      | StringNullableWithAggregatesFilter<"Place">
      | string
      | null;
    type?: StringNullableWithAggregatesFilter<"Place"> | string | null;
    id?: StringWithAggregatesFilter<"Place"> | string;
  };

  export type CorporationWhereInput = {
    AND?: CorporationWhereInput | CorporationWhereInput[];
    OR?: CorporationWhereInput[];
    NOT?: CorporationWhereInput | CorporationWhereInput[];
    name?: StringNullableFilter<"Corporation"> | string | null;
    description?: StringNullableFilter<"Corporation"> | string | null;
    parent_id?: StringNullableFilter<"Corporation"> | string | null;
    location_id?: StringNullableFilter<"Corporation"> | string | null;
    image?: StringNullableFilter<"Corporation"> | string | null;
    nameVariant?: StringNullableListFilter<"Corporation">;
    idAuthority_authority?: StringNullableFilter<"Corporation"> | string | null;
    idAuthority_id?: StringNullableFilter<"Corporation"> | string | null;
    type?: StringNullableFilter<"Corporation"> | string | null;
    id?: StringFilter<"Corporation"> | string;
    memberOfCorp_to_Person_reverse?: PersonListRelationFilter;
    parent?: XOR<
      CorporationNullableScalarRelationFilter,
      CorporationWhereInput
    > | null;
    location?: XOR<
      LocationNullableScalarRelationFilter,
      LocationWhereInput
    > | null;
    parent_to_Corporation_reverse?: CorporationListRelationFilter;
  };

  export type CorporationOrderByWithRelationInput = {
    name?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    parent_id?: SortOrderInput | SortOrder;
    location_id?: SortOrderInput | SortOrder;
    image?: SortOrderInput | SortOrder;
    nameVariant?: SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    memberOfCorp_to_Person_reverse?: PersonOrderByRelationAggregateInput;
    parent?: CorporationOrderByWithRelationInput;
    location?: LocationOrderByWithRelationInput;
    parent_to_Corporation_reverse?: CorporationOrderByRelationAggregateInput;
  };

  export type CorporationWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: CorporationWhereInput | CorporationWhereInput[];
      OR?: CorporationWhereInput[];
      NOT?: CorporationWhereInput | CorporationWhereInput[];
      name?: StringNullableFilter<"Corporation"> | string | null;
      description?: StringNullableFilter<"Corporation"> | string | null;
      parent_id?: StringNullableFilter<"Corporation"> | string | null;
      location_id?: StringNullableFilter<"Corporation"> | string | null;
      image?: StringNullableFilter<"Corporation"> | string | null;
      nameVariant?: StringNullableListFilter<"Corporation">;
      idAuthority_authority?:
        | StringNullableFilter<"Corporation">
        | string
        | null;
      idAuthority_id?: StringNullableFilter<"Corporation"> | string | null;
      type?: StringNullableFilter<"Corporation"> | string | null;
      memberOfCorp_to_Person_reverse?: PersonListRelationFilter;
      parent?: XOR<
        CorporationNullableScalarRelationFilter,
        CorporationWhereInput
      > | null;
      location?: XOR<
        LocationNullableScalarRelationFilter,
        LocationWhereInput
      > | null;
      parent_to_Corporation_reverse?: CorporationListRelationFilter;
    },
    "id"
  >;

  export type CorporationOrderByWithAggregationInput = {
    name?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    parent_id?: SortOrderInput | SortOrder;
    location_id?: SortOrderInput | SortOrder;
    image?: SortOrderInput | SortOrder;
    nameVariant?: SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    _count?: CorporationCountOrderByAggregateInput;
    _max?: CorporationMaxOrderByAggregateInput;
    _min?: CorporationMinOrderByAggregateInput;
  };

  export type CorporationScalarWhereWithAggregatesInput = {
    AND?:
      | CorporationScalarWhereWithAggregatesInput
      | CorporationScalarWhereWithAggregatesInput[];
    OR?: CorporationScalarWhereWithAggregatesInput[];
    NOT?:
      | CorporationScalarWhereWithAggregatesInput
      | CorporationScalarWhereWithAggregatesInput[];
    name?: StringNullableWithAggregatesFilter<"Corporation"> | string | null;
    description?:
      | StringNullableWithAggregatesFilter<"Corporation">
      | string
      | null;
    parent_id?:
      | StringNullableWithAggregatesFilter<"Corporation">
      | string
      | null;
    location_id?:
      | StringNullableWithAggregatesFilter<"Corporation">
      | string
      | null;
    image?: StringNullableWithAggregatesFilter<"Corporation"> | string | null;
    nameVariant?: StringNullableListFilter<"Corporation">;
    idAuthority_authority?:
      | StringNullableWithAggregatesFilter<"Corporation">
      | string
      | null;
    idAuthority_id?:
      | StringNullableWithAggregatesFilter<"Corporation">
      | string
      | null;
    type?: StringNullableWithAggregatesFilter<"Corporation"> | string | null;
    id?: StringWithAggregatesFilter<"Corporation"> | string;
  };

  export type LocationWhereInput = {
    AND?: LocationWhereInput | LocationWhereInput[];
    OR?: LocationWhereInput[];
    NOT?: LocationWhereInput | LocationWhereInput[];
    title?: StringNullableFilter<"Location"> | string | null;
    titleVariants?: StringNullableFilter<"Location"> | string | null;
    description?: StringNullableFilter<"Location"> | string | null;
    image?: StringNullableFilter<"Location"> | string | null;
    parent_id?: StringNullableFilter<"Location"> | string | null;
    idAuthority_authority?: StringNullableFilter<"Location"> | string | null;
    idAuthority_id?: StringNullableFilter<"Location"> | string | null;
    type?: StringNullableFilter<"Location"> | string | null;
    id?: StringFilter<"Location"> | string;
    parent?: XOR<
      LocationNullableScalarRelationFilter,
      LocationWhereInput
    > | null;
    parent_to_Location_reverse?: LocationListRelationFilter;
    location_to_Place_reverse?: PlaceListRelationFilter;
    location_to_Corporation_reverse?: CorporationListRelationFilter;
  };

  export type LocationOrderByWithRelationInput = {
    title?: SortOrderInput | SortOrder;
    titleVariants?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    image?: SortOrderInput | SortOrder;
    parent_id?: SortOrderInput | SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    parent?: LocationOrderByWithRelationInput;
    parent_to_Location_reverse?: LocationOrderByRelationAggregateInput;
    location_to_Place_reverse?: PlaceOrderByRelationAggregateInput;
    location_to_Corporation_reverse?: CorporationOrderByRelationAggregateInput;
  };

  export type LocationWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: LocationWhereInput | LocationWhereInput[];
      OR?: LocationWhereInput[];
      NOT?: LocationWhereInput | LocationWhereInput[];
      title?: StringNullableFilter<"Location"> | string | null;
      titleVariants?: StringNullableFilter<"Location"> | string | null;
      description?: StringNullableFilter<"Location"> | string | null;
      image?: StringNullableFilter<"Location"> | string | null;
      parent_id?: StringNullableFilter<"Location"> | string | null;
      idAuthority_authority?: StringNullableFilter<"Location"> | string | null;
      idAuthority_id?: StringNullableFilter<"Location"> | string | null;
      type?: StringNullableFilter<"Location"> | string | null;
      parent?: XOR<
        LocationNullableScalarRelationFilter,
        LocationWhereInput
      > | null;
      parent_to_Location_reverse?: LocationListRelationFilter;
      location_to_Place_reverse?: PlaceListRelationFilter;
      location_to_Corporation_reverse?: CorporationListRelationFilter;
    },
    "id"
  >;

  export type LocationOrderByWithAggregationInput = {
    title?: SortOrderInput | SortOrder;
    titleVariants?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    image?: SortOrderInput | SortOrder;
    parent_id?: SortOrderInput | SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    _count?: LocationCountOrderByAggregateInput;
    _max?: LocationMaxOrderByAggregateInput;
    _min?: LocationMinOrderByAggregateInput;
  };

  export type LocationScalarWhereWithAggregatesInput = {
    AND?:
      | LocationScalarWhereWithAggregatesInput
      | LocationScalarWhereWithAggregatesInput[];
    OR?: LocationScalarWhereWithAggregatesInput[];
    NOT?:
      | LocationScalarWhereWithAggregatesInput
      | LocationScalarWhereWithAggregatesInput[];
    title?: StringNullableWithAggregatesFilter<"Location"> | string | null;
    titleVariants?:
      | StringNullableWithAggregatesFilter<"Location">
      | string
      | null;
    description?:
      | StringNullableWithAggregatesFilter<"Location">
      | string
      | null;
    image?: StringNullableWithAggregatesFilter<"Location"> | string | null;
    parent_id?: StringNullableWithAggregatesFilter<"Location"> | string | null;
    idAuthority_authority?:
      | StringNullableWithAggregatesFilter<"Location">
      | string
      | null;
    idAuthority_id?:
      | StringNullableWithAggregatesFilter<"Location">
      | string
      | null;
    type?: StringNullableWithAggregatesFilter<"Location"> | string | null;
    id?: StringWithAggregatesFilter<"Location"> | string;
  };

  export type ExhibitionWhereInput = {
    AND?: ExhibitionWhereInput | ExhibitionWhereInput[];
    OR?: ExhibitionWhereInput[];
    NOT?: ExhibitionWhereInput | ExhibitionWhereInput[];
    title?: StringNullableFilter<"Exhibition"> | string | null;
    description?: StringNullableFilter<"Exhibition"> | string | null;
    idAuthority_authority?: StringNullableFilter<"Exhibition"> | string | null;
    idAuthority_id?: StringNullableFilter<"Exhibition"> | string | null;
    type?: StringNullableFilter<"Exhibition"> | string | null;
    id?: StringFilter<"Exhibition"> | string;
  };

  export type ExhibitionOrderByWithRelationInput = {
    title?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
  };

  export type ExhibitionWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: ExhibitionWhereInput | ExhibitionWhereInput[];
      OR?: ExhibitionWhereInput[];
      NOT?: ExhibitionWhereInput | ExhibitionWhereInput[];
      title?: StringNullableFilter<"Exhibition"> | string | null;
      description?: StringNullableFilter<"Exhibition"> | string | null;
      idAuthority_authority?:
        | StringNullableFilter<"Exhibition">
        | string
        | null;
      idAuthority_id?: StringNullableFilter<"Exhibition"> | string | null;
      type?: StringNullableFilter<"Exhibition"> | string | null;
    },
    "id"
  >;

  export type ExhibitionOrderByWithAggregationInput = {
    title?: SortOrderInput | SortOrder;
    description?: SortOrderInput | SortOrder;
    idAuthority_authority?: SortOrderInput | SortOrder;
    idAuthority_id?: SortOrderInput | SortOrder;
    type?: SortOrderInput | SortOrder;
    id?: SortOrder;
    _count?: ExhibitionCountOrderByAggregateInput;
    _max?: ExhibitionMaxOrderByAggregateInput;
    _min?: ExhibitionMinOrderByAggregateInput;
  };

  export type ExhibitionScalarWhereWithAggregatesInput = {
    AND?:
      | ExhibitionScalarWhereWithAggregatesInput
      | ExhibitionScalarWhereWithAggregatesInput[];
    OR?: ExhibitionScalarWhereWithAggregatesInput[];
    NOT?:
      | ExhibitionScalarWhereWithAggregatesInput
      | ExhibitionScalarWhereWithAggregatesInput[];
    title?: StringNullableWithAggregatesFilter<"Exhibition"> | string | null;
    description?:
      | StringNullableWithAggregatesFilter<"Exhibition">
      | string
      | null;
    idAuthority_authority?:
      | StringNullableWithAggregatesFilter<"Exhibition">
      | string
      | null;
    idAuthority_id?:
      | StringNullableWithAggregatesFilter<"Exhibition">
      | string
      | null;
    type?: StringNullableWithAggregatesFilter<"Exhibition"> | string | null;
    id?: StringWithAggregatesFilter<"Exhibition"> | string;
  };

  export type OccupationCreateInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent?: OccupationCreateNestedOneWithoutParent_to_Occupation_reverseInput;
    parent_to_Occupation_reverse?: OccupationCreateNestedManyWithoutParentInput;
    profession_to_Person_reverse?: PersonCreateNestedManyWithoutProfessionInput;
  };

  export type OccupationUncheckedCreateInput = {
    title?: string | null;
    description?: string | null;
    parent_id?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent_to_Occupation_reverse?: OccupationUncheckedCreateNestedManyWithoutParentInput;
    profession_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutProfessionInput;
  };

  export type OccupationUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent?: OccupationUpdateOneWithoutParent_to_Occupation_reverseNestedInput;
    parent_to_Occupation_reverse?: OccupationUpdateManyWithoutParentNestedInput;
    profession_to_Person_reverse?: PersonUpdateManyWithoutProfessionNestedInput;
  };

  export type OccupationUncheckedUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent_to_Occupation_reverse?: OccupationUncheckedUpdateManyWithoutParentNestedInput;
    profession_to_Person_reverse?: PersonUncheckedUpdateManyWithoutProfessionNestedInput;
  };

  export type OccupationCreateManyInput = {
    title?: string | null;
    description?: string | null;
    parent_id?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type OccupationUpdateManyMutationInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type OccupationUncheckedUpdateManyInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type PersonCreateInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    profession?: OccupationCreateNestedManyWithoutProfession_to_Person_reverseInput;
    birthPlace?: PlaceCreateNestedOneWithoutBirthPlace_to_Person_reverseInput;
    memberOfCorp?: CorporationCreateNestedManyWithoutMemberOfCorp_to_Person_reverseInput;
  };

  export type PersonUncheckedCreateInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    birthPlace_id?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    profession?: OccupationUncheckedCreateNestedManyWithoutProfession_to_Person_reverseInput;
    memberOfCorp?: CorporationUncheckedCreateNestedManyWithoutMemberOfCorp_to_Person_reverseInput;
  };

  export type PersonUpdateInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    profession?: OccupationUpdateManyWithoutProfession_to_Person_reverseNestedInput;
    birthPlace?: PlaceUpdateOneWithoutBirthPlace_to_Person_reverseNestedInput;
    memberOfCorp?: CorporationUpdateManyWithoutMemberOfCorp_to_Person_reverseNestedInput;
  };

  export type PersonUncheckedUpdateInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    birthPlace_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    profession?: OccupationUncheckedUpdateManyWithoutProfession_to_Person_reverseNestedInput;
    memberOfCorp?: CorporationUncheckedUpdateManyWithoutMemberOfCorp_to_Person_reverseNestedInput;
  };

  export type PersonCreateManyInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    birthPlace_id?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type PersonUpdateManyMutationInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type PersonUncheckedUpdateManyInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    birthPlace_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type PlaceCreateInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace_to_Person_reverse?: PersonCreateNestedManyWithoutBirthPlaceInput;
    location?: LocationCreateNestedOneWithoutLocation_to_Place_reverseInput;
    parent?: PlaceCreateNestedOneWithoutParent_to_Place_reverseInput;
    parent_to_Place_reverse?: PlaceCreateNestedManyWithoutParentInput;
  };

  export type PlaceUncheckedCreateInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    location_id?: string | null;
    parent_id?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutBirthPlaceInput;
    parent_to_Place_reverse?: PlaceUncheckedCreateNestedManyWithoutParentInput;
  };

  export type PlaceUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace_to_Person_reverse?: PersonUpdateManyWithoutBirthPlaceNestedInput;
    location?: LocationUpdateOneWithoutLocation_to_Place_reverseNestedInput;
    parent?: PlaceUpdateOneWithoutParent_to_Place_reverseNestedInput;
    parent_to_Place_reverse?: PlaceUpdateManyWithoutParentNestedInput;
  };

  export type PlaceUncheckedUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace_to_Person_reverse?: PersonUncheckedUpdateManyWithoutBirthPlaceNestedInput;
    parent_to_Place_reverse?: PlaceUncheckedUpdateManyWithoutParentNestedInput;
  };

  export type PlaceCreateManyInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    location_id?: string | null;
    parent_id?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type PlaceUpdateManyMutationInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type PlaceUncheckedUpdateManyInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type CorporationCreateInput = {
    name?: string | null;
    description?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    memberOfCorp_to_Person_reverse?: PersonCreateNestedManyWithoutMemberOfCorpInput;
    parent?: CorporationCreateNestedOneWithoutParent_to_Corporation_reverseInput;
    location?: LocationCreateNestedOneWithoutLocation_to_Corporation_reverseInput;
    parent_to_Corporation_reverse?: CorporationCreateNestedManyWithoutParentInput;
  };

  export type CorporationUncheckedCreateInput = {
    name?: string | null;
    description?: string | null;
    parent_id?: string | null;
    location_id?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    memberOfCorp_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutMemberOfCorpInput;
    parent_to_Corporation_reverse?: CorporationUncheckedCreateNestedManyWithoutParentInput;
  };

  export type CorporationUpdateInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    memberOfCorp_to_Person_reverse?: PersonUpdateManyWithoutMemberOfCorpNestedInput;
    parent?: CorporationUpdateOneWithoutParent_to_Corporation_reverseNestedInput;
    location?: LocationUpdateOneWithoutLocation_to_Corporation_reverseNestedInput;
    parent_to_Corporation_reverse?: CorporationUpdateManyWithoutParentNestedInput;
  };

  export type CorporationUncheckedUpdateInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    memberOfCorp_to_Person_reverse?: PersonUncheckedUpdateManyWithoutMemberOfCorpNestedInput;
    parent_to_Corporation_reverse?: CorporationUncheckedUpdateManyWithoutParentNestedInput;
  };

  export type CorporationCreateManyInput = {
    name?: string | null;
    description?: string | null;
    parent_id?: string | null;
    location_id?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type CorporationUpdateManyMutationInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type CorporationUncheckedUpdateManyInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type LocationCreateInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent?: LocationCreateNestedOneWithoutParent_to_Location_reverseInput;
    parent_to_Location_reverse?: LocationCreateNestedManyWithoutParentInput;
    location_to_Place_reverse?: PlaceCreateNestedManyWithoutLocationInput;
    location_to_Corporation_reverse?: CorporationCreateNestedManyWithoutLocationInput;
  };

  export type LocationUncheckedCreateInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    parent_id?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent_to_Location_reverse?: LocationUncheckedCreateNestedManyWithoutParentInput;
    location_to_Place_reverse?: PlaceUncheckedCreateNestedManyWithoutLocationInput;
    location_to_Corporation_reverse?: CorporationUncheckedCreateNestedManyWithoutLocationInput;
  };

  export type LocationUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent?: LocationUpdateOneWithoutParent_to_Location_reverseNestedInput;
    parent_to_Location_reverse?: LocationUpdateManyWithoutParentNestedInput;
    location_to_Place_reverse?: PlaceUpdateManyWithoutLocationNestedInput;
    location_to_Corporation_reverse?: CorporationUpdateManyWithoutLocationNestedInput;
  };

  export type LocationUncheckedUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent_to_Location_reverse?: LocationUncheckedUpdateManyWithoutParentNestedInput;
    location_to_Place_reverse?: PlaceUncheckedUpdateManyWithoutLocationNestedInput;
    location_to_Corporation_reverse?: CorporationUncheckedUpdateManyWithoutLocationNestedInput;
  };

  export type LocationCreateManyInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    parent_id?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type LocationUpdateManyMutationInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type LocationUncheckedUpdateManyInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type ExhibitionCreateInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type ExhibitionUncheckedCreateInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type ExhibitionUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type ExhibitionUncheckedUpdateInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type ExhibitionCreateManyInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type ExhibitionUpdateManyMutationInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type ExhibitionUncheckedUpdateManyInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    mode?: QueryMode;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[] | ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    mode?: QueryMode;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type OccupationNullableScalarRelationFilter = {
    is?: OccupationWhereInput | null;
    isNot?: OccupationWhereInput | null;
  };

  export type OccupationListRelationFilter = {
    every?: OccupationWhereInput;
    some?: OccupationWhereInput;
    none?: OccupationWhereInput;
  };

  export type PersonListRelationFilter = {
    every?: PersonWhereInput;
    some?: PersonWhereInput;
    none?: PersonWhereInput;
  };

  export type SortOrderInput = {
    sort: SortOrder;
    nulls?: NullsOrder;
  };

  export type OccupationOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type PersonOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type OccupationCountOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    parent_id?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type OccupationMaxOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    parent_id?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type OccupationMinOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    parent_id?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    mode?: QueryMode;
    not?:
      | NestedStringNullableWithAggregatesFilter<$PrismaModel>
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[] | ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    mode?: QueryMode;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntNullableFilter<$PrismaModel> | number | null;
  };

  export type BoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null;
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null;
  };

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    has?: string | StringFieldRefInput<$PrismaModel> | null;
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>;
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>;
    isEmpty?: boolean;
  };

  export type PlaceNullableScalarRelationFilter = {
    is?: PlaceWhereInput | null;
    isNot?: PlaceWhereInput | null;
  };

  export type CorporationListRelationFilter = {
    every?: CorporationWhereInput;
    some?: CorporationWhereInput;
    none?: CorporationWhereInput;
  };

  export type CorporationOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type PersonCountOrderByAggregateInput = {
    name?: SortOrder;
    description?: SortOrder;
    birthDate?: SortOrder;
    deathDate?: SortOrder;
    gender?: SortOrder;
    personDeceased?: SortOrder;
    externalId?: SortOrder;
    birthPlace_id?: SortOrder;
    image?: SortOrder;
    nameVariant?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type PersonAvgOrderByAggregateInput = {
    birthDate?: SortOrder;
    deathDate?: SortOrder;
  };

  export type PersonMaxOrderByAggregateInput = {
    name?: SortOrder;
    description?: SortOrder;
    birthDate?: SortOrder;
    deathDate?: SortOrder;
    gender?: SortOrder;
    personDeceased?: SortOrder;
    externalId?: SortOrder;
    birthPlace_id?: SortOrder;
    image?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type PersonMinOrderByAggregateInput = {
    name?: SortOrder;
    description?: SortOrder;
    birthDate?: SortOrder;
    deathDate?: SortOrder;
    gender?: SortOrder;
    personDeceased?: SortOrder;
    externalId?: SortOrder;
    birthPlace_id?: SortOrder;
    image?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type PersonSumOrderByAggregateInput = {
    birthDate?: SortOrder;
    deathDate?: SortOrder;
  };

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _avg?: NestedFloatNullableFilter<$PrismaModel>;
    _sum?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedIntNullableFilter<$PrismaModel>;
    _max?: NestedIntNullableFilter<$PrismaModel>;
  };

  export type BoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null;
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedBoolNullableFilter<$PrismaModel>;
    _max?: NestedBoolNullableFilter<$PrismaModel>;
  };

  export type LocationNullableScalarRelationFilter = {
    is?: LocationWhereInput | null;
    isNot?: LocationWhereInput | null;
  };

  export type PlaceListRelationFilter = {
    every?: PlaceWhereInput;
    some?: PlaceWhereInput;
    none?: PlaceWhereInput;
  };

  export type PlaceOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type PlaceCountOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    titleVariants?: SortOrder;
    location_id?: SortOrder;
    parent_id?: SortOrder;
    image?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type PlaceMaxOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    titleVariants?: SortOrder;
    location_id?: SortOrder;
    parent_id?: SortOrder;
    image?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type PlaceMinOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    titleVariants?: SortOrder;
    location_id?: SortOrder;
    parent_id?: SortOrder;
    image?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type CorporationNullableScalarRelationFilter = {
    is?: CorporationWhereInput | null;
    isNot?: CorporationWhereInput | null;
  };

  export type CorporationCountOrderByAggregateInput = {
    name?: SortOrder;
    description?: SortOrder;
    parent_id?: SortOrder;
    location_id?: SortOrder;
    image?: SortOrder;
    nameVariant?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type CorporationMaxOrderByAggregateInput = {
    name?: SortOrder;
    description?: SortOrder;
    parent_id?: SortOrder;
    location_id?: SortOrder;
    image?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type CorporationMinOrderByAggregateInput = {
    name?: SortOrder;
    description?: SortOrder;
    parent_id?: SortOrder;
    location_id?: SortOrder;
    image?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type LocationListRelationFilter = {
    every?: LocationWhereInput;
    some?: LocationWhereInput;
    none?: LocationWhereInput;
  };

  export type LocationOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type LocationCountOrderByAggregateInput = {
    title?: SortOrder;
    titleVariants?: SortOrder;
    description?: SortOrder;
    image?: SortOrder;
    parent_id?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type LocationMaxOrderByAggregateInput = {
    title?: SortOrder;
    titleVariants?: SortOrder;
    description?: SortOrder;
    image?: SortOrder;
    parent_id?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type LocationMinOrderByAggregateInput = {
    title?: SortOrder;
    titleVariants?: SortOrder;
    description?: SortOrder;
    image?: SortOrder;
    parent_id?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type ExhibitionCountOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type ExhibitionMaxOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type ExhibitionMinOrderByAggregateInput = {
    title?: SortOrder;
    description?: SortOrder;
    idAuthority_authority?: SortOrder;
    idAuthority_id?: SortOrder;
    type?: SortOrder;
    id?: SortOrder;
  };

  export type OccupationCreateNestedOneWithoutParent_to_Occupation_reverseInput =
    {
      create?: XOR<
        OccupationCreateWithoutParent_to_Occupation_reverseInput,
        OccupationUncheckedCreateWithoutParent_to_Occupation_reverseInput
      >;
      connectOrCreate?: OccupationCreateOrConnectWithoutParent_to_Occupation_reverseInput;
      connect?: OccupationWhereUniqueInput;
    };

  export type OccupationCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          OccupationCreateWithoutParentInput,
          OccupationUncheckedCreateWithoutParentInput
        >
      | OccupationCreateWithoutParentInput[]
      | OccupationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | OccupationCreateOrConnectWithoutParentInput
      | OccupationCreateOrConnectWithoutParentInput[];
    createMany?: OccupationCreateManyParentInputEnvelope;
    connect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
  };

  export type PersonCreateNestedManyWithoutProfessionInput = {
    create?:
      | XOR<
          PersonCreateWithoutProfessionInput,
          PersonUncheckedCreateWithoutProfessionInput
        >
      | PersonCreateWithoutProfessionInput[]
      | PersonUncheckedCreateWithoutProfessionInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutProfessionInput
      | PersonCreateOrConnectWithoutProfessionInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
  };

  export type OccupationUncheckedCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          OccupationCreateWithoutParentInput,
          OccupationUncheckedCreateWithoutParentInput
        >
      | OccupationCreateWithoutParentInput[]
      | OccupationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | OccupationCreateOrConnectWithoutParentInput
      | OccupationCreateOrConnectWithoutParentInput[];
    createMany?: OccupationCreateManyParentInputEnvelope;
    connect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
  };

  export type PersonUncheckedCreateNestedManyWithoutProfessionInput = {
    create?:
      | XOR<
          PersonCreateWithoutProfessionInput,
          PersonUncheckedCreateWithoutProfessionInput
        >
      | PersonCreateWithoutProfessionInput[]
      | PersonUncheckedCreateWithoutProfessionInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutProfessionInput
      | PersonCreateOrConnectWithoutProfessionInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
  };

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
  };

  export type StringFieldUpdateOperationsInput = {
    set?: string;
  };

  export type OccupationUpdateOneWithoutParent_to_Occupation_reverseNestedInput =
    {
      create?: XOR<
        OccupationCreateWithoutParent_to_Occupation_reverseInput,
        OccupationUncheckedCreateWithoutParent_to_Occupation_reverseInput
      >;
      connectOrCreate?: OccupationCreateOrConnectWithoutParent_to_Occupation_reverseInput;
      upsert?: OccupationUpsertWithoutParent_to_Occupation_reverseInput;
      disconnect?: OccupationWhereInput | boolean;
      delete?: OccupationWhereInput | boolean;
      connect?: OccupationWhereUniqueInput;
      update?: XOR<
        XOR<
          OccupationUpdateToOneWithWhereWithoutParent_to_Occupation_reverseInput,
          OccupationUpdateWithoutParent_to_Occupation_reverseInput
        >,
        OccupationUncheckedUpdateWithoutParent_to_Occupation_reverseInput
      >;
    };

  export type OccupationUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          OccupationCreateWithoutParentInput,
          OccupationUncheckedCreateWithoutParentInput
        >
      | OccupationCreateWithoutParentInput[]
      | OccupationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | OccupationCreateOrConnectWithoutParentInput
      | OccupationCreateOrConnectWithoutParentInput[];
    upsert?:
      | OccupationUpsertWithWhereUniqueWithoutParentInput
      | OccupationUpsertWithWhereUniqueWithoutParentInput[];
    createMany?: OccupationCreateManyParentInputEnvelope;
    set?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    disconnect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    delete?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    connect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    update?:
      | OccupationUpdateWithWhereUniqueWithoutParentInput
      | OccupationUpdateWithWhereUniqueWithoutParentInput[];
    updateMany?:
      | OccupationUpdateManyWithWhereWithoutParentInput
      | OccupationUpdateManyWithWhereWithoutParentInput[];
    deleteMany?: OccupationScalarWhereInput | OccupationScalarWhereInput[];
  };

  export type PersonUpdateManyWithoutProfessionNestedInput = {
    create?:
      | XOR<
          PersonCreateWithoutProfessionInput,
          PersonUncheckedCreateWithoutProfessionInput
        >
      | PersonCreateWithoutProfessionInput[]
      | PersonUncheckedCreateWithoutProfessionInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutProfessionInput
      | PersonCreateOrConnectWithoutProfessionInput[];
    upsert?:
      | PersonUpsertWithWhereUniqueWithoutProfessionInput
      | PersonUpsertWithWhereUniqueWithoutProfessionInput[];
    set?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    disconnect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    delete?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    update?:
      | PersonUpdateWithWhereUniqueWithoutProfessionInput
      | PersonUpdateWithWhereUniqueWithoutProfessionInput[];
    updateMany?:
      | PersonUpdateManyWithWhereWithoutProfessionInput
      | PersonUpdateManyWithWhereWithoutProfessionInput[];
    deleteMany?: PersonScalarWhereInput | PersonScalarWhereInput[];
  };

  export type OccupationUncheckedUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          OccupationCreateWithoutParentInput,
          OccupationUncheckedCreateWithoutParentInput
        >
      | OccupationCreateWithoutParentInput[]
      | OccupationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | OccupationCreateOrConnectWithoutParentInput
      | OccupationCreateOrConnectWithoutParentInput[];
    upsert?:
      | OccupationUpsertWithWhereUniqueWithoutParentInput
      | OccupationUpsertWithWhereUniqueWithoutParentInput[];
    createMany?: OccupationCreateManyParentInputEnvelope;
    set?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    disconnect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    delete?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    connect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    update?:
      | OccupationUpdateWithWhereUniqueWithoutParentInput
      | OccupationUpdateWithWhereUniqueWithoutParentInput[];
    updateMany?:
      | OccupationUpdateManyWithWhereWithoutParentInput
      | OccupationUpdateManyWithWhereWithoutParentInput[];
    deleteMany?: OccupationScalarWhereInput | OccupationScalarWhereInput[];
  };

  export type PersonUncheckedUpdateManyWithoutProfessionNestedInput = {
    create?:
      | XOR<
          PersonCreateWithoutProfessionInput,
          PersonUncheckedCreateWithoutProfessionInput
        >
      | PersonCreateWithoutProfessionInput[]
      | PersonUncheckedCreateWithoutProfessionInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutProfessionInput
      | PersonCreateOrConnectWithoutProfessionInput[];
    upsert?:
      | PersonUpsertWithWhereUniqueWithoutProfessionInput
      | PersonUpsertWithWhereUniqueWithoutProfessionInput[];
    set?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    disconnect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    delete?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    update?:
      | PersonUpdateWithWhereUniqueWithoutProfessionInput
      | PersonUpdateWithWhereUniqueWithoutProfessionInput[];
    updateMany?:
      | PersonUpdateManyWithWhereWithoutProfessionInput
      | PersonUpdateManyWithWhereWithoutProfessionInput[];
    deleteMany?: PersonScalarWhereInput | PersonScalarWhereInput[];
  };

  export type PersonCreatenameVariantInput = {
    set: string[];
  };

  export type OccupationCreateNestedManyWithoutProfession_to_Person_reverseInput =
    {
      create?:
        | XOR<
            OccupationCreateWithoutProfession_to_Person_reverseInput,
            OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput
          >
        | OccupationCreateWithoutProfession_to_Person_reverseInput[]
        | OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput[];
      connectOrCreate?:
        | OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput
        | OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput[];
      connect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    };

  export type PlaceCreateNestedOneWithoutBirthPlace_to_Person_reverseInput = {
    create?: XOR<
      PlaceCreateWithoutBirthPlace_to_Person_reverseInput,
      PlaceUncheckedCreateWithoutBirthPlace_to_Person_reverseInput
    >;
    connectOrCreate?: PlaceCreateOrConnectWithoutBirthPlace_to_Person_reverseInput;
    connect?: PlaceWhereUniqueInput;
  };

  export type CorporationCreateNestedManyWithoutMemberOfCorp_to_Person_reverseInput =
    {
      create?:
        | XOR<
            CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput,
            CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput
          >
        | CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput[]
        | CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput[];
      connectOrCreate?:
        | CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput[];
      connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    };

  export type OccupationUncheckedCreateNestedManyWithoutProfession_to_Person_reverseInput =
    {
      create?:
        | XOR<
            OccupationCreateWithoutProfession_to_Person_reverseInput,
            OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput
          >
        | OccupationCreateWithoutProfession_to_Person_reverseInput[]
        | OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput[];
      connectOrCreate?:
        | OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput
        | OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput[];
      connect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
    };

  export type CorporationUncheckedCreateNestedManyWithoutMemberOfCorp_to_Person_reverseInput =
    {
      create?:
        | XOR<
            CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput,
            CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput
          >
        | CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput[]
        | CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput[];
      connectOrCreate?:
        | CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput[];
      connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    };

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
  };

  export type NullableBoolFieldUpdateOperationsInput = {
    set?: boolean | null;
  };

  export type PersonUpdatenameVariantInput = {
    set?: string[];
    push?: string | string[];
  };

  export type OccupationUpdateManyWithoutProfession_to_Person_reverseNestedInput =
    {
      create?:
        | XOR<
            OccupationCreateWithoutProfession_to_Person_reverseInput,
            OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput
          >
        | OccupationCreateWithoutProfession_to_Person_reverseInput[]
        | OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput[];
      connectOrCreate?:
        | OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput
        | OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput[];
      upsert?:
        | OccupationUpsertWithWhereUniqueWithoutProfession_to_Person_reverseInput
        | OccupationUpsertWithWhereUniqueWithoutProfession_to_Person_reverseInput[];
      set?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
      disconnect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
      delete?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
      connect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
      update?:
        | OccupationUpdateWithWhereUniqueWithoutProfession_to_Person_reverseInput
        | OccupationUpdateWithWhereUniqueWithoutProfession_to_Person_reverseInput[];
      updateMany?:
        | OccupationUpdateManyWithWhereWithoutProfession_to_Person_reverseInput
        | OccupationUpdateManyWithWhereWithoutProfession_to_Person_reverseInput[];
      deleteMany?: OccupationScalarWhereInput | OccupationScalarWhereInput[];
    };

  export type PlaceUpdateOneWithoutBirthPlace_to_Person_reverseNestedInput = {
    create?: XOR<
      PlaceCreateWithoutBirthPlace_to_Person_reverseInput,
      PlaceUncheckedCreateWithoutBirthPlace_to_Person_reverseInput
    >;
    connectOrCreate?: PlaceCreateOrConnectWithoutBirthPlace_to_Person_reverseInput;
    upsert?: PlaceUpsertWithoutBirthPlace_to_Person_reverseInput;
    disconnect?: PlaceWhereInput | boolean;
    delete?: PlaceWhereInput | boolean;
    connect?: PlaceWhereUniqueInput;
    update?: XOR<
      XOR<
        PlaceUpdateToOneWithWhereWithoutBirthPlace_to_Person_reverseInput,
        PlaceUpdateWithoutBirthPlace_to_Person_reverseInput
      >,
      PlaceUncheckedUpdateWithoutBirthPlace_to_Person_reverseInput
    >;
  };

  export type CorporationUpdateManyWithoutMemberOfCorp_to_Person_reverseNestedInput =
    {
      create?:
        | XOR<
            CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput,
            CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput
          >
        | CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput[]
        | CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput[];
      connectOrCreate?:
        | CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput[];
      upsert?:
        | CorporationUpsertWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationUpsertWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput[];
      set?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
      disconnect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
      delete?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
      connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
      update?:
        | CorporationUpdateWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationUpdateWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput[];
      updateMany?:
        | CorporationUpdateManyWithWhereWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationUpdateManyWithWhereWithoutMemberOfCorp_to_Person_reverseInput[];
      deleteMany?: CorporationScalarWhereInput | CorporationScalarWhereInput[];
    };

  export type OccupationUncheckedUpdateManyWithoutProfession_to_Person_reverseNestedInput =
    {
      create?:
        | XOR<
            OccupationCreateWithoutProfession_to_Person_reverseInput,
            OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput
          >
        | OccupationCreateWithoutProfession_to_Person_reverseInput[]
        | OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput[];
      connectOrCreate?:
        | OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput
        | OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput[];
      upsert?:
        | OccupationUpsertWithWhereUniqueWithoutProfession_to_Person_reverseInput
        | OccupationUpsertWithWhereUniqueWithoutProfession_to_Person_reverseInput[];
      set?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
      disconnect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
      delete?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
      connect?: OccupationWhereUniqueInput | OccupationWhereUniqueInput[];
      update?:
        | OccupationUpdateWithWhereUniqueWithoutProfession_to_Person_reverseInput
        | OccupationUpdateWithWhereUniqueWithoutProfession_to_Person_reverseInput[];
      updateMany?:
        | OccupationUpdateManyWithWhereWithoutProfession_to_Person_reverseInput
        | OccupationUpdateManyWithWhereWithoutProfession_to_Person_reverseInput[];
      deleteMany?: OccupationScalarWhereInput | OccupationScalarWhereInput[];
    };

  export type CorporationUncheckedUpdateManyWithoutMemberOfCorp_to_Person_reverseNestedInput =
    {
      create?:
        | XOR<
            CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput,
            CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput
          >
        | CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput[]
        | CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput[];
      connectOrCreate?:
        | CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput[];
      upsert?:
        | CorporationUpsertWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationUpsertWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput[];
      set?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
      disconnect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
      delete?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
      connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
      update?:
        | CorporationUpdateWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationUpdateWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput[];
      updateMany?:
        | CorporationUpdateManyWithWhereWithoutMemberOfCorp_to_Person_reverseInput
        | CorporationUpdateManyWithWhereWithoutMemberOfCorp_to_Person_reverseInput[];
      deleteMany?: CorporationScalarWhereInput | CorporationScalarWhereInput[];
    };

  export type PersonCreateNestedManyWithoutBirthPlaceInput = {
    create?:
      | XOR<
          PersonCreateWithoutBirthPlaceInput,
          PersonUncheckedCreateWithoutBirthPlaceInput
        >
      | PersonCreateWithoutBirthPlaceInput[]
      | PersonUncheckedCreateWithoutBirthPlaceInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutBirthPlaceInput
      | PersonCreateOrConnectWithoutBirthPlaceInput[];
    createMany?: PersonCreateManyBirthPlaceInputEnvelope;
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
  };

  export type LocationCreateNestedOneWithoutLocation_to_Place_reverseInput = {
    create?: XOR<
      LocationCreateWithoutLocation_to_Place_reverseInput,
      LocationUncheckedCreateWithoutLocation_to_Place_reverseInput
    >;
    connectOrCreate?: LocationCreateOrConnectWithoutLocation_to_Place_reverseInput;
    connect?: LocationWhereUniqueInput;
  };

  export type PlaceCreateNestedOneWithoutParent_to_Place_reverseInput = {
    create?: XOR<
      PlaceCreateWithoutParent_to_Place_reverseInput,
      PlaceUncheckedCreateWithoutParent_to_Place_reverseInput
    >;
    connectOrCreate?: PlaceCreateOrConnectWithoutParent_to_Place_reverseInput;
    connect?: PlaceWhereUniqueInput;
  };

  export type PlaceCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          PlaceCreateWithoutParentInput,
          PlaceUncheckedCreateWithoutParentInput
        >
      | PlaceCreateWithoutParentInput[]
      | PlaceUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | PlaceCreateOrConnectWithoutParentInput
      | PlaceCreateOrConnectWithoutParentInput[];
    createMany?: PlaceCreateManyParentInputEnvelope;
    connect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
  };

  export type PersonUncheckedCreateNestedManyWithoutBirthPlaceInput = {
    create?:
      | XOR<
          PersonCreateWithoutBirthPlaceInput,
          PersonUncheckedCreateWithoutBirthPlaceInput
        >
      | PersonCreateWithoutBirthPlaceInput[]
      | PersonUncheckedCreateWithoutBirthPlaceInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutBirthPlaceInput
      | PersonCreateOrConnectWithoutBirthPlaceInput[];
    createMany?: PersonCreateManyBirthPlaceInputEnvelope;
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
  };

  export type PlaceUncheckedCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          PlaceCreateWithoutParentInput,
          PlaceUncheckedCreateWithoutParentInput
        >
      | PlaceCreateWithoutParentInput[]
      | PlaceUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | PlaceCreateOrConnectWithoutParentInput
      | PlaceCreateOrConnectWithoutParentInput[];
    createMany?: PlaceCreateManyParentInputEnvelope;
    connect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
  };

  export type PersonUpdateManyWithoutBirthPlaceNestedInput = {
    create?:
      | XOR<
          PersonCreateWithoutBirthPlaceInput,
          PersonUncheckedCreateWithoutBirthPlaceInput
        >
      | PersonCreateWithoutBirthPlaceInput[]
      | PersonUncheckedCreateWithoutBirthPlaceInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutBirthPlaceInput
      | PersonCreateOrConnectWithoutBirthPlaceInput[];
    upsert?:
      | PersonUpsertWithWhereUniqueWithoutBirthPlaceInput
      | PersonUpsertWithWhereUniqueWithoutBirthPlaceInput[];
    createMany?: PersonCreateManyBirthPlaceInputEnvelope;
    set?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    disconnect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    delete?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    update?:
      | PersonUpdateWithWhereUniqueWithoutBirthPlaceInput
      | PersonUpdateWithWhereUniqueWithoutBirthPlaceInput[];
    updateMany?:
      | PersonUpdateManyWithWhereWithoutBirthPlaceInput
      | PersonUpdateManyWithWhereWithoutBirthPlaceInput[];
    deleteMany?: PersonScalarWhereInput | PersonScalarWhereInput[];
  };

  export type LocationUpdateOneWithoutLocation_to_Place_reverseNestedInput = {
    create?: XOR<
      LocationCreateWithoutLocation_to_Place_reverseInput,
      LocationUncheckedCreateWithoutLocation_to_Place_reverseInput
    >;
    connectOrCreate?: LocationCreateOrConnectWithoutLocation_to_Place_reverseInput;
    upsert?: LocationUpsertWithoutLocation_to_Place_reverseInput;
    disconnect?: LocationWhereInput | boolean;
    delete?: LocationWhereInput | boolean;
    connect?: LocationWhereUniqueInput;
    update?: XOR<
      XOR<
        LocationUpdateToOneWithWhereWithoutLocation_to_Place_reverseInput,
        LocationUpdateWithoutLocation_to_Place_reverseInput
      >,
      LocationUncheckedUpdateWithoutLocation_to_Place_reverseInput
    >;
  };

  export type PlaceUpdateOneWithoutParent_to_Place_reverseNestedInput = {
    create?: XOR<
      PlaceCreateWithoutParent_to_Place_reverseInput,
      PlaceUncheckedCreateWithoutParent_to_Place_reverseInput
    >;
    connectOrCreate?: PlaceCreateOrConnectWithoutParent_to_Place_reverseInput;
    upsert?: PlaceUpsertWithoutParent_to_Place_reverseInput;
    disconnect?: PlaceWhereInput | boolean;
    delete?: PlaceWhereInput | boolean;
    connect?: PlaceWhereUniqueInput;
    update?: XOR<
      XOR<
        PlaceUpdateToOneWithWhereWithoutParent_to_Place_reverseInput,
        PlaceUpdateWithoutParent_to_Place_reverseInput
      >,
      PlaceUncheckedUpdateWithoutParent_to_Place_reverseInput
    >;
  };

  export type PlaceUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          PlaceCreateWithoutParentInput,
          PlaceUncheckedCreateWithoutParentInput
        >
      | PlaceCreateWithoutParentInput[]
      | PlaceUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | PlaceCreateOrConnectWithoutParentInput
      | PlaceCreateOrConnectWithoutParentInput[];
    upsert?:
      | PlaceUpsertWithWhereUniqueWithoutParentInput
      | PlaceUpsertWithWhereUniqueWithoutParentInput[];
    createMany?: PlaceCreateManyParentInputEnvelope;
    set?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    disconnect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    delete?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    connect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    update?:
      | PlaceUpdateWithWhereUniqueWithoutParentInput
      | PlaceUpdateWithWhereUniqueWithoutParentInput[];
    updateMany?:
      | PlaceUpdateManyWithWhereWithoutParentInput
      | PlaceUpdateManyWithWhereWithoutParentInput[];
    deleteMany?: PlaceScalarWhereInput | PlaceScalarWhereInput[];
  };

  export type PersonUncheckedUpdateManyWithoutBirthPlaceNestedInput = {
    create?:
      | XOR<
          PersonCreateWithoutBirthPlaceInput,
          PersonUncheckedCreateWithoutBirthPlaceInput
        >
      | PersonCreateWithoutBirthPlaceInput[]
      | PersonUncheckedCreateWithoutBirthPlaceInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutBirthPlaceInput
      | PersonCreateOrConnectWithoutBirthPlaceInput[];
    upsert?:
      | PersonUpsertWithWhereUniqueWithoutBirthPlaceInput
      | PersonUpsertWithWhereUniqueWithoutBirthPlaceInput[];
    createMany?: PersonCreateManyBirthPlaceInputEnvelope;
    set?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    disconnect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    delete?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    update?:
      | PersonUpdateWithWhereUniqueWithoutBirthPlaceInput
      | PersonUpdateWithWhereUniqueWithoutBirthPlaceInput[];
    updateMany?:
      | PersonUpdateManyWithWhereWithoutBirthPlaceInput
      | PersonUpdateManyWithWhereWithoutBirthPlaceInput[];
    deleteMany?: PersonScalarWhereInput | PersonScalarWhereInput[];
  };

  export type PlaceUncheckedUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          PlaceCreateWithoutParentInput,
          PlaceUncheckedCreateWithoutParentInput
        >
      | PlaceCreateWithoutParentInput[]
      | PlaceUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | PlaceCreateOrConnectWithoutParentInput
      | PlaceCreateOrConnectWithoutParentInput[];
    upsert?:
      | PlaceUpsertWithWhereUniqueWithoutParentInput
      | PlaceUpsertWithWhereUniqueWithoutParentInput[];
    createMany?: PlaceCreateManyParentInputEnvelope;
    set?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    disconnect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    delete?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    connect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    update?:
      | PlaceUpdateWithWhereUniqueWithoutParentInput
      | PlaceUpdateWithWhereUniqueWithoutParentInput[];
    updateMany?:
      | PlaceUpdateManyWithWhereWithoutParentInput
      | PlaceUpdateManyWithWhereWithoutParentInput[];
    deleteMany?: PlaceScalarWhereInput | PlaceScalarWhereInput[];
  };

  export type CorporationCreatenameVariantInput = {
    set: string[];
  };

  export type PersonCreateNestedManyWithoutMemberOfCorpInput = {
    create?:
      | XOR<
          PersonCreateWithoutMemberOfCorpInput,
          PersonUncheckedCreateWithoutMemberOfCorpInput
        >
      | PersonCreateWithoutMemberOfCorpInput[]
      | PersonUncheckedCreateWithoutMemberOfCorpInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutMemberOfCorpInput
      | PersonCreateOrConnectWithoutMemberOfCorpInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
  };

  export type CorporationCreateNestedOneWithoutParent_to_Corporation_reverseInput =
    {
      create?: XOR<
        CorporationCreateWithoutParent_to_Corporation_reverseInput,
        CorporationUncheckedCreateWithoutParent_to_Corporation_reverseInput
      >;
      connectOrCreate?: CorporationCreateOrConnectWithoutParent_to_Corporation_reverseInput;
      connect?: CorporationWhereUniqueInput;
    };

  export type LocationCreateNestedOneWithoutLocation_to_Corporation_reverseInput =
    {
      create?: XOR<
        LocationCreateWithoutLocation_to_Corporation_reverseInput,
        LocationUncheckedCreateWithoutLocation_to_Corporation_reverseInput
      >;
      connectOrCreate?: LocationCreateOrConnectWithoutLocation_to_Corporation_reverseInput;
      connect?: LocationWhereUniqueInput;
    };

  export type CorporationCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          CorporationCreateWithoutParentInput,
          CorporationUncheckedCreateWithoutParentInput
        >
      | CorporationCreateWithoutParentInput[]
      | CorporationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | CorporationCreateOrConnectWithoutParentInput
      | CorporationCreateOrConnectWithoutParentInput[];
    createMany?: CorporationCreateManyParentInputEnvelope;
    connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
  };

  export type PersonUncheckedCreateNestedManyWithoutMemberOfCorpInput = {
    create?:
      | XOR<
          PersonCreateWithoutMemberOfCorpInput,
          PersonUncheckedCreateWithoutMemberOfCorpInput
        >
      | PersonCreateWithoutMemberOfCorpInput[]
      | PersonUncheckedCreateWithoutMemberOfCorpInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutMemberOfCorpInput
      | PersonCreateOrConnectWithoutMemberOfCorpInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
  };

  export type CorporationUncheckedCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          CorporationCreateWithoutParentInput,
          CorporationUncheckedCreateWithoutParentInput
        >
      | CorporationCreateWithoutParentInput[]
      | CorporationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | CorporationCreateOrConnectWithoutParentInput
      | CorporationCreateOrConnectWithoutParentInput[];
    createMany?: CorporationCreateManyParentInputEnvelope;
    connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
  };

  export type CorporationUpdatenameVariantInput = {
    set?: string[];
    push?: string | string[];
  };

  export type PersonUpdateManyWithoutMemberOfCorpNestedInput = {
    create?:
      | XOR<
          PersonCreateWithoutMemberOfCorpInput,
          PersonUncheckedCreateWithoutMemberOfCorpInput
        >
      | PersonCreateWithoutMemberOfCorpInput[]
      | PersonUncheckedCreateWithoutMemberOfCorpInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutMemberOfCorpInput
      | PersonCreateOrConnectWithoutMemberOfCorpInput[];
    upsert?:
      | PersonUpsertWithWhereUniqueWithoutMemberOfCorpInput
      | PersonUpsertWithWhereUniqueWithoutMemberOfCorpInput[];
    set?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    disconnect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    delete?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    update?:
      | PersonUpdateWithWhereUniqueWithoutMemberOfCorpInput
      | PersonUpdateWithWhereUniqueWithoutMemberOfCorpInput[];
    updateMany?:
      | PersonUpdateManyWithWhereWithoutMemberOfCorpInput
      | PersonUpdateManyWithWhereWithoutMemberOfCorpInput[];
    deleteMany?: PersonScalarWhereInput | PersonScalarWhereInput[];
  };

  export type CorporationUpdateOneWithoutParent_to_Corporation_reverseNestedInput =
    {
      create?: XOR<
        CorporationCreateWithoutParent_to_Corporation_reverseInput,
        CorporationUncheckedCreateWithoutParent_to_Corporation_reverseInput
      >;
      connectOrCreate?: CorporationCreateOrConnectWithoutParent_to_Corporation_reverseInput;
      upsert?: CorporationUpsertWithoutParent_to_Corporation_reverseInput;
      disconnect?: CorporationWhereInput | boolean;
      delete?: CorporationWhereInput | boolean;
      connect?: CorporationWhereUniqueInput;
      update?: XOR<
        XOR<
          CorporationUpdateToOneWithWhereWithoutParent_to_Corporation_reverseInput,
          CorporationUpdateWithoutParent_to_Corporation_reverseInput
        >,
        CorporationUncheckedUpdateWithoutParent_to_Corporation_reverseInput
      >;
    };

  export type LocationUpdateOneWithoutLocation_to_Corporation_reverseNestedInput =
    {
      create?: XOR<
        LocationCreateWithoutLocation_to_Corporation_reverseInput,
        LocationUncheckedCreateWithoutLocation_to_Corporation_reverseInput
      >;
      connectOrCreate?: LocationCreateOrConnectWithoutLocation_to_Corporation_reverseInput;
      upsert?: LocationUpsertWithoutLocation_to_Corporation_reverseInput;
      disconnect?: LocationWhereInput | boolean;
      delete?: LocationWhereInput | boolean;
      connect?: LocationWhereUniqueInput;
      update?: XOR<
        XOR<
          LocationUpdateToOneWithWhereWithoutLocation_to_Corporation_reverseInput,
          LocationUpdateWithoutLocation_to_Corporation_reverseInput
        >,
        LocationUncheckedUpdateWithoutLocation_to_Corporation_reverseInput
      >;
    };

  export type CorporationUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          CorporationCreateWithoutParentInput,
          CorporationUncheckedCreateWithoutParentInput
        >
      | CorporationCreateWithoutParentInput[]
      | CorporationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | CorporationCreateOrConnectWithoutParentInput
      | CorporationCreateOrConnectWithoutParentInput[];
    upsert?:
      | CorporationUpsertWithWhereUniqueWithoutParentInput
      | CorporationUpsertWithWhereUniqueWithoutParentInput[];
    createMany?: CorporationCreateManyParentInputEnvelope;
    set?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    disconnect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    delete?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    update?:
      | CorporationUpdateWithWhereUniqueWithoutParentInput
      | CorporationUpdateWithWhereUniqueWithoutParentInput[];
    updateMany?:
      | CorporationUpdateManyWithWhereWithoutParentInput
      | CorporationUpdateManyWithWhereWithoutParentInput[];
    deleteMany?: CorporationScalarWhereInput | CorporationScalarWhereInput[];
  };

  export type PersonUncheckedUpdateManyWithoutMemberOfCorpNestedInput = {
    create?:
      | XOR<
          PersonCreateWithoutMemberOfCorpInput,
          PersonUncheckedCreateWithoutMemberOfCorpInput
        >
      | PersonCreateWithoutMemberOfCorpInput[]
      | PersonUncheckedCreateWithoutMemberOfCorpInput[];
    connectOrCreate?:
      | PersonCreateOrConnectWithoutMemberOfCorpInput
      | PersonCreateOrConnectWithoutMemberOfCorpInput[];
    upsert?:
      | PersonUpsertWithWhereUniqueWithoutMemberOfCorpInput
      | PersonUpsertWithWhereUniqueWithoutMemberOfCorpInput[];
    set?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    disconnect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    delete?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    connect?: PersonWhereUniqueInput | PersonWhereUniqueInput[];
    update?:
      | PersonUpdateWithWhereUniqueWithoutMemberOfCorpInput
      | PersonUpdateWithWhereUniqueWithoutMemberOfCorpInput[];
    updateMany?:
      | PersonUpdateManyWithWhereWithoutMemberOfCorpInput
      | PersonUpdateManyWithWhereWithoutMemberOfCorpInput[];
    deleteMany?: PersonScalarWhereInput | PersonScalarWhereInput[];
  };

  export type CorporationUncheckedUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          CorporationCreateWithoutParentInput,
          CorporationUncheckedCreateWithoutParentInput
        >
      | CorporationCreateWithoutParentInput[]
      | CorporationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | CorporationCreateOrConnectWithoutParentInput
      | CorporationCreateOrConnectWithoutParentInput[];
    upsert?:
      | CorporationUpsertWithWhereUniqueWithoutParentInput
      | CorporationUpsertWithWhereUniqueWithoutParentInput[];
    createMany?: CorporationCreateManyParentInputEnvelope;
    set?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    disconnect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    delete?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    update?:
      | CorporationUpdateWithWhereUniqueWithoutParentInput
      | CorporationUpdateWithWhereUniqueWithoutParentInput[];
    updateMany?:
      | CorporationUpdateManyWithWhereWithoutParentInput
      | CorporationUpdateManyWithWhereWithoutParentInput[];
    deleteMany?: CorporationScalarWhereInput | CorporationScalarWhereInput[];
  };

  export type LocationCreateNestedOneWithoutParent_to_Location_reverseInput = {
    create?: XOR<
      LocationCreateWithoutParent_to_Location_reverseInput,
      LocationUncheckedCreateWithoutParent_to_Location_reverseInput
    >;
    connectOrCreate?: LocationCreateOrConnectWithoutParent_to_Location_reverseInput;
    connect?: LocationWhereUniqueInput;
  };

  export type LocationCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          LocationCreateWithoutParentInput,
          LocationUncheckedCreateWithoutParentInput
        >
      | LocationCreateWithoutParentInput[]
      | LocationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | LocationCreateOrConnectWithoutParentInput
      | LocationCreateOrConnectWithoutParentInput[];
    createMany?: LocationCreateManyParentInputEnvelope;
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
  };

  export type PlaceCreateNestedManyWithoutLocationInput = {
    create?:
      | XOR<
          PlaceCreateWithoutLocationInput,
          PlaceUncheckedCreateWithoutLocationInput
        >
      | PlaceCreateWithoutLocationInput[]
      | PlaceUncheckedCreateWithoutLocationInput[];
    connectOrCreate?:
      | PlaceCreateOrConnectWithoutLocationInput
      | PlaceCreateOrConnectWithoutLocationInput[];
    createMany?: PlaceCreateManyLocationInputEnvelope;
    connect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
  };

  export type CorporationCreateNestedManyWithoutLocationInput = {
    create?:
      | XOR<
          CorporationCreateWithoutLocationInput,
          CorporationUncheckedCreateWithoutLocationInput
        >
      | CorporationCreateWithoutLocationInput[]
      | CorporationUncheckedCreateWithoutLocationInput[];
    connectOrCreate?:
      | CorporationCreateOrConnectWithoutLocationInput
      | CorporationCreateOrConnectWithoutLocationInput[];
    createMany?: CorporationCreateManyLocationInputEnvelope;
    connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
  };

  export type LocationUncheckedCreateNestedManyWithoutParentInput = {
    create?:
      | XOR<
          LocationCreateWithoutParentInput,
          LocationUncheckedCreateWithoutParentInput
        >
      | LocationCreateWithoutParentInput[]
      | LocationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | LocationCreateOrConnectWithoutParentInput
      | LocationCreateOrConnectWithoutParentInput[];
    createMany?: LocationCreateManyParentInputEnvelope;
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
  };

  export type PlaceUncheckedCreateNestedManyWithoutLocationInput = {
    create?:
      | XOR<
          PlaceCreateWithoutLocationInput,
          PlaceUncheckedCreateWithoutLocationInput
        >
      | PlaceCreateWithoutLocationInput[]
      | PlaceUncheckedCreateWithoutLocationInput[];
    connectOrCreate?:
      | PlaceCreateOrConnectWithoutLocationInput
      | PlaceCreateOrConnectWithoutLocationInput[];
    createMany?: PlaceCreateManyLocationInputEnvelope;
    connect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
  };

  export type CorporationUncheckedCreateNestedManyWithoutLocationInput = {
    create?:
      | XOR<
          CorporationCreateWithoutLocationInput,
          CorporationUncheckedCreateWithoutLocationInput
        >
      | CorporationCreateWithoutLocationInput[]
      | CorporationUncheckedCreateWithoutLocationInput[];
    connectOrCreate?:
      | CorporationCreateOrConnectWithoutLocationInput
      | CorporationCreateOrConnectWithoutLocationInput[];
    createMany?: CorporationCreateManyLocationInputEnvelope;
    connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
  };

  export type LocationUpdateOneWithoutParent_to_Location_reverseNestedInput = {
    create?: XOR<
      LocationCreateWithoutParent_to_Location_reverseInput,
      LocationUncheckedCreateWithoutParent_to_Location_reverseInput
    >;
    connectOrCreate?: LocationCreateOrConnectWithoutParent_to_Location_reverseInput;
    upsert?: LocationUpsertWithoutParent_to_Location_reverseInput;
    disconnect?: LocationWhereInput | boolean;
    delete?: LocationWhereInput | boolean;
    connect?: LocationWhereUniqueInput;
    update?: XOR<
      XOR<
        LocationUpdateToOneWithWhereWithoutParent_to_Location_reverseInput,
        LocationUpdateWithoutParent_to_Location_reverseInput
      >,
      LocationUncheckedUpdateWithoutParent_to_Location_reverseInput
    >;
  };

  export type LocationUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          LocationCreateWithoutParentInput,
          LocationUncheckedCreateWithoutParentInput
        >
      | LocationCreateWithoutParentInput[]
      | LocationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | LocationCreateOrConnectWithoutParentInput
      | LocationCreateOrConnectWithoutParentInput[];
    upsert?:
      | LocationUpsertWithWhereUniqueWithoutParentInput
      | LocationUpsertWithWhereUniqueWithoutParentInput[];
    createMany?: LocationCreateManyParentInputEnvelope;
    set?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
    disconnect?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
    delete?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
    update?:
      | LocationUpdateWithWhereUniqueWithoutParentInput
      | LocationUpdateWithWhereUniqueWithoutParentInput[];
    updateMany?:
      | LocationUpdateManyWithWhereWithoutParentInput
      | LocationUpdateManyWithWhereWithoutParentInput[];
    deleteMany?: LocationScalarWhereInput | LocationScalarWhereInput[];
  };

  export type PlaceUpdateManyWithoutLocationNestedInput = {
    create?:
      | XOR<
          PlaceCreateWithoutLocationInput,
          PlaceUncheckedCreateWithoutLocationInput
        >
      | PlaceCreateWithoutLocationInput[]
      | PlaceUncheckedCreateWithoutLocationInput[];
    connectOrCreate?:
      | PlaceCreateOrConnectWithoutLocationInput
      | PlaceCreateOrConnectWithoutLocationInput[];
    upsert?:
      | PlaceUpsertWithWhereUniqueWithoutLocationInput
      | PlaceUpsertWithWhereUniqueWithoutLocationInput[];
    createMany?: PlaceCreateManyLocationInputEnvelope;
    set?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    disconnect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    delete?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    connect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    update?:
      | PlaceUpdateWithWhereUniqueWithoutLocationInput
      | PlaceUpdateWithWhereUniqueWithoutLocationInput[];
    updateMany?:
      | PlaceUpdateManyWithWhereWithoutLocationInput
      | PlaceUpdateManyWithWhereWithoutLocationInput[];
    deleteMany?: PlaceScalarWhereInput | PlaceScalarWhereInput[];
  };

  export type CorporationUpdateManyWithoutLocationNestedInput = {
    create?:
      | XOR<
          CorporationCreateWithoutLocationInput,
          CorporationUncheckedCreateWithoutLocationInput
        >
      | CorporationCreateWithoutLocationInput[]
      | CorporationUncheckedCreateWithoutLocationInput[];
    connectOrCreate?:
      | CorporationCreateOrConnectWithoutLocationInput
      | CorporationCreateOrConnectWithoutLocationInput[];
    upsert?:
      | CorporationUpsertWithWhereUniqueWithoutLocationInput
      | CorporationUpsertWithWhereUniqueWithoutLocationInput[];
    createMany?: CorporationCreateManyLocationInputEnvelope;
    set?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    disconnect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    delete?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    update?:
      | CorporationUpdateWithWhereUniqueWithoutLocationInput
      | CorporationUpdateWithWhereUniqueWithoutLocationInput[];
    updateMany?:
      | CorporationUpdateManyWithWhereWithoutLocationInput
      | CorporationUpdateManyWithWhereWithoutLocationInput[];
    deleteMany?: CorporationScalarWhereInput | CorporationScalarWhereInput[];
  };

  export type LocationUncheckedUpdateManyWithoutParentNestedInput = {
    create?:
      | XOR<
          LocationCreateWithoutParentInput,
          LocationUncheckedCreateWithoutParentInput
        >
      | LocationCreateWithoutParentInput[]
      | LocationUncheckedCreateWithoutParentInput[];
    connectOrCreate?:
      | LocationCreateOrConnectWithoutParentInput
      | LocationCreateOrConnectWithoutParentInput[];
    upsert?:
      | LocationUpsertWithWhereUniqueWithoutParentInput
      | LocationUpsertWithWhereUniqueWithoutParentInput[];
    createMany?: LocationCreateManyParentInputEnvelope;
    set?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
    disconnect?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
    delete?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
    connect?: LocationWhereUniqueInput | LocationWhereUniqueInput[];
    update?:
      | LocationUpdateWithWhereUniqueWithoutParentInput
      | LocationUpdateWithWhereUniqueWithoutParentInput[];
    updateMany?:
      | LocationUpdateManyWithWhereWithoutParentInput
      | LocationUpdateManyWithWhereWithoutParentInput[];
    deleteMany?: LocationScalarWhereInput | LocationScalarWhereInput[];
  };

  export type PlaceUncheckedUpdateManyWithoutLocationNestedInput = {
    create?:
      | XOR<
          PlaceCreateWithoutLocationInput,
          PlaceUncheckedCreateWithoutLocationInput
        >
      | PlaceCreateWithoutLocationInput[]
      | PlaceUncheckedCreateWithoutLocationInput[];
    connectOrCreate?:
      | PlaceCreateOrConnectWithoutLocationInput
      | PlaceCreateOrConnectWithoutLocationInput[];
    upsert?:
      | PlaceUpsertWithWhereUniqueWithoutLocationInput
      | PlaceUpsertWithWhereUniqueWithoutLocationInput[];
    createMany?: PlaceCreateManyLocationInputEnvelope;
    set?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    disconnect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    delete?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    connect?: PlaceWhereUniqueInput | PlaceWhereUniqueInput[];
    update?:
      | PlaceUpdateWithWhereUniqueWithoutLocationInput
      | PlaceUpdateWithWhereUniqueWithoutLocationInput[];
    updateMany?:
      | PlaceUpdateManyWithWhereWithoutLocationInput
      | PlaceUpdateManyWithWhereWithoutLocationInput[];
    deleteMany?: PlaceScalarWhereInput | PlaceScalarWhereInput[];
  };

  export type CorporationUncheckedUpdateManyWithoutLocationNestedInput = {
    create?:
      | XOR<
          CorporationCreateWithoutLocationInput,
          CorporationUncheckedCreateWithoutLocationInput
        >
      | CorporationCreateWithoutLocationInput[]
      | CorporationUncheckedCreateWithoutLocationInput[];
    connectOrCreate?:
      | CorporationCreateOrConnectWithoutLocationInput
      | CorporationCreateOrConnectWithoutLocationInput[];
    upsert?:
      | CorporationUpsertWithWhereUniqueWithoutLocationInput
      | CorporationUpsertWithWhereUniqueWithoutLocationInput[];
    createMany?: CorporationCreateManyLocationInputEnvelope;
    set?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    disconnect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    delete?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    connect?: CorporationWhereUniqueInput | CorporationWhereUniqueInput[];
    update?:
      | CorporationUpdateWithWhereUniqueWithoutLocationInput
      | CorporationUpdateWithWhereUniqueWithoutLocationInput[];
    updateMany?:
      | CorporationUpdateManyWithWhereWithoutLocationInput
      | CorporationUpdateManyWithWhereWithoutLocationInput[];
    deleteMany?: CorporationScalarWhereInput | CorporationScalarWhereInput[];
  };

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[] | ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?:
      | NestedStringNullableWithAggregatesFilter<$PrismaModel>
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntNullableFilter<$PrismaModel> | number | null;
  };

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[] | ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[] | ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type NestedBoolNullableFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null;
    not?: NestedBoolNullableFilter<$PrismaModel> | boolean | null;
  };

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _avg?: NestedFloatNullableFilter<$PrismaModel>;
    _sum?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedIntNullableFilter<$PrismaModel>;
    _max?: NestedIntNullableFilter<$PrismaModel>;
  };

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null;
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null;
    lt?: number | FloatFieldRefInput<$PrismaModel>;
    lte?: number | FloatFieldRefInput<$PrismaModel>;
    gt?: number | FloatFieldRefInput<$PrismaModel>;
    gte?: number | FloatFieldRefInput<$PrismaModel>;
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null;
  };

  export type NestedBoolNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel> | null;
    not?: NestedBoolNullableWithAggregatesFilter<$PrismaModel> | boolean | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedBoolNullableFilter<$PrismaModel>;
    _max?: NestedBoolNullableFilter<$PrismaModel>;
  };

  export type OccupationCreateWithoutParent_to_Occupation_reverseInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent?: OccupationCreateNestedOneWithoutParent_to_Occupation_reverseInput;
    profession_to_Person_reverse?: PersonCreateNestedManyWithoutProfessionInput;
  };

  export type OccupationUncheckedCreateWithoutParent_to_Occupation_reverseInput =
    {
      title?: string | null;
      description?: string | null;
      parent_id?: string | null;
      idAuthority_authority?: string | null;
      idAuthority_id?: string | null;
      type?: string | null;
      id: string;
      profession_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutProfessionInput;
    };

  export type OccupationCreateOrConnectWithoutParent_to_Occupation_reverseInput =
    {
      where: OccupationWhereUniqueInput;
      create: XOR<
        OccupationCreateWithoutParent_to_Occupation_reverseInput,
        OccupationUncheckedCreateWithoutParent_to_Occupation_reverseInput
      >;
    };

  export type OccupationCreateWithoutParentInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent_to_Occupation_reverse?: OccupationCreateNestedManyWithoutParentInput;
    profession_to_Person_reverse?: PersonCreateNestedManyWithoutProfessionInput;
  };

  export type OccupationUncheckedCreateWithoutParentInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent_to_Occupation_reverse?: OccupationUncheckedCreateNestedManyWithoutParentInput;
    profession_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutProfessionInput;
  };

  export type OccupationCreateOrConnectWithoutParentInput = {
    where: OccupationWhereUniqueInput;
    create: XOR<
      OccupationCreateWithoutParentInput,
      OccupationUncheckedCreateWithoutParentInput
    >;
  };

  export type OccupationCreateManyParentInputEnvelope = {
    data: OccupationCreateManyParentInput | OccupationCreateManyParentInput[];
    skipDuplicates?: boolean;
  };

  export type PersonCreateWithoutProfessionInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace?: PlaceCreateNestedOneWithoutBirthPlace_to_Person_reverseInput;
    memberOfCorp?: CorporationCreateNestedManyWithoutMemberOfCorp_to_Person_reverseInput;
  };

  export type PersonUncheckedCreateWithoutProfessionInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    birthPlace_id?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    memberOfCorp?: CorporationUncheckedCreateNestedManyWithoutMemberOfCorp_to_Person_reverseInput;
  };

  export type PersonCreateOrConnectWithoutProfessionInput = {
    where: PersonWhereUniqueInput;
    create: XOR<
      PersonCreateWithoutProfessionInput,
      PersonUncheckedCreateWithoutProfessionInput
    >;
  };

  export type OccupationUpsertWithoutParent_to_Occupation_reverseInput = {
    update: XOR<
      OccupationUpdateWithoutParent_to_Occupation_reverseInput,
      OccupationUncheckedUpdateWithoutParent_to_Occupation_reverseInput
    >;
    create: XOR<
      OccupationCreateWithoutParent_to_Occupation_reverseInput,
      OccupationUncheckedCreateWithoutParent_to_Occupation_reverseInput
    >;
    where?: OccupationWhereInput;
  };

  export type OccupationUpdateToOneWithWhereWithoutParent_to_Occupation_reverseInput =
    {
      where?: OccupationWhereInput;
      data: XOR<
        OccupationUpdateWithoutParent_to_Occupation_reverseInput,
        OccupationUncheckedUpdateWithoutParent_to_Occupation_reverseInput
      >;
    };

  export type OccupationUpdateWithoutParent_to_Occupation_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent?: OccupationUpdateOneWithoutParent_to_Occupation_reverseNestedInput;
    profession_to_Person_reverse?: PersonUpdateManyWithoutProfessionNestedInput;
  };

  export type OccupationUncheckedUpdateWithoutParent_to_Occupation_reverseInput =
    {
      title?: NullableStringFieldUpdateOperationsInput | string | null;
      description?: NullableStringFieldUpdateOperationsInput | string | null;
      parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
      idAuthority_authority?:
        | NullableStringFieldUpdateOperationsInput
        | string
        | null;
      idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
      type?: NullableStringFieldUpdateOperationsInput | string | null;
      id?: StringFieldUpdateOperationsInput | string;
      profession_to_Person_reverse?: PersonUncheckedUpdateManyWithoutProfessionNestedInput;
    };

  export type OccupationUpsertWithWhereUniqueWithoutParentInput = {
    where: OccupationWhereUniqueInput;
    update: XOR<
      OccupationUpdateWithoutParentInput,
      OccupationUncheckedUpdateWithoutParentInput
    >;
    create: XOR<
      OccupationCreateWithoutParentInput,
      OccupationUncheckedCreateWithoutParentInput
    >;
  };

  export type OccupationUpdateWithWhereUniqueWithoutParentInput = {
    where: OccupationWhereUniqueInput;
    data: XOR<
      OccupationUpdateWithoutParentInput,
      OccupationUncheckedUpdateWithoutParentInput
    >;
  };

  export type OccupationUpdateManyWithWhereWithoutParentInput = {
    where: OccupationScalarWhereInput;
    data: XOR<
      OccupationUpdateManyMutationInput,
      OccupationUncheckedUpdateManyWithoutParentInput
    >;
  };

  export type OccupationScalarWhereInput = {
    AND?: OccupationScalarWhereInput | OccupationScalarWhereInput[];
    OR?: OccupationScalarWhereInput[];
    NOT?: OccupationScalarWhereInput | OccupationScalarWhereInput[];
    title?: StringNullableFilter<"Occupation"> | string | null;
    description?: StringNullableFilter<"Occupation"> | string | null;
    parent_id?: StringNullableFilter<"Occupation"> | string | null;
    idAuthority_authority?: StringNullableFilter<"Occupation"> | string | null;
    idAuthority_id?: StringNullableFilter<"Occupation"> | string | null;
    type?: StringNullableFilter<"Occupation"> | string | null;
    id?: StringFilter<"Occupation"> | string;
  };

  export type PersonUpsertWithWhereUniqueWithoutProfessionInput = {
    where: PersonWhereUniqueInput;
    update: XOR<
      PersonUpdateWithoutProfessionInput,
      PersonUncheckedUpdateWithoutProfessionInput
    >;
    create: XOR<
      PersonCreateWithoutProfessionInput,
      PersonUncheckedCreateWithoutProfessionInput
    >;
  };

  export type PersonUpdateWithWhereUniqueWithoutProfessionInput = {
    where: PersonWhereUniqueInput;
    data: XOR<
      PersonUpdateWithoutProfessionInput,
      PersonUncheckedUpdateWithoutProfessionInput
    >;
  };

  export type PersonUpdateManyWithWhereWithoutProfessionInput = {
    where: PersonScalarWhereInput;
    data: XOR<
      PersonUpdateManyMutationInput,
      PersonUncheckedUpdateManyWithoutProfessionInput
    >;
  };

  export type PersonScalarWhereInput = {
    AND?: PersonScalarWhereInput | PersonScalarWhereInput[];
    OR?: PersonScalarWhereInput[];
    NOT?: PersonScalarWhereInput | PersonScalarWhereInput[];
    name?: StringNullableFilter<"Person"> | string | null;
    description?: StringNullableFilter<"Person"> | string | null;
    birthDate?: IntNullableFilter<"Person"> | number | null;
    deathDate?: IntNullableFilter<"Person"> | number | null;
    gender?: StringNullableFilter<"Person"> | string | null;
    personDeceased?: BoolNullableFilter<"Person"> | boolean | null;
    externalId?: StringNullableFilter<"Person"> | string | null;
    birthPlace_id?: StringNullableFilter<"Person"> | string | null;
    image?: StringNullableFilter<"Person"> | string | null;
    nameVariant?: StringNullableListFilter<"Person">;
    idAuthority_authority?: StringNullableFilter<"Person"> | string | null;
    idAuthority_id?: StringNullableFilter<"Person"> | string | null;
    type?: StringNullableFilter<"Person"> | string | null;
    id?: StringFilter<"Person"> | string;
  };

  export type OccupationCreateWithoutProfession_to_Person_reverseInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent?: OccupationCreateNestedOneWithoutParent_to_Occupation_reverseInput;
    parent_to_Occupation_reverse?: OccupationCreateNestedManyWithoutParentInput;
  };

  export type OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput =
    {
      title?: string | null;
      description?: string | null;
      parent_id?: string | null;
      idAuthority_authority?: string | null;
      idAuthority_id?: string | null;
      type?: string | null;
      id: string;
      parent_to_Occupation_reverse?: OccupationUncheckedCreateNestedManyWithoutParentInput;
    };

  export type OccupationCreateOrConnectWithoutProfession_to_Person_reverseInput =
    {
      where: OccupationWhereUniqueInput;
      create: XOR<
        OccupationCreateWithoutProfession_to_Person_reverseInput,
        OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput
      >;
    };

  export type PlaceCreateWithoutBirthPlace_to_Person_reverseInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    location?: LocationCreateNestedOneWithoutLocation_to_Place_reverseInput;
    parent?: PlaceCreateNestedOneWithoutParent_to_Place_reverseInput;
    parent_to_Place_reverse?: PlaceCreateNestedManyWithoutParentInput;
  };

  export type PlaceUncheckedCreateWithoutBirthPlace_to_Person_reverseInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    location_id?: string | null;
    parent_id?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent_to_Place_reverse?: PlaceUncheckedCreateNestedManyWithoutParentInput;
  };

  export type PlaceCreateOrConnectWithoutBirthPlace_to_Person_reverseInput = {
    where: PlaceWhereUniqueInput;
    create: XOR<
      PlaceCreateWithoutBirthPlace_to_Person_reverseInput,
      PlaceUncheckedCreateWithoutBirthPlace_to_Person_reverseInput
    >;
  };

  export type CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput = {
    name?: string | null;
    description?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent?: CorporationCreateNestedOneWithoutParent_to_Corporation_reverseInput;
    location?: LocationCreateNestedOneWithoutLocation_to_Corporation_reverseInput;
    parent_to_Corporation_reverse?: CorporationCreateNestedManyWithoutParentInput;
  };

  export type CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput =
    {
      name?: string | null;
      description?: string | null;
      parent_id?: string | null;
      location_id?: string | null;
      image?: string | null;
      nameVariant?: CorporationCreatenameVariantInput | string[];
      idAuthority_authority?: string | null;
      idAuthority_id?: string | null;
      type?: string | null;
      id: string;
      parent_to_Corporation_reverse?: CorporationUncheckedCreateNestedManyWithoutParentInput;
    };

  export type CorporationCreateOrConnectWithoutMemberOfCorp_to_Person_reverseInput =
    {
      where: CorporationWhereUniqueInput;
      create: XOR<
        CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput,
        CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput
      >;
    };

  export type OccupationUpsertWithWhereUniqueWithoutProfession_to_Person_reverseInput =
    {
      where: OccupationWhereUniqueInput;
      update: XOR<
        OccupationUpdateWithoutProfession_to_Person_reverseInput,
        OccupationUncheckedUpdateWithoutProfession_to_Person_reverseInput
      >;
      create: XOR<
        OccupationCreateWithoutProfession_to_Person_reverseInput,
        OccupationUncheckedCreateWithoutProfession_to_Person_reverseInput
      >;
    };

  export type OccupationUpdateWithWhereUniqueWithoutProfession_to_Person_reverseInput =
    {
      where: OccupationWhereUniqueInput;
      data: XOR<
        OccupationUpdateWithoutProfession_to_Person_reverseInput,
        OccupationUncheckedUpdateWithoutProfession_to_Person_reverseInput
      >;
    };

  export type OccupationUpdateManyWithWhereWithoutProfession_to_Person_reverseInput =
    {
      where: OccupationScalarWhereInput;
      data: XOR<
        OccupationUpdateManyMutationInput,
        OccupationUncheckedUpdateManyWithoutProfession_to_Person_reverseInput
      >;
    };

  export type PlaceUpsertWithoutBirthPlace_to_Person_reverseInput = {
    update: XOR<
      PlaceUpdateWithoutBirthPlace_to_Person_reverseInput,
      PlaceUncheckedUpdateWithoutBirthPlace_to_Person_reverseInput
    >;
    create: XOR<
      PlaceCreateWithoutBirthPlace_to_Person_reverseInput,
      PlaceUncheckedCreateWithoutBirthPlace_to_Person_reverseInput
    >;
    where?: PlaceWhereInput;
  };

  export type PlaceUpdateToOneWithWhereWithoutBirthPlace_to_Person_reverseInput =
    {
      where?: PlaceWhereInput;
      data: XOR<
        PlaceUpdateWithoutBirthPlace_to_Person_reverseInput,
        PlaceUncheckedUpdateWithoutBirthPlace_to_Person_reverseInput
      >;
    };

  export type PlaceUpdateWithoutBirthPlace_to_Person_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    location?: LocationUpdateOneWithoutLocation_to_Place_reverseNestedInput;
    parent?: PlaceUpdateOneWithoutParent_to_Place_reverseNestedInput;
    parent_to_Place_reverse?: PlaceUpdateManyWithoutParentNestedInput;
  };

  export type PlaceUncheckedUpdateWithoutBirthPlace_to_Person_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent_to_Place_reverse?: PlaceUncheckedUpdateManyWithoutParentNestedInput;
  };

  export type CorporationUpsertWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput =
    {
      where: CorporationWhereUniqueInput;
      update: XOR<
        CorporationUpdateWithoutMemberOfCorp_to_Person_reverseInput,
        CorporationUncheckedUpdateWithoutMemberOfCorp_to_Person_reverseInput
      >;
      create: XOR<
        CorporationCreateWithoutMemberOfCorp_to_Person_reverseInput,
        CorporationUncheckedCreateWithoutMemberOfCorp_to_Person_reverseInput
      >;
    };

  export type CorporationUpdateWithWhereUniqueWithoutMemberOfCorp_to_Person_reverseInput =
    {
      where: CorporationWhereUniqueInput;
      data: XOR<
        CorporationUpdateWithoutMemberOfCorp_to_Person_reverseInput,
        CorporationUncheckedUpdateWithoutMemberOfCorp_to_Person_reverseInput
      >;
    };

  export type CorporationUpdateManyWithWhereWithoutMemberOfCorp_to_Person_reverseInput =
    {
      where: CorporationScalarWhereInput;
      data: XOR<
        CorporationUpdateManyMutationInput,
        CorporationUncheckedUpdateManyWithoutMemberOfCorp_to_Person_reverseInput
      >;
    };

  export type CorporationScalarWhereInput = {
    AND?: CorporationScalarWhereInput | CorporationScalarWhereInput[];
    OR?: CorporationScalarWhereInput[];
    NOT?: CorporationScalarWhereInput | CorporationScalarWhereInput[];
    name?: StringNullableFilter<"Corporation"> | string | null;
    description?: StringNullableFilter<"Corporation"> | string | null;
    parent_id?: StringNullableFilter<"Corporation"> | string | null;
    location_id?: StringNullableFilter<"Corporation"> | string | null;
    image?: StringNullableFilter<"Corporation"> | string | null;
    nameVariant?: StringNullableListFilter<"Corporation">;
    idAuthority_authority?: StringNullableFilter<"Corporation"> | string | null;
    idAuthority_id?: StringNullableFilter<"Corporation"> | string | null;
    type?: StringNullableFilter<"Corporation"> | string | null;
    id?: StringFilter<"Corporation"> | string;
  };

  export type PersonCreateWithoutBirthPlaceInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    profession?: OccupationCreateNestedManyWithoutProfession_to_Person_reverseInput;
    memberOfCorp?: CorporationCreateNestedManyWithoutMemberOfCorp_to_Person_reverseInput;
  };

  export type PersonUncheckedCreateWithoutBirthPlaceInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    profession?: OccupationUncheckedCreateNestedManyWithoutProfession_to_Person_reverseInput;
    memberOfCorp?: CorporationUncheckedCreateNestedManyWithoutMemberOfCorp_to_Person_reverseInput;
  };

  export type PersonCreateOrConnectWithoutBirthPlaceInput = {
    where: PersonWhereUniqueInput;
    create: XOR<
      PersonCreateWithoutBirthPlaceInput,
      PersonUncheckedCreateWithoutBirthPlaceInput
    >;
  };

  export type PersonCreateManyBirthPlaceInputEnvelope = {
    data: PersonCreateManyBirthPlaceInput | PersonCreateManyBirthPlaceInput[];
    skipDuplicates?: boolean;
  };

  export type LocationCreateWithoutLocation_to_Place_reverseInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent?: LocationCreateNestedOneWithoutParent_to_Location_reverseInput;
    parent_to_Location_reverse?: LocationCreateNestedManyWithoutParentInput;
    location_to_Corporation_reverse?: CorporationCreateNestedManyWithoutLocationInput;
  };

  export type LocationUncheckedCreateWithoutLocation_to_Place_reverseInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    parent_id?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent_to_Location_reverse?: LocationUncheckedCreateNestedManyWithoutParentInput;
    location_to_Corporation_reverse?: CorporationUncheckedCreateNestedManyWithoutLocationInput;
  };

  export type LocationCreateOrConnectWithoutLocation_to_Place_reverseInput = {
    where: LocationWhereUniqueInput;
    create: XOR<
      LocationCreateWithoutLocation_to_Place_reverseInput,
      LocationUncheckedCreateWithoutLocation_to_Place_reverseInput
    >;
  };

  export type PlaceCreateWithoutParent_to_Place_reverseInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace_to_Person_reverse?: PersonCreateNestedManyWithoutBirthPlaceInput;
    location?: LocationCreateNestedOneWithoutLocation_to_Place_reverseInput;
    parent?: PlaceCreateNestedOneWithoutParent_to_Place_reverseInput;
  };

  export type PlaceUncheckedCreateWithoutParent_to_Place_reverseInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    location_id?: string | null;
    parent_id?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutBirthPlaceInput;
  };

  export type PlaceCreateOrConnectWithoutParent_to_Place_reverseInput = {
    where: PlaceWhereUniqueInput;
    create: XOR<
      PlaceCreateWithoutParent_to_Place_reverseInput,
      PlaceUncheckedCreateWithoutParent_to_Place_reverseInput
    >;
  };

  export type PlaceCreateWithoutParentInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace_to_Person_reverse?: PersonCreateNestedManyWithoutBirthPlaceInput;
    location?: LocationCreateNestedOneWithoutLocation_to_Place_reverseInput;
    parent_to_Place_reverse?: PlaceCreateNestedManyWithoutParentInput;
  };

  export type PlaceUncheckedCreateWithoutParentInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    location_id?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutBirthPlaceInput;
    parent_to_Place_reverse?: PlaceUncheckedCreateNestedManyWithoutParentInput;
  };

  export type PlaceCreateOrConnectWithoutParentInput = {
    where: PlaceWhereUniqueInput;
    create: XOR<
      PlaceCreateWithoutParentInput,
      PlaceUncheckedCreateWithoutParentInput
    >;
  };

  export type PlaceCreateManyParentInputEnvelope = {
    data: PlaceCreateManyParentInput | PlaceCreateManyParentInput[];
    skipDuplicates?: boolean;
  };

  export type PersonUpsertWithWhereUniqueWithoutBirthPlaceInput = {
    where: PersonWhereUniqueInput;
    update: XOR<
      PersonUpdateWithoutBirthPlaceInput,
      PersonUncheckedUpdateWithoutBirthPlaceInput
    >;
    create: XOR<
      PersonCreateWithoutBirthPlaceInput,
      PersonUncheckedCreateWithoutBirthPlaceInput
    >;
  };

  export type PersonUpdateWithWhereUniqueWithoutBirthPlaceInput = {
    where: PersonWhereUniqueInput;
    data: XOR<
      PersonUpdateWithoutBirthPlaceInput,
      PersonUncheckedUpdateWithoutBirthPlaceInput
    >;
  };

  export type PersonUpdateManyWithWhereWithoutBirthPlaceInput = {
    where: PersonScalarWhereInput;
    data: XOR<
      PersonUpdateManyMutationInput,
      PersonUncheckedUpdateManyWithoutBirthPlaceInput
    >;
  };

  export type LocationUpsertWithoutLocation_to_Place_reverseInput = {
    update: XOR<
      LocationUpdateWithoutLocation_to_Place_reverseInput,
      LocationUncheckedUpdateWithoutLocation_to_Place_reverseInput
    >;
    create: XOR<
      LocationCreateWithoutLocation_to_Place_reverseInput,
      LocationUncheckedCreateWithoutLocation_to_Place_reverseInput
    >;
    where?: LocationWhereInput;
  };

  export type LocationUpdateToOneWithWhereWithoutLocation_to_Place_reverseInput =
    {
      where?: LocationWhereInput;
      data: XOR<
        LocationUpdateWithoutLocation_to_Place_reverseInput,
        LocationUncheckedUpdateWithoutLocation_to_Place_reverseInput
      >;
    };

  export type LocationUpdateWithoutLocation_to_Place_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent?: LocationUpdateOneWithoutParent_to_Location_reverseNestedInput;
    parent_to_Location_reverse?: LocationUpdateManyWithoutParentNestedInput;
    location_to_Corporation_reverse?: CorporationUpdateManyWithoutLocationNestedInput;
  };

  export type LocationUncheckedUpdateWithoutLocation_to_Place_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent_to_Location_reverse?: LocationUncheckedUpdateManyWithoutParentNestedInput;
    location_to_Corporation_reverse?: CorporationUncheckedUpdateManyWithoutLocationNestedInput;
  };

  export type PlaceUpsertWithoutParent_to_Place_reverseInput = {
    update: XOR<
      PlaceUpdateWithoutParent_to_Place_reverseInput,
      PlaceUncheckedUpdateWithoutParent_to_Place_reverseInput
    >;
    create: XOR<
      PlaceCreateWithoutParent_to_Place_reverseInput,
      PlaceUncheckedCreateWithoutParent_to_Place_reverseInput
    >;
    where?: PlaceWhereInput;
  };

  export type PlaceUpdateToOneWithWhereWithoutParent_to_Place_reverseInput = {
    where?: PlaceWhereInput;
    data: XOR<
      PlaceUpdateWithoutParent_to_Place_reverseInput,
      PlaceUncheckedUpdateWithoutParent_to_Place_reverseInput
    >;
  };

  export type PlaceUpdateWithoutParent_to_Place_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace_to_Person_reverse?: PersonUpdateManyWithoutBirthPlaceNestedInput;
    location?: LocationUpdateOneWithoutLocation_to_Place_reverseNestedInput;
    parent?: PlaceUpdateOneWithoutParent_to_Place_reverseNestedInput;
  };

  export type PlaceUncheckedUpdateWithoutParent_to_Place_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace_to_Person_reverse?: PersonUncheckedUpdateManyWithoutBirthPlaceNestedInput;
  };

  export type PlaceUpsertWithWhereUniqueWithoutParentInput = {
    where: PlaceWhereUniqueInput;
    update: XOR<
      PlaceUpdateWithoutParentInput,
      PlaceUncheckedUpdateWithoutParentInput
    >;
    create: XOR<
      PlaceCreateWithoutParentInput,
      PlaceUncheckedCreateWithoutParentInput
    >;
  };

  export type PlaceUpdateWithWhereUniqueWithoutParentInput = {
    where: PlaceWhereUniqueInput;
    data: XOR<
      PlaceUpdateWithoutParentInput,
      PlaceUncheckedUpdateWithoutParentInput
    >;
  };

  export type PlaceUpdateManyWithWhereWithoutParentInput = {
    where: PlaceScalarWhereInput;
    data: XOR<
      PlaceUpdateManyMutationInput,
      PlaceUncheckedUpdateManyWithoutParentInput
    >;
  };

  export type PlaceScalarWhereInput = {
    AND?: PlaceScalarWhereInput | PlaceScalarWhereInput[];
    OR?: PlaceScalarWhereInput[];
    NOT?: PlaceScalarWhereInput | PlaceScalarWhereInput[];
    title?: StringNullableFilter<"Place"> | string | null;
    description?: StringNullableFilter<"Place"> | string | null;
    titleVariants?: StringNullableFilter<"Place"> | string | null;
    location_id?: StringNullableFilter<"Place"> | string | null;
    parent_id?: StringNullableFilter<"Place"> | string | null;
    image?: StringNullableFilter<"Place"> | string | null;
    idAuthority_authority?: StringNullableFilter<"Place"> | string | null;
    idAuthority_id?: StringNullableFilter<"Place"> | string | null;
    type?: StringNullableFilter<"Place"> | string | null;
    id?: StringFilter<"Place"> | string;
  };

  export type PersonCreateWithoutMemberOfCorpInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    profession?: OccupationCreateNestedManyWithoutProfession_to_Person_reverseInput;
    birthPlace?: PlaceCreateNestedOneWithoutBirthPlace_to_Person_reverseInput;
  };

  export type PersonUncheckedCreateWithoutMemberOfCorpInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    birthPlace_id?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    profession?: OccupationUncheckedCreateNestedManyWithoutProfession_to_Person_reverseInput;
  };

  export type PersonCreateOrConnectWithoutMemberOfCorpInput = {
    where: PersonWhereUniqueInput;
    create: XOR<
      PersonCreateWithoutMemberOfCorpInput,
      PersonUncheckedCreateWithoutMemberOfCorpInput
    >;
  };

  export type CorporationCreateWithoutParent_to_Corporation_reverseInput = {
    name?: string | null;
    description?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    memberOfCorp_to_Person_reverse?: PersonCreateNestedManyWithoutMemberOfCorpInput;
    parent?: CorporationCreateNestedOneWithoutParent_to_Corporation_reverseInput;
    location?: LocationCreateNestedOneWithoutLocation_to_Corporation_reverseInput;
  };

  export type CorporationUncheckedCreateWithoutParent_to_Corporation_reverseInput =
    {
      name?: string | null;
      description?: string | null;
      parent_id?: string | null;
      location_id?: string | null;
      image?: string | null;
      nameVariant?: CorporationCreatenameVariantInput | string[];
      idAuthority_authority?: string | null;
      idAuthority_id?: string | null;
      type?: string | null;
      id: string;
      memberOfCorp_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutMemberOfCorpInput;
    };

  export type CorporationCreateOrConnectWithoutParent_to_Corporation_reverseInput =
    {
      where: CorporationWhereUniqueInput;
      create: XOR<
        CorporationCreateWithoutParent_to_Corporation_reverseInput,
        CorporationUncheckedCreateWithoutParent_to_Corporation_reverseInput
      >;
    };

  export type LocationCreateWithoutLocation_to_Corporation_reverseInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent?: LocationCreateNestedOneWithoutParent_to_Location_reverseInput;
    parent_to_Location_reverse?: LocationCreateNestedManyWithoutParentInput;
    location_to_Place_reverse?: PlaceCreateNestedManyWithoutLocationInput;
  };

  export type LocationUncheckedCreateWithoutLocation_to_Corporation_reverseInput =
    {
      title?: string | null;
      titleVariants?: string | null;
      description?: string | null;
      image?: string | null;
      parent_id?: string | null;
      idAuthority_authority?: string | null;
      idAuthority_id?: string | null;
      type?: string | null;
      id: string;
      parent_to_Location_reverse?: LocationUncheckedCreateNestedManyWithoutParentInput;
      location_to_Place_reverse?: PlaceUncheckedCreateNestedManyWithoutLocationInput;
    };

  export type LocationCreateOrConnectWithoutLocation_to_Corporation_reverseInput =
    {
      where: LocationWhereUniqueInput;
      create: XOR<
        LocationCreateWithoutLocation_to_Corporation_reverseInput,
        LocationUncheckedCreateWithoutLocation_to_Corporation_reverseInput
      >;
    };

  export type CorporationCreateWithoutParentInput = {
    name?: string | null;
    description?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    memberOfCorp_to_Person_reverse?: PersonCreateNestedManyWithoutMemberOfCorpInput;
    location?: LocationCreateNestedOneWithoutLocation_to_Corporation_reverseInput;
    parent_to_Corporation_reverse?: CorporationCreateNestedManyWithoutParentInput;
  };

  export type CorporationUncheckedCreateWithoutParentInput = {
    name?: string | null;
    description?: string | null;
    location_id?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    memberOfCorp_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutMemberOfCorpInput;
    parent_to_Corporation_reverse?: CorporationUncheckedCreateNestedManyWithoutParentInput;
  };

  export type CorporationCreateOrConnectWithoutParentInput = {
    where: CorporationWhereUniqueInput;
    create: XOR<
      CorporationCreateWithoutParentInput,
      CorporationUncheckedCreateWithoutParentInput
    >;
  };

  export type CorporationCreateManyParentInputEnvelope = {
    data: CorporationCreateManyParentInput | CorporationCreateManyParentInput[];
    skipDuplicates?: boolean;
  };

  export type PersonUpsertWithWhereUniqueWithoutMemberOfCorpInput = {
    where: PersonWhereUniqueInput;
    update: XOR<
      PersonUpdateWithoutMemberOfCorpInput,
      PersonUncheckedUpdateWithoutMemberOfCorpInput
    >;
    create: XOR<
      PersonCreateWithoutMemberOfCorpInput,
      PersonUncheckedCreateWithoutMemberOfCorpInput
    >;
  };

  export type PersonUpdateWithWhereUniqueWithoutMemberOfCorpInput = {
    where: PersonWhereUniqueInput;
    data: XOR<
      PersonUpdateWithoutMemberOfCorpInput,
      PersonUncheckedUpdateWithoutMemberOfCorpInput
    >;
  };

  export type PersonUpdateManyWithWhereWithoutMemberOfCorpInput = {
    where: PersonScalarWhereInput;
    data: XOR<
      PersonUpdateManyMutationInput,
      PersonUncheckedUpdateManyWithoutMemberOfCorpInput
    >;
  };

  export type CorporationUpsertWithoutParent_to_Corporation_reverseInput = {
    update: XOR<
      CorporationUpdateWithoutParent_to_Corporation_reverseInput,
      CorporationUncheckedUpdateWithoutParent_to_Corporation_reverseInput
    >;
    create: XOR<
      CorporationCreateWithoutParent_to_Corporation_reverseInput,
      CorporationUncheckedCreateWithoutParent_to_Corporation_reverseInput
    >;
    where?: CorporationWhereInput;
  };

  export type CorporationUpdateToOneWithWhereWithoutParent_to_Corporation_reverseInput =
    {
      where?: CorporationWhereInput;
      data: XOR<
        CorporationUpdateWithoutParent_to_Corporation_reverseInput,
        CorporationUncheckedUpdateWithoutParent_to_Corporation_reverseInput
      >;
    };

  export type CorporationUpdateWithoutParent_to_Corporation_reverseInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    memberOfCorp_to_Person_reverse?: PersonUpdateManyWithoutMemberOfCorpNestedInput;
    parent?: CorporationUpdateOneWithoutParent_to_Corporation_reverseNestedInput;
    location?: LocationUpdateOneWithoutLocation_to_Corporation_reverseNestedInput;
  };

  export type CorporationUncheckedUpdateWithoutParent_to_Corporation_reverseInput =
    {
      name?: NullableStringFieldUpdateOperationsInput | string | null;
      description?: NullableStringFieldUpdateOperationsInput | string | null;
      parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
      location_id?: NullableStringFieldUpdateOperationsInput | string | null;
      image?: NullableStringFieldUpdateOperationsInput | string | null;
      nameVariant?: CorporationUpdatenameVariantInput | string[];
      idAuthority_authority?:
        | NullableStringFieldUpdateOperationsInput
        | string
        | null;
      idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
      type?: NullableStringFieldUpdateOperationsInput | string | null;
      id?: StringFieldUpdateOperationsInput | string;
      memberOfCorp_to_Person_reverse?: PersonUncheckedUpdateManyWithoutMemberOfCorpNestedInput;
    };

  export type LocationUpsertWithoutLocation_to_Corporation_reverseInput = {
    update: XOR<
      LocationUpdateWithoutLocation_to_Corporation_reverseInput,
      LocationUncheckedUpdateWithoutLocation_to_Corporation_reverseInput
    >;
    create: XOR<
      LocationCreateWithoutLocation_to_Corporation_reverseInput,
      LocationUncheckedCreateWithoutLocation_to_Corporation_reverseInput
    >;
    where?: LocationWhereInput;
  };

  export type LocationUpdateToOneWithWhereWithoutLocation_to_Corporation_reverseInput =
    {
      where?: LocationWhereInput;
      data: XOR<
        LocationUpdateWithoutLocation_to_Corporation_reverseInput,
        LocationUncheckedUpdateWithoutLocation_to_Corporation_reverseInput
      >;
    };

  export type LocationUpdateWithoutLocation_to_Corporation_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent?: LocationUpdateOneWithoutParent_to_Location_reverseNestedInput;
    parent_to_Location_reverse?: LocationUpdateManyWithoutParentNestedInput;
    location_to_Place_reverse?: PlaceUpdateManyWithoutLocationNestedInput;
  };

  export type LocationUncheckedUpdateWithoutLocation_to_Corporation_reverseInput =
    {
      title?: NullableStringFieldUpdateOperationsInput | string | null;
      titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
      description?: NullableStringFieldUpdateOperationsInput | string | null;
      image?: NullableStringFieldUpdateOperationsInput | string | null;
      parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
      idAuthority_authority?:
        | NullableStringFieldUpdateOperationsInput
        | string
        | null;
      idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
      type?: NullableStringFieldUpdateOperationsInput | string | null;
      id?: StringFieldUpdateOperationsInput | string;
      parent_to_Location_reverse?: LocationUncheckedUpdateManyWithoutParentNestedInput;
      location_to_Place_reverse?: PlaceUncheckedUpdateManyWithoutLocationNestedInput;
    };

  export type CorporationUpsertWithWhereUniqueWithoutParentInput = {
    where: CorporationWhereUniqueInput;
    update: XOR<
      CorporationUpdateWithoutParentInput,
      CorporationUncheckedUpdateWithoutParentInput
    >;
    create: XOR<
      CorporationCreateWithoutParentInput,
      CorporationUncheckedCreateWithoutParentInput
    >;
  };

  export type CorporationUpdateWithWhereUniqueWithoutParentInput = {
    where: CorporationWhereUniqueInput;
    data: XOR<
      CorporationUpdateWithoutParentInput,
      CorporationUncheckedUpdateWithoutParentInput
    >;
  };

  export type CorporationUpdateManyWithWhereWithoutParentInput = {
    where: CorporationScalarWhereInput;
    data: XOR<
      CorporationUpdateManyMutationInput,
      CorporationUncheckedUpdateManyWithoutParentInput
    >;
  };

  export type LocationCreateWithoutParent_to_Location_reverseInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent?: LocationCreateNestedOneWithoutParent_to_Location_reverseInput;
    location_to_Place_reverse?: PlaceCreateNestedManyWithoutLocationInput;
    location_to_Corporation_reverse?: CorporationCreateNestedManyWithoutLocationInput;
  };

  export type LocationUncheckedCreateWithoutParent_to_Location_reverseInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    parent_id?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    location_to_Place_reverse?: PlaceUncheckedCreateNestedManyWithoutLocationInput;
    location_to_Corporation_reverse?: CorporationUncheckedCreateNestedManyWithoutLocationInput;
  };

  export type LocationCreateOrConnectWithoutParent_to_Location_reverseInput = {
    where: LocationWhereUniqueInput;
    create: XOR<
      LocationCreateWithoutParent_to_Location_reverseInput,
      LocationUncheckedCreateWithoutParent_to_Location_reverseInput
    >;
  };

  export type LocationCreateWithoutParentInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent_to_Location_reverse?: LocationCreateNestedManyWithoutParentInput;
    location_to_Place_reverse?: PlaceCreateNestedManyWithoutLocationInput;
    location_to_Corporation_reverse?: CorporationCreateNestedManyWithoutLocationInput;
  };

  export type LocationUncheckedCreateWithoutParentInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    parent_to_Location_reverse?: LocationUncheckedCreateNestedManyWithoutParentInput;
    location_to_Place_reverse?: PlaceUncheckedCreateNestedManyWithoutLocationInput;
    location_to_Corporation_reverse?: CorporationUncheckedCreateNestedManyWithoutLocationInput;
  };

  export type LocationCreateOrConnectWithoutParentInput = {
    where: LocationWhereUniqueInput;
    create: XOR<
      LocationCreateWithoutParentInput,
      LocationUncheckedCreateWithoutParentInput
    >;
  };

  export type LocationCreateManyParentInputEnvelope = {
    data: LocationCreateManyParentInput | LocationCreateManyParentInput[];
    skipDuplicates?: boolean;
  };

  export type PlaceCreateWithoutLocationInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace_to_Person_reverse?: PersonCreateNestedManyWithoutBirthPlaceInput;
    parent?: PlaceCreateNestedOneWithoutParent_to_Place_reverseInput;
    parent_to_Place_reverse?: PlaceCreateNestedManyWithoutParentInput;
  };

  export type PlaceUncheckedCreateWithoutLocationInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    parent_id?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    birthPlace_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutBirthPlaceInput;
    parent_to_Place_reverse?: PlaceUncheckedCreateNestedManyWithoutParentInput;
  };

  export type PlaceCreateOrConnectWithoutLocationInput = {
    where: PlaceWhereUniqueInput;
    create: XOR<
      PlaceCreateWithoutLocationInput,
      PlaceUncheckedCreateWithoutLocationInput
    >;
  };

  export type PlaceCreateManyLocationInputEnvelope = {
    data: PlaceCreateManyLocationInput | PlaceCreateManyLocationInput[];
    skipDuplicates?: boolean;
  };

  export type CorporationCreateWithoutLocationInput = {
    name?: string | null;
    description?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    memberOfCorp_to_Person_reverse?: PersonCreateNestedManyWithoutMemberOfCorpInput;
    parent?: CorporationCreateNestedOneWithoutParent_to_Corporation_reverseInput;
    parent_to_Corporation_reverse?: CorporationCreateNestedManyWithoutParentInput;
  };

  export type CorporationUncheckedCreateWithoutLocationInput = {
    name?: string | null;
    description?: string | null;
    parent_id?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
    memberOfCorp_to_Person_reverse?: PersonUncheckedCreateNestedManyWithoutMemberOfCorpInput;
    parent_to_Corporation_reverse?: CorporationUncheckedCreateNestedManyWithoutParentInput;
  };

  export type CorporationCreateOrConnectWithoutLocationInput = {
    where: CorporationWhereUniqueInput;
    create: XOR<
      CorporationCreateWithoutLocationInput,
      CorporationUncheckedCreateWithoutLocationInput
    >;
  };

  export type CorporationCreateManyLocationInputEnvelope = {
    data:
      | CorporationCreateManyLocationInput
      | CorporationCreateManyLocationInput[];
    skipDuplicates?: boolean;
  };

  export type LocationUpsertWithoutParent_to_Location_reverseInput = {
    update: XOR<
      LocationUpdateWithoutParent_to_Location_reverseInput,
      LocationUncheckedUpdateWithoutParent_to_Location_reverseInput
    >;
    create: XOR<
      LocationCreateWithoutParent_to_Location_reverseInput,
      LocationUncheckedCreateWithoutParent_to_Location_reverseInput
    >;
    where?: LocationWhereInput;
  };

  export type LocationUpdateToOneWithWhereWithoutParent_to_Location_reverseInput =
    {
      where?: LocationWhereInput;
      data: XOR<
        LocationUpdateWithoutParent_to_Location_reverseInput,
        LocationUncheckedUpdateWithoutParent_to_Location_reverseInput
      >;
    };

  export type LocationUpdateWithoutParent_to_Location_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent?: LocationUpdateOneWithoutParent_to_Location_reverseNestedInput;
    location_to_Place_reverse?: PlaceUpdateManyWithoutLocationNestedInput;
    location_to_Corporation_reverse?: CorporationUpdateManyWithoutLocationNestedInput;
  };

  export type LocationUncheckedUpdateWithoutParent_to_Location_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    location_to_Place_reverse?: PlaceUncheckedUpdateManyWithoutLocationNestedInput;
    location_to_Corporation_reverse?: CorporationUncheckedUpdateManyWithoutLocationNestedInput;
  };

  export type LocationUpsertWithWhereUniqueWithoutParentInput = {
    where: LocationWhereUniqueInput;
    update: XOR<
      LocationUpdateWithoutParentInput,
      LocationUncheckedUpdateWithoutParentInput
    >;
    create: XOR<
      LocationCreateWithoutParentInput,
      LocationUncheckedCreateWithoutParentInput
    >;
  };

  export type LocationUpdateWithWhereUniqueWithoutParentInput = {
    where: LocationWhereUniqueInput;
    data: XOR<
      LocationUpdateWithoutParentInput,
      LocationUncheckedUpdateWithoutParentInput
    >;
  };

  export type LocationUpdateManyWithWhereWithoutParentInput = {
    where: LocationScalarWhereInput;
    data: XOR<
      LocationUpdateManyMutationInput,
      LocationUncheckedUpdateManyWithoutParentInput
    >;
  };

  export type LocationScalarWhereInput = {
    AND?: LocationScalarWhereInput | LocationScalarWhereInput[];
    OR?: LocationScalarWhereInput[];
    NOT?: LocationScalarWhereInput | LocationScalarWhereInput[];
    title?: StringNullableFilter<"Location"> | string | null;
    titleVariants?: StringNullableFilter<"Location"> | string | null;
    description?: StringNullableFilter<"Location"> | string | null;
    image?: StringNullableFilter<"Location"> | string | null;
    parent_id?: StringNullableFilter<"Location"> | string | null;
    idAuthority_authority?: StringNullableFilter<"Location"> | string | null;
    idAuthority_id?: StringNullableFilter<"Location"> | string | null;
    type?: StringNullableFilter<"Location"> | string | null;
    id?: StringFilter<"Location"> | string;
  };

  export type PlaceUpsertWithWhereUniqueWithoutLocationInput = {
    where: PlaceWhereUniqueInput;
    update: XOR<
      PlaceUpdateWithoutLocationInput,
      PlaceUncheckedUpdateWithoutLocationInput
    >;
    create: XOR<
      PlaceCreateWithoutLocationInput,
      PlaceUncheckedCreateWithoutLocationInput
    >;
  };

  export type PlaceUpdateWithWhereUniqueWithoutLocationInput = {
    where: PlaceWhereUniqueInput;
    data: XOR<
      PlaceUpdateWithoutLocationInput,
      PlaceUncheckedUpdateWithoutLocationInput
    >;
  };

  export type PlaceUpdateManyWithWhereWithoutLocationInput = {
    where: PlaceScalarWhereInput;
    data: XOR<
      PlaceUpdateManyMutationInput,
      PlaceUncheckedUpdateManyWithoutLocationInput
    >;
  };

  export type CorporationUpsertWithWhereUniqueWithoutLocationInput = {
    where: CorporationWhereUniqueInput;
    update: XOR<
      CorporationUpdateWithoutLocationInput,
      CorporationUncheckedUpdateWithoutLocationInput
    >;
    create: XOR<
      CorporationCreateWithoutLocationInput,
      CorporationUncheckedCreateWithoutLocationInput
    >;
  };

  export type CorporationUpdateWithWhereUniqueWithoutLocationInput = {
    where: CorporationWhereUniqueInput;
    data: XOR<
      CorporationUpdateWithoutLocationInput,
      CorporationUncheckedUpdateWithoutLocationInput
    >;
  };

  export type CorporationUpdateManyWithWhereWithoutLocationInput = {
    where: CorporationScalarWhereInput;
    data: XOR<
      CorporationUpdateManyMutationInput,
      CorporationUncheckedUpdateManyWithoutLocationInput
    >;
  };

  export type OccupationCreateManyParentInput = {
    title?: string | null;
    description?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type OccupationUpdateWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent_to_Occupation_reverse?: OccupationUpdateManyWithoutParentNestedInput;
    profession_to_Person_reverse?: PersonUpdateManyWithoutProfessionNestedInput;
  };

  export type OccupationUncheckedUpdateWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent_to_Occupation_reverse?: OccupationUncheckedUpdateManyWithoutParentNestedInput;
    profession_to_Person_reverse?: PersonUncheckedUpdateManyWithoutProfessionNestedInput;
  };

  export type OccupationUncheckedUpdateManyWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type PersonUpdateWithoutProfessionInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace?: PlaceUpdateOneWithoutBirthPlace_to_Person_reverseNestedInput;
    memberOfCorp?: CorporationUpdateManyWithoutMemberOfCorp_to_Person_reverseNestedInput;
  };

  export type PersonUncheckedUpdateWithoutProfessionInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    birthPlace_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    memberOfCorp?: CorporationUncheckedUpdateManyWithoutMemberOfCorp_to_Person_reverseNestedInput;
  };

  export type PersonUncheckedUpdateManyWithoutProfessionInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    birthPlace_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type OccupationUpdateWithoutProfession_to_Person_reverseInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent?: OccupationUpdateOneWithoutParent_to_Occupation_reverseNestedInput;
    parent_to_Occupation_reverse?: OccupationUpdateManyWithoutParentNestedInput;
  };

  export type OccupationUncheckedUpdateWithoutProfession_to_Person_reverseInput =
    {
      title?: NullableStringFieldUpdateOperationsInput | string | null;
      description?: NullableStringFieldUpdateOperationsInput | string | null;
      parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
      idAuthority_authority?:
        | NullableStringFieldUpdateOperationsInput
        | string
        | null;
      idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
      type?: NullableStringFieldUpdateOperationsInput | string | null;
      id?: StringFieldUpdateOperationsInput | string;
      parent_to_Occupation_reverse?: OccupationUncheckedUpdateManyWithoutParentNestedInput;
    };

  export type OccupationUncheckedUpdateManyWithoutProfession_to_Person_reverseInput =
    {
      title?: NullableStringFieldUpdateOperationsInput | string | null;
      description?: NullableStringFieldUpdateOperationsInput | string | null;
      parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
      idAuthority_authority?:
        | NullableStringFieldUpdateOperationsInput
        | string
        | null;
      idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
      type?: NullableStringFieldUpdateOperationsInput | string | null;
      id?: StringFieldUpdateOperationsInput | string;
    };

  export type CorporationUpdateWithoutMemberOfCorp_to_Person_reverseInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent?: CorporationUpdateOneWithoutParent_to_Corporation_reverseNestedInput;
    location?: LocationUpdateOneWithoutLocation_to_Corporation_reverseNestedInput;
    parent_to_Corporation_reverse?: CorporationUpdateManyWithoutParentNestedInput;
  };

  export type CorporationUncheckedUpdateWithoutMemberOfCorp_to_Person_reverseInput =
    {
      name?: NullableStringFieldUpdateOperationsInput | string | null;
      description?: NullableStringFieldUpdateOperationsInput | string | null;
      parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
      location_id?: NullableStringFieldUpdateOperationsInput | string | null;
      image?: NullableStringFieldUpdateOperationsInput | string | null;
      nameVariant?: CorporationUpdatenameVariantInput | string[];
      idAuthority_authority?:
        | NullableStringFieldUpdateOperationsInput
        | string
        | null;
      idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
      type?: NullableStringFieldUpdateOperationsInput | string | null;
      id?: StringFieldUpdateOperationsInput | string;
      parent_to_Corporation_reverse?: CorporationUncheckedUpdateManyWithoutParentNestedInput;
    };

  export type CorporationUncheckedUpdateManyWithoutMemberOfCorp_to_Person_reverseInput =
    {
      name?: NullableStringFieldUpdateOperationsInput | string | null;
      description?: NullableStringFieldUpdateOperationsInput | string | null;
      parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
      location_id?: NullableStringFieldUpdateOperationsInput | string | null;
      image?: NullableStringFieldUpdateOperationsInput | string | null;
      nameVariant?: CorporationUpdatenameVariantInput | string[];
      idAuthority_authority?:
        | NullableStringFieldUpdateOperationsInput
        | string
        | null;
      idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
      type?: NullableStringFieldUpdateOperationsInput | string | null;
      id?: StringFieldUpdateOperationsInput | string;
    };

  export type PersonCreateManyBirthPlaceInput = {
    name?: string | null;
    description?: string | null;
    birthDate?: number | null;
    deathDate?: number | null;
    gender?: string | null;
    personDeceased?: boolean | null;
    externalId?: string | null;
    image?: string | null;
    nameVariant?: PersonCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type PlaceCreateManyParentInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    location_id?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type PersonUpdateWithoutBirthPlaceInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    profession?: OccupationUpdateManyWithoutProfession_to_Person_reverseNestedInput;
    memberOfCorp?: CorporationUpdateManyWithoutMemberOfCorp_to_Person_reverseNestedInput;
  };

  export type PersonUncheckedUpdateWithoutBirthPlaceInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    profession?: OccupationUncheckedUpdateManyWithoutProfession_to_Person_reverseNestedInput;
    memberOfCorp?: CorporationUncheckedUpdateManyWithoutMemberOfCorp_to_Person_reverseNestedInput;
  };

  export type PersonUncheckedUpdateManyWithoutBirthPlaceInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type PlaceUpdateWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace_to_Person_reverse?: PersonUpdateManyWithoutBirthPlaceNestedInput;
    location?: LocationUpdateOneWithoutLocation_to_Place_reverseNestedInput;
    parent_to_Place_reverse?: PlaceUpdateManyWithoutParentNestedInput;
  };

  export type PlaceUncheckedUpdateWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace_to_Person_reverse?: PersonUncheckedUpdateManyWithoutBirthPlaceNestedInput;
    parent_to_Place_reverse?: PlaceUncheckedUpdateManyWithoutParentNestedInput;
  };

  export type PlaceUncheckedUpdateManyWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type CorporationCreateManyParentInput = {
    name?: string | null;
    description?: string | null;
    location_id?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type PersonUpdateWithoutMemberOfCorpInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    profession?: OccupationUpdateManyWithoutProfession_to_Person_reverseNestedInput;
    birthPlace?: PlaceUpdateOneWithoutBirthPlace_to_Person_reverseNestedInput;
  };

  export type PersonUncheckedUpdateWithoutMemberOfCorpInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    birthPlace_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    profession?: OccupationUncheckedUpdateManyWithoutProfession_to_Person_reverseNestedInput;
  };

  export type PersonUncheckedUpdateManyWithoutMemberOfCorpInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    birthDate?: NullableIntFieldUpdateOperationsInput | number | null;
    deathDate?: NullableIntFieldUpdateOperationsInput | number | null;
    gender?: NullableStringFieldUpdateOperationsInput | string | null;
    personDeceased?: NullableBoolFieldUpdateOperationsInput | boolean | null;
    externalId?: NullableStringFieldUpdateOperationsInput | string | null;
    birthPlace_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: PersonUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type CorporationUpdateWithoutParentInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    memberOfCorp_to_Person_reverse?: PersonUpdateManyWithoutMemberOfCorpNestedInput;
    location?: LocationUpdateOneWithoutLocation_to_Corporation_reverseNestedInput;
    parent_to_Corporation_reverse?: CorporationUpdateManyWithoutParentNestedInput;
  };

  export type CorporationUncheckedUpdateWithoutParentInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    memberOfCorp_to_Person_reverse?: PersonUncheckedUpdateManyWithoutMemberOfCorpNestedInput;
    parent_to_Corporation_reverse?: CorporationUncheckedUpdateManyWithoutParentNestedInput;
  };

  export type CorporationUncheckedUpdateManyWithoutParentInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    location_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type LocationCreateManyParentInput = {
    title?: string | null;
    titleVariants?: string | null;
    description?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type PlaceCreateManyLocationInput = {
    title?: string | null;
    description?: string | null;
    titleVariants?: string | null;
    parent_id?: string | null;
    image?: string | null;
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type CorporationCreateManyLocationInput = {
    name?: string | null;
    description?: string | null;
    parent_id?: string | null;
    image?: string | null;
    nameVariant?: CorporationCreatenameVariantInput | string[];
    idAuthority_authority?: string | null;
    idAuthority_id?: string | null;
    type?: string | null;
    id: string;
  };

  export type LocationUpdateWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent_to_Location_reverse?: LocationUpdateManyWithoutParentNestedInput;
    location_to_Place_reverse?: PlaceUpdateManyWithoutLocationNestedInput;
    location_to_Corporation_reverse?: CorporationUpdateManyWithoutLocationNestedInput;
  };

  export type LocationUncheckedUpdateWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    parent_to_Location_reverse?: LocationUncheckedUpdateManyWithoutParentNestedInput;
    location_to_Place_reverse?: PlaceUncheckedUpdateManyWithoutLocationNestedInput;
    location_to_Corporation_reverse?: CorporationUncheckedUpdateManyWithoutLocationNestedInput;
  };

  export type LocationUncheckedUpdateManyWithoutParentInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type PlaceUpdateWithoutLocationInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace_to_Person_reverse?: PersonUpdateManyWithoutBirthPlaceNestedInput;
    parent?: PlaceUpdateOneWithoutParent_to_Place_reverseNestedInput;
    parent_to_Place_reverse?: PlaceUpdateManyWithoutParentNestedInput;
  };

  export type PlaceUncheckedUpdateWithoutLocationInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    birthPlace_to_Person_reverse?: PersonUncheckedUpdateManyWithoutBirthPlaceNestedInput;
    parent_to_Place_reverse?: PlaceUncheckedUpdateManyWithoutParentNestedInput;
  };

  export type PlaceUncheckedUpdateManyWithoutLocationInput = {
    title?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    titleVariants?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  export type CorporationUpdateWithoutLocationInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    memberOfCorp_to_Person_reverse?: PersonUpdateManyWithoutMemberOfCorpNestedInput;
    parent?: CorporationUpdateOneWithoutParent_to_Corporation_reverseNestedInput;
    parent_to_Corporation_reverse?: CorporationUpdateManyWithoutParentNestedInput;
  };

  export type CorporationUncheckedUpdateWithoutLocationInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
    memberOfCorp_to_Person_reverse?: PersonUncheckedUpdateManyWithoutMemberOfCorpNestedInput;
    parent_to_Corporation_reverse?: CorporationUncheckedUpdateManyWithoutParentNestedInput;
  };

  export type CorporationUncheckedUpdateManyWithoutLocationInput = {
    name?: NullableStringFieldUpdateOperationsInput | string | null;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    parent_id?: NullableStringFieldUpdateOperationsInput | string | null;
    image?: NullableStringFieldUpdateOperationsInput | string | null;
    nameVariant?: CorporationUpdatenameVariantInput | string[];
    idAuthority_authority?:
      | NullableStringFieldUpdateOperationsInput
      | string
      | null;
    idAuthority_id?: NullableStringFieldUpdateOperationsInput | string | null;
    type?: NullableStringFieldUpdateOperationsInput | string | null;
    id?: StringFieldUpdateOperationsInput | string;
  };

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number;
  };

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF;
}
