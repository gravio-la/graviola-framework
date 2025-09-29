import React from "react";
import { allEnvToString, getEnvVar } from "./getEnv";

export interface EnvDisplayProps {
  /** Environment variable name to display */
  envVarName?: string;
}

/** Simple component to display environment variables */
export const EnvDisplay = ({
  envVarName = "STORYBOOK_BASE_PATH",
}: EnvDisplayProps) => {
  const envValue = getEnvVar<string>(envVarName, "");

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#333", marginBottom: "10px" }}>
        Environment Variable Test
      </h1>
      <div
        style={{
          padding: "15px",
          backgroundColor: "#f5f5f5",
          borderRadius: "5px",
          border: "1px solid #ddd",
        }}
      >
        <strong>Variable:</strong> {envVarName}
        <br />
        <strong>Value:</strong>{" "}
        <span
          style={{
            color: envValue ? "#28a745" : "#dc3545",
            fontWeight: "bold",
          }}
        >
          {envValue || "(not set or empty)"}
        </span>
      </div>
      <div
        style={{
          padding: "15px",
          backgroundColor: "#f5f5f5",
          borderRadius: "5px",
          border: "1px solid #ddd",
        }}
      >
        <strong>All Environment Variables:</strong> {allEnvToString()}
      </div>
    </div>
  );
};
