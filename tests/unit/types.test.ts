import { describe, it, expect } from "bun:test";
import type {
  Formatter,
  CliOptions,
  OutputFormat,
  OutputDestination,
  ExitCode,
} from "../../src/types/index.js";
import {
  ExitCode as ExitCodeEnum,
  OutputFormat as OutputFormatEnum,
  OutputDestination as OutputDestinationEnum,
  AppError,
} from "../../src/types/index.js";

describe("types", () => {
  it("ExitCode has all required codes with correct values", () => {
    expect(ExitCodeEnum.SUCCESS).toBe(0);
    expect(ExitCodeEnum.GENERAL).toBe(1);
    expect(ExitCodeEnum.BAD_ARGS).toBe(2);
    expect(ExitCodeEnum.NOT_FOUND).toBe(3);
    expect(ExitCodeEnum.PARSE_ERROR).toBe(4);
    expect(ExitCodeEnum.NETWORK_ERROR).toBe(5);
  });

  it("OutputFormat has all three formats", () => {
    expect(OutputFormatEnum.LAPIS).toBe("lapis");
    expect(OutputFormatEnum.JSON).toBe("json");
    expect(OutputFormatEnum.MARKDOWN).toBe("markdown");
  });

  it("OutputDestination has all destinations", () => {
    expect(OutputDestinationEnum.STDOUT).toBe("stdout");
    expect(OutputDestinationEnum.FILE).toBe("file");
    expect(OutputDestinationEnum.CLIPBOARD).toBe("clipboard");
  });

  it("AppError has code property", () => {
    const err = new AppError("test error", ExitCodeEnum.NOT_FOUND);
    expect(err.message).toBe("test error");
    expect(err.code).toBe(ExitCodeEnum.NOT_FOUND);
    expect(err instanceof Error).toBe(true);
  });
});
