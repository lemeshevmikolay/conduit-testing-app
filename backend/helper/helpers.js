const slugify = (string) => {
  const transliteration = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye",
    ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "i", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ю: "yu",
    я: "ya", ь: "", ъ: "", ы: "y", э: "e", ё: "yo",
  };
  return string
    .trim()
    .toLowerCase()
    .split("")
    .map((character) => transliteration[character] ?? character)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

const appendTagList = (articleTags, article) => {
  const tagList = articleTags.map((tag) => tag.name);

  if (!article) return tagList;
  article.dataValues.tagList = tagList;
};

const appendFavorites = async (loggedUser, article) => {
  const favorited = await article.hasUser(loggedUser ? loggedUser : null);
  article.dataValues.favorited = loggedUser ? favorited : false;

  const favoritesCount = loggedUser ? await article.countUsers() : null;
  article.dataValues.favoritesCount = favoritesCount;
};

const appendFollowers = async (loggedUser, toAppend) => {
  //
  if (toAppend?.author) {
    const author = await toAppend.getAuthor();

    const following = await author.hasFollower(loggedUser ? loggedUser : null);
    toAppend.author.dataValues.following = loggedUser ? following : false;

    const followersCount = await author.countFollowers();
    toAppend.author.dataValues.followersCount = followersCount;
    //
  } else {
    const following = await toAppend.hasFollower(
      loggedUser ? loggedUser : null,
    );
    toAppend.dataValues.following = loggedUser ? following : false;

    const followersCount = await toAppend.countFollowers();
    toAppend.dataValues.followersCount = followersCount;
  }
};

const appendArticleMetrics = async (loggedUser, articles, sequelize) => {
  if (!articles.length) return;
  const articleIds = articles.map((article) => article.id);
  const authorIds = [...new Set(articles.map((article) => article.author.id))];
  const replacements = {
    articleIds,
    authorIds,
    viewerId: loggedUser?.id ?? null,
  };
  const [favoriteRows, followerRows] = await Promise.all([
    sequelize.query(
      "SELECT articleId, COUNT(*) AS total, SUM(CASE WHEN userId = :viewerId THEN 1 ELSE 0 END) AS mine FROM Favorites WHERE articleId IN (:articleIds) GROUP BY articleId",
      { replacements, type: sequelize.QueryTypes.SELECT },
    ),
    sequelize.query(
      "SELECT userId, COUNT(*) AS total, SUM(CASE WHEN followerId = :viewerId THEN 1 ELSE 0 END) AS mine FROM Followers WHERE userId IN (:authorIds) GROUP BY userId",
      { replacements, type: sequelize.QueryTypes.SELECT },
    ),
  ]);
  const favorites = new Map(favoriteRows.map((row) => [Number(row.articleId), row]));
  const followers = new Map(followerRows.map((row) => [Number(row.userId), row]));

  for (const article of articles) {
    const favorite = favorites.get(article.id);
    const follower = followers.get(article.author.id);
    article.dataValues.favorited = Number(favorite?.mine || 0) > 0;
    article.dataValues.favoritesCount = loggedUser ? Number(favorite?.total || 0) : null;
    article.author.dataValues.following = Number(follower?.mine || 0) > 0;
    article.author.dataValues.followersCount = Number(follower?.total || 0);
    article.dataValues.tagList = article.tagList.map((tag) => tag.name);
    delete article.dataValues.Favorites;
  }
};

module.exports = {
  slugify,
  appendTagList,
  appendFavorites,
  appendFollowers,
  appendArticleMetrics,
};
