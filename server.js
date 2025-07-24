// This file is used to start the server in development mode
// It's a CommonJS file that loads the TypeScript compiler and then runs the server

// Use ts-node-dev for better development experience
const { spawn } = require("child_process");

console.log("Starting server with ts-node-dev...");

// Run ts-node-dev with the appropriate flags
const child = spawn(
  "npx",
  ["ts-node-dev", "--respawn", "--transpile-only", "server/index.ts"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      TS_NODE_PROJECT: "tsconfig.json",
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
