# @graviola/json-schema-cli

A command-line interface for working with JSON Schema, providing tools to generate i18n translation files and perform other schema-related operations.

## Installation

```bash
npm install -g @graviola/json-schema-cli
```

Or run directly with npx:

```bash
npx @graviola/json-schema-cli
```

## Commands

### generate-translations

Generate i18n translation files from JSON Schema definitions.

#### Usage

```bash
json-schema-cli generate-translations <input-file> [options]
```

#### Arguments

- `input-file` - Path to JSON Schema file (.json)

#### Options

- `-o, --output <file>` - Output file path (default: `<input-basename>.translations.json`)
- `-d, --description` - Include description translations with `_description` suffix
- `-h, --help` - Show help for this command

#### Examples

**Basic usage:**

```bash
json-schema-cli generate-translations schema.json
```

**Custom output file:**

```bash
json-schema-cli generate-translations schema.json -o translations/en.json
```

**Include descriptions:**

```bash
json-schema-cli generate-translations schema.json --description
```

**Full example with all options:**

```bash
json-schema-cli generate-translations user-schema.json -o i18n/user-translations.json --description
```

## Translation File Structure

The generated translation files follow this structure:

```json
{
  "definitionName": {
    "propertyName": "Property Title",
    "propertyName_description": "Property description",
    "nestedObject": {
      "nestedProperty": "Nested Property Title",
      "nestedProperty_description": "Nested property description"
    },
    "nestedObject_title": "Nested Object Title",
    "nestedObject_description": "Nested object description",
    "definitionName_title": "Definition Title",
    "definitionName_description": "Definition description"
  },
  "rootProperty": "Root Property Title",
  "rootProperty_description": "Root property description",
  "_title": "Root Schema Title",
  "_description": "Root schema description"
}
```

### Key Features

- **Nested Structure**: Maintains the hierarchical structure of your JSON Schema
- **Array Support**: Properly handles array properties and their item schemas
- **Flexible Output**: Configurable inclusion of description translations
- **Schema Validation**: Validates input files to ensure they are valid JSON Schema
- **Default Values**: Uses schema `title` properties or falls back to property names
- **Clean Structure**: Excludes JSON Schema implementation details like `items` objects

### JSON Schema Support

The CLI supports JSON Schema Draft 7 and handles:

- Object properties with nested structures
- Array properties with object items
- Schema definitions and references
- Title and description metadata
- Complex nested schemas

### Example Input/Output

**Input Schema (`user.schema.json`):**

```json
{
  "type": "object",
  "title": "User Profile",
  "description": "User profile information",
  "definitions": {
    "user": {
      "type": "object",
      "title": "User",
      "description": "A system user",
      "properties": {
        "name": {
          "type": "string",
          "title": "Full Name",
          "description": "The user's full name"
        },
        "preferences": {
          "type": "object",
          "title": "Preferences",
          "properties": {
            "theme": {
              "type": "string",
              "title": "UI Theme"
            }
          }
        }
      }
    }
  }
}
```

**Generated Translations (`user.translations.json`):**

```json
{
  "user": {
    "name": "Full Name",
    "name_description": "The user's full name",
    "preferences": {
      "theme": "UI Theme",
      "theme_description": ""
    },
    "preferences_title": "Preferences",
    "preferences_description": "",
    "user_title": "User",
    "user_description": "A system user"
  }
}
```

## Development

This CLI is built using:

- [cmd-ts](https://github.com/Schniz/cmd-ts) for command-line parsing
- [@graviola/json-schema-utils](../packages/json-schema-utils) for schema processing
- TypeScript for type safety
- tsup for building

### Building

```bash
bun run build
```

### Testing Locally

```bash
bun run start generate-translations path/to/schema.json
```

## License

MIT

## Contributing

This package is part of the Graviola EDB project. Please refer to the main repository for contribution guidelines.
