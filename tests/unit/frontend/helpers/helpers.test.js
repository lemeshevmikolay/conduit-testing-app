import { describe, expect, it, vi } from "vitest";
import dateFormatter from "../../../../frontend/src/helpers/dateFormatter";
import errorHandler from "../../../../frontend/src/helpers/errorHandler";
import handleApiError from "../../../../frontend/src/helpers/handleApiError";
import {
  normalizeTagInput,
  validateArticleText,
  validateEmail,
  validatePassword,
  validateTagInput,
  validateUsername,
} from "../../../../frontend/src/helpers/validation";

describe("01. Format dates", () => {
  it("formats an ISO date string", () => {
    expect(dateFormatter("2020-01-01T12:11:08.212Z")).toBe("January 1, 2020");
  });

  it("formats a Date object", () => {
    expect(dateFormatter(new Date("2024-05-18T12:00:00.000Z"))).toBe("May 18, 2024");
  });
});

describe("02. Validate usernames", () => {
  it("accepts a username with letters and digits", () => {
    expect(validateUsername("Reader123")).toBe("");
  });

  it("rejects a username shorter than three characters", () => {
    expect(validateUsername("ab")).toContain("3 - 40 characters");
  });

  it("rejects spaces and a leading digit", () => {
    expect(validateUsername("1 reader")).toContain("must start with a letter");
  });
});

describe("03. Validate email addresses", () => {
  it("accepts a standard email", () => {
    expect(validateEmail("reader@example.test")).toBe("");
  });

  it("accepts plus addressing", () => {
    expect(validateEmail("reader+smoke@example.test")).toBe("");
  });

  it("rejects an address without a domain suffix", () => {
    expect(validateEmail("reader@example")).toBe("This email does not seem valid.");
  });
});

describe("04. Validate passwords", () => {
  it("accepts a password with required character groups", () => {
    expect(validatePassword("Reader123!")).toBe("");
  });

  it("rejects a password that is too short", () => {
    expect(validatePassword("Ab1!")).toContain("8");
  });

  it("requires uppercase, numeric, and special characters", () => {
    expect(validatePassword("readerpassword")).toContain("capital letter");
  });
});

describe("05. Validate article text", () => {
  it("accepts text inside the allowed length", () => {
    expect(validateArticleText("A clear title", "title", 5, 240)).toBe("");
  });

  it("rejects an empty title", () => {
    expect(validateArticleText("   ", "title", 5, 240)).toContain("can't be empty");
  });

  it("rejects a blank article body", () => {
    expect(validateArticleText(" ", "body", 20, 9000)).toContain("can't be blank");
  });

  it("rejects text shorter than the minimum", () => {
    expect(validateArticleText("tiny", "title", 5, 240)).toContain("5");
  });

  it("rejects leading spaces and repeated spaces", () => {
    expect(validateArticleText(" two  spaces", "title", 5, 240)).toContain("must not start or end");
  });
});

describe("06. Normalize tag input", () => {
  it("returns no tags for blank input", () => {
    expect(normalizeTagInput("  ")).toEqual([]);
  });

  it("adds a hash and splits tags on spaces and commas", () => {
    expect(normalizeTagInput("react, testing basics")).toEqual(["#react", "#testing", "#basics"]);
  });

  it("removes repeated leading hashes and exact duplicates", () => {
    expect(normalizeTagInput("#React #React ##testing")).toEqual(["#React", "#testing"]);
  });
});

describe("07. Validate normalized tags", () => {
  it("accepts an empty tag list", () => {
    expect(validateTagInput([])).toBe("");
  });

  it("accepts hash-prefixed letters and digits", () => {
    expect(validateTagInput(["#React7"])).toBe("");
  });

  it("rejects punctuation in a tag", () => {
    expect(validateTagInput(["#two-words"])).toContain("Tags must start with #");
  });

  it("allows no more than ten tags", () => {
    const tags = Array.from({ length: 11 }, (_, index) => `#tag${index}`);
    expect(validateTagInput(tags)).toContain("no more than 10");
  });
});

describe("08. Handle API errors", () => {
  it("turns an API validation response into an Error with its status", () => {
    const result = handleApiError({
      response: { status: 422, data: { errors: { body: ["Invalid article"] } } },
    });
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("Invalid article");
    expect(result.status).toBe(422);
  });

  it("throws the API message for a supported error status", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    expect(() => errorHandler({
      response: { status: 401, data: { errors: { body: ["Please sign in"] } } },
    })).toThrow("Please sign in");
    vi.restoreAllMocks();
  });

  it("logs a network error that has no response", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const networkError = new Error("Network unavailable");
    expect(errorHandler(networkError)).toBeUndefined();
    expect(log).toHaveBeenCalledWith(networkError);
    vi.restoreAllMocks();
  });
});
