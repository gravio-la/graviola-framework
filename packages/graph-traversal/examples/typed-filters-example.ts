/**
 * Example demonstrating type-safe filter patterns with Zod schemas
 *
 * This file shows how to use the typed filter patterns in a real-world scenario.
 * Note: This is a demonstration file and won't be included in the package distribution.
 */

import { z } from "zod";
import type {
  TypedIncludePattern,
  TypedSelectPattern,
  TypedOmitPattern,
  TypedGraphTraversalFilterOptions,
} from "../src/typed-filters";

// ============================================================================
// 1. Define Your Domain Models with Zod
// ============================================================================

const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string(),
  postalCode: z.string().optional(),
});

const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  email: z.string(),
  address: AddressSchema,
  friends: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }),
  ),
});

const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  author: PersonSchema,
  tags: z.array(z.string()),
  comments: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      author: z.object({
        name: z.string(),
        email: z.string(),
      }),
      createdAt: z.string(),
    }),
  ),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
});

// ============================================================================
// 2. Infer TypeScript Types from Zod Schemas
// ============================================================================

type Person = z.infer<typeof PersonSchema>;
type BlogPost = z.infer<typeof BlogPostSchema>;

// ============================================================================
// 3. Type-Safe Include Patterns
// ============================================================================

// Example 1: Simple include with pagination
const simpleInclude: TypedIncludePattern<Person> = {
  friends: {
    take: 10,
    skip: 0,
  },
};

// Example 2: Include with nested selection
const nestedInclude: TypedIncludePattern<Person> = {
  address: {
    include: {
      city: true,
      country: true,
      // street: false,  // Can also explicitly exclude
    },
  },
  friends: {
    take: 5,
    include: {
      name: true,
      email: true,
    },
  },
};

// Example 3: Complex nested includes for blog posts
const blogPostInclude: TypedIncludePattern<BlogPost> = {
  author: {
    include: {
      name: true,
      email: true,
      address: {
        include: {
          city: true,
          country: true,
        },
      },
    },
  },
  comments: {
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      text: true,
      author: {
        include: {
          name: true,
        },
      },
    },
  },
};

// ============================================================================
// 4. Type-Safe Select Patterns
// ============================================================================

// Example 1: Select specific fields
const personSelect: TypedSelectPattern<Person> = {
  name: true,
  email: true,
  age: true,
};

// Example 2: Select for public profile (exclude sensitive data)
const publicProfileSelect: TypedSelectPattern<Person> = {
  name: true,
  // email: false,  // Not selecting email for privacy
  address: true,
};

// Example 3: Select for blog post preview
const blogPostPreviewSelect: TypedSelectPattern<BlogPost> = {
  id: true,
  title: true,
  author: true, // Will include full author object
  publishedAt: true,
  // content: false,  // Don't include full content in preview
  // comments: false, // Don't include comments in preview
};

// ============================================================================
// 5. Type-Safe Omit Patterns
// ============================================================================

// Example 1: Omit sensitive fields
const personOmit: TypedOmitPattern<Person> = ["email"];

// Example 2: Omit multiple fields
const blogPostOmit: TypedOmitPattern<BlogPost> = ["content", "updatedAt"];

// Example 3: Omit for public API
const publicBlogPostOmit: TypedOmitPattern<BlogPost> = [
  "author", // Will fetch author separately
  "comments", // Will fetch comments separately
];

// ============================================================================
// 6. Complete Filter Options
// ============================================================================

// Example 1: Combine select and include
const combinedFilters1: TypedGraphTraversalFilterOptions<Person> = {
  select: {
    name: true,
    friends: true,
  },
  include: {
    friends: {
      take: 10,
      include: {
        name: true,
        email: true,
      },
    },
  },
};

// Example 2: Use omit with other options
const combinedFilters2: TypedGraphTraversalFilterOptions<Person> = {
  omit: ["email"],
  include: {
    address: true,
    friends: {
      take: 5,
    },
  },
  includeRelationsByDefault: false,
};

// Example 3: Complex blog post filters
const blogPostFilters: TypedGraphTraversalFilterOptions<BlogPost> = {
  include: {
    author: {
      include: {
        name: true,
        email: true,
        friends: false, // Explicitly exclude friends of author
      },
    },
    comments: {
      take: 10,
      skip: 0,
      orderBy: { createdAt: "desc" },
      include: {
        text: true,
        author: {
          include: {
            name: true,
          },
        },
      },
    },
    tags: true,
  },
  omit: ["updatedAt"],
  includeRelationsByDefault: false,
  defaultPaginationLimit: 20,
};

