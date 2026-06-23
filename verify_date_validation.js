const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 3099;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jsx': 'text/plain',
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

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log('[Browser Log]', msg.text()));
    page.on('pageerror', err => console.error('[Browser Error]', err.message));

    // Mock Supabase client on load
    await page.evaluateOnNewDocument(() => {
      const mockClient = {
        auth: {
          getSession: async () => ({
            data: { session: { user: { id: 'usr_123', email: 'arthur@hitchhiker.org' } } },
            error: null
          }),
          onAuthStateChange: (cb) => {
            setTimeout(() => {
              cb('SIGNED_IN', { user: { id: 'usr_123', email: 'arthur@hitchhiker.org' } });
            }, 10);
            return { data: { subscription: { unsubscribe: () => {} } } };
          }
        },
        from: (table) => {
          const builder = {
            select: () => builder,
            eq: () => builder,
            in: () => builder,
            order: () => builder,
            single: async () => {
              if (table === 'perfis') {
                return { data: { id: 'usr_123', nome: 'Arthur Dent', foto_url: null }, error: null };
              }
              if (table === 'lancamentos' && builder._lastMethod === 'insert') {
                const payload = builder._lastPayload;
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
              let responseData = [];
              if (table === 'empresas') {
                responseData = [{
                  id: 'emp_1',
                  nome: 'Guia do Mochileiro Ltda',
                  cnpj: '42.422.422/0001-42',
                  segmento: 'Turismo',
                  responsavel: 'Ford Prefect',
                  ativo: true
                }];
              } else if (table === 'portadores') {
                responseData = [
                  { id: 'port_1', nome: 'Cofre de Bordo', tipo: 'dinheiro', cor: '#fbbf24', ativo: true },
                  { id: 'port_2', nome: 'Banco de Magrathea', tipo: 'banco', cor: '#3b82f6', ativo: true }
                ];
              } else if (table === 'centros_custo') {
                responseData = [
                  { id: 'cc_1', nome: 'Combustível Estelar', tipo: 'saida', ativo: true },
                  { id: 'cc_2', nome: 'Guia de Viagens', tipo: 'entrada', ativo: true }
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
            window.__lastFunctionInvoke = { name, options };
            return { data: { success: true }, error: null };
          }
        }
      };

      Object.defineProperty(window, 'supabase', {
        get() { return { createClient: () => mockClient }; },
        set() {},
        configurable: true
      });
    });

    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0' });

    // 1. Wait for company list and click Guia do Mochileiro Ltda
    await page.waitForFunction(() => {
      const el = document.querySelector('div');
      return el && el.textContent.includes('Guia do Mochileiro Ltda');
    }, { timeout: 10000 });

    await page.evaluate(() => {
      const card = Array.from(document.querySelectorAll('div')).find(div => div.textContent.trim() === 'Guia do Mochileiro Ltda');
      card.click();
    });

    // 2. Wait for workspace to render inline form
    await page.waitForFunction(() => {
      const h3 = document.querySelector('h3');
      return h3 && h3.textContent.includes('Rápido Cadastro de Lançamento');
    }, { timeout: 10000 });

    console.log('Workspace loaded.');

    // Helper for input setting
    const setInputValue = async (labelText, value) => {
      await page.evaluate((labelTxt, val) => {
        const divs = Array.from(document.querySelectorAll('form div')).filter(div => {
          const l = div.querySelector('label');
          return l && l.textContent;
        });
        const targetDiv = divs.find(div => div.querySelector('label').textContent.includes(labelTxt));
        if (!targetDiv) throw new Error(`Field ${labelTxt} not found`);
        const input = targetDiv.querySelector('input');
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set;
        nativeInputValueSetter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }, labelText, value);
    };

    // Helper for custom select
    const setSelectValue = async (labelText, optionText) => {
      await page.evaluate(async (labelTxt, optTxt) => {
        const divs = Array.from(document.querySelectorAll('form div')).filter(div => {
          const l = div.querySelector('label');
          return l && l.textContent;
        });
        const targetDiv = divs.find(div => div.querySelector('label').textContent.includes(labelTxt));
        if (!targetDiv) throw new Error(`Field ${labelTxt} not found`);
        const trigger = targetDiv.querySelector('button.custom-select-btn');
        trigger.click();
        await new Promise(r => setTimeout(r, 50));
        const opt = Array.from(targetDiv.querySelectorAll('div button')).find(b => b.textContent.trim().toLowerCase().includes(optTxt.toLowerCase()));
        if (!opt) throw new Error(`Option ${optTxt} not found in ${labelTxt}`);
        opt.click();
        await new Promise(r => setTimeout(r, 50));
      }, labelText, optionText);
    };

    // TEST CASE 1: Inline Form empty Vencimento
    console.log('TEST CASE 1: Submitting inline form with empty Vencimento...');
    
    // Fill description and valor
    await setInputValue('Descrição', 'Lançamento Teste Data');
    await setInputValue('Valor', '150.00');
    // Set empty date
    await setInputValue('Vencimento', '');

    // Submit
    await page.evaluate(() => {
      window.__lastInsertedPayload = undefined;
      const form = document.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await new Promise(r => setTimeout(r, 300));

    // Verify Toast is error and says Vencimento é obrigatório
    const toastErrorText1 = await page.evaluate(() => {
      const toasts = Array.from(document.querySelectorAll('div')).filter(div => div.textContent.includes('Vencimento é obrigatório'));
      return toasts.length > 0 ? toasts[0].textContent : null;
    });

    const hasInsertedPayload1 = await page.evaluate(() => window.__lastInsertedPayload !== undefined);

    if (toastErrorText1 && !hasInsertedPayload1) {
      console.log('PASS: Empty Vencimento in inline form rejected successfully.');
    } else {
      throw new Error(`FAIL: Empty Vencimento in inline form was not handled correctly. Toast: ${toastErrorText1}, Inserted: ${hasInsertedPayload1}`);
    }

    // TEST CASE 2: Submit with valid date
    console.log('TEST CASE 2: Submitting inline form with valid date...');
    await setInputValue('Vencimento', '2026-06-25');
    await page.evaluate(() => {
      const form = document.querySelector('form');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    await new Promise(r => setTimeout(r, 300));

    const successToast = await page.evaluate(() => {
      const toasts = Array.from(document.querySelectorAll('div')).filter(div => div.textContent.includes('Lançamento cadastrado com sucesso!'));
      return toasts.length > 0 ? toasts[0].textContent : null;
    });

    const hasInsertedPayload2 = await page.evaluate(() => window.__lastInsertedPayload !== undefined);

    if (successToast && hasInsertedPayload2) {
      console.log('PASS: Inline form submitted successfully with valid date.');
    } else {
      throw new Error(`FAIL: Valid inline form submission failed. Toast: ${successToast}, Inserted: ${hasInsertedPayload2}`);
    }

    // TEST CASE 3: Modal form validation (clear date during edit)
    console.log('TEST CASE 3: Editing launch and clearing date in modal...');
    // Click edit button in the table row
    await page.evaluate(() => {
      const editBtn = document.querySelector('table tbody tr button[title="Editar"]');
      if (!editBtn) throw new Error('Edit button not found in row');
      editBtn.click();
    });

    // Wait for LancamentoFormModal to appear
    await page.waitForFunction(() => {
      const title = document.querySelector('div');
      return title && title.textContent.includes('Editar Lançamento');
    }, { timeout: 5000 });

    // Set empty Vencimento in modal
    await page.evaluate(() => {
      const modalHeader = Array.from(document.querySelectorAll('div')).find(div => div.textContent.trim() === 'Editar Lançamento');
      const modal = modalHeader.closest('div[style*="box-shadow"]') || modalHeader.parentElement.parentElement;
      const vencInput = modal.querySelector('input[type="date"]');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      nativeInputValueSetter.call(vencInput, '');
      vencInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Click "Salvar" button in modal
    await page.evaluate(() => {
      const modalHeader = Array.from(document.querySelectorAll('div')).find(div => div.textContent.trim() === 'Editar Lançamento');
      const modal = modalHeader.closest('div[style*="box-shadow"]') || modalHeader.parentElement.parentElement;
      const btns = Array.from(modal.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent.includes('Salvar'));
      saveBtn.click();
    });

    await new Promise(r => setTimeout(r, 300));

    // Verify toast error and modal still open
    const toastErrorText3 = await page.evaluate(() => {
      const toasts = Array.from(document.querySelectorAll('div')).filter(div => div.textContent.includes('Vencimento é obrigatório'));
      return toasts.length > 0 ? toasts[0].textContent : null;
    });

    const isModalStillOpen = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div')).some(div => div.textContent.trim() === 'Editar Lançamento');
    });

    if (toastErrorText3 && isModalStillOpen) {
      console.log('PASS: Empty Vencimento in Edit modal rejected successfully.');
    } else {
      throw new Error(`FAIL: Empty Vencimento in Edit modal was not handled correctly. Toast: ${toastErrorText3}, Modal open: ${isModalStillOpen}`);
    }

    // Close the Edit modal
    await page.evaluate(() => {
      const modalHeader = Array.from(document.querySelectorAll('div')).find(div => div.textContent.trim() === 'Editar Lançamento');
      const modal = modalHeader.closest('div[style*="box-shadow"]') || modalHeader.parentElement.parentElement;
      const cancelBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Cancelar'));
      cancelBtn.click();
    });

    await new Promise(r => setTimeout(r, 200));

    // TEST CASE 4: PagamentoModal validation (clear date during confirmation)
    console.log('TEST CASE 4: Clearing payment date in PagamentoModal...');
    // Click "Pagar" button in table row
    await page.evaluate(() => {
      const pagarBtn = Array.from(document.querySelectorAll('table tbody tr button')).find(b => b.textContent.includes('Pagar'));
      if (!pagarBtn) throw new Error('Pagar button not found');
      pagarBtn.click();
    });

    // Wait for PagamentoModal to render
    await page.waitForFunction(() => {
      const title = document.querySelector('div');
      return title && title.textContent.includes('Confirmar Pagamento');
    }, { timeout: 5000 });

    // Clear payment date input
    await page.evaluate(() => {
      const modalHeader = Array.from(document.querySelectorAll('div')).find(div => div.textContent.trim() === 'Confirmar Pagamento');
      const modal = modalHeader.closest('div[style*="box-shadow"]') || modalHeader.parentElement.parentElement;
      const dateInput = modal.querySelector('input[type="date"]');
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      nativeInputValueSetter.call(dateInput, '');
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Click "Confirmar Pagamento" button
    await page.evaluate(() => {
      const modalHeader = Array.from(document.querySelectorAll('div')).find(div => div.textContent.trim() === 'Confirmar Pagamento');
      const modal = modalHeader.closest('div[style*="box-shadow"]') || modalHeader.parentElement.parentElement;
      const confirmBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Confirmar Pagamento'));
      confirmBtn.click();
    });

    await new Promise(r => setTimeout(r, 300));

    // Verify toast error and PagamentoModal still open
    const toastErrorText4 = await page.evaluate(() => {
      const toasts = Array.from(document.querySelectorAll('div')).filter(div => div.textContent.includes('Data é obrigatória') || div.textContent.includes('Data é obrigatório'));
      return toasts.length > 0 ? toasts[0].textContent : null;
    });

    const isPgtoModalStillOpen = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('div')).some(div => div.textContent.trim() === 'Confirmar Pagamento');
    });

    if (toastErrorText4 && isPgtoModalStillOpen) {
      console.log('PASS: Empty payment date in PagamentoModal rejected successfully.');
    } else {
      throw new Error(`FAIL: Empty payment date in PagamentoModal was not handled correctly. Toast: ${toastErrorText4}, Modal open: ${isPgtoModalStillOpen}`);
    }

    await browser.close();
    server.close(() => {
      console.log('All date validation tests passed successfully!');
      process.exit(0);
    });

  } catch (error) {
    console.error('Test execution failed:', error.message);
    if (browser) await browser.close();
    server.close(() => {
      process.exit(1);
    });
  }
});
