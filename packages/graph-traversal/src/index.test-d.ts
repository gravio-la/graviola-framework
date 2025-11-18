/**
 * Type assertion tests for typed filter patterns
 *
 * These tests verify that the TypeScript types work correctly at compile time.
 * They use the `tsd` library to make type-level assertions.
 *
 * Run with: npm run test:types
 */

import { expectType, expectError, expectAssignable } from "tsd";
import { z } from "zod";
import type {
  TypedIncludePattern,
  TypedSelectPattern,
  TypedOmitPattern,
  TypedGraphTraversalFilterOptions,
} from ".";
import type { PaginationOptions } from "@graviola/edb-core-types";

// ============================================================================
// Test Setup: Define schemas and types
// ============================================================================

const simplePersonSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string(),
});

type SimplePerson = z.infer<typeof simplePersonSchema>;

const personWithRelationsSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string(),
  friends: z.array(
    z.object({
      name: z.string(),
      email: z.string(),
    }),
  ),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
  }),
});

type PersonWithRelations = z.infer<typeof personWithRelationsSchema>;

const deeplyNestedSchema = z.object({
  name: z.string(),
  company: z.object({
    name: z.string(),
    employees: z.array(
      z.object({
        name: z.string(),
        department: z.object({
          name: z.string(),
          budget: z.number(),
        }),
      }),
    ),
  }),
});

type DeeplyNested = z.infer<typeof deeplyNestedSchema>;

// ============================================================================
// TypedIncludePattern Tests
// ============================================================================

// ✓ Should accept valid boolean values for properties
expectAssignable<TypedIncludePattern<SimplePerson>>({
  name: true,
  age: false,
});

// ✓ Should accept empty object
expectAssignable<TypedIncludePattern<SimplePerson>>({});

// ✗ Should reject invalid property names
expectError<TypedIncludePattern<SimplePerson>>({
  invalidKey: true,
});

// ✗ Should reject typos in property names
expectError<TypedIncludePattern<SimplePerson>>({
  naem: true, // typo: should be "name"
});

// ✓ Should accept pagination options for array properties
expectAssignable<TypedIncludePattern<PersonWithRelations>>({
  friends: {
    take: 10,
    skip: 5,
  },
});

// ✓ Should accept orderBy in pagination
expectAssignable<TypedIncludePattern<PersonWithRelations>>({
  friends: {
    take: 10,
    orderBy: { name: "asc" },
  },
});

// ✓ Should accept nested include for array items
expectAssignable<TypedIncludePattern<PersonWithRelations>>({
  friends: {
    take: 10,
    include: {
      name: true,
      email: true,
    },
  },
});

// ✗ Should reject invalid nested include keys for array items
expectError<TypedIncludePattern<PersonWithRelations>>({
  friends: {
    take: 10,
    include: {
      name: true,
      invalidKey: true,
    },
  },
});

// ✓ Should accept nested include for object properties
expectAssignable<TypedIncludePattern<PersonWithRelations>>({
  address: {
    include: {
      city: true,
      country: true,
    },
  },
});

// ✗ Should reject invalid nested include keys for objects
expectError<TypedIncludePattern<PersonWithRelations>>({
  address: {
    include: {
      city: true,
      invalidKey: true,
    },
  },
});

// ✓ Should support deeply nested includes
expectAssignable<TypedIncludePattern<DeeplyNested>>({
  company: {
    include: {
      name: true,
      employees: {
        take: 5,
        include: {
          name: true,
          department: {
            include: {
              name: true,
              budget: true,
            },
          },
        },
      },
    },
  },
});

// ✗ Should reject invalid keys in deeply nested structures
expectError<TypedIncludePattern<DeeplyNested>>({
  company: {
    include: {
      employees: {
        include: {
          department: {
            include: {
              invalidField: true,
            },
          },
        },
      },
    },
  },
});

// ✓ Should accept boolean for object properties
expectAssignable<TypedIncludePattern<PersonWithRelations>>({
  address: true,
});

// ✓ Should accept boolean for array properties
expectAssignable<TypedIncludePattern<PersonWithRelations>>({
  friends: true,
});

// ✓ Should allow primitives to only be boolean (not objects)
expectAssignable<TypedIncludePattern<SimplePerson>>({
  name: true,
  age: false,
});

// ✗ Should reject objects for primitive properties
expectError<TypedIncludePattern<SimplePerson>>({
  name: {
    include: {},
  },
});

// ============================================================================
// TypedSelectPattern Tests
// ============================================================================

// ✓ Should accept valid keys with boolean values
expectAssignable<TypedSelectPattern<SimplePerson>>({
  name: true,
  age: true,
});

// ✓ Should accept partial selection
expectAssignable<TypedSelectPattern<SimplePerson>>({
  name: true,
});

// ✓ Should accept empty object
expectAssignable<TypedSelectPattern<SimplePerson>>({});

// ✗ Should reject invalid keys
expectError<TypedSelectPattern<SimplePerson>>({
  invalidKey: true,
});

// ✗ Should reject non-boolean values
expectError<TypedSelectPattern<SimplePerson>>({
  name: true,
  age: "true",
});

// ✓ Should work with nested types
expectAssignable<TypedSelectPattern<PersonWithRelations>>({
  name: true,
  friends: true,
  address: true,
});

// ============================================================================
// TypedOmitPattern Tests
// ============================================================================

// ✓ Should accept array of valid keys
expectAssignable<TypedOmitPattern<SimplePerson>>(["name", "age"]);

// ✓ Should accept single key
expectAssignable<TypedOmitPattern<SimplePerson>>(["email"]);

