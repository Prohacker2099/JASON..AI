#!/usr/bin/env node
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const root = process.cwd();
const argv = new Set(process.argv.slice(2));
const doApply = argv.has('--apply');
const previewOnly = !doApply || argv.has('--preview');
const includeSecrets = argv.has('--include-secrets');
const nowStamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
const trashDir = path.join(root, '__trash__', `cleanup-${nowStamp}`);

const IGNORE_DIRS = new Set(['node_modules', '.git', '.venv', 'dist']);

function shouldIgnoreDir(name) {
  if (name.startsWith('.git')) return true;
  return IGNORE_DIRS.has(name);
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true }).catch(() => {});
}

async function exists(p) {
  try { await fsp.access(p); return true; } catch { return false; }
}

async function walkAndCollectExtras(dir, out) {
  const ents = await fsp.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (shouldIgnoreDir(e.name)) continue;
      await walkAndCollectExtras(full, out);
    } else if (e.isFile()) {
      const lower = e.name.toLowerCase();
      if (lower.endsWith('.log') || lower.endsWith('.backup') || lower.endsWith('.original')) {
        out.add(full);
      }
    }
  }
}

async function collectJsWithTsDuplicate(baseDir, out) {
  const ents = await fsp.readdir(baseDir, { withFileTypes: true }).catch(() => []);
  for (const e of ents) {
    const full = path.join(baseDir, e.name);
    if (e.isDirectory()) {
      if (shouldIgnoreDir(e.name)) continue;
      await collectJsWithTsDuplicate(full, out);
    } else if (e.isFile()) {
      if (e.name.endsWith('.js') && !e.name.endsWith('.d.ts')) {
        const ts = full.replace(/\.js$/, '.ts');
        if (await exists(ts)) {
          out.add(full);
        }
      }
    }
  }
}

async function movePathToTrash(absPath) {
  const rel = path.relative(root, absPath);
  const dest = path.join(trashDir, rel);
  await ensureDir(path.dirname(dest));
  const stat = await fsp.lstat(absPath);
  if (stat.isDirectory()) {
    try {
      await fsp.rename(absPath, dest);
    } catch (err) {
      // cross-device move fallback
      if (fs.cp) {
        await fsp.cp(absPath, dest, { recursive: true });
      } else {
        // manual copy
        const copyRecursive = async (src, dst) => {
          const s = await fsp.lstat(src);
          if (s.isDirectory()) {
            await ensureDir(dst);
            const children = await fsp.readdir(src);
            for (const c of children) {
              await copyRecursive(path.join(src, c), path.join(dst, c));
            }
          } else {
            await ensureDir(path.dirname(dst));
            await fsp.copyFile(src, dst);
          }
        };
        await copyRecursive(absPath, dest);
      }
      await fsp.rm(absPath, { recursive: true, force: true });
    }
  } else {
    try {
      await fsp.rename(absPath, dest);
    } catch (err) {
      await fsp.copyFile(absPath, dest);
      await fsp.unlink(absPath).catch(() => {});
    }
  }
}

(async () => {
  const targets = new Set();

  // Build outputs and artifacts
  if (await exists(path.join('server', 'dist'))) targets.add(path.join(root, 'server', 'dist'));
  const pubBackup = path.join(root, 'public', 'app.js.backup');
  if (await exists(pubBackup)) targets.add(pubBackup);
  const pubOriginal = path.join(root, 'public', 'app.js.original');
  if (await exists(pubOriginal)) targets.add(pubOriginal);

  const prismaDevDb = path.join(root, 'prisma', 'dev.db');
  if (await exists(prismaDevDb)) targets.add(prismaDevDb);

  // Duplicate server/index.js when index.ts exists
  const serverIndexJs = path.join(root, 'server', 'index.js');
  const serverIndexTs = path.join(root, 'server', 'index.ts');
  if (await exists(serverIndexJs) && await exists(serverIndexTs)) targets.add(serverIndexJs);

  // Root logs and TS error reports
  for (const f of ['startup.log', 'tsc-error-files.txt', 'tsc-errors.txt', 'tsc-full.txt']) {
    const p = path.join(root, f);
    if (await exists(p)) targets.add(p);
  }

  // server __pycache__
  const pycache = path.join(root, 'server', '__pycache__');
  if (await exists(pycache)) targets.add(pycache);

  // logs directory .log files
  const logsDir = path.join(root, 'logs');
  if (await exists(logsDir)) {
    const logFiles = await fsp.readdir(logsDir).catch(() => []);
    for (const name of logFiles) {
      if (name.toLowerCase().endsWith('.log')) {
        targets.add(path.join(logsDir, name));
      }
    }
  }

  // Extras across repo (.log/.backup/.original excluding ignored dirs)
  await walkAndCollectExtras(root, targets);

  // JS with same-name TS duplicates
  for (const base of ['db', 'integrations', 'shared', 'plugins']) {
    const baseAbs = path.join(root, base);
    if (await exists(baseAbs)) {
      await collectJsWithTsDuplicate(baseAbs, targets);
    }
  }

  // Optional secrets & backups
  if (includeSecrets) {
    const backupDir = path.join(root, 'backup');
    if (await exists(backupDir)) targets.add(backupDir);
  }

  const list = Array.from(targets).sort((a,b) => a.localeCompare(b));

  if (previewOnly) {
    console.log(`PREVIEW: ${list.length} items would be moved to trash at ${trashDir}`);
    for (const p of list) console.log(p);
    process.exit(0);
  }

  if (list.length === 0) {
    console.log('Nothing to clean.');
    process.exit(0);
  }

  await ensureDir(trashDir);
  let moved = 0;
  for (const p of list) {
    await movePathToTrash(p).catch(err => {
      console.warn('Failed to move', p, err?.message || err);
    });
    moved++;
  }
  console.log(`Moved ${moved} items to ${trashDir}`);
})();
