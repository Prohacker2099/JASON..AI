#!/usr/bin/env node

/**
 * Simple development server script that uses ts-node to run TypeScript files directly
 * with type checking disabled to bypass module system issues
 */
const { spawnSync } = require("child_process");
const path = require("path");

// Ensure we're in the project root
const projectRoot = __dirname;

console.log("Starting development server with type checking disabled...");

// Run the server using ts-node with skipProject flag
const result = spawnSync(
  "npx",
  [
    "ts-node",
    "--transpile-only",
    "--skip-project",
    path.join(projectRoot, "server/index.ts"),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development",
      TS_NODE_COMPILER_OPTIONS:
        '{"module":"CommonJS","moduleResolution":"node"}',
    },
  },
);

// Exit with the same code as the server
process.exit(result.status);
