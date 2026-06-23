# Handoff Report: Form Validation Exploration (Explorer 2)

## 1. Observation
We observed that the system contains several form and dialog components that perform data modifications and submit records to Supabase. Below are the specific findings and file references.

### A. The `Validacao` Object Definition
The validation logic is centralized in the `ui.jsx` file, which is loaded early in `index.html` (line 143), making it globally available to the application.
- **Location**: `ui.jsx` (lines 489–516)
- **Verbatim Code**:
  ```javascript
  const Validacao = {
    cnpj(v) {
      const nums = v.replace(/\D/g, '');
      if (nums.length !== 14) return 'CNPJ deve ter 14 dígitos';
      if (/^(\d)\1+$/.test(nums)) return 'CNPJ inválido';
      let sum = 0, peso = 5;
      for (let i = 0; i < 12; i++) { sum += parseInt(nums[i]) * peso; peso = peso === 2 ? 9 : peso - 1; }
      const d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (parseInt(nums[12]) !== d1) return 'CNPJ inválido';
      sum = 0; peso = 6;
      for (let i = 0; i < 13; i++) { sum += parseInt(nums[i]) * peso; peso = peso === 2 ? 9 : peso - 1; }
      const d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (parseInt(nums[13]) !== d2) return 'CNPJ inválido';
      return null;
    },
    email(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'E-mail inválido';
    },
    required(v, label) {
      return v?.trim() ? null : `${label} é obrigatório`;
    },
    valor(v) {
      return isNaN(parseFloat(v)) || parseFloat(v) <= 0 ? 'Valor deve ser maior que zero' : null;
    },
    senha(v) {
      return v.length >= 6 ? null : 'Senha deve ter pelo menos 6 caracteres';
    }
  };
  ```
- **Global Exposure**: `ui.jsx` (line 610)
  ```javascript
  Object.assign(window, { Icon, Btn, Badge, Card, KPI, Modal, Field, Input, CustomSelect, Textarea, BarChart, DonutChart, LineChart, Legend, EmptyState, ToastProvider, useToast, useIsMobile, Validacao, maskCNPJ, maskTelefone, maskCEP, maskMoeda, ModalConfirmacao, LoadingSpinner, imprimirPDF });
  ```

---

### B. Catalog of Forms, Dialogs, and Current Validations

We identified 14 distinct forms and dialogs in the application.

#### 1. `LoginScreen` (Auth Login)
- **Path**: `app.jsx` (lines 1442–1446)
- **Verbatim Observation**:
  ```javascript
  async function handleLogin(e) {
    e.preventDefault();
    setErro(''); setErroEspecial(''); setLoading(true);
    const errEmail = Validacao.email(email);
    if (errEmail) { setErro(errEmail); setLoading(false); return; }
  ```
- **Analysis**: Validates `email` format using `Validacao.email`. The `senha` field is not validated locally (it relies on Supabase Auth error responses).

#### 2. `LoginScreen` (Auth Password Recovery)
- **Path**: `app.jsx` (lines 1473–1477)
- **Verbatim Observation**:
  ```javascript
  async function handleReset(e) {
    e.preventDefault();
    setErro(''); setLoading(true);
    const errEmail = Validacao.email(email);
    if (errEmail) { setErro(errEmail); setLoading(false); return; }
  ```
- **Analysis**: Validates `email` format using `Validacao.email`.

#### 3. `TelaResetSenha` (Auth Set New Password)
- **Path**: `app.jsx` (lines 1370–1373)
- **Verbatim Observation**:
  ```javascript
  async function salvar(e) {
    e.preventDefault();
    if (novaSenha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres'); return; }
    if (novaSenha !== confirmar) { setErro('As senhas não coincidem'); return; }
  ```
- **Analysis**: Uses primitive string length checks and does not use `Validacao.senha`.

#### 4. `EmpresaWizard` (Client Company Creation/Edition Wizard)
- **Path**: `app.jsx` (lines 1131–1151)
- **Verbatim Observation**:
  ```javascript
  function validarStep1() {
    const e = {};
    const errNome = Validacao.required(f.nome, 'Razão Social');
    let errCNPJ = f.cnpj ? Validacao.cnpj(f.cnpj) : Validacao.required(f.cnpj, 'CNPJ');
    
    // Verificação de duplicidade de CNPJ
    if (!errCNPJ && todasEmpresas) {
      const cleanCNPJ = f.cnpj.replace(/\D/g, '');
      const existe = todasEmpresas.find(emp => emp.cnpj.replace(/\D/g, '') === cleanCNPJ && emp.id !== f.id);
      if (existe) {
        errCNPJ = 'Este CNPJ já está cadastrado em outra empresa.';
      }
    }

    const errEmail = f.email ? Validacao.email(f.email) : null;
    if (errNome) e.nome = errNome;
    if (errCNPJ) e.cnpj = errCNPJ;
    if (errEmail) e.email = errEmail;
    setErros(e);
    return Object.keys(e).length === 0;
  }
  ```
