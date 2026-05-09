import { useAdbContext, useSemanticFormSlot } from "@graviola/edb-state-hooks";
import { SemanticJsonFormProps } from "@graviola/semantic-jsonform-types";
import { JsonSchema } from "@jsonforms/core";
import { useControlled } from "@mui/material";
import { ErrorObject } from "ajv";
import { JSONSchema7 } from "json-schema";
import React, { useCallback, useMemo } from "react";

type SemanticFormsInlineProps = {
  label?: string;
  semanticJsonFormsProps?: Partial<SemanticJsonFormProps>;
  schema: JsonSchema;
  entityIRI?: string;
  typeIRI: string;
  onChange?: (data: string | undefined) => void;
  onError?: (error: ErrorObject[]) => void;
  formData?: any;
  onFormDataChange?: (data: any) => void;
  formsPath?: string;
  enabled?: boolean;
};
export const SemanticFormsInline = (props: SemanticFormsInlineProps) => {
  const {
    schema,
    entityIRI,
    onChange,
    onError,
    typeIRI,
    label,
    semanticJsonFormsProps,
    formData: formDataProp,
    onFormDataChange,
    formsPath,
    enabled,
  } = props;
  const [formData, setFormData] = useControlled({
    name: "FormData",
    controlled: formDataProp,
    default: entityIRI ? { "@id": entityIRI } : {},
  });

  const { typeIRIToTypeName, uischemata } = useAdbContext();
  const SemanticJsonForm = useSemanticFormSlot();
  const uischema = useMemo(
    () => uischemata?.[typeIRIToTypeName(typeIRI)],
    [typeIRI, typeIRIToTypeName],
  );

  const handleDataChange = useCallback(
    (data_: any) => {
      setFormData(data_);
      onFormDataChange?.(data_);
    },
    [setFormData, onFormDataChange],
  );

  return (
    <>
      {schema && (
        <SemanticJsonForm
          {...semanticJsonFormsProps}
          disabled={!enabled}
          data={formData}
          forceEditMode={true}
          onChange={handleDataChange}
          onError={onError}
          typeIRI={typeIRI}
          schema={schema as JSONSchema7}
          jsonFormsProps={{
            uischema: uischema,
          }}
          onEntityChange={onChange}
          formsPath={formsPath}
        />
      )}
    </>
  );
};
