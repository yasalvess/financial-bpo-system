// Workspace por Empresa - 4 abas
const { useState: useState_W, useMemo: useMemo_W, useEffect: useEffect_W } = React;

function WorkspaceEmpresa({ empresa, lancamentos, portadores, centrosCusto, formasPagamento, onBack, onUpsertLanc, onDeleteLanc, onPayLanc }) {
  const [aba, setAba] = useState_W('contas');
  const [novoLancHeader, setNovoLancHeader] = useState_W(null);
  const hoje = todayISO();
  const stats = useMemo_W(() => empresaStats(empresa, lancamentos, hoje), [empresa, lancamentos, hoje]);

  return (
    <div>
      {/* Header da empresa */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', padding: '20px 28px' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)',
          fontSize: 13, padding: 0, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 4
        }}>
          <Icon name="arrowLeft" size={14} /> Voltar para Central
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12, background: 'var(--c-primary-soft)',
              color: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 22
            }}>{empresa.nome.charAt(0)}</div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{empresa.nome}</h1>
              <div style={{ fontSize: 13, color: 'var(--c-text-muted)', display: 'flex', gap: 14, marginTop: 4 }}>
                <span>{empresa.cnpj}</span>
                <span>·</span>
                <span>{empresa.segmento}</span>
                {empresa.responsavel && <><span>·</span><span>Resp: {empresa.responsavel}</span></>}
                <Badge status={stats.statusEmpresa} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 22, borderBottom: '1px solid transparent', marginBottom: -21, overflowX: 'auto' }}>
          {[
            { id: 'contas', label: 'Contas a Pagar/Receber', icon: 'list', count: lancamentos.length },
            { id: 'portadores', label: 'Portadores', icon: 'bank' },
            { id: 'centros', label: 'Centros de Custo', icon: 'target' },
            { id: 'relatorio', label: 'Relatório', icon: 'chart' },
          ].map(t => (
            <button key={t.id} onClick={() => setAba(t.id)} style={{
              padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, color: aba === t.id ? 'var(--c-primary)' : 'var(--c-text-muted)',
              borderBottom: `2px solid ${aba === t.id ? 'var(--c-primary)' : 'transparent'}`,
              display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, whiteSpace: 'nowrap',
              fontFamily: 'inherit'
            }}>
              <Icon name={t.icon} size={15} />
              {t.label}
              {t.count != null && <span style={{ fontSize: 11, background: aba === t.id ? 'var(--c-primary-soft)' : 'var(--c-bg)', color: aba === t.id ? 'var(--c-primary)' : 'var(--c-text-muted)', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: 24 }}>
        {aba === 'contas' && <ContasTab {...{ empresa, lancamentos, portadores, centrosCusto, formasPagamento, onUpsertLanc, onDeleteLanc, onPayLanc }} />}
        {aba === 'portadores' && <PortadoresTab {...{ empresa, lancamentos, portadores }} />}
        {aba === 'centros' && <CentrosTab {...{ empresa, lancamentos, centrosCusto }} />}
        {aba === 'relatorio' && <RelatorioTab {...{ empresa, lancamentos, portadores, centrosCusto, formasPagamento }} />}
      </div>

      {novoLancHeader && (
        <LancamentoErrorBoundary onClose={() => setNovoLancHeader(null)}>
        <LancamentoFormModal
          lanc={novoLancHeader}
          portadores={portadores}
          centrosCusto={centrosCusto}
          formasPagamento={formasPagamento}
          onClose={() => setNovoLancHeader(null)}
          onSave={(l) => {
            onUpsertLanc({ ...l, empresaId: empresa.id });
            setNovoLancHeader(null);
          }}
        />
        </LancamentoErrorBoundary>
      )}
    </div>
  );
}

// ----- Tab 1: Contas -----
function ContasTab({ empresa, lancamentos, portadores, centrosCusto, formasPagamento, onUpsertLanc, onDeleteLanc, onPayLanc }) {
  const isMobile = useIsMobile();
  const [filtros, setFiltros] = useState_W({
    tipo: 'todos', status: 'todos', portador: 'todos', centroCusto: 'todos',
    formaPgto: 'todos', dataIni: '', dataFim: '', busca: ''
  });
  const [novoLanc, setNovoLanc] = useState_W(null);
  const [pgto, setPgto] = useState_W(null);
  const [comprovante, setComprovante] = useState_W(null);
  const [showImport, setShowImport] = useState_W(false);
  const toast = useToast();
  const hoje = todayISO();
  const POR_PAGINA = 20;
  const [pagina, setPagina] = useState_W(1);

  const [inlineFormOpen, setInlineFormOpen] = useState_W(true);
  const [fInline, setFInline] = useState_W({
    tipo: 'saida',
    descricao: '',
    valor: '',
    vencimento: todayISO(),
    pago: false,
    portadorId: portadores[0]?.id || '',
    centroCustoId: centrosCusto.find(c => c.tipo === 'saida')?.id || centrosCusto[0]?.id || '',
    formaPagamento: formasPagamento[0] || 'PIX',
    parcelas: 1
  });

  const setInlineVal = (k, v) => {
    setFInline(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'tipo') {
        next.centroCustoId = centrosCusto.find(c => c.tipo === v)?.id || '';
      }
      return next;
    });
  };

  const ccsFiltradosInline = centrosCusto.filter(c => c.tipo === fInline.tipo);

  const [errosInline, setErrosInline] = useState_W({});
  const [salvandoInline, setSalvandoInline] = useState_W(false);

  function addMonthsString(isoDateStr, numMonths) {
    if (!isoDateStr) return '';
    const d = new Date(isoDateStr + 'T12:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + numMonths);
    return d.toISOString().split('T')[0];
  }

  async function submitInline(e) {
    e?.preventDefault();
    const e_val = {};
    if (!fInline.tipo) e_val.tipo = 'Tipo obrigatório';
    if (!fInline.descricao?.trim()) e_val.descricao = 'Descrição obrigatória';
    const val = parseFloat(String(fInline.valor).replace(',', '.'));
    if (!val || val <= 0) e_val.valor = 'Valor deve ser maior que zero';
    if (!fInline.vencimento) e_val.vencimento = 'Vencimento obrigatório';
    if (fInline.pago === null || fInline.pago === undefined) e_val.pago = 'Status pago obrigatório';
    if (!fInline.portadorId) e_val.portadorId = 'Portador obrigatório';
    if (!fInline.centroCustoId) e_val.centroCustoId = 'Centro de Custo obrigatório';
    if (!fInline.formaPagamento) e_val.formaPagamento = 'Forma de Pagamento obrigatória';

    if (Object.keys(e_val).length > 0) {
      setErrosInline(e_val);
      return;
    }
    setErrosInline({});

    const numParc = parseInt(fInline.parcelas) || 1;

    setSalvandoInline(true);
    try {
      if (numParc > 1) {
        const baseVal = Math.floor((val * 100) / numParc) / 100;
        const diff = Math.round((val - baseVal * numParc) * 100) / 100;
        
        const ref = uid('parc');
        const payloadArr = [];
        
        for (let i = 0; i < numParc; i++) {
          const vDate = i === 0 ? fInline.vencimento : addMonthsString(fInline.vencimento, i);
          payloadArr.push({
            ...fInline,
            id: uid('lanc'),
            valor: i === numParc - 1 ? baseVal + diff : baseVal,
            vencimento: vDate,
            competencia: competenciaFromDate(vDate),
            empresaId: empresa.id,
            parcelaRef: ref,
            parcelaNum: i + 1,
            parcelaTotal: numParc,
            descricao: `${fInline.descricao} (${i + 1}/${numParc})`
          });
        }
        await onUpsertLanc(payloadArr);
      } else {
        await onUpsertLanc({
          id: uid('lanc'),
          ...fInline,
          valor: val,
          empresaId: empresa.id,
          competencia: competenciaFromDate(fInline.vencimento)
        });
      }
      
      setFInline({
        tipo: 'saida',
        descricao: '',
        valor: '',
        vencimento: todayISO(),
        pago: false,
        portadorId: portadores[0]?.id || '',
        centroCustoId: centrosCusto.find(c => c.tipo === 'saida')?.id || centrosCusto[0]?.id || '',
        formaPagamento: formasPagamento[0] || 'PIX',
        parcelas: 1
      });
      
      toast.push('Lançamento cadastrado com sucesso!', 'success');
    } finally {
      setSalvandoInline(false);
    }
  }

  useEffect_W(() => setPagina(1), [filtros]);

  const portMap = Object.fromEntries(portadores.map(p => [p.id, p]));
  const ccMap = Object.fromEntries(centrosCusto.map(c => [c.id, c]));

  const filtrados = lancamentos.filter(l => {
    if (filtros.tipo !== 'todos' && l.tipo !== filtros.tipo) return false;
    if (filtros.portador !== 'todos' && l.portadorId !== filtros.portador) return false;
    if (filtros.centroCusto !== 'todos' && l.centroCustoId !== filtros.centroCusto) return false;
    if (filtros.formaPgto !== 'todos' && l.formaPagamento !== filtros.formaPgto) return false;
    if (filtros.dataIni && l.vencimento < filtros.dataIni) return false;
    if (filtros.dataFim && l.vencimento > filtros.dataFim) return false;
    if (filtros.busca && !l.descricao.toLowerCase().includes(filtros.busca.toLowerCase())) return false;
    if (filtros.status !== 'todos') {
      const s = lancStatus(l, hoje);
      if (s !== filtros.status) return false;
    }
    return true;
  }).sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  const totalFiltrados = filtrados.length;
  const totalPaginas = Math.ceil(totalFiltrados / POR_PAGINA);
  const paginados = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const totalReceber = filtrados.filter(l => l.tipo === 'entrada' && !l.pago).reduce((s, l) => s + l.valor, 0);
  const totalPagar = filtrados.filter(l => l.tipo === 'saida' && !l.pago).reduce((s, l) => s + l.valor, 0);
  const totalRecebido = filtrados.filter(l => l.tipo === 'entrada' && l.pago).reduce((s, l) => s + l.valor, 0);
  const totalPago = filtrados.filter(l => l.tipo === 'saida' && l.pago).reduce((s, l) => s + l.valor, 0);

  function clearFilters() {
    setFiltros({ tipo: 'todos', status: 'todos', portador: 'todos', centroCusto: 'todos', formaPgto: 'todos', dataIni: '', dataFim: '', busca: '' });
  }
  const hasFilter = filtros.tipo !== 'todos' || filtros.status !== 'todos' || filtros.portador !== 'todos' || filtros.centroCusto !== 'todos' || filtros.formaPgto !== 'todos' || filtros.dataIni || filtros.dataFim || filtros.busca;

  return (
    <div>
      {/* mini KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <KPI label="A Receber" value={formatBRL(totalReceber)} icon="arrowDown" color="#16a34a" sub={`${filtrados.filter(l => l.tipo === 'entrada' && !l.pago).length} pendentes`} />
        <KPI label="A Pagar" value={formatBRL(totalPagar)} icon="arrowUp" color="#dc2626" sub={`${filtrados.filter(l => l.tipo === 'saida' && !l.pago).length} pendentes`} />
        <KPI label="Recebido" value={formatBRL(totalRecebido)} icon="check" color="#16a34a" sub={`${filtrados.filter(l => l.tipo === 'entrada' && l.pago).length} quitados`} />
        <KPI label="Pago" value={formatBRL(totalPago)} icon="check" color="var(--c-primary)" sub={`${filtrados.filter(l => l.tipo === 'saida' && l.pago).length} quitados`} />
      </div>

      {/* Rápido Cadastro de Lançamento */}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: inlineFormOpen ? 12 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="plus" size={16} color="var(--c-primary)" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Rápido Cadastro de Lançamento</h3>
          </div>
          <button 
            type="button"
            onClick={() => setInlineFormOpen(!inlineFormOpen)} 
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--c-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 500, fontFamily: 'inherit'
            }}
          >
            <Icon name={inlineFormOpen ? 'chevronUp' : 'chevronDown'} size={14} />
            {inlineFormOpen ? 'Minimizar' : 'Expandir'}
          </button>
        </div>
        
        {inlineFormOpen && (
          <form onSubmit={submitInline}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
              gap: 12, 
              alignItems: 'end' 
            }}>
              <Field label="Tipo" required erro={errosInline.tipo}>
                <CustomSelect value={fInline.tipo} onChange={e => setInlineVal('tipo', e.target.value)} options={[
                  { value: 'entrada', label: 'Entrada' },
                  { value: 'saida', label: 'Saída' }
                ]} style={{ borderColor: errosInline.tipo ? '#dc2626' : undefined }} />
              </Field>
              
              <Field label="Descrição" required erro={errosInline.descricao}>
                <Input id="inline-descricao" value={fInline.descricao} onChange={e => setInlineVal('descricao', e.target.value)} placeholder="Ex: Conta de luz" style={{ borderColor: errosInline.descricao ? '#dc2626' : undefined }} />
              </Field>
              
              <Field label="Valor (R$)" required erro={errosInline.valor}>
                <Input type="number" min="0" step="0.01" value={fInline.valor} onChange={e => setInlineVal('valor', e.target.value)} placeholder="0,00" style={{ borderColor: errosInline.valor ? '#dc2626' : undefined }} />
              </Field>

              <Field label="Parcelas">
                <Input type="number" min="1" max="120" value={fInline.parcelas} onChange={e => setInlineVal('parcelas', parseInt(e.target.value) || 1)} />
              </Field>
              
              <Field label="Vencimento" required erro={errosInline.vencimento}>
                <DateInput value={fInline.vencimento} onChange={e => setInlineVal('vencimento', e.target.value)} style={{ border: errosInline.vencimento ? '1px solid #dc2626' : undefined }} />
              </Field>
              
              <Field label="Status" required erro={errosInline.pago}>
                <CustomSelect value={fInline.pago ? 'pago' : 'pendente'} onChange={e => setInlineVal('pago', e.target.value === 'pago')} options={[
                  { value: 'pendente', label: 'Pendente' },
                  { value: 'pago', label: 'Pago' }
                ]} style={{ borderColor: errosInline.pago ? '#dc2626' : undefined }} />
              </Field>
              
              <Field label="Portador" required erro={errosInline.portadorId}>
                <CustomSelect value={fInline.portadorId} onChange={e => setInlineVal('portadorId', e.target.value)} options={[
                  ...portadores.map(p => ({ value: p.id, label: p.nome }))
                ]} style={{ borderColor: errosInline.portadorId ? '#dc2626' : undefined }} />
              </Field>
              
              <Field label="Centro de Custo" required erro={errosInline.centroCustoId}>
                <CustomSelect value={fInline.centroCustoId} onChange={e => setInlineVal('centroCustoId', e.target.value)} options={[
                  ...ccsFiltradosInline.map(c => ({ value: c.id, label: c.nome }))
                ]} style={{ borderColor: errosInline.centroCustoId ? '#dc2626' : undefined }} />
              </Field>
              
              <Field label="Forma de Pagamento" required erro={errosInline.formaPagamento}>
                <CustomSelect value={fInline.formaPagamento} onChange={e => setInlineVal('formaPagamento', e.target.value)} options={[
                  ...formasPagamento.map(f => ({ value: f, label: f }))
                ]} style={{ borderColor: errosInline.formaPagamento ? '#dc2626' : undefined }} />
              </Field>
              
              <div style={{ display: 'flex', minWidth: 100 }}>
                <Btn variant="primary" type="submit" disabled={salvandoInline} style={{ width: '100%', height: 38 }}>
                  {salvandoInline ? <LoadingSpinner size={14} color="#fff" /> : 'Salvar'}
                </Btn>
              </div>
            </div>
          </form>
        )}
      </Card>

      {/* Filtros */}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1.5 1 0' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
              <Icon name="search" size={14} color="var(--c-text-muted)" />
            </span>
            <Input value={filtros.busca} onChange={e => setFiltros({ ...filtros, busca: e.target.value })} placeholder="Buscar descrição..." style={{ paddingLeft: 34, width: '100%' }} />
          </div>
          <Field label="Tipo" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '1 1 0' }}>
            <CustomSelect value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })} options={[
              { value: "todos", label: "Todos" },
              { value: "entrada", label: "Entradas" },
              { value: "saida", label: "Saídas" }
            ]} style={{ minWidth: isMobile ? 0 : 140 }} />
          </Field>
          <Field label="Status" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '1 1 0' }}>
            <CustomSelect value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })} options={[
              { value: "todos", label: "Todos" },
              { value: "pago", label: "Pago" },
              { value: "em-dia", label: "Em dia" },
              { value: "vencendo", label: "Vencendo" },
              { value: "vencido", label: "Vencido" }
            ]} style={{ minWidth: isMobile ? 0 : 140 }} />
          </Field>
          <Field label="Portador" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '1 1 0' }}>
            <CustomSelect value={filtros.portador} onChange={e => setFiltros({ ...filtros, portador: e.target.value })} options={[
              { value: "todos", label: "Todos" },
              ...portadores.map(p => ({ value: p.id, label: p.nome }))
            ]} style={{ minWidth: isMobile ? 0 : 140 }} />
          </Field>
          <Field label="Centro de Custo" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '1 1 0' }}>
            <CustomSelect value={filtros.centroCusto} onChange={e => setFiltros({ ...filtros, centroCusto: e.target.value })} options={[
              { value: "todos", label: "Todos" },
              ...centrosCusto.map(c => ({ value: c.id, label: c.nome }))
            ]} style={{ minWidth: isMobile ? 0 : 140 }} />
          </Field>
          <Field label="Forma Pgto." style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '1 1 0' }}>
            <CustomSelect value={filtros.formaPgto} onChange={e => setFiltros({ ...filtros, formaPgto: e.target.value })} options={[
              { value: "todos", label: "Todas" },
              ...formasPagamento.map(f => ({ value: f.nome, label: f.nome }))
            ]} style={{ minWidth: isMobile ? 0 : 140 }} />
          </Field>
          <Field label="De" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 0 auto' }}>
            <DateInput value={filtros.dataIni} onChange={e => setFiltros({ ...filtros, dataIni: e.target.value })} />
          </Field>
          <Field label="Até" style={{ flex: isMobile ? '1 1 calc(50% - 4px)' : '0 0 auto' }}>
            <DateInput value={filtros.dataFim} onChange={e => setFiltros({ ...filtros, dataFim: e.target.value })} />
          </Field>
          <div style={{ display: 'flex', gap: 6, flex: isMobile ? '1 1 100%' : '0 0 auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
            {hasFilter && <Btn variant="ghost" size="sm" onClick={clearFilters}>Limpar</Btn>}
            <Btn variant="secondary" icon="upload" onClick={() => setShowImport(true)}>Importar XLSX</Btn>
          </div>
        </div>
      </Card>

      {/* Tabela */}
      <Card padding={0}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 10, border: '1px solid var(--c-border)' }}>
          <table style={{ width: '100%', minWidth: isMobile ? 600 : '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                <th style={th}>Vencimento</th>
                <th style={th}>Tipo</th>
                <th style={th}>Descrição</th>
                <th style={th}>Centro de Custo</th>
                <th style={th}>Portador</th>
                <th style={th}>Forma Pgto.</th>
                <th style={{ ...th, textAlign: 'right' }}>Valor</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginados.map(l => {
                const s = lancStatus(l, hoje);
                const c = statusColor(s);
                const port = portMap[l.portadorId];
                const cc = ccMap[l.centroCustoId];
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                    <td style={td}>
                      <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatDate(l.vencimento)}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{l.competencia}</div>
                    </td>
                    <td style={td}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6,
                        background: l.tipo === 'entrada' ? 'var(--c-green-bg)' : 'var(--c-red-bg)',
                        color: l.tipo === 'entrada' ? 'var(--c-green-fg)' : 'var(--c-red-fg)', fontSize: 11, fontWeight: 600 }}>
                        <Icon name={l.tipo === 'entrada' ? 'arrowDown' : 'arrowUp'} size={11} />
                        {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </div>
                    </td>
                    <td style={{ ...td, maxWidth: 280 }}>
                      <div style={{ fontWeight: 500 }}>{l.descricao}</div>
                    </td>
                    <td style={{ ...td, color: 'var(--c-text-muted)' }}>{cc?.nome}</td>
                    <td style={td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: port?.cor }} />
                        {port?.nome}
                      </span>
                    </td>
                    <td style={{ ...td, color: 'var(--c-text-muted)' }}>{l.formaPagamento}</td>
                    <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: l.tipo === 'entrada' ? '#16a34a' : 'var(--c-text)' }}>
                      {l.tipo === 'saida' && '-'}{formatBRL(l.valor)}
                    </td>
                    <td style={td}><Badge status={s} /></td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        {!l.pago && <Btn size="sm" variant="success" icon="check" onClick={() => setPgto(l)}>Pagar</Btn>}
                        {l.pago && <Btn size="sm" variant="secondary" icon="receipt" onClick={() => setComprovante(l)}>Comprovante</Btn>}
                        <button onClick={() => setNovoLanc(l)} style={iconBtn} title="Editar"><Icon name="edit" size={14} /></button>
                        <button onClick={() => {
                          if (confirm('Excluir este lançamento?')) {
                            onDeleteLanc(l.id);
                            toast.push('Lançamento excluído', 'error');
                          }
                        }} style={iconBtn} title="Excluir"><Icon name="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalFiltrados === 0 && (
          <EmptyState icon="list" title="Nenhum lançamento encontrado" hint={hasFilter ? 'Ajuste os filtros para ver mais resultados.' : 'Cadastre o primeiro lançamento desta empresa.'} action={
            <Btn variant="primary" icon="plus" onClick={() => {
              setInlineFormOpen(true);
              setTimeout(() => {
                const el = document.getElementById('inline-descricao');
                if (el) el.focus();
              }, 50);
            }}>Novo lançamento</Btn>
          } />
        )}
        
        {totalPaginas > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'12px 16px', borderTop:'1px solid var(--c-border)' }}>
            <span style={{ fontSize:12, color:'var(--c-text-muted)' }}>
              Mostrando {((pagina-1)*POR_PAGINA)+1}–{Math.min(pagina*POR_PAGINA, totalFiltrados)} 
              de {totalFiltrados} lançamentos
            </span>
            <div style={{ display:'flex', gap:4 }}>
              <Btn size="sm" variant="secondary"
                disabled={pagina === 1}
                onClick={() => setPagina(p => p - 1)}>
                ← Anterior
              </Btn>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let p;
                if (totalPaginas <= 5) p = i + 1;
                else if (pagina <= 3) p = i + 1;
                else if (pagina >= totalPaginas - 2) p = totalPaginas - 4 + i;
                else p = pagina - 2 + i;
                return (
                  <button key={p} onClick={() => setPagina(p)} style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: `1.5px solid ${pagina === p ? 'var(--c-primary)' : 'var(--c-border)'}`,
                    background: pagina === p ? 'var(--c-primary)' : 'var(--c-surface)',
                    color: pagina === p ? '#fff' : 'var(--c-text)',
                    fontSize: 13, fontWeight: pagina === p ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}>{p}</button>
                );
              })}
              <Btn size="sm" variant="secondary"
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(p => p + 1)}>
                Próxima →
              </Btn>
            </div>
          </div>
        )}
      </Card>

      {novoLanc && (
        <LancamentoErrorBoundary onClose={() => setNovoLanc(null)}>
        <LancamentoFormModal
          lanc={novoLanc}
          portadores={portadores}
          centrosCusto={centrosCusto}
          formasPagamento={formasPagamento}
          onClose={() => setNovoLanc(null)}
          onSave={(l) => {
            onUpsertLanc({ ...l, empresaId: empresa.id });
            toast.push(novoLanc.id ? 'Lançamento atualizado' : 'Lançamento criado');
            setNovoLanc(null);
          }}
        />
        </LancamentoErrorBoundary>
      )}
      {pgto && (
        <PagamentoModal
          lanc={pgto}
          portadores={portadores}
          centrosCusto={centrosCusto}
          onClose={() => setPgto(null)}
          onConfirm={(payload) => {
            onPayLanc(pgto.id, payload);
            toast.push(`${pgto.tipo === 'entrada' ? 'Recebimento' : 'Pagamento'} confirmado`);
            setPgto(null);
          }}
        />
      )}
      {comprovante && (
        <ComprovanteModal lanc={comprovante} empresa={empresa} portador={portMap[comprovante.portadorId]} centro={ccMap[comprovante.centroCustoId]} onClose={() => setComprovante(null)} />
      )}
      {showImport && (
        <ModalImportarXLSX 
          portadores={portadores}
          centrosCusto={centrosCusto}
          onClose={() => setShowImport(false)}
          onImport={(lancsArray) => {
            lancsArray.forEach(l => {
              onUpsertLanc({ ...l, empresaId: empresa.id });
            });
            toast.push(`${lancsArray.length} lançamentos importados`);
            setShowImport(false);
          }}
        />
      )}
    </div>
  );
}

