const service = "conduit-api";
const endpoint = process.env.ELASTICSEARCH_URL;
const queue = [];
let timer;

function write(level, event, fields = {}) {
  const record = {
    "@timestamp": new Date().toISOString(),
    "service.name": service,
    log: { level },
    event: { action: event },
    ...fields,
  };
  process.stdout.write(`${JSON.stringify(record)}\n`);
  if (endpoint) {
    queue.push(record);
    if (queue.length > 5000) queue.shift();
    if (!timer) timer = setTimeout(flush, 1000);
  }
}

async function flush() {
  timer = undefined;
  if (!endpoint || queue.length === 0) return;
  const batch = queue.splice(0, 250);
  const body = batch.flatMap((record) => [
    JSON.stringify({ index: { _index: `conduit-logs-${record["@timestamp"].slice(0, 10)}` } }),
    JSON.stringify(record),
  ]).join("\n") + "\n";
  try {
    const response = await fetch(`${endpoint.replace(/\/$/, "")}/_bulk`, {
      method: "POST",
      headers: { "content-type": "application/x-ndjson" },
      body,
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`Elasticsearch returned ${response.status}`);
    const result = await response.json();
    if (result.errors) throw new Error("Elasticsearch rejected some log records");
  } catch (error) {
    queue.unshift(...batch);
    if (queue.length > 5000) queue.length = 5000;
    process.stderr.write(`Elasticsearch log delivery failed: ${error.message}\n`);
  }
  if (queue.length) timer = setTimeout(flush, 5000);
}

module.exports = {
  info: (event, fields) => write("info", event, fields),
  warn: (event, fields) => write("warn", event, fields),
  error: (event, fields) => write("error", event, fields),
};
