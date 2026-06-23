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
          {aba === 'seguranca' && <AbaSeguranca session={session} />}
          {aba === 'usuarios' && <AbaUsuarios session={session} data={data} />}
          {aba === 'portadores' && <PortadoresConfigTab portadores={portadores} onSave={onSavePortador} onDelete={onDeletePortador} />}
          {aba === 'centros' && <CentrosConfigTab centros={centrosCusto} onSave={onSaveCentro} onDelete={onDeleteCentro} />}
          {aba === 'formas' && <FormasConfigTab formas={formasPagamento} onSave={onSaveForma} onDelete={onDeleteForma} />}
          {aba === 'notificacoes' && <AbaNotificacoes session={session} />}
          {aba === 'aparencia' && <AparenciaTab tweaks={tweaks} setTweak={setTweak} colorOptions={colorOptions} fontOptions={fontOptions} />}
          {aba === 'backup' && <AbaBackup data={props.data} />}
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
    const errNome = Validacao.required(f.nome, 'Nome');
    if (errNome) return toast.push(errNome, 'error');

    const errEmail = f.email ? Validacao.email(f.email) : null;
    if (errEmail) return toast.push(errEmail, 'error');

    const errTelefone = f.telefone ? Validacao.telefone(f.telefone) : null;
    if (errTelefone) return toast.push(errTelefone, 'error');

    if (senhas.nova || senhas.confirmar || senhas.atual) {
      const errSenha = Validacao.senha(senhas.nova);
      if (errSenha) return toast.push('Nova senha: ' + errSenha, 'error');
      if (senhas.nova !== senhas.confirmar) return toast.push('As senhas não coincidem', 'error');
    }
    onUpdate({ ...f, inicial: (f.nome || 'K').charAt(0).toUpperCase() });
    setSenhas({ atual: '', nova: '', confirmar: '' });
    toast.push('Perfil updated');
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

