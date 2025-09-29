let hasImportMeta = false;
let hasProcess = false;

try {
  hasImportMeta =
    typeof import.meta !== "undefined" && import.meta.env !== undefined;
} catch (e) {
  hasImportMeta = false;
}
try {
  hasProcess = typeof process !== "undefined" && process.env !== undefined;
} catch (e) {
  hasProcess = false;
}

export const getEnvVar: <T extends string | undefined>(
  varName: string,
  defaultValue: T,
) => T = <T>(varName: string, defaultValue: T) => {
  const prefixes = ["NEXT_PUBLIC_", "VITE_", "STORYBOOK_", ""];
  try {
    for (const prefix of prefixes) {
      const key = prefix + varName;
      if (hasImportMeta && import.meta.env[key]) {
        return import.meta.env[key] as T;
      }
      if (hasProcess && process.env[key]) {
        return process.env[key] as T;
      }
    }
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const getAllEnvVars = () => {
  if (hasImportMeta) {
    return import.meta.env;
  }
  if (hasProcess) {
    return process.env;
  }
  return {};
};

export const allEnvToString = () => {
  const env = getAllEnvVars();
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
};
