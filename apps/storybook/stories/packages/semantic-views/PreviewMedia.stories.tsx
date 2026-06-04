import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Stack, SvgIcon, Typography } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import type { TypePresentationRegistry } from "@graviola/edb-core-types";
import {
  SemanticChipNoOps,
  SemanticListItemNoOps,
} from "@graviola/semantic-views";
import { withSemanticViewsProvider } from "../../../.storybook/decorators/withSemanticViewsProvider";
import {
  SEMANTIC_VIEWS_EXAMPLE_NS,
  semanticViewsPrimaryFields,
  semanticViewsTypeIRIToTypeName,
  semanticViewsTypeNameToTypeIRI,
} from "./semanticViewsStorySchema";
import { createSemanticConfig } from "../../../../../packages/semantic-json-form/src/helper/createSemanticConfig";
import { AdbProvider } from "@graviola/edb-state-hooks";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

function CustomFileSvgIcon(props: React.ComponentProps<typeof SvgIcon>) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
    </SvgIcon>
  );
}

const previewMediaSchema = {
  type: "object",
  definitions: {
    MediaDemo: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": {
          type: "string",
          const: `${SEMANTIC_VIEWS_EXAMPLE_NS}MediaDemo`,
        },
        name: { type: "string" },
        mimeType: { type: "string" },
        thumb: { type: "string" },
      },
    },
    FileEntry: {
      type: "object",
      properties: {
        "@id": { type: "string" },
        "@type": {
          type: "string",
          const: `${SEMANTIC_VIEWS_EXAMPLE_NS}FileEntry`,
        },
        name: { type: "string" },
        mimeType: { type: "string" },
        thumb: { type: "string" },
      },
    },
  },
} as const;

const previewMediaPrimaryFields = {
  MediaDemo: { label: "name", image: "thumb" },
  FileEntry: { label: "name", image: "thumb" },
};

const meta: Meta = {
  title: "semantic-views/PreviewMedia",
  decorators: [withSemanticViewsProvider],
};

export default meta;
type Story = StoryObj;

function MediaDemoProvider({
  typePresentation,
  children,
}: {
  typePresentation: TypePresentationRegistry;
  children: React.ReactNode;
}) {
  const config = createSemanticConfig({ baseIRI: "http://www.example.org/" });
  return (
    <AdbProvider
      {...config}
      schema={previewMediaSchema}
      typeNameToTypeIRI={semanticViewsTypeNameToTypeIRI}
      typeIRIToTypeName={semanticViewsTypeIRIToTypeName}
      queryBuildOptions={{
        ...config.queryBuildOptions,
        primaryFields: {
          ...semanticViewsPrimaryFields,
          ...previewMediaPrimaryFields,
        },
      }}
      typePresentation={typePresentation}
      env={{ publicBasePath: "", baseIRI: "http://www.example.org/" }}
    >
      {children}
    </AdbProvider>
  );
}

function Row({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

export const ImageUrl: Story = {
  render: () => (
    <MediaDemoProvider typePresentation={{ MediaDemo: {} }}>
      <Row title="Chip + list with HTTPS image (no type icon)">
        <SemanticChipNoOps
          typeName="MediaDemo"
          data={{
            "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}MediaDemo`,
            name: "Cover photo",
            thumb: "https://picsum.photos/seed/preview-media-url/64/64",
          }}
        />
        <SemanticListItemNoOps
          typeName="MediaDemo"
          data={{
            "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}MediaDemo`,
            name: "Cover photo",
            thumb: "https://picsum.photos/seed/preview-media-url/64/64",
          }}
        />
      </Row>
    </MediaDemoProvider>
  ),
};

export const Base64Image: Story = {
  render: () => (
    <MediaDemoProvider typePresentation={{ MediaDemo: {} }}>
      <SemanticChipNoOps
        typeName="MediaDemo"
        data={{
          "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}MediaDemo`,
          name: "1×1 PNG (data URL)",
          thumb: TINY_PNG,
        }}
      />
    </MediaDemoProvider>
  ),
};

export const MuiIconPerType: Story = {
  render: () => (
    <MediaDemoProvider
      typePresentation={{
        MediaDemo: { icon: FolderOpenIcon },
      }}
    >
      <SemanticChipNoOps
        typeName="MediaDemo"
        data={{
          "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}MediaDemo`,
          name: "Folder item",
          thumb: "https://picsum.photos/seed/ignored/64/64",
        }}
      />
    </MediaDemoProvider>
  ),
};

export const CustomSvgIcon: Story = {
  render: () => (
    <MediaDemoProvider
      typePresentation={{
        MediaDemo: { icon: CustomFileSvgIcon },
      }}
    >
      <SemanticChipNoOps
        typeName="MediaDemo"
        data={{
          "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}MediaDemo`,
          name: "Custom SVG icon",
        }}
      />
    </MediaDemoProvider>
  ),
};

const mimePresentation: TypePresentationRegistry = {
  FileEntry: {
    icon: DescriptionIcon,
    iconByMime: {
      "image/*": ImageIcon,
      "application/pdf": PictureAsPdfIcon,
    },
  },
};

const mimeSamples = [
  {
    name: "notes.txt",
    mimeType: "text/plain",
    thumb: "https://picsum.photos/seed/plain/64/64",
  },
  {
    name: "scan.png",
    mimeType: "image/png",
    thumb: "https://picsum.photos/seed/png/64/64",
  },
  {
    name: "paper.pdf",
    mimeType: "application/pdf",
    thumb: "https://picsum.photos/seed/pdf/64/64",
  },
];

export const MimeIconSameType: Story = {
  render: () => (
    <MediaDemoProvider typePresentation={mimePresentation}>
      <Stack spacing={1}>
        {mimeSamples.map((file) => (
          <SemanticChipNoOps
            key={file.name}
            typeName="FileEntry"
            data={{
              "@type": `${SEMANTIC_VIEWS_EXAMPLE_NS}FileEntry`,
              ...file,
            }}
          />
        ))}
      </Stack>
    </MediaDemoProvider>
  ),
};
