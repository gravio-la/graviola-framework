import { JsonView } from "react-json-view-lite";
import { Divider, Grid, Typography } from "@mui/material";
import { useGlobalCRUDOptions } from "@graviola/edb-state-hooks";
import { SPARQLLocalOxigraphToolkit } from "./SPARQLLocalOxigraphToolkit";

type FormDebuggingToolsProps = {
  jsonData?: Record<string, any>;
};
export const FormDebuggingTools = ({ jsonData }: FormDebuggingToolsProps) => {
  const { crudOptions } = useGlobalCRUDOptions();

  return (
    <Grid container direction={"column"} spacing={2}>
      {Object.entries(jsonData).map(([key, value]) => {
        return (
          <Grid  key={key}>
            <Typography variant={"h3"}>{key}</Typography>
            <JsonView data={value} shouldExpandNode={(lvl) => lvl < 5} />
            <Divider />
          </Grid>
        );
      })}
      <Grid >
        <SPARQLLocalOxigraphToolkit sparqlQuery={crudOptions?.constructFetch} />
      </Grid>
    </Grid>
  );
};
