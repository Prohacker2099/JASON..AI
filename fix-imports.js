#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Directories to process
const directories = ["server", "integrations", "plugins", "db"];

// File extensions to process
const extensions = [".ts", ".tsx"];

// Function to add .js extension to imports
function addJsExtensionToImports(content) {
  // Match import statements without file extensions
  const importRegex = /from\s+['"]([^'"]*?)(?:\.js)?['"]/g;

  return content.replace(importRegex, (match, importPath) => {
    // Skip node modules, relative URLs with extensions, and absolute URLs
    if (
      importPath.startsWith("@") ||
      importPath.startsWith("http") ||
      importPath.includes("node_modules") ||
      importPath.match(/\.\w+$/) || // Has extension already
      !importPath.includes("/") // Is a package name
    ) {
      return match;
    }

    return `from '${importPath}.js'`;
  });
}

// Function to process a file
function processFile(filePath) {
  console.log(`Processing ${filePath}`);

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const updatedContent = addJsExtensionToImports(content);

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, "utf8");
      console.log(`Updated imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Function to walk through directories
function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist directories
      if (file !== "node_modules" && file !== "dist") {
        walkDir(filePath);
      }
    } else if (extensions.includes(path.extname(file))) {
      processFile(filePath);
    }
  });
}

// Process all directories
directories.forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    walkDir(dirPath);
  } else {
    console.warn(`Directory not found: ${dirPath}`);
  }
});

console.log("Import paths updated successfully!");
