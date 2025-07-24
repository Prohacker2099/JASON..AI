// This file is used to start the server in development mode
// It's an ES Module that loads the TypeScript compiler and then runs the server

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Starting server with ts-node...");

// Run ts-node-dev with the appropriate flags for ESM
const child = spawn(
  "npx",
  [
    "ts-node-dev",
    "--respawn",
    "--transpile-only",
    "--ignore-watch",
    "node_modules",
    "--project",
    "tsconfig.node.json",
    "server/index.ts",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_OPTIONS: "--experimental-specifier-resolution=node", // Add this for Node.js to resolve imports without extensions
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
