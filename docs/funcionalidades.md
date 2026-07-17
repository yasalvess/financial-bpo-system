# Funcionalidades e Módulos

Neste documento descrevemos o funcionamento de cada módulo principal da aplicação, unindo o ponto de vista operacional (o que o usuário faz) com o código (onde e como acontece).

## 1. Login, Autenticação e Perfil
- **Uso**: O sistema é privado. O usuário insere e-mail e senha. Existe a opção de recuperação de senha e reenvio de confirmação de e-mail.
- **Código**: Gerenciado no arquivo `app.jsx`. O componente `LoginScreen` utiliza os métodos diretos da SDK do Supabase (`auth.signInWithPassword`). O hook global escuta mudanças (`auth.onAuthStateChange`) para carregar os dados de perfil caso o login seja bem-sucedido. Apenas usuários que estão com `status: ativo` na tabela `perfis` conseguem utilizar o sistema efetivamente (desativar um usuário impede seu acesso prático às querys RLS).

## 2. Empresas (Multitenancy)
- **Uso**: O BPO cria as "Empresas" dos seus clientes. Uma vez criada, todos os lançamentos são agrupados dentro dessa empresa (tenant). 
- **Código**: Lógica contida primariamente em `central.jsx`. A **criação e edição** salvam direto no banco de dados, assumindo o `user_id` de quem cria.
- **Exclusão de Empresa**: Isso é crítico. A exclusão de uma empresa individual chama a Edge Function `admin-criar-usuario` com a ação `delete_empresa`. Fizemos isso para que a exclusão em cascata (lançamentos vinculados e acessos da tabela associativa `usuarios_empresas`) rode utilizando a `service_role`. Isso contorna as travas de *Row Level Security* (RLS) impostas no banco de dados e impede falhas silenciosas onde a empresa sumiria da tela mas não do banco.

## 3. Lançamentos Financeiros (Workspace)
- **Uso**: Dentro do `workspace.jsx`, ocorre o trabalho diário. Cadastro de contas a pagar e receber, baixas (pagamentos), anexos e filtros por competência.
- **Código**: Usa um componente robusto de barra lateral para cadastro inline e painel detalhado. Inclui lógica de repetição e parcelamento (`parcelamento: X/Y`), gerando N registros distintos no banco com vencimentos mensais projetados. O controle do saldo e dos KPIs depende exclusivamente do status booleano `pago` e dos valores do `tipo` ('entrada' ou 'saida'). 

## 4. Portadores, Centros de Custo e Formas de Pagamento
- **Uso**: Parâmetros globais que categorizam os lançamentos. Os Administradores criam de forma global, e essas categorias ficam disponíveis para classificar o fluxo de caixa de qualquer empresa.
- **Código**: Gerenciados nas abas dentro de `settings.jsx`. Eles possuem chaves primárias fortes (UUID), ligando-se opcionalmente ou compulsoriamente via chaves estrangeiras aos registros de `lancamentos`.

## 5. Usuários & Acessos
- **Uso**: A tela onde o Administrador cria novos membros para a equipe (outros analistas ou o próprio cliente como visualizador). Ele convida o usuário e escolhe especificamente a quais empresas (checkboxes) este novo membro terá acesso.
- **Código**: Contida em `settings.jsx`. Toda a listagem, edição, criação, e exclusão ocorre passando pelo bypass de RLS, acionando a **Edge Function**. A listagem chama o endpoint via POST (action `list`), que retorna a união limpa de todos os perfis ativos e suas permissões associativas. Operações em lote (selecionar 5 usuários e clicar em excluir) também batem num loop otimizado da mesma Edge Function.
- **Importante**: Analistas e Visualizadores não veem essa aba, o componente `<AbaUsuarios />` é escondido condicionalmente com base no cargo verificado na sessão.

## 6. Notificações e Alertas Automáticos
- **Uso**: O sistema varre diariamente os lançamentos vencidos ou a vencer para alertar por e-mail a equipe e os clientes envolvidos.
- **Código**: Utiliza a extensão `pg_cron` no Supabase para agendar rotinas que chamam webhooks periodicamente, disparando e-mails estilizados em HTML integrados à API do serviço **Resend**. A configuração de DNS está conectada na Hostinger.
