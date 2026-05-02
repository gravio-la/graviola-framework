// @ts-nocheck
import { useExtendedSchema } from "@graviola/edb-state-hooks";
import namespace from "@rdfjs/namespace";
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import type { JSONSchema7 } from "json-schema";
import { useState } from "react";

import { SemanticJsonFormNoOps } from "@graviola/semantic-json-form";
import { withGraviolaProvider } from "../../../.storybook/decorators";

const sladb = namespace("http://ontologies.slub-dresden.de/exhibition#");
const slent = namespace("http://ontologies.slub-dresden.de/exhibition/entity#");

export default {
  title: "Packages/SemanticJsonForm/SemanticJsonFormNoOps",
  component: SemanticJsonFormNoOps,
  tags: ["package-story"],
  decorators: [withGraviolaProvider],
} as Meta<typeof SemanticJsonFormNoOps>;

type ExampleData = {
  typeIRI: string;
  typeName: string;
  data: any;
};

const makeExampleData: (typeName: string, data: any) => ExampleData = (
  typeName: string,
  data: any,
) => {
  const typeIRI = sladb[typeName].value;
  return {
    typeIRI,
    typeName,
    data: {
      "@id": slent[typeName + "#s-12"].value,
      "@type": typeIRI,
      ...data,
    },
  };
};

const SemanticJsonFormNoOperationsExample = ({
  typeName,
  defaultData,
}: {
  typeName: string;
  defaultData: any;
}) => {
  const { typeIRI, data: initialData } = makeExampleData(typeName, defaultData);
  const [data, setData] = useState<any>(initialData);
  const loadedSchema = useExtendedSchema({ typeName });

  return (
    <SemanticJsonFormNoOps
      data={data}
      onChange={setData}
      typeIRI={typeIRI}
      searchText={""}
      schema={loadedSchema as JSONSchema7}
    />
  );
};

const exhibitionExample = makeExampleData("Exhibition", {
  title: "Otto Dix Ausstellung",
});

export const SemanticJsonFormNoOperationsExhibition: StoryObj<
  typeof SemanticJsonFormNoOps
> = {
  render: () => {
    const { typeIRI, typeName, data: initialData } = exhibitionExample;
    const [data, setData] = useState<any>(initialData);
    const loadedSchema = useExtendedSchema({ typeName });

    return (
      <SemanticJsonFormNoOps
        data={data}
        onChange={setData}
        typeIRI={typeIRI}
        searchText={""}
        schema={loadedSchema as JSONSchema7}
      />
    );
  },
  // Claim: exhibition form can be created from extended schema context.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};

export const SemanticJsonFormNoOperationsTag: StoryObj<
  typeof SemanticJsonFormNoOps
> = {
  render: () => {
    return (
      <SemanticJsonFormNoOperationsExample
        typeName="Tag"
        defaultData={{ title: "Historische Werke" }}
      />
    );
  },
  // Claim: tag form mounts with initial state and schema.
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeInTheDocument();
  },
};
