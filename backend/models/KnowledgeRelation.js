"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KnowledgeRelation extends Model {
    static associate({ KnowledgeItem }) {
      this.belongsTo(KnowledgeItem, { foreignKey: "sourceArticleId", as: "sourceArticle", onDelete: "CASCADE" });
      this.belongsTo(KnowledgeItem, { foreignKey: "targetArticleId", as: "targetArticle", onDelete: "CASCADE" });
    }
  }

  KnowledgeRelation.init({
    sourceArticleId: { type: DataTypes.INTEGER, allowNull: false },
    targetArticleId: { type: DataTypes.INTEGER, allowNull: false },
    relationType: {
      type: DataTypes.STRING(24), allowNull: false,
      validate: { isIn: [["prerequisite", "related", "alternative", "implements", "depends_on"]] },
    },
  }, {
    sequelize,
    modelName: "KnowledgeRelation",
    tableName: "KnowledgeRelations",
    indexes: [
      { unique: true, fields: ["sourceArticleId", "targetArticleId", "relationType"], name: "knowledge_relations_unique_edge" },
      { fields: ["targetArticleId", "relationType"], name: "knowledge_relations_target_type" },
    ],
  });

  return KnowledgeRelation;
};