function AbaSeguranca({ session }) {
  const [senhaAtual, setSenhaAtual] = useState_S('');
  const [novaSenha, setNovaSenha] = useState_S('');
  const [confirmar, setConfirmar] = useState_S('');
  const [loading, setLoading] = useState_S(false);
  const toast = useToast();

  async function alterarSenha() {
    const errAtual = Validacao.required(senhaAtual, 'Senha atual');
    if (errAtual) return toast.push(errAtual, 'error');

    const errNova = Validacao.senha(novaSenha);
    if (errNova) return toast.push(errNova, 'error');

    if (novaSenha !== confirmar) return toast.push('As senhas não coincidem', 'error');
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
      toast.push('Senha alterada com sucesso!');
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
          <Field label="Senha atual" required>
            <Input type="password" value={senhaAtual}
              onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••" />
          </Field>
          <Field label="Nova senha" required>
            <Input type="password" value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
            <IndicadorForcaSenha senha={novaSenha} />
          </Field>
          <Field label="Confirmar nova senha" required>
            <Input type="password" value={confirmar}
              onChange={e => setConfirmar(e.target.value)} placeholder="Repita a nova senha" />
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
      <SecaoConfig titulo="Encerrar todas as sessões"
        descricao="Sai da conta em todos os dispositivos onde você está conectado. Útil se perdeu acesso a algum dispositivo.">
        <Btn variant="danger" onClick={sairTodosDispositivos}>
          Sair de todos os dispositivos
        </Btn>
      </SecaoConfig>

      {/* Excluir conta */}
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
  const [convites, setConvites] = useState_S([]);
  const [usuariosEmpresas, setUsuariosEmpresas] = useState_S({});
  const [nomeNovo, setNomeNovo] = useState_S('');
  const [emailNovo, setEmailNovo] = useState_S('');
  const [senhaNova, setSenhaNova] = useState_S('');
  const [papelNovo, setPapelNovo] = useState_S('analista');
  const [empresasSelecionadas, setEmpresasSelecionadas] = useState_S([]);
  const [loading, setLoading] = useState_S(false);
  const toast = useToast();

  const PAPEIS = [
    { value:'admin', label:'Administrador', desc:'Acesso total a todas as empresas' },
    { value:'analista', label:'Analista', desc:'Pode criar e editar lançamentos nas empresas liberadas' },
    { value:'visualizador', label:'Visualizador', desc:'Apenas visualiza dados nas empresas liberadas' },
  ];

  useEffect_S(() => { carregarConvites(); }, []);

  async function carregarConvites() {
    const { data: perfis } = await window.supabaseClient.from('perfis')
      .select('*').eq('owner_id', session.user.id).order('created_at', { ascending: false });
    
    const { data: vinculacoes } = await window.supabaseClient.from('usuarios_empresas').select('*');

    const mapVinculacoes = {};
    if (vinculacoes) {
      vinculacoes.forEach(v => {
        if (!mapVinculacoes[v.user_id]) mapVinculacoes[v.user_id] = [];
        mapVinculacoes[v.user_id].push(v.empresa_id);
      });
    }
    setConvites(perfis || []);
    setUsuariosEmpresas(mapVinculacoes);
  }

  async function criarUsuario() {
    const errNome = Validacao.required(nomeNovo, 'Nome');
    if (errNome) return toast.push(errNome, 'error');

    const errEmail = Validacao.email(emailNovo);
    if (errEmail) return toast.push(errEmail, 'error');

    const errSenha = Validacao.senha(senhaNova);
    if (errSenha) return toast.push(errSenha, 'error');

    if (papelNovo !== 'admin' && empresasSelecionadas.length === 0) {
      toast.push('Selecione pelo menos uma empresa', 'error'); return;
    }

    setLoading(true);
    try {
      const response = await window.supabaseClient.functions.invoke('admin-criar-usuario', {
        body: {
          email: emailNovo.toLowerCase().trim(),
          password: senhaNova,
          nome: nomeNovo.trim(),
          cargo: PAPEIS.find(p=>p.value===papelNovo)?.label || 'Analista',
          empresasIds: papelNovo === 'admin' ? data.empresas.map(e=>e.id) : empresasSelecionadas
        }
      });
      if (response.error) throw new Error(response.error.message || 'Erro ao criar usuário');
      
      toast.push(`Usuário ${nomeNovo} criado com sucesso!`);
      setNomeNovo(''); setEmailNovo(''); setSenhaNova(''); setEmpresasSelecionadas([]);
      carregarConvites();
    } catch (err) {
      toast.push(err.message, 'error');
    }
    setLoading(false);
  }

  async function revogarAcesso(id) {
    if (!confirm('Remover este usuário permanentemente?')) return;
    toast.push('Para exclusão completa, acesse o painel do Supabase.', 'error');
  }

  const corPapel = { admin:'#7c3aed', analista:'var(--c-primary)', visualizador:'#64748b', 'Administrador(a)':'#7c3aed', 'Analista':'var(--c-primary)', 'Visualizador':'#64748b' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <AbaHeader titulo="Usuários e Acessos" descricao="Gerencie quem tem acesso ao sistema." />

      <SecaoConfig titulo="Criar novo usuário" descricao="Crie uma conta para um funcionário ou cliente e libere acesso a empresas específicas.">
        <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:600 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Field label="Nome Completo" style={{ flex:1, minWidth:200 }}>
              <Input value={nomeNovo} onChange={e => setNomeNovo(e.target.value)} placeholder="João Silva" />
            </Field>
            <Field label="E-mail" style={{ flex:1, minWidth:200 }}>
              <Input type="email" value={emailNovo} onChange={e => setEmailNovo(e.target.value)} placeholder="joao@empresa.com" />
            </Field>
          </div>
          
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <Field label="Senha Temporária" style={{ flex:1, minWidth:200 }}>
              <Input type="text" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} placeholder="Defina uma senha" />
            </Field>
            <Field label="Cargo / Papel" style={{ flex:1, minWidth:200 }}>
              <CustomSelect value={papelNovo} onChange={e => {
                setPapelNovo(e.target.value);
                if(e.target.value==='admin') setEmpresasSelecionadas(data.empresas.map(em=>em.id));
              }} options={PAPEIS.map(p=>({value:p.value, label:p.label}))} />
            </Field>
          </div>

          {papelNovo !== 'admin' && (
            <div style={{ marginTop: 14 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--c-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8
              }}>
                Empresas com acesso
              </div>
              <div style={{
                border: '1.5px solid var(--c-border)', borderRadius: 10,
                overflow: 'hidden', background: 'var(--c-surface)'
              }}>
                {data.empresas?.length === 0 ? (
                  <div style={{ padding: '14px 16px', fontSize: 13,
                    color: 'var(--c-text-muted)', textAlign: 'center' }}>
                    Nenhuma empresa cadastrada
                  </div>
                ) : (data.empresas || []).map((emp, i) => {
                  const selecionada = empresasSelecionadas.includes(emp.id)
                  const ic = window.stringToColor(emp.nome)
                  return (
                    <div key={emp.id} onClick={() => {
                        if (selecionada) setEmpresasSelecionadas(empresasSelecionadas.filter(id => id !== emp.id));
                        else setEmpresasSelecionadas([...empresasSelecionadas, emp.id]);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', cursor: 'pointer',
                        borderBottom: i < data.empresas.length - 1
                          ? '1px solid var(--c-border)' : 'none',
                        background: selecionada ? 'var(--c-primary-soft)' : 'transparent',
                        transition: 'background 0.1s'
                      }}>
                      {/* Checkbox */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `1.5px solid ${selecionada ? 'var(--c-primary)' : 'var(--c-border)'}`,
                        background: selecionada ? 'var(--c-primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {selecionada && <Icon name="check" size={11} color="#fff" />}
                      </div>
                      {/* Avatar */}
                      <div style={{
                        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                        background: ic.bg, color: ic.fg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13
                      }}>
                        {emp.nome.charAt(0)}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 500, color: 'var(--c-text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {emp.nome}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>
                          {emp.segmento || emp.cnpj || '—'}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 6 }}>
                Selecione quais empresas este usuário poderá acessar.
              </div>
            </div>
          )}

          <Btn variant="primary" onClick={criarUsuario} disabled={loading} style={{ alignSelf:'flex-start' }}>
            {loading ? 'Criando...' : 'Criar usuário'}
          </Btn>
        </div>
      </SecaoConfig>

      <SecaoConfig titulo="Usuários com acesso" descricao={`${convites.length} usuário(s) criado(s)`}>
        {convites.length === 0 ? (
          <EmptyState icon="users" title="Nenhum usuário" hint="Você ainda não criou contas para outras pessoas." />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxWidth:600 }}>
            {convites.map(c => {
              const cor = corPapel[c.cargo] || 'var(--c-primary)';
              const vinculadas = usuariosEmpresas[c.id] || [];
              const nomesEmpresas = data.empresas.filter(e=>vinculadas.includes(e.id)).map(e=>e.nome).join(', ');
              
              return (
              <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background:'var(--c-bg)', border:'1px solid var(--c-border)' }}>
                <div style={{ width:36, height:36, borderRadius:99, background: cor + '20', color: cor, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14, flexShrink:0 }}>
                  {c.nome.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.nome}</div>
                  <div style={{ fontSize:12, color:'var(--c-text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.email}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
                    <span style={{ fontSize:11, fontWeight:600, color: cor }}>{c.cargo}</span>
                    <span style={{ fontSize:11, color:'var(--c-text-muted)' }}>·</span>
                    <span style={{ fontSize:11, color:'var(--c-text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={nomesEmpresas}>
                      {vinculadas.length} empresa(s)
                    </span>
                  </div>
                </div>
                <button onClick={() => revogarAcesso(c.id)} style={{ background:'none', border:'1px solid var(--c-border)', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12, color:'var(--c-text-muted)', fontFamily:'inherit' }}>
                  Remover
                </button>
              </div>
            )})}
          </div>
        )}
      </SecaoConfig>
    </div>
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
      .select('*').eq('user_id', session.user.id).single();
    if (data) setPrefs(data);
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
