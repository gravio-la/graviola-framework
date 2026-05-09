import { PrimaryFieldResults } from "@graviola/edb-core-types";
import { ellipsis } from "@graviola/edb-core-utils";
import {
  applyToEachField,
  extractFieldIfString,
} from "@graviola/edb-data-mapping";
import {
  MODAL_ENTITY_DETAIL,
  useAdbContext,
  useGraviolaModal,
  useTypeIRIFromEntity,
} from "@graviola/edb-state-hooks";
import { useCRUDWithQueryClient } from "@graviola/edb-state-hooks";
import { queryOptionMixinBasedOnEntity } from "@graviola/edb-ui-utils";
import { Avatar, Chip, ChipProps, Tooltip } from "@mui/material";
import { MouseEvent, useCallback, useMemo, useState } from "react";

export type EntityChipProps = {
  index?: number;
  disableLoad?: boolean;
  entityIRI: string;
  typeIRI?: string;
  data?: any;
} & ChipProps;
export const EntityChip = ({
  index,
  disableLoad,
  entityIRI,
  typeIRI,
  data: defaultData,
  ...chipProps
}: EntityChipProps) => {
  const classIRI = useTypeIRIFromEntity(entityIRI, typeIRI, disableLoad);
  const {
    queryBuildOptions: { primaryFieldExtracts, primaryFields },
    typeIRIToTypeName,
  } = useAdbContext();
  const detailModal = useGraviolaModal(MODAL_ENTITY_DETAIL);
  const typeName = useMemo(
    () => typeIRIToTypeName(classIRI),
    [classIRI, typeIRIToTypeName],
  );
  const {
    loadQuery: { data: rawData },
  } = useCRUDWithQueryClient({
    entityIRI,
    typeIRI: classIRI,
    queryOptions: {
      enabled: !disableLoad,
      refetchOnWindowFocus: true,
      ...queryOptionMixinBasedOnEntity(defaultData),
    },
    loadQueryKey: "show",
  });

  const data = rawData?.document;
  const cardInfo = useMemo<PrimaryFieldResults<string>>(() => {
    const fieldDecl = primaryFieldExtracts[typeName] || primaryFields[typeName];
    if (data && fieldDecl) {
      const { label, image, description } = applyToEachField(
        data,
        fieldDecl,
        extractFieldIfString,
      );
      return {
        label: ellipsis(label, 50),
        description: ellipsis(description, 50),
        image,
      };
    }
    return {
      label: null,
      description: null,
      image: null,
    };
  }, [typeName, data, primaryFieldExtracts, primaryFields]);
  const { label, image, description } = cardInfo;
  const [tooltipEnabled, setTooltipEnabled] = useState(false);
  const showDetailModal = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      detailModal.show(
        {
          entityIRI,
          typeIRI: classIRI,
          data,
        },
        {
          origin: { source: "advanced-components:EntityChip" },
        },
      );
    },
    [entityIRI, classIRI, data, detailModal],
  );
  const handleShouldShow = useCallback(
    (e: MouseEvent<Element>) => {
      setTooltipEnabled(true);
    },
    [setTooltipEnabled],
  );

  return (
    <Tooltip
      title={description}
      open={Boolean(description && description.length > 0 && tooltipEnabled)}
      onClose={() => setTooltipEnabled(false)}
    >
      <Chip
        {...chipProps}
        avatar={
          image ? (
            <Avatar alt={label} src={image} />
          ) : typeof index !== "undefined" ? (
            <Avatar>{index}</Avatar>
          ) : null
        }
        onMouseEnter={handleShouldShow}
        label={label}
        onClick={showDetailModal}
      />
    </Tooltip>
  );
};
