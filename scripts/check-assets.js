/**
 * Asset Checker Script
 *
 * This script checks for required assets before building the client application.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Required assets to check
const requiredAssets = ["client/src/assets/circuit-pattern.svg"];

console.log("🔍 Checking for required assets...");
let missingAssets = false;

for (const asset of requiredAssets) {
  const assetPath = path.join(rootDir, asset);

  try {
    fs.accessSync(assetPath, fs.constants.F_OK);
    console.log(`✅ Found: ${asset}`);
  } catch (err) {
    console.error(`❌ Missing: ${asset}`);
    missingAssets = true;
  }
}

if (missingAssets) {
  console.error("❌ Some required assets are missing. Build may fail.");
  process.exit(1);
} else {
  console.log("✅ All required assets are present.");
}
