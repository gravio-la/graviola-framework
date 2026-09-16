import {
  type EntityEmbedView,
  type EntityRef,
} from "@graviola/entity-ref-core";
import {
  useAdbContext,
  useOptionalFinderSlot,
} from "@graviola/edb-state-hooks";
import { defs } from "@graviola/json-schema-utils";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  DialogContent,
  Drawer,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import get from "lodash-es/get";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSONSchema7 } from "json-schema";

export type EntityLinkFinderDrawerProps = {
  open: boolean;
  onClose: () => void;
  onAccept: (ref: EntityRef) => void;
  typeNames?: string[];
  initialTypeName?: string;
  defaultView?: EntityEmbedView;
};

function resolveTypeNames(
  schema: JSONSchema7,
  typeNameToTypeIRI: (name: string) => string,
  typeNames?: string[],
): string[] {
  if (typeNames?.length) {
    return typeNames;
  }
  return Object.keys(defs(schema)).filter((name) => {
    const iri = typeNameToTypeIRI(name);
    return iri !== name;
  });
}

function labelFromEntityData(
  data: Record<string, unknown>,
  typeName: string,
  entityIRI: string,
  primaryFields: Record<string, { label?: string } | undefined>,
): string {
  const labelKey = primaryFields[typeName]?.label ?? "name";
  const fromField = get(data, labelKey);
  if (typeof fromField === "string" && fromField.trim()) {
    return fromField;
  }
  if (typeof data.__label === "string" && data.__label.trim()) {
    return data.__label;
  }
  return entityIRI.split("/").pop() ?? entityIRI;
}

export function EntityLinkFinderDrawer({
  open,
  onClose,
  onAccept,
  typeNames,
  initialTypeName,
  defaultView = "chip",
}: EntityLinkFinderDrawerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const Finder = useOptionalFinderSlot();
  const {
    schema,
    typeNameToTypeIRI,
    queryBuildOptions: { primaryFields },
  } = useAdbContext();

  const availableTypeNames = useMemo(
    () => resolveTypeNames(schema as JSONSchema7, typeNameToTypeIRI, typeNames),
    [schema, typeNameToTypeIRI, typeNames],
  );

  const [activeTypeName, setActiveTypeName] = useState(
    initialTypeName ?? availableTypeNames[0] ?? "",
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }
    const preferred =
      initialTypeName && availableTypeNames.includes(initialTypeName)
        ? initialTypeName
        : availableTypeNames[0];
    if (preferred) {
      setActiveTypeName(preferred);
    }
  }, [open, initialTypeName, availableTypeNames]);

  const handleExistingEntityAccepted = useCallback(
    (entityIRI: string, data: unknown) => {
      const record = (data ?? {}) as Record<string, unknown>;
      const typeName = activeTypeName;
      const label = labelFromEntityData(
        record,
        typeName,
        entityIRI,
        primaryFields as Record<string, { label?: string } | undefined>,
      );
      onAccept({
        typeName,
        entityIRI,
        entityId: entityIRI.split("/").pop() ?? entityIRI,
        label,
        view: defaultView,
      });
      onClose();
    },
    [activeTypeName, defaultView, onAccept, onClose, primaryFields],
  );

  const closeBtn = (
    <Toolbar
      variant="dense"
      sx={{ justifyContent: "space-between", minHeight: 48 }}
    >
      <Typography variant="subtitle1">Search knowledge base</Typography>
      <IconButton edge="end" onClick={onClose} aria-label="close">
        <CloseIcon />
      </IconButton>
    </Toolbar>
  );

  const typeTabs =
    availableTypeNames.length > 1 ? (
      <Tabs
        value={activeTypeName}
        onChange={(_, value: string) => setActiveTypeName(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: "divider", px: 1 }}
      >
        {availableTypeNames.map((name) => (
          <Tab key={name} label={name} value={name} />
        ))}
      </Tabs>
    ) : availableTypeNames.length === 1 ? (
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary">
          Entity type
        </Typography>
        <Typography variant="subtitle2">{availableTypeNames[0]}</Typography>
      </Box>
    ) : (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          No entity types configured for search.
        </Typography>
      </Box>
    );

  const finderBody =
    Finder && activeTypeName ? (
      <Finder
        finderId={`linked-md-${activeTypeName}`}
        classIRI={typeNameToTypeIRI(activeTypeName)}
        jsonSchema={schema as JSONSchema7}
        search={search}
        onSearchChange={setSearch}
        hideFooter
        onExistingEntityAccepted={handleExistingEntityAccepted}
      />
    ) : (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Similarity finder is not available. Wrap the app with
          GraviolaAppProvider.
        </Typography>
      </Box>
    );

  const content = (
    <>
      {typeTabs}
      <Box sx={{ overflow: "auto", flex: 1, pb: 2 }}>{finderBody}</Box>
    </>
  );

  if (isMobile) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" fullScreen>
        {closeBtn}
        <DialogContent sx={{ pt: 0, display: "flex", flexDirection: "column" }}>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        zIndex: (t) => t.zIndex.modal,
        "& .MuiDrawer-paper": {
          width: 480,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {closeBtn}
      {content}
    </Drawer>
  );
}
