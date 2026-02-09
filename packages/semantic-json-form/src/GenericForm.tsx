import {
  useAdbContext,
  useExtendedSchema,
  useFormDataStore,
} from "@graviola/edb-state-hooks";
import { SemanticJsonForm } from "./SemanticJsonForm";
import {
  useCallback,
  useEffect,
  useState,
  type FunctionComponent,
} from "react";
import type { SemanticJsonFormProps } from "@graviola/semantic-jsonform-types";

type OwnProps = {
  entityIRI?: string;
  typeName: string;
  onFormDataChange?: (formData: any) => void;
};

type Props = OwnProps &
  Partial<
    Omit<
      SemanticJsonFormProps,
      | "entityIRI"
      | "typeIRI"
      | "data"
      | "schema"
      | "defaultPrefix"
      | "jsonldContext"
    >
  >;

export const GenericForm: FunctionComponent<Props> = ({
  entityIRI,
  typeName,
  onFormDataChange,
  ...props
}) => {
  const {
    typeNameToTypeIRI,
    createEntityIRI,
    jsonLDConfig: { defaultPrefix, jsonldContext },
  } = useAdbContext();
  const [currentEntityIRI, setCurrentEntityIRI] = useState<string | undefined>(
    entityIRI,
  );

  // Update myIRI when entityIRI changes
  useEffect(() => {
    if (entityIRI) {
      setCurrentEntityIRI(entityIRI);
    } else {
      setCurrentEntityIRI(createEntityIRI(typeName));
    }
  }, [entityIRI, typeName, createEntityIRI]);

  const typeIRI = typeNameToTypeIRI(typeName);
  const { formData, setFormData } = useFormDataStore({
    entityIRI: currentEntityIRI,
    typeIRI,
  });

  const handleFormDataChange = useCallback(
    (formData: any) => {
      setFormData(formData);
      onFormDataChange?.(formData);
    },
    [onFormDataChange, setFormData],
  );

  const extendedSchema = useExtendedSchema({ typeName });

  return (
    <SemanticJsonForm
      wrapWithinCard
      {...props}
      entityIRI={formData?.["@id"] || currentEntityIRI}
      typeIRI={typeIRI}
      data={formData}
      shouldLoadInitially={true}
      forceEditMode
      onChange={handleFormDataChange}
      schema={extendedSchema}
      defaultPrefix={defaultPrefix}
      jsonldContext={jsonldContext as any}
    />
  );
};
