# Original User Request

## Initial Request — 2026-06-23T00:27:53Z

[Revisão Completa de UI/UX e Auditoria de Segurança para um Sistema BPO Financeiro em React (CDN) + Supabase, com foco em tornar o cadastro de lançamentos na própria página mais intuitivo, melhorar calendários e garantir o funcionamento e a segurança total de toda a aplicação.]

Working directory: c:/Users/Yasmin/OneDrive/Documentos/financial-bpo-system
Integrity mode: demo

## Requirements

### R1. Melhoria na Tela de Lançamentos
Tornar o cadastro de novos lançamentos altamente evidente e intuitivo diretamente na página "Lançamentos", sem adicionar botões flutuantes (FAB) ou atalhos na barra superior.

### R2. Auditoria e Execução de Segurança Máxima
Garantir que as políticas de segurança de banco de dados (RLS) no Supabase restrinjam rigidamente os dados para o acesso multi-usuário (vinculação por empresa). Implementar validações estritas no Frontend para todos os formulários.

### R3. Estilização de Calendários e UI
Melhorar a estilização e a usabilidade dos calendários suspensos em todo o sistema.

### R4. Fluidez e Funcionalidade (QA)
Garantir a fluidez do sistema e verificar cada botão/ação para certificar que estão implementados e vivos (nenhum "botão morto").

## Acceptance Criteria

### Segurança (RLS e Frontend)
- [ ] Todas as tabelas no `schema.sql` possuem políticas RLS ativas que filtram acessos baseados na tabela `usuarios_empresas` ou `owner_id`.
- [ ] Todos os formulários de criação/edição utilizam o objeto `Validacao` antes de enviar dados ao Supabase.

### UI e UX (Lançamentos e Calendários)
- [ ] O formulário ou botão de "Novo Lançamento" é o elemento de maior destaque na visão de Lançamentos.
- [ ] Os calendários suspensos possuem CSS atualizado com estados de "hover", "focus" e indicação clara de datas selecionadas.

### Funcionalidade Geral
- [ ] Nenhum elemento `<button>` principal na interface possui `onClick={() => {}}` ou falta de feedback visual/funcional.
