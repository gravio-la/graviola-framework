import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import LabelIcon from "@mui/icons-material/Label";
import { OutlineTree, type OutlineNode } from "@graviola/portal-ui-components";

const sampleNodes: OutlineNode[] = [
  {
    id: "class:Person",
    label: "Person",
    kind: "class",
    description: "class",
    children: [
      {
        id: "slot:Person:name",
        label: "name",
        kind: "slot",
        description: "Person",
        meta: { line: 12, column: 5 },
      },
      {
        id: "slot:Person:birthDate",
        label: "birthDate",
        kind: "slot",
        description: "Person",
        meta: { line: 14, column: 5 },
      },
      {
        id: "attr:Person:email",
        label: "email",
        kind: "attribute",
        description: "Person",
        meta: { line: 18, column: 5 },
      },
    ],
  },
  {
    id: "class:Organization",
    label: "Organization",
    kind: "class",
    description: "class",
    children: [
      {
        id: "slot:Organization:name",
        label: "name",
        kind: "slot",
        description: "Organization",
      },
      {
        id: "slot:Organization:members",
        label: "members",
        kind: "slot",
        description: "Organization",
      },
    ],
  },
  {
    id: "class:Event",
    label: "Event",
    kind: "class",
    description: "class",
    children: [
      {
        id: "slot:Event:title",
        label: "title",
        kind: "slot",
        description: "Event",
      },
      {
        id: "slot:Event:startDate",
        label: "startDate",
        kind: "slot",
        description: "Event",
      },
    ],
  },
];

const iconsByKind = {
  class: AccountTreeIcon,
  slot: LabelIcon,
  attribute: LabelIcon,
};

const meta: Meta<typeof OutlineTree> = {
  component: OutlineTree,
  title: "Packages/PortalUiComponents/OutlineTree",
  tags: ["package-story"],
  decorators: [
    (Story) => (
      <Box
        sx={{
          width: 360,
          height: 480,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OutlineTree>;

export const Default: Story = {
  args: {
    nodes: sampleNodes,
    iconsByKind,
    defaultExpandedIds: ["class:Person"],
    searchable: true,
  },
};

export const WithoutSearch: Story = {
  args: {
    nodes: sampleNodes,
    iconsByKind,
    searchable: false,
    defaultExpandedIds: ["class:Person", "class:Organization"],
  },
};

function CustomOnSelectDemo() {
  const [last, setLast] = useState<string>("(none yet)");
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography
        variant="caption"
        sx={{ px: 1, pt: 1 }}
        color="text.secondary"
      >
        Last selected: {last}
      </Typography>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <OutlineTree
          nodes={sampleNodes}
          iconsByKind={iconsByKind}
          defaultExpandedIds={["class:Person"]}
          onSelect={(node) => {
            setLast(`${node.kind}:${node.label} (${node.id})`);
          }}
        />
      </Box>
    </Box>
  );
}

export const CustomOnSelect: Story = {
  render: () => <CustomOnSelectDemo />,
};

export const NoIcons: Story = {
  args: {
    nodes: sampleNodes,
    defaultExpandedIds: ["class:Person"],
  },
};

export const Empty: Story = {
  args: {
    nodes: [],
    emptyMessage: "No classes found yet.",
  },
};
