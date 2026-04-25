import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Directories to process
const TARGET_DIRS = ['app', 'components', 'lib', 'server', 'hooks', 'types'];
// File extensions to process
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.mjs'];

/**
 * Strips comments from the content.
 * Handles: 
 * - // single line
 * - /* multi-line * /
 * - {/* JSX * /}
 */
function stripComments(content) {
  // 1. Remove JSX comments: {/* ... */}
  let result = content.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // 2. Remove multi-line comments: /* ... */
  // We use a regex that matches /* ... */ but we have to be careful about strings.
  // For a simple script, this covers most cases.
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. Remove single-line comments: // ...
  // This regex tries to avoid URLs (http://) by ensuring // isn't preceded by :
  // It also handles the start of the line.
  const lines = result.split('\n');
  const processedLines = lines.map(line => {
    // Find // that is not part of a URL
    // We look for // that is either at the start of the line (with optional whitespace)
    // or preceded by a space/tab/semicolon/etc.
    const commentIndex = line.search(/(^|\s|[;{},])\/\/(?!\/)/);
    if (commentIndex !== -1) {
      // Check if it's likely a URL (contains ://)
      if (line.includes('://') && line.indexOf('://') === commentIndex - 1) {
        return line;
      }
      
      // Basic check: if // is inside a string (has odd number of quotes before it)
      // This is very basic but helps in many cases.
      const before = line.substring(0, commentIndex);
      const quoteCount = (before.match(/"/g) || []).length + (before.match(/'/g) || []).length;
      if (quoteCount % 2 !== 0) {
        return line;
      }

      return line.substring(0, commentIndex).trimEnd();
    }
    return line;
  });

  return processedLines.join('\n');
}

async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stripped = stripComments(content);
    
    if (content !== stripped) {
      fs.writeFileSync(filePath, stripped, 'utf8');
      console.log(`✅ Processed: ${path.relative(ROOT, filePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

async function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        await walk(fullPath);
      }
    } else if (EXTENSIONS.includes(path.extname(fullPath))) {
      await processFile(fullPath);
    }
  }
}

async function run() {
  console.log('🚀 Starting comment removal...');
  for (const dir of TARGET_DIRS) {
    const dirPath = path.join(ROOT, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📂 Scanning ${dir}...`);
      await walk(dirPath);
    }
  }
  console.log('✨ Done!');
}

run();
