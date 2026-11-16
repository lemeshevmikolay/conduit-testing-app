const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const root = path.resolve(__dirname, "../..");
const updateBaselines = process.argv.includes("--update-baselines");
const storage = path.join(root, ".tmp", "conduit-visual.sqlite");
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
  VISUAL_UPDATE_BASELINES: updateBaselines ? "1" : "0",
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
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Service did not become ready: ${url}`);
}

function writeHtmlReport() {
  const reportPath = path.join(root, ".tmp", "visual", "report.json");
  if (!fs.existsSync(reportPath)) return;
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const rows = report.results.map((item) => {
    const base = `../../tests/visual/baselines/${item.name}.png`;
    const previous = item.previousBaseline ? `previous/${item.name}.png` : base;
    const actual = `actual/visual-regression.cy.js/visual/${item.name}.png`;
    const diff = item.diff ? `diff/${item.name}.png` : "";
    const baseLabel = item.previousBaseline ? "Previous baseline" : "Baseline";
    return `<tr><td><strong>${escape(item.name)}</strong><br>${escape(item.status)}${item.ratio == null ? "" : ` · ${(item.ratio * 100).toFixed(3)}% changed`}</td><td>${item.status === "missing-baseline" ? "" : `<strong>${baseLabel}</strong><a href="${previous}"><img src="${previous}" alt="${escape(item.name)} ${baseLabel.toLowerCase()}"></a>`}</td><td><a href="${actual}"><img src="${actual}" alt="${escape(item.name)} actual"></a></td><td>${diff ? `<a href="${diff}"><img src="${diff}" alt="${escape(item.name)} difference"></a>` : "No pixel changes"}</td></tr>`;
  }).join("\n");
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Conduit visual regression report</title><style>body{font:14px system-ui,sans-serif;margin:24px;color:#17202a}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccd3da;padding:10px;text-align:left;vertical-align:top}th{position:sticky;top:0;background:#f3f5f7}td img{display:block;max-width:min(28vw,500px);height:auto;border:1px solid #ddd}.passed{color:#147d36}.changed,.missing-baseline,.dimension-mismatch{color:#b42318}</style><h1>Conduit visual regression report</h1><p>Generated ${escape(report.generatedAt)}. Baseline updates require the explicit <code>npm run test:visual:baseline</code> command.</p><pre>${escape(JSON.stringify(report.summary || {}, null, 2))}</pre><table><thead><tr><th>Scenario</th><th>Baseline</th><th>Actual</th><th>Difference</th></tr></thead><tbody>${rows}</tbody></table></html>`;
  fs.writeFileSync(path.join(root, ".tmp", "visual", "report.html"), html);
}

(async () => {
  let result = 1;
  try {
    spawnNode(["backend/index.js"]);
    spawnNode(["../node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "3000"], path.join(root, "frontend"));
    await Promise.all([waitFor("http://127.0.0.1:3001/health"), waitFor("http://127.0.0.1:3000/")]);
    result = await new Promise((resolve) => {
      const cypress = spawn(process.execPath, ["node_modules/cypress/bin/cypress", "run", "--config-file", "tests/e2e/cypress.config.cjs", "--project", ".", "--spec", "tests/e2e/visual-regression.cy.js"], {
        cwd: root, env, stdio: "inherit",
      });
      cypress.on("exit", (code) => resolve(code ?? 1));
    });
  } catch (error) {
    console.error(error);
  } finally {
    for (const child of processes) child.kill("SIGTERM");
    writeHtmlReport();
  }
  process.exitCode = result;
})();
