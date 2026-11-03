const path = require("path");
const fs = require("node:fs");
const YAML = require("yaml");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const swaggerUi = require("swagger-ui-express");
const env = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 3001;
const express = require("express");
const cors = require("cors");
const { sequelize, User } = require("./models");
const { DataTypes } = require("sequelize");
const { ApiAuditLog } = require("./models");
const seedDemoData = require("./seed/demo");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const attachDbAudit = require("./observability/dbAudit");

const usersRoutes = require("./routes/users");
const userRoutes = require("./routes/user");
const articlesRoutes = require("./routes/articles");
const profilesRoutes = require("./routes/profiles");
const tagsRoutes = require("./routes/tags");

const app = express();
app.use(requestLogger(ApiAuditLog));
app.use(cors());
app.use(express.json());

const openApiPath = path.resolve(__dirname, "../docs/api/openapi.yaml");
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));
app.get("/api-docs/openapi.yaml", (req, res, next) => {
  res.type("text/yaml").sendFile(openApiPath, (error) => {
    if (error) next(error);
  });
});
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "Conduit API — Swagger UI",
  }),
);

async function start() {
  try {
    attachDbAudit(sequelize);
    await sequelize.authenticate();
    await sequelize.sync({ alter: env === "development" });
    const userTable = User.getTableName();
    const userColumns = await sequelize.getQueryInterface().describeTable(userTable);
    if (!userColumns.emailVerified) {
      await sequelize.getQueryInterface().addColumn(userTable, "emailVerified", {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
    if (env === "development" && process.env.SEED_DEMO_DATA !== "false") {
      await seedDemoData();
    }
    console.log(`Connection with ${env} database has been established.`);
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`),
    );
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exitCode = 1;
  }
}

if (process.env.NODE_ENV === "production") {
  app.use(express.static("../frontend/dist"));
} else {
  app.get("/", (req, res) => res.json({ status: "API is running on /api" }));
}
app.use("/api/users", usersRoutes);
app.use("/api/user", userRoutes);
app.use("/api/articles", articlesRoutes);
app.use("/api/profiles", profilesRoutes);
app.use("/api/tags", tagsRoutes);
app.get("/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", database: "ok" });
  } catch (error) {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});
app.get("/*any", (req, res) => {
  if (env === "production" && !req.path.startsWith("/api")) {
    return res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
  }
  return res.status(404).json({ errors: { body: ["Not found"] } });
});
app.use(errorHandler);

start();
