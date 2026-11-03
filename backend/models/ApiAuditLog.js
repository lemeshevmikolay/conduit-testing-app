"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ApiAuditLog extends Model {}

  ApiAuditLog.init(
    {
      entityId: { type: DataTypes.STRING, allowNull: true },
      method: { type: DataTypes.STRING(10), allowNull: false },
      path: { type: DataTypes.STRING(2048), allowNull: false },
      payload: { type: DataTypes.JSON, allowNull: true },
      datetime: { type: DataTypes.DATE, allowNull: false },
      uuid: { type: DataTypes.UUID, allowNull: false },
      statusCode: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      sequelize,
      modelName: "ApiAuditLog",
      tableName: "ApiAuditLogs",
      indexes: [{ fields: ["uuid"] }, { fields: ["datetime"] }],
      timestamps: false,
    },
  );

  return ApiAuditLog;
};
