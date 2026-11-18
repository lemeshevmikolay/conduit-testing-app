"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KnowledgeSource extends Model {
    static associate({ KnowledgeItem }) {
      this.belongsTo(KnowledgeItem, { foreignKey: "knowledgeItemId", as: "knowledgeItem", onDelete: "CASCADE" });
    }
  }

  KnowledgeSource.init({
    knowledgeItemId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    url: { type: DataTypes.STRING(700), allowNull: false },
    type: { type: DataTypes.STRING(40), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: false },
  }, {
    sequelize, modelName: "KnowledgeSource", tableName: "KnowledgeSources",
    indexes: [{ unique: true, fields: ["knowledgeItemId", "url"] }],
  });
  return KnowledgeSource;
};
