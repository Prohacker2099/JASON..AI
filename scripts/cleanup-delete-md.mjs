#!/usr/bin/env node
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const mode = args.has('--delete') ? 'delete' : (args.has('--trash') ? 'trash' : 'delete');
const dryRun = args.has('--dry-run');
const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
const trashBase = path.join(root, '__trash__', `md-${stamp}`);
const IGNORE_DIRS = new Set(['node_modules', '.venv', 'dist', 'build']);

function shouldIgnoreDir(dirName) {
  return IGNORE_DIRS.has(dirName) || dirName.startsWith('.git');
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true }).catch(() => {});
}

async function walk(dir, out) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (shouldIgnoreDir(e.name)) continue;
      await walk(full, out);
    } else if (e.isFile()) {
      const lower = e.name.toLowerCase();
      if (lower.endsWith('.md')) out.push(full);
    }
  }
}

async function moveToTrash(files) {
  let moved = 0;
  for (const file of files) {
    const rel = path.relative(root, file);
    const dest = path.join(trashBase, rel);
    if (!dryRun) {
      await ensureDir(path.dirname(dest));
      await fsp.rename(file, dest).catch(async (err) => {
        if (err && err.code === 'EXDEV') {
          const data = await fsp.readFile(file);
          await fsp.writeFile(dest, data);
          await fsp.unlink(file);
        } else {
          throw err;
        }
      });
    }
    moved++;
  }
  return moved;
}

async function deleteAll(files) {
  let deleted = 0;
  for (const file of files) {
    if (!dryRun) {
      await fsp.unlink(file).catch(() => {});
    }
    deleted++;
  }
  return deleted;
}

(async () => {
  const targets = [];
  await walk(root, targets);
  if (targets.length === 0) {
    console.log('No Markdown files found.');
    return;
  }
  if (mode === 'trash') {
    await ensureDir(trashBase);
    const n = await moveToTrash(targets);
    console.log(`Moved ${n} Markdown files to ${trashBase}`);
  } else {
    const n = await deleteAll(targets);
    console.log(`Deleted ${n} Markdown files.`);
  }
})();
