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
  { id: 'seguranca', label: 'Segurança', icon: 'lock' },
  { id: 'usuarios', icon: 'users', label: 'Usuários & Acesso', desc: 'Gerencie permissões da equipe' },
  { id: 'portadores', label: 'Portadores', icon: 'bank' },
  { id: 'centros', label: 'Centros de Custo', icon: 'target' },
  { id: 'formas', label: 'Formas de Pagamento', icon: 'creditCard' },
  { id: 'notificacoes', label: 'Notificações', icon: 'bell' },
  { id: 'aparencia', label: 'Aparência', icon: 'settings' },
  { id: 'backup', label: 'Backup de Dados', icon: 'download' },
];

function Configuracoes(props) {
  const {
    initialTab, session, perfil, onUpdatePerfil, empresaInfo, onUpdateEmpresaInfo,
    portadores = [], centrosCusto = [], formasPagamento = [],
    onSavePortador, onDeletePortador,
    onSaveCentro, onDeleteCentro,
    onSaveForma, onDeleteForma,
    tweaks, setTweak, colorOptions, fontOptions, data,
  } = props;
  const [aba, setAba] = useState_S(initialTab || 'perfil');
  const isMobile = useIsMobile(768);

  const cargoLower = (perfil?.cargo || '').toLowerCase();
  const isVisualizador = cargoLower.includes('visualizador');
  const isAnalista = cargoLower.includes('analista');

  const abasFiltradas = useMemo_S(() => {
    return ABAS_CONFIG.filter(aba => {
      if (isVisualizador) {
        return !['usuarios', 'portadores', 'centros', 'formas', 'backup'].includes(aba.id);
      }
      if (isAnalista) {
        return !['usuarios', 'backup'].includes(aba.id);
      }
      return true;
    });
  }, [isVisualizador, isAnalista]);

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
          {abasFiltradas.map(a => {
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
          {aba === 'seguranca' && <AbaSeguranca session={session} perfil={perfil} />}
          {aba === 'usuarios' && !isVisualizador && !isAnalista && <AbaUsuarios session={session} data={data} />}
          {aba === 'portadores' && !isVisualizador && <PortadoresConfigTab portadores={portadores} onSave={onSavePortador} onDelete={onDeletePortador} />}
          {aba === 'centros' && !isVisualizador && <CentrosConfigTab centros={centrosCusto} onSave={onSaveCentro} onDelete={onDeleteCentro} />}
          {aba === 'formas' && !isVisualizador && <FormasConfigTab formas={formasPagamento} onSave={onSaveForma} onDelete={onDeleteForma} />}
          {aba === 'notificacoes' && <AbaNotificacoes session={session} />}
          {aba === 'aparencia' && <AparenciaTab tweaks={tweaks} setTweak={setTweak} colorOptions={colorOptions} fontOptions={fontOptions} />}
          {aba === 'backup' && !isVisualizador && !isAnalista && <AbaBackup data={props.data} />}
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
  const isMobile = useIsMobile();
  const [f, setF] = useState_S({ ...perfil });
  const [erros, setErros] = useState_S({});
  const [salvando, setSalvando] = useState_S(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  async function salvar() {
    const e = {};
    if (!f.nome?.trim()) e.nome = 'Nome obrigatório';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'E-mail inválido';

    if (Object.keys(e).length > 0) {
      setErros(e);
      return;
    }
    setErros({});
    setSalvando(true);
    await onUpdate({ ...f, inicial: (f.nome || 'K').charAt(0).toUpperCase() });
    setSalvando(false);
    toast.push('Perfil atualizado com sucesso!', 'success');
  }

  return (
    <div>
      <AbaHeader titulo="Meu Perfil" descricao="Atualize seus dados pessoais." />
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

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          <Field label="Nome completo" required span={2} erro={erros.nome}>
            <Input value={f.nome || ''} onChange={e => set('nome', e.target.value)} style={{ borderColor: erros.nome ? '#dc2626' : undefined }} />
            {erros.nome && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.nome}</span>}
          </Field>
          <Field label="E-mail" erro={erros.email}>
            <Input type="email" value={f.email || ''} onChange={e => set('email', e.target.value)} style={{ borderColor: erros.email ? '#dc2626' : undefined }} />
            {erros.email && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.email}</span>}
          </Field>
          <Field label="Telefone"><Input value={f.telefone || ''} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" /></Field>
          <Field label="Cargo / Função" span={2}>
            <Input 
              value={f.cargo || ''} 
              onChange={e => set('cargo', e.target.value)} 
              disabled={perfil?.cargo?.toLowerCase()?.includes('visualizador')}
              style={perfil?.cargo?.toLowerCase()?.includes('visualizador') ? { background: 'var(--c-surface)', cursor: 'not-allowed', color: 'var(--c-text-muted)' } : undefined}
            />
          </Field>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <Btn variant="primary" icon="check" onClick={salvar} disabled={salvando}>
            {salvando ? <><LoadingSpinner size={14} color="#fff" /> Salvando...</> : 'Salvar alterações'}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ----- Aba 2: Minha Empresa (escritório dono do sistema) -----
function EmpresaInfoTab({ info, onUpdate }) {
  const toast = useToast();
  const isMobile = useIsMobile();
  const [f, setF] = useState_S({ ...info });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  function salvar() {
    const errRazao = Validacao.required(f.razaoSocial, 'Razão Social');
    if (errRazao) return toast.push(errRazao, 'error');

    const errCNPJ = f.cnpj ? Validacao.cnpj(f.cnpj) : null;
    if (errCNPJ) return toast.push(errCNPJ, 'error');

    const errCEP = f.cep ? Validacao.cep(f.cep) : null;
    if (errCEP) return toast.push(errCEP, 'error');

    const errTelefone = f.telefone ? Validacao.telefone(f.telefone) : null;
    if (errTelefone) return toast.push(errTelefone, 'error');

    const errEmail = f.email ? Validacao.email(f.email) : null;
    if (errEmail) return toast.push(errEmail, 'error');

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

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
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

function PortadoresConfigTab({ portadores, onSave, onDelete }) {
  const toast = useToast();
  const [modal, setModal] = useState_S(null);

  async function salvar(p) {
    await onSave(p);
    setModal(null);
  }
  async function excluir(id) {
    if (!confirm('Excluir este portador?')) return;
    await onDelete(id);
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
  const toast = useToast();

  function salvar() {
    const errNome = Validacao.required(f.nome, 'Nome');
    if (errNome) {
      toast.push(errNome, 'error');
      return;
    }
    onSave(f);
  }

  return (
    <Modal open onClose={onClose} title={novo ? 'Novo Portador' : 'Editar Portador'} width={460}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={salvar}>Salvar</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome" required><Input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Bradesco" autoFocus /></Field>
        <Field label="Tipo" required>
          <CustomSelect value={f.tipo} onChange={e => set('tipo', e.target.value)} options={[
            ...TIPOS_PORTADOR.map(t => ({ value: t.v, label: t.label }))
          ]} />
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
function CentrosConfigTab({ centros, onSave, onDelete }) {
  const toast = useToast();
  const [modal, setModal] = useState_S(null);

  async function salvar(c) {
    await onSave(c);
    setModal(null);
  }
  async function excluir(id) {
    if (!confirm('Excluir este centro de custo?')) return;
    await onDelete(id);
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
  const toast = useToast();

  function salvar() {
    const errNome = Validacao.required(f.nome, 'Nome');
    if (errNome) {
      toast.push(errNome, 'error');
      return;
    }
    onSave(f);
  }

  return (
    <Modal open onClose={onClose} title={novo ? 'Novo Centro de Custo' : 'Editar Centro de Custo'} width={460}
      footer={<>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={salvar}>Salvar</Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome" required><Input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Marketing" autoFocus /></Field>
        <Field label="Tipo" required>
          <CustomSelect value={f.tipo} onChange={e => set('tipo', e.target.value)} options={[
            { value: "entrada", label: "Entrada (receita)" },
            { value: "saida", label: "Saída (despesa)" }
          ]} />
        </Field>
      </div>
    </Modal>
  );
}

// ----- Aba 5: Formas de Pagamento -----
function FormasConfigTab({ formas, onSave, onDelete }) {
  const toast = useToast();
  const [nova, setNova] = useState_S('');

  async function adicionar(e) {
    if (e && e.preventDefault) e.preventDefault();
    const n = nova.trim();
    const errNova = Validacao.required(n, 'Nome da forma de pagamento');
    if (errNova) return toast.push(errNova, 'error');
    if (formas.includes(n)) return toast.push('Forma de pagamento já existe', 'error');
    await onSave(n);
    setNova('');
  }
  async function excluir(f) {
    if (!confirm(`Excluir forma de pagamento "${f}"?`)) return;
    await onDelete(f);
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
              <button onClick={() => excluir(f)} style={iconBtnCfg} title="Remover"><Icon name="x" size={14} /></button>
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
          <CustomSelect value={tweaks.fontFamily} onChange={e => setTweak('fontFamily', e.target.value)} style={{ width: 180 }} options={[
            ...(fontOptions || []).map(f => ({ value: f, label: f }))
          ]} />
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

// =========================================================================
// ABA 3: SEGURANÇA
// =========================================================================

function AbaSeguranca({ session, perfil }) {
  const [senhaAtual, setSenhaAtual] = useState_S('');
  const [novaSenha, setNovaSenha] = useState_S('');
  const [confirmar, setConfirmar] = useState_S('');
  const [loading, setLoading] = useState_S(false);
  const toast = useToast();

  const [erros, setErros] = useState_S({});
  
  const isVisualizador = (perfil?.cargo || '').toLowerCase().includes('visualizador');

  async function alterarSenha() {
    const e = {};
    if (!senhaAtual) e.atual = 'Senha atual obrigatória';
    const errNova = Validacao.senha(novaSenha);
    if (errNova) e.nova = errNova;
    if (novaSenha !== confirmar) e.confirmar = 'As senhas não coincidem';

    if (Object.keys(e).length > 0) {
      setErros(e);
      return;
    }
    setErros({});
    setLoading(true);
    // Reautentica com senha atual primeiro
    const { error: errReauth } = await window.supabaseClient.auth.signInWithPassword({
      email: session.user.email,
      password: senhaAtual
    });
    if (errReauth) { toast.push('Senha atual incorreta', 'error'); setLoading(false); return; }
    // Altera senha
    const { error } = await window.supabaseClient.auth.updateUser({ password: novaSenha });
    if (error) { toast.push('Erro ao alterar senha', 'error'); }
    else {
      toast.push('Senha alterada com sucesso!', 'success');
      setSenhaAtual(''); setNovaSenha(''); setConfirmar('');
    }
    setLoading(false);
  }

  async function sairTodosDispositivos() {
    if (!confirm('Isso vai encerrar sua sessão em todos os dispositivos. Continuar?')) return;
    await window.supabaseClient.auth.signOut({ scope: 'global' });
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <AbaHeader titulo="Segurança" descricao="Gerencie sua senha e sessões ativas." />
      
      {/* Alterar senha */}
      <SecaoConfig titulo="Alterar senha"
        descricao="Recomendamos usar uma senha forte com letras, números e símbolos.">
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12, maxWidth:480 }}>
          <Field label="Senha atual" required erro={erros.atual}>
            <Input type="password" value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••" style={{ borderColor: erros.atual ? '#dc2626' : undefined }} />
            {erros.atual && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.atual}</span>}
          </Field>
          <Field label="Nova senha" required erro={erros.nova}>
            <Input type="password" value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" style={{ borderColor: erros.nova ? '#dc2626' : undefined }} />
            {erros.nova && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.nova}</span>}
            <IndicadorForcaSenha senha={novaSenha} />
          </Field>
          <Field label="Confirmar nova senha" required erro={erros.confirmar}>
            <Input type="password" value={confirmar}
              onChange={e => setConfirmar(e.target.value)} placeholder="Repita a nova senha" style={{ borderColor: erros.confirmar ? '#dc2626' : undefined }} />
            {erros.confirmar && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.confirmar}</span>}
          </Field>
          <div>
            <Btn variant="primary" disabled={loading || !senhaAtual || !novaSenha || !confirmar}
              onClick={alterarSenha}>
              {loading ? 'Alterando...' : 'Alterar senha'}
            </Btn>
          </div>
        </div>
      </SecaoConfig>

      {/* Informações da sessão atual */}
      <SecaoConfig titulo="Sessão atual"
        descricao="Informações sobre seu acesso atual ao sistema.">
        <div style={{ background:'var(--c-bg)', borderRadius:10, padding:16,
          border:'1px solid var(--c-border)', maxWidth:480 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10, fontSize:13 }}>
            <InfoLinha label="E-mail" valor={session?.user?.email} />
            <InfoLinha label="Último acesso"
              valor={session?.user?.last_sign_in_at
                ? new Date(session.user.last_sign_in_at).toLocaleString('pt-BR')
                : 'Agora'} />
            <InfoLinha label="Provedor" valor="E-mail e senha" />
            <InfoLinha label="ID da conta"
              valor={session?.user?.id?.slice(0,8) + '...'} />
          </div>
        </div>
      </SecaoConfig>

      {/* Encerrar sessões */}
      {!isVisualizador && (
        <SecaoConfig titulo="Encerrar todas as sessões"
          descricao="Sai da conta em todos os dispositivos onde você está conectado. Útil se perdeu acesso a algum dispositivo.">
          <Btn variant="danger" onClick={sairTodosDispositivos}>
            Sair de todos os dispositivos
          </Btn>
        </SecaoConfig>
      )}

      {/* Excluir conta */}
      {!isVisualizador && (
        <SecaoConfig titulo="Zona de perigo"
          descricao="Ações irreversíveis. Prossiga com cuidado.">
          <div style={{ border:'1px solid #fecaca', borderRadius:10, padding:16, maxWidth:480 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#991b1b', marginBottom:4 }}>
              Excluir minha conta
            </div>
            <div style={{ fontSize:12, color:'var(--c-text-muted)', marginBottom:12, lineHeight:1.5 }}>
              Remove permanentemente sua conta e todos os dados associados (empresas, lançamentos, configurações). Esta ação não pode ser desfeita.
            </div>
            <Btn variant="danger" onClick={() => {
              if (prompt('Digite "EXCLUIR" para confirmar:') === 'EXCLUIR') {
                window.supabaseClient.auth.signOut();
                toast.push('Solicitação enviada. Conta será excluída em até 24h.', 'error');
              }
            }}>
              Excluir minha conta
            </Btn>
          </div>
        </SecaoConfig>
      )}
    </div>
  );
}

// Componente indicador de força de senha
function IndicadorForcaSenha({ senha }) {
  if (!senha) return null;
  const forca = calcularForcaSenha(senha);
  const cores = { fraca:'#dc2626', media:'#f59e0b', forte:'#16a34a', 'muito forte':'#0ea5e9' };
  const larguras = { fraca:'25%', media:'50%', forte:'75%', 'muito forte':'100%' };
  return (
    <div style={{ marginTop:4 }}>
      <div style={{ height:3, background:'var(--c-border)', borderRadius:99, overflow:'hidden' }}>
        <div style={{ height:'100%', width:larguras[forca], background:cores[forca],
          borderRadius:99, transition:'all 0.3s' }} />
      </div>
      <div style={{ fontSize:11, color:cores[forca], marginTop:3, fontWeight:500 }}>
        Senha {forca}
      </div>
    </div>
  );
}

function calcularForcaSenha(senha) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  if (pontos <= 1) return 'fraca';
  if (pontos <= 2) return 'media';
  if (pontos <= 3) return 'forte';
  return 'muito forte';
}

function SecaoConfig({ titulo, descricao, children }) {
  return (
    <div style={{ paddingBottom:24, borderBottom:'1px solid var(--c-border)' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>{titulo}</div>
        {descricao && <div style={{ fontSize:13, color:'var(--c-text-muted)', lineHeight:1.5 }}>{descricao}</div>}
      </div>
      {children}
    </div>
  );
}

function InfoLinha({ label, valor }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <span style={{ color:'var(--c-text-muted)' }}>{label}</span>
      <span style={{ fontWeight:500 }}>{valor}</span>
    </div>
  );
}

function AbaUsuarios({ session, data }) {
  const [usuarios, setUsuarios] = useState_S([]);
  const [usuariosEmpresas, setUsuariosEmpresas] = useState_S({});
  const [loading, setLoading] = useState_S(true);
  const [actionLoading, setActionLoading] = useState_S(false);
  const [busca, setBusca] = useState_S('');
  const [filtroRole, setFiltroRole] = useState_S('todos');
  const [filtroStatus, setFiltroStatus] = useState_S('todos');
  const [selecionados, setSelecionados] = useState_S([]);
  const [editUsuario, setEditUsuario] = useState_S(null);
  const [viewUsuario, setViewUsuario] = useState_S(null);
  const [confirmRevogar, setConfirmRevogar] = useState_S(null);
  const [confirmLote, setConfirmLote] = useState_S(false);
  const [showCriar, setShowCriar] = useState_S(false);
  // Criar usuario states
  const [nomeNovo, setNomeNovo] = useState_S('');
  const [emailNovo, setEmailNovo] = useState_S('');
  const [senhaNova, setSenhaNova] = useState_S('');
  const [papelNovo, setPapelNovo] = useState_S('analista');
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState_S([]);
  const [erros, setErros] = useState_S({});
  const toast = useToast();
  const isMobile = useIsMobile(768);

  const PAPEIS = [
    { value:'admin', label:'Administrador', desc:'Acesso total a todas as empresas' },
    { value:'analista', label:'Analista', desc:'Pode criar e editar lançamentos nas empresas liberadas' },
    { value:'visualizador', label:'Visualizador', desc:'Apenas visualiza dados nas empresas liberadas' },
  ];

  const corPapel = {
    admin:'#7c3aed', 'Administrador':'#7c3aed', 'Administrador(a)':'#7c3aed',
    analista:'#3b82f6', 'Analista':'#3b82f6', operador:'#3b82f6',
    visualizador:'#64748b', 'Visualizador':'#64748b'
  };

  const PAPEL_LABELS = {
    admin: 'Administrador', 'Administrador':'Administrador', 'Administrador(a)':'Administrador(a)',
    operador: 'Analista', analista: 'Analista', 'Analista':'Analista',
    visualizador: 'Visualizador', 'Visualizador':'Visualizador'
  };

  useEffect_S(() => { carregarUsuarios(); }, []);

  async function carregarUsuarios() {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('https://svgvtmkqjvxsoduohfuy.supabase.co/functions/v1/admin-criar-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'list' })
      });
      
      let perfis = [];
      let vinculacoes = [];
      
      if (response.ok) {
        const result = await response.json();
        perfis = result.perfis || [];
        vinculacoes = result.vinculacoes || [];
        // Filtra fora o próprio usuário atual
        perfis = perfis.filter(p => p.id !== session.user.id);
      } else {
        const errJson = await response.json().catch(() => ({}));
        console.warn('Erro na listagem:', errJson.error);
      }

      const { data: convs } = await window.supabaseClient.from('convites')
        .select('*').eq('user_id', session.user.id).eq('status', 'pendente').order('created_at', { ascending: false });

      const mapVinculacoes = {};
      if (vinculacoes) {
        vinculacoes.forEach(v => {
          if (!mapVinculacoes[v.user_id]) mapVinculacoes[v.user_id] = [];
          mapVinculacoes[v.user_id].push(v.empresa_id);
        });
      }

      const lista = [];
      if (perfis) lista.push(...perfis.map(p => ({ ...p, isConvite: false })));
      if (convs) {
        convs.forEach(c => lista.push({
          id: c.id, nome: c.nome || c.email_convidado, email: c.email_convidado,
          cargo: c.papel, status: 'pendente', isConvite: true, empresas_ids: c.empresas_ids,
          created_at: c.created_at, ativo: true
        }));
      }
      setUsuarios(lista);
      setUsuariosEmpresas(mapVinculacoes);
    } catch (err) {
      toast.push('Erro ao carregar usuários: ' + err.message, 'error');
    }
    setLoading(false);
  }

  async function getToken() {
    const { data: { session: s } } = await window.supabaseClient.auth.getSession();
    return s?.access_token;
  }

  async function executarExclusao(id, isConvite) {
    setActionLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('https://svgvtmkqjvxsoduohfuy.supabase.co/functions/v1/admin-criar-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete', id, isConvite })
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao excluir usuário');
      }
      toast.push('Usuário removido com sucesso!', 'success');
      setSelecionados(prev => prev.filter(s => s !== id));
      carregarUsuarios();
    } catch (err) {
      toast.push(err.message, 'error');
    }
    setActionLoading(false);
  }

  async function executarExclusaoLote() {
    setActionLoading(true);
    let sucesso = 0, falha = 0;
    for (const id of selecionados) {
      const u = usuarios.find(u => u.id === id);
      if (!u) continue;
      try {
        const token = await getToken();
        const response = await fetch('https://svgvtmkqjvxsoduohfuy.supabase.co/functions/v1/admin-criar-usuario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'delete', id, isConvite: u.isConvite })
        });
        if (response.ok) sucesso++; else falha++;
      } catch { falha++; }
    }
    if (sucesso > 0) toast.push(`${sucesso} usuário(s) removido(s) com sucesso!`, 'success');
    if (falha > 0) toast.push(`Falha ao remover ${falha} usuário(s).`, 'error');
    setSelecionados([]);
    setConfirmLote(false);
    carregarUsuarios();
    setActionLoading(false);
  }

  async function salvarEdicao(payload) {
    setActionLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('https://svgvtmkqjvxsoduohfuy.supabase.co/functions/v1/admin-criar-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'update', ...payload })
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao atualizar usuário');
      }
      toast.push('Usuário atualizado com sucesso!', 'success');
      setEditUsuario(null);
      carregarUsuarios();
    } catch (err) {
      toast.push(err.message, 'error');
    }
    setActionLoading(false);
  }

  async function criarUsuario() {
    const e = {};
    if (!nomeNovo?.trim()) e.nome = 'Nome obrigatório';
    if (!emailNovo?.trim()) e.email = 'E-mail obrigatório';
    else {
      const errEmail = Validacao.email(emailNovo);
      if (errEmail) e.email = errEmail;
    }
    const errSenha = Validacao.senha(senhaNova);
    if (errSenha) e.senha = errSenha;

    if (papelNovo !== 'admin' && empresasSelecionadas.length === 0) {
      toast.push('Selecione pelo menos uma empresa', 'error');
      return;
    }

    if (Object.keys(e).length > 0) { setErros(e); return; }
    setErros({});

    setActionLoading(true);
    try {
      const token = await getToken();
      const response = await fetch('https://svgvtmkqjvxsoduohfuy.supabase.co/functions/v1/admin-criar-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          email: emailNovo.toLowerCase().trim(),
          password: senhaNova,
          nome: nomeNovo.trim(),
          cargo: PAPEIS.find(p=>p.value===papelNovo)?.label || 'Analista',
          empresasIds: papelNovo === 'admin' ? data.empresas.map(e=>e.id) : empresasSelecionadas
        })
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro ao criar usuário');
      }
      toast.push(`Usuário ${nomeNovo} criado com sucesso!`, 'success');
      setNomeNovo(''); setEmailNovo(''); setSenhaNova(''); setEmpresasSelecionadas([]); setShowCriar(false);
      carregarUsuarios();
    } catch (err) {
      toast.push(err.message, 'error');
    }
    setActionLoading(false);
  }

  // --- Filtragem ---
  const usuariosFiltrados = useMemo_S(() => {
    return usuarios.filter(u => {
      const buscaLower = busca.toLowerCase();
      if (buscaLower && !u.nome?.toLowerCase().includes(buscaLower) && !u.email?.toLowerCase().includes(buscaLower)) return false;
      if (filtroRole !== 'todos') {
        const cargoNorm = (u.cargo || '').toLowerCase();
        if (filtroRole === 'admin' && !cargoNorm.includes('admin')) return false;
        if (filtroRole === 'analista' && !cargoNorm.includes('analista') && !cargoNorm.includes('operador')) return false;
        if (filtroRole === 'visualizador' && !cargoNorm.includes('visualizador')) return false;
      }
      if (filtroStatus === 'ativo' && u.ativo === false) return false;
      if (filtroStatus === 'inativo' && u.ativo !== false) return false;
      if (filtroStatus === 'pendente' && u.status !== 'pendente') return false;
      return true;
    });
  }, [usuarios, busca, filtroRole, filtroStatus]);

  const allSelected = usuariosFiltrados.length > 0 && usuariosFiltrados.every(u => selecionados.includes(u.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelecionados(prev => prev.filter(id => !usuariosFiltrados.find(u => u.id === id)));
    } else {
      const ids = usuariosFiltrados.map(u => u.id);
      setSelecionados(prev => [...new Set([...prev, ...ids])]);
    }
  }

  function toggleSelect(id) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  function getNomeEmpresas(u) {
    const vinculadas = u.isConvite ? (u.empresas_ids || []) : (usuariosEmpresas[u.id] || []);
    return data.empresas.filter(e => vinculadas.includes(e.id)).map(e => e.nome);
  }

  function getCargoNormalizado(cargo) {
    const c = (cargo || '').toLowerCase();
    if (c.includes('admin')) return 'admin';
    if (c.includes('analista') || c.includes('operador')) return 'analista';
    if (c.includes('visualizador')) return 'visualizador';
    return c;
  }

  // --- Rendering ---
  const checkboxStyle = (checked) => ({
    width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
    border: `1.5px solid ${checked ? 'var(--c-primary)' : 'var(--c-border)'}`,
    background: checked ? 'var(--c-primary)' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s ease'
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <AbaHeader titulo="Usuários e Acessos" descricao="Gerencie todos os usuários do sistema, seus cargos, empresas e status." />

      {/* --- Toolbar superior --- */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        padding: '12px 16px', background: 'var(--c-surface)', borderRadius: 12,
        border: '1px solid var(--c-border)'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 220px', minWidth: 180, position: 'relative' }}>
          <Icon name="search" size={15} color="var(--c-text-muted)" />
          <input
            type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            style={{
              width: '100%', padding: '8px 10px 8px 28px', border: '1.5px solid var(--c-border)',
              borderRadius: 8, fontSize: 13, background: 'var(--c-bg)', color: 'var(--c-text)',
              fontFamily: 'inherit', outline: 'none', position: 'relative'
            }}
          />
          <div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          </div>
        </div>

        {/* Filter: Cargo */}
        <CustomSelect value={filtroRole} onChange={e => setFiltroRole(e.target.value)} options={[
          { value: 'todos', label: 'Todos os cargos' },
          { value: 'admin', label: 'Administrador' },
          { value: 'analista', label: 'Analista' },
          { value: 'visualizador', label: 'Visualizador' }
        ]} style={{ minWidth: 150 }} />

        {/* Filter: Status */}
        <CustomSelect value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} options={[
          { value: 'todos', label: 'Todos os status' },
          { value: 'ativo', label: 'Ativo' },
          { value: 'inativo', label: 'Inativo' },
          { value: 'pendente', label: 'Pendente' }
        ]} style={{ minWidth: 140 }} />

        <div style={{ flex: '0 0 auto', display: 'flex', gap: 8 }}>
          {/* Batch delete */}
          {selecionados.length > 0 && (
            <Btn onClick={() => setConfirmLote(true)} style={{ background:'#dc2626', color:'#fff', border:'1px solid #dc2626', fontSize: 12, padding: '7px 14px' }}>
              <Icon name="trash" size={14} color="#fff" /> Excluir ({selecionados.length})
            </Btn>
          )}
          {/* Criar button */}
          <Btn variant="primary" onClick={() => setShowCriar(true)} style={{ fontSize: 12, padding: '7px 14px' }}>
            <Icon name="plus" size={14} /> Novo Usuário
          </Btn>
        </div>
      </div>

      {/* --- Summary cards --- */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Total', value: usuarios.length, color: 'var(--c-primary)', icon: 'users' },
          { label: 'Ativos', value: usuarios.filter(u => u.ativo !== false && u.status !== 'pendente').length, color: '#16a34a', icon: 'check' },
          { label: 'Inativos', value: usuarios.filter(u => u.ativo === false).length, color: '#dc2626', icon: 'x' },
          { label: 'Pendentes', value: usuarios.filter(u => u.status === 'pendente').length, color: '#f59e0b', icon: 'alert' }
        ].map((card, i) => (
          <div key={i} style={{
            padding: '14px 16px', borderRadius: 12, background: 'var(--c-surface)',
            border: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: card.color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icon name={card.icon} size={18} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Tabela de usuários --- */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <LoadingSpinner size={32} />
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <EmptyState
          icon="users"
          title={busca || filtroRole !== 'todos' || filtroStatus !== 'todos' ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          hint={busca || filtroRole !== 'todos' || filtroStatus !== 'todos'
            ? 'Tente alterar os filtros ou a busca.'
            : 'Clique em "Novo Usuário" para criar o primeiro.'}
        />
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--c-border)', overflow: 'hidden', background: 'var(--c-surface)' }}>
          {/* Cabeçalho da tabela (só desktop) */}
          {!isMobile && (
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1.5fr 1.8fr 1fr 0.8fr 140px',
              padding: '10px 16px', background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)',
              fontSize: 11, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div onClick={toggleSelectAll} style={checkboxStyle(allSelected)}>
                  {allSelected && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}
                </div>
              </div>
              <div>Usuário</div>
              <div>E-mail</div>
              <div>Cargo</div>
              <div>Status</div>
              <div style={{ textAlign: 'right' }}>Ações</div>
            </div>
          )}

          {/* Linhas */}
          {usuariosFiltrados.map((u, idx) => {
            const isSelected = selecionados.includes(u.id);
            const cargoNorm = getCargoNormalizado(u.cargo);
            const cor = corPapel[cargoNorm] || corPapel[u.cargo] || 'var(--c-primary)';
            const nomesEmpresas = getNomeEmpresas(u);
            const isInativo = u.ativo === false;
            const isPendente = u.status === 'pendente';

            if (isMobile) {
              // --- Mobile card layout ---
              return (
                <div key={u.id} style={{
                  padding: '14px 16px',
                  borderBottom: idx < usuariosFiltrados.length - 1 ? '1px solid var(--c-border)' : 'none',
                  background: isSelected ? 'var(--c-primary-soft)' : 'transparent',
                  transition: 'background 0.1s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div onClick={() => toggleSelect(u.id)} style={{ ...checkboxStyle(isSelected), marginTop: 2 }}>
                      {isSelected && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 99, background: cor + '20', color: cor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0
                        }}>
                          {(u.nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: cor + '18', color: cor }}>
                          {PAPEL_LABELS[u.cargo] || u.cargo}
                        </span>
                        {isPendente && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#f59e0b18', color: '#f59e0b' }}>Pendente</span>}
                        {isInativo && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#dc262618', color: '#dc2626' }}>Inativo</span>}
                        {!isPendente && !isInativo && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#16a34a18', color: '#16a34a' }}>Ativo</span>}
                        <span style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{nomesEmpresas.length} empresa(s)</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setViewUsuario(u)} style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: 'var(--c-text)', fontFamily: 'inherit' }}>
                          <Icon name="eye" size={12} /> Visualizar
                        </button>
                        {!u.isConvite && (
                          <button onClick={() => setEditUsuario({
                            id: u.id, nome: u.nome, email: u.email, cargo: cargoNorm,
                            empresasIds: u.isConvite ? (u.empresas_ids || []) : (usuariosEmpresas[u.id] || []),
                            ativo: u.ativo !== false
                          })} style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: 'var(--c-primary)', fontFamily: 'inherit' }}>
                            <Icon name="edit" size={12} /> Editar
                          </button>
                        )}
                        <button onClick={() => setConfirmRevogar({ id: u.id, isConvite: u.isConvite })} style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11, color: '#dc2626', fontFamily: 'inherit' }}>
                          <Icon name="trash" size={12} /> Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // --- Desktop row ---
            return (
              <div key={u.id} style={{
                display: 'grid', gridTemplateColumns: '40px 1.5fr 1.8fr 1fr 0.8fr 140px',
                padding: '12px 16px', alignItems: 'center',
                borderBottom: idx < usuariosFiltrados.length - 1 ? '1px solid var(--c-border)' : 'none',
                background: isSelected ? 'var(--c-primary-soft)' : 'transparent',
                transition: 'background 0.15s'
              }}>
                {/* Checkbox */}
                <div>
                  <div onClick={() => toggleSelect(u.id)} style={checkboxStyle(isSelected)}>
                    {isSelected && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}
                  </div>
                </div>

                {/* Nome + Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 99, background: cor + '20', color: cor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0
                  }}>
                    {(u.nome || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.nome}</div>
                    <div style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>{nomesEmpresas.length} empresa(s)</div>
                  </div>
                </div>

                {/* Email */}
                <div style={{ fontSize: 13, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>

                {/* Cargo badge */}
                <div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                    background: cor + '18', color: cor, whiteSpace: 'nowrap'
                  }}>
                    {PAPEL_LABELS[u.cargo] || u.cargo}
                  </span>
                </div>

                {/* Status */}
                <div>
                  {isPendente && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#f59e0b18', color: '#f59e0b' }}>Pendente</span>}
                  {isInativo && !isPendente && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#dc262618', color: '#dc2626' }}>Inativo</span>}
                  {!isPendente && !isInativo && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: '#16a34a18', color: '#16a34a' }}>Ativo</span>}
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <button onClick={() => setViewUsuario(u)} title="Visualizar" style={{
                    background: 'none', border: '1px solid var(--c-border)', borderRadius: 6,
                    width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon name="eye" size={14} color="var(--c-text-muted)" />
                  </button>
                  {!u.isConvite && (
                    <button onClick={() => setEditUsuario({
                      id: u.id, nome: u.nome, email: u.email, cargo: cargoNorm,
                      empresasIds: u.isConvite ? (u.empresas_ids || []) : (usuariosEmpresas[u.id] || []),
                      ativo: u.ativo !== false
                    })} title="Editar" style={{
                      background: 'none', border: '1px solid var(--c-border)', borderRadius: 6,
                      width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon name="edit" size={14} color="var(--c-primary)" />
                    </button>
                  )}
                  <button onClick={() => setConfirmRevogar({ id: u.id, isConvite: u.isConvite })} title="Excluir" style={{
                    background: 'none', border: '1px solid var(--c-border)', borderRadius: 6,
                    width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon name="trash" size={14} color="#dc2626" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Rodapé da tabela */}
          <div style={{
            padding: '10px 16px', borderTop: '1px solid var(--c-border)', background: 'var(--c-bg)',
            fontSize: 12, color: 'var(--c-text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>
              {selecionados.length > 0
                ? `${selecionados.length} de ${usuariosFiltrados.length} selecionado(s)`
                : `${usuariosFiltrados.length} usuário(s) encontrado(s)`}
            </span>
            {selecionados.length > 0 && (
              <button onClick={() => setSelecionados([])} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                color: 'var(--c-primary)', fontFamily: 'inherit', textDecoration: 'underline'
              }}>
                Limpar seleção
              </button>
            )}
          </div>
        </div>
      )}

      {/* ====== MODAIS ====== */}

      {/* Modal: Visualizar Usuário */}
      {viewUsuario && (() => {
        const u = viewUsuario;
        const cargoNorm = getCargoNormalizado(u.cargo);
        const cor = corPapel[cargoNorm] || corPapel[u.cargo] || 'var(--c-primary)';
        const nomesEmpresas = getNomeEmpresas(u);
        const isInativo = u.ativo === false;
        const isPendente = u.status === 'pendente';
        return (
          <Modal open onClose={() => setViewUsuario(null)} title="Detalhes do Usuário" width={520}
            footer={<>
              {!u.isConvite && (
                <Btn variant="secondary" onClick={() => {
                  setViewUsuario(null);
                  setEditUsuario({
                    id: u.id, nome: u.nome, email: u.email, cargo: cargoNorm,
                    empresasIds: u.isConvite ? (u.empresas_ids || []) : (usuariosEmpresas[u.id] || []),
                    ativo: u.ativo !== false
                  });
                }}>
                  <Icon name="edit" size={14} /> Editar
                </Btn>
              )}
              <Btn variant="primary" onClick={() => setViewUsuario(null)}>Fechar</Btn>
            </>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Avatar + nome */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 99, background: cor + '20', color: cor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, flexShrink: 0
                }}>
                  {(u.nome || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{u.nome}</div>
                  <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>{u.email}</div>
                </div>
              </div>

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, border: '1px solid var(--c-border)', overflow: 'hidden' }}>
                {[
                  { label: 'Cargo', value: <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: cor + '18', color: cor }}>{PAPEL_LABELS[u.cargo] || u.cargo}</span> },
                  { label: 'Status', value: isPendente
                    ? <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: '#f59e0b18', color: '#f59e0b' }}>Pendente</span>
                    : isInativo
                    ? <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: '#dc262618', color: '#dc2626' }}>Inativo</span>
                    : <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: '#16a34a18', color: '#16a34a' }}>Ativo</span>
                  },
                  { label: 'Empresas vinculadas', value: nomesEmpresas.length === 0
                    ? <span style={{ color: 'var(--c-text-muted)', fontSize: 13 }}>Nenhuma</span>
                    : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {nomesEmpresas.map((n, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--c-bg)', border: '1px solid var(--c-border)' }}>{n}</span>
                        ))}
                      </div>
                  },
                  { label: 'Criado em', value: <span style={{ fontSize: 13 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}</span> }
                ].map((row, i, arr) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--c-border)' : 'none',
                    background: i % 2 === 0 ? 'var(--c-surface)' : 'var(--c-bg)'
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</span>
                    <div style={{ textAlign: 'right' }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Modal: Criar Usuário */}
      {showCriar && (
        <Modal open onClose={() => { setShowCriar(false); setErros({}); }} title="Criar Novo Usuário" width={560}
          footer={<>
            <Btn variant="secondary" onClick={() => { setShowCriar(false); setErros({}); }} disabled={actionLoading}>Cancelar</Btn>
            <Btn variant="primary" onClick={criarUsuario} disabled={actionLoading}>
              {actionLoading ? 'Criando...' : 'Criar Usuário'}
            </Btn>
          </>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Field label="Nome Completo" style={{ flex:1, minWidth:200 }} erro={erros.nome}>
                <Input value={nomeNovo} onChange={e => setNomeNovo(e.target.value)} placeholder="João Silva" style={{ borderColor: erros.nome ? '#dc2626' : undefined }} />
                {erros.nome && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.nome}</span>}
              </Field>
              <Field label="E-mail" style={{ flex:1, minWidth:200 }} erro={erros.email}>
                <Input type="email" value={emailNovo} onChange={e => setEmailNovo(e.target.value)} placeholder="joao@empresa.com" style={{ borderColor: erros.email ? '#dc2626' : undefined }} />
                {erros.email && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.email}</span>}
              </Field>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <Field label="Senha Temporária" style={{ flex:1, minWidth:200 }} erro={erros.senha}>
                <Input type="text" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} placeholder="Defina uma senha" style={{ borderColor: erros.senha ? '#dc2626' : undefined }} />
                {erros.senha && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.senha}</span>}
              </Field>
              <Field label="Cargo / Papel" style={{ flex:1, minWidth:200 }}>
                <CustomSelect value={papelNovo} onChange={e => {
                  setPapelNovo(e.target.value);
                  if(e.target.value==='admin') setEmpresasSelecionadas(data.empresas.map(em=>em.id));
                }} options={PAPEIS.map(p=>({value:p.value, label:p.label}))} />
              </Field>
            </div>

            {papelNovo !== 'admin' && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Empresas com acesso
                </div>
                <div style={{ border: '1.5px solid var(--c-border)', borderRadius: 10, overflow: 'hidden', background: 'var(--c-surface)', maxHeight: 200, overflowY: 'auto' }}>
                  {data.empresas?.length === 0 ? (
                    <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--c-text-muted)', textAlign: 'center' }}>
                      Nenhuma empresa cadastrada
                    </div>
                  ) : (data.empresas || []).map((emp, i) => {
                    const selecionada = empresasSelecionadas.includes(emp.id);
                    return (
                      <div key={emp.id} onClick={() => {
                          if (selecionada) setEmpresasSelecionadas(empresasSelecionadas.filter(id => id !== emp.id));
                          else setEmpresasSelecionadas([...empresasSelecionadas, emp.id]);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
                          borderBottom: i < data.empresas.length - 1 ? '1px solid var(--c-border)' : 'none',
                          background: selecionada ? 'var(--c-primary-soft)' : 'transparent',
                          transition: 'background 0.1s'
                        }}>
                        <div style={checkboxStyle(selecionada)}>
                          {selecionada && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text)' }}>{emp.nome}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 6 }}>
                  Selecione quais empresas este usuário poderá acessar.
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal: Editar Usuário */}
      {editUsuario && (
        <ModalEditarUsuario
          usuario={editUsuario}
          todasEmpresas={data.empresas}
          onClose={() => setEditUsuario(null)}
          loading={actionLoading}
          onSave={salvarEdicao}
        />
      )}

      {/* Modal: Confirmar exclusão individual */}
      {confirmRevogar && (
        <ModalConfirmacao
          open={true}
          titulo="Excluir Usuário"
          mensagem="Tem certeza que deseja excluir este usuário e revogar todos os seus acessos? Esta ação é permanente e não pode ser desfeita."
          labelConfirmar={actionLoading ? 'Excluindo...' : 'Sim, Excluir'}
          corConfirmar="#dc2626"
          onConfirmar={async () => {
            await executarExclusao(confirmRevogar.id, confirmRevogar.isConvite);
            setConfirmRevogar(null);
          }}
          onCancelar={() => setConfirmRevogar(null)}
        />
      )}

      {/* Modal: Confirmar exclusão em lote */}
      {confirmLote && (
        <ModalConfirmacao
          open={true}
          titulo="Excluir Usuários em Lote"
          mensagem={`Tem certeza que deseja excluir ${selecionados.length} usuário(s) selecionado(s)? Esta ação é permanente, todos os acessos serão revogados e as contas apagadas.`}
          labelConfirmar={actionLoading ? 'Excluindo...' : `Excluir ${selecionados.length} usuário(s)`}
          corConfirmar="#dc2626"
          onConfirmar={executarExclusaoLote}
          onCancelar={() => setConfirmLote(false)}
        />
      )}
    </div>
  );
}

function ModalEditarUsuario({ usuario, todasEmpresas, onClose, onSave, loading }) {
  const [nome, setNome] = useState_S(usuario.nome);
  const [email, setEmail] = useState_S(usuario.email);
  const [cargo, setCargo] = useState_S(usuario.cargo);
  const [ativo, setAtivo] = useState_S(usuario.ativo);
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState_S(usuario.empresasIds || []);
  const toast = useToast();

  const PAPEIS = [
    { value: 'admin', label: 'Administrador' },
    { value: 'analista', label: 'Analista' },
    { value: 'visualizador', label: 'Visualizador' }
  ];

  function salvar() {
    if (!nome.trim()) return toast.push('Nome é obrigatório', 'error');
    if (!email.trim()) return toast.push('E-mail é obrigatório', 'error');

    onSave({
      id: usuario.id,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      cargo,
      ativo,
      empresasIds: cargo === 'admin' ? todasEmpresas.map(e => e.id) : empresasSelecionadas
    });
  }

  const checkboxStyle = (checked) => ({
    width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
    border: `1.5px solid ${checked ? 'var(--c-primary)' : 'var(--c-border)'}`,
    background: checked ? 'var(--c-primary)' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s ease'
  });

  return (
    <Modal open onClose={onClose} title="Editar Usuário" width={560}
      footer={<>
        <Btn variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Btn>
        <Btn variant="primary" onClick={salvar} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Btn>
      </>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Nome Completo">
          <Input value={nome} onChange={e => setNome(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Cargo / Função">
            <CustomSelect value={cargo} onChange={e => {
              setCargo(e.target.value);
              if (e.target.value === 'admin') {
                setEmpresasSelecionadas(todasEmpresas.map(emp => emp.id));
              }
            }} options={PAPEIS} />
          </Field>
          <Field label="Status da Conta">
            <CustomSelect value={ativo ? 'ativo' : 'inativo'} onChange={e => setAtivo(e.target.value === 'ativo')} options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'inativo', label: 'Inativo' }
            ]} />
          </Field>
        </div>

        {cargo !== 'admin' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Empresas com acesso
            </div>
            <div style={{ border: '1.5px solid var(--c-border)', borderRadius: 10, overflow: 'hidden', background: 'var(--c-surface)', maxHeight: 200, overflowY: 'auto' }}>
              {todasEmpresas.length === 0 ? (
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--c-text-muted)', textAlign: 'center' }}>
                  Nenhuma empresa cadastrada
                </div>
              ) : todasEmpresas.map((emp, i) => {
                const selecionada = empresasSelecionadas.includes(emp.id);
                return (
                  <div key={emp.id} onClick={() => {
                    if (selecionada) setEmpresasSelecionadas(empresasSelecionadas.filter(id => id !== emp.id));
                    else setEmpresasSelecionadas([...empresasSelecionadas, emp.id]);
                  }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
                      borderBottom: i < todasEmpresas.length - 1 ? '1px solid var(--c-border)' : 'none',
                      background: selecionada ? 'var(--c-primary-soft)' : 'transparent',
                      transition: 'background 0.1s'
                    }}
                  >
                    <div style={checkboxStyle(selecionada)}>
                      {selecionada && <Icon name="check" size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text)' }}>{emp.nome}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}




// =========================================================================
// ABA 8: NOTIFICAÇÕES
// =========================================================================

function AbaNotificacoes({ session }) {
  const [prefs, setPrefs] = useState_S({
    email_vencimento: true,
    email_vencimento_dias: 3,
    email_resumo_semanal: true,
    email_resumo_dia_semana: 1,
    email_inadimplencia: true,
    email_novo_lancamento: false,
    email_relatorio_mensal: true,
  });
  const [loading, setLoading] = useState_S(false);
  const [salvando, setSalvando] = useState_S(false);
  const toast = useToast();

  const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  useEffect_S(() => { carregarPrefs(); }, []);

  async function carregarPrefs() {
    setLoading(true);
    const { data } = await window.supabaseClient
      .from('preferencias_notificacao')
      .select('*').eq('user_id', session.user.id);
    if (data && data.length > 0) setPrefs(data[0]);
    setLoading(false);
  }

  async function salvar() {
    setSalvando(true);
    const { error } = await window.supabaseClient
      .from('preferencias_notificacao')
      .upsert({ user_id: session.user.id, ...prefs }, { onConflict: 'user_id' });
    if (error) toast.push('Erro ao salvar preferências', 'error');
    else toast.push('Preferências de notificação salvas!');
    setSalvando(false);
  }

  function set(k, v) { setPrefs(p => ({ ...p, [k]: v })); }

  if (loading) return <div style={{ padding:24, color:'var(--c-text-muted)' }}>Carregando...</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <AbaHeader titulo="Notificações" descricao="Gerencie seus alertas e relatórios por e-mail." />

      <SecaoConfig titulo="Alertas de vencimento"
        descricao="Receba um e-mail quando lançamentos estiverem próximos do vencimento.">
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:480 }}>
          <ToggleNotif
            label="Alertar vencimentos próximos"
            desc="Envia e-mail X dias antes do vencimento de um lançamento não pago"
            checked={prefs.email_vencimento}
            onChange={v => set('email_vencimento', v)}
          />
          {prefs.email_vencimento && (
            <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft:48 }}>
              <span style={{ fontSize:13, color:'var(--c-text-muted)' }}>Alertar com</span>
              <CustomSelect value={prefs.email_vencimento_dias}
                onChange={e => set('email_vencimento_dias', parseInt(e.target.value))}
                style={{ width:80 }}
                options={[
                  { value: 1, label: "1 dia" },
                  { value: 2, label: "2 dias" },
                  { value: 3, label: "3 dias" },
                  { value: 5, label: "5 dias" },
                  { value: 7, label: "7 dias" }
                ]}
              />
              <span style={{ fontSize:13, color:'var(--c-text-muted)' }}>de antecedência</span>
            </div>
          )}
          <ToggleNotif
            label="Alertar inadimplência"
            desc="E-mail diário listando todos os lançamentos já vencidos e não pagos"
            checked={prefs.email_inadimplencia}
            onChange={v => set('email_inadimplencia', v)}
          />
        </div>
      </SecaoConfig>

      <SecaoConfig titulo="Resumos periódicos"
        descricao="Relatórios automáticos enviados por e-mail.">
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:480 }}>
          <ToggleNotif
            label="Resumo semanal"
            desc="Relatório com entradas, saídas e saldo da semana"
            checked={prefs.email_resumo_semanal}
            onChange={v => set('email_resumo_semanal', v)}
          />
          {prefs.email_resumo_semanal && (
            <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft:48 }}>
              <span style={{ fontSize:13, color:'var(--c-text-muted)' }}>Enviar toda</span>
              <CustomSelect value={prefs.email_resumo_dia_semana}
                onChange={e => set('email_resumo_dia_semana', parseInt(e.target.value))}
                style={{ width:100 }}
                options={[
                  ...DIAS_SEMANA.map((d, i) => ({ value: i, label: d }))
                ]}
              />
            </div>
          )}
          <ToggleNotif
            label="Relatório mensal"
            desc="DRE simplificado e fechamento do mês enviado no 1º dia do mês seguinte"
            checked={prefs.email_relatorio_mensal}
            onChange={v => set('email_relatorio_mensal', v)}
          />
          <ToggleNotif
            label="Novo lançamento criado"
            desc="Notificação a cada novo lançamento registrado (útil para equipes)"
            checked={prefs.email_novo_lancamento}
            onChange={v => set('email_novo_lancamento', v)}
          />
        </div>
      </SecaoConfig>

      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <Btn variant="primary" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar preferências'}
        </Btn>
        <span style={{ fontSize:12, color:'var(--c-text-muted)' }}>
          Os e-mails serão enviados para {session?.user?.email}
        </span>
      </div>

      {/* Nota */}
      <div style={{ background:'var(--c-bg)', border:'1px solid var(--c-border)',
        borderRadius:10, padding:'12px 16px', fontSize:12, color:'var(--c-text-muted)',
        lineHeight:1.6, maxWidth:480, marginTop:12 }}>
        ℹ️ As notificações por e-mail requerem configuração de um serviço de envio
        (Resend, SendGrid ou SMTP). As preferências já são salvas e estarão prontas
        quando o serviço for integrado.
      </div>
    </div>
  );
}

function ToggleNotif({ label, desc, checked, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
      <div style={{ flexShrink:0, marginTop:2 }}>
        {/* Toggle inline — não depende de componente externo */}
        <button
          type="button"
          onClick={() => onChange(!checked)}
          style={{
            width: 44, height: 24, borderRadius: 99,
            background: checked ? 'var(--c-primary)' : 'var(--c-border)',
            border: 'none', cursor: 'pointer', position: 'relative',
            transition: 'background 0.2s', flexShrink: 0
          }}
        >
          <span style={{
            position: 'absolute', top: 2,
            left: checked ? 22 : 2,
            width: 20, height: 20, borderRadius: 99,
            background: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            transition: 'left 0.2s'
          }} />
        </button>
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:'var(--c-text)' }}>
          {label}
        </div>
        <div style={{ fontSize:12, color:'var(--c-text-muted)', lineHeight:1.4 }}>
          {desc}
        </div>
      </div>
    </div>
  );
}

function AbaBackup({ data }) {
  const toast = useToast();
  function doExport() {
    exportarBackup(data);
    toast.push('Backup gerado com sucesso!');
  }
  return (
    <div>
      <AbaHeader titulo="Backup de Dados" descricao="Faça o download de todos os seus dados em um único arquivo XLSX." />
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--c-text-muted)' }}>
            Este arquivo contém abas separadas para: Empresas, Lançamentos, Portadores, e Centros de Custo. 
            Mantenha este arquivo em local seguro, pois ele contém todas as informações financeiras registradas no sistema.
          </div>
          <div>
            <Btn variant="primary" icon="download" onClick={doExport}>Baixar Backup (.xlsx)</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { Configuracoes });
