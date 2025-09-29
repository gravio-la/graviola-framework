import { JSONSchema7 } from "json-schema";
import {
  extractTranslationKeysFromSchema,
  TranslationGenerationOptions,
} from "./extractTranslationKeysFromSchema";

describe("extractTranslationKeysFromSchema", () => {
  it("should generate basic translation keys with default options", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        person: {
          type: "object",
          title: "Person",
          description: "A person entity",
          properties: {
            name: {
              type: "string",
              title: "Full Name",
              description: "The person's full name",
            },
            age: {
              type: "number",
              title: "Age",
              description: "The person's age in years",
            },
            address: {
              type: "object",
              title: "Address",
              description: "The person's address",
              properties: {
                street: {
                  type: "string",
                  title: "Street Address",
                },
                city: {
                  type: "string",
                  title: "City",
                },
              },
            },
          },
        },
      },
    };

    const result = extractTranslationKeysFromSchema(schema);

    expect(result).toEqual({
      person: {
        name: "Full Name",
        age: "Age",
        address: {
          street: "Street Address",
          city: "City",
        },
        address_title: "Address",
        person_title: "Person",
      },
    });
  });

  it("should generate translation keys with descriptions when includeDescription is true", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        user: {
          type: "object",
          title: "User",
          description: "A user of the system",
          properties: {
            email: {
              type: "string",
              title: "Email Address",
              description: "The user's email address",
            },
            username: {
              type: "string",
              title: "Username",
              description: "The user's unique username",
            },
          },
        },
      },
    };

    const options: TranslationGenerationOptions = {
      includeDescription: true,
    };

    const result = extractTranslationKeysFromSchema(schema, options);

    expect(result).toEqual({
      user: {
        email: "Email Address",
        email_description: "The user's email address",
        username: "Username",
        username_description: "The user's unique username",
        user_title: "User",
        user_description: "A user of the system",
      },
    });
  });

  it("should use custom translation functions when provided", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        product: {
          type: "object",
          properties: {
            name: { type: "string" },
            price: { type: "number" },
          },
        },
      },
    };

    const options: TranslationGenerationOptions = {
      defaultTitleTranslation: (key, path, schema) =>
        `Custom_${key.toUpperCase()}`,
      defaultDescriptionTranslation: (key, path, schema) =>
        `Description for ${key}`,
      includeDescription: true,
    };

    const result = extractTranslationKeysFromSchema(schema, options);

    expect(result).toEqual({
      product: {
        name: "Custom_NAME",
        name_description: "Description for name",
        price: "Custom_PRICE",
        price_description: "Description for price",
        product_title: "Custom_PRODUCT",
        product_description: "Description for product",
      },
    });
  });

  it("should handle root schema properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      title: "Root Schema",
      description: "The root schema",
      properties: {
        rootProp: {
          type: "string",
          title: "Root Property",
        },
        nested: {
          type: "object",
          properties: {
            nestedProp: { type: "string" },
          },
        },
      },
    };

    const result = extractTranslationKeysFromSchema(schema, {
      includeDescription: true,
    });

    expect(result).toEqual({
      rootProp: "Root Property",
      rootProp_description: "",
      nested: {
        nestedProp: "nestedProp",
        nestedProp_description: "",
      },
      nested_title: "nested",
      nested_description: "",
      _title: "Root Schema",
      _description: "The root schema",
    });
  });

  it("should handle schema without definitions", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        simpleProperty: {
          type: "string",
          title: "Simple Property",
        },
      },
    };

    const result = extractTranslationKeysFromSchema(schema);

    expect(result).toEqual({
      simpleProperty: "Simple Property",
      _title: "root",
    });
  });

  it("should handle deeply nested objects", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        company: {
          type: "object",
          properties: {
            info: {
              type: "object",
              properties: {
                details: {
                  type: "object",
                  properties: {
                    founded: { type: "string", title: "Founded Date" },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = extractTranslationKeysFromSchema(schema);

    expect(result).toEqual({
      company: {
        info: {
          details: {
            founded: "Founded Date",
          },
          details_title: "details",
        },
        info_title: "info",
        company_title: "company",
      },
    });
  });

  it("should fallback to key name when no title is provided", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        item: {
          type: "object",
          properties: {
            untitledProperty: { type: "string" },
          },
        },
      },
    };

    const result = extractTranslationKeysFromSchema(schema);

    expect(result).toEqual({
      item: {
        untitledProperty: "untitledProperty",
        item_title: "item",
      },
    });
  });

  it("should handle array items with object schemas", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        library: {
          type: "object",
          title: "Library",
          description: "A library system",
          properties: {
            books: {
              type: "array",
              title: "Books Collection",
              description: "Collection of books in the library",
              items: {
                type: "object",
                title: "Book",
                description: "A book in the library",
                properties: {
                  title: {
                    type: "string",
                    title: "Book Title",
                    description: "The title of the book",
                  },
                  author: {
                    type: "object",
                    title: "Author",
                    description: "The book's author",
                    properties: {
                      name: {
                        type: "string",
                        title: "Author Name",
                        description: "The author's full name",
                      },
                      bio: {
                        type: "string",
                        title: "Biography",
                        description: "Author's biography",
                      },
                    },
                  },
                  tags: {
                    type: "array",
                    title: "Tags",
                    description: "Book tags",
                    items: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = extractTranslationKeysFromSchema(schema, {
      includeDescription: true,
    });

    expect(result).toEqual({
      library: {
        books: {
          title: "Book Title",
          title_description: "The title of the book",
          author: {
            name: "Author Name",
            name_description: "The author's full name",
            bio: "Biography",
            bio_description: "Author's biography",
          },
          author_title: "Author",
          author_description: "The book's author",
          tags: "Tags",
          tags_description: "Book tags",
          tags_title: "Tags",
        },
        books_title: "Books Collection",
        books_description: "Collection of books in the library",
        library_title: "Library",
        library_description: "A library system",
      },
    });
  });
});
