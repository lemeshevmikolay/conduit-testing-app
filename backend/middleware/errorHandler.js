const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require("../helper/customErrors");
const requestContext = require("../observability/requestContext");

const errorHandler = (error, req, res, next) => {
  let status = 500;
  if (error.status === 400) status = 400;
  else if (error instanceof UnauthorizedError) status = 401;
  else if (error instanceof ForbiddenError) status = 403;
  else if (error instanceof ConflictError) status = 409;
  else if (error instanceof NotFoundError) status = 404;
  else if (error instanceof ValidationError) status = 422;

  const requestLog = requestContext.getStore();
  if (requestLog) {
    requestLog.error = {
      type: error.name,
      message: error.message,
      ...(status >= 500 && process.env.LOG_ERROR_STACKS === "true"
        ? { stack: error.stack }
        : {}),
    };
  }
  res.status(status).json({ errors: { body: [error.message] } });
};

module.exports = errorHandler;
