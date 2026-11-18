"use strict";

const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class KnowledgeItem extends Model {
    static associate({ KnowledgeSource, KnowledgeRelation }) {
      this.hasMany(KnowledgeSource, { foreignKey: "knowledgeItemId", as: "sourceRecords", onDelete: "CASCADE" });
      this.hasMany(KnowledgeRelation, { foreignKey: "sourceArticleId", as: "outgoingRelations", onDelete: "CASCADE" });
      this.hasMany(KnowledgeRelation, { foreignKey: "targetArticleId", as: "incomingRelations", onDelete: "CASCADE" });
    }
  }

  KnowledgeItem.init(
    {
      slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      kind: { type: DataTypes.STRING(20), allowNull: false },
      section: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "architecture" },
      category: { type: DataTypes.STRING(80), allowNull: false },
      difficulty: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "middle" },
      questionType: { type: DataTypes.STRING(30), allowNull: true },
      orderIndex: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      estimatedReadingTime: { type: DataTypes.INTEGER, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      summary: { type: DataTypes.STRING(500), allowNull: false },
      body: { type: DataTypes.TEXT("long"), allowNull: false },
      question: { type: DataTypes.TEXT, allowNull: true },
      answer: { type: DataTypes.TEXT("long"), allowNull: true },
      sourceName: { type: DataTypes.STRING(180), allowNull: false },
      sourceUrl: { type: DataTypes.STRING(1000), allowNull: false },
      tags: { type: DataTypes.JSON, allowNull: false },
      published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      sequelize,
      modelName: "KnowledgeItem",
      tableName: "KnowledgeItems",
      indexes: [
        { fields: ["kind", "published"] },
        { fields: ["category"] },
        { fields: ["section", "kind", "orderIndex"] },
      ],
    },
  );

  return KnowledgeItem;
};
