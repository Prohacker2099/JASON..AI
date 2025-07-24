/**
 * Script to download AI models for local inference
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const os = require("os");

// Configuration
const MODEL_DIR =
  process.env.AI_MODELS_PATH || path.join(os.homedir(), ".jason", "models");
const MODELS = [
  {
    name: "tinyllama-1.1b-chat.gguf",
    url: "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",
    description: "TinyLlama 1.1B Chat (4-bit quantized)",
    size: "642 MB",
  },
];

// Create model directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
  console.log(`Creating model directory: ${MODEL_DIR}`);
  fs.mkdirSync(MODEL_DIR, { recursive: true });
}

/**
 * Download a file from a URL to a local path with progress reporting
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    let downloadedBytes = 0;
    let totalBytes = 0;
    let lastLogTime = Date.now();

    // Handle redirects by following them
    function fetchWithRedirects(url, redirectCount = 0) {
      if (redirectCount > 5) {
        reject(new Error("Too many redirects"));
        return;
      }

      const options = new URL(url);

      https
        .get(options, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const location = response.headers.location;
            console.log(`Following redirect to: ${location}`);
            fetchWithRedirects(location, redirectCount + 1);
            return;
          }

          if (response.statusCode !== 200) {
            reject(
              new Error(
                `Failed to download: ${response.statusCode} ${response.statusMessage}`,
              ),
            );
            return;
          }

          totalBytes = parseInt(response.headers["content-length"] || "0", 10);

          response.on("data", (chunk) => {
            downloadedBytes += chunk.length;
            file.write(chunk);

            // Log progress every second
            const now = Date.now();
            if (now - lastLogTime > 1000) {
              const progress = totalBytes
                ? Math.round((downloadedBytes / totalBytes) * 100)
                : 0;
              const mbDownloaded = (downloadedBytes / (1024 * 1024)).toFixed(2);
              const mbTotal = totalBytes
                ? (totalBytes / (1024 * 1024)).toFixed(2)
                : "unknown";
              console.log(
                `Downloaded ${mbDownloaded} MB of ${mbTotal} MB (${progress}%)`,
              );
              lastLogTime = now;
            }
          });

          response.on("end", () => {
            file.end();
            console.log(`Download complete: ${destPath}`);
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(destPath, () => {}); // Delete the file on error
          reject(err);
        });
    }

    fetchWithRedirects(url);
  });
}

/**
 * Main function to download models
 */
async function downloadModels() {
  console.log("JASON AI Model Downloader");
  console.log("========================");
  console.log(`Models will be saved to: ${MODEL_DIR}`);
  console.log();

  // Display available models
  console.log("Available models:");
  MODELS.forEach((model, index) => {
    console.log(
      `${index + 1}. ${model.name} - ${model.description} (${model.size})`,
    );
  });
  console.log();

  // Download the TinyLlama model
  const selectedModel = MODELS[0];

  console.log(`Downloading ${selectedModel.name}...`);
  const destPath = path.join(MODEL_DIR, selectedModel.name);

  // Check if model already exists
  if (fs.existsSync(destPath)) {
    console.log(`Model already exists at ${destPath}`);
    console.log("Skipping download.");
    return;
  }

  try {
    await downloadFile(selectedModel.url, destPath);
    console.log(`Successfully downloaded ${selectedModel.name} to ${destPath}`);
  } catch (error) {
    console.error(`Error downloading model: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
downloadModels().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
