// Workspace por Empresa - 4 abas
const { useState: useState_W, useMemo: useMemo_W } = React;

function WorkspaceEmpresa({ empresa, lancamentos, portadores, centrosCusto, formasPagamento, onBack, onUpsertLanc, onDeleteLanc, onPayLanc }) {
  const [aba, setAba] = useState_W('contas');
  const hoje = todayISO();
  const stats = useMemo_W(() => empresaStats(empresa, lancamentos, hoje), [empresa, lancamentos, hoje]);

  return (
    <div>
      {/* Header da empresa */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--c-border)', padding: '20px 28px' }}>
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
            <Btn variant="primary" icon="plus" onClick={() => setAba('contas') || setNovoLanc({})}>Novo Lançamento</Btn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 22, borderBottom: '1px solid transparent', marginBottom: -21 }}>
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
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'inherit'
            }}>
              <Icon name={t.icon} size={15} />
              {t.label}
              {t.count != null && <span style={{ fontSize: 11, background: aba === t.id ? 'var(--c-primary-soft)' : '#f1f5f9', color: aba === t.id ? 'var(--c-primary)' : 'var(--c-text-muted)', padding: '1px 7px', borderRadius: 99, fontWeight: 600 }}>{t.count}</span>}
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
    </div>
  );
}