- **Analysis**: Effectively uses `Validacao` for Razão Social, CNPJ (and performs a local duplicate checks), and Email. However, optional fields `telefone` and `responsavel` are sent to Supabase without validation.

#### 5. `EmpresaFormModal` (Client Company Creation/Edition Form - Redundant)
- **Path**: `central.jsx` (lines 378–382)
- **Verbatim Observation**:
  ```javascript
  function submit(e) {
    e.preventDefault();
    if (!f.nome.trim()) return alert('Nome é obrigatório');
    onSave(f);
  }
  ```
- **Analysis**: **Redundant implementation**. It uses browser `alert()` and lacks validation for CNPJ and Email. In `app.jsx`, submitting this modal triggers `EmpresaWizard` to open on top, which is a UI/UX clash.

#### 6. `PerfilTab` (User Profile Settings)
- **Path**: `settings.jsx` (lines 107–113)
- **Verbatim Observation**:
  ```javascript
  function salvar() {
    if (!f.nome.trim()) return toast.push('Informe seu nome', 'error');
    if (senhas.nova || senhas.confirmar || senhas.atual) {
      if (senhas.nova !== senhas.confirmar) return toast.push('As senhas não coincidem', 'error');
    }
  ```
- **Analysis**: Does not use `Validacao`. It lacks validation for email, phone format, and password length (which should be >= 6).

#### 7. `EmpresaInfoTab` (BPO Company Info Settings)
- **Path**: `settings.jsx` (lines 164–168)
- **Verbatim Observation**:
  ```javascript
  function salvar() {
    if (!f.razaoSocial.trim()) return toast.push('Informe a razão social', 'error');
    onUpdate(f);
    toast.push('Dados da empresa atualizados');
  }
  ```
- **Analysis**: Bypasses `Validacao`. It lacks checks for CNPJ, Email, Phone, and CEP.

#### 8. `AbaSeguranca` (Security / Change Password Settings)
- **Path**: `settings.jsx` (lines 492–495)
- **Verbatim Observation**:
  ```javascript
  async function alterarSenha() {
    if (novaSenha.length < 6) { toast.push('Senha deve ter pelo menos 6 caracteres', 'error'); return; }
    if (novaSenha !== confirmar) { toast.push('As senhas não coincidem', 'error'); return; }
  ```
- **Analysis**: Uses primitive inline checks and does not use `Validacao.senha`.

#### 9. `AbaUsuarios` (User Creation Form)
- **Path**: `settings.jsx` (lines 679–688)
- **Verbatim Observation**:
  ```javascript
  async function criarUsuario() {
    if (!nomeNovo || !emailNovo || !senhaNova) {
      toast.push('Preencha nome, e-mail e senha', 'error'); return;
    }
    if (senhaNova.length < 6) {
      toast.push('A senha deve ter pelo menos 6 caracteres', 'error'); return;
    }
    if (papelNovo !== 'admin' && empresasSelecionadas.length === 0) {
      toast.push('Selecione pelo menos uma empresa', 'error'); return;
    }
  ```
- **Analysis**: It completely bypasses `Validacao.email` (a critical issue, as invalid emails can be sent to the Edge Function) and does not use `Validacao.senha`.

#### 10. `PortadorModal` (Bank/Portador Config Dialog)
- **Path**: `settings.jsx` (lines 268)
- **Verbatim Observation**:
  ```javascript
  <Btn variant="primary" onClick={() => { if (!f.nome.trim()) return alert('Informe o nome'); onSave(f); }}>Salvar</Btn>
  ```
- **Analysis**: Uses a basic inline check and a browser `alert()`. Bypasses `Validacao.required`.

#### 11. `CentroModal` (Cost Center Config Dialog)
- **Path**: `settings.jsx` (lines 341)
- **Verbatim Observation**:
  ```javascript
  <Btn variant="primary" onClick={() => { if (!f.nome.trim()) return alert('Informe o nome'); onSave(f); }}>Salvar</Btn>
  ```
- **Analysis**: Uses a basic inline check and a browser `alert()`. Bypasses `Validacao.required`.

