const { useState: useState_H, useEffect: useEffect_H, useCallback: useCallback_H } = React;

function useAppData(userId) {
  const [data, setData] = useState_H({
    empresas: [], lancamentos: {},
    portadores: [], centrosCusto: [],
    formasPagamento: [], loading: true, error: null
  });

  const carregar = useCallback_H(async () => {
    if (!userId) return;
    setData(d => ({ ...d, loading: true, error: null }));
    try {
      const [emps, ports, centros, formas] = await Promise.all([
        supabaseClient.from('empresas').select('*').order('nome'),
        supabaseClient.from('portadores').select('*').eq('ativo', true).order('nome'),
        supabaseClient.from('centros_custo').select('*').eq('ativo', true).order('nome'),
        supabaseClient.from('formas_pagamento').select('*').eq('ativo', true).order('ordem'),
      ]);

      let pagamentosList = [];
      try {
        const { data: pgsData } = await supabaseClient.from('pagamentos_parciais').select('*');
        pagamentosList = pgsData || [];
      } catch (pgError) {
        console.warn('Tabela pagamentos_parciais não encontrada ou sem acesso. Rodar SQL de migration.', pgError);
      }

      const empresas = emps.data || [];

      // Carrega lançamentos de todas as empresas
      const lancMap = {};
      if (empresas.length > 0) {
        const empIds = empresas.map(e => e.id);
        const { data: lancs } = await supabaseClient
          .from('lancamentos')
          .select('*')
          .in('empresa_id', empIds)
          .order('vencimento');
        
        empresas.forEach(e => lancMap[e.id] = []);
        (lancs || []).forEach(l => {
          if (lancMap[l.empresa_id]) lancMap[l.empresa_id].push(normalizelanc(l, pagamentosList));
        });
      }

      setData({
        empresas: empresas.map(normalizeEmpresa),
        lancamentos: lancMap,
        portadores: (ports.data || []).map(normalizePortador),
        centrosCusto: (centros.data || []).map(normalizeCentro),
        formasPagamento: (formas.data || []).map(f => f.nome),
        loading: false, error: null
      });
    } catch (err) {
      setData(d => ({ ...d, loading: false, error: err.message }));
    }
  }, [userId]);

  useEffect_H(() => { carregar(); }, [carregar]);
  return { data, setData, recarregar: carregar };
}

// Normaliza snake_case do banco para camelCase do frontend
function normalizeEmpresa(e) {
  return {
    id: e.id, nome: e.nome, cnpj: e.cnpj,
    nomeFantasia: e.nome_fantasia, segmento: e.segmento,
    responsavel: e.responsavel, email: e.email, telefone: e.telefone,
    portadoresAtivos: e.portadores_ativos || [],
    centrosAtivos: e.centros_ativos || [],
    criadaEm: e.created_at
  };
}

function normalizelanc(l, pagamentosList = []) {
  const pgs = pagamentosList
    .filter(p => p.lancamento_id === l.id)
    .map(p => ({
      id: p.id,
      valor: parseFloat(p.valor),
      data: p.data,
      portadorId: p.portador_id,
      comprovante: p.comprovante
    }));
  
  const totalPago = pgs.reduce((sum, p) => sum + p.valor, 0);
  const saldoRestante = parseFloat((parseFloat(l.valor) - totalPago).toFixed(2));
  
  let statusPg = 'pendente';
  if (l.pago || saldoRestante <= 0) {
    statusPg = 'pago';
  } else if (totalPago > 0) {
    statusPg = 'parcial';
  }

  return {
    id: l.id, empresaId: l.empresa_id, tipo: l.tipo,
    descricao: l.descricao, valor: parseFloat(l.valor),
    vencimento: l.vencimento, competencia: l.competencia,
    portadorId: l.portador_id, centroCustoId: l.centro_custo_id,
    formaPagamento: l.forma_pagamento, 
    pago: l.pago || statusPg === 'pago',
    pagamento: (l.pago || statusPg === 'pago') ? { data: l.pagamento_data || (pgs.length > 0 ? pgs[pgs.length - 1].data : l.vencimento), comprovante: l.pagamento_comprovante || (pgs.length > 0 ? pgs[pgs.length - 1].comprovante : '') } : null,
    observacao: l.observacao,
    pagamentosParciais: pgs,
    totalPago: totalPago,
    saldoRestante: saldoRestante,
    statusPg: statusPg
  };
}

function normalizePortador(p) {
  return { id: p.id, nome: p.nome, tipo: p.tipo, cor: p.cor };
}

function normalizeCentro(c) {
  return { id: c.id, nome: c.nome, tipo: c.tipo };
}

Object.assign(window, { useAppData });

function useIsMobile() {
  const [isMobile, setIsMobile] = useState_H(window.innerWidth < 768)
  useEffect_H(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}
Object.assign(window, { useIsMobile })
