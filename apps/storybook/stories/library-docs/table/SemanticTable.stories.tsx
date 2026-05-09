import type { Meta, StoryObj } from "@storybook/react";
import { Box } from "@mui/material";
import {
  SemanticTableView,
  adaptColumnFragmentToMrt,
} from "@graviola/edb-table-components";

const staticColumns = [
  adaptColumnFragmentToMrt({
    id: "name",
    header: "Name",
    accessorFn: (row: any) => row.name,
  }),
  adaptColumnFragmentToMrt({
    id: "kind",
    header: "Kind",
    accessorFn: (row: any) => row.kind,
  }),
];

const staticData = [
  { "@id": "urn:item:1", name: "Otto Dix", kind: "Person" },
  { "@id": "urn:item:2", name: "Historical Works", kind: "Tag" },
  { "@id": "urn:item:3", name: "Archive Shelf 2A", kind: "Location" },
];

const meta: Meta<typeof SemanticTableView> = {
  title: "Library Docs/Table/SemanticTable",
  component: SemanticTableView,
  tags: ["package-story"],
};

export default meta;

export const SemanticTableViewStatic: StoryObj<typeof SemanticTableView> = {
  render: () => (
    <Box sx={{ height: 500, display: "flex" }}>
      <SemanticTableView
        typeName="Item"
        columns={staticColumns as any}
        data={staticData}
        rowCount={staticData.length}
        columnOrder={["mrt-row-select", "name", "kind"]}
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={() => {}}
        sorting={[]}
        onSortingChange={() => {}}
        manualPagination={false}
      />
    </Box>
  ),
};

export const SemanticTableViewCompact: StoryObj<typeof SemanticTableView> = {
  render: () => (
    <Box sx={{ height: 500, display: "flex" }}>
      <SemanticTableView
        typeName="Item"
        columns={staticColumns as any}
        data={staticData.slice(0, 2)}
        rowCount={2}
        columnOrder={["mrt-row-select", "name", "kind"]}
        pagination={{ pageIndex: 0, pageSize: 10 }}
        onPaginationChange={() => {}}
        sorting={[]}
        onSortingChange={() => {}}
        manualPagination={false}
      />
    </Box>
  ),
};

export const SemanticTableViewWithActions: StoryObj<typeof SemanticTableView> =
  {
    render: () => (
      <Box sx={{ height: 500, display: "flex" }}>
        <SemanticTableView
          typeName="Item"
          columns={staticColumns as any}
          data={staticData}
          rowCount={staticData.length}
          columnOrder={["mrt-row-select", "name", "kind"]}
          pagination={{ pageIndex: 0, pageSize: 25 }}
          onPaginationChange={() => {}}
          sorting={[]}
          onSortingChange={() => {}}
          manualPagination={false}
          callbacks={{
            onCreateEntry: () => {},
            onShowEntry: () => {},
            onEditEntry: () => {},
            onMoveToTrashEntry: () => {},
            onRemoveEntry: () => {},
            onMoveToTrashSelected: () => {},
            onRemoveSelected: () => {},
          }}
        />
      </Box>
    ),
  };
