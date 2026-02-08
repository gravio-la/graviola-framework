/**
 * Comprehensive examples of building type-safe SPARQL queries
 *
 * This file demonstrates real-world use cases for the type-safe
 * SPARQL query builder with Zod schemas, complex filters, and validation.
 */

import { z } from "zod";
import { buildTypedSPARQLQuery } from "../src/schema2sparql/buildTypedSPARQLQuery";
import type { JSONSchema7 } from "json-schema";

// ============================================================================
// Example 1: User Management System
// ============================================================================

const UserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  age: z.number().min(18),
  verified: z.boolean(),
  role: z.enum(["admin", "user", "moderator"]),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    bio: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
  friends: z.array(
    z.object({
      username: z.string(),
      email: z.string(),
    }),
  ),
  createdAt: z.date(),
  lastLogin: z.date().optional(),
});

type User = z.infer<typeof UserSchema>;

// Convert to JSON Schema (in practice, use zod-to-json-schema)
const userJSONSchema: JSONSchema7 = {
  type: "object",
  properties: {
    username: { type: "string" },
    email: { type: "string" },
    age: { type: "number" },
    verified: { type: "boolean" },
    role: { type: "string", enum: ["admin", "user", "moderator"] },
    profile: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        bio: { type: "string" },
        avatar: { type: "string" },
      },
    },
    friends: {
      type: "array",
      items: {
        type: "object",
        properties: {
          username: { type: "string" },
          email: { type: "string" },
        },
      },
    },
    createdAt: { type: "string", format: "date-time" },
    lastLogin: { type: "string", format: "date-time" },
  },
};

