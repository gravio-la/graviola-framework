/**
 * Log levels for the logger
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Logger interface for structured logging during graph extraction
 * Provides a facade that can be implemented by any logging framework
 */
export interface Logger {
  /**
   * Log debug information (detailed execution flow)
   * @param message Human-readable message
   * @param context Optional structured data for context
   */
  debug(message: string, context?: Record<string, any>): void;

  /**
   * Log informational messages (high-level operations)
   * @param message Human-readable message
   * @param context Optional structured data for context
   */
  info(message: string, context?: Record<string, any>): void;

  /**
   * Log warning messages (non-fatal issues)
   * @param message Human-readable message
   * @param context Optional structured data for context
   */
  warn(message: string, context?: Record<string, any>): void;

  /**
   * Log error messages (failures)
   * @param message Human-readable message
   * @param context Optional structured data for context
   */
  error(message: string, context?: Record<string, any>): void;
}

/**
 * Creates a no-op logger that discards all log messages
 * Useful for production environments where logging overhead is unwanted
 * @returns A logger that does nothing
 */
export function createNoOpLogger(): Logger {
  const noop = () => {};
  return {
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
