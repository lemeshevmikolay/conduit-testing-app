const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Article, Comment, Tag, User } = require("../../backend/models");
const { bcryptCompare } = require("../../backend/helper/bcrypt");

const baseUrl = process.env.API_BASE_URL || "http://127.0.0.1:3101/api";
const healthUrl = baseUrl.replace(/\/api\/?$/, "/health");
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const unique = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

const user = {
  username: `reader${unique}`,
  email: `reader${unique}@example.test`,
  password: "Integration123!",
};
const author = {
  username: `author${unique}`,
  email: `author${unique}@example.test`,
  password: "AuthorPass123!",
};

let token;
let authorToken;
let userId;
let authorId;
let articleSlug;
let feedArticleSlug;
let commentId;
let updatedPassword = "ResetPassword123!";

async function api(path, { method = "GET", token: authToken, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Token ${authToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  return { response, data };
}

function assertContract(response, data, expectedStatus = 200) {
  assert.equal(response.status, expectedStatus);
  assert.match(response.headers.get("content-type") || "", /^application\/json\b/i);
  const requestId = response.headers.get("x-request-id");
  assert.match(requestId || "", requestIdPattern);
  assert.equal(response.headers.get("access-control-expose-headers"), "X-Request-Id");
  assert.equal(data.requestId, requestId);
}

test("positive API contract and database lifecycle", async (t) => {
  await t.test("01. Health endpoint reports the API and database are ready", async () => {
    const response = await fetch(healthUrl);
    const data = await response.json();
    assertContract(response, data);
    assert.deepEqual({ status: data.status, database: data.database }, { status: "ok", database: "ok" });
  });

  await t.test("02. Register a user and persist an unverified account", async () => {
    const result = await api("/users", { method: "POST", body: { user } });
    assertContract(result.response, result.data, 201);
    assert.deepEqual(result.data.user, {
      username: user.username,
      email: user.email,
      verificationRequired: true,
    });

    const row = await User.findOne({ where: { email: user.email } });
    assert.ok(row);
    userId = row.id;
    assert.equal(row.username, user.username);
    assert.equal(row.emailVerified, false);
    assert.notEqual(row.password, user.password);
    assert.equal(await bcryptCompare(user.password, row.password), true);
  });

  await t.test("03. Verify email and return an authenticated user", async () => {
    const result = await api("/users/verify-email", {
      method: "POST",
      body: { email: user.email, code: "123456" },
    });
    assertContract(result.response, result.data);
    assert.equal(result.data.user.username, user.username);
    assert.equal(result.data.user.email, user.email);
    assert.equal(typeof result.data.user.token, "string");
    assert.ok(result.data.user.token.length > 0);
    assert.equal("password" in result.data.user, false);
    token = result.data.user.token;

    const row = await User.findByPk(userId);
    assert.equal(row.emailVerified, true);
  });

  await t.test("04. Log in and return a valid token", async () => {
    const result = await api("/users/login", {
      method: "POST",
      body: { user: { email: user.email, password: user.password } },
    });
    assertContract(result.response, result.data);
    assert.equal(result.data.user.username, user.username);
    assert.ok(result.data.user.token);
    token = result.data.user.token;
  });

  await t.test("05. Read the current user from the authenticated token", async () => {
    const result = await api("/user", { token });
    assertContract(result.response, result.data);
    assert.equal(result.data.user.username, user.username);
    assert.equal(result.data.user.email, user.email);

    const row = await User.findByPk(userId);
    assert.equal(result.data.user.username, row.username);
    assert.equal(result.data.user.email, row.email);
  });

  await t.test("06. Update profile fields and persist them", async () => {
    const updates = {
      bio: `API profile ${unique}`,
      image: "https://example.test/api-avatar.png",
    };
    const result = await api("/user", { method: "PUT", token, body: { user: updates } });
    assertContract(result.response, result.data);
    assert.equal(result.data.user.bio, updates.bio);
    assert.equal(result.data.user.image, updates.image);

    const row = await User.findByPk(userId);
    assert.equal(row.bio, updates.bio);
    assert.equal(row.image, updates.image);
  });

  await t.test("07. Request a password reset", async () => {
    const result = await api("/users/forgot-password", {
      method: "POST",
      body: { email: user.email },
    });
    assertContract(result.response, result.data);
    assert.match(result.data.message, /one-time code/i);
  });

  await t.test("08. Reset the password and persist a new password hash", async () => {
    const result = await api("/users/reset-password", {
      method: "POST",
      body: { email: user.email, code: "123456", password: updatedPassword },
    });
    assertContract(result.response, result.data);
    assert.equal(result.data.message, "Password updated. You can now sign in.");

    const row = await User.findByPk(userId);
    assert.equal(await bcryptCompare(updatedPassword, row.password), true);
    assert.equal(await bcryptCompare(user.password, row.password), false);
  });

  await t.test("09. Sign in with the reset password", async () => {
    const result = await api("/users/login", {
      method: "POST",
      body: { user: { email: user.email, password: updatedPassword } },
    });
    assertContract(result.response, result.data);
    assert.equal(result.data.user.username, user.username);
    token = result.data.user.token;
  });

  await t.test("10. Register the author used by profile and feed operations", async () => {
    const result = await api("/users", { method: "POST", body: { user: author } });
    assertContract(result.response, result.data, 201);
    assert.equal(result.data.user.username, author.username);

    const row = await User.findOne({ where: { email: author.email } });
    assert.ok(row);
    authorId = row.id;
    assert.equal(row.emailVerified, false);
  });

  await t.test("11. Verify the author account", async () => {
    const result = await api("/users/verify-email", {
      method: "POST",
      body: { email: author.email, code: "123456" },
    });
    assertContract(result.response, result.data);
    assert.equal(result.data.user.username, author.username);
    authorToken = result.data.user.token;
    assert.ok(authorToken);
    assert.equal((await User.findByPk(authorId)).emailVerified, true);
  });

  await t.test("12. Create the feed author's tagged article", async () => {
    const input = {
      title: `Feed Article ${unique}`,
      description: "An article for checking the followed feed.",
      body: "The feed article body has enough characters for validation.",
      tagList: ["apismoke"],
    };
    const result = await api("/articles", { method: "POST", token: authorToken, body: { article: input } });
    assertContract(result.response, result.data, 201);
    feedArticleSlug = result.data.article.slug;
    assert.equal(result.data.article.title, input.title);
    assert.equal(result.data.article.author.username, author.username);
    assert.deepEqual(result.data.article.tagList, ["apismoke"]);
    assert.equal(result.data.article.favorited, false);

    const row = await Article.findOne({ where: { slug: feedArticleSlug } });
    assert.ok(row);
    assert.equal(row.title, input.title);
    assert.equal(row.userId, authorId);
    const tags = await row.getTagList();
    assert.deepEqual(tags.map((tag) => tag.name), ["apismoke"]);
  });

  await t.test("13. Create the current user's article", async () => {
    const input = {
      title: `Lifecycle Article ${unique}`,
      description: "An article for API lifecycle verification.",
      body: "The lifecycle article body has enough characters for validation.",
      tagList: ["apilifecycle", "contractcheck"],
    };
    const result = await api("/articles", { method: "POST", token, body: { article: input } });
    assertContract(result.response, result.data, 201);
    articleSlug = result.data.article.slug;
    assert.equal(result.data.article.title, input.title);
    assert.equal(result.data.article.author.username, user.username);
    assert.deepEqual(result.data.article.tagList, input.tagList);

    const row = await Article.findOne({ where: { slug: articleSlug } });
    assert.ok(row);
    assert.equal(row.userId, userId);
    assert.equal(row.description, input.description);
    assert.equal(row.body, input.body);
  });

  await t.test("14. List the global articles and match returned records to the database", async () => {
    const result = await api("/articles?limit=10&offset=0", { token });
    assertContract(result.response, result.data);
    assert.ok(result.data.articlesCount >= 2);
    assert.ok(result.data.articles.some((item) => item.slug === articleSlug));
    assert.ok(result.data.articles.some((item) => item.slug === feedArticleSlug));
    const ownArticle = result.data.articles.find((item) => item.slug === articleSlug);
    const storedArticle = await Article.findOne({ where: { slug: articleSlug } });
    assert.equal(ownArticle.title, storedArticle.title);
    assert.equal(ownArticle.author.username, user.username);
  });

  await t.test("15. List articles filtered by author and tag", async () => {
    const result = await api(`/articles?author=${author.username}&tag=apismoke&limit=10&offset=0`, { token });
    assertContract(result.response, result.data);
    assert.ok(result.data.articlesCount >= 1);
    assert.ok(result.data.articles.some((item) => item.slug === feedArticleSlug));
    for (const item of result.data.articles) {
      assert.equal(item.author.username, author.username);
      assert.ok(item.tagList.includes("apismoke"));
    }
  });

  await t.test("16. Read an article and match its response to the database", async () => {
    const result = await api(`/articles/${articleSlug}`, { token });
    assertContract(result.response, result.data);
    const row = await Article.findOne({ where: { slug: articleSlug } });
    assert.equal(result.data.article.slug, row.slug);
    assert.equal(result.data.article.title, row.title);
    assert.equal(result.data.article.description, row.description);
    assert.equal(result.data.article.body, row.body);
    assert.equal(result.data.article.author.username, user.username);
    assert.equal(typeof result.data.article.createdAt, "string");
    assert.equal(typeof result.data.article.favorited, "boolean");
  });

  await t.test("17. Create a comment and persist its author and article", async () => {
    const body = `API comment ${unique}`;
    const result = await api(`/articles/${articleSlug}/comments`, {
      method: "POST",
      token,
      body: { comment: { body } },
    });
    assertContract(result.response, result.data, 201);
    commentId = result.data.comment.id;
    assert.equal(result.data.comment.body, body);
    assert.equal(result.data.comment.author.username, user.username);

    const row = await Comment.findByPk(commentId);
    assert.ok(row);
    assert.equal(row.body, body);
    assert.equal(row.articleId, (await Article.findOne({ where: { slug: articleSlug } })).id);
    assert.equal(row.userId, userId);
  });

  await t.test("18. List article comments", async () => {
    const result = await api(`/articles/${articleSlug}/comments`, { token });
    assertContract(result.response, result.data);
    assert.ok(result.data.comments.some((comment) => comment.id === commentId));
    const comment = result.data.comments.find((item) => item.id === commentId);
    assert.equal(comment.author.username, user.username);
    assert.equal(comment.author.email, undefined);
  });

  await t.test("19. Read the author's profile", async () => {
    const result = await api(`/profiles/${author.username}`, { token });
    assertContract(result.response, result.data);
    assert.equal(result.data.profile.username, author.username);
    assert.equal(result.data.profile.following, false);
    assert.equal(result.data.profile.followersCount, 0);
    assert.equal(result.data.profile.email, undefined);
  });

  await t.test("20. Follow the author and persist the relationship", async () => {
    const result = await api(`/profiles/${author.username}/follow`, { method: "POST", token });
    assertContract(result.response, result.data);
    assert.equal(result.data.profile.username, author.username);
    assert.equal(result.data.profile.following, true);
    assert.equal(result.data.profile.followersCount, 1);

    const readerRow = await User.findByPk(userId);
    assert.ok(await (await User.findByPk(authorId)).hasFollower(readerRow));
  });

  await t.test("21. Read the followed author's feed", async () => {
    const result = await api("/articles/feed?limit=10&offset=0", { token });
    assertContract(result.response, result.data);
    assert.ok(result.data.articlesCount >= 1);
    assert.ok(result.data.articles.some((item) => item.slug === feedArticleSlug));
    assert.equal(result.data.articles.find((item) => item.slug === feedArticleSlug).author.username, author.username);
  });

  await t.test("22. Favorite an article and persist the favorite", async () => {
    const result = await api(`/articles/${feedArticleSlug}/favorite`, { method: "POST", token });
    assertContract(result.response, result.data);
    assert.equal(result.data.article.slug, feedArticleSlug);
    assert.equal(result.data.article.favorited, true);
    assert.equal(result.data.article.favoritesCount, 1);

    const articleRow = await Article.findOne({ where: { slug: feedArticleSlug } });
    const readerRow = await User.findByPk(userId);
    assert.ok(await articleRow.hasUser(readerRow));
  });

  await t.test("23. Filter articles by the user's favorites", async () => {
    const result = await api(`/articles?favorited=${user.username}&limit=10&offset=0`, { token });
    assertContract(result.response, result.data);
    assert.ok(result.data.articles.some((item) => item.slug === feedArticleSlug && item.favorited));
  });

  await t.test("24. Unfavorite the article and persist removal", async () => {
    const result = await api(`/articles/${feedArticleSlug}/favorite`, { method: "DELETE", token });
    assertContract(result.response, result.data);
    assert.equal(result.data.article.favorited, false);
    assert.equal(result.data.article.favoritesCount, 0);

    const articleRow = await Article.findOne({ where: { slug: feedArticleSlug } });
    const readerRow = await User.findByPk(userId);
    assert.equal(await articleRow.hasUser(readerRow), false);
  });

  await t.test("25. Unfollow the author and persist removal", async () => {
    const result = await api(`/profiles/${author.username}/follow`, { method: "DELETE", token });
    assertContract(result.response, result.data);
    assert.equal(result.data.profile.following, false);
    assert.equal(result.data.profile.followersCount, 0);

    const readerRow = await User.findByPk(userId);
    assert.equal(await (await User.findByPk(authorId)).hasFollower(readerRow), false);
  });

  await t.test("26. Update article fields and verify the new database values", async () => {
    const updates = {
      title: `Updated Lifecycle Article ${unique}`,
      description: "Updated description from the integration API.",
      body: "Updated article body has enough characters for validation.",
      tagList: ["updatecheck"],
    };
    const result = await api(`/articles/${articleSlug}`, {
      method: "PUT",
      token,
      body: { article: updates },
    });
    assertContract(result.response, result.data);
    const oldSlug = articleSlug;
    articleSlug = result.data.article.slug;
    assert.notEqual(articleSlug, oldSlug);
    assert.equal(result.data.article.title, updates.title);
    assert.equal(result.data.article.description, updates.description);
    assert.equal(result.data.article.body, updates.body);
    assert.deepEqual(result.data.article.tagList, updates.tagList);

    const oldRow = await Article.findOne({ where: { slug: oldSlug } });
    const updatedRow = await Article.findOne({ where: { slug: articleSlug } });
    assert.equal(oldRow, null);
    assert.ok(updatedRow);
    assert.equal(updatedRow.title, updates.title);
    assert.equal(updatedRow.description, updates.description);
    assert.equal(updatedRow.body, updates.body);
    assert.deepEqual((await updatedRow.getTagList()).map((tag) => tag.name), updates.tagList);
  });

  await t.test("27. List tags from persisted article relations", async () => {
    const result = await api("/tags");
    assertContract(result.response, result.data);
    assert.ok(Array.isArray(result.data.tags));
    const storedTags = await Tag.findAll({ attributes: ["name"] });
    const storedNames = storedTags.map((tag) => tag.name);
    assert.ok(result.data.tags.includes("apismoke"));
    assert.ok(result.data.tags.every((tag) => storedNames.includes(tag)));
  });

  await t.test("28. Delete a comment and verify it is removed", async () => {
    const result = await api(`/articles/${articleSlug}/comments/${commentId}`, { method: "DELETE", token });
    assertContract(result.response, result.data);
    assert.deepEqual(result.data.message.body, ["Comment deleted successfully"]);
    assert.equal(await Comment.findByPk(commentId), null);
  });

  await t.test("29. Delete an article and verify it is removed", async () => {
    const result = await api(`/articles/${articleSlug}`, { method: "DELETE", token });
    assertContract(result.response, result.data);
    assert.deepEqual(result.data.message.body, ["Article deleted successfully"]);
    assert.equal(await Article.findOne({ where: { slug: articleSlug } }), null);
  });
});
