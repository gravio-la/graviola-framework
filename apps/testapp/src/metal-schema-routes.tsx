import type { RouteObject } from "react-router-dom";
import { MetalFormPage } from "./pages/MetalFormPage";

export const metalSchemaRouteObjects: RouteObject[] = [
  { index: true, element: <MetalFormPage /> },
];
