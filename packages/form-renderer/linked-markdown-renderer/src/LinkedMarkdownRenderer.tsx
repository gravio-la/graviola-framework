import { splitFrontmatter } from "@graviola/entity-ref-core";
import { ControlProps, showAsRequired } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { Edit, EditOff } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import merge from "lodash-es/merge";
import { useCallback, useState } from "react";

import { LinkedMdEditor } from "./LinkedMdEditor";
import { LinkedMdPreview } from "./LinkedMdPreview";

const LinkedMarkdownRendererComponent = (props: ControlProps) => {
  const {
    id,
    errors,
    label,
    uischema,
    visible,
    required,
    config,
    data,
    handleChange,
    path,
  } = props;
  const isValid = errors.length === 0;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const syntax =
    appliedUiSchemaOptions.linkSyntax === "wikilink" ? "wikilink" : "uri";
  const showBindingsPanel = appliedUiSchemaOptions.showBindingsPanel !== false;

  const [editMode, setEditMode] = useState(true);
  const markdown = (data || "") as string;
  const { frontmatter } = splitFrontmatter(markdown);

  const handleChange_ = useCallback(
    (v?: string) => {
      handleChange(path, v || "");
    },
    [path, handleChange],
  );

  if (!visible) {
    return null;
  }

  return (
    <FormControl
      fullWidth={!appliedUiSchemaOptions.trim}
      id={id}
      sx={(theme) => ({ marginBottom: theme.spacing(2) })}
    >
      <Grid container alignItems="baseline">
        <Grid>
          <FormLabel
            error={!isValid}
            required={showAsRequired(
              !!required,
              appliedUiSchemaOptions.hideRequiredAsterisk,
            )}
          >
            {label}
          </FormLabel>
        </Grid>
        <Grid>
          <IconButton onClick={() => setEditMode((prev) => !prev)}>
            {editMode ? <EditOff /> : <Edit />}
          </IconButton>
        </Grid>
      </Grid>

      {showBindingsPanel && frontmatter && (
        <Accordion disableGutters elevation={0} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="caption">
              Document bindings (frontmatter)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              component="pre"
              variant="caption"
              sx={{ m: 0, whiteSpace: "pre-wrap" }}
            >
              {JSON.stringify(frontmatter, null, 2)}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {editMode ? (
        <LinkedMdEditor
          value={markdown}
          onChange={handleChange_}
          syntax={syntax}
          enableKnowledgeBaseSearch={
            appliedUiSchemaOptions.enableKnowledgeBaseSearch !== false
          }
          knowledgeBaseTypeNames={
            appliedUiSchemaOptions.knowledgeBaseTypeNames as
              | string[]
              | undefined
          }
        />
      ) : (
        <LinkedMdPreview source={markdown} stripBindings />
      )}
    </FormControl>
  );
};

export const LinkedMarkdownRenderer = withJsonFormsControlProps(
  LinkedMarkdownRendererComponent,
);
