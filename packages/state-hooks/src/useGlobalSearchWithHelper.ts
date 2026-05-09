import { useGlobalSearch } from "./useGlobalSearch";
import { useCallback, useState } from "react";
import type { JSONSchema7 } from "json-schema";
import { useAdbContext } from "./provider";

export const useGlobalSearchWithHelper = (
  typeName: string,
  typeIRI: string,
  schema: JSONSchema7,
  formsPath: string,
  onDataAccepted?: (data: any) => void,
) => {
  const {
    createEntityIRI,
    queryBuildOptions: { primaryFields },
  } = useAdbContext();
  const globalSearch = useGlobalSearch();
  const { setTypeName, setPath, setSearch, path } = globalSearch;

  const isActive = path === formsPath;
  const [searchString, setSearchString] = useState<string | undefined>();
  const handleSearchStringChange = useCallback(
    (value: string | undefined) => {
      setSearchString(value);
      setSearch(value || "");
    },
    [setSearchString, setSearch],
  );
  const handleMappedData = useCallback(
    (newData: any) => {
      onDataAccepted && onDataAccepted(newData);
    },
    [onDataAccepted, typeIRI, typeName, createEntityIRI, primaryFields],
  );

  const handleFocus = useCallback(() => {
    setTypeName(typeName);
    setPath(formsPath);
    setSearch(searchString || "");
  }, [searchString, setSearch, setTypeName, typeName, setPath, formsPath]);

  return {
    ...globalSearch,
    handleSearchStringChange,
    handleMappedData,
    handleFocus,
    searchString,
    isActive,
  };
};
