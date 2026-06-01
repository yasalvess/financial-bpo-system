// Tela de Configurações do sistema — abas laterais (Perfil, Empresa, Portadores,
// Centros de Custo, Formas de Pagamento, Aparência)
const { useState: useState_S, useMemo: useMemo_S, useEffect: useEffect_S } = React;

function readFileAsDataURL(file, cb) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => cb(r.result);
  r.readAsDataURL(file);
}

const ABAS_CONFIG = [
  { id: 'perfil', label: 'Meu Perfil', icon: 'user' },
  { id: 'empresa', label: 'Minha Empresa', icon: 'building' },
  { id: 'portadores', label: 'Portadores', icon: 'bank' },
  { id: 'centros', label: 'Centros de Custo', icon: 'target' },
  { id: 'formas', label: 'Formas de Pagamento', icon: 'creditCard' },
  { id: 'aparencia', label: 'Aparência', icon: 'settings' },
];

function Configuracoes(props) {
  const {
    initialTab, perfil, onUpdatePerfil, empresaInfo, onUpdateEmpresaInfo,
    portadores, centrosCusto, formasPagamento,
    onUpdatePortadores, onUpdateCentros, onUpdateFormas,
    tweaks, setTweak, colorOptions, fontOptions,
  } = props;
  const [aba, setAba] = useState_S(initialTab || 'perfil');
  const isMobile = useIsMobile(768);

  // Reage à navegação externa (dropdown de perfil / ícone ⚙️)
  useEffect_S(() => { if (initialTab) setAba(initialTab); }, [initialTab]);

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 'calc(100vh - 58px)' }}>
      {/* Menu de abas (lateral no desktop, topo rolável no mobile) */}
      <aside style={isMobile
        ? { width: '100%', background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)', padding: '10px 12px', position: 'sticky', top: 58, zIndex: 10 }
        : { width: 240, background: 'var(--c-bg)', borderRight: '1px solid var(--c-border)', flexShrink: 0, padding: '20px 12px' }}>
        {!isMobile && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px 10px' }}>Configurações</div>}
        <nav style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 6 : 2, overflowX: isMobile ? 'auto' : 'visible' }}>
          {ABAS_CONFIG.map(a => {
            const active = aba === a.id;
            return (
              <button key={a.id} onClick={() => setAba(a.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: active ? 600 : 500, textAlign: 'left',
                width: isMobile ? 'auto' : '100%', whiteSpace: 'nowrap', flexShrink: 0,
                background: active ? 'var(--c-primary-soft)' : 'transparent',
                color: active ? 'var(--c-primary)' : 'var(--c-text)',
                transition: 'background 0.12s, color 0.12s'
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--c-surface)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon name={a.icon} size={16} />
                {a.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '18px 14px 48px' : '28px 28px 60px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {aba === 'perfil' && <PerfilTab perfil={perfil} onUpdate={onUpdatePerfil} />}
          {aba === 'empresa' && <EmpresaInfoTab info={empresaInfo} onUpdate={onUpdateEmpresaInfo} />}
          {aba === 'portadores' && <PortadoresConfigTab portadores={portadores} onUpdate={onUpdatePortadores} />}
          {aba === 'centros' && <CentrosConfigTab centros={centrosCusto} onUpdate={onUpdateCentros} />}
          {aba === 'formas' && <FormasConfigTab formas={formasPagamento} onUpdate={onUpdateFormas} />}
          {aba === 'aparencia' && <AparenciaTab tweaks={tweaks} setTweak={setTweak} colorOptions={colorOptions} fontOptions={fontOptions} />}
        </div>
      </div>
    </div>
  );
}

// Cabeçalho padrão de cada aba
function AbaHeader({ titulo, descricao }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>{titulo}</h2>
      <div style={{ fontSize: 13, color: 'var(--c-text-muted)', marginTop: 4 }}>{descricao}</div>
    </div>
  );
}

// ----- Aba 1: Meu Perfil -----
function PerfilTab({ perfil, onUpdate }) {
  const toast = useToast();
  const [f, setF] = useState_S({ ...perfil });
  const [senhas, setSenhas] = useState_S({ atual: '', nova: '', confirmar: '' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function salvar() {
    if (!f.nome.trim()) return toast.push('Informe seu nome', 'error');
    if (senhas.nova || senhas.confirmar || senhas.atual) {
      if (senhas.nova !== senhas.confirmar) return toast.push('As senhas não coincidem', 'error');
    }
    onUpdate({ ...f, inicial: (f.nome || 'K').charAt(0).toUpperCase() });
    setSenhas({ atual: '', nova: '', confirmar: '' });
    toast.push('Perfil atualizado');
  }

  return (
    <div>
      <AbaHeader titulo="Meu Perfil" descricao="Atualize seus dados pessoais e credenciais de acesso." />
      <Card>
        {/* Foto */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 26, overflow: 'hidden', flexShrink: 0 }}>
            {f.foto ? <img src={f.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (f.nome || 'K').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--c-primary)' }}>
              <Icon name="upload" size={15} /> Enviar foto
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => readFileAsDataURL(e.target.files[0], v => set('foto', v))} />
            </label>
            {f.foto && <button onClick={() => set('foto', null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', fontSize: 12, textAlign: 'left', padding: 0, fontFamily: 'inherit' }}>Remover foto</button>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Nome completo" required span={2}><Input value={f.nome || ''} onChange={e => set('nome', e.target.value)} /></Field>
          <Field label="E-mail"><Input type="email" value={f.email || ''} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Telefone"><Input value={f.telefone || ''} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" /></Field>
          <Field label="Cargo / Função" span={2}><Input value={f.cargo || ''} onChange={e => set('cargo', e.target.value)} /></Field>
        </div>

        <div style={{ borderTop: '1px solid var(--c-border)', margin: '22px 0 18px' }} />
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Alterar senha</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Senha atual"><Input type="password" value={senhas.atual} onChange={e => setSenhas({ ...senhas, atual: e.target.value })} placeholder="••••••••" /></Field>
          <Field label="Nova senha"><Input type="password" value={senhas.nova} onChange={e => setSenhas({ ...senhas, nova: e.target.value })} placeholder="••••••••" /></Field>
          <Field label="Confirmar senha"><Input type="password" value={senhas.confirmar} onChange={e => setSenhas({ ...senhas, confirmar: e.target.value })} placeholder="••••••••" /></Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <Btn variant="primary" icon="check" onClick={salvar}>Salvar alterações</Btn>
        </div>
      </Card>
    </div>
  );
}

// ----- Aba 2: Minha Empresa (escritório dono do sistema) -----
function EmpresaInfoTab({ info, onUpdate }) {
  const toast = useToast();
  const [f, setF] = useState_S({ ...info });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function salvar() {
    if (!f.razaoSocial.trim()) return toast.push('Informe a razão social', 'error');
    onUpdate(f);
    toast.push('Dados da empresa atualizados');
  }

  return (
    <div>
      <AbaHeader titulo="Minha Empresa" descricao="Dados do escritório de BPO que utiliza o sistema." />
      <Card>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, background: 'var(--c-primary-soft)', color: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--c-border)' }}>
            {f.logo ? <img src={f.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (f.nomeFantasia || f.razaoSocial || 'K').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--c-primary)' }}>
              <Icon name="upload" size={15} /> Enviar logo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => readFileAsDataURL(e.target.files[0], v => set('logo', v))} />
            </label>
            {f.logo && <button onClick={() => set('logo', null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', fontSize: 12, textAlign: 'left', padding: 0, fontFamily: 'inherit' }}>Remover logo</button>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Razão Social" required span={2}><Input value={f.razaoSocial || ''} onChange={e => set('razaoSocial', e.target.value)} /></Field>
          <Field label="Nome Fantasia"><Input value={f.nomeFantasia || ''} onChange={e => set('nomeFantasia', e.target.value)} /></Field>
          <Field label="CNPJ"><Input value={f.cnpj || ''} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" /></Field>

          <Field label="Rua / Logradouro" span={2}><Input value={f.rua || ''} onChange={e => set('rua', e.target.value)} /></Field>
          <Field label="Número"><Input value={f.numero || ''} onChange={e => set('numero', e.target.value)} /></Field>
          <Field label="Bairro"><Input value={f.bairro || ''} onChange={e => set('bairro', e.target.value)} /></Field>
          <Field label="Cidade"><Input value={f.cidade || ''} onChange={e => set('cidade', e.target.value)} /></Field>
          <Field label="Estado"><Input value={f.estado || ''} onChange={e => set('estado', e.target.value)} placeholder="UF" /></Field>
          <Field label="CEP" span={2}><Input value={f.cep || ''} onChange={e => set('cep', e.target.value)} placeholder="00000-000" /></Field>

          <Field label="Telefone comercial"><Input value={f.telefone || ''} onChange={e => set('telefone', e.target.value)} /></Field>
          <Field label="E-mail comercial"><Input type="email" value={f.email || ''} onChange={e => set('email', e.target.value)} /></Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <Btn variant="primary" icon="check" onClick={salvar}>Salvar</Btn>
        </div>
      </Card>
    </div>
  );
}

// ----- Aba 3: Portadores -----
const TIPOS_PORTADOR = [
  { v: 'banco', label: 'Banco' },
  { v: 'caixa', label: 'Caixa' },
  { v: 'cofre', label: 'Cofre' },
];
const CORES_PRESET = ['#CC092F', '#EC7000', '#0066B3', '#16a34a', '#7C3AED', '#0EA5E9', '#F59E0B', '#475569'];

function PortadoresConfigTab({ portadores, onUpdate }) {
  const toast = useToast();
  const [modal, setModal] = useState_S(null); // portador em edição/criação

  function salvar(p) {
    const existe = portadores.some(x => x.id === p.id);
    onUpdate(existe ? portadores.map(x => x.id === p.id ? p : x) : [...portadores, p]);
    toast.push(existe ? 'Portador atualizado' : 'Portador adicionado');
    setModal(null);
  }
  function excluir(id) {
    if (!confirm('Excluir este portador?')) return;
    onUpdate(portadores.filter(x => x.id !== id));
    toast.push('Portador excluído', 'error');
  }

  return (
    <div>
      <AbaHeader titulo="Portadores" descricao="Bancos, caixas e cofres disponíveis para todas as empresas." />
      <Card padding={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{portadores.length} portador{portadores.length !== 1 ? 'es' : ''}</div>
          <Btn variant="primary" size="sm" icon="plus" onClick={() => setModal({ id: uid('port'), nome: '', tipo: 'banco', cor: CORES_PRESET[0] })}>Adicionar portador</Btn>
        </div>
        {portadores.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--c-border)' }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: p.cor, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)', textTransform: 'capitalize' }}>{p.tipo}</div>
            </div>
            <button onClick={() => setModal({ ...p })} style={iconBtnCfg} title="Editar"><Icon name="edit" size={14} /></button>
            <button onClick={() => excluir(p.id)} style={iconBtnCfg} title="Excluir"><Icon name="trash" size={14} /></button>
          </div>
        ))}
        {portadores.length === 0 && <EmptyState icon="bank" title="Nenhum portador" hint="Adicione bancos, caixas ou cofres." />}
      </Card>

      {modal && <PortadorModal portador={modal} onClose={() => setModal(null)} onSave={salvar} />}
    </div>
  );
}

function PortadorModal({ portador, onClose, onSave }) {
  const [f, setF] = useState_S({ ...portador });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const novo = !portador.nome;
  return (
    <Modal open onClose={onClose} title={novo ? 'Novo Portador' : 'Editar Portador'} width={460}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={() => { if (!f.nome.trim()) return alert('Informe o nome'); onSave(f); }}>Salvar</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome" required><Input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Bradesco" autoFocus /></Field>
        <Field label="Tipo" required>
          <Select value={f.tipo} onChange={e => set('tipo', e.target.value)}>
            {TIPOS_PORTADOR.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label="Cor">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={f.cor} onChange={e => set('cor', e.target.value)} style={{ width: 44, height: 36, border: '1px solid var(--c-border)', borderRadius: 8, background: 'transparent', cursor: 'pointer', padding: 2 }} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CORES_PRESET.map(c => (
                <button key={c} type="button" onClick={() => set('cor', c)} style={{ width: 24, height: 24, borderRadius: 6, background: c, cursor: 'pointer', border: f.cor.toLowerCase() === c.toLowerCase() ? '2px solid var(--c-text)' : '1px solid var(--c-border)' }} />
              ))}
            </div>
          </div>
        </Field>
      </div>
    </Modal>
  );
}

// ----- Aba 4: Centros de Custo -----
function CentrosConfigTab({ centros, onUpdate }) {
  const toast = useToast();
  const [modal, setModal] = useState_S(null);

  function salvar(c) {
    const existe = centros.some(x => x.id === c.id);
    onUpdate(existe ? centros.map(x => x.id === c.id ? c : x) : [...centros, c]);
    toast.push(existe ? 'Centro atualizado' : 'Centro adicionado');
    setModal(null);
  }
  function excluir(id) {
    if (!confirm('Excluir este centro de custo?')) return;
    onUpdate(centros.filter(x => x.id !== id));
    toast.push('Centro excluído', 'error');
  }

  return (
    <div>
      <AbaHeader titulo="Centros de Custo" descricao="Categorias usadas para classificar entradas e saídas." />
      <Card padding={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{centros.length} centro{centros.length !== 1 ? 's' : ''}</div>
          <Btn variant="primary" size="sm" icon="plus" onClick={() => setModal({ id: uid('cc'), nome: '', tipo: 'saida' })}>Adicionar centro</Btn>
        </div>
        {centros.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid var(--c-border)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: c.tipo === 'entrada' ? '#dcfce7' : '#fee2e2', color: c.tipo === 'entrada' ? '#166534' : '#991b1b', flexShrink: 0 }}>
              <Icon name={c.tipo === 'entrada' ? 'arrowDown' : 'arrowUp'} size={13} />
            </span>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c.nome}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: c.tipo === 'entrada' ? '#16a34a' : '#dc2626', textTransform: 'uppercase' }}>{c.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span>
            <button onClick={() => setModal({ ...c })} style={iconBtnCfg} title="Editar"><Icon name="edit" size={14} /></button>
            <button onClick={() => excluir(c.id)} style={iconBtnCfg} title="Excluir"><Icon name="trash" size={14} /></button>
          </div>
        ))}
        {centros.length === 0 && <EmptyState icon="target" title="Nenhum centro de custo" hint="Adicione categorias de entrada e saída." />}
      </Card>

      {modal && <CentroModal centro={modal} onClose={() => setModal(null)} onSave={salvar} />}
    </div>
  );
}

