import { PrimaryField, PrimaryFieldResults } from "@graviola/edb-core-types";
import { filterUndefOrNull } from "@graviola/edb-core-utils";
import {
  applyToEachField,
  extractFieldIfString,
} from "@graviola/edb-data-mapping";
import {
  useAdbContext,
  useCRUDWithQueryClient,
} from "@graviola/edb-state-hooks";
import { useTypeIRIFromEntity } from "@graviola/edb-state-hooks";
import { Box, BoxProps, CircularProgress, Typography } from "@mui/material";
import { useMemo } from "react";

import { EntityDetailCard } from "./EntityDetailCard";
import { queryOptionMixinBasedOnEntity } from "@graviola/edb-ui-utils";

export type EntityDetailElementProps = {
  typeIRI: string | undefined;
  entityIRI: string;
  data: any;
  cardActionChildren?: React.ReactNode;
  disableInlineEditing?: boolean;
  readonly?: boolean;
  disableLoad?: boolean;
  compactPreview?: boolean;
};

export const EntityDetailElement = ({
  typeIRI,
  entityIRI,
  data: initialData,
  cardActionChildren,
  disableInlineEditing,
  readonly,
  disableLoad,
  compactPreview,
  ...rest
}: EntityDetailElementProps & Partial<BoxProps>) => {
  const { sx: boxSx, ...boxRest } = rest as Partial<BoxProps>;

  const {
    queryBuildOptions: { primaryFields },
    typeIRIToTypeName,
  } = useAdbContext();
  const classIRI = useTypeIRIFromEntity(entityIRI, typeIRI, disableLoad);
  const typeName = useMemo(
    () => typeIRIToTypeName(classIRI),
    [classIRI, typeIRIToTypeName],
  );
  const {
    loadQuery: { data: rawData, isPending, isError, error },
  } = useCRUDWithQueryClient({
    entityIRI,
    typeIRI: classIRI,
    queryOptions: {
      enabled: Boolean(entityIRI && classIRI),
      refetchOnWindowFocus: true,
      ...queryOptionMixinBasedOnEntity(initialData),
    },
    loadQueryKey: "show",
  });
  const data = rawData?.document;
  const loadingPreview =
    Boolean(entityIRI && classIRI) && isPending && data == null;
  const fieldDeclaration = useMemo(
    () => primaryFields[typeName] as PrimaryField,
    [typeName, primaryFields],
  );
  const cardInfo = useMemo<PrimaryFieldResults<string>>(() => {
    if (data && fieldDeclaration)
      return applyToEachField(data, fieldDeclaration, extractFieldIfString);
    return {
      label: null,
      description: null,
      image: null,
    };
  }, [fieldDeclaration, data]);

  const disabledProperties = useMemo(
    () =>
      fieldDeclaration
        ? filterUndefOrNull(Object.values(fieldDeclaration))
        : [],
    [fieldDeclaration],
  );

  if (loadingPreview) {
    return (
      <Box
        {...boxRest}
        data-testid="entity-detail-loading"
        sx={[
          {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 140,
            minWidth: 200,
            p: 2,
          },
          ...(boxSx ? (Array.isArray(boxSx) ? boxSx : [boxSx]) : []),
        ]}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box
        {...boxRest}
        sx={[
          { p: 0, maxWidth: 360 },
          ...(boxSx ? (Array.isArray(boxSx) ? boxSx : [boxSx]) : []),
        ]}
      >
        <Typography variant="body2" color="error">
          {error instanceof Error ? error.message : "Could not load entity."}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      {...boxRest}
      sx={[
        compactPreview ? { p: 0 } : { p: 2 },
        ...(boxSx ? (Array.isArray(boxSx) ? boxSx : [boxSx]) : []),
      ]}
    >
      <EntityDetailCard
        typeIRI={classIRI}
        entityIRI={entityIRI}
        data={data}
        cardInfo={cardInfo}
        cardActionChildren={cardActionChildren}
        readonly={readonly}
        tableProps={{ disabledProperties }}
        cardProps={
          compactPreview
            ? {
                elevation: 0,
                sx: {
                  boxShadow: "none",
                  bgcolor: "transparent",
                },
              }
            : undefined
        }
      />
    </Box>
  );
};
