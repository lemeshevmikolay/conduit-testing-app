const logger = require("./logger");
const requestContext = require("./requestContext");

module.exports = (sequelize) => {
  for (const action of ["Create", "Update", "Destroy"]) {
    sequelize.addHook(`after${action}`, (instance) => {
      const key = instance.constructor.primaryKeyAttribute;
      logger.info(`db.record.${action.toLowerCase()}`, {
        "http.request.id": requestContext.getStore()?.requestId,
        "db.system": sequelize.getDialect(),
        "db.collection.name": instance.constructor.tableName,
        "db.operation": action.toLowerCase(),
        "db.record.id": key ? String(instance.get(key)) : undefined,
      });
    });
  }
};
