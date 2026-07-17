# Edge Functions e Integrações

Este módulo lista os componentes externos ao código do React e ao banco de dados relacional clássico.

## Edge Function: `admin-criar-usuario`
O nome sugere apenas a criação, mas ela evoluiu para ser a rota "Deus" (sob a `service_role` key do Supabase) que orquestra qualquer alteração sensível que envolva quebra intencional das políticas RLS para os Administradores.

### Como a segurança é feita?
Mesmo usando a `service_role`, o endpoint não é público na prática. Ao receber a chamada, ela captura o header `Authorization: Bearer <TOKEN>`, decodifica o usuário autenticado que disparou a chamada e checa na tabela de perfis (via banco) se a string de cargo dele contém `admin` ou `administrador` (case-insensitive). Se não for, ela cospe um HTTP 403 e a execução morre na hora. Nenhuma ação é processada.

### Ações (`action: '...'`) Suportadas:
- `create`: Dispara convite via API de Admin Auth do Supabase. E insere no banco o nome, empresa vinculada, cargo.
- `update`: Atualiza os metadados de cargo no Auth, e gerencia ativamente a tabela `usuarios_empresas` (insere novas e remove antigas checkboxes marcadas no UI).
- `delete`: Apaga o usuário do Supabase Auth e o PostgreSQL limpa as tabelas dele em cascata. Serve tanto para exclusão individual quanto exclusão em lote (recebe um array de `ids`).
- `list`: Usada pelo frontend para desenhar a Aba de Usuários e Acessos. Bypassa o RLS de `perfis` (que tem recursão) e traz de forma limpa os perfis e os arrays de acesso da `usuarios_empresas`. Filtra o próprio usuário do retorno no React.
- `delete_empresa`: Destrói uma empresa e todos os dados associados. Migramos isso para cá pois a deleção pelo Frontend falhava ao tentar acionar o `Cascade` do banco em chaves de acesso que o próprio admin logado não era "dono" (RLS). A Edge Function pulveriza tudo sem travas.

### Como fazer o deploy de atualizações
1. Garanta que você instalou a CLI do Supabase (via NPM, NPX, ou Homebrew).
2. O seu terminal precisa estar logado na sua conta Supabase (`supabase login`).
3. Vá para a pasta do projeto (onde fica a subpasta `supabase`).
4. Rode: 
   `npx supabase functions deploy admin-criar-usuario --project-ref svgvtmkqjvxsoduohfuy --no-verify-jwt`
5. A flag `--no-verify-jwt` é necessária pois validamos o JWT internamente dentro do próprio script do Deno, checando no banco o papel real.

## Resend e Domínio
- O projeto usa o **Resend** (Resend.com) acoplado como um gatilho REST para enviar e-mails em massa transacionais e cobranças de vencimento.
- A chave de API do Resend deve estar sempre configurada no `.env` do banco/Edge ou injetada no script do Postgres HTTP Trigger.
- O domínio do cliente emissor foi validado via DNS (registros MX e TXT) através da **Hostinger**, para que o remetente oficial do e-mail não caia em spam.
