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

function toLogValue(value, limit = 6000) {
  let normalized = value;
  try {
    normalized = value === undefined ? null : JSON.parse(JSON.stringify(value));
  } catch {
    normalized = "[unavailable]";
  }
  const redacted = redact(normalized);
  const serialized = JSON.stringify(redacted);
  if (serialized.length <= limit) return redacted;
  return {
    truncated: true,
    original_length: serialized.length,
    preview: serialized.slice(0, limit),
  };
}

module.exports = (ApiAuditLog) => (req, res, next) => {
  const started = process.hrtime.bigint();
  const clientRequestId = req.get("X-Request-Id");
  req.id = clientRequestId && validRequestId.test(clientRequestId)
    ? clientRequestId
    : randomUUID();
  const requestLog = { requestId: req.id, dbQueries: [] };
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("Access-Control-Expose-Headers", "X-Request-Id");
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    const responseBody = body && typeof body === "object" && !Array.isArray(body)
      ? { ...body, requestId: req.id }
      : { data: body, requestId: req.id };
    requestLog.responseBody = responseBody;
    return sendJson(responseBody);
  };
  res.on("finish", () => {
    const duration = Number(process.hrtime.bigint() - started) / 1e6;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]("http.request", {
      "http.request.id": req.id,
      "http.request.method": req.method,
      "url.path": req.path,
      "url.query": toLogValue(req.query || {}),
      "http.request.body": toLogValue(req.body),
      "http.response.status_code": res.statusCode,
      "http.response.body": toLogValue(requestLog.responseBody),
      "event.duration_ms": Math.round(duration * 100) / 100,
      "db.query_count": requestLog.dbQueries.length,
      "db.queries": requestLog.dbQueries,
      ...(requestLog.error ? { error: requestLog.error } : {}),
    });

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
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
  requestContext.run(requestLog, next);
};
