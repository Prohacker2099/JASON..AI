// Simple development server script
const { spawn } = require("child_process");
const path = require("path");

console.log("Starting development server...");

// Run the server using ts-node
const server = spawn(
  "npx",
  ["ts-node", "--transpile-only", path.join(__dirname, "server/index.ts")],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      TS_NODE_PROJECT: path.join(__dirname, "tsconfig.json"),
    },
  },
);

server.on("error", (error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

server.on("exit", (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down...");
  server.kill();
});
