import { ArrayLayoutProps, ArrayTranslations } from "@jsonforms/core";
import {
  withArrayTranslationProps,
  withJsonFormsArrayLayoutProps,
  withTranslateProps,
} from "@jsonforms/react";
import React, { useCallback } from "react";

import { MaterialArrayInlineObjectLayout } from "./MaterialArrayInlineObjectLayout";

const MaterialArrayInlineObjectRendererComponent = ({
  visible,
  addItem,
  translations,
  ...props
}: ArrayLayoutProps & { translations: ArrayTranslations }) => {
  const addItemCb = useCallback(
    (p: string, value: unknown) => addItem(p, value),
    [addItem],
  );

  if (!visible) {
    return null;
  }

  return (
    <MaterialArrayInlineObjectLayout
      translations={translations}
      visible={visible}
      addItem={addItemCb}
      {...props}
    />
  );
};

export const MaterialArrayInlineObjectRenderer = withJsonFormsArrayLayoutProps(
  withTranslateProps(
    withArrayTranslationProps(MaterialArrayInlineObjectRendererComponent),
  ),
);
