const {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require("../helper/customErrors");
const logger = require("../observability/logger");

const errorHandler = (error, req, res, next) => {
  let status = 500;
  if (error.status === 400) status = 400;
  else if (error instanceof UnauthorizedError) status = 401;
  else if (error instanceof ForbiddenError) status = 403;
  else if (error instanceof ConflictError) status = 409;
  else if (error instanceof NotFoundError) status = 404;
  else if (error instanceof ValidationError) status = 422;

  logger[status >= 500 ? "error" : "warn"]("http.error", {
    "http.request.id": req.id,
    "http.request.method": req.method,
    "url.path": req.path,
    "http.response.status_code": status,
    error: {
      type: error.name,
      message: error.message,
      ...(status >= 500 ? { stack: error.stack } : {}),
    },
  });
  res.status(status).json({ errors: { body: [error.message] } });
};

module.exports = errorHandler;
