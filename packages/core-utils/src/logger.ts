import { Logger, LogLevel } from "@graviola/edb-core-types";

/**
 * Creates a no-op logger that discards all log messages
 * Useful for production environments where logging overhead is unwanted
 * @returns A logger that does nothing
 */
export function createNoOpLogger(): Logger {
  const noop = () => {};
  return {
    time: noop,
    timeEnd: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  };
}

/**
 * Log level priority for comparison
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Creates a console-based logger for development and debugging
 * @param minLevel Minimum log level to output (default: "info")
 * @returns A logger that writes to console
 */
export function createConsoleLogger(minLevel: LogLevel = "info"): Logger {
  const minPriority = LOG_LEVEL_PRIORITY[minLevel];

  const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVEL_PRIORITY[level] >= minPriority;
  };

  const formatContext = (context?: Record<string, any>): string => {
    if (!context || Object.keys(context).length === 0) {
      return "";
    }
    return " " + JSON.stringify(context);
  };

  return {
    time: (label: string) => {
      if (shouldLog("debug")) {
        console.time(label);
      }
    },
    timeEnd: (label: string) => {
      if (shouldLog("debug")) {
        console.timeEnd(label);
      }
    },
    debug: (message: string, context?: Record<string, any>) => {
      if (shouldLog("debug")) {
        console.debug(`[DEBUG] ${message}${formatContext(context)}`);
      }
    },
    info: (message: string, context?: Record<string, any>) => {
      if (shouldLog("info")) {
        console.info(`[INFO] ${message}${formatContext(context)}`);
      }
    },
    warn: (message: string, context?: Record<string, any>) => {
      if (shouldLog("warn")) {
        console.warn(`[WARN] ${message}${formatContext(context)}`);
      }
    },
    error: (message: string, context?: Record<string, any>) => {
      if (shouldLog("error")) {
        console.error(`[ERROR] ${message}${formatContext(context)}`);
      }
    },
  };
}
