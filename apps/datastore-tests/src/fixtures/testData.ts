import { entityIRI } from "../schema/testSchema";

/** Minimal entity shape returned/accepted by all stores */
export type CategoryData = {
  "@id": string;
  "@type"?: string;
  name: string;
  description?: string;
};

export type TagData = {
  "@id": string;
  "@type"?: string;
  name: string;
  description?: string;
};

export type ItemData = {
  "@id": string;
  "@type"?: string;
  name: string;
  description?: string;
  price?: number;
  isAvailable?: boolean;
  category?: { "@id": string };
  tags?: Array<{ "@id": string }>;
};

// ─── Factories ────────────────────────────────────────────────────────────────

export const makeCategory = (
  id: string,
  overrides: Partial<CategoryData> = {},
): CategoryData => ({
  "@id": entityIRI("Category", id),
  name: `Category ${id}`,
  description: `Description of category ${id}`,
  ...overrides,
});

export const makeTag = (
  id: string,
  overrides: Partial<TagData> = {},
): TagData => ({
  "@id": entityIRI("Tag", id),
  name: `Tag ${id}`,
  description: `Description of tag ${id}`,
  ...overrides,
});

export const makeItem = (
  id: string,
  overrides: Partial<ItemData> = {},
): ItemData => ({
  "@id": entityIRI("Item", id),
  name: `Item ${id}`,
  description: `Description of item ${id}`,
  price: 9.99,
  isAvailable: true,
  ...overrides,
});

// ─── Canonical test fixtures ──────────────────────────────────────────────────

/** A complete, self-contained fixture set for most contract tests */
export const fixtures = {
  categories: {
    electronics: makeCategory("electronics", { name: "Electronics" }),
    books: makeCategory("books", { name: "Books" }),
    sports: makeCategory("sports", { name: "Sports" }),
  },
  tags: {
    new: makeTag("new", { name: "New" }),
    sale: makeTag("sale", { name: "Sale" }),
    featured: makeTag("featured", { name: "Featured" }),
  },
  items: {
    laptop: makeItem("laptop", {
      name: "Laptop",
      description: "A powerful laptop",
      price: 999.99,
      isAvailable: true,
    }),
    book: makeItem("book", {
      name: "TypeScript Handbook",
      description: "Learn TypeScript",
      price: 29.99,
      isAvailable: true,
    }),
    ball: makeItem("ball", {
      name: "Football",
      description: "A football",
      price: 19.99,
      isAvailable: false,
    }),
  },
} as const;
