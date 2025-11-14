import { JSONSchema7 } from "json-schema";
import { translateJsonSchema } from "./translateJsonSchema";

describe("translateJsonSchema", () => {
  // Mock i18next functions
  const mockTranslations = {
    "user.name": "Translated Name",
    "user.name_description": "Translated name description",
    "user.email": "Translated Email",
    "user.preferences.theme": "Translated Theme",
    "user.preferences.theme_description": "Translated theme description",
    "user.preferences_title": "Translated Preferences",
    "user.preferences_description": "Translated preferences description",
    "user.hobbies_title": "Translated Hobbies",
    "user.hobbies_description": "Translated hobbies description",
    "user.hobbies.name": "Translated Hobby Name",
    "user.hobbies.level": "Translated Skill Level",
    user_title: "Translated User",
    user_description: "Translated user description",
    _title: "Translated Root Schema",
  };

  const mockT = jest.fn((key: string) => mockTranslations[key] || key);
  const mockExists = jest.fn((key: string) => key in mockTranslations);

  beforeEach(() => {
    mockT.mockClear();
    mockExists.mockClear();
  });

  it("should translate property titles and descriptions when translations exist", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        user: {
          type: "object",
          title: "Original User",
          description: "Original user description",
          properties: {
            name: {
              type: "string",
              title: "Original Name",
              description: "Original name description",
            },
            email: {
              type: "string",
              title: "Original Email",
            },
          },
        },
      },
    };

    const result = translateJsonSchema(schema, mockT, mockExists);

    // Check that translations were applied
    expect(result.definitions?.user).toBeDefined();
    const userDef = result.definitions!.user as JSONSchema7;

    expect(userDef.title).toBe("Translated User");
    expect(userDef.description).toBe("Translated user description");

    const nameProperty = userDef.properties?.name as JSONSchema7;
    expect(nameProperty.title).toBe("Translated Name");
    expect(nameProperty.description).toBe("Translated name description");

    const emailProperty = userDef.properties?.email as JSONSchema7;
    expect(emailProperty.title).toBe("Translated Email");
    expect(emailProperty.description).toBe("Original Email"); // No translation exists, should keep original
  });

  it("should handle nested objects and arrays", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        user: {
          type: "object",
          properties: {
            preferences: {
              type: "object",
              title: "Original Preferences",
              properties: {
                theme: {
                  type: "string",
                  title: "Original Theme",
                  description: "Original theme description",
                },
              },
            },
            hobbies: {
              type: "array",
              title: "Original Hobbies",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    title: "Original Hobby Name",
                  },
                  level: {
                    type: "string",
                    title: "Original Skill Level",
                  },
                },
              },
            },
          },
        },
      },
    };

    const result = translateJsonSchema(schema, mockT, mockExists);
    const userDef = result.definitions!.user as JSONSchema7;

    // Check nested object translations
    const preferencesProperty = userDef.properties?.preferences as JSONSchema7;
    expect(preferencesProperty.title).toBe("Translated Preferences");
    expect(preferencesProperty.description).toBe(
      "Translated preferences description",
    );

    const themeProperty = preferencesProperty.properties?.theme as JSONSchema7;
    expect(themeProperty.title).toBe("Translated Theme");
    expect(themeProperty.description).toBe("Translated theme description");

    // Check array translations
    const hobbiesProperty = userDef.properties?.hobbies as JSONSchema7;
    expect(hobbiesProperty.title).toBe("Translated Hobbies");
    expect(hobbiesProperty.description).toBe("Translated hobbies description");

    // Check array items properties
    const hobbyItems = hobbiesProperty.items as JSONSchema7;
    const hobbyNameProperty = hobbyItems.properties?.name as JSONSchema7;
    expect(hobbyNameProperty.title).toBe("Translated Hobby Name");

    const hobbyLevelProperty = hobbyItems.properties?.level as JSONSchema7;
    expect(hobbyLevelProperty.title).toBe("Translated Skill Level");
  });

  it("should handle root schema properties", () => {
    const schema: JSONSchema7 = {
      type: "object",
      title: "Original Root Title",
      properties: {
        rootProperty: {
          type: "string",
          title: "Original Root Property",
        },
      },
    };

    const result = translateJsonSchema(schema, mockT, mockExists);

    expect(result.title).toBe("Translated Root Schema");

    const rootProperty = result.properties?.rootProperty as JSONSchema7;
    expect(rootProperty.title).toBe("Original Root Property"); // No translation exists
  });

  it("should not modify schema when no translations exist", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        untranslated: {
          type: "object",
          title: "Original Title",
          description: "Original Description",
          properties: {
            property: {
              type: "string",
              title: "Original Property Title",
            },
          },
        },
      },
    };

    const emptyExists = jest.fn(() => false);
    const emptyT = jest.fn((key: string) => key);

    const result = translateJsonSchema(schema, emptyT, emptyExists);

    // Should be unchanged
    const untranslatedDef = result.definitions!.untranslated as JSONSchema7;
    expect(untranslatedDef.title).toBe("Original Title");
    expect(untranslatedDef.description).toBe("Original Description");

    const property = untranslatedDef.properties?.property as JSONSchema7;
    expect(property.title).toBe("Original Property Title");
  });

  it("should not mutate the original schema", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        user: {
          type: "object",
          title: "Original User",
          properties: {
            name: {
              type: "string",
              title: "Original Name",
            },
          },
        },
      },
    };

    const originalTitle = (schema.definitions!.user as JSONSchema7).title;
    const originalNameTitle = (
      (schema.definitions!.user as JSONSchema7).properties?.name as JSONSchema7
    ).title;

    translateJsonSchema(schema, mockT, mockExists);

    // Original schema should be unchanged
    expect((schema.definitions!.user as JSONSchema7).title).toBe(originalTitle);
    expect(
      (
        (schema.definitions!.user as JSONSchema7).properties
          ?.name as JSONSchema7
      ).title,
    ).toBe(originalNameTitle);
  });

  it("should handle schemas without definitions", () => {
    const schema: JSONSchema7 = {
      type: "object",
      properties: {
        simpleProperty: {
          type: "string",
          title: "Simple Property",
        },
      },
    };

    const result = translateJsonSchema(schema, mockT, mockExists);

    // Should handle gracefully
    expect(result.type).toBe("object");
    expect(result.properties?.simpleProperty).toBeDefined();
  });

  it("should call exists and t functions with correct keys", () => {
    const schema: JSONSchema7 = {
      type: "object",
      definitions: {
        user: {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
        },
      },
    };

    translateJsonSchema(schema, mockT, mockExists);

    // Verify the correct translation keys were checked
    expect(mockExists).toHaveBeenCalledWith("user.name");
    expect(mockExists).toHaveBeenCalledWith("user.name_description");
    expect(mockExists).toHaveBeenCalledWith("user_title");
    expect(mockExists).toHaveBeenCalledWith("user_description");
  });
});
