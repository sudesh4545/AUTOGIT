import { spawn } from "node:child_process";

const child = spawn("npm", ["run", "start"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PORT: process.env.PORT || "11345" },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
