const { ValidationError } = require("./customErrors");

const usernamePattern = /^[A-Za-z][A-Za-z0-9]{2,39}$/;
const emailPattern = /^[A-Za-z0-9._+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

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
  if (tagList === undefined || tagList === null || tagList.length === 0) return [];
  if (!Array.isArray(tagList) || tagList.length > 10) {
    throw new ValidationError("An article can contain no more than 10 tags.");
  }

  const tags = tagList.map((value) => {
    if (typeof value !== "string") throw new ValidationError("Each tag must be text.");
    const normalized = `#${value.trim().replace(/^#+/, "")}`;
    if (!/^#[A-Za-z0-9]{1,29}$/.test(normalized)) {
      throw new ValidationError("Tags must start with # and contain 2–30 letters or numbers.");
    }
    return normalized.slice(1).toLowerCase();
  });

  if (new Set(tags).size !== tags.length) {
    throw new ValidationError("Tags must be unique, ignoring letter case.");
  }
  return tags;
}

function validateImageUrl(value) {
  if (!value) return value;
  if (typeof value !== "string") throw new ValidationError("URL of profile picture is invalid");
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
  normalizeTags,
  validateArticleField,
  validateEmail,
  validateImageUrl,
  validatePassword,
  validateUsername,
};
