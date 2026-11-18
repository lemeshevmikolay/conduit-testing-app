"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.some((table) => (typeof table === "string" ? table : table.tableName) === "KnowledgeItems")) return;
    await queryInterface.createTable("KnowledgeItems", {
      id: { type: Sequelize.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
      slug: { type: Sequelize.STRING(180), allowNull: false, unique: true },
      kind: { type: Sequelize.STRING(20), allowNull: false },
      section: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "architecture" },
      category: { type: Sequelize.STRING(80), allowNull: false },
      difficulty: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "middle" },
      questionType: { type: Sequelize.STRING(30), allowNull: true },
      orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      title: { type: Sequelize.STRING(255), allowNull: false },
      summary: { type: Sequelize.STRING(500), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      question: { type: Sequelize.TEXT, allowNull: true },
      answer: { type: Sequelize.TEXT, allowNull: true },
      sourceName: { type: Sequelize.STRING(180), allowNull: false },
      sourceUrl: { type: Sequelize.STRING(1000), allowNull: false },
      tags: { type: Sequelize.JSON, allowNull: false },
      published: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("KnowledgeItems", ["kind", "published"]);
    await queryInterface.addIndex("KnowledgeItems", ["category"]);
    await queryInterface.addIndex("KnowledgeItems", ["section", "kind", "orderIndex"], { name: "knowledge_items_section_kind_order" });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("KnowledgeItems");
  },
};
