const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// 1. Simple static HTTP server
const PORT = 3088;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jsx': 'text/plain', // Serve jsx files as plain text so babel standalone can fetch them
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}`);

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Catch any page console logs and errors
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    // Mock Supabase client on load so it doesn't fail
    await page.evaluateOnNewDocument(() => {
      window.supabaseClient = {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null })
            })
          })
        })
      };
      window.SUPABASE_URL = 'https://example.supabase.co';
      window.SUPABASE_KEY = 'example-key';
    });

    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0' });
    console.log('Page loaded.');

    // Wait for the bundle/React/Babel compilation to finish
    await page.waitForFunction(() => typeof window.Validacao !== 'undefined', { timeout: 10000 });
    console.log('window.Validacao is defined.');

    // Run tests on window.Validacao
    const testResults = await page.evaluate(() => {
      const results = [];
      const assert = (expr, message) => {
        results.push({ success: !!expr, message });
      };

      const V = window.Validacao;

      // 1. Required validation
      assert(V.required('test', 'Field') === null, 'required with non-empty string should be null');
      assert(V.required('  ', 'Field') !== null, 'required with whitespace should return error');
      assert(V.required('', 'Field') !== null, 'required with empty string should return error');
      assert(V.required(null, 'Field') !== null, 'required with null should return error');
      assert(V.required(undefined, 'Field') !== null, 'required with undefined should return error');

      // 2. Email validation
      assert(V.email('test@example.com') === null, 'email with valid format should be null');
      assert(V.email('invalid-email') !== null, 'email with invalid format should return error');
      assert(V.email('test@') !== null, 'email with missing domain should return error');
      assert(V.email('@domain.com') !== null, 'email with missing user should return error');

      // 3. CNPJ validation
      // Valid CNPJ: 12.345.678/0001-95 (formatted or clean)
      assert(V.cnpj('12345678000195') === null, 'cnpj clean valid should be null');
      assert(V.cnpj('12.345.678/0001-95') === null, 'cnpj formatted valid should be null');
      assert(V.cnpj('00000000000000') !== null, 'cnpj with all zeros should return error');
      assert(V.cnpj('123') !== null, 'cnpj too short should return error');
      assert(V.cnpj('12345678000190') !== null, 'cnpj invalid digits should return error');

      // 4. Valor validation
      assert(V.valor('100.50') === null, 'valor positive float should be null');
      assert(V.valor('10') === null, 'valor positive int should be null');
      assert(V.valor('-50') !== null, 'valor negative float should return error');
      assert(V.valor('0') !== null, 'valor zero should return error');
      assert(V.valor('') !== null, 'valor empty string should return error');
      assert(V.valor('abc') !== null, 'valor non-numeric should return error');

      // 5. Senha validation
      assert(V.senha('123456') === null, 'senha 6 chars should be null');
      assert(V.senha('1234567') === null, 'senha > 6 chars should be null');
      assert(V.senha('12345') !== null, 'senha < 6 chars should return error');

      // 6. Telefone validation
      assert(V.telefone('11999999999') === null, 'telefone 11 digits should be null');
      assert(V.telefone('(11) 99999-9999') === null, 'telefone formatted should be null');
      assert(V.telefone('1199999999') === null, 'telefone 10 digits should be null');
      assert(V.telefone('123') !== null, 'telefone too short should return error');
      assert(V.telefone('') === null, 'telefone empty (optional) should be null');

      // 7. CEP validation
      assert(V.cep('01311000') === null, 'cep 8 digits should be null');
      assert(V.cep('01311-000') === null, 'cep formatted should be null');
      assert(V.cep('123') !== null, 'cep too short should return error');
      assert(V.cep('') === null, 'cep empty (optional) should be null');

      return results;
    });

    console.log('--- Validacao Unit Tests ---');
    let allPassed = true;
    for (const r of testResults) {
      console.log(`${r.success ? 'PASS' : 'FAIL'}: ${r.message}`);
      if (!r.success) allPassed = false;
    }

    await browser.close();
    server.close(() => {
      console.log('Test server stopped.');
      process.exit(allPassed ? 0 : 1);
    });

  } catch (error) {
    console.error('Puppeteer verification failed:', error);
    server.close(() => {
      process.exit(1);
    });
  }
});
