const { ValidationError } = require("./customErrors");

function validateObject(value, label, allowedKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${label} must be an object.`);
  }
  const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unknown.length) throw new ValidationError(`Unsupported ${label} field: ${unknown[0]}.`);
  return value;
}

function validateOptionalString(value, label, maxLength = 9000) {
  if (value !== undefined && value !== null && (typeof value !== "string" || value.length > maxLength)) {
    throw new ValidationError(`${label} must be a string of at most ${maxLength} characters.`);
  }
  return value;
}

function validateArticleQuery(query) {
  const allowed = ["tag", "author", "favorited", "limit", "offset"];
  const unknown = Object.keys(query).find((key) => !allowed.includes(key));
  if (unknown) throw new ValidationError(`Unsupported query parameter: ${unknown}.`);
  for (const key of ["tag", "author", "favorited"]) {
    if (query[key] !== undefined && typeof query[key] !== "string") {
      throw new ValidationError(`${key} must be a string.`);
    }
  }
  for (const [key, min, max] of [["limit", 1, 50], ["offset", 0, Number.MAX_SAFE_INTEGER]]) {
    if (query[key] !== undefined && (!/^\d+$/.test(query[key]) || !Number.isSafeInteger(Number(query[key])) || Number(query[key]) < min || Number(query[key]) > max)) {
      throw new ValidationError(`${key} must be an integer between ${min} and ${max}.`);
    }
  }
}

const usernamePattern = /^[A-Za-z][A-Za-z0-9]{2,39}$/;
const emailPattern = /^(?!.*[._+-]{2})[A-Za-z0-9._+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

function validateUsername(value) {
  if (typeof value !== "string" || !usernamePattern.test(value)) {
    throw new ValidationError("Username must start with a letter, have no spaces, and be 3 - 40 characters.");
  }
  return value.toLowerCase();
}

function validateEmail(value) {
  if (typeof value !== "string" || value.length > 254 || !emailPattern.test(value)) {
    throw new ValidationError("This email does not seem valid.");
  }
  return value.toLowerCase();
}

function validatePassword(value) {
  if (
    typeof value !== "string" ||
    value.length < 8 ||
    value.length > 30 ||
    /[^\x20-\x7E]/.test(value) ||
    !/[A-Z]/.test(value) ||
    !/[0-9]/.test(value) ||
    !/[^A-Za-z0-9\s]/.test(value)
  ) {
    throw new ValidationError("Password should be 8–30 characters long and contain at least one capital letter, one number, and one special character.");
  }
  return value;
}

function validateArticleField(value, field, min, max) {
  const labels = { title: "Title of the article", description: "Description of the article", body: "Body of article" };
  const label = labels[field] || field;
  if (typeof value !== "string" || !value.trim()) {
    if (field === "body") throw new ValidationError(`${label} can't be blank.`);
    throw new ValidationError(`${label} can't be empty (minimum ${min} symbols)`);
  }
  if (value.trim().length < min) {
    if (field !== "body") throw new ValidationError(`${label} can't be empty (minimum ${min} symbols)`);
    throw new ValidationError(`${label} must be at least ${min} symbols.`);
  }
  if (value.trim().length > max) throw new ValidationError(`${label} must not exceed ${max} symbols.`);
  if (value.trim() !== value || / {2,}/.test(value)) {
    throw new ValidationError(`${field} must not start or end with spaces or contain repeated spaces.`);
  }
  return value;
}

function normalizeTags(tagList) {
  if (tagList === undefined || tagList === null || (Array.isArray(tagList) && tagList.length === 0)) return [];
  if (!Array.isArray(tagList) || tagList.length > 10) {
    throw new ValidationError("An article can contain no more than 10 tags.");
  }

  const tags = tagList.map((value) => {
    if (typeof value !== "string") throw new ValidationError("Each tag must be text.");
    const normalized = value.trim().replace(/^#+/, "");
    if (!/^[A-Za-z0-9_-]{1,30}$/.test(normalized)) {
      throw new ValidationError("Each tag must be 1–30 characters and use only letters, numbers, underscores, or hyphens.");
    }
    return normalized.toLowerCase();
  });

  if (new Set(tags).size !== tags.length) {
    throw new ValidationError("Tags must be unique, ignoring letter case.");
  }
  return tags;
}

function validateImageUrl(value) {
  if (!value) return value;
  if (typeof value !== "string" || value.length > 2048) throw new ValidationError("URL of profile picture is invalid");
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) && !/^data:image\//i.test(value)) {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new ValidationError("URL of profile picture is invalid");
  }
  return value;
}

module.exports = {
  validateObject,
  validateOptionalString,
  validateArticleQuery,
  normalizeTags,
  validateArticleField,
  validateEmail,
  validateImageUrl,
  validatePassword,
  validateUsername,
};
