// ═══════════════════════════════════════════════════════
// Startweb — Histórico & Relatórios · historico.js
// ═══════════════════════════════════════════════════════

let todasConferencias = [];
let chartRanking = null;
let chartStatus = null;
let rankingCompleto = []; // todos os materiais ordenados por qtde conferida

// ─── INICIALIZAÇÃO ───
document.addEventListener('DOMContentLoaded', async () => {
  definirDataPadrao();
  await carregarConferencias();
});

function definirDataPadrao() {
  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);
  document.getElementById('filtroDataFim').value = hoje.toISOString().split('T')[0];
  document.getElementById('filtroDataInicio').value = trintaDiasAtras.toISOString().split('T')[0];
}

// ─── CARREGAR CONFERÊNCIAS ───
async function carregarConferencias() {
  mostrarLoading(true);
  try {
    const filtros = coletarFiltros();
    todasConferencias = await DB.listarConferencias(filtros);
    renderizarTudo();
  } catch (e) {
    console.error(e);
    alert('Erro ao carregar dados: ' + e.message);
  } finally {
    mostrarLoading(false);
  }
}

function coletarFiltros() {
  return {
    dataInicio: document.getElementById('filtroDataInicio').value,
    dataFim: document.getElementById('filtroDataFim').value,
    ordemCompra: document.getElementById('filtroOrdem').value,
    loja: document.getElementById('filtroLoja').value,
    status: document.getElementById('filtroStatus').value
  };
}

function aplicarFiltros() {
  carregarConferencias();
}

function limparFiltros() {
  document.getElementById('filtroOrdem').value = '';
  document.getElementById('filtroLoja').value = '';
  document.getElementById('filtroStatus').value = '';
  definirDataPadrao();
  carregarConferencias();
}

// ─── RENDERIZAR TUDO ───
function renderizarTudo() {
  atualizarStats();
  renderizarConferencias();
  renderizarProdutos();
  renderizarGraficos();
  preencherFiltroLojas();
  atualizarContador();
}

// ─── STATS ───
function atualizarStats() {
  const total = todasConferencias.length;
  const completas = todasConferencias.filter(c => c.statusGeral === 'Completo').length;
  const divergentes = todasConferencias.filter(c => c.statusGeral === 'Com Divergência').length;
  const parciais = todasConferencias.filter(c => c.statusGeral === 'Parcial').length;
  const totalItens = todasConferencias.reduce((s, c) => s + (c.totalItens || 0), 0);

  let taxaConformidade = 0;
  if (todasConferencias.length > 0) {
    const totalEsperado = todasConferencias.reduce((s, c) => s + (c.totalEsperado || 0), 0);
    const totalConferido = todasConferencias.reduce((s, c) => s + (c.totalConferido || 0), 0);
    taxaConformidade = totalEsperado > 0 ? Math.round((totalConferido / totalEsperado) * 100) : 0;
  }

  document.getElementById('hStatSessoes').textContent = total;
  document.getElementById('hStatCompletas').textContent = completas;
  document.getElementById('hStatDivergentes').textContent = divergentes;
  document.getElementById('hStatParciais').textContent = parciais;
  document.getElementById('hStatTotalItens').textContent = totalItens;
  document.getElementById('hStatTaxa').textContent = taxaConformidade + '%';
}

function atualizarContador() {
  const el = document.getElementById('contadorResultados');
  el.textContent = `${todasConferencias.length} resultado(s) encontrado(s)`;
  el.style.display = todasConferencias.length > 0 ? 'inline-block' : 'none';
}

// ─── PREENCHER LOJAS NO FILTRO ───
function preencherFiltroLojas() {
  const lojas = new Set();
  todasConferencias.forEach(c => (c.lojas || []).forEach(l => lojas.add(l)));
  const sel = document.getElementById('filtroLoja');
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todas as Lojas</option>';
  [...lojas].sort().forEach(l => {
    const opt = document.createElement('option');
    opt.value = l; opt.textContent = l;
    sel.appendChild(opt);
  });
  sel.value = atual;
}

