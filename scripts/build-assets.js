const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function minifyCss(source) {
  return source
    .replace(/\/\*(?!\!)[\s\S]*?\*\//g, '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*,\s*/g, ',')
    .replace(/;}/g, '}')
    .trim();
}

function buildCss(inputFile, outputFile) {
  const inputPath = path.join(ROOT, inputFile);
  const outputPath = path.join(ROOT, outputFile);
  const input = fs.readFileSync(inputPath, 'utf8');
  const output = minifyCss(input);
  fs.writeFileSync(outputPath, `${output}\n`, 'utf8');
  console.log(`Built CSS: ${outputFile}`);
}

function buildJs(inputFile, outputFile) {
  try {
    execFileSync(
      'terser',
      [inputFile, '--compress', '--mangle', '--comments', 'false', '-o', outputFile],
      { cwd: ROOT, stdio: 'inherit' },
    );
  } catch (error) {
    console.error('Failed to run terser. Ensure terser is installed and available in PATH.');
    throw error;
  }

  execFileSync(process.execPath, ['--check', outputFile], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  console.log(`Built JS: ${outputFile}`);
}

function run() {
  buildJs('app/app.js', 'app/app.min.js');
  buildCss('app/app.css', 'app/app.min.css');
  buildCss('landing.css', 'landing.min.css');
  console.log('Build complete.');
}

run();