function CentroModal({ centro, onClose, onSave }) {
  const [f, setF] = useState_S({ ...centro });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const novo = !centro.nome;
  return (
    <Modal open onClose={onClose} title={novo ? 'Novo Centro de Custo' : 'Editar Centro de Custo'} width={460}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={() => { if (!f.nome.trim()) return alert('Informe o nome'); onSave(f); }}>Salvar</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome" required><Input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Marketing" autoFocus /></Field>
        <Field label="Tipo" required>
          <Select value={f.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="entrada">Entrada (receita)</option>
            <option value="saida">Saída (despesa)</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

// ----- Aba 5: Formas de Pagamento -----
function FormasConfigTab({ formas, onUpdate }) {
  const toast = useToast();
  const [nova, setNova] = useState_S('');

  function adicionar() {
    const v = nova.trim();
    if (!v) return;
    if (formas.some(f => f.toLowerCase() === v.toLowerCase())) return toast.push('Forma já cadastrada', 'error');
    onUpdate([...formas, v]);
    setNova('');
    toast.push('Forma adicionada');
  }
  function remover(f) {
    onUpdate(formas.filter(x => x !== f));
    toast.push('Forma removida', 'error');
  }

  return (
    <div>
      <AbaHeader titulo="Formas de Pagamento" descricao="Meios de pagamento disponíveis nos lançamentos." />
      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Input value={nova} onChange={e => setNova(e.target.value)} placeholder="Nova forma de pagamento..." onKeyDown={e => { if (e.key === 'Enter') adicionar(); }} />
          <Btn variant="primary" icon="plus" onClick={adicionar}>Adicionar</Btn>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {formas.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--c-border)', borderRadius: 8 }}>
              <Icon name="creditCard" size={15} color="var(--c-text-muted)" />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{f}</span>
              <button onClick={() => remover(f)} style={iconBtnCfg} title="Remover"><Icon name="x" size={14} /></button>
            </div>
          ))}
          {formas.length === 0 && <div style={{ padding: '12px 0', fontSize: 13, color: 'var(--c-text-muted)', textAlign: 'center' }}>Nenhuma forma cadastrada.</div>}
        </div>
      </Card>
    </div>
  );
}

