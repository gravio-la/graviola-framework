import {
  PrimaryField,
  PrimaryFieldDeclaration,
} from "@graviola/edb-core-types";
import {
  applyToEachField,
  extractFieldIfString,
} from "@graviola/edb-data-mapping";
import type { CrudDatastoreStore } from "@graviola/edb-state-hooks";
import { FinderKnowledgeBaseDescription } from "@graviola/semantic-jsonform-types";
import { Storage as KnowledgebaseIcon } from "@mui/icons-material";

import { KBListItemRenderer } from "../show/KBListItemRenderer";

export const KBMainDatabase: (
  dataStore: CrudDatastoreStore,
  primaryFields: PrimaryFieldDeclaration,
  typeIRItoTypeName: (typeIRI: string) => string,
) => FinderKnowledgeBaseDescription = (
  dataStore,
  primaryFields,
  typeIRItoTypeName,
) => ({
  id: "kb",
  label: "Lokale Datenbank",
  description: "Datenbank der Ausstellung",
  icon: <KnowledgebaseIcon />,
  find: async (searchString, typeIRI, typeName, findOptions) => {
    const res = await dataStore.filterMany(typeName, {
      searchString: searchString ?? undefined,
      limit: findOptions?.limit,
    });
    return res.map((doc) => {
      const { label, image, description } = applyToEachField(
        doc,
        primaryFields[typeName] as PrimaryField,
        extractFieldIfString,
      );
      return {
        label,
        id: doc["@id"],
        avatar: image,
        secondary: description,
      };
    });
  },
  getEntity(id, typeIRI) {
    return dataStore.loadOne(typeIRItoTypeName(typeIRI), id);
  },
  listItemRenderer: (entry, idx, typeIRI, selected, onSelect, onAccept) => (
    <KBListItemRenderer
      data={entry}
      key={entry.id}
      idx={idx}
      typeIRI={typeIRI}
      selected={selected}
      onSelect={onSelect}
      onAccept={onAccept}
    />
  ),
});