// ============================================================================
// 7. Type-Safe Function Usage
// ============================================================================

/**
 * Example function that accepts typed filter options
 */
function processPersonData(options: TypedGraphTraversalFilterOptions<Person>) {
  // options.include is type-safe - only valid Person keys allowed
  // options.select is type-safe - only valid Person keys allowed
  // options.omit is type-safe - only valid Person keys allowed

  console.log("Processing person data with filters:", options);

  // In real usage, you would pass this to normalizeSchema or extractFromGraph:
  // const normalized = normalizeSchema<Person>(jsonSchema, options);
  // const result = extractFromGraph<Person>(iri, dataset, jsonSchema, options);
}

/**
 * Example function with generic type parameter
 */
function fetchWithFilters<T>(
  schema: z.ZodType<T>,
  filters: TypedGraphTraversalFilterOptions<T>,
): T | null {
  // This function demonstrates how to create reusable utilities
  // that work with any Zod schema

  console.log("Fetching with filters:", filters);

  // In real usage:
  // const jsonSchema = zodToJsonSchema(schema);
  // return extractFromGraph<T>(iri, dataset, jsonSchema, filters);

  return null;
}

// ============================================================================
// 8. Usage Examples
// ============================================================================

// Use with the Person type
processPersonData({
  select: { name: true, age: true },
  include: {
    friends: { take: 10 },
  },
});

// Use with generic function
const person = fetchWithFilters(PersonSchema, {
  omit: ["email"],
  include: {
    address: true,
  },
});

const blogPost = fetchWithFilters(BlogPostSchema, {
  include: {
    author: {
      include: {
        name: true,
      },
    },
    comments: {
      take: 20,
    },
  },
  omit: ["updatedAt"],
});

// ============================================================================
// 9. Error Examples (These would cause TypeScript errors)
// ============================================================================

/*
// ❌ Invalid property name
const invalidInclude: TypedIncludePattern<Person> = {
  invalidKey: true,  // Error: Property 'invalidKey' does not exist
};

// ❌ Typo in property name
const typoInclude: TypedIncludePattern<Person> = {
  naem: true,  // Error: Property 'naem' does not exist (should be 'name')
};

// ❌ Invalid nested property
const invalidNestedInclude: TypedIncludePattern<Person> = {
  address: {
    include: {
      invalidField: true,  // Error: Property 'invalidField' does not exist
    },
  },
};

// ❌ Invalid key in select
const invalidSelect: TypedSelectPattern<Person> = {
  invalidKey: true,  // Error: Property 'invalidKey' does not exist
};

// ❌ Invalid key in omit
const invalidOmit: TypedOmitPattern<Person> = [
  "invalidKey",  // Error: Type '"invalidKey"' is not assignable
];

// ❌ Non-boolean value in select
const invalidSelectValue: TypedSelectPattern<Person> = {
  name: "true",  // Error: Type 'string' is not assignable to type 'boolean'
};
*/

// ============================================================================
// 10. Real-World Integration Example
// ============================================================================

/**
 * Example API endpoint handler
 */
async function getBlogPost(postId: string) {
  // Define filters based on API requirements
  const filters: TypedGraphTraversalFilterOptions<BlogPost> = {
    include: {
      author: {
        include: {
          name: true,
          email: true,
          address: {
            include: {
              city: true,
              country: true,
            },
          },
        },
      },
      comments: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          text: true,
          author: {
            include: {
              name: true,
            },
          },
        },
      },
      tags: true,
    },
    omit: ["updatedAt"],
  };

  // In real usage:
  // const blogPostJsonSchema = zodToJsonSchema(BlogPostSchema);
  // const result = await extractFromGraph<BlogPost>(
  //   `http://example.com/posts/${postId}`,
  //   dataset,
  //   blogPostJsonSchema,
  //   filters
  // );

  return { filters }; // Mock return
}

// Export for documentation purposes
export {
  simpleInclude,
  nestedInclude,
  blogPostInclude,
  personSelect,
  publicProfileSelect,
  blogPostPreviewSelect,
  personOmit,
  blogPostOmit,
  combinedFilters1,
  combinedFilters2,
  blogPostFilters,
  processPersonData,
  fetchWithFilters,
  getBlogPost,
};

console.log("Type-safe filter patterns example loaded successfully!");
