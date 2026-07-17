# Guia de Manutenção Segura

Mexer num sistema sem build (CDN puro) requer atenção especial. Um erro de sintaxe num arquivo ou uma falha de encadeamento pode estourar uma tela branca para o usuário.

## Passo a Passo para Adicionar Telas ou Componentes

1. **Crie o Arquivo JSX**: Crie seu componente em um novo arquivo (ex: `relatorios.jsx`).
2. **Defina os Alias de Hooks**: A primeira linha do arquivo **deve** ser a extração dos hooks que você vai usar, com o prefixo correto:
   ```javascript
   const { useState: useState_R, useEffect: useEffect_R } = React;
   ```
3. **Crie e Injete**: Escreva seu componente e exponha ele globalmente no fim do arquivo:
   ```javascript
   function Relatorios({ data }) { ... }
   Object.assign(window, { Relatorios });
   ```
4. **Vincule no `index.html`**: Vá no `index.html` e insira sua tag na ordem lógica (geralmente antes do `app.jsx` se for carregado dentro do App).
   ```html
   <script type="text/babel" src="relatorios.jsx"></script>
   ```

## Testando Antes de Subir
Como não temos um "dev server" de framework para acusar erros (como o Next ou Vite faz no HMR), **sempre abra o Console (F12) no navegador ao testar em localhost**. 
- Se a tela ficar em branco, 99% das vezes será um log vermelho do Babel no Console dizendo onde está a tag de fechamento quebrada ou o erro de sintaxe Javascript.
- Use extensões locais estáticas, como o pacote NPM `serve`: rode `npx serve -l 5173` na raiz da pasta.

## Problemas Clássicos e Soluções (FAQ do Desenvolvedor)

- **"Criei uma função, mas ao compilar o Babel diz que ela já foi definida"**
  Você esqueceu do isolamento (ou de usar const/let local) e gerou conflito com outro arquivo carregado globalmente.
- **"O componente `<MeuComponente />` is not defined"**
  Você provavelmente esqueceu do `Object.assign(window, { MeuComponente })` no final do arquivo que declarou o componente. Ou você esqueceu de incluir a tag script no `index.html`.
- **"A página está em branco!"**
  Abra o console. Se for erro de *SyntaxError* do Babel, ele acusará o número da linha. 
- **"Os dados não carregam, o painel do Supabase mostra que há 100 linhas mas o frontend recebe 0"**
  Isso é o famigerado Row-Level Security (RLS). Vá na tabela no Supabase e verifique as Policies. Se o usuário estiver tentando acessar algo que o banco está filtrando no `using`, o Supabase retornará `200 OK` porém vazio. Revise as restrições de permissão.
- **"O Admin mandou deletar e sumiu da tela, mas ao dar F5 voltou"**
  Erro clássico contornado pela nossa rota "delete_empresa". O Supabase falhou o deleto no backend devido ao `on cascade` de uma tabela com RLS protegido. Se vir isso acontecer, a rota do Edge Function é o caminho natural para a correção.
