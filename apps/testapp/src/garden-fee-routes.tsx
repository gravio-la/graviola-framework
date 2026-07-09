import { Navigate, type RouteObject } from "react-router-dom";
import { GenericCreatePage } from "./pages/GenericCreatePage";
import { GenericDetailPage } from "./pages/GenericDetailPage";
import { GenericEditPage } from "./pages/GenericEditPage";
import { GenericListPage } from "./pages/GenericListPage";
import { GardenFeeListPage } from "./pages/GardenFeeListPage";

export const gardenFeeRouteObjects: RouteObject[] = [
  { index: true, element: <Navigate to="list/Garden" replace /> },
  { path: "create/:typeName", element: <GenericCreatePage /> },
  { path: "list/:typeName", element: <GardenFeeListPage /> },
  { path: "edit/:typeName/:entityID", element: <GenericEditPage /> },
  { path: "detail/:typeName/:entityID", element: <GenericDetailPage /> },
];
