const path = require("node:path");
const fs = require("node:fs");
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
    screenshotsFolder: path.resolve(__dirname, "../../.tmp/visual/actual"),
    video: false,
    async setupNodeEvents(on, config) {
      const visualRoot = path.resolve(__dirname, "../visual");
      const baselineDir = path.join(visualRoot, "baselines");
      const outputDir = path.resolve(__dirname, "../../.tmp/visual");
      const reportPath = path.join(outputDir, "report.json");
      fs.mkdirSync(baselineDir, { recursive: true });
      fs.mkdirSync(path.join(outputDir, "diff"), { recursive: true });
      fs.mkdirSync(path.join(outputDir, "previous"), { recursive: true });
      fs.mkdirSync(config.screenshotsFolder, { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), results: [] }, null, 2));

      on("task", {
        compareVisual({ name, actualPath }) {
          const { PNG } = require("pngjs");
          const pixelmatch = require("pixelmatch");
          const actualFile = path.resolve(config.screenshotsFolder, "visual-regression.cy.js", actualPath);
          const baselineFile = path.join(baselineDir, `${name}.png`);
          const diffFile = path.join(outputDir, "diff", `${name}.png`);
          const updateBaselines = process.env.VISUAL_UPDATE_BASELINES === "1";
          const actual = PNG.sync.read(fs.readFileSync(actualFile));
          let result;

          if (!fs.existsSync(baselineFile)) {
            if (!updateBaselines) {
              result = { name, status: "missing-baseline", actual: actualFile, baseline: baselineFile };
            } else {
              fs.mkdirSync(path.dirname(baselineFile), { recursive: true });
              fs.copyFileSync(actualFile, baselineFile);
              result = { name, status: "baseline-created", actual: actualFile, baseline: baselineFile, diff: null, diffPixels: 0, totalPixels: actual.width * actual.height, ratio: 0 };
            }
          } else {
            const baseline = PNG.sync.read(fs.readFileSync(baselineFile));
            if (actual.width !== baseline.width || actual.height !== baseline.height) {
              if (updateBaselines) {
                const previousFile = path.join(outputDir, "previous", `${name}.png`);
                fs.copyFileSync(baselineFile, previousFile);
                fs.copyFileSync(actualFile, baselineFile);
                result = { name, status: "baseline-updated", actual: actualFile, baseline: baselineFile, previousBaseline: previousFile, actualSize: `${actual.width}x${actual.height}`, baselineSize: `${baseline.width}x${baseline.height}` };
              } else {
                result = { name, status: "dimension-mismatch", actual: actualFile, baseline: baselineFile, actualSize: `${actual.width}x${actual.height}`, baselineSize: `${baseline.width}x${baseline.height}` };
              }
            } else {
              const diff = new PNG({ width: actual.width, height: actual.height });
              const diffPixels = pixelmatch(baseline.data, actual.data, diff.data, actual.width, actual.height, { threshold: 0.2, includeAA: false });
              const totalPixels = actual.width * actual.height;
              const ratio = diffPixels / totalPixels;
              if (diffPixels) fs.writeFileSync(diffFile, PNG.sync.write(diff));
              else if (fs.existsSync(diffFile)) fs.unlinkSync(diffFile);
              if (updateBaselines && ratio > Number(process.env.VISUAL_DIFF_THRESHOLD || 0.001)) {
                const previousFile = path.join(outputDir, "previous", `${name}.png`);
                fs.copyFileSync(baselineFile, previousFile);
                fs.copyFileSync(actualFile, baselineFile);
                result = { name, status: "baseline-updated", actual: actualFile, baseline: baselineFile, previousBaseline: previousFile, diff: diffFile, diffPixels, totalPixels, ratio };
              } else {
                result = { name, status: ratio > Number(process.env.VISUAL_DIFF_THRESHOLD || 0.001) ? "changed" : "passed", actual: actualFile, baseline: baselineFile, diff: diffPixels ? diffFile : null, diffPixels, totalPixels, ratio };
              }
            }
          }

          const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
          report.results.push(result);
          report.summary = report.results.reduce((summary, item) => {
            summary[item.status] = (summary[item.status] || 0) + 1;
            return summary;
          }, {});
          fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
          return result;
        },
      });

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
