const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const root = path.resolve(__dirname, "../..");
const interactive = process.argv.includes("--open");
const storage = path.join(root, ".tmp", "conduit-e2e.sqlite");
fs.mkdirSync(path.dirname(storage), { recursive: true });
const env = {
  ...process.env,
  NODE_ENV: "test",
  TEST_DB_DIALECT: "sqlite",
  TEST_DB_STORAGE: storage,
  TEST_DB_NAME: storage,
  TEST_DB_LOGGING: "false",
  PORT: "3001",
  VITE_PORT: "3000",
};
const processes = [];
const spawnNode = (args, cwd = root) => {
  const child = spawn(process.execPath, args, { cwd, env, stdio: "inherit" });
  processes.push(child);
  return child;
};

async function waitFor(url) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Service did not become ready: ${url}`);
}

(async () => {
  let result = 1;
  try {
    spawnNode(["backend/index.js"]);
    spawnNode(["../node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "3000"], path.join(root, "frontend"));
    await Promise.all([waitFor("http://127.0.0.1:3001/health"), waitFor("http://127.0.0.1:3000/")]);
    result = await new Promise((resolve) => {
      const cypress = spawn(process.execPath, ["node_modules/cypress/bin/cypress", interactive ? "open" : "run", "--config-file", "tests/e2e/cypress.config.cjs", "--project", "."], {
        cwd: root,
        env,
        stdio: "inherit",
      });
      cypress.on("exit", (code) => resolve(code ?? 1));
    });
  } catch (error) {
    console.error(error);
  } finally {
    for (const child of processes) child.kill("SIGTERM");
  }
  process.exitCode = result;
})();
