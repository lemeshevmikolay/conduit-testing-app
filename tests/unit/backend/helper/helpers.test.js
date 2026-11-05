const {
  AlreadyTakenError,
  ConflictError,
  FieldRequiredError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require("../../../../backend/helper/customErrors");
const { slugify } = require("../../../../backend/helper/helpers");
const {
  normalizeTags,
  validateArticleField,
  validateEmail,
  validatePassword,
  validateUsername,
} = require("../../../../backend/helper/validation");

describe("01. Build error messages", () => {
  it("creates a validation error", () => {
    expect(new ValidationError("Invalid value").message).toBe("Invalid value");
  });

  it("adds the required field name", () => {
    expect(new FieldRequiredError("Article").message).toBe("Article is required");
  });

  it("formats a missing resource message", () => {
    expect(new NotFoundError("Article").message).toBe("Article not found");
  });

  it("rejects an unauthenticated request", () => {
    expect(new UnauthorizedError().message).toBe("You need to login first!");
  });

  it("rejects an action on another author's resource", () => {
    expect(new ForbiddenError("article").message).toBe("You are not the author of this article");
  });

  it("formats an already-taken value", () => {
    expect(new AlreadyTakenError("Email").message).toContain("Email already exists");
  });

  it("preserves a conflict message", () => {
    expect(new ConflictError("Duplicate").message).toBe("Duplicate");
  });
});

describe("02. Create article slugs", () => {
  it("lowercases words", () => {
    expect(slugify("Hello WORLD")).toBe("hello-world");
  });

  it("trims spaces around the title", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("turns underscores into separators", () => {
    expect(slugify("hello_world")).toBe("hello-world");
  });

  it("collapses punctuation and repeated separators", () => {
    expect(slugify("Hello,  world!!! today")).toBe("hello-world-today");
  });

  it("removes combining marks from accented letters", () => {
    expect(slugify("Café tools")).toBe("cafe-tools");
  });
});

describe("03. Validate usernames", () => {
  it("returns a valid username in lowercase", () => {
    expect(validateUsername("Reader123")).toBe("reader123");
  });

  it("rejects usernames shorter than three characters", () => {
    expect(() => validateUsername("ab")).toThrow(ValidationError);
  });

  it("rejects a leading digit and spaces", () => {
    expect(() => validateUsername("1 reader")).toThrow("must start with a letter");
  });
});

describe("04. Validate emails", () => {
  it("returns a valid email in lowercase", () => {
    expect(validateEmail("Reader+News@Example.test")).toBe("reader+news@example.test");
  });

  it("rejects an address without a domain suffix", () => {
    expect(() => validateEmail("reader@example")).toThrow(ValidationError);
  });

  it("rejects an email longer than 254 characters", () => {
    const email = `${"a".repeat(245)}@example.test`;
    expect(email.length).toBeGreaterThan(254);
    expect(() => validateEmail(email)).toThrow("does not seem valid");
  });
});

describe("05. Validate passwords", () => {
  it("accepts a password with uppercase, digit, and symbol", () => {
    expect(validatePassword("Reader123!")).toBe("Reader123!");
  });

  it("rejects a password that is too short", () => {
    expect(() => validatePassword("Ab1!")).toThrow(ValidationError);
  });

  it("rejects a password without all required character groups", () => {
    expect(() => validatePassword("readerpassword")).toThrow("capital letter");
  });
});

describe("06. Validate article fields", () => {
  it("returns valid article text unchanged", () => {
    expect(validateArticleField("A clear title", "title", 5, 240)).toBe("A clear title");
  });

  it("rejects blank titles", () => {
    expect(() => validateArticleField("   ", "title", 5, 240)).toThrow("can't be empty");
  });

  it("rejects a blank body with a body-specific message", () => {
    expect(() => validateArticleField(" ", "body", 20, 9000)).toThrow("can't be blank");
  });

  it("rejects text that exceeds its maximum length", () => {
    expect(() => validateArticleField("x".repeat(6), "title", 5, 5)).toThrow("must not exceed 5");
  });

  it("rejects leading, trailing, and repeated spaces", () => {
    expect(() => validateArticleField("two  spaces", "title", 5, 240)).toThrow("must not start or end");
  });
});

describe("07. Normalize and validate tags", () => {
  it("returns an empty list when tags are omitted", () => {
    expect(normalizeTags(undefined)).toEqual([]);
  });

  it("adds a hash, trims, and lowercases tags", () => {
    expect(normalizeTags([" React ", "##Testing"])).toEqual(["react", "testing"]);
  });

  it("rejects duplicate tags regardless of letter case", () => {
    expect(() => normalizeTags(["React", "react"])).toThrow("must be unique");
  });

  it("rejects more than ten tags", () => {
    const tags = Array.from({ length: 11 }, (_, index) => `tag${index}`);
    expect(() => normalizeTags(tags)).toThrow("no more than 10");
  });
});
