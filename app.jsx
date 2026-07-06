// App principal - sidebar colapsável + topbar com botão Empresas e search overlay
const { useState: useState_A, useEffect: useEffect_A, useMemo: useMemo_A, useRef: useRef_A } = React;

const DEFAULT_TWEAKS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#2563EB",
  "fontFamily": "Inter",
  "darkMode": false,
  "density": "comfortable",
  "sidebarCollapsed": false
}/*EDITMODE-END*/;

const COLOR_OPTIONS = ['#2F5D8A','#123A63','#0B1D39','#9CC7E6','#2563EB','#6366F1'];
const FONT_OPTIONS = ['Inter', 'Manrope', 'IBM Plex Sans', 'DM Sans', 'Sora'];

function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

function App() {
  const toast = useToast();
  const [session, setSession] = useState_A(null);
  const [loadingAuth, setLoadingAuth] = useState_A(true);
  const [perfil, setPerfil] = useState_A(null);
  const [emailConfirmado, setEmailConfirmado] = useState_A(false);

  useEffect_A(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token') || hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const tipo = params.get('type');
      if (tipo === 'recovery') {
        setRoute({ view: 'reset-senha' });
      } else if (tipo === 'signup') {
        window.history.replaceState({}, '', window.location.pathname);
        setEmailConfirmado(true);
      }
    }

    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) carregarPerfil(session.user.id);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) carregarPerfil(session.user.id);
        else { setPerfil(null); }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function carregarPerfil(userId) {
    const { data } = await supabaseClient.from('perfis').select('*').eq('id', userId).single();
    if (data) setPerfil({ ...data, foto: data.foto_url, inicial: data.nome?.charAt(0) });
  }

  useEffect_A(() => {
    function onUnhandled(e) {
      console.error('Erro não tratado:', e.reason);
    }
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => window.removeEventListener('unhandledrejection', onUnhandled);
  }, []);

  const { data, setData, recarregar } = useAppData(session?.user?.id);

  const [route, setRoute] = useState_A({ view: 'central' });
  const [searchOpen, setSearchOpen] = useState_A(false);
  const [newEmpOpen, setNewEmpOpen] = useState_A(false);
  const [editEmp, setEditEmp] = useState_A(null);
  const [notifOpen, setNotifOpen] = useState_A(false);
  const [empresasOpen, setEmpresasOpen] = useState_A(false);
  const [perfilOpen, setPerfilOpen] = useState_A(false);
  const [mobileNavOpen, setMobileNavOpen] = useState_A(false);
  const isMobile = useIsMobile(768);
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

  const [confirmDeleteEmp, setConfirmDeleteEmp] = useState_A(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState_A(isMobile);

  useEffect_A(() => {
    const onResize = () => setSidebarCollapsed(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  async function savePortador(p) {
    const isNew = String(p.id).startsWith('port-');
    if (isNew) {
      const { data: res, error } = await window.supabaseClient.from('portadores')
        .insert({ user_id: session.user.id, nome: p.nome, tipo: p.tipo, cor: p.cor })
        .select().single();
      if (!error) {
        setData(d => ({ ...d, portadores: [...d.portadores, { id: res.id, nome: res.nome, tipo: res.tipo, cor: res.cor }] }));
        toast.push('Portador adicionado!');
      } else toast.push('Erro ao adicionar portador', 'error');
    } else {
      const result = await window.supabaseClient.from('portadores')
        .update({ nome: p.nome, tipo: p.tipo, cor: p.cor, updated_at: new Date().toISOString() })
        .eq('id', p.id)
        .eq('user_id', session.user.id);
      if (!result.error) {
        setData(d => ({ ...d, portadores: d.portadores.map(x => x.id === p.id ? p : x) }));
        toast.push('Portador atualizado!');
      } else {
        console.error('Supabase Error Portadores Update:', result.error);
        toast.push('Erro ao atualizar portador', 'error');
      }
    }
  }

  async function deletePortador(id) {
    const { error } = await window.supabaseClient.from('portadores').update({ ativo: false }).eq('id', id).eq('user_id', session.user.id);
    if (!error) {
      setData(d => ({ ...d, portadores: d.portadores.filter(x => x.id !== id) }));
      toast.push('Portador excluído');
    } else toast.push('Erro ao excluir portador', 'error');
  }

  async function saveCentro(c) {
    const isNew = String(c.id).startsWith('cc-');
    if (isNew) {
      const { data: res, error } = await window.supabaseClient.from('centros_custo')
        .insert({ user_id: session.user.id, nome: c.nome, tipo: c.tipo })
        .select().single();
      if (!error) {
        setData(d => ({ ...d, centrosCusto: [...d.centrosCusto, { id: res.id, nome: res.nome, tipo: res.tipo }] }));
        toast.push('Centro adicionado!');
      } else toast.push('Erro ao adicionar centro', 'error');
    } else {
      const result = await window.supabaseClient.from('centros_custo')
        .update({ nome: c.nome, tipo: c.tipo, updated_at: new Date().toISOString() })
        .eq('id', c.id)
        .eq('user_id', session.user.id);
      if (!result.error) {
        setData(d => ({ ...d, centrosCusto: d.centrosCusto.map(x => x.id === c.id ? c : x) }));
        toast.push('Centro atualizado!');
      } else {
        console.error('Supabase Error Centros Update:', result.error);
        toast.push('Erro ao atualizar centro', 'error');
      }
    }
  }

  async function deleteCentro(id) {
    const { error } = await window.supabaseClient.from('centros_custo').update({ ativo: false }).eq('id', id).eq('user_id', session.user.id);
    if (!error) {
      setData(d => ({ ...d, centrosCusto: d.centrosCusto.filter(x => x.id !== id) }));
      toast.push('Centro excluído');
    } else toast.push('Erro ao excluir centro', 'error');
  }

  async function saveForma(nome) {
    const ordem = data.formasPagamento.length;
    const { error } = await window.supabaseClient.from('formas_pagamento')
      .insert({ user_id: session.user.id, nome, ordem });
    if (!error) {
      setData(d => ({ ...d, formasPagamento: [...d.formasPagamento, nome] }));
      toast.push('Forma adicionada!');
    } else toast.push('Erro ao adicionar forma', 'error');
  }

  async function deleteForma(nome) {
    const { error } = await window.supabaseClient.from('formas_pagamento').update({ ativo: false }).eq('nome', nome).eq('user_id', session.user.id);
    if (!error) {
      setData(d => ({ ...d, formasPagamento: d.formasPagamento.filter(x => x !== nome) }));
      toast.push('Forma excluída');
    } else toast.push('Erro ao excluir forma', 'error');
  }

  async function createEmpresa(emp) {
    const { data: resData, error } = await window.supabaseClient.from('empresas').insert({
      user_id: session.user.id,
      user_id: session.user.id,
      tipo_pessoa: emp.tipoPessoa || 'pj',
      documento: emp.documento,
      cnpj: emp.documento,
      nome: emp.nome,
      nome_fantasia: emp.tipoPessoa === 'pf' ? null : emp.nomeFantasia, 
      segmento: emp.segmento,
      responsavel: emp.responsavel, email: emp.email, telefone: emp.telefone,
      portadores_ativos: emp.portadoresAtivos || [],
      centros_ativos: emp.centrosAtivos || []
    }).select().single();
    
    if (error) { toast.push('Erro ao criar empresa: ' + error.message, 'error'); return; }
    
    setData(d => ({
      ...d,
      empresas: [...d.empresas, {
        id: resData.id, tipoPessoa: resData.tipo_pessoa, documento: resData.documento, cnpj: resData.cnpj,
        nome: resData.nome, nomeFantasia: resData.nome_fantasia, segmento: resData.segmento,
        responsavel: resData.responsavel, email: resData.email, telefone: resData.telefone,
        portadoresAtivos: resData.portadores_ativos || [],
        centrosAtivos: resData.centros_ativos || [],
        criadaEm: resData.created_at
      }],
      lancamentos: { ...d.lancamentos, [resData.id]: [] }
    }));
    toast.push('Empresa cadastrada com sucesso!');
  }

  async function editEmpresa(emp) {
    const { error } = await window.supabaseClient.from('empresas')
      .update({
        tipo_pessoa: emp.tipoPessoa || 'pj',
        documento: emp.documento,
        cnpj: emp.documento,
        nome: emp.nome,
        nome_fantasia: emp.tipoPessoa === 'pf' ? null : emp.nomeFantasia, 
        segmento: emp.segmento,
        responsavel: emp.responsavel, email: emp.email, telefone: emp.telefone,
        portadores_ativos: emp.portadoresAtivos || [],
        centros_ativos: emp.centrosAtivos || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', emp.id);
    
    if (error) { toast.push('Erro ao atualizar empresa', 'error'); return; }
    setData(d => ({ ...d, empresas: d.empresas.map(e => e.id === emp.id ? emp : e) }));
    toast.push('Empresa atualizada!');
  }

  async function deleteEmpresa(id) {
    const { error } = await window.supabaseClient.from('empresas')
      .update({ ativo: false })
      .eq('id', id);
    
    if (error) { toast.push('Erro ao excluir empresa', 'error'); return; }
    setData(d => {
      const novo = { ...d.lancamentos }; delete novo[id];
      return { ...d, empresas: d.empresas.filter(e => e.id !== id), lancamentos: novo };
    });
    if (route.view === 'empresa' && route.id === id) setRoute({ view: 'central' });
    toast.push('Empresa removida');
  }

  async function upsertLanc(l) {
    const isArray = Array.isArray(l);
    const lancsToProcess = isArray ? l : [l];
    const results = [];
    const createdIds = [];
    const empresaId = lancsToProcess[0].empresaId;

    const cur = data.lancamentos[empresaId] || [];

    for (const lanc of lancsToProcess) {
      const payload = {
        user_id: session.user.id,
        empresa_id: lanc.empresaId,
        tipo: lanc.tipo,
        descricao: lanc.descricao,
        valor: parseFloat(String(lanc.valor).replace(',', '.')) || 0,
        vencimento: lanc.vencimento,
        competencia: lanc.competencia || competenciaFromDate(lanc.vencimento),
        portador_id: lanc.portadorId || null,
        centro_custo_id: lanc.centroCustoId || null,
        forma_pagamento: lanc.formaPagamento || null,
        pago: Boolean(lanc.pago),
        pagamento_data: lanc.pagamento?.data || null,
        pagamento_comprovante: lanc.pagamento?.comprovante || null,
        observacao: lanc.observacao || '',
        parcela_ref: lanc.parcelaRef || null,
        parcela_num: lanc.parcelaNum || null,
        parcela_total: lanc.parcelaTotal || null
      };

      const existe = cur.some(x => x.id === lanc.id);

      let result;
      if (existe) {
        result = await window.supabaseClient.from('lancamentos')
          .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', lanc.id).select().single();
      } else {
        result = await window.supabaseClient.from('lancamentos').insert(payload).select().single();
      }

      if (result.error) {
        console.error('Erro Supabase:', result.error);
        toast.push('Erro ao salvar lançamento: ' + result.error.message, 'error');
        continue;
      }

      results.push({
        id: result.data.id, empresaId: result.data.empresa_id, tipo: result.data.tipo,
        descricao: result.data.descricao, valor: parseFloat(result.data.valor),
        vencimento: result.data.vencimento, competencia: result.data.competencia,
        portadorId: result.data.portador_id, centroCustoId: result.data.centro_custo_id,
        formaPagamento: result.data.forma_pagamento, pago: result.data.pago,
        pagamento: result.data.pago ? { data: result.data.pagamento_data, comprovante: result.data.pagamento_comprovante } : null,
        observacao: result.data.observacao,
        parcelaRef: result.data.parcela_ref, parcelaNum: result.data.parcela_num, parcelaTotal: result.data.parcela_total
      });

      if (!existe) createdIds.push(result.data.id);
    }

    if (results.length > 0) {
      setData(d => {
        const current = d.lancamentos[empresaId] || [];
        const novo = [...current];
        results.forEach(res => {
          const idx = novo.findIndex(x => x.id === res.id);
          if (idx >= 0) novo[idx] = res;
          else novo.push(res);
        });
        return { ...d, lancamentos: { ...d.lancamentos, [empresaId]: novo } };
      });

      if (isArray) toast.push(`${results.length} lançamentos criados!`);
      else toast.push(createdIds.length > 0 ? 'Lançamento criado!' : 'Lançamento atualizado!');
    }

    createdIds.forEach(id => {
      window.supabaseClient.functions.invoke('notificacao-lancamento', {
        body: { lancamento_id: id, user_id: session.user.id }
      }).catch(() => {});
    });
  }

  async function deleteLanc(empId, lancId) {
    const { error } = await window.supabaseClient.from('lancamentos').delete().eq('id', lancId);
    if (error) { toast.push('Erro ao excluir', 'error'); return; }
    setData(d => ({ ...d, lancamentos: { ...d.lancamentos, [empId]: (d.lancamentos[empId] || []).filter(x => x.id !== lancId) } }));
  }

  async function payLanc(empId, lancId, payload) {
    const { data: updated, error } = await window.supabaseClient.from('lancamentos')
      .update({
        pago: true,
        portador_id: payload.portadorId,
        pagamento_data: payload.data,
        pagamento_comprovante: payload.comprovante || `CMP-${Date.now()}.pdf`,
        updated_at: new Date().toISOString()
      })
      .eq('id', lancId)
      .select().single();
    
    if (error) { toast.push('Erro ao registrar pagamento', 'error'); return; }
    
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

  if (loadingAuth) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--c-bg)' }}>
      <LoadingSpinner size={40} />
    </div>
  );

  if (!session) {
    if (route.view === 'reset-senha') return <TelaResetSenha />;
    return <LoginScreen emailConfirmado={emailConfirmado} />;
  }

  if (data.loading) return (
    <div style={{ padding:28 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ height:100, borderRadius:12, marginBottom:12, background:'var(--c-border)', animation:'pulse 1.5s infinite' }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--c-bg)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={v => setTweak('sidebarCollapsed', v)} route={route} setRoute={setRoute}
        isMobile={isMobile} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} perfil={perfil} />

      <main style={{ 
        flex: 1, minWidth: 0, background: 'var(--c-bg)', display: 'flex', flexDirection: 'column',
        marginLeft: isMobile ? 0 : (collapsed ? 64 : 220),
        width: isMobile ? '100%' : 'auto',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }}>
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
          session={session}
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
          {route.view === 'lancamentos' && <LancamentosGlobais data={data} onOpenEmpresa={(id) => setRoute({ view: 'empresa', id })} onUpsertLanc={upsertLanc} onGoCentral={() => setRoute({ view: 'central' })} />}
          {route.view === 'relatorios' && <RelatoriosConsolidados data={data} />}
          {route.view === 'configuracoes' && (
            <Configuracoes
              data={data}
              session={session}
              perfil={perfil}
              onUpdatePerfil={setPerfil}
              initialTab={route.tab}
              empresaInfo={empresaInfo}
              onUpdateEmpresaInfo={(novo) => setEmpresaInfo(p => ({ ...p, ...novo }))}
              portadores={data.portadores || []}
              centrosCusto={data.centrosCusto || []}
              formasPagamento={data.formasPagamento || []}
              onSavePortador={savePortador}
              onDeletePortador={deletePortador}
              onSaveCentro={saveCentro}
              onDeleteCentro={deleteCentro}
              onSaveForma={saveForma}
              onDeleteForma={deleteForma}
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
          todasEmpresas={data.empresas}
          portadores={data.portadores}
          centrosCusto={data.centrosCusto}
          onClose={() => { setNewEmpOpen(false); setEditEmp(null); }}
          onSave={(emp) => {
            if (editEmp) editEmpresa(emp); else createEmpresa(emp);
            setNewEmpOpen(false); setEditEmp(null);
          }}
          onDelete={editEmp ? () => setConfirmDeleteEmp(editEmp) : null}
        />
      )}

      {confirmDeleteEmp && (
        <ModalConfirmacao
          open={true}
          titulo="Excluir Empresa"
          mensagem={`Tem certeza que deseja excluir "${confirmDeleteEmp.nome}"? Todos os lançamentos serão removidos.`}
          onConfirmar={() => {
            deleteEmpresa(confirmDeleteEmp.id);
            setEditEmp(null);
            setConfirmDeleteEmp(null);
          }}
          onCancelar={() => setConfirmDeleteEmp(null)}
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
function Sidebar({ collapsed, setCollapsed, route, setRoute, isMobile, mobileOpen, onCloseMobile, perfil }) {
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
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 1000,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease', overflow: 'hidden',
        boxShadow: mobileOpen ? '0 0 40px rgba(0,0,0,.4)' : 'none'
      }
    : {
        width: w, background: 'var(--c-bg-sidebar)', color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100,
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
            <div style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff', flexShrink: 0 }}>
              {(perfil?.nome || 'Klisia Silva').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil?.nome || 'Klisia Silva'}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>{perfil?.cargo || 'Administradora'}</div>
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
            <div style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--c-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#fff' }}>
              {(perfil?.nome || 'Klisia Silva').charAt(0).toUpperCase()}
            </div>
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
function TopBar({ breadcrumb, isMobile, onMenuClick, onSearchClick, notifCount, onNotifClick, notifOpen, notifs, onNotifSelect, empresasCount, empresasOpen, onEmpresasClick, data, onSelectEmpresa, onNewEmpresa, perfil, session, perfilOpen, onPerfilClick, onOpenSettings }) {
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
        <BuscaGlobal data={data} onSelectEmpresa={onSelectEmpresa} onSelectLanc={() => {}} />
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
        <button onClick={async () => { await window.supabaseClient.auth.signOut(); window.location.reload(); }} style={{ ...itemStyle, color: '#dc2626' }}
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

window.stringToColor = stringToColor;
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
function EmpresaWizard({ empresa, todasEmpresas, portadores, centrosCusto, onClose, onSave, onDelete }) {
  const [step, setStep] = useState_A(1);
  const [f, setF] = useState_A(empresa || {
    id: uid('emp'), tipoPessoa: 'pj', documento: '', nome: '', nomeFantasia: '', segmento: '',
    responsavel: '', email: '', telefone: '',
    portadoresAtivos: [],
    centrosAtivos: [],
    criadaEm: todayISO()
  });
  const [erros, setErros] = useState_A({});
  const toast = useToast();

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  
  function validarStep1() {
    const e = {};
    const errNome = Validacao.required(f.nome, f.tipoPessoa === 'pj' ? 'Razão Social' : 'Nome Completo');
    
    let errDoc = null;
    if (!f.documento) errDoc = f.tipoPessoa === 'pj' ? 'CNPJ obrigatório' : 'CPF obrigatório';
    else errDoc = f.tipoPessoa === 'pj' ? Validacao.cnpj(f.documento) : Validacao.cpf(f.documento);
    
    if (!errDoc && todasEmpresas) {
      const cleanDoc = f.documento.replace(/\D/g, '');
      const existe = todasEmpresas.find(emp => (emp.documento?.replace(/\D/g, '') === cleanDoc || emp.cnpj?.replace(/\D/g, '') === cleanDoc) && emp.id !== f.id);
      if (existe) {
        errDoc = 'Este documento já está cadastrado em outra empresa.';
      }
    }

    const errEmail = f.email ? Validacao.email(f.email) : null;
    const errTelefone = f.telefone ? Validacao.telefone(f.telefone) : null;

    if (errNome) e.nome = errNome;
    if (errDoc) e.documento = errDoc;
    if (errEmail) e.email = errEmail;
    if (errTelefone) e.telefone = errTelefone;

    if (Object.keys(e).length > 0) {
      setErros(e);
      Object.values(e).forEach(msg => toast.push(msg, 'error'));
      return false;
    }
    setErros({});
    return true;
  }

  function proceedToStep2() {
    if (validarStep1()) setStep(2);
  }

  function submit() {
    if (validarStep1()) onSave(f);
    else setStep(1);
  }
  function togglePort(id) {
    set('portadoresAtivos', f.portadoresAtivos.includes(id) ? f.portadoresAtivos.filter(x => x !== id) : [...f.portadoresAtivos, id]);
  }
  function toggleCC(id) {
    set('centrosAtivos', f.centrosAtivos.includes(id) ? f.centrosAtivos.filter(x => x !== id) : [...f.centrosAtivos, id]);
  }

  return (
    <Modal open onClose={onClose} disableBackdropClick title={empresa ? 'Editar Empresa' : 'Cadastrar Nova Empresa'} width={620}
      footer={<>
        {onDelete && <Btn variant="danger" icon="trash" onClick={onDelete} style={{ marginRight: 'auto' }}>Excluir</Btn>}
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        {step === 1
          ? <Btn variant="primary" onClick={proceedToStep2}>Continuar →</Btn>
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
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginBottom: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
              <input type="radio" name="tipoPessoa" checked={f.tipoPessoa !== 'pf'} onChange={() => set('tipoPessoa', 'pj')} /> Pessoa Jurídica (CNPJ)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
              <input type="radio" name="tipoPessoa" checked={f.tipoPessoa === 'pf'} onChange={() => set('tipoPessoa', 'pf')} /> Pessoa Física (CPF)
            </label>
          </div>
          
          <Field label={f.tipoPessoa === 'pj' ? "Razão Social" : "Nome Completo"} required span={2} erro={erros.nome}>
            <Input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder={f.tipoPessoa === 'pj' ? "Ex: Padaria Bom Pão Ltda" : "Ex: João da Silva"} autoFocus style={{ borderColor: erros.nome ? '#dc2626' : undefined }} />
            {erros.nome && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.nome}</span>}
          </Field>
          
          {f.tipoPessoa === 'pj' && (
            <Field label="Nome Fantasia" span={2}>
              <Input value={f.nomeFantasia || ''} onChange={e => set('nomeFantasia', e.target.value)} placeholder="Como a empresa é conhecida" />
            </Field>
          )}
          
          <Field label={f.tipoPessoa === 'pj' ? "CNPJ" : "CPF"} required erro={erros.documento}>
            <Input value={f.documento || f.cnpj || ''} onChange={e => set('documento', f.tipoPessoa === 'pj' ? maskCNPJ(e.target.value) : maskCPF(e.target.value))} placeholder={f.tipoPessoa === 'pj' ? "00.000.000/0000-00" : "000.000.000-00"} maxLength={18} style={{ borderColor: erros.documento ? '#dc2626' : undefined }} />
            {erros.documento && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.documento}</span>}
          </Field>
          <Field label="Setor"><Input value={f.segmento || ''} onChange={e => set('segmento', e.target.value)} placeholder="Ex: Alimentação" /></Field>
          <Field label="Responsável"><Input value={f.responsavel || ''} onChange={e => set('responsavel', e.target.value)} /></Field>
          <Field label="Telefone"><Input value={f.telefone || ''} onChange={e => set('telefone', maskTelefone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} /></Field>
          <Field label="E-mail" span={2} erro={erros.email}>
            <Input value={f.email || ''} type="email" onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com.br" style={{ borderColor: erros.email ? '#dc2626' : undefined }} />
            {erros.email && <span style={{ fontSize:11, color:'#dc2626', marginTop:2 }}>{erros.email}</span>}
          </Field>
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

// ----- BuscaGlobal -----
function BuscaGlobal({ data, onSelectEmpresa, onSelectLanc }) {
  const [q, setQ] = useState_A('');
  const [aberta, setAberta] = useState_A(false);
  const inputRef = useRef_A(null);

  useEffect_A(() => {
    function onClickFora(e) { if (aberta && !e.target.closest('[data-busca]')) setAberta(false); }
    document.addEventListener('mousedown', onClickFora);
    return () => document.removeEventListener('mousedown', onClickFora);
  }, [aberta]);

  const resultados = useMemo_A(() => {
    if (q.length < 2) return { empresas: [], lancamentos: [] };
    const ql = q.toLowerCase();
    
    const empresas = data.empresas.filter(e =>
      e.nome.toLowerCase().includes(ql) ||
      (e.cnpj || '').includes(q) ||
      (e.segmento || '').toLowerCase().includes(ql)
    ).slice(0, 5);

    const lancamentos = [];
    Object.entries(data.lancamentos).forEach(([empId, lancs]) => {
      const emp = data.empresas.find(e => e.id === empId);
      lancs.filter(l => l.descricao.toLowerCase().includes(ql))
        .slice(0, 3)
        .forEach(l => lancamentos.push({ ...l, empresaNome: emp?.nome }));
    });

    return { empresas, lancamentos: lancamentos.slice(0, 5) };
  }, [q, data]);

  return (
    <div data-busca style={{ position: 'relative', width: 300 }}>
      <div style={{
        background: 'var(--c-bg)', border: `1px solid ${aberta ? 'var(--c-primary)' : 'var(--c-border)'}`, borderRadius: 9,
        padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 9,
        cursor: 'text', fontSize: 13, color: 'var(--c-text)',
        boxShadow: aberta ? '0 0 0 3px var(--c-primary-soft)' : 'none',
        transition: 'all 0.15s'
      }}>
        <Icon name="search" size={14} color={aberta ? 'var(--c-primary)' : 'var(--c-text-muted)'} />
        <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setAberta(true); }} onFocus={() => setAberta(true)}
          placeholder="Pesquisar..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'inherit', fontFamily: 'inherit', fontSize: 'inherit' }} />
        {q ? (
          <button onClick={() => { setQ(''); inputRef.current?.focus(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--c-text-muted)' }}><Icon name="x" size={12} /></button>
        ) : (
          <kbd style={kbdStyle}>⌘K</kbd>
        )}
      </div>

      {aberta && (q.length >= 2) && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 380, background: 'var(--c-surface)',
          border: '1px solid var(--c-border)', borderRadius: 12, boxShadow: '0 12px 40px rgba(15,23,42,.13)',
          zIndex: 200, overflow: 'hidden', animation: 'dropIn 0.14s cubic-bezier(.16,1,.3,1)'
        }}>
          {resultados.empresas.length === 0 && resultados.lancamentos.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>Nenhum resultado encontrado.</div>
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
              {resultados.empresas.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>Empresas</div>
                  {resultados.empresas.map(e => (
                    <button key={e.id} onClick={() => { onSelectEmpresa(e.id); setAberta(false); setQ(''); }} style={{ width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--c-bg)'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                      <Icon name="building" size={14} color="var(--c-text-muted)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text)' }}>{e.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{e.cnpj}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {resultados.lancamentos.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', borderTop: resultados.empresas.length > 0 ? '1px solid var(--c-border)' : 'none', marginTop: resultados.empresas.length > 0 ? 6 : 0 }}>Lançamentos</div>
                  {resultados.lancamentos.map(l => (
                    <button key={l.id} onClick={() => { onSelectEmpresa(l.empresaId); setAberta(false); setQ(''); }} style={{ width: '100%', padding: '8px 14px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'inherit' }} onMouseEnter={ev => ev.currentTarget.style.background = 'var(--c-bg)'} onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: l.tipo === 'entrada' ? '#16a34a' : '#dc2626' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text)' }}>{l.descricao}</div>
                        <div style={{ fontSize: 11, color: 'var(--c-text-muted)' }}>{l.empresaNome}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: l.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>{formatBRL(l.valor)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TelaResetSenha() {
  const [novaSenha, setNovaSenha] = useState_A('');
  const [confirmar, setConfirmar] = useState_A('');
  const [loading, setLoading] = useState_A(false);
  const [erro, setErro] = useState_A('');
  const [sucesso, setSucesso] = useState_A(false);
  const toast = useToast();

  async function salvar(e) {
    e.preventDefault();
    const errSenha = Validacao.senha(novaSenha);
    if (errSenha) { setErro(errSenha); toast.push(errSenha, 'error'); return; }
    if (novaSenha !== confirmar) {
      const msg = 'As senhas não coincidem';
      setErro(msg);
      toast.push(msg, 'error');
      return;
    }
    setLoading(true); setErro('');
    const { error } = await window.supabaseClient.auth.updateUser({ password: novaSenha });
    if (error) {
      const msg = 'Erro ao redefinir senha: ' + error.message;
      setErro(msg);
      toast.push(msg, 'error');
    }
    else {
      setSucesso(true);
      toast.push('Senha redefinida com sucesso!');
      setTimeout(() => window.history.replaceState({}, '', window.location.pathname), 2000);
    }
    setLoading(false);
  }

  const layoutCentrado = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--c-bg)', padding:20 };
  const cardLogin = { width:'100%', maxWidth:420, background:'var(--c-surface)', borderRadius:16, padding:36, border:'1px solid var(--c-border)', boxShadow:'0 20px 60px rgba(0,0,0,.1)' };
  const logoStyle = { width:52, height:52, borderRadius:12, background:'var(--c-primary)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontWeight:800, fontSize:22, color:'#fff' };

  if (sucesso) return (
    <div style={layoutCentrado}>
      <div style={cardLogin}>
        <div style={{ textAlign:'center', color:'#16a34a', fontSize:48, marginBottom:16 }}>✓</div>
        <h2 style={{ textAlign:'center', margin:'0 0 8px' }}>Senha redefinida!</h2>
        <p style={{ textAlign:'center', color:'var(--c-text-muted)', fontSize:13 }}>
          Redirecionando para o login...
        </p>
      </div>
    </div>
  );

  return (
    <div style={layoutCentrado}>
      <div style={cardLogin}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={logoStyle}>K</div>
          <h2 style={{ margin:'8px 0 4px' }}>Nova senha</h2>
          <p style={{ color:'var(--c-text-muted)', fontSize:13, margin:0 }}>
            Digite sua nova senha de acesso
          </p>
        </div>
        {erro && <div style={{ background:'rgba(220,38,38,.1)', border:'1px solid rgba(220,38,38,.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>{erro}</div>}
        <form onSubmit={salvar} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="Nova senha" required>
            <Input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" autoFocus />
          </Field>
          <Field label="Confirmar nova senha" required>
            <Input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} placeholder="Repita a senha" />
          </Field>
          <Btn type="submit" variant="primary" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'11px 0' }}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Btn>
        </form>
      </div>
    </div>
  );
}

// ----- LoginScreen -----
function LoginScreen({ emailConfirmado }) {
  const [modo, setModo] = useState_A('login');
  const [email, setEmail] = useState_A('');
  const [senha, setSenha] = useState_A('');
  const [lembrar, setLembrar] = useState_A(true);
  const [loading, setLoading] = useState_A(false);
  const [erro, setErro] = useState_A('');
  const [erroEspecial, setErroEspecial] = useState_A('');
  const [sucesso, setSucesso] = useState_A('');
  const toast = useToast();

  useEffect_A(() => {
    if (emailConfirmado) setSucesso('E-mail confirmado com sucesso! Você já pode entrar.');
  }, [emailConfirmado]);

  async function handleLogin(e) {
    e.preventDefault();
    setErro(''); setErroEspecial(''); setLoading(true);
    const errEmail = Validacao.email(email);
    if (errEmail) { setErro(errEmail); toast.push(errEmail, 'error'); setLoading(false); return; }

    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: senha });
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setErroEspecial('email_nao_confirmado');
      } else {
        const tr = traduzirErroAuth(error.message);
        setErro(tr);
        toast.push(tr, 'error');
      }
    } else {
      if (!lembrar) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
          sessionStorage.setItem('sb-session', JSON.stringify(session));
          localStorage.removeItem(`sb-${window.SUPABASE_URL?.split('//')[1].split('.')[0] || 'svgvtmkqjvxsoduohfuy'}-auth-token`);
        }
      }
    }
    setLoading(false);
  }

  async function reenviarConfirmacao() {
    const { error } = await window.supabaseClient.auth.resend({ type: 'signup', email });
    if (!error) toast.push('E-mail reenviado! Verifique sua caixa de entrada.');
    else toast.push('Erro ao reenviar e-mail.', 'error');
  }

  async function handleReset(e) {
    e.preventDefault();
    setErro(''); setLoading(true);
    const errEmail = Validacao.email(email);
    if (errEmail) { setErro(errEmail); toast.push(errEmail, 'error'); setLoading(false); return; }

    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) {
      const tr = traduzirErroAuth(error.message);
      setErro(tr);
      toast.push(tr, 'error');
    }
    else {
      toast.push('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setSucesso('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    }
    setLoading(false);
  }

  function traduzirErroAuth(msg) {
    if (msg.includes('Invalid login')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
    if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('Password should be')) return 'Senha deve ter pelo menos 6 caracteres.';
    return 'Erro: ' + msg;
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--c-bg)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420, background:'var(--c-surface)', borderRadius:16, padding:36, border:'1px solid var(--c-border)', boxShadow:'0 20px 60px rgba(0,0,0,.1)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, borderRadius:12, background:'var(--c-primary)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontWeight:800, fontSize:22, color:'#fff' }}>K</div>
          <div style={{ fontSize:20, fontWeight:700 }}>KS Gestão</div>
          <div style={{ fontSize:12, color:'var(--c-text-muted)', marginTop:2 }}>BPO Financeiro</div>
        </div>

        <div style={{ marginBottom:20 }}>
          <h2 style={{ fontSize:18, fontWeight:600, margin:'0 0 4px' }}>
            {modo==='login' ? 'Entrar na conta' : 'Recuperar senha'}
          </h2>
          <p style={{ fontSize:13, color:'var(--c-text-muted)', margin:0 }}>
            {modo==='login' ? 'Acesse o painel de gestão' : 'Enviaremos um link para seu e-mail'}
          </p>
        </div>

        {erro && <div style={{ background:'rgba(220,38,38,.1)', border:'1px solid rgba(220,38,38,.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>{erro}</div>}
        {sucesso && <div style={{ background:'rgba(22,163,74,.1)', border:'1px solid rgba(22,163,74,.3)', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#16a34a' }}>{sucesso}</div>}
        
        {erroEspecial === 'email_nao_confirmado' && (
          <div style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.4)', borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#92400e', marginBottom:6 }}>
              📧 Confirme seu e-mail primeiro
            </div>
            <div style={{ fontSize:12, color:'#78350f', lineHeight:1.5 }}>
              Enviamos um link de confirmação para <strong>{email}</strong>.
              Verifique sua caixa de entrada (e o spam).
            </div>
            <button type="button" onClick={reenviarConfirmacao} style={{ marginTop:8, fontSize:12, color:'var(--c-primary)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', padding:0, textDecoration:'underline' }}>
              Reenviar e-mail de confirmação
            </button>
          </div>
        )}

        <form onSubmit={modo==='login' ? handleLogin : handleReset} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Field label="E-mail" required>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" autoFocus />
          </Field>
          {modo === 'login' && (
            <Field label="Senha" required>
              <Input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" />
            </Field>
          )}
          {modo === 'login' && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, margin:'4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="lembrar" checked={lembrar}
                  onChange={e => setLembrar(e.target.checked)}
                  style={{ width:15, height:15, accentColor:'var(--c-primary)', cursor:'pointer' }} />
                <label htmlFor="lembrar" style={{ fontSize:13, color:'var(--c-text-muted)', cursor:'pointer' }}>
                  Lembrar-me
                </label>
              </div>
              <button type="button" onClick={() => { setModo('recuperar'); setErro(''); setSucesso(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-primary)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500 }}>Esqueceu a senha?</button>
            </div>
          )}
          <Btn type="submit" variant="primary" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'11px 0', fontSize:14 }}>
            {loading ? <LoadingSpinner size={16} color="#fff" /> : modo==='login' ? 'Entrar' : 'Enviar link'}
          </Btn>
        </form>

        {modo === 'recuperar' && (
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <button onClick={()=>{setModo('login');setErro('');setSucesso('');}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--c-primary)', fontSize:13, fontFamily:'inherit' }}>← Voltar para o login</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Render
ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastProvider>
    <App />
  </ToastProvider>
);
