const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const Parser = acorn.Parser.extend(jsx());

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
].map(f => path.join(__dirname, '../../', f));

let hasErrors = false;

files.forEach(file => {
  console.log(`Parsing ${path.basename(file)}...`);
  try {
    const code = fs.readFileSync(file, 'utf8');
    Parser.parse(code, {
      ecmaVersion: 2020,
      sourceType: 'module'
    });
    console.log(`✓ ${path.basename(file)} is syntactically valid.`);
  } catch (err) {
    console.error(`✗ Error in ${path.basename(file)}:`, err.message);
    hasErrors = true;
  }
});

process.exit(hasErrors ? 1 : 0);
