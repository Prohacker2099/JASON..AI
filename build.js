#!/usr/bin/env node

/**
 * Production build script for JASON - The Omnipotent AI Architect
 * This script builds both the server and client for production deployment
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Configuration
const ROOT_DIR = process.cwd();
const SERVER_DIR = path.join(ROOT_DIR, "server");
const CLIENT_DIR = path.join(ROOT_DIR, "client");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const CLIENT_BUILD_DIR = path.join(CLIENT_DIR, "build");
const PUBLIC_DIR = path.join(DIST_DIR, "public");

// Ensure we're using production environment
process.env.NODE_ENV = "production";

console.log(
  "🚀 Starting production build for JASON - The Omnipotent AI Architect",
);

// Create dist directory if it doesn't exist
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

try {
  // Build server (TypeScript)
  console.log("\n📦 Building server...");
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Server build complete");

  // Build client (React)
  console.log("\n📦 Building client...");
  process.chdir(CLIENT_DIR);
  execSync("npm run build", { stdio: "inherit" });
  process.chdir(ROOT_DIR);
  console.log("✅ Client build complete");

  // Copy client build to public directory in dist
  console.log("\n📋 Copying client build to dist/public...");
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Copy client build files to public directory
  fs.cpSync(CLIENT_BUILD_DIR, PUBLIC_DIR, { recursive: true });
  console.log("✅ Client files copied to dist/public");

  // Copy production environment file
  console.log("\n📋 Copying production environment file...");
  fs.copyFileSync(
    path.join(ROOT_DIR, ".env.production"),
    path.join(DIST_DIR, ".env"),
  );
  console.log("✅ Environment file copied");

  // Copy package.json for production dependencies
  console.log("\n📋 Creating production package.json...");
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8"),
  );

  // Simplify package.json for production
  const prodPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    type: packageJson.type,
    main: "index.js",
    scripts: {
      start: "node index.js",
    },
    dependencies: packageJson.dependencies,
    engines: packageJson.engines,
  };

  fs.writeFileSync(
    path.join(DIST_DIR, "package.json"),
    JSON.stringify(prodPackageJson, null, 2),
  );
  console.log("✅ Production package.json created");

  // Create data directory
  if (!fs.existsSync(path.join(DIST_DIR, "data"))) {
    fs.mkdirSync(path.join(DIST_DIR, "data"), { recursive: true });
  }

  console.log("\n🎉 Production build completed successfully!");
  console.log("\nTo run the production build:");
  console.log("1. cd dist");
  console.log("2. npm install --production");
  console.log("3. npm start");
} catch (error) {
  console.error("\n❌ Build failed:", error);
  process.exit(1);
}