// ✓ Should accept empty array
expectAssignable<TypedOmitPattern<SimplePerson>>([]);

// ✗ Should reject invalid keys
expectError<TypedOmitPattern<SimplePerson>>(["name", "invalidKey"]);

// ✗ Should reject non-array values
expectError<TypedOmitPattern<SimplePerson>>("name");

// ✓ Should work with nested types
expectAssignable<TypedOmitPattern<PersonWithRelations>>(["friends", "address"]);

// ============================================================================
// TypedGraphTraversalFilterOptions Tests
// ============================================================================

// ✓ Should accept valid select, include, and omit
expectAssignable<TypedGraphTraversalFilterOptions<SimplePerson>>({
  select: { name: true, age: true },
});

expectAssignable<TypedGraphTraversalFilterOptions<SimplePerson>>({
  include: { name: true },
});

expectAssignable<TypedGraphTraversalFilterOptions<SimplePerson>>({
  omit: ["email"],
});

// ✓ Should accept other filter options
expectAssignable<TypedGraphTraversalFilterOptions<SimplePerson>>({
  select: { name: true },
  includeRelationsByDefault: false,
  defaultPaginationLimit: 10,
  excludeJsonLdMetadata: true,
});

// ✓ Should accept complex combinations
expectAssignable<TypedGraphTraversalFilterOptions<PersonWithRelations>>({
  include: {
    friends: {
      take: 10,
      include: {
        name: true,
        email: true,
      },
    },
    address: true,
  },
  includeRelationsByDefault: false,
});

// ✗ Should reject invalid keys in select
expectError<TypedGraphTraversalFilterOptions<SimplePerson>>({
  select: {
    invalidKey: true,
  },
});

// ✗ Should reject invalid keys in include
expectError<TypedGraphTraversalFilterOptions<SimplePerson>>({
  include: {
    invalidKey: true,
  },
});

// ✗ Should reject invalid keys in omit
expectError<TypedGraphTraversalFilterOptions<SimplePerson>>({
  omit: ["invalidKey"],
});

// ============================================================================
// Integration Tests with normalizeSchema-like function signatures
// ============================================================================

// Simulate function that accepts typed options
function mockNormalizeSchema<T = any>(
  schema: any,
  options: TypedGraphTraversalFilterOptions<T> = {},
): void {
  // Mock implementation
}

// ✓ Should work with explicit type parameter
mockNormalizeSchema<SimplePerson>({}, { select: { name: true } });

// ✓ Should work without type parameter (defaults to any)
mockNormalizeSchema({}, { select: { anyKey: true } });

// ✗ Should reject invalid keys with explicit type
expectError(
  mockNormalizeSchema<SimplePerson>(
    {},
    {
      select: {
        invalidKey: true,
      },
    },
  ),
);

// ============================================================================
// Edge Cases
// ============================================================================

// ✓ Should handle optional properties correctly
const schemaWithOptional = z.object({
  required: z.string(),
  optional: z.string().optional(),
});

type WithOptional = z.infer<typeof schemaWithOptional>;

expectAssignable<TypedIncludePattern<WithOptional>>({
  required: true,
  optional: true,
});

// ✓ Should handle nullable properties
const schemaWithNullable = z.object({
  name: z.string(),
  nickname: z.string().nullable(),
});

type WithNullable = z.infer<typeof schemaWithNullable>;

expectAssignable<TypedSelectPattern<WithNullable>>({
  name: true,
  nickname: true,
});

// ✓ Should be assignable to base GraphTraversalFilterOptions
expectAssignable<TypedGraphTraversalFilterOptions<SimplePerson>>({
  select: { name: true },
  includeRelationsByDefault: false,
});

// ✓ Should work with union types in arrays
const schemaWithUnion = z.object({
  items: z.array(z.union([z.string(), z.number()])),
});

type WithUnion = z.infer<typeof schemaWithUnion>;

expectAssignable<TypedIncludePattern<WithUnion>>({
  items: {
    take: 10,
  },
});

// ============================================================================
// Real-world scenario: Complete filtering workflow
// ============================================================================

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  profile: z.object({
    bio: z.string(),
    avatar: z.string(),
    website: z.string().optional(),
  }),
  posts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      content: z.string(),
      tags: z.array(z.string()),
      comments: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
          author: z.string(),
        }),
      ),
    }),
  ),
  followers: z.array(z.object({ id: z.string(), username: z.string() })),
});

type User = z.infer<typeof userSchema>;

// ✓ Real-world use case: Select only public fields
expectAssignable<TypedGraphTraversalFilterOptions<User>>({
  select: {
    username: true,
    profile: true,
    posts: true,
  },
});

// ✓ Real-world use case: Include with pagination and nested filtering
expectAssignable<TypedGraphTraversalFilterOptions<User>>({
  include: {
    posts: {
      take: 10,
      skip: 0,
      orderBy: { title: "asc" },
      include: {
        title: true,
        content: true,
        comments: {
          take: 5,
          include: {
            text: true,
            author: true,
          },
        },
      },
    },
    followers: {
      take: 20,
    },
  },
  includeRelationsByDefault: false,
});

// ✓ Real-world use case: Omit sensitive fields
expectAssignable<TypedGraphTraversalFilterOptions<User>>({
  omit: ["email"],
  includeRelationsByDefault: true,
});

// ✗ Real-world use case: Should catch typos in nested paths
expectError<TypedGraphTraversalFilterOptions<User>>({
  include: {
    posts: {
      include: {
        comments: {
          include: {
            autor: true,
          },
        },
      },
    },
  },
});
