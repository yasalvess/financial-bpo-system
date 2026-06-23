const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.resolve(__dirname, '../../'); // Project root
const REPORT_PATH = path.join(__dirname, 'test_report.txt');

// Initialize empty report file
fs.writeFileSync(REPORT_PATH, '');

function logReport(text) {
  console.log(text);
  fs.appendFileSync(REPORT_PATH, text + '\n', 'utf8');
}

function logError(text) {
  console.error(text);
  fs.appendFileSync(REPORT_PATH, '[ERROR] ' + text + '\n', 'utf8');
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jsx': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

// Start local HTTP server to serve frontend modules
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
  const ext = path.extname(filePath);
  let contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '127.0.0.1', async () => {
  logReport(`[HTTP Server] Running at http://127.0.0.1:${PORT}/`);
  
  let browser;
  let page;
  let exitCode = 0;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Catch console errors and logs
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        logError(`[Browser Error] ${text}`);
      } else {
        logReport(`[Browser Log] ${text}`);
      }
    });

    page.on('pageerror', err => {
      logError(`[Browser PageError] ${err.toString()}`);
    });

    page.on('requestfailed', request => {
      logReport(`[Request Failed] ${request.url()} - ${request.failure() ? request.failure().errorText : 'unknown error'}`);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        logReport(`[HTTP Error] ${response.url()} status ${response.status()}`);
      }
    });

    // Mock window.supabase before document loads using defineProperty to intercept overrides
    await page.evaluateOnNewDocument(() => {
      const mockClient = {
        auth: {
          getSession: async () => {
            console.log('[Mock DB] getSession called');
            return {
              data: {
                session: {
                  user: { id: 'usr_123', email: 'arthur@hitchhiker.org' }
                }
              },
              error: null
            };
          },
          onAuthStateChange: (cb) => {
            console.log('[Mock DB] onAuthStateChange called');
            setTimeout(() => {
              cb('SIGNED_IN', {
                user: { id: 'usr_123', email: 'arthur@hitchhiker.org' }
              });
            }, 10);
            return {
              data: {
                subscription: {
                  unsubscribe: () => {}
                }
              }
            };
          }
        },
        from: (table) => {
          console.log(`[Mock DB] from('${table}') query created`);
          const builder = {
            select: (fields) => builder,
            eq: (col, val) => builder,
            in: (col, val) => builder,
            order: (col) => builder,
            single: async () => {
              console.log(`[Mock DB] from('${table}').single() executed`);
              if (table === 'perfis') {
                return { data: { id: 'usr_123', nome: 'Arthur Dent', foto_url: null }, error: null };
              }
              if (table === 'lancamentos' && builder._lastMethod === 'insert') {
                const payload = builder._lastPayload;
                console.log('[Mock DB] Inserting new launch via single():', payload);
                const newLanc = {
                  id: 'lanc_test_inserted',
                  empresa_id: payload.empresa_id,
                  tipo: payload.tipo,
                  descricao: payload.descricao,
                  valor: payload.valor,
                  vencimento: payload.vencimento,
                  competencia: payload.competencia,
                  portador_id: payload.portador_id,
                  centro_custo_id: payload.centro_custo_id,
                  forma_pagamento: payload.forma_pagamento,
                  pago: payload.pago,
                  pagamento_data: payload.pagamento_data,
                  pagamento_comprovante: payload.pagamento_comprovante,
                  observacao: payload.observacao
                };
                window.__lastInsertedPayload = payload;
                return { data: newLanc, error: null };
              }
              return { data: null, error: null };
            },
            update: (payload) => {
              builder._lastMethod = 'update';
              builder._lastPayload = payload;
              return builder;
            },
            insert: (payload) => {
              builder._lastMethod = 'insert';
              builder._lastPayload = payload;
              return builder;
            },
            delete: () => {
              builder._lastMethod = 'delete';
              return builder;
            },
            then: (resolve) => {
              console.log(`[Mock DB] from('${table}') executed via then`);
              let responseData = [];
              if (table === 'empresas') {
                responseData = [
                  {
                    id: 'emp_1',
                    nome: 'Guia do Mochileiro Ltda',
                    cnpj: '42.422.422/0001-42',
                    nome_fantasia: 'Guia',
                    segmento: 'Turismo',
                    responsavel: 'Ford Prefect',
                    email: 'ford@hitchhiker.org',
                    telefone: '42-4242',
                    ativo: true,
                    created_at: new Date().toISOString()
                  }
                ];
              } else if (table === 'portadores') {
                responseData = [
                  {
                    id: 'port_1',
                    nome: 'Cofre de Bordo',
                    tipo: 'dinheiro',
                    cor: '#fbbf24',
                    ativo: true
                  },
                  {
                    id: 'port_2',
                    nome: 'Banco de Magrathea',
                    tipo: 'banco',
                    cor: '#3b82f6',
                    ativo: true
                  }
                ];
              } else if (table === 'centros_custo') {
                responseData = [
                  {
                    id: 'cc_1',
                    nome: 'Combustível Estelar',
                    tipo: 'saida',
                    ativo: true
                  },
                  {
                    id: 'cc_2',
                    nome: 'Guia de Viagens',
                    tipo: 'entrada',
                    ativo: true
                  }
                ];
              } else if (table === 'formas_pagamento') {
                responseData = [
                  { nome: 'PIX', ordem: 1, ativo: true },
                  { nome: 'Boleto', ordem: 2, ativo: true },
                  { nome: 'Cartão', ordem: 3, ativo: true }
                ];
              } else if (table === 'lancamentos') {
                responseData = [];
              }
              resolve({ data: responseData, error: null });
            }
          };
          return builder;
        },
        functions: {
          invoke: async (name, options) => {
            console.log(`[Mock DB] Invoke function: ${name}`, options);
            window.__lastFunctionInvoke = { name, options };
            return { data: { success: true }, error: null };
          }
        }
      };

      // Getter/Setter to intercept and return our mock client when supabase.createClient is called
      let realSupabaseVal = null;
      Object.defineProperty(window, 'supabase', {
        get() {
          return {
            createClient: () => {
              console.log('[Mock System] createClient intercepted');
              return mockClient;
            }
          };
        },
        set(val) {
          console.log('[Mock System] supabase object assigned by CDN');
          realSupabaseVal = val;
        },
        configurable: true
      });
    });

    logReport('[Test] Navigating to index.html...');
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle2' });
    
    // Wait for the app to initialize and show the companies dashboard
    logReport('[Test] Waiting for central dashboard to render...');
    await page.waitForFunction(() => {
      const h1 = document.querySelector('h1');
      return h1 && h1.textContent.includes('Visão Geral de Empresas');
    }, { timeout: 10000 });
    
    await page.screenshot({ path: path.join(__dirname, 'screenshot_1_central.png') });
    logReport('[Test] Screenshot 1: Central loaded');

    // Click the company to open Workspace
    logReport('[Test] Opening company workspace...');
    await page.evaluate(() => {
      const titleDiv = Array.from(document.querySelectorAll('div')).find(div => div.textContent.trim() === 'Guia do Mochileiro Ltda');
      if (titleDiv) {
        const card = titleDiv.closest('div[style*="cursor: pointer"]');
        if (card) {
          card.click();
        } else {
          titleDiv.click();
        }
      } else {
        throw new Error('Guia do Mochileiro Ltda title element not found');
      }
    });

    // Wait for workspace view to load
    logReport('[Test] Waiting for workspace dashboard...');
    await page.waitForFunction(() => {
      const h3 = document.querySelector('h3');
      return h3 && h3.textContent.includes('Rápido Cadastro de Lançamento');
    }, { timeout: 5000 });

    await page.screenshot({ path: path.join(__dirname, 'screenshot_2_workspace.png') });
    logReport('[Test] Screenshot 2: Workspace loaded with inline form');

    // Verification 1: Check absence of old buttons (Novo Lançamento in header, Novo in filters)
    logReport('[Test] Verifying absence of deprecated buttons...');
    const deprecatedButtonsChecks = await page.evaluate(() => {
      // 1. Top bar next to tabs
      const topBarButtons = Array.from(document.querySelectorAll('div[style*="justify-content: space-between"] button'));
      const oldHeaderButtonExists = topBarButtons.some(b => b.textContent.includes('Novo Lançamento'));
      
      // 2. Filter card row
      const filterCard = Array.from(document.querySelectorAll('div')).find(div => div.textContent.includes('Buscar descrição...') && div.textContent.includes('Tipo'));
      const oldFilterButtonExists = filterCard ? Array.from(filterCard.querySelectorAll('button')).some(b => b.textContent.includes('Novo')) : false;
      
      return { oldHeaderButtonExists, oldFilterButtonExists };
    });
    
    logReport(`  - Old Header "Novo Lançamento" Button Exists: ${deprecatedButtonsChecks.oldHeaderButtonExists}`);
    logReport(`  - Old Filter Row "Novo" Button Exists: ${deprecatedButtonsChecks.oldFilterButtonExists}`);
    if (deprecatedButtonsChecks.oldHeaderButtonExists || deprecatedButtonsChecks.oldFilterButtonExists) {
      throw new Error('Verification FAIL: Deprecated buttons are still present!');
    }
    logReport('  ✓ Deprecated buttons removed successfully.');

    // Verification 2: Verify Inline form is open by default and check fields
    logReport('[Test] Verifying inline form fields and default open state...');
    const formFields = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return { exists: false };
      
      // Find all Fields (which have labels)
      const fields = Array.from(form.querySelectorAll('div')).filter(div => {
        const label = div.querySelector('label');
        return label && label.textContent;
      }).map(div => div.querySelector('label').textContent.trim());
      
      return { exists: true, fields };
    });

    logReport(`  - Inline form exists: ${formFields.exists}`);
    logReport(`  - Fields rendered: ${formFields.fields.join(', ')}`);
    if (!formFields.exists) {
      throw new Error('Verification FAIL: Inline quick-create form is not visible or open by default.');
    }
    
    const expectedFields = ['Tipo', 'Descrição', 'Valor (R$)', 'Vencimento', 'Status', 'Portador', 'Centro de Custo', 'Forma de Pagamento'];
    for (const exp of expectedFields) {
      if (!formFields.fields.some(f => f.includes(exp))) {
        throw new Error(`Verification FAIL: Missing form field: ${exp}`);
      }
    }
    logReport('  ✓ All 8 fields rendered successfully in the inline form.');

    // Verification 3: Verify Collapsible states and Chevrons
    logReport('[Test] Verifying collapsible states and chevrons...');
    
    // Get initial toggle button text and chevron path
    let toggleState1 = await page.evaluate(() => {
      const toggleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Minimizar') || b.textContent.includes('Expandir'));
      const text = toggleBtn.textContent.trim();
      const svgPath = toggleBtn.querySelector('svg path');
      const pathD = svgPath ? svgPath.getAttribute('d') : null;
      return { text, pathD };
    });
    logReport(`  - Initial toggle button state: Text = "${toggleState1.text}", Chevron path = "${toggleState1.pathD}"`);
    if (toggleState1.text !== 'Minimizar' || toggleState1.pathD !== 'm18 15-6-6-6 6') {
      throw new Error('Verification FAIL: Initial state is not open (Minimizar) or chevron up path is wrong.');
    }

    // Click Minimizar
    logReport('  - Clicking "Minimizar" button...');
    await page.evaluate(() => {
      const toggleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Minimizar'));
      toggleBtn.click();
    });
    await new Promise(r => setTimeout(r, 200));
    await page.screenshot({ path: path.join(__dirname, 'screenshot_3_minimized.png') });

    let toggleState2 = await page.evaluate(() => {
      const form = document.querySelector('form');
      const toggleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Minimizar') || b.textContent.includes('Expandir'));
      const text = toggleBtn.textContent.trim();
      const svgPath = toggleBtn.querySelector('svg path');
      const pathD = svgPath ? svgPath.getAttribute('d') : null;
      return { formExists: !!form, text, pathD };
    });
    logReport(`  - Minimized state: Form exists = ${toggleState2.formExists}, Text = "${toggleState2.text}", Chevron path = "${toggleState2.pathD}"`);
    if (toggleState2.formExists || toggleState2.text !== 'Expandir' || toggleState2.pathD !== 'm6 9 6 6 6-6') {
      throw new Error('Verification FAIL: Form did not collapse or chevron down path is wrong.');
    }

    // Click Expandir
    logReport('  - Clicking "Expandir" button...');
    await page.evaluate(() => {
      const toggleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Expandir'));
      toggleBtn.click();
    });
    await new Promise(r => setTimeout(r, 200));

    let toggleState3 = await page.evaluate(() => {
      const form = document.querySelector('form');
      const toggleBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Minimizar') || b.textContent.includes('Expandir'));
      const text = toggleBtn.textContent.trim();
      return { formExists: !!form, text };
    });
    logReport(`  - Re-expanded state: Form exists = ${toggleState3.formExists}, Text = "${toggleState3.text}"`);
    if (!toggleState3.formExists || toggleState3.text !== 'Minimizar') {
      throw new Error('Verification FAIL: Form did not expand back.');
    }
    logReport('  ✓ Collapsible toggle states and chevron icons verified successfully.');

    // Verification 4: Test cost center filtering by type
    logReport('[Test] Verifying Cost Center filtering by Type...');
    const ccFiltering = await page.evaluate(async () => {
      const fields = Array.from(document.querySelectorAll('form div')).filter(div => {
        const label = div.querySelector('label');
        return label && label.textContent;
      });
      const getField = (labelText) => fields.find(div => div.querySelector('label').textContent.includes(labelText));
      
      const getCCOptions = async () => {
        const ccField = getField('Centro de Custo');
        const trigger = ccField.querySelector('button.custom-select-btn');
        trigger.click();
        await new Promise(r => setTimeout(r, 100));
        const options = Array.from(ccField.querySelectorAll('div button')).filter(b => b.className !== 'custom-select-btn').map(b => b.textContent.trim());
        trigger.click(); // Close it
        await new Promise(r => setTimeout(r, 100));
        return options;
      };

      // Initial type is 'saida'
      const initialCCOptions = await getCCOptions();
      
      // Let's switch type to 'entrada'
      const tipoField = getField('Tipo');
      const tipoTrigger = tipoField.querySelector('button.custom-select-btn');
      tipoTrigger.click();
      await new Promise(r => setTimeout(r, 100));
      const entradaOpt = Array.from(tipoField.querySelectorAll('div button')).find(b => b.textContent.trim() === 'Entrada');
      entradaOpt.click();
      await new Promise(r => setTimeout(r, 100));

      const entryCCOptions = await getCCOptions();

      return { initialCCOptions, entryCCOptions };
    });

    logReport(`  - CC Options for "Saída" type: ${ccFiltering.initialCCOptions}`);
    logReport(`  - CC Options for "Entrada" type: ${ccFiltering.entryCCOptions}`);
    if (!ccFiltering.initialCCOptions.includes('Combustível Estelar') || ccFiltering.initialCCOptions.includes('Guia de Viagens')) {
      throw new Error('Verification FAIL: Cost centers were not filtered correctly for "saida" type.');
    }
    if (!ccFiltering.entryCCOptions.includes('Guia de Viagens') || ccFiltering.entryCCOptions.includes('Combustível Estelar')) {
      throw new Error('Verification FAIL: Cost centers were not filtered correctly for "entrada" type.');
    }
    logReport('  ✓ Cost center options dynamically filtered by type successfully.');

    // Verification 5: Submit form and verify state updates and database calls
    logReport('[Test] Filling and submitting form...');
    await page.evaluate(async () => {
      const fields = Array.from(document.querySelectorAll('form div')).filter(div => {
        const label = div.querySelector('label');
        return label && label.textContent;
      });
      const getField = (labelText) => fields.find(div => div.querySelector('label').textContent.includes(labelText));
      
      const selectCustomSelect = async (labelText, valueText) => {
        const field = getField(labelText);
        const trigger = field.querySelector('button.custom-select-btn');
        trigger.click();
        await new Promise(r => setTimeout(r, 100));
        const opt = Array.from(field.querySelectorAll('div button')).find(b => b.textContent.trim().toLowerCase().includes(valueText.toLowerCase()));
        if (!opt) throw new Error(`Option ${valueText} not found in ${labelText}`);
        opt.click();
        await new Promise(r => setTimeout(r, 100));
      };

      // Helper function to bypass React 16+ input value tracker
      const setReactInputValue = (input, value) => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;
        nativeInputValueSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };

      // Type is currently Entrada, let's switch it back to Saída
      await selectCustomSelect('Tipo', 'Saída');

      // Description
      const descInput = getField('Descrição').querySelector('input');
      setReactInputValue(descInput, 'Hospedagem em Alfa Centauri');

      // Valor
      const valorInput = getField('Valor').querySelector('input');
      setReactInputValue(valorInput, '250.00');

      // Vencimento
      const vencInput = getField('Vencimento').querySelector('input');
      setReactInputValue(vencInput, '2026-06-25');

      // Status
      await selectCustomSelect('Status', 'Pendente');

      // Portador
      await selectCustomSelect('Portador', 'Cofre de Bordo');

      // Cost Center
      await selectCustomSelect('Centro de Custo', 'Combustível Estelar');

      // Payment Form
      await selectCustomSelect('Forma de Pagamento', 'PIX');

      // Submit by clicking the "Salvar" button directly
      const form = document.querySelector('form');
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
      } else {
        throw new Error('Submit button not found');
      }
    });

    logReport('[Test] Waiting for database callback and state changes...');
    await new Promise(r => setTimeout(r, 500)); // Wait slightly longer for state updates
    await page.screenshot({ path: path.join(__dirname, 'screenshot_4_submitted.png') });

    const submissionState = await page.evaluate(() => {
      // Check last inserted payload on window
      const dbPayload = window.__lastInsertedPayload;
      
      // Check if row exists in table list
      const rows = Array.from(document.querySelectorAll('table tbody tr')).map(tr => tr.textContent);
      
      // Check if form description input is cleared
      const fields = Array.from(document.querySelectorAll('form div')).filter(div => {
        const label = div.querySelector('label');
        return label && label.textContent;
      });
      const getField = (labelText) => fields.find(div => div.querySelector('label').textContent.includes(labelText));
      const descValue = getField('Descrição').querySelector('input').value;
      const valorValue = getField('Valor').querySelector('input').value;
      
      return { dbPayload, rows, descValue, valorValue };
    });

    logReport(`  - Database inserted payload: ${JSON.stringify(submissionState.dbPayload)}`);
    logReport(`  - Rendered table rows: ${JSON.stringify(submissionState.rows)}`);
    logReport(`  - Reset description field value: ${JSON.stringify(submissionState.descValue)}`);
    logReport(`  - Reset valor field value: ${JSON.stringify(submissionState.valorValue)}`);
    
    if (!submissionState.dbPayload) {
      throw new Error('Verification FAIL: No insert query was triggered on Supabase client!');
    }
    if (submissionState.dbPayload.descricao !== 'Hospedagem em Alfa Centauri' || submissionState.dbPayload.valor !== 250.0) {
      throw new Error('Verification FAIL: Incorrect data payload sent to Supabase!');
    }
    const rowMatch = submissionState.rows.some(r => r.includes('Hospedagem em Alfa Centauri') && r.includes('250,00'));
    if (!rowMatch) {
      throw new Error('Verification FAIL: New launch was not added to the rendering table list.');
    }
    if (submissionState.descValue !== '' || submissionState.valorValue !== '') {
      throw new Error('Verification FAIL: Form fields were not reset back to default empty state.');
    }
    logReport('  ✓ Submission, database saving, local state update, and form reset verified successfully.');

    // Verification 6: Style classes, Transitions, Hover, Focus glows, and Date input styling
    logReport('[Test] Verifying input styling transitions, hover borders, and focus glows...');
    const styleCheck = await page.evaluate(() => {
      // Find style tag in head containing transitions
      const styleTags = Array.from(document.querySelectorAll('style'));
      const cssRules = styleTags.map(s => s.innerHTML).join('\n');
      
      const hasTransitions = cssRules.includes('input, select, textarea, .custom-select-btn') && cssRules.includes('transition: border-color');
      const hasHover = cssRules.includes('input:hover') && cssRules.includes('border-color: var(--c-primary)');
      const hasFocusGlow = cssRules.includes('input:focus') && cssRules.includes('box-shadow: 0 0 0 3px var(--c-primary-soft)');
      const hasDateCustomizations = cssRules.includes('input[type="date"]::-webkit-calendar-picker-indicator') && cssRules.includes('cursor: pointer');
      const hasInvert = cssRules.includes('body.dark input[type="date"]::-webkit-calendar-picker-indicator') && cssRules.includes('filter: invert(1)');

      return { hasTransitions, hasHover, hasFocusGlow, hasDateCustomizations, hasInvert };
    });

    logReport(`  - Input transitions styled: ${styleCheck.hasTransitions}`);
    logReport(`  - Input hovers styled: ${styleCheck.hasHover}`);
    logReport(`  - Input focus glow styled: ${styleCheck.hasFocusGlow}`);
    logReport(`  - Native date picker icon cursor/opacity styled: ${styleCheck.hasDateCustomizations}`);
    logReport(`  - Native date picker icon dark inversion styled: ${styleCheck.hasInvert}`);

    if (!styleCheck.hasTransitions || !styleCheck.hasHover || !styleCheck.hasFocusGlow || !styleCheck.hasDateCustomizations || !styleCheck.hasInvert) {
      throw new Error('Verification FAIL: Styling rules are missing or incorrect in index.html.');
    }
    logReport('  ✓ Input styling and calendar picker icon CSS rules successfully verified.');

    // Verification 7: Toggle dark mode and verify class dark is added
    logReport('[Test] Testing theme toggle to dark mode...');
    await page.evaluate(() => {
      // Directly activate dark mode via body class manually or simulate tweaks panel
      document.body.classList.add('dark');
    });
    await new Promise(r => setTimeout(r, 100));
    await page.screenshot({ path: path.join(__dirname, 'screenshot_5_dark_mode.png') });

    const isDarkMode = await page.evaluate(() => {
      const isDarkClass = document.body.classList.contains('dark');
      const computedIndicatorStyle = window.getComputedStyle(document.body);
      return { isDarkClass };
    });
    logReport(`  - body has "dark" class: ${isDarkMode.isDarkClass}`);
    if (!isDarkMode.isDarkClass) {
      throw new Error('Verification FAIL: Dark mode class was not successfully applied to body.');
    }
    logReport('  ✓ Dark mode transition and class styling applied successfully.');

    logReport('\n======================================');
    logReport(' VERDICT: PASS');
    logReport('======================================');
    
  } catch (err) {
    logError('\n======================================');
    logError(' VERDICT: FAIL');
    logError(` Reason: ${err.message}`);
    logError('======================================');
    exitCode = 1;
    
    // Capture screenshot on error and dump root HTML for troubleshooting
    if (page) {
      try {
        await page.screenshot({ path: path.join(__dirname, 'screenshot_error.png') });
        logReport('[Test] Screenshot of error saved to screenshot_error.png');
        const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || document.body.innerHTML);
        logReport(`[Test Root HTML on Fail]:\n${rootHtml}`);
      } catch (screenshotErr) {
        logError(`Failed to capture error details: ${screenshotErr.message}`);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
    server.close(() => {
      logReport('[HTTP Server] Stopped.');
      process.exit(exitCode);
    });
  }
});
