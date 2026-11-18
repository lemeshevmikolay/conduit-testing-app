"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.some((table) => (typeof table === "string" ? table : table.tableName) === "KnowledgeSources")) return;
    await queryInterface.changeColumn("KnowledgeSources", "url", {
      type: Sequelize.STRING(700), allowNull: false,
    });
  },
  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.some((table) => (typeof table === "string" ? table : table.tableName) === "KnowledgeSources")) return;
    await queryInterface.changeColumn("KnowledgeSources", "url", {
      type: Sequelize.STRING(1000), allowNull: false,
    });
  },
};
