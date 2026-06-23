const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 3005;
const ROOT_DIR = path.join(__dirname, '../../');

// 1. Create a simple static file server
const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  
  // Ensure we don't serve files outside ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    let contentType = 'text/html';
    if (filePath.endsWith('.js')) contentType = 'application/javascript';
    else if (filePath.endsWith('.jsx')) contentType = 'text/babel';
    else if (filePath.endsWith('.css')) contentType = 'text/css';
    else if (filePath.endsWith('.json')) contentType = 'application/json';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  let browser;
  try {
    // 2. Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    // Capture console messages
    page.on('console', msg => {
      // Ignore favicon.ico 404 console error if possible, or capture all
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page crashes/errors
    page.on('pageerror', err => {
      pageErrors.push(err.message);
    });

    // Capture request failures
    page.on('requestfailed', req => {
      if (!req.url().endsWith('favicon.ico')) {
        failedRequests.push(`${req.url()} (${req.failure() ? req.failure().errorText : 'failed'})`);
      }
    });

    // Capture response status != 200/304
    page.on('response', resp => {
      const status = resp.status();
      if (status >= 400 && !resp.url().endsWith('favicon.ico')) {
        failedRequests.push(`${resp.url()} (HTTP ${status})`);
      }
    });

    // Navigate to local index.html
    console.log('Navigating to http://localhost:3005/index.html...');
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait 3 seconds to let Babel compile and React render
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Page title:', await page.title());

    // Check if the login screen rendered
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasLoginText = bodyText.includes('KS Gestão') && bodyText.includes('Entrar');
    console.log('Renders login screen:', hasLoginText);

    console.log('Console errors count:', consoleErrors.length);
    console.log('Page errors count:', pageErrors.length);
    console.log('Failed requests count (excluding favicon):', failedRequests.length);

    // Ignore external assets like favicon or google fonts if they fail, but look at local files
    const localFailures = failedRequests.filter(url => url.includes('localhost'));
    console.log('Local resource failures count (excluding favicon):', localFailures.length);
    if (localFailures.length > 0) {
      console.log('Local resource failures details:', localFailures);
    }

    const success = hasLoginText && localFailures.length === 0 && pageErrors.length === 0;
    console.log('Overall render check status:', success ? 'SUCCESS' : 'FAILURE');

    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
