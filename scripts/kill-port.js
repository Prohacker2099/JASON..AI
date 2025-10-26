#!/usr/bin/env node
const { spawn } = require('child_process');
const os = require('os');

const port = process.argv[2] ? Number(process.argv[2]) : NaN;
if (!port || isNaN(port)) {
  console.error('Usage: node scripts/kill-port.js <port>');
  process.exit(1);
}

const isWindows = os.platform() === 'win32';
if (!isWindows) {
  console.error('This script currently supports Windows only.');
  process.exit(1);
}

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: false });
    let out = '';
    let err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => resolve({ code, out, err }));
  });
}

(async () => {
  const ns = await run('cmd.exe', ['/c', 'netstat -ano -p tcp']);
  if (ns.code !== 0) {
    console.error('netstat failed', ns.err);
    process.exit(1);
  }
  const pids = new Set();
  ns.out.split(/\r?\n/).forEach(line => {
    if (line.includes(`:${port}`) && /LISTENING/i.test(line)) {
      const parts = line.trim().split(/\s+/);
      const pidStr = parts[parts.length - 1];
      const pid = parseInt(pidStr, 10);
      if (!isNaN(pid)) pids.add(pid);
    }
  });
  if (pids.size === 0) {
    console.log(`No listeners on port ${port}.`);
    return;
  }
  console.log(`Killing PIDs on port ${port}: ${Array.from(pids).join(', ')}`);
  for (const pid of pids) {
    const res = await run('cmd.exe', ['/c', `taskkill /PID ${pid} /F`]);
    process.stdout.write(res.out || '');
    process.stderr.write(res.err || '');
  }
})();
