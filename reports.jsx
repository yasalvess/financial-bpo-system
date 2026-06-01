// Lançamentos globais + Relatórios consolidados
const { useState: useState_L, useMemo: useMemo_L } = React;

function LancamentosGlobais({ data, onOpenEmpresa }) {
  const [filtros, setFiltros] = useState_L({
    empresa: 'todas', tipo: 'todos', status: 'todos', portador: 'todos',
    centroCusto: 'todos', formaPgto: 'todos', dataIni: '', dataFim: '', busca: ''
  });
  const toast = useToast();
  const hoje = todayISO();

  const empMap = Object.fromEntries(data.empresas.map(e => [e.id, e]));
  const portMap = Object.fromEntries(data.portadores.map(p => [p.id, p]));
  const ccMap = Object.fromEntries(data.centrosCusto.map(c => [c.id, c]));

  const todos = useMemo_L(() => {
    const arr = [];
    data.empresas.forEach(e => {
      (data.lancamentos[e.id] || []).forEach(l => arr.push({ ...l, empresaNome: e.nome }));
    });
    return arr;
  }, [data]);

  const filtrados = todos.filter(l => {
    if (filtros.empresa !== 'todas' && l.empresaId !== filtros.empresa) return false;
    if (filtros.tipo !== 'todos' && l.tipo !== filtros.tipo) return false;
    if (filtros.portador !== 'todos' && l.portadorId !== filtros.portador) return false;
    if (filtros.centroCusto !== 'todos' && l.centroCustoId !== filtros.centroCusto) return false;
    if (filtros.formaPgto !== 'todos' && l.formaPagamento !== filtros.formaPgto) return false;
    if (filtros.dataIni && l.vencimento < filtros.dataIni) return false;
    if (filtros.dataFim && l.vencimento > filtros.dataFim) return false;
    if (filtros.busca && !l.descricao.toLowerCase().includes(filtros.busca.toLowerCase())) return false;
    if (filtros.status !== 'todos' && lancStatus(l, hoje) !== filtros.status) return false;
    return true;
  }).sort((a, b) => b.vencimento.localeCompare(a.vencimento));

  return (
    <div style={{ padding: 28, maxWidth: 1500, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Lançamentos</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Todos os Lançamentos</h1>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>Visão consolidada de {todos.length} lançamentos em {data.empresas.length} empresas</div>
        </div>
        <Btn variant="primary" icon="download" onClick={() => { exportConsolidadoXLSX(data.empresas, data.lancamentos, data.portadores, data.centrosCusto); toast.push('Excel consolidado gerado'); }}>
          Exportar Excel
        </Btn>
      </div>

      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 8, alignItems: 'end' }}>
          <Field label="Buscar"><Input value={filtros.busca} onChange={e => setFiltros({ ...filtros, busca: e.target.value })} placeholder="Descrição..." /></Field>
          <Field label="Empresa"><Select value={filtros.empresa} onChange={e => setFiltros({ ...filtros, empresa: e.target.value })}>
            <option value="todas">Todas</option>
            {data.empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </Select></Field>
          <Field label="Tipo"><Select value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
            <option value="todos">Todos</option><option value="entrada">Entradas</option><option value="saida">Saídas</option>
          </Select></Field>
          <Field label="Status"><Select value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
            <option value="todos">Todos</option><option value="pago">Pago</option><option value="em-dia">Em dia</option><option value="vencendo">Vencendo</option><option value="vencido">Vencido</option>
          </Select></Field>
          <Field label="Portador"><Select value={filtros.portador} onChange={e => setFiltros({ ...filtros, portador: e.target.value })}>
            <option value="todos">Todos</option>{data.portadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Select></Field>
          <Field label="Centro Custo"><Select value={filtros.centroCusto} onChange={e => setFiltros({ ...filtros, centroCusto: e.target.value })}>
            <option value="todos">Todos</option>{data.centrosCusto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select></Field>
          <Field label="De"><Input type="date" value={filtros.dataIni} onChange={e => setFiltros({ ...filtros, dataIni: e.target.value })} /></Field>
          <Field label="Até"><Input type="date" value={filtros.dataFim} onChange={e => setFiltros({ ...filtros, dataFim: e.target.value })} /></Field>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        <Stat label="Lançamentos" v={filtrados.length} />
        <Stat label="Total Entradas" v={formatBRL(filtrados.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0))} color="#16a34a" />
        <Stat label="Total Saídas" v={formatBRL(filtrados.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0))} color="#dc2626" />
        <Stat label="Vencidos" v={filtrados.filter(l => lancStatus(l, hoje) === 'vencido').length} color="#dc2626" />
      </div>

      <Card padding={0}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 480px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={th}>Empresa</th>
                <th style={th}>Vencimento</th>
                <th style={th}>Descrição</th>
                <th style={th}>Tipo</th>
                <th style={th}>Centro Custo</th>
                <th style={th}>Portador</th>
                <th style={{ ...th, textAlign: 'right' }}>Valor</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(l => {
                const s = lancStatus(l, hoje);
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--c-border)', cursor: 'pointer' }} onClick={() => onOpenEmpresa(l.empresaId)}>
                    <td style={td}><strong style={{ fontSize: 12 }}>{l.empresaNome}</strong></td>
                    <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{formatDate(l.vencimento)}</td>
                    <td style={{ ...td, maxWidth: 280 }}>{l.descricao}</td>
                    <td style={td}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: l.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                        {l.tipo === 'entrada' ? '↓ Entrada' : '↑ Saída'}
                      </span>
                    </td>
                    <td style={{ ...td, color: 'var(--c-text-muted)' }}>{ccMap[l.centroCustoId]?.nome}</td>
                    <td style={td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: portMap[l.portadorId]?.cor }} />
                        {portMap[l.portadorId]?.nome}
                      </span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: l.tipo === 'entrada' ? '#16a34a' : 'var(--c-text)' }}>
                      {l.tipo === 'saida' && '-'}{formatBRL(l.valor)}
                    </td>
                    <td style={td}><Badge status={s} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && <EmptyState icon="list" title="Sem lançamentos" hint="Nenhum lançamento bate com os filtros aplicados." />}
      </Card>
    </div>
  );
}

