import type { Meta, StoryObj } from "@storybook/react";
import { CircularProgress } from "@mui/material";
import { MemoryRouter } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";
import type { JSONSchema7 } from "json-schema";
import { useState } from "react";
import { LocalOxigraphStoreProvider } from "@graviola/local-oxigraph-store-provider";
import { AdbProvider, store } from "@graviola/edb-state-hooks";
import {
  graviolaRenderers,
  SemanticJsonFormNoOps,
} from "@graviola/semantic-json-form";
import { defineGraviolaApp } from "@graviola/graviola-app-config";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";
import { createSemanticConfig } from "../../../../../../packages/semantic-json-form/src/helper/createSemanticConfig";
import { createUISchemata } from "../../../../../../packages/semantic-json-form/src/helper/createUISchemata";

const allRenderers = [...materialRenderers, ...graviolaRenderers];
import { storybookPublicBasePath } from "../../../_shared/storybookPublicUrl";

const VOCAB = "http://example.org/linkfilter/vocab/";
const INSTANCE = "http://example.org/linkfilter/instance/";

const schema = {
  type: "object",
  definitions: {
    Host: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string", const: `${VOCAB}Host` },
        name: { type: "string" },
        tier: { type: "string" },
      },
    },
    Guest: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string", const: `${VOCAB}Guest` },
        name: { type: "string" },
        tier: { type: "string" },
      },
    },
    Booking: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": { type: "string", const: `${VOCAB}Booking` },
        host: { $ref: "#/definitions/Host" },
        guest: { $ref: "#/definitions/Guest" },
      },
    },
  },
} as JSONSchema7;

const seedTurtle = `
@prefix ex: <${VOCAB}> .
@prefix inst: <${INSTANCE}> .

inst:host-a a ex:Host ; ex:name "Host A" ; ex:tier "gold" .
inst:guest-gold a ex:Guest ; ex:name "Gold guest" ; ex:tier "gold" .
inst:guest-silver a ex:Guest ; ex:name "Silver guest" ; ex:tier "silver" .
inst:booking-1 a ex:Booking ;
  ex:host inst:host-a .
`;

const typeNameToTypeIRI = (typeName: string) => `${VOCAB}${typeName}`;
const typeIRIToTypeName = (iri: string) => iri.replace(VOCAB, "");

const schemaConfig = defineGraviolaApp({
  schemaName: "linkfilter-demo",
  label: "Link filter demo",
  description: "",
  version: "0.0.1",
  storageKey: "linkfilter-demo",
  baseIRI: VOCAB,
  entityBaseIRI: INSTANCE,
  schema,
  primaryFields: {
    Guest: { label: "name" },
    Host: { label: "name" },
  },
  typeNameLabelMap: {
    Booking: "Booking",
    Guest: "Guest",
    Host: "Host",
  },
  typeNameUiSchemaOptionsMap: {},
  linkFilters: {
    Booking: {
      guest: {
        where: { tier: { equals: { $data: "host.tier" } } },
      },
    },
  },
});

const { registry: uiSchemaRegistry } = createUISchemata(schema, {
  definitionToTypeIRI: typeNameToTypeIRI,
  typeNameUiSchemaOptionsMap: schemaConfig.typeNameUiSchemaOptionsMap as Record<
    string,
    object
  >,
});

const LinkFilterBookingForm = () => {
  const [data, setData] = useState<Record<string, unknown>>({
    "@id": `${INSTANCE}booking-draft`,
    "@type": `${VOCAB}Booking`,
    host: {
      "@id": `${INSTANCE}host-a`,
      "@type": `${VOCAB}Host`,
      name: "Host A",
      tier: "gold",
    },
  });

  return (
    <SemanticJsonFormNoOps
      schema={schema}
      uischema={schemaConfig.uischemata?.Booking}
      data={data}
      onChange={setData}
      typeIRI={`${VOCAB}Booking`}
      jsonFormsProps={{ renderers: allRenderers, cells: materialCells }}
    />
  );
};

const withLinkFilterDemoStore: Meta<
  typeof LinkFilterBookingForm
>["decorators"] = [
  (Story) => {
    const config = createSemanticConfig({ baseIRI: VOCAB });
    const publicBasePath = storybookPublicBasePath();

    return (
      <MemoryRouter>
        <SnackbarProvider maxSnack={4}>
          <Provider store={store}>
            <AdbProvider
              {...config}
              schema={schema}
              uischemata={schemaConfig.uischemata}
              typeNameToTypeIRI={typeNameToTypeIRI}
              typeIRIToTypeName={(iri) => typeIRIToTypeName(iri) ?? ""}
              createEntityIRI={(typeName, id) =>
                `${INSTANCE}${typeName}/${id ?? crypto.randomUUID()}`
              }
              uiSchemaDefaultRegistry={uiSchemaRegistry}
              rendererRegistry={allRenderers}
              cellRendererRegistry={materialCells}
              queryBuildOptions={{
                ...config.queryBuildOptions,
                primaryFields: schemaConfig.primaryFields,
                sparqlFlavour: "oxigraph",
              }}
              env={{
                publicBasePath,
                baseIRI: VOCAB,
              }}
            >
              <LocalOxigraphStoreProvider
                endpoint={{
                  endpoint: "urn:worker",
                  label: "Link filter demo",
                  provider: "worker",
                  active: true,
                }}
                defaultLimit={20}
                initialData={[seedTurtle]}
                loader={<CircularProgress />}
              >
                <Story />
              </LocalOxigraphStoreProvider>
            </AdbProvider>
          </Provider>
        </SnackbarProvider>
      </MemoryRouter>
    );
  },
];

const meta: Meta<typeof LinkFilterBookingForm> = {
  title: "Packages/Form Renderer/Linked Data/Link filter relation picker",
  component: LinkFilterBookingForm,
  decorators: withLinkFilterDemoStore,
  tags: ["package-story"],
};

export default meta;
type Story = StoryObj<typeof LinkFilterBookingForm>;

export const GoldHostSeesOnlyGoldGuests: Story = {
  render: () => <LinkFilterBookingForm />,
};
