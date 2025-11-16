# Query Generator Showcases

This directory contains interactive Storybook showcases for the SPARQL query generator with Prisma-style filtering.

## Architecture

### Component Hierarchy

```
QueryGeneratorWrapper (Computation)
    ↓
QueryGeneratorShowcase (Pure Display)
```

### Components

#### `QueryGeneratorWrapper.tsx`

**Purpose**: Intermediate wrapper that handles all computation.

**Props** (Storybook Controls):

- `schema`: JSON Schema
- `subjectIRI`: Subject IRI to query
- `filterOptions`: GraphTraversalFilterOptions (include, select, omit)
- `prefixMap`: SPARQL prefix declarations
- `title`: Optional title
- `triples`: Optional RDF triples for dataset loading

**Responsibilities**:

- Calls `normalizeSchema()` to apply filters and resolve refs
- Calls `normalizedSchema2construct()` to generate SPARQL patterns
- Calls `buildCompleteSPARQLQuery()` to build final query
- Passes computed props to display component

#### `QueryGeneratorShowcase.tsx`

**Purpose**: Pure display component (no computation).

**Features**:

- Three-panel layout: Input Schema | Normalized Schema | Generated SPARQL
- Pagination metadata display
- Yasgui SPARQL editor integration
- **Dataset loading**: If `triples` prop is provided:
  - Shows "Load Dataset" button
  - Creates second Yasgui tab with INSERT DATA query
  - User can load data into their SPARQL store before executing queries

## Story Files

### `QueryGeneratorShowcase.stories.tsx`

**Title**: "Query Generator (Examples)"

**Stories**: Generic examples with synthetic data

- `SimpleObject`: No filters
- `WithPagination`: Single array with pagination
- `WithMultipleOrderBy`: Multiple sort criteria
- `NestedObjects`: Deep nesting without arrays
- `WithReferences`: $ref resolution
- `SelectAndOmit`: Prisma-style field filtering
- `CustomPrefixes`: Different namespace combinations
- `SocialNetwork`: Multiple relationship types (knows + worksBy)
- `ComplexFiltering`: Advanced select/omit with multiple paginated arrays

**All stories are fully editable via Storybook controls!**

### `QueryGeneratorTBBT.stories.tsx`

**Title**: "Query Generator (TBBT Dataset)"

**Stories**: Real-world examples using The Big Bang Theory dataset

- `BasicPerson`: Simple person with selected fields
- `PersonWithKnows`: Single-level `knows` relationship with pagination
- `MultiLevelRelationships`: Depth-2 relationships (friends of friends)
- `MultipleRelationships`: knows + colleague + worksFor with different pagination
- `SelectOmitWithRelationships`: Field filtering with relationships
- `ComplexMultiLevel`: Multi-level with pagination at multiple depths
- `CaltechScientists`: Network sorted by jobTitle
- `MinimalStub`: Performance optimization (@id only)

**All stories include**:

- Proper `@id` and `@type` properties
- Schema.org predicates with prefixes
- `$defs` for reusable definitions
- **Real RDF triples** from `tbbt-dataset.ts`
- **Dataset loading capability** via Yasgui

### `tbbt-dataset.ts`

Contains sample RDF triples for TBBT characters:

- Leonard Hofstadter
- Sheldon Cooper
- Penny
- Howard Wolowitz
- Raj Koothrappali
- Amy Farrah Fowler
- Caltech (organization)

Properties: givenName, familyName, email, jobTitle, knows, colleague, worksFor

## Usage

### Creating a New Story

```typescript
export const MyStory: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        friends: {
          type: "array",
          items: { $ref: "#/$defs/Person" },
        },
      },
      $defs: {
        Person: {
          type: "object",
          properties: {
            "@id": { type: "string" },
            name: { type: "string" },
          },
        },
      },
    },
    subjectIRI: "http://example.com/person/1",
    filterOptions: {
      include: {
        friends: {
          take: 10,
          orderBy: { name: "asc" },
        },
      },
    },
    prefixMap: {
      "": "http://example.com/",
    },
    title: "My Custom Story",
    triples: `<http://example.com/person/1> <http://example.com/name> "Alice" .`,
  },
};
```

### With Dataset Loading

To enable dataset loading:

1. Provide RDF triples in `triples` prop (N-Quads or Turtle format)
2. "Load Dataset" button will appear
3. Clicking "Open Yasgui" creates two tabs:
   - Tab 1: CONSTRUCT query (for retrieving data)
   - Tab 2: INSERT DATA query (for loading dataset)

User workflow:

1. Open Yasgui
2. Switch to "Load Dataset" tab
3. Configure SPARQL endpoint (e.g., http://localhost:3030/ds/update)
4. Execute INSERT DATA to load triples
5. Switch to first tab
6. Execute CONSTRUCT to retrieve data

## Key Features

✅ **Fully Interactive**: All props editable via Storybook controls
✅ **Separation of Concerns**: Computation in wrapper, display in showcase
✅ **Real-World Data**: TBBT dataset with proper Schema.org semantics
✅ **Dataset Loading**: INSERT DATA queries for easy data loading
✅ **Yasgui Integration**: Execute queries against real SPARQL endpoints
✅ **Pagination Metadata**: Visual feedback on query-stage pagination
✅ **Prisma-Style Filters**: select, include, omit patterns
✅ **Multi-Level Pagination**: Different pagination for each relationship
✅ **Order By**: Single or multiple sort criteria with ASC/DESC

## Benefits

1. **Flexible**: Each story has unique structure (not hardcoded to "friends")
2. **Editable**: Change schema/filters in Storybook UI
3. **Testable**: Real queries against real data
4. **Educational**: Shows best practices for @id/@type and $defs
5. **Practical**: INSERT DATA feature for actual SPARQL testing
