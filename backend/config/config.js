const envBoolean = (value) => value === "true";
const logger = require("../observability/logger");
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
  logging: envBoolean(process.env[`${prefix}_DB_LOGGING`])
    ? (sql, durationMs) => {
        const statement = sql.replace(/^Executing \([^)]*\):\s*/i, "");
        const fields = {
          "http.request.id": requestContext.getStore()?.requestId,
          "db.system": process.env[`${prefix}_DB_DIALECT`],
          "event.duration": Math.round(durationMs * 1e6),
          "db.operation": (statement.match(/^\s*(\w+)/) || [])[1]?.toLowerCase() || "unknown",
        };
        logger.info("db.query", fields);
        if (durationMs >= Number(process.env.DB_SLOW_QUERY_MS || 500)) {
          logger.warn("db.slow_query", fields);
        }
      }
    : false,
});

/** @type {import('sequelize').Options} */
module.exports = {
  development: dbConfig("DEV"),
  test: dbConfig("TEST"),
  production: dbConfig("PROD"),
};
