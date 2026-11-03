const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const processes = [
  { name: "API", cwd: path.join(root, "backend"), args: ["--watch", "index.js"] },
  {
    name: "Web",
    cwd: path.join(root, "frontend"),
    args: [path.join(root, "node_modules", "vite", "bin", "vite.js")],
  },
].map(({ name, cwd, args }) => {
  const child = spawn(process.execPath, args, {
    cwd,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });
  child.on("error", (error) => {
    console.error(`[${name}] ${error.message}`);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
    for (const other of processes) if (other !== child && !other.killed) other.kill();
  });
  return child;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    for (const child of processes) if (!child.killed) child.kill(signal);
  });
}
