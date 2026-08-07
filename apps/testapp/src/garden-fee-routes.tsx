import { Navigate, type RouteObject } from "react-router-dom";
import { GenericCreatePage } from "./pages/GenericCreatePage";
import { GenericDetailPage } from "./pages/GenericDetailPage";
import { GardenFeeEditPage } from "./pages/GardenFeeEditPage";
import { GardenFeeListPage } from "./pages/GardenFeeListPage";
import { GardenFeePresentPage } from "./pages/GardenFeePresentPage";

export const gardenFeeRouteObjects: RouteObject[] = [
  { index: true, element: <Navigate to="present" replace /> },
  { path: "present", element: <GardenFeePresentPage /> },
  { path: "create/:typeName", element: <GenericCreatePage /> },
  { path: "list/:typeName", element: <GardenFeeListPage /> },
  { path: "edit/:typeName/:entityID", element: <GardenFeeEditPage /> },
  { path: "detail/:typeName/:entityID", element: <GenericDetailPage /> },
];
