const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const JSXParser = acorn.Parser.extend(jsx());

const files = [
  'app.jsx',
  'central.jsx',
  'data.jsx',
  'hooks.jsx',
  'reports.jsx',
  'settings.jsx',
  'supabase.jsx',
  'tweaks-panel.jsx',
  'ui.jsx',
  'workspace.jsx',
  'xlsx-export.jsx'
];

let hasErrors = false;
files.forEach(file => {
  const filePath = path.join(__dirname, '../../', file);
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    JSXParser.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    console.log(`[PASS] ${file}`);
  } catch (err) {
    console.error(`[FAIL] ${file}: ${err.message}`);
    hasErrors = true;
  }
});

process.exit(hasErrors ? 1 : 0);
