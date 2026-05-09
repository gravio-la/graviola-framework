import { ClassicResultListItem } from "@graviola/edb-basic-components";
import { Entity } from "@graviola/edb-core-types";
import {
  useAdbContext,
  useDataStore,
  useQueryClient,
} from "@graviola/edb-state-hooks";
import { List } from "@mui/material";
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { EntityDetailElement } from "../show";

export type DiscoverSearchTableProps = {
  searchString: string;
  typeName?: string;
  onAcceptItem?: (id: string | undefined, data: any) => void;
  selectedIndex?: number;
  limit?: number;
};

export const DiscoverSearchTable: FunctionComponent<
  DiscoverSearchTableProps
> = ({
  searchString,
  typeName = "Person",
  onAcceptItem,
  selectedIndex,
  limit,
}) => {
  const [resultTable, setResultTable] = useState<any | undefined>();
  const { typeNameToTypeIRI } = useAdbContext();
  const queryClient = useQueryClient();
  const typeIRI = useMemo(
    () => typeNameToTypeIRI(typeName),
    [typeName, typeNameToTypeIRI],
  );

  const { dataStore, ready } = useDataStore();

  const fetchData = useCallback(async () => {
    if (!searchString || searchString.length < 1 || !typeIRI || !ready) return;
    const result = await queryClient.fetchQuery<Entity[]>({
      queryKey: ["type", typeIRI, "search", searchString],
      queryFn: () =>
        dataStore?.findEntityByTypeName(typeName, searchString, limit),
    });
    setResultTable(
      result.map(({ label = "", entityIRI, description, image }) => {
        return {
          label,
          id: entityIRI,
          secondary: description,
          avatar: image,
        };
      }),
    );
  }, [searchString, typeIRI, ready, dataStore, queryClient, typeName, limit]);

  const handleSelect = useCallback(
    (id: string | undefined) => {
      const data = id && resultTable?.find((entry) => entry.id === id);
      if (data) onAcceptItem?.(id, data);
    },
    [resultTable, onAcceptItem],
  );

  useEffect(() => {
    fetchData();
  }, [searchString, typeName, fetchData]);

  return (
    <List>
      {// @ts-ignore
      resultTable?.map(({ id, label, avatar, secondary }, idx) => {
        return (
          <ClassicResultListItem
            key={id}
            id={id}
            index={idx}
            onSelected={handleSelect}
            label={label}
            secondary={secondary}
            avatar={avatar}
            altAvatar={idx + 1}
            selected={selectedIndex === idx}
            popperChildren={
              <EntityDetailElement
                compactPreview
                sx={{
                  maxWidth: "30em",
                  maxHeight: "80vh",
                  overflow: "auto",
                }}
                entityIRI={id}
                typeIRI={typeIRI}
                data={undefined}
                cardActionChildren={null}
                readonly
              />
            }
          />
        );
      })}
    </List>
  );
};
