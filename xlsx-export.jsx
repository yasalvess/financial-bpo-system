// XLSX export usando SheetJS (XLSX global)

function sheetFromAOA(aoa, opts = {}) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (opts.cols) ws['!cols'] = opts.cols;
  if (opts.merges) ws['!merges'] = opts.merges;
  return ws;
}

function formatXlsxDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// Exporta relatório de uma empresa
function exportEmpresaXLSX(empresa, lancs, portadores, centros, filename) {
  const wb = XLSX.utils.book_new();
  const hoje = todayISO();

  // 1) Sheet Geral
  const headerGeral = [
    ['RELATÓRIO FINANCEIRO - ' + empresa.nome],
    ['CNPJ: ' + empresa.cnpj, '', '', 'Gerado em: ' + formatXlsxDate(hoje)],
    [],
    ['Data Venc.', 'Competência', 'Tipo', 'Descrição', 'Centro de Custo', 'Portador', 'Forma Pgto', 'Valor', 'Status', 'Data Pgto', 'Comprovante']
  ];
  const portMap = Object.fromEntries(portadores.map(p => [p.id, p.nome]));
  const ccMap = Object.fromEntries(centros.map(c => [c.id, c.nome]));
  const ordered = [...lancs].sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  ordered.forEach(l => {
    const s = lancStatus(l, hoje);
    headerGeral.push([
      formatXlsxDate(l.vencimento),
      l.competencia,
      l.tipo === 'entrada' ? 'Entrada' : 'Saída',
      l.descricao,
      ccMap[l.centroCustoId] || '',
      portMap[l.portadorId] || '',
      l.formaPagamento,
      l.valor,
      statusColor(s).label,
      l.pagamento ? formatXlsxDate(l.pagamento.data) : '',
      l.pagamento ? l.pagamento.comprovante : ''
    ]);
  });
  // Totals
  const totalEnt = lancs.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
  const totalSai = lancs.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);
  headerGeral.push([], ['', '', '', '', '', '', 'TOTAL ENTRADAS', totalEnt], ['', '', '', '', '', '', 'TOTAL SAÍDAS', totalSai], ['', '', '', '', '', '', 'RESULTADO', totalEnt - totalSai]);
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(headerGeral, {
    cols: [{ wch: 12 }, { wch: 12 }, { wch: 9 }, { wch: 34 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 11 }, { wch: 12 }, { wch: 18 }]
  }), 'Geral');

  // 2) Por Portador
  const aoaP = [['PORTADOR', 'Entradas', 'Saídas', 'Saldo Realizado', 'Qtd. Movs.']];
  const saldos = portadorSaldos(lancs, portadores);
  saldos.forEach(p => aoaP.push([p.nome, p.entradas, p.saidas, p.saldo, p.movs]));
  aoaP.push([], ['TOTAL', saldos.reduce((s, p) => s + p.entradas, 0), saldos.reduce((s, p) => s + p.saidas, 0), saldos.reduce((s, p) => s + p.saldo, 0), saldos.reduce((s, p) => s + p.movs, 0)]);
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(aoaP, { cols: [{ wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 }] }), 'Por Portador');

  // 3) Por Centro de Custo
  const aoaCC = [['CENTRO DE CUSTO', 'Tipo', 'Total', 'Pago/Recebido', 'Pendente', 'Qtd.']];
  const ccStats = centroCustoStats(lancs, centros);
  ccStats.forEach(c => aoaCC.push([c.nome, c.tipo === 'entrada' ? 'Entrada' : 'Saída', c.total, c.pago, c.pendente, c.qtd]));
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(aoaCC, { cols: [{ wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 8 }] }), 'Por Centro de Custo');

  // 4) DRE Simplificado (por mês/competência)
  const meses = [...new Set(lancs.map(l => l.competencia))].sort((a, b) => {
    const [ma, ya] = a.split('/'); const [mb, yb] = b.split('/');
    return (ya + ma).localeCompare(yb + mb);
  });
  const aoaDRE = [['DRE SIMPLIFICADO POR COMPETÊNCIA'], [], ['Competência', ...meses, 'TOTAL']];
  function rowFor(label, filter) {
    const cells = meses.map(m => lancs.filter(l => l.competencia === m && filter(l)).reduce((s, l) => s + l.valor, 0));
    return [label, ...cells, cells.reduce((s, v) => s + v, 0)];
  }
  aoaDRE.push(rowFor('(+) Receitas', l => l.tipo === 'entrada'));
  aoaDRE.push(rowFor('(-) Despesas', l => l.tipo === 'saida'));
  centros.filter(c => c.tipo === 'saida').forEach(cc => {
    aoaDRE.push(rowFor('   ' + cc.nome, l => l.centroCustoId === cc.id));
  });
  const resultRow = ['= RESULTADO', ...meses.map(m => {
    const e = lancs.filter(l => l.competencia === m && l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0);
    const sa = lancs.filter(l => l.competencia === m && l.tipo === 'saida').reduce((s, l) => s + l.valor, 0);
    return e - sa;
  })];
  resultRow.push(resultRow.slice(1).reduce((s, v) => s + v, 0));
  aoaDRE.push(resultRow);
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(aoaDRE, { cols: [{ wch: 32 }, ...meses.map(() => ({ wch: 12 })), { wch: 14 }] }), 'DRE Simplificado');

  XLSX.writeFile(wb, filename || `Relatorio - ${empresa.nome}.xlsx`);
}

