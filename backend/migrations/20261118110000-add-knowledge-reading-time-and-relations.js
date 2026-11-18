"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("KnowledgeItems");
    if (!columns.estimatedReadingTime) {
      await queryInterface.addColumn("KnowledgeItems", "estimatedReadingTime", {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    const tables = await queryInterface.showAllTables();
    const exists = tables.some((table) => (typeof table === "string" ? table : table.tableName) === "KnowledgeRelations");
    if (!exists) {
      await queryInterface.createTable("KnowledgeRelations", {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        sourceArticleId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "KnowledgeItems", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE" },
        targetArticleId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "KnowledgeItems", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE" },
        relationType: { type: Sequelize.STRING(24), allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
      });
      await queryInterface.addIndex("KnowledgeRelations", ["sourceArticleId", "targetArticleId", "relationType"], {
        unique: true,
        name: "knowledge_relations_unique_edge",
      });
      await queryInterface.addIndex("KnowledgeRelations", ["targetArticleId", "relationType"], {
        name: "knowledge_relations_target_type",
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.some((table) => (typeof table === "string" ? table : table.tableName) === "KnowledgeRelations")) {
      await queryInterface.dropTable("KnowledgeRelations");
    }
    const columns = await queryInterface.describeTable("KnowledgeItems");
    if (columns.estimatedReadingTime) await queryInterface.removeColumn("KnowledgeItems", "estimatedReadingTime");
  },
};