// ----- Aba 6: Aparência -----
function ConfigToggle({ label, value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} role="switch" aria-checked={!!value} style={{
      position: 'relative', width: 40, height: 22, borderRadius: 999, border: 'none', cursor: 'pointer',
      background: value ? 'var(--c-primary)' : 'var(--c-border)', transition: 'background 0.15s', flexShrink: 0, padding: 0
    }}>
      <span style={{ position: 'absolute', top: 2, left: value ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.25)', transition: 'left 0.15s' }} />
    </button>
  );
}

function ConfigRow({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--c-border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function AparenciaTab({ tweaks, setTweak, colorOptions, fontOptions }) {
  const densidades = [
    { v: 'compact', label: 'Compacto' },
    { v: 'comfortable', label: 'Confortável' },
    { v: 'spacious', label: 'Espaçoso' },
  ];
  return (
    <div>
      <AbaHeader titulo="Aparência" descricao="Personalize as cores, fontes e o layout do sistema." />
      <Card>
        <ConfigRow label="Cor primária" hint="Cor de destaque usada em botões e gráficos">
          <div style={{ display: 'flex', gap: 8 }}>
            {(colorOptions || []).map(c => (
              <button key={c} type="button" onClick={() => setTweak('primaryColor', c)} style={{
                width: 28, height: 28, borderRadius: 8, background: c, cursor: 'pointer',
                border: (tweaks.primaryColor || '').toLowerCase() === c.toLowerCase() ? '2px solid var(--c-text)' : '1px solid var(--c-border)',
                boxShadow: (tweaks.primaryColor || '').toLowerCase() === c.toLowerCase() ? '0 0 0 2px var(--c-surface), 0 0 0 4px ' + c : 'none'
              }} />
            ))}
          </div>
        </ConfigRow>

        <ConfigRow label="Modo escuro" hint="Alterna o tema claro/escuro da interface">
          <ConfigToggle value={tweaks.darkMode} onChange={v => setTweak('darkMode', v)} />
        </ConfigRow>

        <ConfigRow label="Fonte" hint="Família tipográfica da interface">
          <Select value={tweaks.fontFamily} onChange={e => setTweak('fontFamily', e.target.value)} style={{ width: 180 }}>
            {(fontOptions || []).map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
        </ConfigRow>

        <ConfigRow label="Densidade" hint="Espaçamento geral dos elementos">
          <div style={{ display: 'flex', background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 8, padding: 3 }}>
            {densidades.map(d => (
              <button key={d.v} type="button" onClick={() => setTweak('density', d.v)} style={{
                padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600,
                background: tweaks.density === d.v ? 'var(--c-surface)' : 'transparent',
                color: tweaks.density === d.v ? 'var(--c-primary)' : 'var(--c-text-muted)',
                boxShadow: tweaks.density === d.v ? '0 1px 2px rgba(0,0,0,.06)' : 'none'
              }}>{d.label}</button>
            ))}
          </div>
        </ConfigRow>

        <ConfigRow label="Sidebar colapsada" hint="Inicia o menu lateral recolhido">
          <ConfigToggle value={tweaks.sidebarCollapsed} onChange={v => setTweak('sidebarCollapsed', v)} />
        </ConfigRow>
      </Card>
    </div>
  );
}

const iconBtnCfg = {
  background: 'transparent', border: '1px solid var(--c-border)', borderRadius: 6,
  width: 28, height: 28, cursor: 'pointer', color: 'var(--c-text-muted)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
};

Object.assign(window, { Configuracoes });
