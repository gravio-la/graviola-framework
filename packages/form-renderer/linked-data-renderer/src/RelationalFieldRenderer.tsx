import {
  useAdbContext,
  useRelationalInputPreference,
  resolveRelationalInputMode,
} from "@graviola/edb-state-hooks";
import {
  ControlProps,
  isObjectArrayControl,
  rankWith,
  UISchemaElement,
} from "@jsonforms/core";
import { withJsonFormsControlProps } from "@jsonforms/react";
import { Box, IconButton, Tooltip } from "@mui/material";
import isEmpty from "lodash-es/isEmpty";
import { useTranslation } from "next-i18next";
import { InlineCondensedSemanticFormsRendererComponent } from "./InlineCondensedSemanticFormsRenderer";
import { InlineDropdownSemanticFormsRendererComponent } from "./InlineDropdownSemanticFormsRenderer";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TuneIcon from "@mui/icons-material/Tune";

/**
 * Matches relational (linked entity) controls that opt in via `options.inline`
 * or `options.dropdown === true`. Which UI is used is decided at render time.
 */
export const relationalFieldRendererTester = rankWith(
  20,
  (uischema: UISchemaElement, schema, ctx): boolean => {
    if (isEmpty(uischema) || isObjectArrayControl(uischema, schema, ctx)) {
      return false;
    }
    const options = uischema.options;
    if (isEmpty(options)) return false;
    return Boolean(options.inline) || options.dropdown === true;
  },
);

/**
 * Dispatcher: explicit `options.dropdown` (true/false) set by the model author
 * wins; otherwise the user preference, otherwise the app default, otherwise
 * "dropdown". Create-new stays available in both modes.
 */
export const RelationalFieldRendererComponent = (props: ControlProps) => {
  const [preference, setPreference] = useRelationalInputPreference();
  const { t } = useTranslation();
  const appDefault = useAdbContext<any>()?.relationalInputDefault;
  const explicit = props.uischema?.options?.dropdown;
  const explicitDropdown = typeof explicit === "boolean" ? explicit : undefined;
  // `preference` already folds in the app default; resolve handles explicit.
  const mode = resolveRelationalInputMode(
    explicitDropdown,
    preference,
    appDefault,
  );

  const uischema = {
    ...props.uischema,
    options: {
      ...props.uischema.options,
      ...(mode === "dropdown"
        ? { dropdown: true, finderButton: true }
        : { dropdown: false, finderButton: false }),
    },
  };

  const toggleToFinderLabel = t(
    "relationalInput.switchToFinder",
    "Zur Entity-Suche wechseln",
  ) as string;
  const toggleToDropdownLabel = t(
    "relationalInput.switchToDropdown",
    "Zum Dropdown wechseln",
  ) as string;
  const toggleLabel =
    mode === "dropdown" ? toggleToFinderLabel : toggleToDropdownLabel;

  const Child =
    mode === "dropdown"
      ? InlineDropdownSemanticFormsRendererComponent
      : InlineCondensedSemanticFormsRendererComponent;

  return (
    <Box
      data-testid="relational-field"
      data-relational-mode={mode}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        "& .relational-toggle": { opacity: 0.4, transition: "opacity 0.15s" },
        "&:hover .relational-toggle, &:focus-within .relational-toggle": {
          opacity: 1,
        },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Child {...(props as any)} uischema={uischema} />
      </Box>
      {explicitDropdown === undefined ? (
        <Tooltip title={toggleLabel || ""}>
          <span>
            <IconButton
              className="relational-toggle"
              size="small"
              aria-label={toggleLabel}
              data-testid="relational-toggle"
              onClick={() =>
                setPreference(mode === "dropdown" ? "finder" : "dropdown")
              }
              sx={{ mt: 1 }}
            >
              {mode === "dropdown" ? (
                <SwapHorizIcon fontSize="small" />
              ) : (
                <TuneIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      ) : null}
    </Box>
  );
};

export const RelationalFieldRenderer = withJsonFormsControlProps(
  RelationalFieldRendererComponent,
);
