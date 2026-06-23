## 2026-06-22T21:52:12Z

Implement the security requirements (Milestone 2) of the financial BPO system:
1. Create `schema.sql` at the project root with the SQL table structures and RLS policies (from the Explorer 1 handoff at c:\Users\Yasmin\OneDrive\Documentos\financial-bpo-system\.agents\explorer_m1_1\handoff.md).
2. Fix the syntax/merge corruptions in `settings.jsx`:
   - Line 643: The merged div tags and function declaration (should be separate).
   - Line 808: The stray "Revogar" text outside any JSX block.
3. Modify `hooks.jsx` to remove client-side `.eq('user_id', userId)` filters for shared resources (`empresas`, `portadores`, `centros_custo`, and `formas_pagamento`).
4. Deprecate `EmpresaFormModal` in `central.jsx` by modifying company actions to call `onEditEmpresa(emp)` and `onCreateEmpresa()` directly (so they open `EmpresaWizard` in `app.jsx` instead of loading a duplicate modal).
5. Add validation helper functions like `telefone` and `cep` to `Validacao` in `ui.jsx` if necessary.
6. Refactor the forms across the application (LoginScreen, TelaResetSenha, EmpresaWizard, PerfilTab, EmpresaInfoTab, AbaSeguranca, AbaUsuarios, PortadorModal, CentroModal, FormasConfigTab, LancamentoFormModal, PagamentoModal, and ModalImportarXLSX) to use `Validacao` checks and show error messages with `toast.push(..., 'error')` rather than browser `alert()` or simple alerts.