function Stat({ label, v, color = 'var(--c-text)' }) {
  return (
    <Card padding={14}>
      <div style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{v}</div>
    </Card>
  );
}

// Calcula o intervalo de datas [iniISO, fimISO] a partir do filtro de período
function periodoRange(periodo, dataIni, dataFim) {
  if (periodo === 'custom') return [dataIni || '0000-01-01', dataFim || '9999-12-31'];
  const qtd = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }[periodo] ?? 6;
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth() - (qtd - 1), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); // último dia do mês corrente
  const iso = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  return [iso(start), iso(end)];
}

// Lista de meses {label, comp} dentro de um intervalo ISO
function mesesEntre(iniISO, fimISO) {
  const arr = [];
  const start = new Date((iniISO || '2000-01-01') + 'T00:00:00');
  const end = new Date((fimISO || '2000-01-01') + 'T00:00:00');
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  let guard = 0;
  while (cur <= last && guard < 240) {
    arr.push({
      label: cur.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(cur.getFullYear()).slice(2),
      comp: `${String(cur.getMonth() + 1).padStart(2, '0')}/${cur.getFullYear()}`
    });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    guard++;
  }
  return arr;
}

// ----- Relatórios Consolidados -----
function RelatoriosConsolidados({ data }) {
  const toast = useToast();
  const hoje = todayISO();
  const [cruzamento, setCruzamento] = useState_L('portador-empresa');
  const [rankSort, setRankSort] = useState_L('saldo'); // saldo | receita | despesa | inadimplente
  const [abaRelatorio, setAbaRelatorio] = useState_L('historico');
  const [filtros, setFiltros] = useState_L({
    empresa: 'todas', periodo: '6m', tipo: 'todos', status: 'todos',
    portador: 'todos', centroCusto: 'todos', dataIni: '', dataFim: ''
  });

  const empMap = Object.fromEntries(data.empresas.map(e => [e.id, e]));
  const portMap = Object.fromEntries(data.portadores.map(p => [p.id, p]));
  const ccMap = Object.fromEntries(data.centrosCusto.map(c => [c.id, c]));

  const [rIni, rFim] = useMemo_L(() => periodoRange(filtros.periodo, filtros.dataIni, filtros.dataFim), [filtros.periodo, filtros.dataIni, filtros.dataFim]);
  const meses = useMemo_L(() => mesesEntre(rIni, rFim), [rIni, rFim]);

  // Todos os lançamentos com nome da empresa
  const allLancs = useMemo_L(() => {
    const arr = [];
    data.empresas.forEach(e => (data.lancamentos[e.id] || []).forEach(l => arr.push({ ...l, empresaNome: e.nome })));
    return arr;
  }, [data]);

  // Lançamentos após aplicar os filtros globais
  const lancs = useMemo_L(() => allLancs.filter(l => {
    if (filtros.empresa !== 'todas' && l.empresaId !== filtros.empresa) return false;
    if (filtros.tipo !== 'todos' && l.tipo !== filtros.tipo) return false;
    if (filtros.portador !== 'todos' && l.portadorId !== filtros.portador) return false;
    if (filtros.centroCusto !== 'todos' && l.centroCustoId !== filtros.centroCusto) return false;
    if (filtros.status !== 'todos' && lancStatus(l, hoje) !== filtros.status) return false;
    if (l.vencimento < rIni || l.vencimento > rFim) return false;
    return true;
  }), [allLancs, filtros, rIni, rFim, hoje]);

  // Empresas dentro do filtro + seus lançamentos filtrados
  const empresasFiltradas = useMemo_L(() => (
    filtros.empresa === 'todas' ? data.empresas : data.empresas.filter(e => e.id === filtros.empresa)
  ), [data.empresas, filtros.empresa]);
  const lancsPorEmpresa = useMemo_L(() => {
    const map = {};
    empresasFiltradas.forEach(e => map[e.id] = []);
    lancs.forEach(l => { if (map[l.empresaId]) map[l.empresaId].push(l); });
    return map;
  }, [empresasFiltradas, lancs]);

  const hasFilter = filtros.empresa !== 'todas' || filtros.periodo !== '6m' || filtros.tipo !== 'todos' || filtros.status !== 'todos' || filtros.portador !== 'todos' || filtros.centroCusto !== 'todos' || filtros.dataIni || filtros.dataFim;
  function clearFiltros() {
    setFiltros({ empresa: 'todas', periodo: '6m', tipo: 'todos', status: 'todos', portador: 'todos', centroCusto: 'todos', dataIni: '', dataFim: '' });
  }

  // Histórico por competência
  const seriesEnt = meses.map(m => lancs.filter(l => l.competencia === m.comp && l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0));
  const seriesSai = meses.map(m => lancs.filter(l => l.competencia === m.comp && l.tipo === 'saida').reduce((s, l) => s + l.valor, 0));

  // Top categorias de gasto
  const topGastos = useMemo_L(() => {
    const agg = {};
    lancs.filter(l => l.tipo === 'saida').forEach(l => { agg[l.descricao] = (agg[l.descricao] || 0) + l.valor; });
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: k, value: v }));
  }, [lancs]);

  // Fluxo de caixa projetado (lançamentos não pagos por competência)
  const fluxoProjetado = useMemo_L(() => meses.map(m => {
    const naoPagos = lancs.filter(l => l.competencia === m.comp && !l.pago);
    const aReceber = naoPagos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
    const aPagar = naoPagos.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);
    return { label: m.label, aReceber, aPagar, saldo: aReceber - aPagar };
  }), [meses, lancs]);
  const totProjReceber = fluxoProjetado.reduce((s, m) => s + m.aReceber, 0);
  const totProjPagar = fluxoProjetado.reduce((s, m) => s + m.aPagar, 0);
  const maxFluxo = Math.max(1, ...fluxoProjetado.map(m => Math.max(m.aReceber, m.aPagar)));

  // Análise por forma de pagamento
  const formasAnalise = useMemo_L(() => {
    const rows = data.formasPagamento.map(f => {
      const ls = lancs.filter(l => l.formaPagamento === f);
      const entradas = ls.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
      const saidas = ls.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);
      return { forma: f, entradas, saidas, total: entradas + saidas };
    }).filter(r => r.total > 0).sort((a, b) => b.total - a.total);
    const totalGeral = rows.reduce((s, r) => s + r.total, 0);
    return { rows, totalGeral };
  }, [lancs, data.formasPagamento]);

  // Inadimplência: lançamentos vencidos (não pagos)
  const vencidos = useMemo_L(() => lancs
    .filter(l => !l.pago && lancStatus(l, hoje) === 'vencido')
    .map(l => ({ ...l, diasAtraso: daysBetween(l.vencimento, hoje) }))
    .sort((a, b) => b.diasAtraso - a.diasAtraso), [lancs, hoje]);
  const totalVencido = vencidos.reduce((s, l) => s + l.valor, 0);
  const empresaMaisInadimplente = useMemo_L(() => {
    const agg = {};
    vencidos.forEach(l => { agg[l.empresaNome] = (agg[l.empresaNome] || 0) + l.valor; });
    const top = Object.entries(agg).sort((a, b) => b[1] - a[1])[0];
    return top ? { nome: top[0], valor: top[1] } : null;
  }, [vencidos]);

  // Ranking de empresas (sobre lançamentos filtrados)
  const ranking = useMemo_L(() => {
    const arr = empresasFiltradas.map(e => {
      const st = empresaStats(e, lancsPorEmpresa[e.id] || [], hoje);
      return { ...e, st };
    });
    const keys = {
      saldo: (x) => x.st.saldo,
      receita: (x) => x.st.recebido,
      despesa: (x) => x.st.pago,
      inadimplente: (x) => x.st.vencidos,
    };
    const k = keys[rankSort] || keys.saldo;
    return [...arr].sort((a, b) => k(b) - k(a));
  }, [empresasFiltradas, lancsPorEmpresa, hoje, rankSort]);

  // Tabela cruzada (sobre lançamentos filtrados)
  const tabelaCruzada = useMemo_L(() => {
    const header = empresasFiltradas.map(e => e.nome);
    if (cruzamento === 'portador-empresa') {
      const rows = data.portadores.map(p => {
        const cells = empresasFiltradas.map(e => (lancsPorEmpresa[e.id] || []).filter(l => l.portadorId === p.id && l.pago).reduce((s, l) => s + (l.tipo === 'entrada' ? l.valor : -l.valor), 0));
        return { id: p.id, label: p.nome, cells, total: cells.reduce((s, v) => s + v, 0) };
      });
      return { header, rows, label: 'Portador × Empresa (saldo realizado)' };
    }
    if (cruzamento === 'centro-empresa') {
      const rows = data.centrosCusto.map(c => {
        const cells = empresasFiltradas.map(e => (lancsPorEmpresa[e.id] || []).filter(l => l.centroCustoId === c.id).reduce((s, l) => s + l.valor, 0));
        return { id: c.id, label: c.nome, sub: c.tipo, cells, total: cells.reduce((s, v) => s + v, 0) };
      });
      return { header, rows, label: 'Centro de Custo × Empresa (volume total)' };
    }
    const rows = data.formasPagamento.map(f => {
      const cells = empresasFiltradas.map(e => (lancsPorEmpresa[e.id] || []).filter(l => l.formaPagamento === f).reduce((s, l) => s + l.valor, 0));
      return { id: f, label: f, cells, total: cells.reduce((s, v) => s + v, 0) };
    });
    return { header, rows, label: 'Forma de Pagamento × Empresa' };
  }, [cruzamento, empresasFiltradas, lancsPorEmpresa, data.portadores, data.centrosCusto, data.formasPagamento]);

  const rankCols = [
    { v: 'receita', label: 'Maior receita' },
    { v: 'despesa', label: 'Maior despesa' },
    { v: 'saldo', label: 'Maior saldo' },
    { v: 'inadimplente', label: 'Mais inadimplente' },
  ];

  const abasRelatorio = [
    { id: 'historico', label: 'Histórico Financeiro' },
    { id: 'fluxo', label: 'Fluxo de Caixa' },
    { id: 'formas', label: 'Formas de Pagamento' },
    { id: 'inadimplencia', label: 'Inadimplência' },
    { id: 'ranking', label: 'Ranking de Empresas' },
    { id: 'cruzadas', label: 'Análises Cruzadas' },
  ];

  // Exporta apenas os dados da aba ativa, com nome de arquivo correspondente
  function exportAbaRelatorio() {
    const wb = XLSX.utils.book_new();
    let aoa, nome, sheetName;
    if (abaRelatorio === 'historico') {
      const totE = seriesEnt.reduce((s, v) => s + v, 0), totS = seriesSai.reduce((s, v) => s + v, 0);
      aoa = [['Competência', 'Entradas', 'Saídas', 'Resultado']];
      meses.forEach((m, i) => aoa.push([m.comp, seriesEnt[i], seriesSai[i], seriesEnt[i] - seriesSai[i]]));
      aoa.push(['TOTAL', totE, totS, totE - totS]);
      nome = 'Historico_Financeiro.xlsx'; sheetName = 'Histórico';
    } else if (abaRelatorio === 'fluxo') {
      aoa = [['Mês', 'Entradas previstas', 'Saídas previstas', 'Saldo projetado']];
      fluxoProjetado.forEach(m => aoa.push([m.label, m.aReceber, m.aPagar, m.saldo]));
      aoa.push(['TOTAL', totProjReceber, totProjPagar, totProjReceber - totProjPagar]);
      nome = 'Fluxo_de_Caixa.xlsx'; sheetName = 'Fluxo Projetado';
    } else if (abaRelatorio === 'formas') {
      aoa = [['Forma', 'Entradas', 'Saídas', 'Total', '% do total']];
      formasAnalise.rows.forEach(r => aoa.push([r.forma, r.entradas, r.saidas, r.total, formasAnalise.totalGeral > 0 ? +(r.total / formasAnalise.totalGeral * 100).toFixed(1) : 0]));
      nome = 'Formas_de_Pagamento.xlsx'; sheetName = 'Formas Pgto';
    } else if (abaRelatorio === 'inadimplencia') {
      aoa = [['Empresa', 'Descrição', 'Vencimento', 'Dias em atraso', 'Valor', 'Portador']];
      vencidos.forEach(l => aoa.push([l.empresaNome, l.descricao, formatDate(l.vencimento), l.diasAtraso, l.valor, portMap[l.portadorId]?.nome || '']));
      nome = 'Inadimplencia.xlsx'; sheetName = 'Inadimplência';
    } else if (abaRelatorio === 'ranking') {
      aoa = [['Posição', 'Empresa', 'Segmento', 'Recebido', 'Pago', 'Saldo', 'Vencidos', 'Status']];
      ranking.forEach((e, i) => aoa.push([i + 1, e.nome, e.segmento, e.st.recebido, e.st.pago, e.st.saldo, e.st.vencidos, (statusColor(e.st.statusEmpresa) || {}).label || e.st.statusEmpresa]));
      nome = 'Ranking_de_Empresas.xlsx'; sheetName = 'Ranking';
    } else {
      aoa = [['Item', ...tabelaCruzada.header, 'TOTAL']];
      tabelaCruzada.rows.forEach(r => aoa.push([r.label, ...r.cells, r.total]));
      nome = 'Analises_Cruzadas.xlsx'; sheetName = 'Cruzada';
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), sheetName.slice(0, 31));
    XLSX.writeFile(wb, nome);
    toast.push(nome + ' gerado');
  }

  return (
    <div style={{ padding: 28, maxWidth: 1500, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Relatórios Consolidados</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Análises & Indicadores</h1>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>Fluxo projetado, formas de pagamento, inadimplência, ranking e cruzamentos</div>
        </div>
        <Btn variant="primary" icon="download" onClick={exportAbaRelatorio}>
          Exportar XLSX
        </Btn>
      </div>

      {/* Filtros globais */}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr) auto', gap: 8, alignItems: 'end' }}>
          <Field label="Empresa">
            <Select value={filtros.empresa} onChange={e => setFiltros({ ...filtros, empresa: e.target.value })}>
              <option value="todas">Todas</option>
              {data.empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </Select>
          </Field>
          <Field label="Período">
            <Select value={filtros.periodo} onChange={e => setFiltros({ ...filtros, periodo: e.target.value })}>
              <option value="1m">1 mês</option>
              <option value="3m">3 meses</option>
              <option value="6m">6 meses</option>
              <option value="12m">12 meses</option>
              <option value="custom">Personalizado</option>
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
              <option value="todos">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
              <option value="todos">Todos</option>
              <option value="pago">Pago</option>
              <option value="em-dia">Em dia</option>
              <option value="vencendo">Vencendo</option>
              <option value="vencido">Vencido</option>
            </Select>
          </Field>
          <Field label="Portador">
            <Select value={filtros.portador} onChange={e => setFiltros({ ...filtros, portador: e.target.value })}>
              <option value="todos">Todos</option>
              {data.portadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Select>
          </Field>
          <Field label="Centro de Custo">
            <Select value={filtros.centroCusto} onChange={e => setFiltros({ ...filtros, centroCusto: e.target.value })}>
              <option value="todos">Todos</option>
              {data.centrosCusto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </Field>
          {hasFilter && <Btn variant="ghost" size="sm" onClick={clearFiltros}>Limpar</Btn>}
        </div>
        {filtros.periodo === 'custom' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, maxWidth: 360 }}>
            <Field label="De"><Input type="date" value={filtros.dataIni} onChange={e => setFiltros({ ...filtros, dataIni: e.target.value })} /></Field>
            <Field label="Até"><Input type="date" value={filtros.dataFim} onChange={e => setFiltros({ ...filtros, dataFim: e.target.value })} /></Field>
          </div>
        )}
      </Card>

      {/* Abas de navegação por seção */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--c-border)', marginBottom: 20, overflowX: 'auto', gap: 0 }}>
        {abasRelatorio.map(a => (
          <button key={a.id} onClick={() => setAbaRelatorio(a.id)} style={{
            padding: '10px 18px', border: 'none', background: 'transparent',
            borderBottom: abaRelatorio === a.id ? '2px solid var(--c-primary)' : '2px solid transparent',
            color: abaRelatorio === a.id ? 'var(--c-primary)' : 'var(--c-text-muted)',
            fontWeight: abaRelatorio === a.id ? 600 : 400,
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
            whiteSpace: 'nowrap', marginBottom: -1, flexShrink: 0,
            transition: 'color 0.12s'
          }}
            onMouseEnter={e => { if (abaRelatorio !== a.id) e.currentTarget.style.color = 'var(--c-text)'; }}
            onMouseLeave={e => { if (abaRelatorio !== a.id) e.currentTarget.style.color = 'var(--c-text-muted)'; }}
          >{a.label}</button>
        ))}
      </div>

      {/* Histórico */}
      {abaRelatorio === 'historico' && (
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Histórico Financeiro Consolidado</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Entradas vs saídas por competência · {meses.length} {meses.length === 1 ? 'mês' : 'meses'}</div>
          </div>
          <Legend items={[{ color: '#16a34a', label: 'Entradas', value: formatBRL(seriesEnt.reduce((s, v) => s + v, 0)) }, { color: '#dc2626', label: 'Saídas', value: formatBRL(seriesSai.reduce((s, v) => s + v, 0)) }]} />
        </div>
        <LineChart
          series={[
            { name: 'Entradas', color: '#16a34a', points: seriesEnt },
            { name: 'Saídas', color: '#dc2626', points: seriesSai },
          ]}
          labels={meses.map(m => m.label)}
          height={240}
        />
      </Card>
      )}

      {/* Fluxo de Caixa Projetado */}
      {abaRelatorio === 'fluxo' && (
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Fluxo de Caixa Projetado</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Previsto a partir de lançamentos ainda não pagos</div>
          </div>
          <Legend items={[
            { color: '#16a34a', label: 'A receber', value: formatBRL(totProjReceber) },
            { color: '#dc2626', label: 'A pagar', value: formatBRL(totProjPagar) },
          ]} />
        </div>
        {/* Mini gráfico de barras por mês */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150, padding: '0 4px 8px', borderBottom: '1px solid var(--c-border)', marginBottom: 12 }}>
          {fluxoProjetado.map((m, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%', width: '100%', justifyContent: 'center' }}>
                <div title={`A receber: ${formatBRL(m.aReceber)}`} style={{ width: 12, height: `${(m.aReceber / maxFluxo) * 100}%`, background: '#16a34a', borderRadius: '3px 3px 0 0', minHeight: m.aReceber > 0 ? 2 : 0 }} />
                <div title={`A pagar: ${formatBRL(m.aPagar)}`} style={{ width: 12, height: `${(m.aPagar / maxFluxo) * 100}%`, background: '#dc2626', borderRadius: '3px 3px 0 0', minHeight: m.aPagar > 0 ? 2 : 0 }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}>{m.label}</div>
            </div>
          ))}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
              <th style={th}>Mês</th>
              <th style={{ ...th, textAlign: 'right' }}>Entradas previstas</th>
              <th style={{ ...th, textAlign: 'right' }}>Saídas previstas</th>
              <th style={{ ...th, textAlign: 'right' }}>Saldo projetado</th>
            </tr>
          </thead>
          <tbody>
            {fluxoProjetado.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--c-border)' }}>
                <td style={td}><strong>{m.label}</strong></td>
                <td style={{ ...td, textAlign: 'right', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(m.aReceber)}</td>
                <td style={{ ...td, textAlign: 'right', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(m.aPagar)}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: m.saldo >= 0 ? '#16a34a' : '#dc2626' }}>{formatBRL(m.saldo)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--c-bg)' }}>
              <td style={{ ...td, fontWeight: 700 }}>TOTAL</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(totProjReceber)}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(totProjPagar)}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: (totProjReceber - totProjPagar) >= 0 ? '#16a34a' : '#dc2626' }}>{formatBRL(totProjReceber - totProjPagar)}</td>
            </tr>
          </tfoot>
        </table>
        {fluxoProjetado.every(m => m.aReceber === 0 && m.aPagar === 0) && (
          <div style={{ padding: '16px 0 0', textAlign: 'center', fontSize: 13, color: 'var(--c-text-muted)' }}>Nenhum lançamento previsto no período.</div>
        )}
      </Card>
      )}

      {/* Análise por Forma de Pagamento */}
      {abaRelatorio === 'formas' && (
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Análise por Forma de Pagamento</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 16 }}>Volume total movimentado por meio de pagamento</div>
        {formasAnalise.rows.length === 0 ? (
          <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--c-text-muted)' }}>Sem movimentações no período.</div>
        ) : (
          <>
            {/* Barras horizontais */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {formasAnalise.rows.map((r, i) => {
                const pct = (r.total / formasAnalise.rows[0].total) * 100;
                return (
                  <div key={r.forma}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{r.forma}</span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(r.total)}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--c-bg)', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--c-primary)', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <th style={th}>Forma</th>
                  <th style={{ ...th, textAlign: 'right' }}>Entradas</th>
                  <th style={{ ...th, textAlign: 'right' }}>Saídas</th>
                  <th style={{ ...th, textAlign: 'right' }}>Total</th>
                  <th style={{ ...th, textAlign: 'right' }}>% do total</th>
                </tr>
              </thead>
              <tbody>
                {formasAnalise.rows.map(r => (
                  <tr key={r.forma} style={{ borderBottom: '1px solid var(--c-border)' }}>
                    <td style={td}><strong>{r.forma}</strong></td>
                    <td style={{ ...td, textAlign: 'right', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(r.entradas)}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(r.saidas)}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(r.total)}</td>
                    <td style={{ ...td, textAlign: 'right', color: 'var(--c-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{formasAnalise.totalGeral > 0 ? ((r.total / formasAnalise.totalGeral) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
      )}

      {/* Inadimplência e Vencimentos */}
      {abaRelatorio === 'inadimplencia' && (
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Inadimplência e Vencimentos</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 16 }}>Títulos vencidos e não pagos no período</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          <KPI label="Total Vencido" value={formatBRL(totalVencido)} icon="alert" color="#dc2626" />
          <KPI label="Títulos Vencidos" value={vencidos.length} icon="receipt" color="#f59e0b" />
          <KPI label="Mais Inadimplente" value={empresaMaisInadimplente ? empresaMaisInadimplente.nome : '—'} icon="building" color="var(--c-primary)" sub={empresaMaisInadimplente ? formatBRL(empresaMaisInadimplente.valor) : 'Sem inadimplência'} />
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                <th style={th}>Empresa</th>
                <th style={th}>Descrição</th>
                <th style={th}>Vencimento</th>
                <th style={{ ...th, textAlign: 'right' }}>Dias em atraso</th>
                <th style={{ ...th, textAlign: 'right' }}>Valor</th>
                <th style={th}>Portador</th>
              </tr>
            </thead>
            <tbody>
              {vencidos.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={td}><strong style={{ fontSize: 12 }}>{l.empresaNome}</strong></td>
                  <td style={{ ...td, maxWidth: 260 }}>{l.descricao}</td>
                  <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{formatDate(l.vencimento)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{l.diasAtraso}</span>
                    <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}> dias</span>
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(l.valor)}</td>
                  <td style={td}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: portMap[l.portadorId]?.cor }} />
                      {portMap[l.portadorId]?.nome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {vencidos.length === 0 && <EmptyState icon="check" title="Sem inadimplência" hint="Nenhum título vencido em aberto para os filtros aplicados." />}
      </Card>
      )}

      {/* Ranking de Empresas */}
      {abaRelatorio === 'ranking' && (
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Ranking de Empresas</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Ordenado por: {rankCols.find(c => c.v === rankSort)?.label}</div>
          </div>
          <div style={{ display: 'flex', background: 'var(--c-bg)', borderRadius: 8, padding: 3 }}>
            {rankCols.map(o => (
              <button key={o.v} onClick={() => setRankSort(o.v)} style={{
                padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                background: rankSort === o.v ? '#fff' : 'transparent',
                color: rankSort === o.v ? 'var(--c-primary)' : 'var(--c-text-muted)',
                fontWeight: 600, fontSize: 12, fontFamily: 'inherit',
                boxShadow: rankSort === o.v ? '0 1px 2px rgba(0,0,0,.06)' : 'none'
              }}>{o.label}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                <th style={{ ...th, textAlign: 'center', width: 50 }}>#</th>
                <th style={th}>Empresa</th>
                <th style={th}>Segmento</th>
                <th style={{ ...th, textAlign: 'right' }}>Recebido</th>
                <th style={{ ...th, textAlign: 'right' }}>Pago</th>
                <th style={{ ...th, textAlign: 'right' }}>Saldo</th>
                <th style={{ ...th, textAlign: 'right' }}>Vencidos</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: i < 3 ? 'var(--c-primary)' : 'var(--c-text-muted)' }}>{i + 1}º</td>
                  <td style={td}><strong>{e.nome}</strong></td>
                  <td style={{ ...td, color: 'var(--c-text-muted)' }}>{e.segmento}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(e.st.recebido)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(e.st.pago)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: e.st.saldo >= 0 ? '#16a34a' : '#dc2626' }}>{formatBRL(e.st.saldo)}</td>
                  <td style={{ ...td, textAlign: 'right', color: e.st.vencidos > 0 ? '#dc2626' : 'var(--c-text-muted)', fontWeight: e.st.vencidos > 0 ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(e.st.vencidos)}</td>
                  <td style={td}><Badge status={e.st.statusEmpresa} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ranking.length === 0 && <EmptyState icon="building" title="Sem empresas" hint="Nenhuma empresa para os filtros aplicados." />}
      </Card>
      )}

      {/* Análises Cruzadas: Top categorias + Resumo + Tabela cruzada */}
      {abaRelatorio === 'cruzadas' && (
      <>
      {/* Top gastos + Resumo por empresa */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 14 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Top 8 Categorias de Gasto</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 18 }}>Onde mais saiu dinheiro (filtros aplicados)</div>
          {topGastos.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Sem saídas no período.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topGastos.map((g, i) => {
                const max = topGastos[0].value;
                const pct = (g.value / max) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <span style={{ fontWeight: 500 }}>{g.label}</span>
                      <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(g.value)}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--c-bg)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #fecaca, #ef4444)`, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Resumo por Empresa</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 14 }}>Saldo realizado por cliente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {empresasFiltradas.map(e => {
              const stats = empresaStats(e, lancsPorEmpresa[e.id] || [], hoje);
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--c-border)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--c-primary-soft)', color: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>{e.nome.charAt(0)}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nome}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: stats.saldo >= 0 ? '#16a34a' : '#dc2626' }}>{formatBRL(stats.saldo)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tabela cruzada */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Tabela Cruzada — {tabelaCruzada.label}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Selecione o cruzamento para análise</div>
          </div>
          <div style={{ display: 'flex', background: 'var(--c-bg)', borderRadius: 8, padding: 3 }}>
            {[
              { v: 'portador-empresa', label: 'Portador × Empresa' },
              { v: 'centro-empresa', label: 'Centro × Empresa' },
              { v: 'forma-empresa', label: 'Forma × Empresa' },
            ].map(o => (
              <button key={o.v} onClick={() => setCruzamento(o.v)} style={{
                padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                background: cruzamento === o.v ? '#fff' : 'transparent',
                color: cruzamento === o.v ? 'var(--c-primary)' : 'var(--c-text-muted)',
                fontWeight: 600, fontSize: 12, fontFamily: 'inherit',
                boxShadow: cruzamento === o.v ? '0 1px 2px rgba(0,0,0,.06)' : 'none'
              }}>{o.label}</button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--c-bg)' }}>
                <th style={{ ...th, position: 'sticky', left: 0, background: 'var(--c-bg)', zIndex: 2 }}>Item</th>
                {tabelaCruzada.header.map((h, i) => (
                  <th key={i} style={{ ...th, textAlign: 'right', minWidth: 110 }}>{h}</th>
                ))}
                <th style={{ ...th, textAlign: 'right', background: 'var(--c-bg)' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {tabelaCruzada.rows.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ ...td, fontWeight: 600, position: 'sticky', left: 0, background: 'var(--c-surface)', zIndex: 1 }}>
                    {r.label}
                    {r.sub && <div style={{ fontSize: 10, color: 'var(--c-text-muted)', textTransform: 'capitalize' }}>{r.sub}</div>}
                  </td>
                  {r.cells.map((v, i) => (
                    <td key={i} style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: v === 0 ? 'var(--c-text-muted)' : v < 0 ? '#dc2626' : 'var(--c-text)' }}>
                      {v === 0 ? '—' : formatBRL(v).replace('R$', '').trim()}
                    </td>
                  ))}
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', background: 'var(--c-bg)' }}>{formatBRL(r.total).replace('R$', '').trim()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}
    </div>
  );
}

Object.assign(window, { LancamentosGlobais, RelatoriosConsolidados });
