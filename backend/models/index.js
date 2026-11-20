"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const requestContext = require("../observability/requestContext");
const logger = require("../observability/logger");
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

const executeQuery = sequelize.query.bind(sequelize);
sequelize.query = async (sql, options) => {
  const request = requestContext.getStore();
  if (!request?.flowId) return executeQuery(sql, options);

  const rawSql = typeof sql === "string" ? sql : sql?.query || String(sql);
  const started = process.hrtime.bigint();
  const call = { sql: rawSql.trim(), duration_ms: 0, result: null, error: null };
  request.dbCalls.push(call);
  try {
    const result = await executeQuery(sql, options);
    const duration = Number(process.hrtime.bigint() - started) / 1e6;
    call.duration_ms = Math.round(duration * 100) / 100;
    call.result = summarizeResult(result);
    return result;
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - started) / 1e6;
    call.duration_ms = Math.round(duration * 100) / 100;
    call.error = `${error.name}: ${error.message}`;
    throw error;
  }
};

function summarizeResult(value) {
  let normalized;
  try {
    normalized = JSON.parse(JSON.stringify(value));
  } catch {
    return { result: "unavailable" };
  }

  return normalized;
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes,
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
