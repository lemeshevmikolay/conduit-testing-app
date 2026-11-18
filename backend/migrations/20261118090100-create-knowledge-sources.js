"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.some((table) => (typeof table === "string" ? table : table.tableName) === "KnowledgeSources")) return;
    await queryInterface.createTable("KnowledgeSources", {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      knowledgeItemId: { type: Sequelize.INTEGER, allowNull: false, references: { model: "KnowledgeItems", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE" },
      title: { type: Sequelize.STRING(255), allowNull: false },
      url: { type: Sequelize.STRING(700), allowNull: false },
      type: { type: Sequelize.STRING(40), allowNull: false },
      description: { type: Sequelize.STRING(500), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("KnowledgeSources", ["knowledgeItemId", "url"], { unique: true, name: "knowledge_sources_item_url_unique" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("KnowledgeSources");
  },
};