const iconBtn = {
  background: 'transparent', border: '1px solid var(--c-border)', borderRadius: 6,
  width: 28, height: 28, cursor: 'pointer', color: 'var(--c-text-muted)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
};

class LancamentoErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <Modal open={true} onClose={this.props.onClose} title="Erro">
          <div style={{ padding: 20, color: '#dc2626' }}>
            Ocorreu um erro ao carregar os dados deste lançamento. Por favor, feche e tente novamente.<br/><br/>
            <small>{String(this.state.error)}</small>
          </div>
        </Modal>
      );
    }
    return this.props.children;
  }
}

// ----- Form de lançamento -----
function LancamentoFormModal({ lanc, portadores, centrosCusto, formasPagamento, onClose, onSave }) {
  const isMobile = useIsMobile();
  const l = lanc || {};
  const [f, setF] = useState_W({
    id: l.id ?? uid('lanc'),
    tipo: l.tipo ?? 'saida',
    descricao: l.descricao ?? '',
    valor: l.valor ?? '',
    vencimento: l.vencimento ?? todayISO(),
    competencia: l.competencia ?? competenciaFromDate(l.vencimento ?? todayISO()),
    portadorId: l.portadorId ?? portadores[0]?.id,
    centroCustoId: l.centroCustoId ?? centrosCusto[0]?.id,
    formaPagamento: l.formaPagamento ?? formasPagamento[0] ?? '',
    observacao: l.observacao ?? '',
    pago: l.pago ?? false,
    pagamento: l.pagamento ?? null,
  });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const ccsFiltrados = centrosCusto.filter(c => c.tipo === f.tipo);
  const toast = useToast();

  const [isParcelado, setIsParcelado] = useState_L(false);
  const [numParcelas, setNumParcelas] = useState_L(2);

  const [erros, setErros] = useState_L({});
  const [salvando, setSalvando] = useState_L(false);

  function addMonthsString(isoDateStr, numMonths) {
    if (!isoDateStr) return '';
    const d = new Date(isoDateStr + 'T12:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + numMonths);
    return d.toISOString().split('T')[0];
  }

  function validarLancamento(f) {
    const e = {};
    if (!f.descricao?.trim()) e.descricao = 'Descrição obrigatória';
    const val = parseFloat(String(f.valor).replace(',','.'));
    if (!val || val <= 0) e.valor = 'Valor deve ser maior que zero';
    if (!f.vencimento) e.vencimento = 'Data de vencimento obrigatória';
    if (!f.tipo) e.tipo = 'Tipo obrigatório';
    return e;
  }

  async function submit(e) {
    e?.preventDefault();
    const e_validation = validarLancamento(f);
    if (Object.keys(e_validation).length > 0) {
      setErros(e_validation);
      return;
    }
    setErros({});
    const cc = ccsFiltrados.find(c => c.id === f.centroCustoId) || ccsFiltrados[0];
    const valOriginal = parseFloat(String(f.valor).replace(',','.'));
    if (isParcelado && !lanc.id && numParcelas > 1) {
      const baseVal = Math.floor((valOriginal * 100) / numParcelas) / 100;
      const diff = Math.round((valOriginal - baseVal * numParcelas) * 100) / 100;
      
      const parcelas = [];
      const ref = uid('parc');
      for (let i = 0; i < numParcelas; i++) {
        const vDate = i === 0 ? f.vencimento : addMonthsString(f.vencimento, i);
        parcelas.push({
          ...f,
          id: uid('lanc'),
          valor: i === numParcelas - 1 ? baseVal + diff : baseVal,
          vencimento: vDate,
          competencia: competenciaFromDate(vDate),
          centroCustoId: cc.id,
          parcelaRef: ref,
          parcelaNum: i + 1,
          parcelaTotal: numParcelas,
          descricao: `${f.descricao} (${i + 1}/${numParcelas})`
        });
      }
      
      setSalvando(true);
      try {
        await onSave(parcelas);
      } finally {
        setSalvando(false);
      }
    } else {
      setSalvando(true);
      try {
        await onSave({ ...f, valor: valOriginal, centroCustoId: cc.id, competencia: competenciaFromDate(f.vencimento) });
      } finally {
        setSalvando(false);
      }
    }
  }

  return (
    <Modal open onClose={onClose} title={lanc.id ? 'Editar Lançamento' : 'Novo Lançamento'} width={680}
      footer={<>
        <Btn variant="secondary" onClick={onClose} disabled={salvando}>Cancelar</Btn>
        <Btn variant="primary" onClick={submit} disabled={salvando} style={{ minWidth: 120 }}>
          {salvando ? <><LoadingSpinner size={14} color="#fff" /> Salvando...</> : (lanc.id ? 'Salvar' : 'Criar Lançamento')}
        </Btn>
      </>}>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Field label="Tipo" required span={2} erro={erros.tipo}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {[
              { v: 'entrada', label: 'Entrada (a receber)', cor: '#16a34a', icon: 'arrowDown' },
              { v: 'saida', label: 'Saída (a pagar)', cor: '#dc2626', icon: 'arrowUp' }
            ].map(opt => (
              <button key={opt.v} type="button" onClick={() => set('tipo', opt.v)} style={{
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${f.tipo === opt.v ? opt.cor : 'var(--c-border)'}`,
                background: f.tipo === opt.v ? `${opt.cor}10` : 'var(--c-surface)',
                color: f.tipo === opt.v ? opt.cor : 'var(--c-text)',
                fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                <Icon name={opt.icon} size={14} /> {opt.label}
              </button>
            ))}
          </div>
          {erros.tipo && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.tipo}</span>}
        </Field>
        <Field label="Descrição" required span={2} erro={erros.descricao}>
          <Input value={f.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Conta de luz - Outubro" autoFocus style={{ borderColor: erros.descricao ? '#dc2626' : undefined }} />
          {erros.descricao && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.descricao}</span>}
        </Field>
        <Field label="Valor (R$)" required erro={erros.valor}>
          <Input type="number" min="0" step="0.01" value={f.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" style={{ borderColor: erros.valor ? '#dc2626' : undefined }} />
          {erros.valor && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.valor}</span>}
          {!lanc.id && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={isParcelado} onChange={e => setIsParcelado(e.target.checked)} />
              Parcelar lançamento
            </label>
          )}
        </Field>
        {isParcelado && !lanc.id && (
          <Field label="Número de Parcelas" span={isMobile ? 1 : 2}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input type="number" min="2" max="120" value={numParcelas} onChange={e => setNumParcelas(parseInt(e.target.value) || 2)} style={{ width: 100 }} />
              <span style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
                {numParcelas} parcelas de aprox. {formatBRL((parseFloat(String(f.valor).replace(',','.')) || 0) / numParcelas)} / mês
              </span>
            </div>
          </Field>
        )}
        <Field label="Vencimento" required erro={erros.vencimento}>
          <DateInput value={f.vencimento} onChange={e => { set('vencimento', e.target.value); set('competencia', competenciaFromDate(e.target.value)); }} style={{ border: erros.vencimento ? '1px solid #dc2626' : undefined }} />
          {erros.vencimento && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.vencimento}</span>}
        </Field>
        <Field label="Centro de Custo" required>
          <CustomSelect value={f.centroCustoId} onChange={e => set('centroCustoId', e.target.value)} options={[
            ...ccsFiltrados.map(c => ({ value: c.id, label: c.nome }))
          ]} />
        </Field>
        <Field label="Portador" required hint="Onde o valor entrará ou de onde sairá">
          <CustomSelect value={f.portadorId} onChange={e => set('portadorId', e.target.value)} options={[
            ...portadores.map(p => ({ value: p.id, label: p.nome }))
          ]} />
        </Field>
        <Field label="Forma de Pagamento" required>
          <CustomSelect value={f.formaPagamento} onChange={e => set('formaPagamento', e.target.value)} options={[
            ...formasPagamento.map(f => ({ value: f, label: f }))
          ]} />
        </Field>
        <Field label="Competência" hint="Mês contábil deste lançamento">
          <Input value={f.competencia} onChange={e => set('competencia', e.target.value)} placeholder="MM/AAAA" />
        </Field>
        <Field label="Observação" span={2}>
          <Textarea value={f.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Anotações internas (opcional)" />
        </Field>
      </form>
    </Modal>
  );
}

// ----- Pagamento -----
function PagamentoModal({ lanc, portadores, centrosCusto, onClose, onConfirm }) {
  const isMobile = useIsMobile();
  const [data, setData] = useState_W(todayISO());
  const [portadorId, setPortadorId] = useState_W(lanc.portadorId);
  const portMap = Object.fromEntries(portadores.map(p => [p.id, p]));
  const isEntrada = lanc.tipo === 'entrada';
  const toast = useToast();

  function salvar() {
    const errData = Validacao.required(data, 'Data');
    if (errData) return toast.push(errData, 'error');

    const errPortador = Validacao.required(portadorId, 'Portador');
    if (errPortador) return toast.push(errPortador, 'error');

    onConfirm({ data, portadorId, comprovante: `CMP-${Math.floor(Math.random() * 90000 + 10000)}.pdf` });
  }

  return (
    <Modal open onClose={onClose} title={isEntrada ? 'Confirmar Recebimento' : 'Confirmar Pagamento'} width={520}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="success" icon="check" onClick={salvar}>
          Confirmar {isEntrada ? 'Recebimento' : 'Pagamento'}
        </Btn>
      </>}>
      <div style={{ background: 'var(--c-bg)', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{isEntrada ? 'Receber de' : 'Pagar para'}</div>
          <div style={{ fontWeight: 600 }}>{lanc.descricao}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>Vence em {formatDate(lanc.vencimento)} · {lanc.formaPagamento}</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isEntrada ? '#16a34a' : '#dc2626' }}>{formatBRL(lanc.valor)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
        <Field label={isEntrada ? 'Data do recebimento' : 'Data do pagamento'} required>
          <DateInput value={data} onChange={e => setData(e.target.value)} />
        </Field>
        <Field label={isEntrada ? 'Caiu em' : 'Sai de'} required hint="Banco / caixa / cofre">
          <CustomSelect value={portadorId} onChange={e => setPortadorId(e.target.value)} options={[
            ...portadores.map(p => ({ value: p.id, label: p.nome }))
          ]} />
        </Field>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: 'var(--c-blue-bg)', border: '1px solid rgba(37, 99, 235, 0.3)', borderRadius: 8, fontSize: 12, color: 'var(--c-blue-fg)', display: 'flex', gap: 8 }}>
        <Icon name="receipt" size={16} />
        Um comprovante será gerado automaticamente e o saldo do {portMap[portadorId]?.nome} será atualizado.
      </div>
    </Modal>
  );
}

// ----- Comprovante -----
function ComprovanteModal({ lanc, empresa, portador, centro, onClose }) {
  const handlePrint = () => {
    const html = `
      <div class="comprovante-wrapper">
        <div class="header">
          <div class="title">COMPROVANTE DE ${lanc.tipo === 'entrada' ? 'RECEBIMENTO' : 'PAGAMENTO'}</div>
          <div class="value">${formatBRL(lanc.valor)}</div>
        </div>
        <div class="row"><span class="label">Empresa</span><span class="val">${empresa.nome}</span></div>
        <div class="row"><span class="label">CNPJ</span><span class="val">${empresa.cnpj}</span></div>
        <div class="row"><span class="label">Descrição</span><span class="val">${lanc.descricao}</span></div>
        <div class="row"><span class="label">Centro de Custo</span><span class="val">${centro?.nome || ''}</span></div>
        <div class="row"><span class="label">Portador</span><span class="val">${portador?.nome || ''}</span></div>
        <div class="row"><span class="label">Forma de Pagamento</span><span class="val">${lanc.formaPagamento || ''}</span></div>
        <div class="row"><span class="label">Vencimento</span><span class="val">${formatDate(lanc.vencimento)}</span></div>
        ${lanc.pagamento ? `<div class="row"><span class="label">Data do Pagamento</span><span class="val">${formatDate(lanc.pagamento.data)}</span></div>` : ''}
        <div class="row"><span class="label">Competência</span><span class="val">${lanc.competencia || ''}</span></div>
        ${lanc.pagamento?.comprovante ? `<div class="row"><span class="label">Nº Comprovante</span><span class="val mono">${lanc.pagamento.comprovante}</span></div>` : ''}
      </div>
    `;
    imprimirPDF(html, 'Comprovante - ' + lanc.descricao);
  };

  return (
    <Modal open onClose={onClose} title="Comprovante" width={480}
      footer={<Btn variant="primary" onClick={handlePrint}>Imprimir Comprovante</Btn>}>
      <div style={{ border: '2px dashed var(--c-border)', borderRadius: 10, padding: 24, background: 'var(--c-bg)' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 99, background: 'var(--c-green-bg)', color: 'var(--c-green-fg)', marginBottom: 10 }}>
            <Icon name="check" size={24} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>COMPROVANTE DE {lanc.tipo === 'entrada' ? 'RECEBIMENTO' : 'PAGAMENTO'}</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(lanc.valor)}</div>
        </div>
        <div style={{ borderTop: '1px solid var(--c-border)', paddingTop: 16, display: 'grid', gap: 10, fontSize: 13 }}>
          <Row k="Empresa" v={empresa.nome} />
          <Row k="CNPJ" v={empresa.cnpj} />
          <Row k="Descrição" v={lanc.descricao} />
          <Row k="Centro de Custo" v={centro?.nome} />
          <Row k="Portador" v={portador?.nome} />
          <Row k="Forma de Pagamento" v={lanc.formaPagamento} />
          <Row k="Vencimento" v={formatDate(lanc.vencimento)} />
          <Row k="Data do Pagamento" v={lanc.pagamento && formatDate(lanc.pagamento.data)} />
          <Row k="Competência" v={lanc.competencia} />
          <Row k="Nº Comprovante" v={lanc.pagamento?.comprovante} mono />
        </div>
      </div>
    </Modal>
  );
}
function Row({ k, v, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: 'var(--c-text-muted)' }}>{k}</span>
      <span style={{ fontWeight: 500, fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', textAlign: 'right' }}>{v}</span>
    </div>
  );
}

// ----- Tab 2: Portadores -----
function PortadoresTab({ empresa, lancamentos, portadores }) {
  const isMobile = useIsMobile();
  const saldos = portadorSaldos(lancamentos, portadores);
  const totalEnt = saldos.reduce((s, p) => s + p.entradas, 0);
  const totalSai = saldos.reduce((s, p) => s + p.saidas, 0);
  const [selPort, setSelPort] = useState_W(saldos[0]?.id);
  const lancsPort = lancamentos.filter(l => l.portadorId === selPort && l.pago).sort((a, b) => (b.pagamento?.data || '').localeCompare(a.pagamento?.data || ''));
  const sel = saldos.find(p => p.id === selPort);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
        {saldos.map(p => (
          <div key={p.id} onClick={() => setSelPort(p.id)} style={{
            background: 'var(--c-surface)', borderRadius: 12, padding: 16, cursor: 'pointer',
            border: `2px solid ${selPort === p.id ? p.cor : 'var(--c-border)'}`, transition: 'all 0.15s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${p.cor}18`, color: p.cor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={p.tipo === 'banco' ? 'bank' : p.tipo === 'cofre' ? 'lock' : 'wallet'} size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', textTransform: 'capitalize' }}>{p.tipo}</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: p.saldo >= 0 ? 'var(--c-text)' : '#dc2626', letterSpacing: '-0.02em' }}>
              {formatBRL(p.saldo)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span><span style={{ color: '#16a34a' }}>↓</span> {formatBRL(p.entradas)}</span>
              <span><span style={{ color: '#dc2626' }}>↑</span> {formatBRL(p.saidas)}</span>
            </div>
          </div>
        ))}
      </div>

      <Card padding={0}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Extrato — {sel?.nome}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{lancsPort.length} movimentações realizadas</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Saldo</div>
            <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(sel?.saldo)}</div>
          </div>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 10, border: '1px solid var(--c-border)' }}>
        <table style={{ width: '100%', minWidth: isMobile ? 600 : '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
              <th style={th}>Data Pgto.</th>
              <th style={th}>Descrição</th>
              <th style={th}>Forma</th>
              <th style={th}>Tipo</th>
              <th style={{ ...th, textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {lancsPort.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                <td style={td}>{l.pagamento && formatDate(l.pagamento.data)}</td>
                <td style={td}>{l.descricao}</td>
                <td style={{ ...td, color: 'var(--c-text-muted)' }}>{l.formaPagamento}</td>
                <td style={td}>{l.tipo === 'entrada' ? '+ Entrada' : '- Saída'}</td>
                <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: l.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                  {l.tipo === 'entrada' ? '+' : '-'} {formatBRL(l.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {lancsPort.length === 0 && <EmptyState icon="receipt" title="Sem movimentações" hint="Este portador ainda não recebeu nenhum lançamento quitado." />}
      </Card>
    </div>
  );
}

// ----- Tab 3: Centros de Custo -----
function CentrosTab({ empresa, lancamentos, centrosCusto }) {
  const isMobile = useIsMobile();
  const stats = centroCustoStats(lancamentos, centrosCusto);
  const entradas = stats.filter(c => c.tipo === 'entrada');
  const saidas = stats.filter(c => c.tipo === 'saida');
  const totalEnt = entradas.reduce((s, c) => s + c.total, 0);
  const totalSai = saidas.reduce((s, c) => s + c.total, 0);

  function bar({ stats, totalGeral, cor, titulo }) {
    return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{titulo}</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: cor }}>{formatBRL(totalGeral)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stats.map(c => {
            const pct = totalGeral > 0 ? (c.total / totalGeral) * 100 : 0;
            return (
              <div key={c.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.nome}</div>
                  <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontWeight: 600 }}>{formatBRL(c.total)}</span>
                    <span style={{ color: 'var(--c-text-muted)', marginLeft: 8, fontSize: 11 }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ height: 8, background: 'var(--c-bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: cor, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11, color: 'var(--c-text-muted)' }}>
                  <span>{c.qtd} lançamento{c.qtd !== 1 ? 's' : ''}</span>
                  <span>Pendente: <strong style={{ color: c.pendente > 0 ? 'var(--c-amber-fg)' : 'var(--c-text-muted)' }}>{formatBRL(c.pendente)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <KPI label="Total de Entradas" value={formatBRL(totalEnt)} icon="arrowDown" color="#16a34a" sub={`${entradas.reduce((s, c) => s + c.qtd, 0)} lançamentos em ${entradas.length} centros`} />
        <KPI label="Total de Saídas" value={formatBRL(totalSai)} icon="arrowUp" color="#dc2626" sub={`${saidas.reduce((s, c) => s + c.qtd, 0)} lançamentos em ${saidas.length} centros`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
        {bar({ stats: entradas, totalGeral: totalEnt, cor: '#16a34a', titulo: 'Entradas por Centro' })}
        {bar({ stats: saidas, totalGeral: totalSai, cor: '#dc2626', titulo: 'Saídas por Centro' })}
      </div>
    </div>
  );
}

// ----- Tab 4: Relatório -----
function RelatorioTab({ empresa, lancamentos, portadores, centrosCusto, formasPagamento }) {
  const isMobile = useIsMobile();
  const hoje = todayISO();
  const toast = useToast();

  // Distribuição forma de pagamento
  const formasDist = formasPagamento.map((f, i) => {
    const v = lancamentos.filter(l => l.formaPagamento === f).reduce((s, l) => s + l.valor, 0);
    return { label: f, value: v, color: ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'][i % 8] };
  }).filter(d => d.value > 0);

  const ccDist = centroCustoStats(lancamentos, centrosCusto).filter(c => c.total > 0);
  const ccColors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // Por mês
  const meses = useMemo_W(() => {
    const all = [...new Set(lancamentos.map(l => l.competencia))];
    return all.sort((a, b) => { const [ma, ya] = a.split('/'); const [mb, yb] = b.split('/'); return (ya + ma).localeCompare(yb + mb); });
  }, [lancamentos]);

  const seriesMes = meses.map(m => ({
    label: m,
    entrada: lancamentos.filter(l => l.competencia === m && l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0),
    saida: lancamentos.filter(l => l.competencia === m && l.tipo === 'saida').reduce((s, l) => s + l.valor, 0),
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Relatório Financeiro</h2>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Análises e exportação para Excel</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="primary" icon="download" onClick={() => { exportEmpresaXLSX(empresa, lancamentos, portadores, centrosCusto); toast.push('Arquivo XLSX gerado'); }}>
            Exportar Excel (4 abas)
          </Btn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Distribuição por Forma de Pagamento</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 18 }}>Volume total movimentado por meio</div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <DonutChart data={formasDist} size={170} thickness={28} centerLabel="Total" centerValue={formatBRL(formasDist.reduce((s, d) => s + d.value, 0)).replace('R$', '').trim().slice(0, 8)} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {formasDist.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: f.color }} />
                  <span style={{ flex: 1, color: 'var(--c-text-muted)' }}>{f.label}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(f.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Distribuição por Centro de Custo</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 18 }}>Para onde está indo o dinheiro</div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <DonutChart
              data={ccDist.map((c, i) => ({ label: c.nome, value: c.total, color: ccColors[i % ccColors.length] }))}
              size={170} thickness={28}
              centerLabel="Itens" centerValue={ccDist.length}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, maxHeight: 200, overflowY: 'auto' }}>
              {ccDist.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: ccColors[i % ccColors.length] }} />
                  <span style={{ flex: 1, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(c.total).replace('R$', '').trim().slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Entradas vs Saídas por Competência</div>
        <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 14 }}>Histórico mensal completo</div>
        <LineChart
          series={[
            { name: 'Entradas', color: '#16a34a', points: seriesMes.map(s => s.entrada) },
            { name: 'Saídas', color: '#dc2626', points: seriesMes.map(s => s.saida) },
          ]}
          labels={seriesMes.map(s => s.label)}
          height={240}
        />
        <div style={{ marginTop: 12 }}>
          <Legend items={[{ color: '#16a34a', label: 'Entradas' }, { color: '#dc2626', label: 'Saídas' }]} />
        </div>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Resumo Executivo</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Resultado consolidado por competência</div>
          </div>
        </div>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 10, border: '1px solid var(--c-border)' }}>
        <table style={{ width: '100%', minWidth: isMobile ? 600 : '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
              <th style={th}>Competência</th>
              <th style={{ ...th, textAlign: 'right' }}>Entradas</th>
              <th style={{ ...th, textAlign: 'right' }}>Saídas</th>
              <th style={{ ...th, textAlign: 'right' }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {seriesMes.map(s => {
              const res = s.entrada - s.saida;
              return (
                <tr key={s.label} style={{ borderBottom: '1px solid var(--c-border)' }}>
                  <td style={td}><strong>{s.label}</strong></td>
                  <td style={{ ...td, textAlign: 'right', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(s.entrada)}</td>
                  <td style={{ ...td, textAlign: 'right', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(s.saida)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: res >= 0 ? '#16a34a' : '#dc2626' }}>{formatBRL(res)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--c-bg)' }}>
              <td style={{ ...td, fontWeight: 700 }}>TOTAL</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(seriesMes.reduce((s, x) => s + x.entrada, 0))}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(seriesMes.reduce((s, x) => s + x.saida, 0))}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(seriesMes.reduce((s, x) => s + x.entrada - x.saida, 0))}</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </Card>
    </div>
  );
}

function ModalImportarXLSX({ portadores, centrosCusto, onClose, onImport }) {
  const [step, setStep] = useState_W(1);
  const [dataRows, setDataRows] = useState_W([]);
  const [colNames, setColNames] = useState_W([]);
  const [map, setMap] = useState_W({ data: '', descricao: '', valor: '', tipo: '' });

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (rows.length > 0) {
        setColNames(rows[0] || []);
        setDataRows(rows.slice(1).filter(r => r.length > 0));
        setStep(2);
      }
    };
    reader.readAsBinaryString(file);
  }

  const toast = useToast();

  function doImport() {
    const errData = Validacao.required(map.data, 'Coluna de Data');
    if (errData) return toast.push(errData, 'error');

    const errDesc = Validacao.required(map.descricao, 'Coluna de Descrição');
    if (errDesc) return toast.push(errDesc, 'error');

    const errValor = Validacao.required(map.valor, 'Coluna de Valor');
    if (errValor) return toast.push(errValor, 'error');

    const idx = {
      data: colNames.indexOf(map.data),
      descricao: colNames.indexOf(map.descricao),
      valor: colNames.indexOf(map.valor),
      tipo: colNames.indexOf(map.tipo)
    };
    const lancs = dataRows.map(r => {
      let v = r[idx.valor] || 0;
      if (typeof v === 'string') v = parseFloat(v.replace(/[R$\s.]/g, '').replace(',','.')) || 0;
      let dt = r[idx.data];
      if (typeof dt === 'number') dt = new Date((dt - 25569) * 86400 * 1000).toISOString().split('T')[0];
      else if (typeof dt === 'string' && dt.includes('/')) {
        const p = dt.split('/'); dt = `${p[2]}-${p[1]}-${p[0]}`;
      } else { dt = todayISO(); }
      
      const tStr = String(r[idx.tipo]).toLowerCase();
      const isEntrada = tStr.includes('entrada') || tStr.includes('receita') || tStr === 'c';
      
      return {
        descricao: String(r[idx.descricao] || 'Importado').slice(0, 80),
        valor: Math.abs(v),
        tipo: isEntrada ? 'entrada' : 'saida',
        vencimento: dt,
        competencia: competenciaFromDate(dt),
        portadorId: portadores[0]?.id,
        centroCustoId: centrosCusto.find(c => c.tipo === (isEntrada ? 'entrada' : 'saida'))?.id || centrosCusto[0]?.id,
        formaPagamento: 'Transferência',
        pago: false
      };
    });
    onImport(lancs);
  }

  return (
    <Modal open onClose={onClose} title="Importar Planilha (XLSX/CSV)" width={500} footer={
      <>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        {step === 2 && <Btn variant="primary" onClick={doImport}>Confirmar Importação ({dataRows.length} linhas)</Btn>}
      </>
    }>
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', padding: '20px 0' }}>
          <Icon name="upload" size={32} color="var(--c-text-muted)" />
          <div style={{ fontSize: 14, color: 'var(--c-text-muted)', textAlign: 'center' }}>Selecione um arquivo Excel ou CSV contendo as colunas de data, descrição e valor.</div>
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ marginTop: 10 }} />
        </div>
      )}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>Mapeie as colunas da sua planilha para os campos do sistema:</div>
          <Field label="Coluna de Data"><CustomSelect value={map.data} onChange={e => setMap({...map, data: e.target.value})} options={[{value:'',label:'Selecione...'}, ...colNames.map(c => ({value:c,label:c}))]} /></Field>
          <Field label="Coluna de Descrição"><CustomSelect value={map.descricao} onChange={e => setMap({...map, descricao: e.target.value})} options={[{value:'',label:'Selecione...'}, ...colNames.map(c => ({value:c,label:c}))]} /></Field>
          <Field label="Coluna de Valor"><CustomSelect value={map.valor} onChange={e => setMap({...map, valor: e.target.value})} options={[{value:'',label:'Selecione...'}, ...colNames.map(c => ({value:c,label:c}))]} /></Field>
          <Field label="Coluna de Tipo (Entrada/Saída)"><CustomSelect value={map.tipo} onChange={e => setMap({...map, tipo: e.target.value})} options={[{value:'',label:'Selecione...'}, ...colNames.map(c => ({value:c,label:c}))]} /></Field>
        </div>
      )}
    </Modal>
  );
}

Object.assign(window, { WorkspaceEmpresa, ModalImportarXLSX });
