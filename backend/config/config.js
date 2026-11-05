const envBoolean = (value) => value === "true";
const requestContext = require("../observability/requestContext");
const dbConfig = (prefix) => ({
  username: process.env[`${prefix}_DB_USERNAME`],
  password: process.env[`${prefix}_DB_PASSWORD`],
  database: process.env[`${prefix}_DB_NAME`],
  host: process.env[`${prefix}_DB_HOSTNAME`],
  port: process.env[`${prefix}_DB_PORT`]
    ? Number(process.env[`${prefix}_DB_PORT`])
    : undefined,
  dialect: process.env[`${prefix}_DB_DIALECT`],
  storage: process.env[`${prefix}_DB_STORAGE`],
  ...(process.env[`${prefix}_DB_DIALECT`] === "sqlite"
    ? { storage: process.env[`${prefix}_DB_STORAGE`] || process.env[`${prefix}_DB_NAME`] }
    : {}),
  benchmark: true,
  logging: (sql, durationMs) => {
    const request = requestContext.getStore();
    if (!request?.dbQueries) return;

    const statement = sql
      .replace(/^Execut(?:ing|ed) \([^)]*\):\s*/i, "")
      .replace(/'(?:\\.|''|[^'\\])*'/g, "'?'" )
      .replace(/\s+/g, " ")
      .trim();
    const query = {
      "db.system": process.env[`${prefix}_DB_DIALECT`],
      sql: statement,
      duration_ms: Math.round(Number(durationMs || 0) * 100) / 100,
    };
    if (
      envBoolean(process.env[`${prefix}_DB_LOGGING`]) &&
      durationMs >= Number(process.env.DB_SLOW_QUERY_MS || 500)
    ) {
      query.slow = true;
    }
    request.dbQueries.push(query);
  },
});

/** @type {import('sequelize').Options} */
module.exports = {
  development: dbConfig("DEV"),
  test: dbConfig("TEST"),
  production: dbConfig("PROD"),
};
