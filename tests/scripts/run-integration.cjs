const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const root = path.resolve(__dirname, "../..");
const storage = path.join(root, ".tmp", "conduit-integration.sqlite");
fs.mkdirSync(path.dirname(storage), { recursive: true });
const env = {
  ...process.env,
  NODE_ENV: "test",
  TEST_DB_DIALECT: "sqlite",
  TEST_DB_STORAGE: storage,
  TEST_DB_NAME: storage,
  TEST_DB_LOGGING: "false",
  PORT: "3101",
};
const server = spawn(process.execPath, ["backend/index.js"], { cwd: root, env, stdio: "inherit" });

async function waitForApi() {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:3101/health");
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("API did not become healthy on port 3101");
}

function runTests() {
  return new Promise((resolve) => {
    const testProcess = spawn(process.execPath, ["--test", "tests/integration/api-lifecycle.test.cjs"], {
      cwd: root,
      env: { ...env, API_BASE_URL: "http://127.0.0.1:3101/api" },
      stdio: "inherit",
    });
    testProcess.on("exit", (code) => resolve(code ?? 1));
  });
}

(async () => {
  try {
    await waitForApi();
    process.exitCode = await runTests();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    server.kill("SIGTERM");
  }
})();
