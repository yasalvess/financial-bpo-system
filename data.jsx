// Mock data + helpers para o sistema BPO

const PORTADORES_PADRAO = [
  { id: 'bradesco', nome: 'Bradesco', tipo: 'banco', cor: '#CC092F' },
  { id: 'itau', nome: 'Itaú', tipo: 'banco', cor: '#EC7000' },
  { id: 'caixa-econ', nome: 'Caixa Econômica', tipo: 'banco', cor: '#0066B3' },
  { id: 'caixa-fisica', nome: 'Caixa Física', tipo: 'caixa', cor: '#64748b' },
  { id: 'cofre', nome: 'Cofre', tipo: 'cofre', cor: '#475569' },
];

const FORMAS_PAGAMENTO = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'TED', 'DOC'];

const CENTROS_CUSTO_PADRAO = [
  { id: 'cc-aluguel', nome: 'Aluguel & Condomínio', tipo: 'saida' },
  { id: 'cc-folha', nome: 'Folha de Pagamento', tipo: 'saida' },
  { id: 'cc-fornec', nome: 'Fornecedores', tipo: 'saida' },
  { id: 'cc-marketing', nome: 'Marketing', tipo: 'saida' },
  { id: 'cc-impostos', nome: 'Impostos & Taxas', tipo: 'saida' },
  { id: 'cc-utilidade', nome: 'Água, Luz & Internet', tipo: 'saida' },
  { id: 'cc-vendas', nome: 'Vendas / Receita', tipo: 'entrada' },
  { id: 'cc-servicos', nome: 'Prestação de Serviços', tipo: 'entrada' },
  { id: 'cc-outros-e', nome: 'Outras Receitas', tipo: 'entrada' },
];

const NOMES_EMPRESAS = [
  { nome: 'Padaria Bom Pão Ltda', cnpj: '12.345.678/0001-90', segmento: 'Alimentação' },
  { nome: 'AutoCenter Silva ME', cnpj: '23.456.789/0001-12', segmento: 'Automotivo' },
  { nome: 'Studio Beleza & Estilo', cnpj: '34.567.890/0001-23', segmento: 'Estética' },
  { nome: 'Construtora Horizonte', cnpj: '45.678.901/0001-34', segmento: 'Construção' },
  { nome: 'Boutique Helena', cnpj: '56.789.012/0001-45', segmento: 'Moda' },
  { nome: 'Pet Shop Mundo Animal', cnpj: '67.890.123/0001-56', segmento: 'Pet' },
  { nome: 'Restaurante Sabor Mineiro', cnpj: '78.901.234/0001-67', segmento: 'Alimentação' },
  { nome: 'Clínica Odonto Sorriso', cnpj: '89.012.345/0001-78', segmento: 'Saúde' },
  { nome: 'Tech Solutions Informática', cnpj: '90.123.456/0001-89', segmento: 'Tecnologia' },
  { nome: 'Floricultura Jardim das Rosas', cnpj: '01.234.567/0001-90', segmento: 'Comércio' },
  { nome: 'Academia Forma Fit', cnpj: '11.222.333/0001-44', segmento: 'Fitness' },
  { nome: 'Escritório Advocacia Lima', cnpj: '22.333.444/0001-55', segmento: 'Serviços' },
  { nome: 'Lava Rápido Express', cnpj: '33.444.555/0001-66', segmento: 'Automotivo' },
  { nome: 'Mercearia Vila Nova', cnpj: '44.555.666/0001-77', segmento: 'Comércio' },
  { nome: 'Studio Fotografia Imagem', cnpj: '55.666.777/0001-88', segmento: 'Mídia' },
  { nome: 'Imobiliária Premium Lar', cnpj: '66.777.888/0001-99', segmento: 'Imobiliário' },
];

