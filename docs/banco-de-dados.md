# Banco de Dados, Políticas (RLS) e Modelagem

O sistema conta com um banco PostgreSQL totalmente hospedado no Supabase. O banco de dados é a fortaleza da segurança da aplicação, pois ele gerencia **Row-Level Security (RLS)** severas para evitar que os dados multitenant vazem ou sejam adulterados.

## Tabelas Principais

1. **`perfis`** (Profiles)
   - Armazena as informações complementares da tabela nativa `auth.users` do Supabase.
   - Campos essenciais: `cargo` (Admin, Analista, Visualizador), `ativo` (true/false) e `owner_id`.
   - **Histórico**: Havia um problema grave de recursão infinita no RLS dessa tabela quando tentávamos permitir que administradores enxergassem perfis de terceiros lendo a própria tabela `perfis`. A política de leitura (`perfis_select`) foi simplificada brutalmente: **cada usuário só pode ler diretamente o SEU PRÓPRIO registro `id = auth.uid()`**. A leitura ampliada (da lista de todos os usuários pelo Admin) foi transferida para a Edge Function rodando como *service_role*.

2. **`empresas`**
   - Campos: `nome`, `cnpj`, `segmento`, `user_id` (quem criou).
   - Base do Multitenancy.

3. **`usuarios_empresas`**
   - Tabela associativa NxN. Define quais usuários (Analistas/Visualizadores) têm acesso a quais empresas.
   - Possui `on delete cascade` para a empresa.
   - Uma das barreiras antigas era que um Admin tentava deletar a Empresa, mas o banco se recusava a apagar os vínculos do `usuarios_empresas` em cascata porque o Admin logado não era dono do registro de acesso. Solução: exclusão da empresa migrada para Edge Function (*service_role*).

4. **`lancamentos`**
   - A tabela mais volumosa. 
   - Relacionada compulsoriamente a `empresas` (`on delete cascade`).
   - Se conecta opcionalmente com chaves de `portadores` e `centros_custo` (`on delete set null`). Isso garante que, se um banco for apagado das configurações, os lançamentos que o utilizavam não sumirão, apenas perderão o vínculo e mostrarão "Não definido".
   - Tipos de dado: `valor` como `numeric(12,2)` para evitar erros de ponto flutuante em finanças, e datas como `date`.

## Entendendo as Políticas RLS
Quase todas as tabelas possuem as seguintes políticas básicas:
- `INSERT`: Apenas o `auth.uid()` pode inserir registros.
- `SELECT`: O usuário pode ver se for dono do registro (`user_id = auth.uid()`) ou se houver um vínculo indireto permitindo (ex: ele é dono da empresa atrelada ao lançamento).
- `UPDATE` e `DELETE`: Geralmente restritos ao dono ou, se envolver delegação, ao *owner_id*. Para exclusões mais complexas que barram no *Cascade*, utilizamos a Edge Function.

## Triggers e Procedures Relevantes
- Existe um trigger atrelado ao Auth do Supabase que dispara a cada usuário criado (`on auth.users insert`), criando automaticamente a linha correspondente de espelho na tabela `perfis`.
- Crons agendadas via `pg_cron` executam consultas puras (como listagem de Vencidos do dia) para gerar payloads JSON que são repassados ao webhook de e-mails.
