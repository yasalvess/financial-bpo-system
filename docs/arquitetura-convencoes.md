# Arquitetura e Convenções (CRÍTICO)

O projeto KS Gestão BPO possui uma arquitetura não convencional voltada para máxima portabilidade e simplicidade de hospedagem, rodando diretamente via CDN. **Você deve entender estas regras antes de editar uma única linha de código, ou derrubará o sistema inteiro.**

## A Stack
- **Frontend**: React 18, consumido via CDN.
- **Compilação**: Sem bundlers (Webpack, Vite) e sem ambiente Node.js. O código utiliza o **Babel Standalone** rodando diretamente no navegador para compilar o JSX em tempo de execução.
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions).

## Regras de Ouro Inquebráveis

### 1. Ausência de `import` e `export`
Nenhum arquivo no projeto utiliza módulos ES6 (`import`/`export`). Todo o código JSX é carregado no `index.html` através de tags `<script type="text/babel">`.
Para compartilhar variáveis, funções ou componentes entre arquivos, usamos a injeção global no objeto `window`:
```javascript
// CORRETO
function MeuComponente() { return <div>Oi</div>; }
Object.assign(window, { MeuComponente });

// ERRADO (vai quebrar o Babel)
export default MeuComponente;
```

### 2. Ordem de Carregamento no `index.html`
Como não há bundler, a dependência entre os arquivos é resolvida pela ordem das tags `<script>` no `index.html`. 
Se o `app.jsx` usa o componente `ModalConfirmacao` que está no `central.jsx`, o `central.jsx` **precisa ser carregado antes** no HTML. Se você criar um arquivo novo, lembre-se de registrar a tag `<script>` dele no arquivo `index.html` na ordem correta das dependências.

### 3. Hooks com Alias (Sufixos de Arquivo)
Como todos os arquivos compartilham o escopo global (e o Babel compila tudo no memo escopo de `window`), funções e hooks com o mesmo nome causariam colisões destrutivas (ex: um `useState` sobrepondo outro e perdendo a referência correta do React).
Para evitar isso, nós usamos **Hooks renomeados** no topo de cada arquivo, adicionando a inicial do arquivo como sufixo:
```javascript
// No app.jsx
const { useState: useState_A, useEffect: useEffect_A, useMemo: useMemo_A } = React;

// No central.jsx
const { useState: useState_C, useEffect: useEffect_C, useMemo: useMemo_C } = React;

// No settings.jsx
const { useState: useState_S, useEffect: useEffect_S, useMemo: useMemo_S } = React;
```
**Regra:** Sempre extraia os hooks do objeto `React` com o alias do seu arquivo e use apenas os aliases ao longo de todo o componente. Nunca chame `React.useState` diretamente se houver desestruturação.

### 4. Estilos Inline com Variáveis CSS
Não utilizamos frameworks de CSS pesados (como Tailwind ou Bootstrap). Todo o design é alcançado combinando:
1. Um arquivo `styles.css` global com variáveis de design tokens (`--c-primary`, `--c-bg`, `--c-text`).
2. **Inline Styles** nos componentes JSX.
3. Não use classes CSS arbitrárias para compor layouts, confie na flexbox via estilo inline para não poluir o CSS global.

### 5. `CustomSelect` ao invés de Select Nativo
Sempre que precisar de um dropdown com opções, **nunca utilize a tag `<select>` nativa**. Utilize o componente global `CustomSelect`, que garante a identidade visual refinada, suporte a ícones e feedback moderno.
```javascript
<CustomSelect 
  value={meuEstado} 
  onChange={setMeuEstado} 
  options={[
    { value: 'opcao1', label: 'Opção 1' },
    { value: 'opcao2', label: 'Opção 2' }
  ]} 
/>
```
