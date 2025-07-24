#!/usr/bin/env node

// This is a CommonJS file that will bootstrap our ESM TypeScript server
// We're using this approach because ts-node-dev has issues with ESM in TypeScript

const { spawn } = require("child_process");
const path = require("path");

console.log("Starting server in development mode...");

// Run ts-node with the appropriate flags for ESM
const child = spawn(
  "npx",
  [
    "ts-node",
    "--esm", // Enable ESM mode
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
