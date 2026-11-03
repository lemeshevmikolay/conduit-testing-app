const { randomUUID } = require("crypto");
const logger = require("../observability/logger");
const requestContext = require("../observability/requestContext");

const validRequestId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const secretKey = /password|token|authorization|secret|api[-_]?key/i;

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      secretKey.test(key) ? "[REDACTED]" : redact(item),
    ]),
  );
}

module.exports = (ApiAuditLog) => (req, res, next) => {
  const started = process.hrtime.bigint();
  const clientRequestId = req.get("X-Request-Id");
  req.id = clientRequestId && validRequestId.test(clientRequestId)
    ? clientRequestId
    : randomUUID();
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("Access-Control-Expose-Headers", "X-Request-Id");
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    const responseBody = body && typeof body === "object" && !Array.isArray(body)
      ? { ...body, requestId: req.id }
      : { data: body, requestId: req.id };
    return sendJson(responseBody);
  };
  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - started) / 1e6;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]("http.request", {
      "http.request.id": req.id,
      "http.request.method": req.method,
      "url.path": req.path,
      "http.response.status_code": res.statusCode,
      "event.duration": Math.round(duration * 1e6),
    });

    if (["POST", "PATCH", "DELETE"].includes(req.method)) {
      const entityId = req.params.commentId ?? req.params.id ?? req.params.slug ?? req.params.username ?? null;
      ApiAuditLog.create({
        entityId: entityId === null ? null : String(entityId),
        method: req.method,
        path: req.path,
        payload: redact(req.body ?? null),
        datetime: new Date(),
        uuid: req.id,
        statusCode: res.statusCode,
      }).catch((error) => {
        logger.error("db.api_audit.write_failed", {
          "http.request.id": req.id,
          "error.message": error.message,
        });
      });
    }
  });
  requestContext.run({ requestId: req.id }, next);
};
