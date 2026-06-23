const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const JSXParser = acorn.Parser.extend(jsx());

const files = ['app.jsx', 'settings.jsx', 'workspace.jsx', 'ui.jsx', 'central.jsx', 'reports.jsx', 'hooks.jsx', 'data.jsx', 'supabase.jsx', 'xlsx-export.jsx', 'tweaks-panel.jsx'];

let allOk = true;
for (const file of files) {
  try {
    const code = fs.readFileSync(file, 'utf-8');
    JSXParser.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
    console.log(`PASS: ${file} parsed successfully.`);
  } catch (err) {
    console.error(`FAIL: ${file} failed to parse:`, err.message);
    allOk = false;
  }
}

if (!allOk) {
  process.exit(1);
} else {
  console.log('All JSX files parsed successfully.');
  process.exit(0);
}