#### 12. `FormasConfigTab` (Payment Methods Settings)
- **Path**: `settings.jsx` (lines 361–367)
- **Verbatim Observation**:
  ```javascript
  async function adicionar(e) {
    if (e && e.preventDefault) e.preventDefault();
    const n = nova.trim();
    if (!n) return;
    if (formas.includes(n)) return toast.push('Forma de pagamento já existe', 'error');
  ```
- **Analysis**: Bypasses `Validacao`. If the field is empty, it returns silently without showing an error to the user.

#### 13. `LancamentoFormModal` (Financial Transaction Entry Dialog)
- **Path**: `workspace.jsx` (lines 409–415)
- **Verbatim Observation**:
  ```javascript
  function submit(e) {
    e?.preventDefault();
    if (!f.descricao.trim()) return alert('Descrição é obrigatória');
    if (!f.valor || +f.valor <= 0) return alert('Informe um valor válido');
    const cc = ccsFiltrados.find(c => c.id === f.centroCustoId) || ccsFiltrados[0];
    onSave({ ...f, valor: +f.valor, centroCustoId: cc.id, competencia: competenciaFromDate(f.vencimento) });
  }
  ```
- **Analysis**: Uses primitive browser `alert()` calls. It should use `Validacao.required` and `Validacao.valor`.

#### 14. `PagamentoModal` (Conciliation / Confirm Payment Dialog)
- **Path**: `workspace.jsx` (lines 479–491)
- **Analysis**: Has no input validation on the payment date or portador.

#### 15. `ModalImportarXLSX` (Excel Import Dialog)
- **Path**: `workspace.jsx` (lines 875–881)
- **Analysis**: If users click "Confirmar Importação" without mapping columns (leaving them as empty strings), the indices fall back to `-1`, which produces unvalidated/empty transactions during batch insert.

---

## 2. Logic Chain
1. The `Validacao` library is defined in `ui.jsx`, which is globally loaded at the window scope early on. Therefore, we can safely expand `Validacao` inside `ui.jsx` with rules like `telefone(v)` or `cep(v)`.
2. Most forms in settings, workspaces, and auth currently bypass `Validacao` in favor of primitive checks (`v.length < 6`) or browser `alert()` popups.
3. This inconsistency violates the contract of enforcing strict frontend validation before sending data to Supabase (Milestone 2 goal).
4. In addition, there is a clear duplication of company forms: `EmpresaFormModal` (in `central.jsx`) and `EmpresaWizard` (in `app.jsx`). Submitting `EmpresaFormModal` in `central.jsx` triggers `onEditEmpresa`, which opens `EmpresaWizard` on top, leading to double-modals.
5. In order to implement robust client-side security (Milestone 2), we must:
   - Extend the global `Validacao` object with masks and helper validators (`telefone`, `cep`).
   - Deprecate `EmpresaFormModal` in `central.jsx` and route card/button clicks directly to `EmpresaWizard` in `app.jsx`.
   - Update all validation logic inside saving routines to consistently call `Validacao` rules, store errors, and present them gracefully (via inline messages or `toast.push(..., 'error')`) instead of `alert()`.

---

## 3. Caveats
- Edge function validations (`admin-criar-usuario`) were not fully evaluated, but the parameters sent to them (`emailNovo`, `senhaNova`) must be strictly checked on the client side using `Validacao` to prevent runtime failures in Supabase.
- We assumed that all forms are loaded under the single React SPA scope, which is correct as shown in `index.html`.

---

## 4. Conclusion
1. **Definition of `Validacao`**: It is currently defined in `ui.jsx` (lines 489–516) and exported via `window.Validacao` (line 610). This is the best place to maintain it.
2. **Actionable Recommendations for Milestone 2 implementation**:
   - **Step A**: Add `telefone(v)` and `cep(v)` methods to `Validacao` inside `ui.jsx`.
   - **Step B**: Deprecate `EmpresaFormModal` in `central.jsx`. Modify `central.jsx` to call `onEditEmpresa(emp)` and `onCreateEmpresa()` directly, allowing `EmpresaWizard` in `app.jsx` to be the sole client company configuration component.
   - **Step C**: Refactor validations in the remaining 12 interfaces to use `Validacao` methods and display errors using `toast.push(..., 'error')` rather than browser `alert()`.

---

## 5. Verification Method
- **Static Inspection**: Verify that `ui.jsx` is loaded before other scripts in `index.html` to confirm that `window.Validacao` is initialized.
- **Dynamic Check**: Check that form submission hooks (`salvar`, `submit`, `criarUsuario`) are modified to check `Validacao` results and prevent network calls to Supabase if errors exist.
