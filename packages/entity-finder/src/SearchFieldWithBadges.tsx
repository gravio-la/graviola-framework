import { useAdbContext } from "@graviola/edb-state-hooks";
import { FinderKnowledgeBaseDescription } from "@graviola/semantic-jsonform-types";
import { AddCircle } from "@mui/icons-material";
import {
  Badge,
  Box,
  Divider,
  Grid,
  IconButton,
  TextField,
  TextFieldProps,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import * as React from "react";
import { useMemo } from "react";

export const SearchFieldWithBadges = ({
  searchString,
  typeIRI,
  onSearchStringChange,
  selectedKnowledgeSources,
  onCreateNew,
  toggleKnowledgeSource,
  knowledgeBases,
  advancedConfigChildren,
  ...rest
}: {
  searchString: string;
  typeIRI: string;
  onCreateNew?: () => void;
  onSearchStringChange: (value: string) => void;
  knowledgeBases: FinderKnowledgeBaseDescription[];
  selectedKnowledgeSources: string[];
  toggleKnowledgeSource?: (source: string) => void;
  advancedConfigChildren?: React.ReactNode;
} & Partial<TextFieldProps>) => {
  const { typeIRIToTypeName } = useAdbContext();
  const typeName = useMemo(
    () => typeIRIToTypeName(typeIRI),
    [typeIRI, typeIRIToTypeName],
  );
  const { t } = useTranslation();
  return (
    <Grid
      container
      spacing={1}
      sx={{
        m: 0,
        p: 1,
        width: "auto",
      }}
    >
      {onCreateNew && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mr: 0,
          }}
        >
          <Tooltip title={`${t("create_new")} ${t(typeName)}`}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => {
                // This will be handled by the parent component
                if (onCreateNew) {
                  onCreateNew();
                }
              }}
            >
              <AddCircle />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <Box sx={{ flexGrow: 1 }}>
        <TextField
          variant={"standard"}
          fullWidth={true}
          value={searchString || ""}
          onChange={(e) => onSearchStringChange(e.currentTarget.value)}
          label={`Suche in ${selectedKnowledgeSources.join(",")} nach ${t(
            typeName,
          )} `}
          {...rest}
        />
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
        {knowledgeBases.map(({ id, label, icon }) => {
          return (
            <Tooltip title={label} key={id}>
              <Badge
                color="primary"
                sx={{ m: 0.5 }}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                variant="dot"
                overlap="circular"
                invisible={!selectedKnowledgeSources?.includes(id)}
              >
                {icon}
              </Badge>
            </Tooltip>
          );
        })}
        {advancedConfigChildren && (
          <>
            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
            {advancedConfigChildren}
          </>
        )}
      </Box>
    </Grid>
  );
};
