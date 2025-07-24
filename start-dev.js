#!/usr/bin/env node

/**
 * Simple development server script that uses ts-node to run TypeScript files directly
 */
const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Ensure we're in the project root
const projectRoot = __dirname;

// Create a temporary tsconfig for development
const tempTsConfig = {
  compilerOptions: {
    target: "ES2020",
    module: "CommonJS",
    moduleResolution: "node",
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: false,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: "react",
  },
  include: ["server/**/*.ts", "server/**/*.tsx", "db/**/*.ts"],
  exclude: ["node_modules"],
};

// Write the temporary tsconfig
const tempTsConfigPath = path.join(projectRoot, "tsconfig.dev.json");
fs.writeFileSync(tempTsConfigPath, JSON.stringify(tempTsConfig, null, 2));

console.log("Starting development server...");

// Run the server using ts-node
const result = spawnSync(
  "npx",
  [
    "ts-node",
    "--project",
    tempTsConfigPath,
    path.join(projectRoot, "server/index.ts"),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "development",
    },
  },
);

// Clean up the temporary tsconfig
fs.unlinkSync(tempTsConfigPath);

// Exit with the same code as the server
process.exit(result.status);
