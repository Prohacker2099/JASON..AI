/**
 * Production Server Script
 *
 * This script serves the production build of the JASON application.
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Serve static files from the React app build directory
const clientBuildPath = path.join(rootDir, "client/build");

// Check if client build exists
if (!fs.existsSync(clientBuildPath)) {
  console.error(
    '❌ Client build not found. Please run "npm run build:client" first.',
  );
  process.exit(1);
}

// Serve static files from the React app
app.use(express.static(clientBuildPath));

// Serve API routes
app.use("/api", (req, res) => {
  // This is a placeholder - in a real app, you would import your API routes here
  res.json({ message: "API endpoint" });
});

// For any request that doesn't match one above, send back the React app's index.html file
app.get("*", (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 JASON Production Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} in your browser`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});
