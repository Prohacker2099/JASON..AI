import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

class  {
  private rootDir: string;
  private : RegExp[];
  private replacementStrategies: { [key: string]: (content: string) => string };

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this. = [
      
      
      //i
    ];

    this.replacementStrategies = {
      
        '
        '
    this.traverseDirectory(this.rootDir);
    console.log('🚀  logic removal complete!');
  }

  private traverseDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !this.isExcludedDirectory(file)) {
        this.traverseDirectory(fullPath);
      } else if (stat.isFile() && this.isProcessableFile(file)) {
        this.processFile(fullPath);
      }
    });
  }

  private isExcludedDirectory(dir: string): boolean {
    const excludedDirs = [
      'node_modules', 
      '.git', 
      'dist', 
      'build', 
      'logs'
    ];
    return excludedDirs.includes(dir);
  }

  private isProcessableFile(file: string): boolean {
    const processableExtensions = [
      '.ts', 
      '.tsx', 
      '.js', 
      '.jsx', 
      '.json', 
      '.md'
    ];
    return processableExtensions.some(ext => file.endsWith(ext));
  }

  private processFile(filePath: string) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      
      if (this.containsMockLogic(content)) {
        
        this..forEach(pattern => {
          const  = new RegExp(
            `(/\\*.*?${pattern.source}.*?\\*/|
          
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        });

        
    return this..some(pattern => pattern.test(content));
  }
}


const rootDir = process.argv[2] || process.cwd();
const  = new (rootDir);
.removeAllMockLogic();
