#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = resolve(__dirname, "server/index.ts");

const child = spawn(
  "node",
  [
    "--experimental-specifier-resolution=node",
    "--loader",
    "ts-node/esm",
    serverPath,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      TS_NODE_PROJECT: resolve(__dirname, "tsconfig.json"),
    },
  },
);

child.on("error", (error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

child.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code);
  }
});
