# Estrutura de Arquivos

Como o projeto é injetado via `<script type="text/babel">` e roda no navegador, a divisão dos arquivos foi feita para isolar grandes responsabilidades. Segue o mapa estrutural da aplicação:

## Arquivos Raiz
- **`index.html`**: O "coração" da estrutura. Carrega o React, o ReactDOM, o Babel Standalone, dependências externas (como bibliotecas gráficas ou clientes via CDN) e, finalmente, enfileira todos os arquivos `.jsx` do projeto. A ordem das tags `<script>` nele define a cadeia de dependências.
- **`styles.css`**: Concentra o reset CSS e a definição de variáveis CSS globais (cores, sombras, raios de borda). O design system do projeto é regido por estas variáveis para garantir uniformidade.

## Arquivos React (`.jsx`)
- **`app.jsx`**: É o Entrypoint do React. 
  - Gerencia o estado de autenticação (sessão do Supabase).
  - Possui o componente principal `<App />`.
  - Orquestra as Rotas principais da aplicação (o roteamento é um estado simples interno, ex: `route.view === 'central'`).
  - Carrega a base de dados (`useAppData`), passando-a adiante como props para as abas filhas.
- **`central.jsx`**: Responsável pela listagem e gestão do dashboard das empresas.
  - Tela inicial de quem loga (visão de grid ou tabela das empresas cadastradas).
  - Inclui os KPIs macro (A Receber, A Pagar, Vencidos).
  - Gerencia a criação e exclusão individual das empresas (repassando a requisição para a Edge Function via API em conjunto com o App).
- **`workspace.jsx`**: É o ambiente de trabalho dentro de uma empresa específica.
  - Tabela principal de lançamentos (receitas e despesas).
  - Filtros avançados, barra lateral de detalhes do lançamento, parcelamentos, e anexos.
  - Componentização pesada focada nas rotinas operacionais (contas a pagar/receber).
- **`settings.jsx`**: Centraliza todas as parametrizações sistêmicas e cadastros base.
  - **Portadores**, **Centros de Custo** e **Formas de Pagamento**.
  - **Usuários e Acesso**: Tela onde os admins criam e editam os usuários do sistema, alterando os cargos (Admin, Analista, Visualizador) e configurando o array de empresas (tabela associativa `usuarios_empresas`) que cada perfil secundário pode visualizar.

## Edge Functions
- **`supabase/functions/admin-criar-usuario/index.ts`**: Função Serverless vital. Foi criada para resolver as limitações estruturais de Row-Level Security (RLS) ao se manipular acessos de terceiros, rodando sob a `service_role`. Possui métodos `create`, `update`, `delete`, `list` e `delete_empresa`. 
