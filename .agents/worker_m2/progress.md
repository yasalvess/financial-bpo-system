# Progress Tracker

Last visited: 2026-06-22T21:52:12-03:00

- [x] Create `schema.sql` at root with SQL table structures and RLS policies from Explorer 1 handoff.
- [x] Fix syntax corruptions in `settings.jsx` (InfoLinha line 643, stray Revogar line 808).
- [x] Modify `hooks.jsx` to remove client-side `.eq('user_id', userId)` filters for shared resources (`empresas`, `portadores`, `centros_custo`, `formas_pagamento`).
- [x] Deprecate `EmpresaFormModal` in `central.jsx` by modifying actions to use `onEditEmpresa` and `onCreateEmpresa` directly.
- [x] Add validation helper functions like `telefone` and `cep` to `Validacao` in `ui.jsx`.
- [x] Refactor all forms (LoginScreen, TelaResetSenha, EmpresaWizard, PerfilTab, EmpresaInfoTab, AbaSeguranca, AbaUsuarios, PortadorModal, CentroModal, FormasConfigTab, LancamentoFormModal, PagamentoModal, and ModalImportarXLSX) to use `Validacao` and `toast.push(..., 'error')`.
- [x] Verify syntax and compile status of all modified files.
