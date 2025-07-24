// This is a CommonJS file to start the development server
const { exec } = require("child_process");
const path = require("path");

// Change type in package.json temporarily
console.log('Setting package.json type to "commonjs"...');
exec(
  "node -e \"const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json'));pkg.type='commonjs';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2))\"",
  (error) => {
    if (error) {
      console.error("Error updating package.json:", error);
      process.exit(1);
    }

    console.log("Starting server with ts-node-dev...");

    // Start the server with ts-node-dev
    const server = exec(
      "npx ts-node-dev --respawn --transpile-only server/index.ts",
      {
        env: {
          ...process.env,
          TS_NODE_PROJECT: path.resolve(__dirname, "tsconfig.json"),
        },
      },
    );

    // Forward stdout and stderr
    server.stdout.pipe(process.stdout);
    server.stderr.pipe(process.stderr);

    // Handle server exit
    server.on("exit", (code) => {
      console.log(`Server exited with code ${code}`);

      // Restore package.json
      console.log('Restoring package.json type to "module"...');
      exec(
        "node -e \"const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json'));pkg.type='module';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2))\"",
        (error) => {
          if (error) {
            console.error("Error restoring package.json:", error);
          }
          process.exit(code);
        },
      );
    });

    // Handle process termination
    process.on("SIGINT", () => {
      console.log("Received SIGINT. Shutting down...");

      // Restore package.json
      console.log('Restoring package.json type to "module"...');
      exec(
        "node -e \"const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json'));pkg.type='module';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2))\"",
        (error) => {
          if (error) {
            console.error("Error restoring package.json:", error);
          }
          process.exit(0);
        },
      );
    });
  },
);
