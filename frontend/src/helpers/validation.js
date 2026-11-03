export const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9]{2,39}$/;
export const EMAIL_PATTERN = /^[A-Za-z0-9._+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

export function validateUsername(value) {
  if (!USERNAME_PATTERN.test(value || "")) {
    return "Username must start with a letter, have no spaces, and be 3 - 40 characters.";
  }
  return "";
}

export function validateEmail(value) {
  if (!EMAIL_PATTERN.test(value || "")) return "This email does not seem valid.";
  return "";
}

export function validatePassword(value) {
  if (
    typeof value !== "string" || value.length < 8 || value.length > 30 ||
    /[^\x20-\x7E]/.test(value) || !/[A-Z]/.test(value) ||
    !/[0-9]/.test(value) || !/[^A-Za-z0-9\s]/.test(value)
  ) {
    return "Password can't be blank. Password should be 8–30 characters long and contain at least one capital letter, one number, and one special character.";
  }
  return "";
}

export function validateArticleText(value, field, min, max) {
  const labels = {
    title: "Title of the article",
    description: "Description of the article",
    body: "Body of article",
  };
  const label = labels[field];
  if (!value?.trim()) {
    return field === "body" ? `${label} can't be blank.` : `${label} can't be empty (minimum ${min} symbols)`;
  }
  if (value.trim().length < min || value.trim().length > max) {
    return `${label} must be ${min}–${max} characters long.`;
  }
  if (value.trim() !== value || / {2,}/.test(value)) {
    return `${label} must not start or end with spaces or contain repeated spaces.`;
  }
  return "";
}

export function normalizeTagInput(value) {
  if (!value.trim()) return [];
  return [...new Set(value.split(/[\s,]+/).filter(Boolean).map((tag) => `#${tag.replace(/^#+/, "")}`))];
}

export function validateTagInput(tags) {
  if (tags.length > 10) return "An article can contain no more than 10 tags.";
  if (tags.some((tag) => !/^#[A-Za-z0-9]{1,29}$/.test(tag))) {
    return "Tags must start with # and contain 2–30 letters or numbers.";
  }
  return "";
}
