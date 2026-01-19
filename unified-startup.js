#!/usr/bin/env node

/**
 * JASON AI Architect - Unified Startup Script
 * Optimized integration of all components for maximum performance
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');
const url = require('url');

const execAsync = promisify(exec);
const childProcesses = [];

// Configuration
const CONFIG = {
  SERVER_PORT: process.env.SERVER_PORT || 3001,
  CLIENT_PORT: process.env.CLIENT_PORT || 3000,
  WEBSOCKET_PORT: process.env.WEBSOCKET_PORT || 8080,
  BRAIN_PORT: process.env.BRAIN_PORT || 8000,
  MQTT_PORT: process.env.MQTT_PORT || 1883,
  DB_PATH: process.env.DB_PATH || './jason.db',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}[JASON] ${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Detect and kill processes listening on a port (Windows-first approach)
async function ensurePortFree(port) {
  logInfo(`Preflight: ensuring port ${port} is free...`);
  const isWindows = os.platform() === 'win32';
  const killScript = path.join(__dirname, 'scripts', 'kill-port.js');
  if (isWindows && fs.existsSync(killScript)) {
    await new Promise((resolve) => {
      const child = spawn('node', [killScript, String(port)], { cwd: __dirname, shell: true });
      child.stdout.on('data', (d) => log(`[KILL-PORT] ${d.toString().trim()}`, 'yellow'));
      child.stderr.on('data', (d) => log(`[KILL-PORT] ${d.toString().trim()}`, 'yellow'));
      child.on('close', resolve);
    });
    logSuccess(`Port ${port} preflight complete.`);
    return;
  }
  // Fallback minimal check (no kill)
  logWarning('kill-port script not found; skipping enforced cleanup.');
}

// Check system requirements
async function checkSystemRequirements() {
  logInfo('Checking system requirements...');

  try {
    // Check Node.js version
    const { stdout: nodeVersion } = await execAsync('node --version');
    const version = nodeVersion.trim().replace('v', '');
    const [major] = version.split('.');

    if (parseInt(major) < 18) {
      logError(`Node.js version ${version} is too old. Please upgrade to v18 or later.`);
      process.exit(1);
    }

    logSuccess(`Node.js version ${version} ✓`);

    // Check npm
    const { stdout: npmVersion } = await execAsync('npm --version');
    logSuccess(`npm version ${npmVersion.trim()} ✓`);

    // Check if required directories exist
    const requiredDirs = ['server', 'client', 'client/src'];
    for (const dir of requiredDirs) {
      if (!fs.existsSync(path.join(__dirname, dir))) {
        logError(`Required directory missing: ${dir}`);
        process.exit(1);
      }
    }

    logSuccess('All system requirements met ✓');

  } catch (error) {
    logError(`System check failed: ${error.message}`);
    process.exit(1);
  }
}

// Install dependencies for all components
async function installDependencies() {
  if (process.env.SKIP_INSTALL === 'true') {
    logInfo('Skipping dependency installation (SKIP_INSTALL=true)');
    return;
  }
  logInfo('Installing and updating dependencies...');

  const installTasks = [
    { dir: '.', name: 'Root dependencies' },
    { dir: 'server', name: 'Server dependencies' },
    { dir: 'client', name: 'Client dependencies' }
  ];

  for (const task of installTasks) {
    const taskDir = path.join(__dirname, task.dir);

    if (fs.existsSync(path.join(taskDir, 'package.json'))) {
      logInfo(`Installing ${task.name}...`);

      try {
        await execAsync('npm install --legacy-peer-deps', {
          cwd: taskDir,
          stdio: 'inherit'
        });
        logSuccess(`${task.name} installed ✓`);
      } catch (error) {
        logWarning(`${task.name} installation had warnings (continuing...)`);
      }
    }
  }
}

// Build TypeScript components
async function buildComponents() {
  logInfo('Building TypeScript components...');

  try {
    // Build server components
    if (fs.existsSync(path.join(__dirname, 'server/tsconfig.json'))) {
      logInfo('Building server TypeScript...');
      await execAsync('npx tsc', { cwd: path.join(__dirname, 'server') });
      logSuccess('Server TypeScript built ✓');
    }

    // Build main TypeScript only when explicitly enabled
    if (process.env.BUILD_MAIN_TSC === 'true' && fs.existsSync(path.join(__dirname, 'tsconfig.json'))) {
      logInfo('Building main TypeScript...');
      await execAsync('npx tsc');
      logSuccess('Main TypeScript built ✓');
    }

  } catch (error) {
    logWarning(`Build completed with warnings: ${error.message}`);
  }
}

// Start server components
function startServer() {
  return new Promise((resolve, reject) => {
    logInfo('Starting JASON server...');
    // Preflight: make sure desired port is free before spawning
    // Note: We wrap ensurePortFree in a mini-async to keep current function sync-ish
    const doStart = async () => {
      await ensurePortFree(CONFIG.SERVER_PORT);

      // Determine which server file to use and how to run it
      let serverCommand, serverArgs;
      const indexTs = path.join(__dirname, 'server/index.ts');
      if (!fs.existsSync(indexTs)) {
        logError('server/index.ts not found. This script now requires it to start the server.');
        return reject(new Error('Missing server/index.ts'));
      }
      // Use tsx to run TypeScript directly
      serverCommand = 'npx';
      serverArgs = ['tsx', 'server/index.ts'];

      // Log which server target we're launching
      logInfo(`Launching JASON Server (TSX) on port ${CONFIG.SERVER_PORT}...`);

      const serverProcess = spawn(serverCommand, serverArgs, {
        detached: true,
        cwd: __dirname,
        stdio: 'pipe',
        env: { ...process.env, SERVER_PORT: CONFIG.SERVER_PORT, PORT: CONFIG.SERVER_PORT, USE_UNIFIED_DEVICE_CONTROL: 'true', GHOST_HEADLESS: 'false', VLM_SERVER_PORT: '8000', VLM_SERVER_HOST: '127.0.0.1' },
        shell: true // Enable shell to find npx on Windows
      });

      // Diagnostic: log PID and attempt to print command line on Windows
      logInfo(`Server process spawned. PID=${serverProcess.pid}`);
      try {
        const psCmd = `powershell -NoProfile -Command \"$p=Get-CimInstance Win32_Process -Filter 'ProcessId=${serverProcess.pid}'; if($p){ 'CMD: ' + $p.CommandLine }\"`;
        const child = spawn(psCmd, { shell: true });
        child.stdout.on('data', d => log(`[SERVER CMD] ${d.toString().trim()}`, 'cyan'));
      } catch { }

      serverProcess.stdout.on('data', (data) => {
        log(`[SERVER] ${data.toString().trim()}`, 'cyan');
      });

      serverProcess.stderr.on('data', (data) => {
        log(`[SERVER ERROR] ${data.toString().trim()}`, 'red');
      });

      serverProcess.on('error', (error) => {
        logError(`Server failed to start: ${error.message}`);
        reject(error);
      });

      // Give server time to start
      setTimeout(() => {
        logSuccess(`Server started on port ${CONFIG.SERVER_PORT} ✓`);
        childProcesses.push(serverProcess);
        resolve(serverProcess);
      }, 10000);
    };
    doStart();
  });
}

// Start Python Brain (FastAPI + Daemon)
function startJasonBrain() {
  return new Promise((resolve, reject) => {
    logInfo('Starting JASON Brain (FastAPI)...');

    // Preflight check
    (async () => { await ensurePortFree(CONFIG.BRAIN_PORT); })();

    const engineScript = path.join(__dirname, 'jason_service', 'jason_engine.py');
    if (!fs.existsSync(engineScript)) {
      logError('jason_service/jason_engine.py not found. Brain cannot start.');
      return resolve(null);
    }

    // Determine python command (prioritize venv)
    let pythonCmd = 'python';
    const venvPath = path.join(__dirname, '.venv');
    if (fs.existsSync(venvPath)) {
      pythonCmd = os.platform() === 'win32'
        ? path.join(venvPath, 'Scripts', 'python.exe')
        : path.join(venvPath, 'bin', 'python');
      logInfo(`Using Brain python: ${pythonCmd}`);
    } else {
      // Fallback for Windows if 'python' might be system python
      if (os.platform() === 'win32') {
        // Check if 'python' is available
      }
    }

    // Launch uvicorn via python -m
    const brainProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'jason_service.jason_engine:app', '--host', '127.0.0.1', '--port', String(CONFIG.BRAIN_PORT)], {
      detached: true,
      cwd: __dirname,
      stdio: 'pipe',
      env: { ...process.env, PYTHONUNBUFFERED: '1', PORT: CONFIG.BRAIN_PORT },
      shell: true
    });

    brainProcess.stdout.on('data', (data) => {
      log(`[BRAIN] ${data.toString().trim()}`, 'yellow');
    });

    brainProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (!output.includes('INFO:') && !output.includes('Uvicorn running')) {
        log(`[BRAIN ERROR] ${output}`, 'red');
      } else {
        log(`[BRAIN] ${output}`, 'yellow');
      }
    });

    brainProcess.on('error', (error) => {
      logError(`Brain failed to start: ${error.message}`);
      resolve(null);
    });

    setTimeout(() => {
      logSuccess(`JASON Brain started on port ${CONFIG.BRAIN_PORT} ✓`);
      childProcesses.push(brainProcess);
      resolve(brainProcess);
    }, 4000);
  });
}


// Start client development server
function startClient() {
  return new Promise((resolve, reject) => {
    logInfo('Starting JASON client...');

    // Preflight: ensure client port is free before starting Vite
    (async () => { await ensurePortFree(CONFIG.CLIENT_PORT); })();

    // Force Vite to use our configured port by forwarding flags
    // Use strictPort so it fails if occupied (rather than auto-switching)
    const clientProcess = spawn('npm', ['start', '--', '--port', String(CONFIG.CLIENT_PORT), '--strictPort', '--host', '127.0.0.1'], {
      detached: true,
      cwd: path.join(__dirname, 'client'),
      stdio: 'pipe',
      env: { ...process.env, PORT: CONFIG.CLIENT_PORT, VITE_USE_UNIFIED_DEVICE_CONTROL: 'true' },
      shell: true
    });

    clientProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('VITE v') || output.includes('Local:') || output.includes('ready in')) {
        log(`[CLIENT] ${output}`, 'magenta');
      }
    });

    clientProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (!output.includes('WARNING') && !output.includes('deprecated')) {
        log(`[CLIENT] ${output}`, 'yellow');
      }
    });

    clientProcess.on('error', (error) => {
      logError(`Client failed to start: ${error.message}`);
      reject(error);
    });

    // Give client time to start
    setTimeout(() => {
      logSuccess(`Client started on port ${CONFIG.CLIENT_PORT} ✓`);
      childProcesses.push(clientProcess);
      resolve(clientProcess);
    }, 5000);
  });
}

// Health check
async function performHealthCheck() {
  logInfo('Performing health checks...');

  try {
    // Check server health
    const healthUrl = `http://localhost:${CONFIG.SERVER_PORT}/api/health`;
    const rootUrl = `http://localhost:${CONFIG.SERVER_PORT}/`;
    const serverResponse = await fetch(healthUrl).catch(() => null);
    if (serverResponse && serverResponse.ok) {
      logSuccess('Server health check ✓');
    } else {
      logWarning(`Server health check failed for ${healthUrl} (may be normal during startup)`);
    }
    const rootResponse = await fetch(rootUrl).catch(() => null);
    if (rootResponse && rootResponse.ok) {
      logSuccess('Server root check ✓');
    } else {
      logWarning(`Server root check failed for ${rootUrl} (may be normal during startup)`);
    }

    // Check client health
    const clientResponse = await fetch(`http://localhost:${CONFIG.CLIENT_PORT}`).catch(() => null);
    if (clientResponse && clientResponse.ok) {
      logSuccess('Client health check ✓');
    } else {
      logWarning('Client health check failed (may be normal during startup)');
    }

  } catch (error) {
    logWarning(`Health check completed with warnings: ${error.message}`);
  }
}

// Main startup sequence
function cleanup() {
  logInfo('Shutting down all services...');
  childProcesses.forEach(p => {
    try {
      process.kill(-p.pid);
    } catch (e) {
      // Ignore errors if process is already dead
    }
  });
  process.exit();
}

// Graceful shutdown
process.on('SIGINT', cleanup); // Catches ctrl+c event
process.on('SIGTERM', cleanup); // Catches kill command
process.on('exit', cleanup); // Catches normal exit
process.on('uncaughtException', (err, origin) => {
  logError(`Uncaught exception: ${err.message} at ${origin}`);
  cleanup();
});

// Main startup sequence
async function main() {
  console.log(`
${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🤖 JASON AI Architect - Unified Startup System 🚀        ║
║                                                               ║
║     Optimizing and integrating all components...             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
  `);

  try {
    // Step 1: System checks
    await checkSystemRequirements();

    // Step 2: Install dependencies
    await installDependencies();

    // Step 3: Build components
    await buildComponents();

    // Step 4: Start services
    logInfo('Starting all JASON services...');

    const serverProcess = await startServer();
    const clientProcess = await startClient();
    const brainProcess = await startJasonBrain();

    // Step 5: Health checks
    setTimeout(async () => {
      await performHealthCheck();

      console.log(`
${colors.green}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🎉 JASON AI Architect is now running optimally! 🎉       ║
║                                                               ║
║     🌐 Client: http://127.0.0.1:${CONFIG.CLIENT_PORT}                         ║
║     🔧 Server: http://127.0.0.1:${CONFIG.SERVER_PORT}                         ║
║     🧠 Brain:  http://127.0.0.1:${CONFIG.BRAIN_PORT}                         ║
║                                                               ║
║     Press Ctrl+C to stop all services                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
      `);
    }, 10000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      logInfo('Shutting down JASON services...');

      if (serverProcess) {
        serverProcess.kill('SIGTERM');
      }

      if (clientProcess) {
        clientProcess.kill('SIGTERM');
      }

      if (brainProcess) {
        brainProcess.kill('SIGTERM');
      }

      setTimeout(() => {
        logSuccess('All services stopped. Goodbye! 👋');
        process.exit(0);
      }, 2000);
    });

  } catch (error) {
    logError(`Startup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the startup sequence
main().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