// Exporta consolidado multi-empresa
function exportConsolidadoXLSX(empresas, allLancs, portadores, centros, filename = 'Consolidado BPO.xlsx') {
  const wb = XLSX.utils.book_new();
  const hoje = todayISO();
  const portMap = Object.fromEntries(portadores.map(p => [p.id, p.nome]));
  const ccMap = Object.fromEntries(centros.map(c => [c.id, c.nome]));
  const empMap = Object.fromEntries(empresas.map(e => [e.id, e.nome]));

  // 1) Resumo por empresa
  const aoaRes = [['CONSOLIDADO BPO - Gerado em ' + formatXlsxDate(hoje)], [], ['Empresa', 'CNPJ', 'Recebido', 'A Receber', 'Pago', 'A Pagar', 'Vencidos', 'Saldo']];
  empresas.forEach(e => {
    const ls = allLancs[e.id] || [];
    const st = empresaStats(e, ls, hoje);
    aoaRes.push([e.nome, e.cnpj, st.recebido, st.aReceber, st.pago, st.aPagar, st.vencidos, st.saldo]);
  });
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(aoaRes, { cols: [{ wch: 32 }, { wch: 20 }, ...Array(6).fill({ wch: 14 })] }), 'Resumo Empresas');

  // 2) Todos lançamentos
  const aoa = [['Empresa', 'Data', 'Comp.', 'Tipo', 'Descrição', 'Centro Custo', 'Portador', 'Forma Pgto', 'Valor', 'Status']];
  empresas.forEach(e => {
    const ls = allLancs[e.id] || [];
    ls.forEach(l => {
      const s = lancStatus(l, hoje);
      aoa.push([
        empMap[e.id], formatXlsxDate(l.vencimento), l.competencia,
        l.tipo === 'entrada' ? 'Entrada' : 'Saída',
        l.descricao, ccMap[l.centroCustoId] || '', portMap[l.portadorId] || '',
        l.formaPagamento, l.valor, statusColor(s).label
      ]);
    });
  });
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(aoa, { cols: [{ wch: 28 }, { wch: 12 }, { wch: 10 }, { wch: 9 }, { wch: 30 }, { wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 11 }] }), 'Todos Lançamentos');

  // 3) Por Portador (consolidado)
  const aoaP = [['Portador', ...empresas.map(e => e.nome), 'TOTAL']];
  portadores.forEach(p => {
    const row = [p.nome];
    let total = 0;
    empresas.forEach(e => {
      const v = (allLancs[e.id] || []).filter(l => l.portadorId === p.id && l.pago).reduce((s, l) => s + (l.tipo === 'entrada' ? l.valor : -l.valor), 0);
      row.push(v); total += v;
    });
    row.push(total);
    aoaP.push(row);
  });
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(aoaP, { cols: [{ wch: 22 }, ...empresas.map(() => ({ wch: 18 })), { wch: 14 }] }), 'Por Portador');

  // 4) Por Centro de Custo
  const aoaCC = [['Centro de Custo', 'Tipo', ...empresas.map(e => e.nome), 'TOTAL']];
  centros.forEach(c => {
    const row = [c.nome, c.tipo === 'entrada' ? 'Entrada' : 'Saída'];
    let total = 0;
    empresas.forEach(e => {
      const v = (allLancs[e.id] || []).filter(l => l.centroCustoId === c.id).reduce((s, l) => s + l.valor, 0);
      row.push(v); total += v;
    });
    row.push(total);
    aoaCC.push(row);
  });
  XLSX.utils.book_append_sheet(wb, sheetFromAOA(aoaCC, { cols: [{ wch: 28 }, { wch: 10 }, ...empresas.map(() => ({ wch: 18 })), { wch: 14 }] }), 'Por Centro de Custo');

  XLSX.writeFile(wb, filename);
}

Object.assign(window, { exportEmpresaXLSX, exportConsolidadoXLSX });
