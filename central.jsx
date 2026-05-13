// Central de Gestão - Multi-empresa
const { useState: useState_C, useMemo: useMemo_C } = React;

function CentralGestao({ data, onOpenEmpresa, onCreateEmpresa, onDeleteEmpresa, onEditEmpresa }) {
  const [busca, setBusca] = useState_C('');
  const [filtroStatus, setFiltroStatus] = useState_C('todos');
  const [modalEmp, setModalEmp] = useState_C(null); // {empresa} ou {new:true}
  const [view, setView] = useState_C('cards'); // cards | tabela
  const toast = useToast();
  const hoje = todayISO();

  const empresasComStats = useMemo_C(() => {
    return data.empresas.map(e => {
      const ls = data.lancamentos[e.id] || [];
      const stats = empresaStats(e, ls, hoje);
      return { ...e, stats, qtdLanc: ls.length };
    });
  }, [data.empresas, data.lancamentos, hoje]);

  const filtradas = empresasComStats
    .filter(e => !busca || e.nome.toLowerCase().includes(busca.toLowerCase()) || e.cnpj.includes(busca))
    .filter(e => filtroStatus === 'todos' || e.stats.statusEmpresa === filtroStatus);

  // KPIs globais
  const kpiTotalEmp = empresasComStats.length;
  const kpiVencidas = empresasComStats.filter(e => e.stats.statusEmpresa === 'vencido').length;
  const kpiVencendo = empresasComStats.filter(e => e.stats.statusEmpresa === 'vencendo').length;
  const kpiEmDia = empresasComStats.filter(e => e.stats.statusEmpresa === 'em-dia').length;
  const totalReceber = empresasComStats.reduce((s, e) => s + e.stats.aReceber, 0);
  const totalPagar = empresasComStats.reduce((s, e) => s + e.stats.aPagar, 0);
  const totalVencido = empresasComStats.reduce((s, e) => s + e.stats.vencidos, 0);
  const saldoConsolidado = empresasComStats.reduce((s, e) => s + e.stats.saldo, 0);

  // Charts data
  const statusDist = [
    { label: 'Em dia', value: kpiEmDia, color: '#3b82f6' },
    { label: 'Vencendo', value: kpiVencendo, color: '#f59e0b' },
    { label: 'Vencido', value: kpiVencidas, color: '#ef4444' },
  ];

  // Entradas x Saídas (últimos 6 meses)
  const meses = useMemo_C(() => {
    const arr = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
      arr.push({
        label: dt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        comp: `${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
      });
    }
    return arr;
  }, []);
  const seriesData = useMemo_C(() => {
    const allLancs = empresasComStats.flatMap(e => data.lancamentos[e.id] || []);
    const ent = meses.map(m => allLancs.filter(l => l.competencia === m.comp && l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0));
    const sai = meses.map(m => allLancs.filter(l => l.competencia === m.comp && l.tipo === 'saida').reduce((s, l) => s + l.valor, 0));
    return [
      { name: 'Entradas', color: '#16a34a', points: ent },
      { name: 'Saídas', color: '#dc2626', points: sai },
    ];
  }, [empresasComStats, meses, data.lancamentos]);

  return (
    <div style={{ padding: 28, maxWidth: 1500, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Central de Gestão</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>Visão Geral de Empresas</h1>
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', marginTop: 6 }}>Gerencie suas {kpiTotalEmp} empresas em um só lugar</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" icon="download" onClick={() => exportConsolidadoXLSX(data.empresas, data.lancamentos, data.portadores, data.centrosCusto)}>
            Exportar Consolidado
          </Btn>
          <Btn variant="primary" icon="plus" onClick={() => setModalEmp({ new: true })}>Nova Empresa</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <KPI label="Empresas Cadastradas" value={kpiTotalEmp} icon="building" color="var(--c-primary)" sub={`${kpiEmDia} em dia, ${kpiVencendo + kpiVencidas} com pendências`} />
        <KPI label="A Receber" value={formatBRL(totalReceber)} icon="arrowDown" color="#16a34a" sub={`${empresasComStats.reduce((s, e) => s + (data.lancamentos[e.id] || []).filter(l => l.tipo === 'entrada' && !l.pago).length, 0)} lançamentos`} />
        <KPI label="A Pagar" value={formatBRL(totalPagar)} icon="arrowUp" color="#dc2626" sub={`${empresasComStats.reduce((s, e) => s + (data.lancamentos[e.id] || []).filter(l => l.tipo === 'saida' && !l.pago).length, 0)} lançamentos`} />
        <KPI label="Saldo Consolidado" value={formatBRL(saldoConsolidado)} icon="wallet" color={saldoConsolidado >= 0 ? '#16a34a' : '#dc2626'} sub="Realizado (pago/recebido)" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 24 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Entradas vs Saídas</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Últimos 6 meses · todas as empresas</div>
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
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="alert" size={18} color="#dc2626" />
          <div style={{ flex: 1, fontSize: 13 }}>
            <strong style={{ color: '#991b1b' }}>{kpiVencidas} empresa{kpiVencidas !== 1 && 's'} com {formatBRL(totalVencido)}</strong>
            <span style={{ color: '#7f1d1d' }}> em pagamentos vencidos. Resolva o quanto antes.</span>
          </div>
          <Btn variant="danger" size="sm" onClick={() => setFiltroStatus('vencido')}>Ver vencidas</Btn>
        </div>
      )}

      {/* Toolbar de empresas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, marginRight: 'auto' }}>Empresas</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px', background: '#fff', border: '1px solid var(--c-border)', borderRadius: 8 }}>
          <Icon name="search" size={15} color="var(--c-text-muted)" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou CNPJ..."
            style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 4px', width: 240, fontFamily: 'inherit', background: 'transparent' }} />
        </div>
        <Select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ width: 160 }}>
          <option value="todos">Todos status</option>
          <option value="em-dia">Em dia</option>
          <option value="vencendo">Vencendo</option>
          <option value="vencido">Vencido</option>
        </Select>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid var(--c-border)', borderRadius: 8, padding: 3 }}>
          <button onClick={() => setView('cards')} style={{
            padding: '6px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: view === 'cards' ? '#f1f5f9' : 'transparent', color: 'var(--c-text)'
          }}><Icon name="list" size={14} /></button>
          <button onClick={() => setView('tabela')} style={{
            padding: '6px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: view === 'tabela' ? '#f1f5f9' : 'transparent', color: 'var(--c-text)'
          }}><Icon name="filter" size={14} /></button>
        </div>
      </div>

      {/* Grade de empresas */}
      {view === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {filtradas.map(e => <EmpresaCard key={e.id} empresa={e} onOpen={() => onOpenEmpresa(e.id)} onEdit={() => setModalEmp({ empresa: e })} />)}
        </div>
      ) : (
        <Card padding={0}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--c-border)' }}>
                <th style={th}>Empresa</th>
                <th style={th}>CNPJ</th>
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
                  <td style={td}><div style={{ fontWeight: 600 }}>{e.nome}</div></td>
                  <td style={{ ...td, color: 'var(--c-text-muted)' }}>{e.cnpj}</td>
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
        </Card>
      )}

      {filtradas.length === 0 && (
        <Card>
          <EmptyState icon="building" title="Nenhuma empresa encontrada" hint="Tente outros filtros ou cadastre uma nova empresa." action={
            <Btn variant="primary" icon="plus" onClick={() => setModalEmp({ new: true })}>Nova Empresa</Btn>
          } />
        </Card>
      )}

      {/* Modal empresa */}
      {modalEmp && (
        <EmpresaFormModal
          empresa={modalEmp.empresa}
          onClose={() => setModalEmp(null)}
          onSave={(emp) => {
            if (modalEmp.new) { onCreateEmpresa(emp); toast.push('Empresa cadastrada com sucesso'); }
            else { onEditEmpresa(emp); toast.push('Empresa atualizada'); }
            setModalEmp(null);
          }}
          onDelete={modalEmp.empresa ? () => {
            if (confirm(`Excluir "${modalEmp.empresa.nome}"? Todos os lançamentos serão removidos.`)) {
              onDeleteEmpresa(modalEmp.empresa.id);
              toast.push('Empresa excluída', 'error');
              setModalEmp(null);
            }
          } : null}
        />
      )}
    </div>
  );
}

const th = { padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' };
const td = { padding: '12px 16px' };

function EmpresaCard({ empresa, onOpen, onEdit }) {
  const s = empresa.stats;
  const c = statusColor(s.statusEmpresa);
  const initial = empresa.nome.charAt(0).toUpperCase();
  return (
    <div onClick={onOpen} style={{
      background: '#fff', borderRadius: 12, padding: 18,
      border: '1px solid var(--c-border)', cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(0,0,0,.04)', position: 'relative',
      transition: 'all 0.15s'
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'none'; }}
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
          <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empresa.nome}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{empresa.cnpj}</div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{
          background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--c-text-muted)', borderRadius: 6
        }}><Icon name="more" size={16} /></button>
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
          <div style={{ gridColumn: 'span 2', padding: '6px 10px', background: '#fef2f2', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="alert" size={12} color="#dc2626" />
            <span style={{ fontSize: 11, color: '#991b1b', fontWeight: 600 }}>
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

function EmpresaFormModal({ empresa, onClose, onSave, onDelete }) {
  const [f, setF] = useState_C(empresa || {
    id: uid('emp'), nome: '', cnpj: '', segmento: '', responsavel: '', email: '', telefone: '', criadaEm: todayISO()
  });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  function submit(e) {
    e.preventDefault();
    if (!f.nome.trim()) return alert('Nome é obrigatório');
    onSave(f);
  }
  return (
    <Modal open onClose={onClose} title={empresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'} width={620}
      footer={
        <>
          {onDelete && <Btn variant="danger" icon="trash" onClick={onDelete} style={{ marginRight: 'auto' }}>Excluir</Btn>}
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={submit}>{empresa ? 'Salvar Alterações' : 'Cadastrar Empresa'}</Btn>
        </>
      }>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Razão Social / Nome" required span={2}>
          <Input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Padaria Bom Pão Ltda" autoFocus />
        </Field>
        <Field label="CNPJ" required>
          <Input value={f.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
        </Field>
        <Field label="Segmento">
          <Input value={f.segmento} onChange={e => set('segmento', e.target.value)} placeholder="Ex: Alimentação" />
        </Field>
        <Field label="Responsável">
          <Input value={f.responsavel} onChange={e => set('responsavel', e.target.value)} />
        </Field>
        <Field label="E-mail">
          <Input value={f.email} type="email" onChange={e => set('email', e.target.value)} />
        </Field>
        <Field label="Telefone" span={2}>
          <Input value={f.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
        </Field>
      </form>
    </Modal>
  );
}

Object.assign(window, { CentralGestao });
