const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
process.env.NODE_ENV = "test";
process.env.TEST_DB_DIALECT = "sqlite";
process.env.TEST_DB_STORAGE = path.resolve(__dirname, "../../.tmp/conduit-e2e.sqlite");
process.env.TEST_DB_NAME = process.env.TEST_DB_STORAGE;
require("node:fs").mkdirSync(path.dirname(process.env.TEST_DB_STORAGE), { recursive: true });

module.exports = {
  e2e: {
    baseUrl: "http://127.0.0.1:3000",
    specPattern: "tests/e2e/**/*.cy.js",
    supportFile: false,
    async setupNodeEvents() {
      // Seed while Cypress loads the config so this works in both `cypress run`
      // and the interactive `cypress open` workflow.
      const { sequelize, User, Article, Tag } = require("../../backend/models");
      const { bcryptHash } = require("../../backend/helper/bcrypt");
      await sequelize.sync({ force: true });

      const [readerPassword, authorPassword, resetPassword] = await Promise.all([
        bcryptHash("E2EReaderPass123!"),
        bcryptHash("FeedAuthorPass123"),
        bcryptHash("E2EResetPass123!"),
      ]);
      await User.create({
        username: "e2ereader",
        email: "e2e-reader@example.test",
        password: readerPassword,
        emailVerified: true,
      });
      await User.create({
        username: "e2ereset",
        email: "e2e-reset@example.test",
        password: resetPassword,
        emailVerified: true,
      });
      const author = await User.create({
        username: "feedauthor",
        email: "feed-author@example.test",
        password: authorPassword,
        emailVerified: true,
      });
      const seedArticle = await Article.create({
        slug: "feed-seed-article",
        title: "Feed seed article",
        description: "A known article for Your Feed coverage",
        body: "This seeded article belongs to the followed author.",
        userId: author.id,
      });
      const [smokeTag] = await Tag.findOrCreate({ where: { name: "e2e-smoke" } });
      await seedArticle.addTagList(smokeTag);
    },
  },
};
