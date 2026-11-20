const { randomUUID } = require("crypto");
const logger = require("../observability/logger");
const requestContext = require("../observability/requestContext");

const validRequestId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const auditSecretKey = /password|token|authorization|secret|api[-_]?key/i;

function redactAuditPayload(value) {
  if (Array.isArray(value)) return value.map(redactAuditPayload);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    auditSecretKey.test(key) ? "[REDACTED]" : redactAuditPayload(item),
  ]));
}

function toLogValue(value) {
  let normalized = value;
  try {
    normalized = value === undefined ? null : JSON.parse(JSON.stringify(value));
  } catch {
    normalized = "[unavailable]";
  }
  return normalized;
}

module.exports = (ApiAuditLog) => (req, res, next) => {
  const started = process.hrtime.bigint();
  const clientRequestId = req.get("X-Request-Id");
  const clientFlowId = req.get("X-Flow-Id");
  req.id = clientRequestId && validRequestId.test(clientRequestId)
    ? clientRequestId
    : randomUUID();
  const requestLog = { requestId: req.id, dbCalls: [] };
  requestLog.flowId = clientFlowId && validRequestId.test(clientFlowId)
    ? clientFlowId
    : randomUUID();
  requestLog.systemCode = req.get("X-Systemcode") || req.get("X-System-Code") || "front";
  req.systemCode = requestLog.systemCode;
  req.flowId = requestLog.flowId;
  res.setHeader("X-Flow-Id", requestLog.flowId);
  res.setHeader("X-System-Code", requestLog.systemCode);
  res.setHeader("X-Request-Id", req.id);
  res.setHeader("Access-Control-Expose-Headers", "X-Request-Id, X-Flow-Id, X-System-Code, X-Systemcode");
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    const responseBody = body && typeof body === "object" && !Array.isArray(body)
      ? { ...body, requestId: req.id, flowId: requestLog.flowId }
      : { data: body, requestId: req.id, flowId: requestLog.flowId };
    requestLog.responseBody = responseBody;
    return sendJson(responseBody);
  };
  res.on("finish", () => {
    requestContext.run(requestLog, async () => {
      const duration = Number(process.hrtime.bigint() - started) / 1e6;
      const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        const entityId = req.params.commentId ?? req.params.id ?? req.params.slug ?? req.params.username ?? null;
        try {
          await ApiAuditLog.create({
            entityId: entityId === null ? null : String(entityId),
            method: req.method,
            path: req.path,
            payload: redactAuditPayload(req.body ?? null),
            datetime: new Date(),
            uuid: req.id,
            systemCode: requestLog.systemCode,
            statusCode: res.statusCode,
          });
        } catch (error) {
          logger.error("db.api_audit.write_failed", {
            application: "db",
            flow_id: requestLog.flowId,
            message: `ApiAuditLogs write failed: ${error.message}`,
          });
        }
      }

      if (requestLog.dbCalls.length) {
        const queryLines = requestLog.dbCalls.map((call, index) => `${index + 1}. ${call.sql}`);
        const resultLines = requestLog.dbCalls.map((call, index) => {
          const outcome = call.error
            ? `error=${call.error}`
            : `result=${JSON.stringify(call.result)}`;
          return `${index + 1}. ${call.duration_ms}ms | ${call.sql} | ${outcome}`;
        });
        logger.info("db.request", {
          application: "db",
          flow_id: requestLog.flowId,
          message: `DB REQUEST | caller=${req.loggedUser?.username || requestLog.systemCode} | ${req.method} ${req.path} | ${requestLog.dbCalls.length} SQL statements\n${queryLines.join("\n")}`,
        });
        logger.info("db.response", {
          application: "db",
          flow_id: requestLog.flowId,
          message: `DB RESPONSE | caller=${req.loggedUser?.username || requestLog.systemCode} | ${requestLog.dbCalls.length} SQL results\n${resultLines.join("\n")}`,
        });
      }

      logger[level]("backend.request", {
        application: "back",
        flow_id: requestLog.flowId,
        message: `BACK METHOD RESPONSE | caller=${req.loggedUser?.username || requestLog.systemCode} | ${req.method} ${req.path} | status=${res.statusCode} | duration=${Math.round(duration * 100) / 100}ms | body=${JSON.stringify(toLogValue(requestLog.responseBody))}`,
      });
    });
  });
  requestContext.run(requestLog, () => {
    logger.info("front.request", {
      application: "front",
      flow_id: requestLog.flowId,
      message: `FRONT REQUEST | ${req.method} ${req.originalUrl} | caller=${req.ip} | system=${requestLog.systemCode} | headers=${JSON.stringify(req.headers)} | body=${JSON.stringify(toLogValue(req.body))}`,
    });
    logger.info("backend.processing", {
      application: "back",
      flow_id: requestLog.flowId,
      message: `BACK ACCEPTED | request_id=${req.id} | caller=${req.ip} | system=${requestLog.systemCode} | ${req.method} ${req.originalUrl}`,
    });
    next();
  });
};
