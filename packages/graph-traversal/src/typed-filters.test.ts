/**
 * Type safety tests for typed filter patterns
 *
 * These tests demonstrate compile-time type safety with TypeScript.
 * Some tests intentionally show type errors (commented out) to demonstrate
 * what the type system prevents.
 */

import { describe, it, expect } from "@jest/globals";
import type {
  TypedWhereInput,
  TypedIncludePattern,
  TypedSelectPattern,
  TypedOmitPattern,
  TypedGraphTraversalFilterOptions,
} from "./typed-filters";

// Define test types
type Person = {
  name: string;
  email: string;
  age: number;
  verified: boolean;
  createdAt: Date;
  friends: Array<{ name: string; age: number }>;
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
};

type PersonWithUnion = {
  id: string | number;
  name: string;
};

describe("Type-safe filter patterns", () => {
  describe("TypedWhereInput", () => {
    it("should allow valid string operators", () => {
      const where: TypedWhereInput<Person> = {
        name: { contains: "John" },
        email: { startsWith: "john", endsWith: "@example.com" },
      };

      expect(where).toBeDefined();
    });

    it("should allow valid numeric operators", () => {
      const where: TypedWhereInput<Person> = {
        age: { gte: 18, lte: 65 },
      };

      expect(where).toBeDefined();
    });

    it("should allow valid boolean operators", () => {
      const where: TypedWhereInput<Person> = {
        verified: { equals: true },
      };

      expect(where).toBeDefined();
    });

    it("should allow shorthand equality", () => {
      const where: TypedWhereInput<Person> = {
        name: "John",
        age: 25,
        verified: true,
      };

      expect(where).toBeDefined();
    });

    it("should allow logical operators", () => {
      const where: TypedWhereInput<Person> = {
        AND: [{ age: { gte: 18 } }, { verified: { equals: true } }],
        OR: [{ name: { contains: "John" } }, { email: { contains: "jane" } }],
      };

      expect(where).toBeDefined();
    });

    it("should allow union type operators", () => {
      // Union types should accept operators from all constituent types
      const where: TypedWhereInput<PersonWithUnion> = {
        id: { contains: "test" }, // String operator
      };

      const where2: TypedWhereInput<PersonWithUnion> = {
        id: { gt: 100 }, // Number operator
      };

      expect(where).toBeDefined();
      expect(where2).toBeDefined();
    });

    // Type error examples (commented out to prevent compilation errors)
    // These demonstrate what the type system prevents:

    // it("should NOT allow invalid operators for string", () => {
    //   const where: TypedWhereInput<Person> = {
    //     name: { gt: 10 }, // ERROR: gt not valid for string
    //   };
    // });

    // it("should NOT allow invalid operators for number", () => {
    //   const where: TypedWhereInput<Person> = {
    //     age: { contains: "test" }, // ERROR: contains not valid for number
    //   };
    // });

    // it("should NOT allow invalid property names", () => {
    //   const where: TypedWhereInput<Person> = {
    //     nonExistent: { equals: "test" }, // ERROR: property doesn't exist
    //   };
    // });
  });

  describe("TypedIncludePattern", () => {
    it("should allow boolean include values", () => {
      const include: TypedIncludePattern<Person> = {
        name: true,
        friends: true,
      };

      expect(include).toBeDefined();
    });

    it("should allow pagination options", () => {
      const include: TypedIncludePattern<Person> = {
        friends: {
          take: 10,
          skip: 0,
          orderBy: { name: "asc" },
        },
      };

      expect(include).toBeDefined();
    });

    it("should allow nested includes", () => {
      const include: TypedIncludePattern<Person> = {
        address: {
          include: {
            city: true,
            street: true,
          },
        },
        friends: {
          take: 5,
          include: {
            name: true,
          },
        },
      };

      expect(include).toBeDefined();
    });
  });

  describe("TypedSelectPattern", () => {
    it("should allow selecting fields", () => {
      const select: TypedSelectPattern<Person> = {
        name: true,
        email: true,
        age: true,
      };

      expect(select).toBeDefined();
    });

    // Type error example:
    // it("should NOT allow invalid property names", () => {
    //   const select: TypedSelectPattern<Person> = {
    //     nonExistent: true, // ERROR: property doesn't exist
    //   };
    // });
  });

  describe("TypedOmitPattern", () => {
    it("should allow array of keys to omit", () => {
      const omit: TypedOmitPattern<Person> = ["email", "verified"];

      expect(omit).toBeDefined();
    });

    // Type error example:
    // it("should NOT allow invalid property names", () => {
    //   const omit: TypedOmitPattern<Person> = ["nonExistent"]; // ERROR
    // });
  });

  describe("TypedGraphTraversalFilterOptions", () => {
    it("should combine all typed patterns", () => {
      const options: TypedGraphTraversalFilterOptions<Person> = {
        select: { name: true, age: true },
        include: {
          friends: { take: 10 },
          address: true,
        },
        omit: ["email"],
        where: {
          age: { gte: 18 },
          verified: { equals: true },
        },
        filterValidationMode: "warn",
        includeRelationsByDefault: false,
      };

      expect(options).toBeDefined();
    });
  });

  describe("Backward compatibility", () => {
    it("should work without type parameter (any)", () => {
      // Without type parameter, should default to any
      const where: TypedWhereInput<any> = {
        anyProp: { contains: "test" },
        anotherProp: { gt: 10 },
      };

      const include: TypedIncludePattern = {
        anyProp: true,
        nested: { include: { field: true } },
      };

      const select: TypedSelectPattern = {
        field1: true,
        field2: true,
      };

      const omit: TypedOmitPattern = ["field1", "field2"];

      expect(where).toBeDefined();
      expect(include).toBeDefined();
      expect(select).toBeDefined();
      expect(omit).toBeDefined();
    });
  });
});