const DESCRICOES_ENTRADA = [
  'Venda de produtos - Cliente PF', 'Prestação de serviço - mensal',
  'Recebimento contrato anual', 'Venda balcão', 'Receita de assinatura',
  'Pagamento cliente - boleto', 'Aluguel sala recebido', 'Comissão recebida'
];
const DESCRICOES_SAIDA = [
  'Fornecedor matéria prima', 'Salário funcionário', 'Aluguel mensal',
  'Conta de luz', 'Conta de água', 'Internet fibra', 'INSS', 'DAS Simples',
  'Marketing - Google Ads', 'Manutenção equipamentos', 'Material de escritório',
  'Pró-labore', 'Combustível', 'Limpeza & conservação'
];

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatBRL(v) {
  return (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return date.toLocaleDateString('pt-BR');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(isoA, isoB) {
  const a = new Date(isoA + 'T00:00:00');
  const b = new Date(isoB + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

function competenciaFromDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Status calculation
function lancStatus(l, hojeISO) {
  if (l.pago) return 'pago';
  const diff = daysBetween(hojeISO, l.vencimento);
  if (diff < 0) return 'vencido';
  if (diff <= 7) return 'vencendo';
  return 'em-dia';
}

function statusColor(status) {
  return {
    'pago': { bg: 'var(--c-green-bg)', fg: 'var(--c-green-fg)', dot: '#16a34a', label: 'Pago' },
    'em-dia': { bg: 'var(--c-blue-bg)', fg: 'var(--c-blue-fg)', dot: '#3b82f6', label: 'Em dia' },
    'vencendo': { bg: 'var(--c-amber-bg)', fg: 'var(--c-amber-fg)', dot: '#f59e0b', label: 'Vencendo' },
    'vencido': { bg: 'var(--c-red-bg)', fg: 'var(--c-red-fg)', dot: '#ef4444', label: 'Vencido' },
  }[status];
}

// Generate sample lançamentos for a company
function gerarLancamentos(empresaId, qtd = 25) {
  const lancs = [];
  const hoje = new Date();
  for (let i = 0; i < qtd; i++) {
    const tipo = Math.random() > 0.45 ? 'saida' : 'entrada';
    const ccs = CENTROS_CUSTO_PADRAO.filter(c => c.tipo === tipo);
    const cc = ccs[Math.floor(Math.random() * ccs.length)];
    const portador = PORTADORES_PADRAO[Math.floor(Math.random() * PORTADORES_PADRAO.length)];
    const forma = FORMAS_PAGAMENTO[Math.floor(Math.random() * FORMAS_PAGAMENTO.length)];
    const descPool = tipo === 'entrada' ? DESCRICOES_ENTRADA : DESCRICOES_SAIDA;
    const descricao = descPool[Math.floor(Math.random() * descPool.length)];
    // Spread dates: some past (paid), some near future, some past (overdue)
    const offset = Math.floor(Math.random() * 90) - 45; // -45 a +45 dias
    const d = new Date(hoje);
    d.setDate(d.getDate() + offset);
    const vencimento = d.toISOString().slice(0, 10);
    const valor = Math.round((tipo === 'entrada' ? 800 + Math.random() * 9000 : 200 + Math.random() * 5500) * 100) / 100;
    // Paid? 80% if past, 5% if future
    const past = offset < -3;
    const pago = past ? Math.random() < 0.78 : Math.random() < 0.05;
    const pagamento = pago ? {
      data: addDays(vencimento, Math.floor(Math.random() * 5) - 1),
      comprovante: `CMP-${Math.floor(Math.random() * 90000 + 10000)}.pdf`,
    } : null;
    lancs.push({
      id: uid('lanc'),
      empresaId,
      tipo, descricao, valor,
      vencimento,
      competencia: competenciaFromDate(vencimento),
      portadorId: portador.id,
      centroCustoId: cc.id,
      formaPagamento: forma,
      pago,
      pagamento,
      observacao: ''
    });
  }
  return lancs;
}

function gerarEmpresas() {
  return NOMES_EMPRESAS.map((e, i) => ({
    id: uid('emp'),
    nome: e.nome,
    cnpj: e.cnpj,
    segmento: e.segmento,
    responsavel: ['Maria Silva', 'João Santos', 'Ana Costa', 'Pedro Lima', 'Carla Souza'][i % 5],
    email: `contato@${e.nome.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12)}.com.br`,
    telefone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    criadaEm: addDays(todayISO(), -Math.floor(30 + Math.random() * 365)),
  }));
}

// Build initial state
function buildInitialData() {
  const empresas = gerarEmpresas();
  const lancamentos = {};
  empresas.forEach(e => {
    lancamentos[e.id] = gerarLancamentos(e.id, 18 + Math.floor(Math.random() * 18));
  });
  return {
    empresas,
    lancamentos,
    portadores: PORTADORES_PADRAO,
    centrosCusto: CENTROS_CUSTO_PADRAO,
    formasPagamento: FORMAS_PAGAMENTO,
  };
}

// Aggregations
function empresaStats(empresa, lancs, hoje) {
  let aReceber = 0, aPagar = 0, vencidos = 0, vencendo = 0, recebido = 0, pago = 0;
  let cntVencido = 0, cntVencendo = 0, cntEmDia = 0;
  lancs.forEach(l => {
    const s = lancStatus(l, hoje);
    if (l.tipo === 'entrada') {
      if (l.pago) recebido += l.valor;
      else aReceber += l.valor;
    } else {
      if (l.pago) pago += l.valor;
      else aPagar += l.valor;
    }
    if (!l.pago) {
      if (s === 'vencido') { vencidos += l.valor; cntVencido++; }
      else if (s === 'vencendo') { vencendo += l.valor; cntVencendo++; }
      else cntEmDia++;
    }
  });
  let statusEmpresa = 'em-dia';
  if (cntVencido > 0) statusEmpresa = 'vencido';
  else if (cntVencendo > 0) statusEmpresa = 'vencendo';
  return { aReceber, aPagar, vencidos, vencendo, recebido, pago, cntVencido, cntVencendo, cntEmDia, statusEmpresa, saldo: recebido - pago };
}

// Portador balances (entradas pagas - saidas pagas + lançamentos previstos? No: realizado)
function portadorSaldos(lancs, portadores) {
  const map = {};
  portadores.forEach(p => map[p.id] = { ...p, entradas: 0, saidas: 0, saldo: 0, movs: 0 });
  lancs.forEach(l => {
    if (!l.pago) return;
    const p = map[l.portadorId];
    if (!p) return;
    if (l.tipo === 'entrada') p.entradas += l.valor;
    else p.saidas += l.valor;
    p.movs++;
  });
  Object.values(map).forEach(p => p.saldo = p.entradas - p.saidas);
  return Object.values(map);
}

function centroCustoStats(lancs, centros) {
  const map = {};
  centros.forEach(c => map[c.id] = { ...c, total: 0, qtd: 0, pago: 0, pendente: 0 });
  lancs.forEach(l => {
    const c = map[l.centroCustoId];
    if (!c) return;
    c.total += l.valor;
    c.qtd++;
    if (l.pago) c.pago += l.valor;
    else c.pendente += l.valor;
  });
  return Object.values(map);
}

Object.assign(window, {
  PORTADORES_PADRAO, FORMAS_PAGAMENTO, CENTROS_CUSTO_PADRAO,
  uid, formatBRL, formatDate, todayISO, addDays, daysBetween, competenciaFromDate,
  lancStatus, statusColor,
  gerarLancamentos, gerarEmpresas, buildInitialData,
  empresaStats, portadorSaldos, centroCustoStats,
});
