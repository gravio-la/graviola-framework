import { Box, Typography } from "@mui/material";
import {
  useAdbContext,
  useExtendedSchema,
  useFormDataStore,
} from "@graviola/edb-state-hooks";
import { SemanticJsonForm } from "@graviola/semantic-json-form";
import {
  BROWSER_FORM_HOST,
  selectLiveEvalSlots,
} from "@graviola/formula-runtime";
import { useComputedFields } from "@graviola/formula-runtime-react";
import {
  bringDefinitionToTop,
  stripXCalcProperties,
} from "@graviola/json-schema-utils";
import type { JSONSchema7 } from "json-schema";
import { isEqual } from "lodash-es";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useEntityIRIFromEntityID } from "../useEntityIRIFromEntityID";
import { gardenFeeCompiledProfile } from "../garden-fee-schema";
import { calcDebug } from "../demo/calcDebug";
import { useDebouncedValue } from "../demo/useDebouncedValue";

const liveGardenFeeProfile = selectLiveEvalSlots(
  gardenFeeCompiledProfile,
  BROWSER_FORM_HOST,
);

/** Pause before re-running formula-runtime while the user is still typing. */
const CALC_DEBOUNCE_MS = 200;

/**
 * Garden-fee edit: form schema is base+x-calc (no stmt/meta).
 * Display overlays policy-filtered live calcs; save strips x-calc via CRUD hook.
 *
 * JsonForms often emits onChange with no real edit — we only commit when
 * non-calc inputs change, and keep a stable displayData reference when the
 * evaluated snapshot is deep-equal (breaks the calc-debug spam loop).
 * Calc evaluation is debounced so continuous edits do not thrash HyperFormula.
 */
export function GardenFeeEditPage() {
  const { typeName, entityID } = useParams<{
    typeName: string;
    entityID: string;
  }>();
  const entityIRI = useEntityIRIFromEntityID(entityID);

  const {
    typeNameToTypeIRI,
    createEntityIRI,
    jsonLDConfig: { defaultPrefix, jsonldContext },
  } = useAdbContext();

  const [currentEntityIRI, setCurrentEntityIRI] = useState<string | undefined>(
    entityIRI,
  );

  useEffect(() => {
    if (entityIRI) {
      setCurrentEntityIRI(entityIRI);
    } else if (typeName) {
      setCurrentEntityIRI(createEntityIRI(typeName));
    }
  }, [entityIRI, typeName, createEntityIRI]);

  const typeIRI = typeName ? typeNameToTypeIRI(typeName) : undefined;
  const { formData, setFormData } = useFormDataStore({
    entityIRI: currentEntityIRI as string,
    typeIRI: typeIRI as string,
  });

  const formSchema = useExtendedSchema({ typeName: typeName ?? "" });

  const typeSchemaForStrip = useMemo(() => {
    if (!formSchema || !typeName) return undefined;
    return bringDefinitionToTop(
      formSchema as JSONSchema7,
      typeName,
    ) as JSONSchema7;
  }, [formSchema, typeName]);

  const handleFormDataChange = useCallback(
    (next: Record<string, unknown>) => {
      const incoming = typeSchemaForStrip
        ? stripXCalcProperties(next, typeSchemaForStrip)
        : next;
      const current = typeSchemaForStrip
        ? stripXCalcProperties(
            (formData ?? {}) as Record<string, unknown>,
            typeSchemaForStrip,
          )
        : ((formData ?? {}) as Record<string, unknown>);
      if (isEqual(incoming, current)) return;
      setFormData(incoming);
    },
    [formData, setFormData, typeSchemaForStrip],
  );

  const calcSource = useDebouncedValue(
    formData as Record<string, unknown> | undefined,
    CALC_DEBOUNCE_MS,
  );

  const { data: evaluated, computed } = useComputedFields(
    liveGardenFeeProfile,
    calcSource,
  );

  const displayDataRef = useRef<Record<string, unknown> | undefined>(undefined);
  const displayData = useMemo(() => {
    if (!formData || Object.keys(formData).length === 0) {
      displayDataRef.current = formData as Record<string, unknown> | undefined;
      return formData;
    }
    // Latest inputs on top of debounced calc overlay (calcs lag while typing).
    const merged = { ...evaluated, ...formData };
    if (displayDataRef.current && isEqual(displayDataRef.current, merged)) {
      return displayDataRef.current;
    }
    displayDataRef.current = merged;
    return merged;
  }, [formData, evaluated]);

  const lastLoggedRef = useRef<string>("");
  useEffect(() => {
    const key = JSON.stringify({
      vat: formData?.vat_rate,
      fee: formData?.fee_rate_per_sqm,
      annual_fee: computed?.annual_fee,
      annual_fee_gross: computed?.annual_fee_gross,
    });
    if (key === lastLoggedRef.current) return;
    lastLoggedRef.current = key;
    calcDebug("GardenFeeEditPage display", {
      vat: formData?.vat_rate,
      annual_fee: computed?.annual_fee,
      annual_fee_gross: computed?.annual_fee_gross,
      debounceMs: CALC_DEBOUNCE_MS,
    });
  }, [formData, computed]);

  if (!typeName || !entityIRI || !typeIRI) {
    return (
      <Typography color="error">Invalid edit route parameters.</Typography>
    );
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
      <Box sx={{ p: 2, maxWidth: 900 }}>
        <Typography variant="h5" gutterBottom>
          Edit {typeName}
        </Typography>
        <SemanticJsonForm
          wrapWithinCard
          entityIRI={formData?.["@id"] || currentEntityIRI}
          typeIRI={typeIRI}
          data={displayData}
          shouldLoadInitially={true}
          forceEditMode={true}
          onChange={handleFormDataChange}
          schema={formSchema}
          defaultPrefix={defaultPrefix}
          jsonldContext={jsonldContext as any}
        />
      </Box>
    </Box>
  );
}
