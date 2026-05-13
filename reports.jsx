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
              <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--c-border)', position: 'sticky', top: 0, zIndex: 1 }}>
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

// ----- Relatórios Consolidados -----
function RelatoriosConsolidados({ data }) {
  const toast = useToast();
  const [cruzamento, setCruzamento] = useState_L('portador-empresa');
  const empMap = Object.fromEntries(data.empresas.map(e => [e.id, e]));
  const portMap = Object.fromEntries(data.portadores.map(p => [p.id, p]));

  const allLancs = useMemo_L(() => {
    const arr = [];
    data.empresas.forEach(e => (data.lancamentos[e.id] || []).forEach(l => arr.push(l)));
    return arr;
  }, [data]);

  // Histórico mensal de todas as empresas
  const meses = useMemo_L(() => {
    const arr = [...new Set(allLancs.map(l => l.competencia))];
    return arr.sort((a, b) => { const [ma, ya] = a.split('/'); const [mb, yb] = b.split('/'); return (ya + ma).localeCompare(yb + mb); });
  }, [allLancs]);

  const seriesEnt = meses.map(m => allLancs.filter(l => l.competencia === m && l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0));
  const seriesSai = meses.map(m => allLancs.filter(l => l.competencia === m && l.tipo === 'saida').reduce((s, l) => s + l.valor, 0));

  // Top fornecedores/descrições saída
  const topGastos = useMemo_L(() => {
    const agg = {};
    allLancs.filter(l => l.tipo === 'saida').forEach(l => {
      agg[l.descricao] = (agg[l.descricao] || 0) + l.valor;
    });
    return Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: k, value: v }));
  }, [allLancs]);

  // Cruzamento por portador x empresa
  const tabelaCruzada = useMemo_L(() => {
    if (cruzamento === 'portador-empresa') {
      const rows = data.portadores.map(p => {
        const row = { id: p.id, label: p.nome, cells: data.empresas.map(e => {
          const lancs = (data.lancamentos[e.id] || []).filter(l => l.portadorId === p.id && l.pago);
          return lancs.reduce((s, l) => s + (l.tipo === 'entrada' ? l.valor : -l.valor), 0);
        })};
        row.total = row.cells.reduce((s, v) => s + v, 0);
        return row;
      });
      return { header: data.empresas.map(e => e.nome), rows, label: 'Portador × Empresa (saldo realizado)' };
    }
    if (cruzamento === 'centro-empresa') {
      const rows = data.centrosCusto.map(c => {
        const row = { id: c.id, label: c.nome, sub: c.tipo, cells: data.empresas.map(e => {
          return (data.lancamentos[e.id] || []).filter(l => l.centroCustoId === c.id).reduce((s, l) => s + l.valor, 0);
        })};
        row.total = row.cells.reduce((s, v) => s + v, 0);
        return row;
      });
      return { header: data.empresas.map(e => e.nome), rows, label: 'Centro de Custo × Empresa (volume total)' };
    }
    // forma-empresa
    const rows = data.formasPagamento.map(f => {
      const row = { id: f, label: f, cells: data.empresas.map(e => {
        return (data.lancamentos[e.id] || []).filter(l => l.formaPagamento === f).reduce((s, l) => s + l.valor, 0);
      })};
      row.total = row.cells.reduce((s, v) => s + v, 0);
      return row;
    });
    return { header: data.empresas.map(e => e.nome), rows, label: 'Forma de Pagamento × Empresa' };
  }, [cruzamento, data]);

  return (
    <div style={{ padding: 28, maxWidth: 1500, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Relatórios Consolidados</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Análises Cruzadas</h1>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>Cruze portadores, centros de custo, formas de pagamento e empresas</div>
        </div>
        <Btn variant="primary" icon="download" onClick={() => { exportConsolidadoXLSX(data.empresas, data.lancamentos, data.portadores, data.centrosCusto); toast.push('Relatório consolidado gerado'); }}>
          Exportar Consolidado (4 abas)
        </Btn>
      </div>

      {/* Histórico */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Histórico Financeiro Consolidado</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Todas as empresas · entradas vs saídas por competência</div>
          </div>
          <Legend items={[{ color: '#16a34a', label: 'Entradas', value: formatBRL(seriesEnt.reduce((s, v) => s + v, 0)) }, { color: '#dc2626', label: 'Saídas', value: formatBRL(seriesSai.reduce((s, v) => s + v, 0)) }]} />
        </div>
        <LineChart
          series={[
            { name: 'Entradas', color: '#16a34a', points: seriesEnt },
            { name: 'Saídas', color: '#dc2626', points: seriesSai },
          ]}
          labels={meses}
          height={240}
        />
      </Card>

      {/* Top gastos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginBottom: 14 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Top 8 Categorias de Gasto</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 18 }}>Onde mais saiu dinheiro (todas empresas)</div>
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
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, #fecaca, #ef4444)`, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Resumo por Empresa</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 14 }}>Saldo realizado por cliente</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {data.empresas.map(e => {
              const stats = empresaStats(e, data.lancamentos[e.id] || [], todayISO());
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Tabela Cruzada — {tabelaCruzada.label}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Selecione o cruzamento para análise</div>
          </div>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
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
              <tr style={{ background: '#fafafa' }}>
                <th style={{ ...th, position: 'sticky', left: 0, background: '#fafafa', zIndex: 2 }}>Item</th>
                {tabelaCruzada.header.map((h, i) => (
                  <th key={i} style={{ ...th, textAlign: 'right', minWidth: 110 }}>{h}</th>
                ))}
                <th style={{ ...th, textAlign: 'right', background: '#f1f5f9' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {tabelaCruzada.rows.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={{ ...td, fontWeight: 600, position: 'sticky', left: 0, background: '#fff', zIndex: 1 }}>
                    {r.label}
                    {r.sub && <div style={{ fontSize: 10, color: 'var(--c-text-muted)', textTransform: 'capitalize' }}>{r.sub}</div>}
                  </td>
                  {r.cells.map((v, i) => (
                    <td key={i} style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: v === 0 ? '#cbd5e1' : v < 0 ? '#dc2626' : 'var(--c-text)' }}>
                      {v === 0 ? '—' : formatBRL(v).replace('R$', '').trim()}
                    </td>
                  ))}
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', background: '#fafafa' }}>{formatBRL(r.total).replace('R$', '').trim()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { LancamentosGlobais, RelatoriosConsolidados });
