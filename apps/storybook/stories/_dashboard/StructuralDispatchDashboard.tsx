import React, { useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import NiceModal from "@ebay/nice-modal-react";
import { QueryClient, QueryClientProvider } from "@graviola/edb-state-hooks";
import { ThemeComponent } from "@graviola/edb-default-theme";
import {
  SemanticCardNoOps,
  SemanticChipNoOps,
  SemanticDetailViewNoOps,
  SemanticListItemNoOps,
} from "@graviola/semantic-views";
import { bringDefinitionToTop } from "@graviola/json-schema-utils";
import type { TableUiSchema } from "@graviola/edb-table-types";
import {
  SemanticTableView,
  composeJsonLdColumns,
  JsonLdTableProvider,
} from "@graviola/edb-table-components";

import {
  storyDomains,
  getStoryDomain,
  type StoryDomain,
  type StoryDomainId,
} from "../_shared/storyDomains";
import {
  DomainProvider,
  DashboardFormPreview,
} from "../_shared/DomainProvider";
import { storybookHref } from "../_shared/storybookHref";

type ViewFamilyId = "detail" | "forms" | "chips" | "cards" | "lists" | "tables";

type ViewFamilyConfig = {
  id: ViewFamilyId;
  title: string;
  tagline: string;
  docsStoryId: string;
};

const VIEW_FAMILIES: ViewFamilyConfig[] = [
  {
    id: "detail",
    title: "Detail views",
    tagline: "Full read-only entity pages, generated from the schema.",
    docsStoryId: "structural-dispatch-semantic-detail-views--docs",
  },
  {
    id: "forms",
    title: "Forms",
    tagline: "Editable forms for the very same entity, same schema.",
    docsStoryId: "structural-dispatch-semantic-forms--docs",
  },
  {
    id: "chips",
    title: "Chips",
    tagline: "Compact references that stand in for an entity.",
    docsStoryId: "structural-dispatch-semantic-chips--docs",
  },
  {
    id: "cards",
    title: "Cards",
    tagline: "M3 gallery tiles — schema + cardPresentation, not bespoke JSX.",
    docsStoryId: "structural-dispatch-semantic-cards--docs",
  },
  {
    id: "lists",
    title: "List items",
    tagline: "One row of a result list.",
    docsStoryId: "structural-dispatch-semantic-list-views--docs",
  },
  {
    id: "tables",
    title: "Tables",
    tagline:
      "Sortable, paginated tables with columns inferred from the schema.",
    docsStoryId: "structural-dispatch-semantic-tables--docs",
  },
];

const DASHBOARD_TABLE_UI: Partial<Record<StoryDomainId, TableUiSchema>> = {
  "item-catalog": {
    type: "Table",
    mode: "whitelist",
    columns: [
      { scope: "#/properties/name", label: "Name" },
      { scope: "#/properties/description", label: "Description" },
      { scope: "#/properties/tags", label: "Tags" },
    ],
  },
  music: {
    type: "Table",
    mode: "whitelist",
    columns: [
      { scope: "#/properties/title", label: "Title" },
      { scope: "#/properties/bwv", label: "BWV" },
      { scope: "#/properties/releaseYear", label: "Year" },
      { scope: "#/properties/genre", label: "Genre" },
    ],
  },
  exhibition: {
    type: "Table",
    mode: "whitelist",
    columns: [
      { scope: "#/properties/title", label: "Title" },
      { scope: "#/properties/fromDateDisplay", label: "From" },
      { scope: "#/properties/toDateDisplay", label: "To" },
      { scope: "#/properties/places", label: "Places" },
    ],
  },
};

function dashboardTableRows(
  domain: StoryDomain,
  typeName: string,
): Record<string, unknown>[] {
  const rows = domain.samples[typeName];
  if (rows?.length) return rows;
  return domain.samples[domain.defaultTypeName] ?? [];
}

function DashboardTablePreview({
  domain,
  typeName,
}: {
  domain: StoryDomain;
  typeName: string;
}) {
  const loadedSchema = useMemo(
    () => bringDefinitionToTop(domain.schema, typeName),
    [domain.schema, typeName],
  );

  const columns = useMemo(
    () =>
      composeJsonLdColumns(loadedSchema, {
        typeName,
        tableUiSchema: DASHBOARD_TABLE_UI[domain.id],
        t: (key) => key,
      }),
    [loadedSchema, domain.id, typeName],
  );

  const rows = useMemo(
    () => dashboardTableRows(domain, typeName),
    [domain, typeName],
  );

  const columnOrder = useMemo(
    () => columns.map((col) => String(col.id ?? "")).filter(Boolean),
    [columns],
  );

  return (
    <JsonLdTableProvider
      value={{
        ChipComponent: SemanticChipNoOps,
        typeIRIToTypeName: domain.typeIRIToTypeName,
      }}
    >
      <Box sx={{ height: 320, display: "flex", width: "100%" }}>
        <SemanticTableView
          typeName={typeName}
          columns={columns}
          data={rows}
          rowCount={rows.length}
          columnOrder={columnOrder}
          pagination={{ pageIndex: 0, pageSize: 10 }}
          onPaginationChange={() => {}}
          sorting={[]}
          onSortingChange={() => {}}
          manualPagination={false}
        />
      </Box>
    </JsonLdTableProvider>
  );
}

const GRID_AREAS = {
  xs: `"detail" "forms" "chips" "cards" "lists" "tables"`,
  md: `"detail detail detail detail" "forms forms chips chips" "forms forms cards cards" "forms forms lists lists" "tables tables tables tables"`,
  lg: `"detail detail detail detail" "forms forms chips chips" "forms forms cards cards" "forms forms lists lists" "tables tables tables tables"`,
} as const;

/** Light tinted panels — intensify on hover. */
const FAMILY_TONE: Record<
  ViewFamilyId,
  { hue: string; hoverHue: string; minHeight: number }
> = {
  detail: { hue: "#e8eaf6", hoverHue: "#c5cae9", minHeight: 280 },
  forms: { hue: "#e3f2fd", hoverHue: "#bbdefb", minHeight: 280 },
  chips: { hue: "#fce4ec", hoverHue: "#f8bbd0", minHeight: 140 },
  cards: { hue: "#fff3e0", hoverHue: "#ffe0b2", minHeight: 200 },
  lists: { hue: "#e8f5e9", hoverHue: "#c8e6c9", minHeight: 160 },
  tables: { hue: "#f3e5f5", hoverHue: "#e1bee7", minHeight: 360 },
};

function ViewFamilyPreview({
  familyId,
  typeName,
  sample,
  domain,
}: {
  familyId: ViewFamilyId;
  typeName: string;
  sample: Record<string, unknown>;
  domain: StoryDomain;
}) {
  const entityIRI = String(sample["@id"] ?? "");

  switch (familyId) {
    case "forms":
      return <DashboardFormPreview typeName={typeName} data={sample} />;
    case "chips":
      return (
        <SemanticChipNoOps
          typeName={typeName}
          entityIRI={entityIRI}
          data={sample}
        />
      );
    case "detail":
      return (
        <Box
          sx={{
            width: "100%",
            alignSelf: "stretch",
            maxHeight: 360,
            overflow: "auto",
            "& > *": { width: "100%", maxWidth: "100%" },
          }}
        >
          <SemanticDetailViewNoOps
            typeName={typeName}
            entityIRI={entityIRI}
            data={sample}
          />
        </Box>
      );
    case "cards":
      return (
        <Box sx={{ width: "100%", maxWidth: 340, mx: "auto" }}>
          <SemanticCardNoOps
            typeName={typeName}
            entityIRI={entityIRI}
            data={sample}
            motionId={entityIRI}
          />
        </Box>
      );
    case "lists":
      return (
        <SemanticListItemNoOps
          typeName={typeName}
          entityIRI={entityIRI}
          data={sample}
        />
      );
    case "tables":
      return <DashboardTablePreview domain={domain} typeName={typeName} />;
    default:
      return null;
  }
}

function PreviewCard({
  family,
  typeName,
  sample,
  domain,
}: {
  family: ViewFamilyConfig;
  typeName: string;
  sample: Record<string, unknown>;
  domain: StoryDomain;
}) {
  const tone = FAMILY_TONE[family.id];

  return (
    <Paper
      elevation={0}
      className="preview-family-card"
      sx={(theme) => ({
        gridArea: family.id,
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.common.black, 0.06)}`,
        backgroundColor: tone.hue,
        minHeight: tone.minHeight,
        transition: theme.transitions.create(
          ["box-shadow", "transform", "background-color"],
          { duration: theme.transitions.duration.shorter },
        ),
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: theme.shadows[8],
          backgroundColor: tone.hoverHue,
          "& .preview-content": {
            WebkitMaskImage:
              "linear-gradient(180deg, #000 0%, #000 42%, transparent 100%)",
            maskImage:
              "linear-gradient(180deg, #000 0%, #000 42%, transparent 100%)",
          },
          "& .preview-bottom-fade": {
            opacity: 1,
            background: `linear-gradient(
              180deg,
              transparent 0%,
              transparent 38%,
              ${alpha(tone.hoverHue, 0.55)} 72%,
              ${tone.hoverHue} 100%
            )`,
          },
          "& .preview-card-footer": {
            opacity: 1,
            pointerEvents: "auto",
          },
        },
      })}
    >
      <Box
        sx={{
          position: "relative",
          height: "100%",
          minHeight: tone.minHeight,
          p: { xs: 2, md: 2.5 },
          display: "flex",
          alignItems:
            family.id === "chips"
              ? "center"
              : family.id === "detail"
                ? "stretch"
                : "flex-start",
          justifyContent: family.id === "detail" ? "flex-start" : "center",
        }}
      >
        <Box
          className="preview-content"
          sx={(theme) => ({
            width: "100%",
            minWidth: 0,
            zIndex: 0,
            transition: theme.transitions.create(
              ["-webkit-mask-image", "mask-image"],
              { duration: theme.transitions.duration.shorter },
            ),
          })}
        >
          <ViewFamilyPreview
            familyId={family.id}
            typeName={typeName}
            sample={sample}
            domain={domain}
          />
        </Box>

        <Box
          className="preview-bottom-fade"
          aria-hidden
          sx={(theme) => ({
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "58%",
            zIndex: 1,
            opacity: 0,
            pointerEvents: "none",
            transition: theme.transitions.create(["opacity", "background"], {
              duration: theme.transitions.duration.shorter,
            }),
            background: `linear-gradient(
              180deg,
              transparent 0%,
              transparent 38%,
              ${alpha(tone.hue, 0.55)} 72%,
              ${tone.hue} 100%
            )`,
          })}
        />

        <Box
          className="preview-card-footer"
          sx={(theme) => ({
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
            p: { xs: 2, md: 2.5 },
            opacity: 0,
            pointerEvents: "none",
            transition: theme.transitions.create("opacity", {
              duration: theme.transitions.duration.shorter,
            }),
          })}
        >
          <Button
            size="medium"
            variant="contained"
            disableElevation
            endIcon={<ArrowForwardIcon />}
            href={storybookHref(family.docsStoryId)}
            target="_parent"
            sx={{
              flexShrink: 0,
              textTransform: "none",
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Explore
          </Button>
          <Typography
            variant="h5"
            component="h3"
            fontWeight={800}
            textAlign="right"
            sx={{ letterSpacing: -0.3, lineHeight: 1.2, minWidth: 0 }}
          >
            {family.title}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

const dashboardQueryClient = new QueryClient();

/**
 * MDX docs content renders outside Storybook's preview decorators, so the dashboard
 * supplies its own infrastructure (theme, query client, modals, date locale).
 */
export function StructuralDispatchDashboard() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeComponent>
        <QueryClientProvider client={dashboardQueryClient}>
          <NiceModal.Provider>
            <DashboardContent />
          </NiceModal.Provider>
        </QueryClientProvider>
      </ThemeComponent>
    </LocalizationProvider>
  );
}

function DashboardContent() {
  const [domainId, setDomainId] = useState<StoryDomainId>("music");
  const domain = useMemo(() => getStoryDomain(domainId), [domainId]);
  const [typeName, setTypeName] = useState(domain.defaultTypeName);

  const sample = useMemo(() => {
    const rows = domain.samples[typeName];
    return rows?.[0] ?? domain.samples[domain.defaultTypeName][0];
  }, [domain, typeName]);

  const handleDomainChange = (event: SelectChangeEvent<StoryDomainId>) => {
    const nextId = event.target.value as StoryDomainId;
    setDomainId(nextId);
    setTypeName(getStoryDomain(nextId).defaultTypeName);
  };

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setTypeName(event.target.value);
  };

  return (
    <Box sx={{ maxWidth: 1180, mx: "auto", py: { xs: 2, md: 4 } }}>
      <Box
        sx={(theme) => ({
          borderRadius: 4,
          px: { xs: 3, md: 6 },
          py: { xs: 4, md: 6 },
          mb: 4,
          color: theme.palette.primary.contrastText,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(
            theme.palette.secondary.main,
            0.92,
          )} 100%)`,
        })}
      >
        <Chip
          label="Schema-driven UI"
          size="small"
          sx={(theme) => ({
            mb: 2,
            color: theme.palette.primary.contrastText,
            backgroundColor: alpha(theme.palette.common.white, 0.18),
            fontWeight: 600,
          })}
        />
        <Typography
          variant="h3"
          component="h1"
          fontWeight={800}
          sx={{ letterSpacing: -0.5, mb: 1.5 }}
        >
          One schema. Every view.
        </Typography>
        <Typography
          variant="h6"
          component="p"
          sx={{ fontWeight: 400, maxWidth: 760, opacity: 0.92 }}
        >
          Graviola reads the <strong>shape</strong> of your data and renders it
          as a detail page, an editable form, a chip, a card, a list row, or a
          table — no view code to write. Pick an example below and watch the
          same entity appear six different ways.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={(theme) => ({
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
        })}
      >
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="storybook-domain-label">Example domain</InputLabel>
          <Select
            labelId="storybook-domain-label"
            label="Example domain"
            value={domainId}
            onChange={handleDomainChange}
          >
            {storyDomains.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="storybook-type-label">Entity type</InputLabel>
          <Select
            labelId="storybook-type-label"
            label="Entity type"
            value={typeName}
            onChange={handleTypeChange}
          >
            {domain.typeNames.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          {domain.description}
        </Typography>
      </Paper>

      <DomainProvider domain={domain}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, md: 2.5 },
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(4, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gridTemplateAreas: {
              xs: GRID_AREAS.xs,
              md: GRID_AREAS.md,
              lg: GRID_AREAS.lg,
            },
          }}
        >
          {VIEW_FAMILIES.map((family) => (
            <PreviewCard
              key={family.id}
              family={family}
              typeName={typeName}
              sample={sample}
              domain={domain}
            />
          ))}
        </Box>
      </DomainProvider>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mt: 4, alignItems: { sm: "center" } }}
      >
        <Button
          variant="contained"
          size="large"
          disableElevation
          endIcon={<ArrowForwardIcon />}
          href={storybookHref("structural-dispatch-overview--docs")}
          target="_parent"
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          How structural dispatch works
        </Button>
        <Typography variant="body2" color="text.secondary">
          Or browse the deep-dive pages for each view family in the sidebar.
        </Typography>
      </Stack>
    </Box>
  );
}