// Use Case 1.1: Get verified adult users
const verifiedAdultsQuery = buildTypedSPARQLQuery<User>(
  "http://example.com/user/123",
  userJSONSchema,
  {
    select: {
      username: true,
      email: true,
      age: true,
      profile: true,
    },
    where: {
      age: { gte: 18 },
      verified: { equals: true },
    },
    filterValidationMode: "throw",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("Verified Adults Query:");
console.log(verifiedAdultsQuery.query);
console.log("\n");

// Use Case 1.2: Get user with filtered friends
const userWithFriendsQuery = buildTypedSPARQLQuery<User>(
  "http://example.com/user/123",
  userJSONSchema,
  {
    include: {
      profile: true,
      friends: {
        take: 20,
        orderBy: { username: "asc" },
        include: {
          username: true,
          email: true,
        },
      },
    },
    where: {
      verified: true,
    },
    filterValidationMode: "warn",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("User with Friends Query:");
console.log(userWithFriendsQuery.query);
console.log("\n");

// Use Case 1.3: Admin users search
const adminSearchQuery = buildTypedSPARQLQuery<User>(
  "http://example.com/user/123",
  userJSONSchema,
  {
    select: {
      username: true,
      email: true,
      role: true,
    },
    where: {
      role: { equals: "admin" },
      email: { endsWith: "@company.com" },
    },
    filterValidationMode: "throw",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("Admin Search Query:");
console.log(adminSearchQuery.query);
console.log("\n");

// ============================================================================
// Example 2: E-Commerce Product Catalog
// ============================================================================

const ProductSchema = z.object({
  name: z.string(),
  sku: z.string(),
  price: z.number().positive(),
  stock: z.number().nonnegative(),
  inStock: z.boolean(),
  category: z.object({
    name: z.string(),
    slug: z.string(),
  }),
  tags: z.array(z.string()),
  reviews: z.array(
    z.object({
      rating: z.number().min(1).max(5),
      comment: z.string(),
      author: z.object({
        name: z.string(),
      }),
      createdAt: z.date(),
    }),
  ),
  manufacturer: z.object({
    name: z.string(),
    country: z.string(),
  }),
});

type Product = z.infer<typeof ProductSchema>;

const productJSONSchema: JSONSchema7 = {
  type: "object",
  properties: {
    name: { type: "string" },
    sku: { type: "string" },
    price: { type: "number" },
    stock: { type: "number" },
    inStock: { type: "boolean" },
    category: {
      type: "object",
      properties: {
        name: { type: "string" },
        slug: { type: "string" },
      },
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    reviews: {
      type: "array",
      items: {
        type: "object",
        properties: {
          rating: { type: "number" },
          comment: { type: "string" },
          author: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
    manufacturer: {
      type: "object",
      properties: {
        name: { type: "string" },
        country: { type: "string" },
      },
    },
  },
};

// Use Case 2.1: Find affordable in-stock products
const affordableProductsQuery = buildTypedSPARQLQuery<Product>(
  "http://example.com/product/456",
  productJSONSchema,
  {
    select: {
      name: true,
      price: true,
      stock: true,
      category: true,
    },
    where: {
      price: { lte: 100 },
      inStock: true,
      stock: { gt: 0 },
    },
    filterValidationMode: "throw",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("Affordable Products Query:");
console.log(affordableProductsQuery.query);
console.log("\n");

// Use Case 2.2: Product with top reviews
const productWithReviewsQuery = buildTypedSPARQLQuery<Product>(
  "http://example.com/product/456",
  productJSONSchema,
  {
    include: {
      category: true,
      manufacturer: true,
      reviews: {
        take: 10,
        orderBy: { rating: "desc" },
        include: {
          rating: true,
          comment: true,
          author: {
            include: {
              name: true,
            },
          },
        },
      },
    },
    where: {
      inStock: true,
    },
    filterValidationMode: "throw",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("Product with Reviews Query:");
console.log(productWithReviewsQuery.query);
console.log("\n");

// Use Case 2.3: Search products by price range and category
const categorySearchQuery = buildTypedSPARQLQuery<Product>(
  "http://example.com/product/456",
  productJSONSchema,
  {
    select: {
      name: true,
      price: true,
      category: true,
    },
    where: {
      price: { gte: 50, lte: 200 },
      inStock: true,
    },
    filterValidationMode: "throw",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("Category Search Query:");
console.log(categorySearchQuery.query);
console.log("\n");

// ============================================================================
// Example 3: Social Media Blog Platform
// ============================================================================

const BlogPostSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  published: z.boolean(),
  publishedAt: z.date().optional(),
  viewCount: z.number().default(0),
  likeCount: z.number().default(0),
  author: z.object({
    username: z.string(),
    displayName: z.string(),
    email: z.string().email(),
    avatar: z.string().url().optional(),
  }),
  tags: z.array(z.string()),
  comments: z.array(
    z.object({
      text: z.string(),
      author: z.object({
        username: z.string(),
        displayName: z.string(),
      }),
      createdAt: z.date(),
      edited: z.boolean(),
    }),
  ),
  category: z.object({
    name: z.string(),
    slug: z.string(),
  }),
});

type BlogPost = z.infer<typeof BlogPostSchema>;

const blogPostJSONSchema: JSONSchema7 = {
  type: "object",
  properties: {
    title: { type: "string" },
    slug: { type: "string" },
    content: { type: "string" },
    excerpt: { type: "string" },
    published: { type: "boolean" },
    publishedAt: { type: "string", format: "date-time" },
    viewCount: { type: "number" },
    likeCount: { type: "number" },
    author: {
      type: "object",
      properties: {
        username: { type: "string" },
        displayName: { type: "string" },
        email: { type: "string" },
        avatar: { type: "string" },
      },
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    comments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          author: {
            type: "object",
            properties: {
              username: { type: "string" },
              displayName: { type: "string" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          edited: { type: "boolean" },
        },
      },
    },
    category: {
      type: "object",
      properties: {
        name: { type: "string" },
        slug: { type: "string" },
      },
    },
  },
};

// Use Case 3.1: Get popular published posts
const popularPostsQuery = buildTypedSPARQLQuery<BlogPost>(
  "http://example.com/blog/post/789",
  blogPostJSONSchema,
  {
    select: {
      title: true,
      excerpt: true,
      publishedAt: true,
      viewCount: true,
      likeCount: true,
      author: true,
    },
    where: {
      published: true,
      viewCount: { gte: 100 },
      likeCount: { gte: 10 },
    },
    filterValidationMode: "throw",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("Popular Posts Query:");
console.log(popularPostsQuery.query);
console.log("\n");

// Use Case 3.2: Full blog post with comments
const fullBlogPostQuery = buildTypedSPARQLQuery<BlogPost>(
  "http://example.com/blog/post/789",
  blogPostJSONSchema,
  {
    include: {
      author: {
        include: {
          username: true,
          displayName: true,
          avatar: true,
        },
      },
      category: true,
      comments: {
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          text: true,
          author: {
            include: {
              username: true,
              displayName: true,
            },
          },
          createdAt: true,
        },
      },
    },
    where: {
      published: true,
    },
    filterValidationMode: "throw",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("Full Blog Post Query:");
console.log(fullBlogPostQuery.query);
console.log("\n");

// Use Case 3.3: Complex filter - recent popular posts
const recentPopularQuery = buildTypedSPARQLQuery<BlogPost>(
  "http://example.com/blog/post/789",
  blogPostJSONSchema,
  {
    select: {
      title: true,
      slug: true,
      excerpt: true,
      viewCount: true,
      author: true,
    },
    where: {
      AND: [
        { published: true },
        {
          OR: [{ viewCount: { gte: 500 } }, { likeCount: { gte: 50 } }],
        },
      ],
    },
    filterValidationMode: "throw",
    prefixMap: { "": "http://example.com/" },
  },
);

console.log("Recent Popular Query:");
console.log(recentPopularQuery.query);
console.log("\n");

// ============================================================================
// Example 4: Error Handling and Validation
// ============================================================================

// Example 4.1: Validation catches invalid filters
try {
  buildTypedSPARQLQuery<User>("http://example.com/user/123", userJSONSchema, {
    where: {
      email: { gt: 20 } as any, // Invalid: gt on string
    },
    filterValidationMode: "throw",
  });
} catch (error) {
  console.log("Caught validation error:");
  console.log(error);
  console.log("\n");
}

// Example 4.2: Warning mode doesn't throw
const queryWithWarning = buildTypedSPARQLQuery<User>(
  "http://example.com/user/123",
  userJSONSchema,
  {
    where: {
      age: { contains: "test" } as any, // Invalid but warns
    },
    filterValidationMode: "warn",
  },
);

console.log("Query with warning generated successfully");
console.log("\n");

// ============================================================================
// Example 5: Practical Helper Functions
// ============================================================================

/**
 * Build a search query for users
 */
function buildUserSearchQuery(
  searchTerm: string,
  options: {
    minAge?: number;
    maxAge?: number;
    verified?: boolean;
    roles?: Array<"admin" | "user" | "moderator">;
  } = {},
) {
  return buildTypedSPARQLQuery<User>(
    "http://example.com/user/search",
    userJSONSchema,
    {
      select: {
        username: true,
        email: true,
        age: true,
        role: true,
      },
      where: {
        ...(searchTerm && {
          OR: [
            { username: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
          ],
        }),
        ...(options.minAge && { age: { gte: options.minAge } }),
        ...(options.maxAge && { age: { lte: options.maxAge } }),
        ...(options.verified !== undefined && { verified: options.verified }),
        ...(options.roles &&
          options.roles.length > 0 && {
            role: { in: options.roles },
          }),
      },
      filterValidationMode: "throw",
      prefixMap: { "": "http://example.com/" },
    },
  );
}

const userSearchResult = buildUserSearchQuery("john", {
  minAge: 18,
  verified: true,
  roles: ["user", "admin"],
});

console.log("Dynamic User Search Query:");
console.log(userSearchResult.query);
console.log("\n");

/**
 * Build a product catalog query with dynamic filters
 */
function buildProductCatalogQuery(filters: {
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  categoryName?: string;
  sortBy?: "price" | "name";
  limit?: number;
}) {
  return buildTypedSPARQLQuery<Product>(
    "http://example.com/product/catalog",
    productJSONSchema,
    {
      select: {
        name: true,
        price: true,
        stock: true,
        category: true,
      },
      where: {
        ...(filters.minPrice && { price: { gte: filters.minPrice } }),
        ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
        ...(filters.inStockOnly && { inStock: true, stock: { gt: 0 } }),
      },
      filterValidationMode: "throw",
      prefixMap: { "": "http://example.com/" },
    },
  );
}

const catalogQuery = buildProductCatalogQuery({
  minPrice: 50,
  maxPrice: 200,
  inStockOnly: true,
  limit: 20,
});

console.log("Product Catalog Query:");
console.log(catalogQuery.query);
console.log("\n");

export {
  verifiedAdultsQuery,
  userWithFriendsQuery,
  adminSearchQuery,
  affordableProductsQuery,
  productWithReviewsQuery,
  categorySearchQuery,
  popularPostsQuery,
  fullBlogPostQuery,
  recentPopularQuery,
  buildUserSearchQuery,
  buildProductCatalogQuery,
};