// ─── ABA: CONFERÊNCIAS ───
function renderizarConferencias() {
  const container = document.getElementById('listaConferencias');
  const semDados = document.getElementById('semDados');
  container.innerHTML = '';

  if (todasConferencias.length === 0) {
    semDados.style.display = 'block';
    return;
  }
  semDados.style.display = 'none';

  todasConferencias.forEach((conf, idx) => {
    const data = conf.dataConferencia ? formatarData(conf.dataConferencia) : 'Data indisponível';
    const badgeClass = conf.statusGeral === 'Completo' ? 'badge-completo'
                     : conf.statusGeral === 'Parcial'  ? 'badge-parcial'
                     : 'badge-divergencia';
    const ordens = (conf.todasOrdens && conf.todasOrdens.length > 0)
      ? conf.todasOrdens.join(', ')
      : conf.ordemCompra || 'Sem Ordem';

    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
      <div class="session-header">
        <div>
          <div class="session-ordem"><i class="fa-solid fa-file-invoice me-2"></i>${ordens}</div>
        </div>
        <div class="session-meta">
          <span class="session-meta-item"><i class="fa-solid fa-calendar"></i>${data}</span>
          <span class="session-meta-item"><i class="fa-solid fa-store"></i>${(conf.lojas || []).join(', ') || '—'}</span>
          <span class="session-meta-item"><i class="fa-solid fa-boxes-stacked"></i>${conf.totalItens || 0} itens</span>
          <span class="session-meta-item"><i class="fa-solid fa-list-ol"></i>Esp: <strong>${conf.totalEsperado || 0}</strong></span>
          <span class="session-meta-item"><i class="fa-solid fa-clipboard-check"></i>Conf: <strong>${conf.totalConferido || 0}</strong></span>
        </div>
        <div class="session-actions">
          <span class="session-badge ${badgeClass}">${conf.statusGeral || '—'}</span>
          <button class="btn btn-sm" style="background:rgba(59,130,246,0.2);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);"
            onclick="verDetalhes('${conf.id}')">
            <i class="fa-solid fa-eye me-1"></i>Detalhes
          </button>
          <button class="btn btn-sm btn-danger" onclick="excluirConferencia('${conf.id}', this)">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ─── VER DETALHES ───
function verDetalhes(id) {
  const conf = todasConferencias.find(c => c.id === id);
  if (!conf || !conf.itens) return;

  const tbody = document.getElementById('tbodyDetalhe');
  tbody.innerHTML = '';
  conf.itens.forEach(item => {
    const statusClass = item.status === 'OK' ? 'table-success'
                      : (item.status === 'Superior' || item.status === 'Faltando') ? 'table-warning' : '';
    const tr = document.createElement('tr');
    tr.className = statusClass;
    tr.innerHTML = `
      <td>${item.codigo || '—'}</td>
      <td>${item.produto || '—'}</td>
      <td>${item.editora || '—'}</td>
      <td>${item.qtdeEsperada ?? '—'}</td>
      <td>${item.qtdeConferida ?? '—'}</td>
      <td><span class="session-badge ${item.status === 'OK' ? 'badge-completo' : item.status === '-' ? '' : 'badge-divergencia'}">${item.status}</span></td>
      <td>${item.loja || '—'}</td>
      <td>${item.ordemCompra || '—'}</td>
    `;
    tbody.appendChild(tr);
  });

  new bootstrap.Modal(document.getElementById('modalDetalhe')).show();
}

// ─── EXCLUIR ───
async function excluirConferencia(id, btn) {
  if (!confirm('Deseja excluir esta conferência do banco de dados? Esta ação não pode ser desfeita.')) return;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
  const resultado = await DB.excluirConferencia(id);
  if (resultado.sucesso) {
    todasConferencias = todasConferencias.filter(c => c.id !== id);
    renderizarTudo();
  } else {
    alert('Erro ao excluir: ' + resultado.erro);
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  }
}

// ─── ABA: PRODUTOS ───
function renderizarProdutos() {
  const mapa = {};
  todasConferencias.forEach(conf => {
    (conf.itens || []).forEach(item => {
      const chave = item.codigo || item.produto || '—';
      if (!mapa[chave]) {
        mapa[chave] = {
          codigo: item.codigo || '—',
          produto: item.produto || '—',
          editora: item.editora || '—',
          aparicoes: 0,
          totalEsperado: 0,
          totalConferido: 0
        };
      }
      mapa[chave].aparicoes++;
      mapa[chave].totalEsperado += item.qtdeEsperada || 0;
      mapa[chave].totalConferido += item.qtdeConferida || 0;
    });
  });

  const lista = Object.values(mapa).sort((a, b) => b.aparicoes - a.aparicoes);
  const tbody = document.getElementById('tbodyProdutos');
  tbody.innerHTML = '';

  lista.forEach(p => {
    const conformidade = p.totalEsperado > 0
      ? Math.round((p.totalConferido / p.totalEsperado) * 100) : 0;
    const cor = conformidade >= 95 ? '#10b981' : conformidade >= 70 ? '#f59e0b' : '#ef4444';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.codigo}</td>
      <td>${p.produto}</td>
      <td>${p.editora}</td>
      <td><strong style="color:#60a5fa">${p.aparicoes}×</strong></td>
      <td>${p.totalEsperado}</td>
      <td>${p.totalConferido}</td>
      <td>
        <div class="conformidade-bar">
          <div class="conformidade-track">
            <div class="conformidade-fill" style="width:${Math.min(conformidade,100)}%;background:${cor};"></div>
          </div>
          <span style="font-size:0.8rem;color:${cor};font-weight:700;min-width:36px;">${conformidade}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── ABA: GRÁFICOS ───
function renderizarGraficos() {
  // Aggregar por produto
  const mapa = {};
  todasConferencias.forEach(conf => {
    (conf.itens || []).forEach(item => {
      const chave = item.produto || item.codigo || '—';
      if (!mapa[chave]) {
        mapa[chave] = { qtd: 0, aparicoes: 0, codigo: item.codigo || '—', editora: item.editora || '—' };
      }
      mapa[chave].qtd += (item.qtdeConferida || 0);
      mapa[chave].aparicoes++;
    });
  });

  const sorted = Object.entries(mapa).sort((a, b) => b[1].qtd - a[1].qtd);
  rankingCompleto = sorted; // salva ranking completo para pesquisa
  const top15 = sorted.slice(0, 15);
  const labels = top15.map(([nome]) => nome.length > 28 ? nome.substring(0, 26) + '…' : nome);
  const values = top15.map(([, d]) => d.qtd);

  // Gráfico de ranking (barras horizontais)
  if (chartRanking) chartRanking.destroy();
  const ctxR = document.getElementById('chartRanking').getContext('2d');
  chartRanking = new Chart(ctxR, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Qtde Total Conferida',
        data: values,
        backgroundColor: top15.map((_, i) => `hsla(${220 - i * 10}, 80%, ${65 - i * 1.5}%, 0.85)`),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x} unidades conferidas`
          }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
        y: { ticks: { color: '#e2e8f0', font: { size: 11 } }, grid: { display: false } }
      }
    }
  });

  // Gráfico de status (rosca)
  const completas = todasConferencias.filter(c => c.statusGeral === 'Completo').length;
  const parciais = todasConferencias.filter(c => c.statusGeral === 'Parcial').length;
  const divergentes = todasConferencias.filter(c => c.statusGeral === 'Com Divergência').length;

  if (chartStatus) chartStatus.destroy();
  const ctxS = document.getElementById('chartStatus').getContext('2d');
  chartStatus = new Chart(ctxS, {
    type: 'doughnut',
    data: {
      labels: ['Completo', 'Parcial', 'Com Divergência'],
      datasets: [{
        data: [completas, parciais, divergentes],
        backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'],
        borderColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Legenda manual
  const legenda = document.getElementById('legendaStatus');
  const cores = ['#10b981', '#f59e0b', '#ef4444'];
  const nomes = ['Completo', 'Parcial', 'Com Divergência'];
  const vals  = [completas, parciais, divergentes];
  legenda.innerHTML = nomes.map((n, i) => `
    <div class="legenda-item">
      <div class="legenda-dot" style="background:${cores[i]};"></div>
      <span>${n}: <strong style="color:${cores[i]}">${vals[i]}</strong></span>
    </div>
  `).join('');

  // Tabela de ranking completo
  renderizarTabelaRanking();
}

// ─── TABELA RANKING ───
function renderizarTabelaRanking(filtro = '') {
  const tbody = document.getElementById('tbodyRanking');
  const contador = document.getElementById('contadorRanking');
  if (!tbody) return;

  const query = filtro.toLowerCase().trim();

  // 1) Aplicar slice de ranking (mais/menos vendidos)
  let lista = rankingCompleto;
  if (rankingSlice) {
    if (rankingSlice.tipo === 'mais') {
      lista = rankingCompleto.slice(0, rankingSlice.n);
    } else {
      // menos vendidos = últimos N (ordem crescente)
      lista = rankingCompleto.slice(-rankingSlice.n).reverse();
    }
  }

  // 2) Aplicar filtro de texto sobre o slice
  if (query) {
    lista = lista.filter(([nome, d]) =>
      nome.toLowerCase().includes(query) ||
      (d.codigo || '').toLowerCase().includes(query)
    );
  }

  const maxQtd = rankingCompleto.length > 0 ? rankingCompleto[0][1].qtd : 1;

  tbody.innerHTML = '';
  lista.forEach(([nome, d], idx) => {
    // Posição real no ranking global
    const posGlobal = rankingCompleto.findIndex(([n]) => n === nome) + 1;
    const pct = maxQtd > 0 ? Math.round((d.qtd / maxQtd) * 100) : 0;
    const medalha = posGlobal === 1 ? '🥇' : posGlobal === 2 ? '🥈' : posGlobal === 3 ? '🥉'
      : `<span style="color:var(--text-secondary)">${posGlobal}</span>`;
    const corBarra = posGlobal === 1 ? '#f59e0b' : posGlobal < 4 ? '#60a5fa' : posGlobal < 11 ? '#818cf8' : '#64748b';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="text-align:center;font-size:1.1rem;font-weight:800">${medalha}</td>
      <td style="font-family:monospace;font-size:0.82rem;color:#94a3b8">${d.codigo || '—'}</td>
      <td style="font-weight:600;color:#e2e8f0">${nome}</td>
      <td style="color:#94a3b8;font-size:0.82rem">${d.editora || '—'}</td>
      <td style="font-weight:800;color:${corBarra}">${d.qtd}</td>
      <td style="color:#60a5fa">${d.aparicoes}×</td>
      <td style="min-width:120px">
        <div class="conformidade-bar">
          <div class="conformidade-track">
            <div class="conformidade-fill" style="width:${pct}%;background:${corBarra};"></div>
          </div>
          <span style="font-size:0.75rem;color:${corBarra};font-weight:700;min-width:36px">${pct}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (contador) {
    contador.textContent = `${lista.length} material(is)`;
    contador.style.display = lista.length > 0 ? 'inline-block' : 'none';
  }
}

// ─── FILTRO RÁPIDO DE RANKING (mais/menos vendidos) ───
let rankingSlice = null; // { tipo: 'mais'|'menos', n: number } ou null = todos

function aplicarFiltroRanking(tipo, n) {
  rankingSlice = { tipo, n };

  // Atualizar visual dos botões
  document.querySelectorAll('.btn-rank').forEach(b => b.classList.remove('active-rank'));
  const idBtn = `btnTop${n}${tipo}`;
  const btn = document.getElementById(idBtn);
  if (btn) btn.classList.add('active-rank');

  // Badge de modo ativo
  const badge = document.getElementById('rankingModoAtivo');
  const icon = tipo === 'mais'
    ? '<i class="fa-solid fa-arrow-trend-up me-1" style="color:#34d399"></i>'
    : '<i class="fa-solid fa-arrow-trend-down me-1" style="color:#f87171"></i>';
  const label = tipo === 'mais' ? `Top ${n} Mais Vendidos` : `Últimos ${n} Menos Vendidos`;
  badge.innerHTML = icon + label;
  badge.style.display = 'inline-block';
  badge.style.background = tipo === 'mais' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
  badge.style.color = tipo === 'mais' ? '#34d399' : '#f87171';
  badge.style.borderColor = tipo === 'mais' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)';

  // Limpar pesquisa de texto ao mudar filtro
  document.getElementById('inputPesquisaRanking').value = '';
  renderizarTabelaRanking('');
}

function limparFiltroRanking() {
  rankingSlice = null;
  document.querySelectorAll('.btn-rank').forEach(b => b.classList.remove('active-rank'));
  document.getElementById('rankingModoAtivo').style.display = 'none';
  document.getElementById('inputPesquisaRanking').value = '';
  renderizarTabelaRanking('');
}

function filtrarRanking() {
  const val = document.getElementById('inputPesquisaRanking').value;
  // Pesquisa de texto limpa o slice de ranking
  if (val) {
    rankingSlice = null;
    document.querySelectorAll('.btn-rank').forEach(b => b.classList.remove('active-rank'));
    document.getElementById('rankingModoAtivo').style.display = 'none';
  }
  renderizarTabelaRanking(val);
}

function limparPesquisaRanking() {
  document.getElementById('inputPesquisaRanking').value = '';
  renderizarTabelaRanking('');
}

// ─── HELPER: OBTER LISTA VISÍVEL DO RANKING ───
function obterListaRankingAtual() {
  const query = (document.getElementById('inputPesquisaRanking')?.value || '').toLowerCase().trim();
  let lista = rankingCompleto;
  if (rankingSlice) {
    lista = rankingSlice.tipo === 'mais'
      ? rankingCompleto.slice(0, rankingSlice.n)
      : rankingCompleto.slice(-rankingSlice.n).reverse();
  }
  if (query) {
    lista = lista.filter(([nome, d]) =>
      nome.toLowerCase().includes(query) || (d.codigo || '').toLowerCase().includes(query)
    );
  }
  return lista;
}

function tituloRanking() {
  if (!rankingSlice) return 'Ranking Completo de Materiais';
  return rankingSlice.tipo === 'mais'
    ? `Top ${rankingSlice.n} — Mais Vendidos`
    : `Últimos ${rankingSlice.n} — Menos Vendidos`;
}

// ─── EXPORTAR RANKING → PDF ───
function exportarRankingPDF() {
  const PDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!PDFClass) { alert('jsPDF não disponível.'); return; }

  const lista = obterListaRankingAtual();
  if (lista.length === 0) { alert('Nenhum item no ranking para exportar.'); return; }

  const doc = new PDFClass({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const now  = new Date().toLocaleString('pt-BR', { hour12: false });
  const titulo = tituloRanking();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`Ranking de Materiais — Startweb / Ebenezer`, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${titulo}  |  ${lista.length} material(is)  |  Gerado em: ${now}`, 40, 58);

  const maxQtd = rankingCompleto.length > 0 ? rankingCompleto[0][1].qtd : 1;
  const rows = lista.map(([nome, d], idx) => {
    const posGlobal = rankingCompleto.findIndex(([n]) => n === nome) + 1;
    const pct = maxQtd > 0 ? Math.round((d.qtd / maxQtd) * 100) : 0;
    return [
      String(posGlobal),
      d.codigo || '—',
      nome,
      d.editora || '—',
      String(d.qtd),
      `${d.aparicoes}×`,
      `${pct}%`
    ];
  });

  doc.autoTable({
    head: [['#', 'Código', 'Material', 'Editora', 'Total Conferido', 'Aparições', 'Distribuição']],
    body: rows,
    startY: 72,
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' }
    }
  });

  const nomeArquivo = rankingSlice
    ? `ranking-${rankingSlice.tipo}-${rankingSlice.n}-ebenezer.pdf`
    : 'ranking-completo-ebenezer.pdf';
  doc.save(nomeArquivo);
}

// ─── EXPORTAR RANKING → EXCEL ───
function exportarRankingExcel() {
  if (typeof XLSX === 'undefined') { alert('Biblioteca XLSX não disponível.'); return; }

  const lista = obterListaRankingAtual();
  if (lista.length === 0) { alert('Nenhum item no ranking para exportar.'); return; }

  const maxQtd = rankingCompleto.length > 0 ? rankingCompleto[0][1].qtd : 1;
  const titulo = tituloRanking();

  // Montar dados
  const dados = lista.map(([nome, d]) => {
    const posGlobal = rankingCompleto.findIndex(([n]) => n === nome) + 1;
    const pct = maxQtd > 0 ? Math.round((d.qtd / maxQtd) * 100) : 0;
    return {
      'Posição':          posGlobal,
      'Código':           d.codigo || '—',
      'Material':         nome,
      'Editora':          d.editora || '—',
      'Total Conferido':  d.qtd,
      'Aparições':        d.aparicoes,
      'Distribuição (%)': pct
    };
  });

  const ws = XLSX.utils.json_to_sheet(dados);

  // Larguras de coluna
  ws['!cols'] = [
    { wch: 8 }, { wch: 14 }, { wch: 40 }, { wch: 20 },
    { wch: 16 }, { wch: 10 }, { wch: 16 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, titulo.substring(0, 31));

  // Aba de metadados
  const meta = XLSX.utils.aoa_to_sheet([
    ['Relatório', 'Ranking de Materiais — Startweb / Ebenezer'],
    ['Filtro',    titulo],
    ['Total',     lista.length + ' material(is)'],
    ['Gerado em', new Date().toLocaleString('pt-BR', { hour12: false })]
  ]);
  XLSX.utils.book_append_sheet(wb, meta, 'Info');

  const nomeArquivo = rankingSlice
    ? `ranking-${rankingSlice.tipo}-${rankingSlice.n}-ebenezer.xlsx`
    : 'ranking-completo-ebenezer.xlsx';
  XLSX.writeFile(wb, nomeArquivo);
}

// ─── MOSTRAR ABA ───
function mostrarAba(aba, btn) {
  document.querySelectorAll('.aba-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.hist-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('aba' + aba.charAt(0).toUpperCase() + aba.slice(1)).style.display = 'block';
  btn.classList.add('active');
}

// ─── EXPORTAR PDF DO RELATÓRIO ───
function exportarRelatorioPDF() {
  const PDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!PDFClass) { alert('jsPDF não disponível.'); return; }

  const doc = new PDFClass({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const now = new Date().toLocaleString('pt-BR', { hour12: false });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Relatório de Histórico — Startweb / Ebenezer', 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Gerado em: ${now}  |  Total de conferências: ${todasConferencias.length}`, 40, 58);

  const rows = todasConferencias.map(c => [
    (c.todasOrdens || [c.ordemCompra] || ['—']).join(', '),
    c.dataConferencia ? formatarData(c.dataConferencia) : '—',
    (c.lojas || []).join(', ') || '—',
    String(c.totalItens || 0),
    String(c.totalEsperado || 0),
    String(c.totalConferido || 0),
    c.statusGeral || '—'
  ]);

  doc.autoTable({
    head: [['Ordem de Compra', 'Data', 'Lojas', 'Itens', 'Qtde Esperada', 'Qtde Conferida', 'Status']],
    body: rows,
    startY: 72,
    margin: { left: 40, right: 40 },
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 255] }
  });

  doc.save('relatorio-historico-ebenezer.pdf');
}

// ─── LOADING ───
function mostrarLoading(show) {
  document.getElementById('loadingPanel').style.display = show ? 'block' : 'none';
  document.querySelectorAll('.aba-panel').forEach(p => p.style.display = show ? 'none' : '');
  if (!show) {
    // Garantir que só a aba ativa seja mostrada
    const abaAtiva = document.querySelector('.hist-tab.active');
    const nomeAba = abaAtiva ? abaAtiva.textContent.trim() : '';
    if (!nomeAba.includes('Produto') && !nomeAba.includes('Ranking')) {
      document.getElementById('abaConferencias').style.display = 'block';
      document.getElementById('abaProdutos').style.display = 'none';
      document.getElementById('abaRanking').style.display = 'none';
    }
  }
}

// ─── FORMATAR DATA ───
function formatarData(date) {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
