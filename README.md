# KS Gestão BPO - Documentação Completa

## Visão Geral
O **KS Gestão BPO** é um sistema de Business Process Outsourcing (BPO) financeiro multi-empresa. Ele foi desenvolvido para gerenciar e consolidar as finanças de múltiplas empresas de forma centralizada.
Os usuários do sistema variam entre **Administradores** (que gerenciam todo o sistema, acessos e criam empresas), **Analistas** (que operam as finanças de empresas específicas vinculadas a eles) e **Visualizadores** (que apenas consomem os relatórios e dados das empresas vinculadas).

O sistema está hospedado com o **Frontend na Hostinger** e o **Backend no Supabase** (PostgreSQL, Auth, Edge Functions, e pg_cron).

## Navegação da Documentação
Para facilitar a leitura e manutenção, a documentação foi dividida nos seguintes módulos:

1. [Arquitetura e Convenções (CRÍTICO)](docs/arquitetura-convencoes.md) - **LEIA ANTES DE MEXER NO CÓDIGO!** Explica a estrutura sem build, Babel standalone, React via CDN e regras de escopo.
2. [Estrutura de Arquivos](docs/estrutura-arquivos.md) - O que cada arquivo do projeto faz e como se comunicam.
3. [Funcionalidades e Módulos](docs/funcionalidades.md) - Como funcionam os fluxos de ponta a ponta (login, empresas, lançamentos, configurações).
4. [Banco de Dados e RLS](docs/banco-de-dados.md) - Tabelas, relacionamentos, políticas de segurança, histórico de decisões estruturais e cron jobs.
5. [Edge Functions e Integrações](docs/edge-functions-integracoes.md) - Rotas Serverless no Supabase e integrações externas (Resend, Cron).
6. [Guia de Manutenção Segura](docs/guia-manutencao.md) - Passo a passo para criar telas, debugar erros recorrentes e manter o sistema estável.

---
**Dica de Ouro:** A regra mais importante deste repositório é que **nenhum arquivo JS usa `import` ou `export`**. Tudo é injetado globalmente na `window`. Consulte o guia de Arquitetura antes de alterar qualquer componente.