// ----- Tab 1: Contas -----
function ContasTab({ empresa, lancamentos, portadores, centrosCusto, formasPagamento, onUpsertLanc, onDeleteLanc, onPayLanc }) {
  const [filtros, setFiltros] = useState_W({
    tipo: 'todos', status: 'todos', portador: 'todos', centroCusto: 'todos',
    formaPgto: 'todos', dataIni: '', dataFim: '', busca: ''
  });
  const [novoLanc, setNovoLanc] = useState_W(null);
  const [pgto, setPgto] = useState_W(null);
  const [comprovante, setComprovante] = useState_W(null);
  const toast = useToast();
  const hoje = todayISO();

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

      {/* Filtros */}
      <Card padding={14} style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <Field label="Buscar descrição">
            <div style={{ position: 'relative' }}>
              <Icon name="search" size={14} color="var(--c-text-muted)" />
              <Input value={filtros.busca} onChange={e => setFiltros({ ...filtros, busca: e.target.value })} placeholder="Buscar..." style={{ paddingLeft: 30, position: 'relative' }} />
              <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <Icon name="search" size={14} color="var(--c-text-muted)" />
              </div>
            </div>
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
              {portadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </Select>
          </Field>
          <Field label="Centro de Custo">
            <Select value={filtros.centroCusto} onChange={e => setFiltros({ ...filtros, centroCusto: e.target.value })}>
              <option value="todos">Todos</option>
              {centrosCusto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </Field>
          <Field label="Forma Pgto.">
            <Select value={filtros.formaPgto} onChange={e => setFiltros({ ...filtros, formaPgto: e.target.value })}>
              <option value="todos">Todas</option>
              {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </Field>
          <Field label="Período">
            <div style={{ display: 'flex', gap: 4 }}>
              <Input type="date" value={filtros.dataIni} onChange={e => setFiltros({ ...filtros, dataIni: e.target.value })} style={{ padding: '8px 6px', fontSize: 12 }} />
              <Input type="date" value={filtros.dataFim} onChange={e => setFiltros({ ...filtros, dataFim: e.target.value })} style={{ padding: '8px 6px', fontSize: 12 }} />
            </div>
          </Field>
          <div style={{ display: 'flex', gap: 6 }}>
            {hasFilter && <Btn variant="ghost" size="sm" onClick={clearFilters}>Limpar</Btn>}
            <Btn variant="primary" icon="plus" onClick={() => setNovoLanc({ tipo: 'saida', vencimento: todayISO(), valor: '', descricao: '', portadorId: portadores[0]?.id, centroCustoId: centrosCusto.find(c => c.tipo === 'saida')?.id, formaPagamento: formasPagamento[0], competencia: competenciaFromDate(todayISO()) })}>Novo</Btn>
          </div>
        </div>
      </Card>

      {/* Tabela */}
      <Card padding={0}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--c-border)' }}>
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
              {filtrados.map(l => {
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
                        background: l.tipo === 'entrada' ? '#dcfce7' : '#fee2e2',
                        color: l.tipo === 'entrada' ? '#166534' : '#991b1b', fontSize: 11, fontWeight: 600 }}>
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
        {filtrados.length === 0 && (
          <EmptyState icon="list" title="Nenhum lançamento encontrado" hint={hasFilter ? 'Ajuste os filtros para ver mais resultados.' : 'Cadastre o primeiro lançamento desta empresa.'} action={
            <Btn variant="primary" icon="plus" onClick={() => setNovoLanc({ tipo: 'saida', vencimento: todayISO(), valor: '' })}>Novo lançamento</Btn>
          } />
        )}
      </Card>

      {novoLanc && (
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
    </div>
  );
}

const iconBtn = {
  background: 'transparent', border: '1px solid var(--c-border)', borderRadius: 6,
  width: 28, height: 28, cursor: 'pointer', color: 'var(--c-text-muted)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
};

// ----- Form de lançamento -----
function LancamentoFormModal({ lanc, portadores, centrosCusto, formasPagamento, onClose, onSave }) {
  const [f, setF] = useState_W({
    id: lanc.id || uid('lanc'),
    tipo: lanc.tipo || 'saida',
    descricao: lanc.descricao || '',
    valor: lanc.valor || '',
    vencimento: lanc.vencimento || todayISO(),
    competencia: lanc.competencia || competenciaFromDate(lanc.vencimento || todayISO()),
    portadorId: lanc.portadorId || portadores[0]?.id,
    centroCustoId: lanc.centroCustoId || centrosCusto[0]?.id,
    formaPagamento: lanc.formaPagamento || formasPagamento[0],
    observacao: lanc.observacao || '',
    pago: lanc.pago || false,
    pagamento: lanc.pagamento || null,
  });
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const ccsFiltrados = centrosCusto.filter(c => c.tipo === f.tipo);

  function submit(e) {
    e?.preventDefault();
    if (!f.descricao.trim()) return alert('Descrição é obrigatória');
    if (!f.valor || +f.valor <= 0) return alert('Informe um valor válido');
    const cc = ccsFiltrados.find(c => c.id === f.centroCustoId) || ccsFiltrados[0];
    onSave({ ...f, valor: +f.valor, centroCustoId: cc.id, competencia: competenciaFromDate(f.vencimento) });
  }

  return (
    <Modal open onClose={onClose} title={lanc.id ? 'Editar Lançamento' : 'Novo Lançamento'} width={680}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={submit}>{lanc.id ? 'Salvar' : 'Criar Lançamento'}</Btn>
      </>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Tipo" required span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { v: 'entrada', label: 'Entrada (a receber)', cor: '#16a34a', icon: 'arrowDown' },
              { v: 'saida', label: 'Saída (a pagar)', cor: '#dc2626', icon: 'arrowUp' }
            ].map(opt => (
              <button key={opt.v} type="button" onClick={() => set('tipo', opt.v)} style={{
                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                border: `2px solid ${f.tipo === opt.v ? opt.cor : 'var(--c-border)'}`,
                background: f.tipo === opt.v ? `${opt.cor}10` : '#fff',
                color: f.tipo === opt.v ? opt.cor : 'var(--c-text)',
                fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}>
                <Icon name={opt.icon} size={14} /> {opt.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Descrição" required span={2}>
          <Input value={f.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Conta de luz - Outubro" autoFocus />
        </Field>
        <Field label="Valor (R$)" required>
          <Input type="number" min="0" step="0.01" value={f.valor} onChange={e => set('valor', e.target.value)} placeholder="0,00" />
        </Field>
        <Field label="Vencimento" required>
          <Input type="date" value={f.vencimento} onChange={e => { set('vencimento', e.target.value); set('competencia', competenciaFromDate(e.target.value)); }} />
        </Field>
        <Field label="Centro de Custo" required>
          <Select value={f.centroCustoId} onChange={e => set('centroCustoId', e.target.value)}>
            {ccsFiltrados.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
        </Field>
        <Field label="Portador" required hint="Onde o valor entrará ou de onde sairá">
          <Select value={f.portadorId} onChange={e => set('portadorId', e.target.value)}>
            {portadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Select>
        </Field>
        <Field label="Forma de Pagamento" required>
          <Select value={f.formaPagamento} onChange={e => set('formaPagamento', e.target.value)}>
            {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
        </Field>
        <Field label="Competência" hint="Mês contábil deste lançamento">
          <Input value={f.competencia} onChange={e => set('competencia', e.target.value)} placeholder="MM/AAAA" />
        </Field>
        <Field label="Observação" span={2}>
          <Textarea value={f.observacao} onChange={e => set('observacao', e.target.value)} placeholder="Anotações internas (opcional)" />
        </Field>
      </div>
    </Modal>
  );
}

// ----- Pagamento -----
function PagamentoModal({ lanc, portadores, centrosCusto, onClose, onConfirm }) {
  const [data, setData] = useState_W(todayISO());
  const [portadorId, setPortadorId] = useState_W(lanc.portadorId);
  const portMap = Object.fromEntries(portadores.map(p => [p.id, p]));
  const isEntrada = lanc.tipo === 'entrada';
  return (
    <Modal open onClose={onClose} title={isEntrada ? 'Confirmar Recebimento' : 'Confirmar Pagamento'} width={520}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="success" icon="check" onClick={() => onConfirm({ data, portadorId, comprovante: `CMP-${Math.floor(Math.random() * 90000 + 10000)}.pdf` })}>
          Confirmar {isEntrada ? 'Recebimento' : 'Pagamento'}
        </Btn>
      </>}>
      <div style={{ background: '#fafafa', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{isEntrada ? 'Receber de' : 'Pagar para'}</div>
          <div style={{ fontWeight: 600 }}>{lanc.descricao}</div>
          <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>Vence em {formatDate(lanc.vencimento)} · {lanc.formaPagamento}</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isEntrada ? '#16a34a' : '#dc2626' }}>{formatBRL(lanc.valor)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label={isEntrada ? 'Data do recebimento' : 'Data do pagamento'} required>
          <Input type="date" value={data} onChange={e => setData(e.target.value)} />
        </Field>
        <Field label={isEntrada ? 'Caiu em' : 'Sai de'} required hint="Banco / caixa / cofre">
          <Select value={portadorId} onChange={e => setPortadorId(e.target.value)}>
            {portadores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Select>
        </Field>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 12, color: '#0c4a6e', display: 'flex', gap: 8 }}>
        <Icon name="receipt" size={16} />
        Um comprovante será gerado automaticamente e o saldo do {portMap[portadorId]?.nome} será atualizado.
      </div>
    </Modal>
  );
}

// ----- Comprovante -----
function ComprovanteModal({ lanc, empresa, portador, centro, onClose }) {
  return (
    <Modal open onClose={onClose} title="Comprovante" width={480}
      footer={<Btn variant="primary" onClick={() => window.print()}>Imprimir</Btn>}>
      <div style={{ border: '2px dashed var(--c-border)', borderRadius: 10, padding: 24, background: '#fafafa' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 99, background: '#dcfce7', color: '#16a34a', marginBottom: 10 }}>
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
            background: '#fff', borderRadius: 12, padding: 16, cursor: 'pointer',
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid var(--c-border)' }}>
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
        {lancsPort.length === 0 && <EmptyState icon="receipt" title="Sem movimentações" hint="Este portador ainda não recebeu nenhum lançamento quitado." />}
      </Card>
    </div>
  );
}

// ----- Tab 3: Centros de Custo -----
function CentrosTab({ empresa, lancamentos, centrosCusto }) {
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
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: cor, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11, color: 'var(--c-text-muted)' }}>
                  <span>{c.qtd} lançamento{c.qtd !== 1 ? 's' : ''}</span>
                  <span>Pendente: <strong style={{ color: c.pendente > 0 ? '#92400e' : 'var(--c-text-muted)' }}>{formatBRL(c.pendente)}</strong></span>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <KPI label="Total de Entradas" value={formatBRL(totalEnt)} icon="arrowDown" color="#16a34a" sub={`${entradas.reduce((s, c) => s + c.qtd, 0)} lançamentos em ${entradas.length} centros`} />
        <KPI label="Total de Saídas" value={formatBRL(totalSai)} icon="arrowUp" color="#dc2626" sub={`${saidas.reduce((s, c) => s + c.qtd, 0)} lançamentos em ${saidas.length} centros`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {bar({ stats: entradas, totalGeral: totalEnt, cor: '#16a34a', titulo: 'Entradas por Centro' })}
        {bar({ stats: saidas, totalGeral: totalSai, cor: '#dc2626', titulo: 'Saídas por Centro' })}
      </div>
    </div>
  );
}

// ----- Tab 4: Relatório -----
function RelatorioTab({ empresa, lancamentos, portadores, centrosCusto, formasPagamento }) {
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
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
            <tr style={{ background: '#fafafa' }}>
              <td style={{ ...td, fontWeight: 700 }}>TOTAL</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(seriesMes.reduce((s, x) => s + x.entrada, 0))}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{formatBRL(seriesMes.reduce((s, x) => s + x.saida, 0))}</td>
              <td style={{ ...td, textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatBRL(seriesMes.reduce((s, x) => s + x.entrada - x.saida, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </div>
  );
}

Object.assign(window, { WorkspaceEmpresa });
