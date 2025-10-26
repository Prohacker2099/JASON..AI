import fs from 'fs';
import path from 'path';

export interface ImportResult {
  imported: string[];
  failed: Array<{ file: string; error: string }>;
  skipped: string[];
}

const DEFAULT_EXCLUDES = [
  'node_modules',
  'dist',
  '.git',
];

export function shouldSkip(filePath: string, extraExcludes: string[] = []): boolean {
  const bn = path.basename(filePath);
  if (bn.startsWith('_corrupted_quarantine')) return true;
  const rel = filePath.replace(/\\/g, '/');
  return [...DEFAULT_EXCLUDES, ...extraExcludes].some(ex => rel.includes(`/${ex}/`));
}

export function importAllFromDirs(baseDir: string, dirs: string[], extraExcludes: string[] = []): ImportResult {
  const result: ImportResult = { imported: [], failed: [], skipped: [] };
  const targets = dirs.map(d => path.resolve(baseDir, d));

  const walk = (dir: string) => {
    if (shouldSkip(dir, extraExcludes)) return;
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (shouldSkip(full, extraExcludes)) { result.skipped.push(full); continue; }
      if (ent.isDirectory()) { walk(full); continue; }
      if (!/\.(ts|js|mjs|cjs)$/.test(ent.name)) { result.skipped.push(full); continue; }
      try {
        // Use require to execute module side-effects; ignore default export
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(full);
        result.imported.push(full);
      } catch (e: any) {
        result.failed.push({ file: full, error: String(e?.message || e) });
      }
    }
  };

  for (const t of targets) walk(t);
  return result;
}
