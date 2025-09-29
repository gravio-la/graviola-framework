import { DeclarativeMapping } from "@graviola/edb-data-mapping";
import { GlobalAppConfig } from "@graviola/semantic-jsonform-types";
import { materialCells } from "@jsonforms/material-renderers";
import {
  authorityAccess,
  availableAuthorityMappings,
  makeStubSchema,
  schema,
} from "@slub/exhibition-schema";
import { JSONSchema7 } from "json-schema";

import {
  createNewIRI,
  defaultJsonldContext,
  defaultPrefix,
  defaultQueryBuilderOptions,
  sladb,
} from "./formConfigs";
import { makeDefaultUiSchemaForAllDefinitions } from "./makeDefaultUiSchemaForAllDefinitions";
import { BASE_IRI } from "./paths";
import { rendererRegistry } from "./rendererRegistry";
import { uischemata } from "./uischemata";

const someNameToTypeIRI = (name: string) => sladb(name).value;
const someIRIToTypeName = (iri: string) =>
  iri?.substring(BASE_IRI.length, iri.length);
export const exhibitionConfig: GlobalAppConfig<DeclarativeMapping> = {
  queryBuildOptions: defaultQueryBuilderOptions,
  typeNameToTypeIRI: someNameToTypeIRI,
  propertyNameToIRI: someNameToTypeIRI,
  typeIRIToTypeName: someIRIToTypeName,
  propertyIRIToPropertyName: someIRIToTypeName,
  createEntityIRI: createNewIRI,
  jsonLDConfig: {
    defaultPrefix: defaultPrefix,
    jsonldContext: defaultJsonldContext,
    allowUnsafeSourceIRIs: false,
  },
  normDataMapping: availableAuthorityMappings,
  authorityAccess: authorityAccess,
  schema: schema as JSONSchema7,
  makeStubSchema: makeStubSchema,
  uiSchemaDefaultRegistry: makeDefaultUiSchemaForAllDefinitions(
    schema as JSONSchema7,
  ),
  rendererRegistry: rendererRegistry,
  cellRendererRegistry: materialCells,
  uischemata: uischemata,
};
