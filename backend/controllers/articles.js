const {
  ConflictError,
  FieldRequiredError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require("../helper/customErrors");
const {
  appendFollowers,
  appendFavorites,
  appendTagList,
  slugify,
  appendArticleMetrics,
} = require("../helper/helpers");
const { normalizeTags, validateArticleField } = require("../helper/validation");
const { Article, Tag, User } = require("../models");

const includeOptions = [
  { model: Tag, as: "tagList", attributes: ["name"] },
  { model: User, as: "author", attributes: { exclude: ["email"] } },
];

//? All Articles - by Author/by Tag/Favorited by user
const allArticles = async (req, res, next) => {
  try {
    const { loggedUser } = req;

    const { author, tag, favorited } = req.query;
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);
    const searchOptions = {
      include: [
        {
          model: Tag,
          as: "tagList",
          attributes: ["name"],
          ...(tag && { where: { name: tag } }),
        },
        {
          model: User,
          as: "author",
          attributes: { exclude: ["email"] },
          ...(author && { where: { username: author } }),
        },
      ],
      limit: parseInt(limit),
      offset: offset * limit,
      order: [["createdAt", "DESC"]],
      distinct: true,
    };

    let articles = { rows: [], count: 0 };
    if (favorited) {
      const user = await User.findOne({ where: { username: favorited } });
      if (!user) throw new NotFoundError("User profile");

      articles.rows = await user.getFavorites(searchOptions);
      articles.count = await user.countFavorites();
    } else {
      articles = await Article.findAndCountAll(searchOptions);
    }

    if (articles.rows.length) {
      await appendArticleMetrics(loggedUser, articles.rows, Article.sequelize);
    }

    res.json({ articles: articles.rows, articlesCount: articles.count });
  } catch (error) {
    next(error);
  }
};

//* Create Article
const createArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const input = req.body?.article;
    if (!input || typeof input !== "object") throw new FieldRequiredError("Article details");
    const title = validateArticleField(input.title, "title", 5, 240);
    const description = validateArticleField(input.description, "description", 5, 240);
    const body = validateArticleField(input.body, "body", 20, 9000);
    const tagList = normalizeTags(input.tagList);

    const baseSlug = slugify(title) || "article";
    let slug = baseSlug;
    const slugInDB = await Article.findOne({ where: { slug } });
    if (slugInDB && input.allowDuplicateTitle !== true) {
      throw new ConflictError("Article with a similar Title already exists. Do you want to continue?");
    }
    if (slugInDB) {
      let suffix = 2;
      while (await Article.findOne({ where: { slug: `${baseSlug}-${suffix}` } })) suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const article = await Article.create({
      slug: slug,
      title: title,
      description: description,
      body: body,
    });

    for (const name of tagList) {
      const [tag] = await Tag.findOrCreate({ where: { name } });
      await article.addTagList(tag);
    }

    delete loggedUser.dataValues.token;

    article.dataValues.tagList = tagList;
    article.setAuthor(loggedUser);
    article.dataValues.author = loggedUser;
    await appendFollowers(loggedUser, loggedUser);
    await appendFavorites(loggedUser, article);

    res.status(201).json({ article });
  } catch (error) {
    next(error);
  }
};

//* Feed
const articlesFeed = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const offset = Math.max(0, Number.parseInt(req.query.offset, 10) || 0);
    const authors = await loggedUser.getFollowing();

    const articles = await Article.findAndCountAll({
      include: includeOptions,
      limit: parseInt(limit),
      offset: offset * limit,
      order: [["createdAt", "DESC"]],
      where: { userId: authors.map((author) => author.id) },
      distinct: true,
    });
    if (articles.rows.length) {
      await appendArticleMetrics(loggedUser, articles.rows, Article.sequelize);
    }

    res.json({ articles: articles.rows, articlesCount: articles.count });
  } catch (error) {
    next(error);
  }
};

// Single Article by slug
const singleArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;

    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug: slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    appendTagList(article.tagList, article);
    await appendFollowers(loggedUser, article);
    await appendFavorites(loggedUser, article);

    res.json({ article });
  } catch (error) {
    next(error);
  }
};

//* Update Article
const updateArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug: slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    if (loggedUser.id !== article.author.id) {
      throw new ForbiddenError("article");
    }

    const input = req.body?.article;
    if (!input || typeof input !== "object") throw new FieldRequiredError("Article details");
    const { title: rawTitle, description: rawDescription, body: rawBody } = input;
    const title = rawTitle === undefined ? undefined : validateArticleField(rawTitle, "title", 5, 240);
    const description = rawDescription === undefined ? undefined : validateArticleField(rawDescription, "description", 5, 240);
    const body = rawBody === undefined ? undefined : validateArticleField(rawBody, "body", 20, 9000);
    const tagList = input.tagList === undefined ? undefined : normalizeTags(input.tagList);
    if (title) {
      const nextSlug = slugify(title) || "article";
      const duplicateSlug = await Article.findOne({ where: { slug: nextSlug } });
      if (duplicateSlug && duplicateSlug.id !== article.id) {
        throw new ConflictError("Article with a similar Title already exists.");
      }
      article.slug = nextSlug;
      article.title = title;
    }
    if (description) article.description = description;
    if (body) article.body = body;
    await article.save();

    if (tagList !== undefined) {
      const tags = await Promise.all(tagList.map(async (name) => {
        const [tag] = await Tag.findOrCreate({ where: { name } });
        return tag;
      }));
      await article.setTagList(tags);
      article.tagList = tags;
    }

    appendTagList(article.tagList, article);
    await appendFollowers(loggedUser, article);
    await appendFavorites(loggedUser, article);

    res.json({ article });
  } catch (error) {
    next(error);
  }
};

//* Delete Article
const deleteArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { slug } = req.params;
    const article = await Article.findOne({
      where: { slug: slug },
      include: includeOptions,
    });
    if (!article) throw new NotFoundError("Article");

    if (loggedUser.id !== article.author.id) {
      throw new ForbiddenError("article");
    }

    await article.destroy();

    res.json({ message: { body: ["Article deleted successfully"] } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  allArticles,
  createArticle,
  singleArticle,
  updateArticle,
  deleteArticle,
  articlesFeed,
};
