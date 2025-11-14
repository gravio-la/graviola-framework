import {
  describe,
  expect,
  test,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import {
  createNoOpLogger,
  createConsoleLogger,
  type Logger,
  type LogLevel,
} from "./logger";

describe("createNoOpLogger", () => {
  test("creates logger that does nothing", () => {
    const logger = createNoOpLogger();

    // Should not throw
    expect(() => {
      logger.debug("test");
      logger.info("test");
      logger.warn("test");
      logger.error("test");
    }).not.toThrow();
  });

  test("accepts context parameter", () => {
    const logger = createNoOpLogger();

    expect(() => {
      logger.debug("test", { key: "value" });
      logger.info("test", { num: 42 });
      logger.warn("test", { arr: [1, 2, 3] });
      logger.error("test", { nested: { data: true } });
    }).not.toThrow();
  });
});

describe("createConsoleLogger", () => {
  let consoleSpy: {
    debug: jest.SpiedFunction<typeof console.debug>;
    info: jest.SpiedFunction<typeof console.info>;
    warn: jest.SpiedFunction<typeof console.warn>;
    error: jest.SpiedFunction<typeof console.error>;
  };

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      debug: jest.spyOn(console, "debug").mockImplementation(() => {}),
      info: jest.spyOn(console, "info").mockImplementation(() => {}),
      warn: jest.spyOn(console, "warn").mockImplementation(() => {}),
      error: jest.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    // Restore console methods after each test
    consoleSpy.debug.mockRestore();
    consoleSpy.info.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  test("logs to console with default level (info)", () => {
    const logger = createConsoleLogger();

    logger.debug("debug message");
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] info message");
    expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN] warn message");
    expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR] error message");
  });

  test("respects minimum log level", () => {
    const logger = createConsoleLogger("warn");

    logger.debug("debug message");
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.warn).toHaveBeenCalledWith("[WARN] warn message");
    expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR] error message");
  });

  test("logs with debug level", () => {
    const logger = createConsoleLogger("debug");

    logger.debug("debug message");

    expect(consoleSpy.debug).toHaveBeenCalledWith("[DEBUG] debug message");
  });

  test("logs with error level only", () => {
    const logger = createConsoleLogger("error");

    logger.debug("debug message");
    logger.info("info message");
    logger.warn("warn message");
    logger.error("error message");

    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.warn).not.toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalledWith("[ERROR] error message");
  });

  test("includes context in log output", () => {
    const logger = createConsoleLogger("info");

    logger.info("test message", { key: "value", num: 42 });

    expect(consoleSpy.info).toHaveBeenCalledWith(
      '[INFO] test message {"key":"value","num":42}',
    );
  });

  test("handles empty context", () => {
    const logger = createConsoleLogger("info");

    logger.info("test message", {});

    expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] test message");
  });

  test("handles undefined context", () => {
    const logger = createConsoleLogger("info");

    logger.info("test message");

    expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] test message");
  });

  test("handles complex nested context", () => {
    const logger = createConsoleLogger("debug");

    const context = {
      property: "knows",
      depth: 2,
      nodeIRI: "http://example.com/person1",
      metadata: {
        isArray: true,
        isRelationship: true,
      },
    };

    logger.debug("Extracting property", context);

    expect(consoleSpy.debug).toHaveBeenCalledWith(
      expect.stringContaining("[DEBUG] Extracting property"),
    );
    expect(consoleSpy.debug).toHaveBeenCalledWith(
      expect.stringContaining('"property":"knows"'),
    );
  });
});
