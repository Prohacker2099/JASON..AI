#!/usr/bin/env node

import { spawn } from "child_process";

// Start Express server
console.log("Starting Express server...");
const expressApp = spawn("node", ["simple-app.js"], {
  stdio: "inherit",
  shell: true,
});

expressApp.on("error", (err) => {
  console.error("Failed to start Express server:", err);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down...");
  expressApp.kill();
  process.exit(0);
});

console.log("JASON is starting up...");
console.log("Access the web interface at http://localhost:10000");
