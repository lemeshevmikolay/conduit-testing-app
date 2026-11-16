const { AsyncLocalStorage } = require("node:async_hooks");

const requestContext = new AsyncLocalStorage();

requestContext.setSystemCode = (systemCode) => {
  const store = requestContext.getStore();
  if (store) store.systemCode = systemCode;
};

module.exports = requestContext;
