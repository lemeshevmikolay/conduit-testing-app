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
  benchmark: false,
  logging: false,
});

/** @type {import('sequelize').Options} */
module.exports = {
  development: dbConfig("DEV"),
  test: dbConfig("TEST"),
  production: dbConfig("PROD"),
};
