import { ControlProps, showAsRequired } from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { FormControl, FormLabel, Grid, IconButton } from "@mui/material";
import merge from "lodash-es/merge";
import { useCallback, useState } from "react";

const AutoIdentifierRendererComponent = (props: ControlProps) => {
  const {
    id,
    errors,
    schema,
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
  const [editMode, setEditMode] = useState(false);

  return (
    config?.debug && (
      <FormControl
        fullWidth={!appliedUiSchemaOptions.trim}
        id={id}
        sx={(theme) => ({ marginBottom: theme.spacing(2) })}
      >
        <Grid container alignItems="baseline">
          <Grid >
            <IconButton onClick={() => setEditMode((prev) => !prev)}>
              {editMode ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </Grid>
          {editMode && (
            <Grid >
              <FormLabel
                error={!isValid}
                required={showAsRequired(
                  !!required,
                  appliedUiSchemaOptions.hideRequiredAsterisk,
                )}
              >
                {data || ""}
              </FormLabel>
            </Grid>
          )}
        </Grid>
      </FormControl>
    )
  );
};

export const AutoIdentifierRenderer = withJsonFormsControlProps(
  AutoIdentifierRendererComponent,
);
