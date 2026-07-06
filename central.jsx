// Central de Gestão - Multi-empresa
const { useState: useState_C, useMemo: useMemo_C } = React;

function CentralGestao({ data, onOpenEmpresa, onCreateEmpresa, onDeleteEmpresa, onEditEmpresa }) {
  const isMobile = useIsMobile();
  const [busca, setBusca] = useState_C('');
  const [empresaExcluir, setEmpresaExcluir] = useState_C(null);
  const [view, setView] = useState_C('cards'); // cards | tabela
  const [dashFiltros, setDashFiltros] = useState_C({
    periodo: '6m',      // '1m' | '3m' | '6m' | '12m' | 'custom'
    segmento: 'todos',
    status: 'todos',
    dataIni: '',
    dataFim: ''
  });
  const toast = useToast();
  const hoje = todayISO();

  const empresasComStats = useMemo_C(() => {
    return data.empresas.map(e => {
      const ls = data.lancamentos[e.id] || [];
      const stats = empresaStats(e, ls, hoje);
      return { ...e, stats, qtdLanc: ls.length };
    });
  }, [data.empresas, data.lancamentos, hoje]);

  // Lista única de segmentos para o filtro
  const segmentos = useMemo_C(() => [...new Set(data.empresas.map(e => e.segmento).filter(Boolean))].sort(), [data.empresas]);

  // Empresas que entram no DASHBOARD (KPIs + charts), filtradas por segmento e status
  const dashEmpresas = useMemo_C(() => empresasComStats.filter(e =>
    (dashFiltros.segmento === 'todos' || e.segmento === dashFiltros.segmento) &&
    (dashFiltros.status === 'todos' || e.stats.statusEmpresa === dashFiltros.status)
  ), [empresasComStats, dashFiltros.segmento, dashFiltros.status]);

  const hasDashFilter = dashFiltros.periodo !== '6m' || dashFiltros.segmento !== 'todos' || dashFiltros.status !== 'todos' || dashFiltros.dataIni || dashFiltros.dataFim;
  function clearDashFiltros() {
    setDashFiltros({ periodo: '6m', segmento: 'todos', status: 'todos', dataIni: '', dataFim: '' });
  }

  // Lista de empresas (grade) — usa a toolbar própria (busca) + filtros do dashboard
  const filtradas = dashEmpresas
    .filter(e => !busca || e.nome.toLowerCase().includes(busca.toLowerCase()) || e.cnpj.includes(busca) || (e.documento && e.documento.replace(/\D/g, '').includes(busca.replace(/\D/g, ''))));

  // KPIs globais (reagem aos filtros do dashboard)
  const kpiTotalEmp = dashEmpresas.length;
  const kpiVencidas = dashEmpresas.filter(e => e.stats.statusEmpresa === 'vencido').length;
  const kpiVencendo = dashEmpresas.filter(e => e.stats.statusEmpresa === 'vencendo').length;
  const kpiEmDia = dashEmpresas.filter(e => e.stats.statusEmpresa === 'em-dia').length;
  const totalReceber = dashEmpresas.reduce((s, e) => s + e.stats.aReceber, 0);
  const totalPagar = dashEmpresas.reduce((s, e) => s + e.stats.aPagar, 0);
  const totalVencido = dashEmpresas.reduce((s, e) => s + e.stats.vencidos, 0);
  const saldoConsolidado = dashEmpresas.reduce((s, e) => s + e.stats.saldo, 0);

  // Charts data
  const statusDist = [
    { label: 'Em dia', value: kpiEmDia, color: '#3b82f6' },
    { label: 'Vencendo', value: kpiVencendo, color: '#f59e0b' },
    { label: 'Vencido', value: kpiVencidas, color: '#ef4444' },
  ];

  // Entradas x Saídas — período selecionado no filtro
  const meses = useMemo_C(() => {
    const arr = [];
    if (dashFiltros.periodo === 'custom' && dashFiltros.dataIni && dashFiltros.dataFim) {
      const start = new Date(dashFiltros.dataIni + 'T00:00:00');
      const end = new Date(dashFiltros.dataFim + 'T00:00:00');
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      const last = new Date(end.getFullYear(), end.getMonth(), 1);
      let guard = 0;
      while (cur <= last && guard < 120) {
        arr.push({
          label: cur.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          comp: `${String(cur.getMonth() + 1).padStart(2, '0')}/${cur.getFullYear()}`
        });
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        guard++;
      }
      return arr;
    }
    const qtdMeses = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }[dashFiltros.periodo] ?? 6;
    const d = new Date();
    for (let i = qtdMeses - 1; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      arr.push({
        label: dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        comp: `${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
      });
    }
    return arr;
  }, [dashFiltros.periodo, dashFiltros.dataIni, dashFiltros.dataFim]);
  const seriesData = useMemo_C(() => {
    const allLancs = dashEmpresas.flatMap(e => data.lancamentos[e.id] || []);
    const ent = meses.map(m => allLancs.filter(l => l.competencia === m.comp && l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0));
    const sai = meses.map(m => allLancs.filter(l => l.competencia === m.comp && l.tipo === 'saida').reduce((s, l) => s + l.valor, 0));
    return [
      { name: 'Entradas', color: '#16a34a', points: ent },
      { name: 'Saídas', color: '#dc2626', points: sai },
    ];
  }, [dashEmpresas, meses, data.lancamentos]);

  return (
    <div style={{ padding: 28, maxWidth: 1500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Central de Gestão</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Visão Geral de Empresas</h1>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginTop: 6 }}>Gerencie suas {data.empresas.length} empresas em um só lugar</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" icon="download" onClick={() => exportConsolidadoXLSX(data.empresas, data.lancamentos, data.portadores, data.centrosCusto)}>
            Exportar Consolidado
          </Btn>
          <Btn variant="primary" icon="plus" onClick={() => onCreateEmpresa()}>Nova Empresa</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <KPI label="Empresas Cadastradas" value={kpiTotalEmp} icon="building" color="var(--c-primary)" sub={`${kpiEmDia} em dia, ${kpiVencendo + kpiVencidas} com pendências`} />
        <KPI label="A Receber" value={formatBRL(totalReceber)} icon="arrowDown" color="#16a34a" sub={`${empresasComStats.reduce((s, e) => s + (data.lancamentos[e.id] || []).filter(l => l.tipo === 'entrada' && !l.pago).length, 0)} lançamentos`} />
        <KPI label="A Pagar" value={formatBRL(totalPagar)} icon="arrowUp" color="#dc2626" sub={`${empresasComStats.reduce((s, e) => s + (data.lancamentos[e.id] || []).filter(l => l.tipo === 'saida' && !l.pago).length, 0)} lançamentos`} />
        <KPI label="Saldo Consolidado" value={formatBRL(saldoConsolidado)} icon="wallet" color={saldoConsolidado >= 0 ? '#16a34a' : '#dc2626'} sub="Realizado (pago/recebido)" />
      </div>

      {/* Barra de filtros do dashboard */}
      <Card padding={12} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Icon name="filter" size={15} color="var(--c-text-muted)" />
          <Field label="Período" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 0 auto' }}>
            <CustomSelect value={dashFiltros.periodo} onChange={e => setDashFiltros({ ...dashFiltros, periodo: e.target.value })} style={{ minWidth: isMobile ? 0 : 140 }} options={[
              { value: "1m", label: "1 mês" },
              { value: "3m", label: "3 meses" },
              { value: "6m", label: "6 meses" },
              { value: "12m", label: "12 meses" },
              { value: "custom", label: "Personalizado" }
            ]} />
          </Field>
          {dashFiltros.periodo === 'custom' && (
            <>
              <Field label="De" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 0 auto' }}><DateInput value={dashFiltros.dataIni} onChange={e => setDashFiltros({ ...dashFiltros, dataIni: e.target.value })} /></Field>
              <Field label="Até" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 0 auto' }}><DateInput value={dashFiltros.dataFim} onChange={e => setDashFiltros({ ...dashFiltros, dataFim: e.target.value })} /></Field>
            </>
          )}
          <Field label="Segmento" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 0 auto' }}>
            <CustomSelect value={dashFiltros.segmento} onChange={e => setDashFiltros({ ...dashFiltros, segmento: e.target.value })} style={{ minWidth: isMobile ? 0 : 140 }} options={[
              { value: "todos", label: "Todos" },
              ...segmentos.map(s => ({ value: s, label: s }))
            ]} />
          </Field>
          <Field label="Status" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 0 auto' }}>
            <CustomSelect value={dashFiltros.status} onChange={e => setDashFiltros({ ...dashFiltros, status: e.target.value })} style={{ minWidth: isMobile ? 0 : 140 }} options={[
              { value: "todos", label: "Todos" },
              { value: "em-dia", label: "Em dia" },
              { value: "vencendo", label: "Vencendo" },
              { value: "vencido", label: "Vencido" }
            ]} />
          </Field>
          {hasDashFilter && <Btn variant="ghost" size="sm" onClick={clearDashFiltros}>Limpar filtros</Btn>}
        </div>
      </Card>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 12, marginBottom: 24 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Entradas vs Saídas</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{meses.length} {meses.length === 1 ? 'mês' : 'meses'} · {dashFiltros.segmento === 'todos' ? 'todas as empresas' : dashFiltros.segmento}{dashFiltros.status !== 'todos' ? ` · ${statusColor(dashFiltros.status)?.label || dashFiltros.status}` : ''}</div>
            </div>
            <Legend items={[{ color: '#16a34a', label: 'Entradas' }, { color: '#dc2626', label: 'Saídas' }]} />
          </div>
          <LineChart series={seriesData} labels={meses.map(m => m.label)} height={220} />
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Status das Empresas</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 14 }}>Distribuição por situação financeira</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <DonutChart data={statusDist} size={150} thickness={22} centerLabel="Total" centerValue={kpiTotalEmp} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {statusDist.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 13, flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Alert de vencidos */}
      {totalVencido > 0 && (
        <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="alert" size={18} color="#dc2626" />
          <div style={{ flex: 1, fontSize: 13 }}>
            <strong style={{ color: 'var(--c-red-fg)' }}>{kpiVencidas} empresa{kpiVencidas !== 1 && 's'} com {formatBRL(totalVencido)}</strong>
            <span style={{ color: 'var(--c-red-fg)' }}> em pagamentos vencidos. Resolva o quanto antes.</span>
          </div>
          <Btn variant="danger" size="sm" onClick={() => setDashFiltros(f => ({ ...f, status: 'vencido' }))}>Ver vencidas</Btn>
        </div>
      )}

      {/* Toolbar de empresas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, marginRight: 'auto' }}>Empresas</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8 }}>
          <Icon name="search" size={15} color="var(--c-text-muted)" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ..."
            style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 4px', width: 240, fontFamily: 'inherit', background: 'transparent' }} />
        </div>
        <div style={{ display: 'flex', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8, padding: 3 }}>
          <button onClick={() => setView('cards')} style={{
            padding: '6px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: view === 'cards' ? 'var(--c-bg)' : 'transparent', color: 'var(--c-text)'
          }}><Icon name="list" size={14} /></button>
          <button onClick={() => setView('tabela')} style={{
            padding: '6px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: view === 'tabela' ? 'var(--c-bg)' : 'transparent', color: 'var(--c-text)'
          }}><Icon name="filter" size={14} /></button>
        </div>
      </div>

      {/* Grade de empresas */}
      {view === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {filtradas.map(e => <EmpresaCard key={e.id} empresa={e} onOpen={() => onOpenEmpresa(e.id)} onEdit={() => onEditEmpresa(e)} onDelete={() => setEmpresaExcluir(e)} />)}
        </div>
      ) : (
        <Card padding={0}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 10, border: '1px solid var(--c-border)' }}>
            <table style={{ minWidth: isMobile ? 600 : '100%', width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                <th style={th}>Empresa</th>
                <th style={th}>Documento</th>
                <th style={th}>Segmento</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: 'right' }}>A Receber</th>
                <th style={{ ...th, textAlign: 'right' }}>A Pagar</th>
                <th style={{ ...th, textAlign: 'right' }}>Vencidos</th>
                <th style={{ ...th, textAlign: 'right' }}>Saldo</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--c-border)', cursor: 'pointer' }} onClick={() => onOpenEmpresa(e.id)}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                      {e.nome}
                      <span style={{ fontSize: 10, padding: '2px 6px', background: 'var(--c-border)', borderRadius: 4, color: 'var(--c-text-muted)' }}>{e.tipoPessoa === 'pf' ? 'PF' : 'PJ'}</span>
                    </div>
                  </td>
                  <td style={{ ...td, color: 'var(--c-text-muted)' }}>{e.documento || e.cnpj}</td>
                  <td style={{ ...td, color: 'var(--c-text-muted)' }}>{e.segmento}</td>
                  <td style={td}><Badge status={e.stats.statusEmpresa} /></td>
                  <td style={{ ...td, textAlign: 'right', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(e.stats.aReceber)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(e.stats.aPagar)}</td>
                  <td style={{ ...td, textAlign: 'right', color: e.stats.vencidos > 0 ? '#dc2626' : 'var(--c-text-muted)', fontWeight: e.stats.vencidos > 0 ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(e.stats.vencidos)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(e.stats.saldo)}</td>
                  <td style={{ ...td, textAlign: 'right' }}><Icon name="chevronRight" size={16} color="var(--c-text-muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}

      {filtradas.length === 0 && (
        <Card>
          <EmptyState icon="building" title="Nenhuma empresa encontrada" hint="Tente outros filtros ou cadastre uma nova empresa." action={
            <Btn variant="primary" icon="plus" onClick={() => onCreateEmpresa()}>Nova Empresa</Btn>
          } />
        </Card>
      )}

      <ModalConfirmacao
        open={!!empresaExcluir}
        titulo="Confirmar Exclusão"
        mensagem={`Deseja realmente excluir a empresa "${empresaExcluir?.nome || ''}"? Esta ação removerá permanentemente todos os lançamentos vinculados a ela.`}
        onConfirmar={async () => {
          if (empresaExcluir) {
            await onDeleteEmpresa(empresaExcluir.id);
            setEmpresaExcluir(null);
          }
        }}
        onCancelar={() => setEmpresaExcluir(null)}
      />
    </div>
  );
}

const th = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const td = { padding: '12px 16px' };

function EmpresaCard({ empresa, onOpen, onEdit, onDelete }) {
  const s = empresa.stats;
  const c = statusColor(s.statusEmpresa);
  const initial = empresa.nome.charAt(0).toUpperCase();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div onClick={onOpen} style={{
      background: 'var(--c-surface)', borderRadius: 12, padding: 18,
      border: '1px solid var(--c-border)', cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(0,0,0,.04)', position: 'relative',
      transition: 'all 0.15s'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'none'; setMenuOpen(false); }}
    >
      {/* status bar */}
      <div style={{ position: 'absolute', top: 0, left: 16, right: 16, height: 3, background: c.dot, borderRadius: '0 0 4px 4px' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, background: 'var(--c-primary-soft)',
          color: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 16, flexShrink: 0
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empresa.nome}</span>
            <span style={{ fontSize: 10, padding: '1px 5px', background: 'var(--c-border)', borderRadius: 4, color: 'var(--c-text-muted)', flexShrink: 0 }}>
              {empresa.tipoPessoa === 'pf' ? 'PF' : 'PJ'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{empresa.documento || empresa.cnpj}</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} style={{
            background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--c-text-muted)', borderRadius: 6
          }}><Icon name="more" size={16} /></button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 26, background: 'var(--c-surface)',
              border: '1px solid var(--c-border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,.08)',
              zIndex: 10, width: 120, display: 'flex', flexDirection: 'column', padding: 4
            }}>
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onOpen(); }} style={{
                background: 'none', border: 'none', padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                textAlign: 'left', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text)',
                fontFamily: 'inherit'
              }}>
                <Icon name="eye" size={14} /> Ver
              </button>
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }} style={{
                background: 'none', border: 'none', padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                textAlign: 'left', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--c-text)',
                fontFamily: 'inherit'
              }}>
                <Icon name="edit" size={14} /> Editar
              </button>
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} style={{
                background: 'none', border: 'none', padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                textAlign: 'left', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626',
                fontFamily: 'inherit'
              }}>
                <Icon name="trash" size={14} /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <Badge status={s.statusEmpresa} />
        <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{empresa.segmento}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
        <div>
          <div style={{ color: 'var(--c-text-muted)', marginBottom: 2 }}>A Receber</div>
          <div style={{ fontWeight: 600, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(s.aReceber)}</div>
        </div>
        <div>
          <div style={{ color: 'var(--c-text-muted)', marginBottom: 2 }}>A Pagar</div>
          <div style={{ fontWeight: 600, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(s.aPagar)}</div>
        </div>
        {s.cntVencido > 0 && (
          <div style={{ gridColumn: 'span 2', padding: '6px 10px', background: 'rgba(220, 38, 38, 0.1)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="alert" size={12} color="#dc2626" />
            <span style={{ fontSize: 11, color: 'var(--c-red-fg)', fontWeight: 600 }}>
              {s.cntVencido} pendência{s.cntVencido > 1 ? 's' : ''} vencida{s.cntVencido > 1 ? 's' : ''} · {formatBRL(s.vencidos)}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{empresa.qtdLanc} lançamentos</span>
        <span style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          Abrir <Icon name="chevronRight" size={12} />
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { CentralGestao });
