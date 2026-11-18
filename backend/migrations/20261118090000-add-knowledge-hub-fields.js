"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable("KnowledgeItems");
    const additions = {
      section: { type: Sequelize.STRING(30), allowNull: false, defaultValue: "architecture" },
      difficulty: { type: Sequelize.STRING(20), allowNull: false, defaultValue: "middle" },
      questionType: { type: Sequelize.STRING(30), allowNull: true },
      orderIndex: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    };
    for (const [name, definition] of Object.entries(additions)) {
      if (!columns[name]) await queryInterface.addColumn("KnowledgeItems", name, definition);
    }
    await queryInterface.addIndex("KnowledgeItems", ["section", "kind", "orderIndex"], {
      name: "knowledge_items_section_kind_order",
    }).catch((error) => {
      if (!/already exists|duplicate/i.test(error.message)) throw error;
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("KnowledgeItems", "knowledge_items_section_kind_order").catch(() => {});
    for (const name of ["orderIndex", "questionType", "difficulty", "section"]) {
      await queryInterface.removeColumn("KnowledgeItems", name);
    }
  },
};
