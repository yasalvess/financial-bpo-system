// App principal - sidebar colapsável + topbar com botão Empresas e search overlay
const { useState: useState_A, useEffect: useEffect_A, useMemo: useMemo_A, useRef: useRef_A } = React;

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#2563EB",
  "fontFamily": "Inter",
  "darkMode": false,
  "density": "comfortable",
  "sidebarCollapsed": false
}/*EDITMODE-END*/;

const COLOR_OPTIONS = ['#2563EB', '#6366F1', '#7C3AED', '#0EA5E9', '#10B981', '#F59E0B'];
const FONT_OPTIONS = ['Inter', 'Manrope', 'IBM Plex Sans', 'DM Sans', 'Sora'];

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

function App() {
  const [data, setData] = useState_A(() => buildInitialData());
  const [route, setRoute] = useState_A({ view: 'central' });
  const [searchOpen, setSearchOpen] = useState_A(false);
  const [newEmpOpen, setNewEmpOpen] = useState_A(false);
  const [editEmp, setEditEmp] = useState_A(null);
  const [notifOpen, setNotifOpen] = useState_A(false);
  const [empresasOpen, setEmpresasOpen] = useState_A(false);
  const [perfilOpen, setPerfilOpen] = useState_A(false);
  const [mobileNavOpen, setMobileNavOpen] = useState_A(false);
  const isMobile = useIsMobile(768);
  const [perfil, setPerfil] = useState_A({
    nome: 'Karla Silva',
    email: 'karla@ksgestao.com.br',
    telefone: '(11) 99999-0000',
    cargo: 'Administradora',
    inicial: 'K',
    foto: null,
  });
  const [empresaInfo, setEmpresaInfo] = useState_A({
    razaoSocial: 'KS Gestão & BPO Financeiro Ltda',
    nomeFantasia: 'KS Gestão',
    cnpj: '12.345.678/0001-00',
    rua: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista',
    cidade: 'São Paulo', estado: 'SP', cep: '01310-100',
    telefone: '(11) 3000-0000', email: 'contato@ksgestao.com.br',
    logo: null,
  });
  const [t, setTweak] = useTweaks(DEFAULT_TWEAKS);

  useEffect_A(() => {
    const root = document.documentElement;
    const [r, g, b] = hexToRgb(t.primaryColor);
    root.style.setProperty('--c-primary', t.primaryColor);
    root.style.setProperty('--c-primary-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--c-primary-soft', `rgba(${r}, ${g}, ${b}, 0.10)`);
    root.style.setProperty('--font-family', `'${t.fontFamily}', system-ui, sans-serif`);
    if (t.darkMode) {
      root.style.setProperty('--c-bg', '#0a0a0f');
      root.style.setProperty('--c-bg-sidebar', '#0a0a0f');
      root.style.setProperty('--c-surface', '#15151c');
      root.style.setProperty('--c-text', '#e7e9ee');
      root.style.setProperty('--c-text-muted', '#8b8fa0');
      root.style.setProperty('--c-border', '#262633');
      root.style.setProperty('--c-card', '#15151c');
      document.body.classList.add('dark');
    } else {
      root.style.setProperty('--c-bg', '#F8FAFC');
      root.style.setProperty('--c-bg-sidebar', '#0F172A');
      root.style.setProperty('--c-surface', '#fff');
      root.style.setProperty('--c-text', '#0F172A');
      root.style.setProperty('--c-text-muted', '#64748B');
      root.style.setProperty('--c-border', '#E2E8F0');
      root.style.setProperty('--c-card', '#fff');
      document.body.classList.remove('dark');
    }
  }, [t]);

  useEffect_A(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setEmpresasOpen(false);
        setPerfilOpen(false);
        setMobileNavOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click fora fecha os dropdowns
  useEffect_A(() => {
    function onClick(e) {
      if (!e.target.closest('[data-dropdown="empresas"]')) setEmpresasOpen(false);
      if (!e.target.closest('[data-dropdown="notif"]')) setNotifOpen(false);
      if (!e.target.closest('[data-dropdown="perfil"]')) setPerfilOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function updatePortadores(portadores) { setData(d => ({ ...d, portadores })); }
  function updateCentros(centrosCusto) { setData(d => ({ ...d, centrosCusto })); }
  function updateFormas(formasPagamento) { setData(d => ({ ...d, formasPagamento })); }

  function createEmpresa(emp) {
    setData(d => ({ ...d, empresas: [...d.empresas, emp], lancamentos: { ...d.lancamentos, [emp.id]: [] } }));
  }
  function editEmpresa(emp) {
    setData(d => ({ ...d, empresas: d.empresas.map(e => e.id === emp.id ? emp : e) }));
  }
  function deleteEmpresa(id) {
    setData(d => {
      const novo = { ...d.lancamentos }; delete novo[id];
      return { ...d, empresas: d.empresas.filter(e => e.id !== id), lancamentos: novo };
    });
    if (route.view === 'empresa' && route.id === id) setRoute({ view: 'central' });
  }
  function upsertLanc(l) {
    setData(d => {
      const cur = d.lancamentos[l.empresaId] || [];
      const exists = cur.some(x => x.id === l.id);
      const novo = exists ? cur.map(x => x.id === l.id ? l : x) : [...cur, l];
      return { ...d, lancamentos: { ...d.lancamentos, [l.empresaId]: novo } };
    });
  }
  function deleteLanc(empId, lancId) {
    setData(d => ({ ...d, lancamentos: { ...d.lancamentos, [empId]: (d.lancamentos[empId] || []).filter(x => x.id !== lancId) } }));
  }
  function payLanc(empId, lancId, payload) {
    setData(d => ({
      ...d,
      lancamentos: {
        ...d.lancamentos,
        [empId]: (d.lancamentos[empId] || []).map(x => x.id === lancId
          ? { ...x, pago: true, portadorId: payload.portadorId, pagamento: { data: payload.data, comprovante: payload.comprovante } }
          : x)
      }
    }));
  }

  const currentEmpresa = route.view === 'empresa' ? data.empresas.find(e => e.id === route.id) : null;
  const collapsed = t.sidebarCollapsed;

  const notifs = useMemo_A(() => {
    const hoje = todayISO();
    const arr = [];
    data.empresas.forEach(e => {
      (data.lancamentos[e.id] || []).forEach(l => {
        if (l.pago) return;
        const s = lancStatus(l, hoje);
        if (s === 'vencido' || s === 'vencendo') arr.push({ ...l, empresaNome: e.nome, empresaId: e.id, statusKey: s });
      });
    });
    return arr.sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }, [data]);

  const breadcrumb = useMemo_A(() => {
    if (route.view === 'central') return [{ label: 'Central de Gestão' }];
    if (route.view === 'lancamentos') return [{ label: 'Lançamentos' }];
    if (route.view === 'relatorios') return [{ label: 'Relatórios' }];
    if (route.view === 'configuracoes') return [{ label: 'Configurações' }];
    if (route.view === 'empresa' && currentEmpresa) {
      return [{ label: 'Central de Gestão', onClick: () => setRoute({ view: 'central' }) }, { label: currentEmpresa.nome }];
    }
    return [];
  }, [route, currentEmpresa]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--c-bg)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={v => setTweak('sidebarCollapsed', v)} route={route} setRoute={setRoute}
        isMobile={isMobile} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <main style={{ flex: 1, minWidth: 0, background: 'var(--c-bg)', display: 'flex', flexDirection: 'column' }}>
        <TopBar
          breadcrumb={breadcrumb}
          isMobile={isMobile}
          onMenuClick={() => setMobileNavOpen(o => !o)}
          onSearchClick={() => setSearchOpen(true)}
          notifCount={notifs.length}
          notifOpen={notifOpen}
          onNotifClick={() => { setNotifOpen(o => !o); setEmpresasOpen(false); }}
          notifs={notifs}
          onNotifSelect={(empId) => { setRoute({ view: 'empresa', id: empId }); setNotifOpen(false); }}
          empresasCount={data.empresas.length}
          empresasOpen={empresasOpen}
          onEmpresasClick={() => { setEmpresasOpen(o => !o); setNotifOpen(false); }}
          data={data}
          onSelectEmpresa={(id) => { setRoute({ view: 'empresa', id }); setEmpresasOpen(false); }}
          onNewEmpresa={() => { setEmpresasOpen(false); setNewEmpOpen(true); }}
          perfil={perfil}
          perfilOpen={perfilOpen}
          onPerfilClick={() => { setPerfilOpen(o => !o); setNotifOpen(false); setEmpresasOpen(false); }}
          onOpenSettings={(tab) => { setRoute({ view: 'configuracoes', tab }); setPerfilOpen(false); }}
        />

        <div style={{ flex: 1 }}>
          {route.view === 'central' && (
            <CentralGestao
              data={data}
              onOpenEmpresa={(id) => setRoute({ view: 'empresa', id })}
              onCreateEmpresa={() => setNewEmpOpen(true)}
              onEditEmpresa={(emp) => setEditEmp(emp)}
              onDeleteEmpresa={deleteEmpresa}
              onOpenSearch={() => setSearchOpen(true)}
            />
          )}
          {route.view === 'empresa' && currentEmpresa && (
            <WorkspaceEmpresa
              empresa={currentEmpresa}
              lancamentos={data.lancamentos[currentEmpresa.id] || []}
              portadores={data.portadores}
              centrosCusto={data.centrosCusto}
              formasPagamento={data.formasPagamento}
              onBack={() => setRoute({ view: 'central' })}
              onUpsertLanc={upsertLanc}
              onDeleteLanc={(lancId) => deleteLanc(currentEmpresa.id, lancId)}
              onPayLanc={(lancId, payload) => payLanc(currentEmpresa.id, lancId, payload)}
            />
          )}
          {route.view === 'lancamentos' && <LancamentosGlobais data={data} onOpenEmpresa={(id) => setRoute({ view: 'empresa', id })} />}
          {route.view === 'relatorios' && <RelatoriosConsolidados data={data} />}
          {route.view === 'configuracoes' && (
            <Configuracoes
              initialTab={route.tab}
              perfil={perfil}
              onUpdatePerfil={(novo) => setPerfil(p => ({ ...p, ...novo }))}
              empresaInfo={empresaInfo}
              onUpdateEmpresaInfo={(novo) => setEmpresaInfo(p => ({ ...p, ...novo }))}
              portadores={data.portadores}
              centrosCusto={data.centrosCusto}
              formasPagamento={data.formasPagamento}
              onUpdatePortadores={updatePortadores}
              onUpdateCentros={updateCentros}
              onUpdateFormas={updateFormas}
              tweaks={t}
              setTweak={setTweak}
              colorOptions={COLOR_OPTIONS}
              fontOptions={FONT_OPTIONS}
            />
          )}
        </div>
      </main>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={data}
        onSelectEmpresa={(id) => { setRoute({ view: 'empresa', id }); setSearchOpen(false); }}
        onNewEmpresa={() => { setSearchOpen(false); setNewEmpOpen(true); }}
      />

      {(newEmpOpen || editEmp) && (
        <EmpresaWizard
          empresa={editEmp}
          portadores={data.portadores}
          centrosCusto={data.centrosCusto}
          onClose={() => { setNewEmpOpen(false); setEditEmp(null); }}
          onSave={(emp) => {
            if (editEmp) editEmpresa(emp); else createEmpresa(emp);
            setNewEmpOpen(false); setEditEmp(null);
          }}
          onDelete={editEmp ? () => {
            if (confirm(`Excluir "${editEmp.nome}"? Todos os lançamentos serão removidos.`)) {
              deleteEmpresa(editEmp.id); setEditEmp(null);
            }
          } : null}
        />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Aparência">
          <TweakColor label="Cor primária" value={t.primaryColor} options={COLOR_OPTIONS} onChange={v => setTweak('primaryColor', v)} />
          <TweakToggle label="Modo escuro" value={t.darkMode} onChange={v => setTweak('darkMode', v)} />
          <TweakSelect label="Fonte" value={t.fontFamily} options={FONT_OPTIONS} onChange={v => setTweak('fontFamily', v)} />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Densidade" value={t.density} options={['compact', 'comfortable', 'spacious']} onChange={v => setTweak('density', v)} />
          <TweakToggle label="Sidebar colapsada" value={t.sidebarCollapsed} onChange={v => setTweak('sidebarCollapsed', v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ----- Sidebar — SEM lista de empresas -----
function Sidebar({ collapsed, setCollapsed, route, setRoute, isMobile, mobileOpen, onCloseMobile }) {
  const items = [
    { id: 'central', label: 'Central de Gestão', icon: 'home', view: 'central' },
    { id: 'lancamentos', label: 'Lançamentos', icon: 'list', view: 'lancamentos' },
    { id: 'relatorios', label: 'Relatórios', icon: 'chart', view: 'relatorios' },
  ];
  // No mobile o menu é sempre expandido (drawer); no desktop respeita o colapso
  collapsed = isMobile ? false : collapsed;
  const w = collapsed ? 64 : 220;
  const navigate = (view) => { setRoute({ view }); if (isMobile) onCloseMobile(); };
  const asideStyle = isMobile
    ? {
        width: 240, background: 'var(--c-bg-sidebar)', color: '#fff',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1000,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease', overflow: 'hidden',
        boxShadow: mobileOpen ? '0 0 40px rgba(0,0,0,.4)' : 'none'
      }
    : {
        width: w, background: 'var(--c-bg-sidebar)', color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
        transition: 'width 0.22s ease', overflow: 'hidden'
      };
  return (
    <>
    {isMobile && mobileOpen && (
      <div onClick={onCloseMobile} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(2px)', zIndex: 999 }} />
    )}
    <aside style={asideStyle}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '20px 13px' : '20px 16px', display: 'flex', alignItems: 'center', gap: 10, height: 64, boxSizing: 'border-box', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0, letterSpacing: '-0.02em' }}>K</div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.01em', whiteSpace: 'nowrap', color: '#fff' }}>KS Gestão</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>BPO Financeiro</div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: collapsed ? '0 13px' : '0 16px', flexShrink: 0 }} />

      {/* Nav items */}
      <nav style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        {!collapsed && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 10px 6px' }}>
            Visão Geral
          </div>
        )}
        {items.map(item => {
          const active = route.view === item.view || (route.view === 'empresa' && item.view === 'central');
          return (
            <button key={item.id} onClick={() => navigate(item.view)} title={collapsed ? item.label : undefined}
              style={{
                background: active ? 'rgba(var(--c-primary-rgb), 0.16)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,.6)',
                border: 'none', padding: collapsed ? '10px 0' : '9px 12px', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', position: 'relative',
                justifyContent: collapsed ? 'center' : 'flex-start',
                transition: 'background 0.15s, color 0.15s',
                width: '100%'
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon name={item.icon} size={16} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              {active && (
                <span style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: 'var(--c-primary)', borderRadius: '0 2px 2px 0' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: collapsed ? '12px 8px' : '12px 14px', borderTop: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
        {!collapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0 }}>K</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Karla Silva</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Administradora</div>
            </div>
            <button onClick={() => isMobile ? onCloseMobile() : setCollapsed(true)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'color 0.15s', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.35)'}
            >
              <Icon name={isMobile ? 'x' : 'arrowLeft'} size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>K</div>
            <button onClick={() => setCollapsed(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', padding: 2, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.35)'}
            >
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

// ----- TopBar -----
function TopBar({ breadcrumb, isMobile, onMenuClick, onSearchClick, notifCount, onNotifClick, notifOpen, notifs, onNotifSelect, empresasCount, empresasOpen, onEmpresasClick, data, onSelectEmpresa, onNewEmpresa, perfil, perfilOpen, onPerfilClick, onOpenSettings }) {
  return (
    <header style={{
      background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)',
      padding: isMobile ? '0 12px' : '0 20px', height: 58, display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12,
      position: 'sticky', top: 0, zIndex: 50
    }}>

      {/* Botão de menu (mobile) */}
      {isMobile && (
        <button onClick={onMenuClick} title="Menu" style={topBarBtn}>
          <Icon name="menu" size={20} />
        </button>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, flex: 1, minWidth: 0 }}>
        {!isMobile && breadcrumb.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevronRight" size={12} color="var(--c-text-muted)" />}
            {b.onClick ? (
              <button onClick={b.onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', fontSize: 13, padding: '2px 4px', fontFamily: 'inherit', borderRadius: 4, transition: 'color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--c-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-muted)'}
              >{b.label}</button>
            ) : (
              <span style={{ color: 'var(--c-text)', fontWeight: 600, padding: '2px 4px' }}>{b.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Centro: busca */}
      {isMobile ? (
        <button onClick={onSearchClick} title="Pesquisar" style={topBarBtn}>
          <Icon name="search" size={18} />
        </button>
      ) : (
        <button onClick={onSearchClick} style={{
          background: 'var(--c-bg)', border: '1px solid var(--c-border)', borderRadius: 9,
          padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 9,
          cursor: 'pointer', fontSize: 13, color: 'var(--c-text-muted)',
          width: 300, fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s',
          flexShrink: 0
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-soft)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <Icon name="search" size={14} color="var(--c-text-muted)" />
          <span style={{ flex: 1, textAlign: 'left', userSelect: 'none' }}>Pesquisar...</span>
          <kbd style={kbdStyle}>⌘K</kbd>
        </button>
      )}

      {/* Direita */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Botão Empresas com dropdown */}
        <div data-dropdown="empresas" style={{ position: 'relative' }}>
          <button onClick={onEmpresasClick} title="Empresas" style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: isMobile ? '7px 9px' : '6px 11px',
            background: empresasOpen ? 'var(--c-primary-soft)' : 'var(--c-bg)',
            border: `1px solid ${empresasOpen ? 'var(--c-primary)' : 'var(--c-border)'}`,
            borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 500,
            color: empresasOpen ? 'var(--c-primary)' : 'var(--c-text)',
            transition: 'all 0.15s'
          }}
            onMouseEnter={e => { if (!empresasOpen) { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.color = 'var(--c-primary)'; } }}
            onMouseLeave={e => { if (!empresasOpen) { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.color = 'var(--c-text)'; } }}
          >
            <Icon name="building" size={15} />
            {!isMobile && <span style={{ whiteSpace: 'nowrap' }}>Empresas</span>}
            <span style={{
              background: empresasOpen ? 'var(--c-primary)' : 'var(--c-border)',
              color: empresasOpen ? '#fff' : 'var(--c-text-muted)',
              fontSize: 11, fontWeight: 700, padding: '0px 6px', borderRadius: 99, lineHeight: '18px',
              transition: 'all 0.15s', minWidth: 20, textAlign: 'center', display: 'inline-block'
            }}>{empresasCount}</span>
            {!isMobile && (
              <span style={{ transition: 'transform 0.15s', transform: empresasOpen ? 'rotate(180deg)' : 'none', display: 'flex' }}>
                <Icon name="chevronDown" size={13} />
              </span>
            )}
          </button>

          {empresasOpen && (
            <EmpresasDropdown
              data={data}
              onSelectEmpresa={onSelectEmpresa}
              onNewEmpresa={onNewEmpresa}
            />
          )}
        </div>

        {!isMobile && <div style={{ width: 1, height: 20, background: 'var(--c-border)' }} />}

        {/* Notificações */}
        <div data-dropdown="notif" style={{ position: 'relative' }}>
          <button onClick={onNotifClick} style={{ ...topBarBtn, color: notifOpen ? 'var(--c-primary)' : 'var(--c-text-muted)' }}>
            <Icon name="alert" size={17} />
            {notifCount > 0 && (
              <span style={{
                position: 'absolute', top: 5, right: 5, minWidth: 15, height: 15, padding: '0 3px',
                background: '#dc2626', color: '#fff', borderRadius: 99, fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                border: '1.5px solid var(--c-surface)'
              }}>{notifCount > 99 ? '99+' : notifCount}</span>
            )}
          </button>
          {notifOpen && <NotifDropdown notifs={notifs} onSelect={onNotifSelect} />}
        </div>

        {!isMobile && (
          <button style={topBarBtn} title="Configurações" onClick={() => onOpenSettings()}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-bg)'; e.currentTarget.style.color = 'var(--c-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--c-text-muted)'; }}
          ><Icon name="settings" size={17} /></button>
        )}

        {!isMobile && <div style={{ width: 1, height: 20, background: 'var(--c-border)' }} />}

        {/* Avatar + dropdown de perfil */}
        <div data-dropdown="perfil" style={{ position: 'relative' }}>
          <button onClick={onPerfilClick} title="Perfil" style={{
            ...topBarBtn, width: 34, height: 34, borderRadius: 99,
            background: 'var(--c-primary)', color: '#fff', border: 'none',
            boxShadow: perfilOpen ? '0 0 0 3px var(--c-primary-soft)' : 'none', overflow: 'hidden'
          }}>
            {perfil?.foto
              ? <img src={perfil.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontWeight: 700, fontSize: 13 }}>{perfil?.inicial || (perfil?.nome || 'K').charAt(0)}</span>}
          </button>
          {perfilOpen && <PerfilDropdown perfil={perfil} onOpenSettings={onOpenSettings} />}
        </div>
      </div>
    </header>
  );
}

// ----- Dropdown Empresas -----
function EmpresasDropdown({ data, onSelectEmpresa, onNewEmpresa }) {
  const [q, setQ] = useState_A('');
  const inputRef = useRef_A(null);
  const hoje = todayISO();

  useEffect_A(() => { setTimeout(() => inputRef.current?.focus(), 60); }, []);

  const empresasComStats = useMemo_A(() => {
    return data.empresas.map(e => ({
      ...e,
      stats: empresaStats(e, data.lancamentos[e.id] || [], hoje)
    }));
  }, [data]);

  const filtradas = useMemo_A(() => {
    if (!q.trim()) return empresasComStats;
    const ql = q.toLowerCase();
    return empresasComStats.filter(e =>
      e.nome.toLowerCase().includes(ql) ||
      e.cnpj.includes(q) ||
      (e.segmento || '').toLowerCase().includes(ql)
    );
  }, [empresasComStats, q]);

  const grupos = [
    { key: 'vencido', label: 'Vencidas', color: '#ef4444', items: filtradas.filter(e => e.stats.statusEmpresa === 'vencido') },
    { key: 'vencendo', label: 'Vencendo', color: '#f59e0b', items: filtradas.filter(e => e.stats.statusEmpresa === 'vencendo') },
    { key: 'em-dia', label: 'Em dia', color: '#16a34a', items: filtradas.filter(e => e.stats.statusEmpresa === 'em-dia') },
  ];

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      width: 380, background: 'var(--c-surface)',
      border: '1px solid var(--c-border)', borderRadius: 12,
      boxShadow: '0 12px 40px rgba(15,23,42,.13)', zIndex: 200,
      overflow: 'hidden',
      animation: 'dropIn 0.14s cubic-bezier(.16,1,.3,1)'
    }}>
      <style>{`@keyframes dropIn { from { opacity:0; transform:translateY(-8px) scale(.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>

      {/* Search */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="search" size={14} color="var(--c-text-muted)" />
        <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar empresa..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--c-text)', fontFamily: 'inherit' }}
        />
        {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 2 }}><Icon name="x" size={13} /></button>}
      </div>

      {/* Nova empresa — sempre visível no topo */}
      <button onClick={onNewEmpresa} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', background: 'transparent', border: 'none',
        borderBottom: '1px solid var(--c-border)', cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background 0.1s'
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--c-primary-soft)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="plus" size={15} color="#fff" />
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-primary)' }}>Cadastrar nova empresa</div>
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Criar novo workspace de cliente</div>
        </div>
      </button>

      {/* Lista agrupada por status */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {filtradas.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>Nenhuma empresa encontrada</div>
        )}
        {grupos.map(g => {
          if (!g.items.length) return null;
          return (
            <div key={g.key}>
              <div style={{ padding: '8px 14px 3px', fontSize: 10, fontWeight: 700, color: g.color, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: g.color }} />
                {g.label} · {g.items.length}
              </div>
              {g.items.map(e => {
                const ic = stringToColor(e.nome);
                return (
                  <button key={e.id} onClick={() => onSelectEmpresa(e.id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 14px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'background 0.1s'
                  }}
                    onMouseEnter={ev => ev.currentTarget.style.background = 'var(--c-bg)'}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: ic.bg, color: ic.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {e.nome.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--c-text)' }}>{e.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{e.segmento}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: e.stats.saldo >= 0 ? '#16a34a' : '#dc2626', flexShrink: 0 }}>
                      {formatBRL(e.stats.saldo)}
                    </div>
                    <Icon name="chevronRight" size={12} color="var(--c-text-muted)" />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--c-border)', background: 'var(--c-bg)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--c-text-muted)' }}>
        <span>{data.empresas.length} empresa{data.empresas.length !== 1 ? 's' : ''}</span>
        <span>ESC para fechar</span>
      </div>
    </div>
  );
}

// ----- Notif Dropdown -----
function NotifDropdown({ notifs, onSelect }) {
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360,
      background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12,
      boxShadow: '0 12px 40px rgba(15,23,42,.13)', zIndex: 200, overflow: 'hidden',
      animation: 'dropIn 0.14s cubic-bezier(.16,1,.3,1)'
    }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 13 }}>Notificações</strong>
        <span style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{notifs.length} pendência{notifs.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>Tudo em dia ✓</div>
        ) : notifs.slice(0, 15).map(n => (
          <button key={n.id} onClick={() => onSelect(n.empresaId)} style={{
            width: '100%', background: 'transparent', border: 'none', textAlign: 'left',
            padding: '9px 16px', borderBottom: '1px solid var(--c-border)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit', transition: 'background 0.1s'
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--c-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: 7, height: 7, borderRadius: 99, background: n.statusKey === 'vencido' ? '#dc2626' : '#f59e0b', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.empresaNome}</div>
              <div style={{ fontSize: 11, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.descricao} · {formatDate(n.vencimento)}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: n.statusKey === 'vencido' ? '#dc2626' : '#92400e', flexShrink: 0 }}>{formatBRL(n.valor)}</span>
          </button>
        ))}
        {notifs.length > 15 && (
          <div style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, color: 'var(--c-text-muted)' }}>+ {notifs.length - 15} outros</div>
        )}
      </div>
    </div>
  );
}

// ----- Dropdown de Perfil -----
function PerfilDropdown({ perfil, onOpenSettings }) {
  const itemStyle = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px', background: 'transparent', border: 'none',
    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 13,
    color: 'var(--c-text)', transition: 'background 0.1s'
  };
  const items = [
    { icon: 'user', label: 'Meu Perfil', tab: 'perfil' },
    { icon: 'building', label: 'Minha Empresa', tab: 'empresa' },
    { icon: 'settings', label: 'Configurações', tab: 'aparencia' },
  ];
  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 260,
      background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12,
      boxShadow: '0 12px 40px rgba(15,23,42,.13)', zIndex: 200, overflow: 'hidden',
      animation: 'dropIn 0.14s cubic-bezier(.16,1,.3,1)'
    }}>
      {/* Cabeçalho */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 99, background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0, overflow: 'hidden' }}>
          {perfil?.foto
            ? <img src={perfil.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (perfil?.inicial || (perfil?.nome || 'K').charAt(0))}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil?.nome}</div>
          <div style={{ fontSize: 11, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil?.email}</div>
          <div style={{ fontSize: 11, color: 'var(--c-primary)', fontWeight: 600, marginTop: 1 }}>{perfil?.cargo}</div>
        </div>
      </div>

      <div style={{ padding: '6px 0' }}>
        {items.map(it => (
          <button key={it.tab} onClick={() => onOpenSettings(it.tab)} style={itemStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--c-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name={it.icon} size={16} color="var(--c-text-muted)" />
            {it.label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--c-border)' }} />
      <div style={{ padding: '6px 0' }}>
        <button style={{ ...itemStyle, color: '#dc2626' }}
          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Icon name="logout" size={16} color="#dc2626" />
          Sair
        </button>
      </div>
    </div>
  );
}

const topBarBtn = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  width: 34, height: 34, borderRadius: 8, color: 'var(--c-text-muted)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
  transition: 'background 0.15s, color 0.15s'
};

// ----- Search Overlay (Cmd+K) -----
function SearchOverlay({ open, onClose, data, onSelectEmpresa, onNewEmpresa }) {
  const [q, setQ] = useState_A('');
  const inputRef = useRef_A(null);
  const hoje = todayISO();

  useEffect_A(() => {
    if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const empresasFiltered = useMemo_A(() => {
    return data.empresas.map(e => ({
      ...e, stats: empresaStats(e, data.lancamentos[e.id] || [], hoje)
    })).filter(e => !q || e.nome.toLowerCase().includes(q.toLowerCase()) || e.cnpj.includes(q) || (e.segmento || '').toLowerCase().includes(q.toLowerCase()));
  }, [data, q]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 200, paddingTop: '10vh'
    }}>
      <style>{`@keyframes scIn { from { opacity: 0; transform: scale(0.96) translateY(-8px); } to { opacity: 1; transform: none; } }`}</style>
      <div onClick={e => e.stopPropagation()} style={{
        width: '94%', maxWidth: 640, background: 'var(--c-surface)', borderRadius: 14,
        boxShadow: '0 24px 64px rgba(15,23,42,.25)', overflow: 'hidden',
        border: '1px solid var(--c-border)', animation: 'scIn 0.18s cubic-bezier(.16,1,.3,1)'
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="search" size={18} color="var(--c-text-muted)" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
            placeholder="Buscar por empresa, CNPJ ou setor..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', color: 'var(--c-text)', fontFamily: 'inherit' }} />
          <kbd style={kbdStyle}>ESC</kbd>
        </div>

        <button onClick={onNewEmpresa} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--c-border)', fontFamily: 'inherit', transition: 'background 0.1s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--c-primary-soft)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Cadastrar nova empresa</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>Criar workspace para um novo cliente</div>
          </div>
          <kbd style={kbdStyle}>+ N</kbd>
        </button>

        <div style={{ padding: '6px 0', maxHeight: 420, overflowY: 'auto' }}>
          <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {empresasFiltered.length} empresa{empresasFiltered.length !== 1 ? 's' : ''}
          </div>
          {empresasFiltered.length === 0 ? (
            <div style={{ padding: '20px 18px', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>Nenhuma empresa para "{q}"</div>
          ) : empresasFiltered.map(e => {
            const ic = stringToColor(e.nome);
            return (
              <button key={e.id} onClick={() => onSelectEmpresa(e.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.1s' }}
                onMouseEnter={e2 => e2.currentTarget.style.background = 'var(--c-bg)'}
                onMouseLeave={e2 => e2.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: ic.bg, color: ic.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{e.nome.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nome}</span>
                    <Badge status={e.stats.statusEmpresa} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>{e.cnpj} · {e.segmento}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>Saldo</div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: e.stats.saldo >= 0 ? '#16a34a' : '#dc2626' }}>{formatBRL(e.stats.saldo)}</div>
                </div>
                <Icon name="chevronRight" size={14} color="var(--c-text-muted)" />
              </button>
            );
          })}
        </div>

        <div style={{ padding: '8px 18px', borderTop: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--c-bg)', fontSize: 11, color: 'var(--c-text-muted)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span><kbd style={kbdStyle}>↵</kbd> abrir</span>
            <span><kbd style={kbdStyle}>↑↓</kbd> navegar</span>
            <span><kbd style={kbdStyle}>ESC</kbd> fechar</span>
          </div>
          <span>KS Gestão & BPO</span>
        </div>
      </div>
    </div>
  );
}

const kbdStyle = { fontSize: 10, color: 'var(--c-text-muted)', background: 'var(--c-surface)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--c-border)', fontFamily: 'ui-monospace, monospace', marginRight: 4 };

function stringToColor(s) {
  const palette = [
    { bg: '#dbeafe', fg: '#1e40af' }, { bg: '#fce7f3', fg: '#9d174d' },
    { bg: '#dcfce7', fg: '#166534' }, { bg: '#fef3c7', fg: '#92400e' },
    { bg: '#f3e8ff', fg: '#6b21a8' }, { bg: '#ccfbf1', fg: '#115e59' },
    { bg: '#fee2e2', fg: '#991b1b' }, { bg: '#e0e7ff', fg: '#3730a3' },
  ];
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// ----- 2-step Empresa Wizard -----
function EmpresaWizard({ empresa, portadores, centrosCusto, onClose, onSave, onDelete }) {
  const [step, setStep] = useState_A(1);
  const [f, setF] = useState_A(empresa || {
    id: uid('emp'), nome: '', cnpj: '', nomeFantasia: '', segmento: '',
    responsavel: '', email: '', telefone: '',
    portadoresAtivos: [],
    centrosAtivos: [],
    criadaEm: todayISO()
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const canProceed = f.nome.trim() && f.cnpj.trim();

  function submit() {
    if (!f.nome.trim()) { setStep(1); return alert('Nome é obrigatório'); }
    if (!f.cnpj.trim()) { setStep(1); return alert('CNPJ é obrigatório'); }
    onSave(f);
  }
  function togglePort(id) {
    set('portadoresAtivos', f.portadoresAtivos.includes(id) ? f.portadoresAtivos.filter(x => x !== id) : [...f.portadoresAtivos, id]);
  }
  function toggleCC(id) {
    set('centrosAtivos', f.centrosAtivos.includes(id) ? f.centrosAtivos.filter(x => x !== id) : [...f.centrosAtivos, id]);
  }

  return (
    <Modal open onClose={onClose} title={empresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'} width={620}
      footer={<>
        {onDelete && <Btn variant="danger" icon="trash" onClick={onDelete} style={{ marginRight: 'auto' }}>Excluir</Btn>}
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        {step === 1
          ? <Btn variant="primary" disabled={!canProceed} onClick={() => setStep(2)}>Continuar →</Btn>
          : <><Btn variant="secondary" onClick={() => setStep(1)}>← Voltar</Btn><Btn variant="primary" onClick={submit}>{empresa ? 'Salvar' : 'Cadastrar'}</Btn></>
        }
      </>}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        {[{ n: 1, label: 'Dados básicos' }, { n: 2, label: 'Configurações' }].map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 99, background: step >= s.n ? 'var(--c-primary)' : 'var(--c-border)', color: step >= s.n ? '#fff' : 'var(--c-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0, transition: 'all 0.2s' }}>
                {step > s.n ? <Icon name="check" size={12} /> : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? 'var(--c-text)' : 'var(--c-text-muted)' }}>{s.label}</span>
            </div>
            {i === 0 && <div style={{ flex: 1, height: 2, background: step > 1 ? 'var(--c-primary)' : 'var(--c-border)', transition: 'background 0.2s' }} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Razão Social" required span={2}><Input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Padaria Bom Pão Ltda" autoFocus /></Field>
          <Field label="Nome Fantasia" span={2}><Input value={f.nomeFantasia || ''} onChange={e => set('nomeFantasia', e.target.value)} placeholder="Como a empresa é conhecida" /></Field>
          <Field label="CNPJ" required><Input value={f.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" /></Field>
          <Field label="Setor"><Input value={f.segmento || ''} onChange={e => set('segmento', e.target.value)} placeholder="Ex: Alimentação" /></Field>
          <Field label="Responsável"><Input value={f.responsavel || ''} onChange={e => set('responsavel', e.target.value)} /></Field>
          <Field label="Telefone"><Input value={f.telefone || ''} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" /></Field>
          <Field label="E-mail" span={2}><Input value={f.email || ''} type="email" onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com.br" /></Field>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Portadores bancários</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 10 }}>Selecione os bancos, caixas e cofres desta empresa</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
              {portadores.map(p => {
                const checked = f.portadoresAtivos.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => togglePort(p.id)} style={{ padding: '9px 12px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${checked ? 'var(--c-primary)' : 'var(--c-border)'}`, background: checked ? 'var(--c-primary-soft)' : 'var(--c-surface)', display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <div style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${checked ? 'var(--c-primary)' : 'var(--c-border)'}`, background: checked ? 'var(--c-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {checked && <Icon name="check" size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: p.cor, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text)' }}>{p.nome}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Centros de custo</div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 10 }}>Categorias para classificar os lançamentos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
              {centrosCusto.map(c => {
                const checked = f.centrosAtivos.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => toggleCC(c.id)} style={{ padding: '9px 12px', borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${checked ? 'var(--c-primary)' : 'var(--c-border)'}`, background: checked ? 'var(--c-primary-soft)' : 'var(--c-surface)', display: 'flex', alignItems: 'center', gap: 9, fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    <div style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${checked ? 'var(--c-primary)' : 'var(--c-border)'}`, background: checked ? 'var(--c-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {checked && <Icon name="check" size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text)', flex: 1 }}>{c.nome}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>{c.tipo === 'entrada' ? 'E' : 'S'}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ background: 'var(--c-primary-soft)', border: '1px solid var(--c-primary)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--c-primary)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Icon name="check" size={15} />
            Tudo pronto! Após cadastrar, você poderá lançar receitas e despesas no workspace.
          </div>
        </div>
      )}
    </Modal>
  );
}

// Render
ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
