// ═══════════════════════════════════════════════════════
// Startweb — Importar Planilhas em Lote · importar-lote.js
// ═══════════════════════════════════════════════════════

let planilhas = []; // { nome, dados, dadosOriginais, status, card }
let okMode = false; // quando true: conf = esperado, status = OK

// ─── DRAG & DROP ───
function dragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('drag-over');
}
function dragLeave() {
  document.getElementById('dropzone').classList.remove('drag-over');
}
function dropArquivos(e) {
  e.preventDefault();
  dragLeave();
  carregarArquivos(e.dataTransfer.files);
}

// ─── MAPEAR COLUNA COM NOMES VARIADOS ───
function getCol(row, nomes) {
  for (const n of nomes) {
    if (row[n] !== undefined && row[n] !== null && String(row[n]).trim() !== '') return String(row[n]).trim();
  }
  const keys = Object.keys(row);
  for (const n of nomes) {
    const norm = n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
    const found = keys.find(k => k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'') === norm);
    if (found) return String(row[found]).trim();
  }
  return '';
}

// ─── CALCULAR STATUS DE UM ITEM ───
function calcularStatus(esperado, conferida) {
  const esp = parseInt(esperado) || 0;
  const conf = parseInt(conferida) || 0;
  if (conf === 0 && esp > 0) return '-';       // não conferido
  if (conf === esp) return 'OK';
  if (conf > esp) return 'Superior';
  return 'Faltando';
}

// ─── TOGGLE MODO OK ───
function toggleOkMode(ativo) {
  okMode = ativo;
  const painel = document.getElementById('toggleStatusOk');
  const alerta = document.getElementById('okModeAlert');
  painel.classList.toggle('mode-on', ativo);
  alerta.style.display = ativo ? 'block' : 'none';

  // Re-processar planilhas já carregadas
  planilhas.forEach(p => {
    if (!p.dadosOriginais) return;
    p.dados = aplicarModoOk(JSON.parse(JSON.stringify(p.dadosOriginais)));
    if (p.status === 'pronto' || p.status === 'salvo') atualizarCard(p);
  });
  atualizarResumoGeral();
}

// ─── APLICAR MODO OK A UM OBJETO CONFERÊNCIA ───
function aplicarModoOk(conf) {
  if (!okMode) return conf;
  conf.itens = conf.itens.map(item => ({
    ...item,
    qtdeConferida: item.qtdeEsperada,
    status: 'OK'
  }));
  conf.totalConferido = conf.totalEsperado;
  conf.statusGeral = 'Completo';
  return conf;
}

// ─── LER ARQUIVO XLSX ───
function lerXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        resolve(json);
      } catch(err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─── MONTAR OBJETO CONFERÊNCIA A PARTIR DA PLANILHA ───
function montarConferencia(json, nomeArquivo) {
  const itens = [];
  const lojas = new Set();
  const ordens = new Set();

  json.forEach(row => {
    const codigo   = getCol(row, ['Ean','EAN','ean','Código','Codigo','CODIGO','Cod','COD']);
    const produto  = getCol(row, ['PRODUTO','Produto','produto','DESCRICAO','Descricao','Descrição','Nome','NOME']);
    const editora  = getCol(row, ['EDITORA','Editora','editora','Fornecedor','FORNECEDOR','Marca','MARCA']);
    const qtde     = getCol(row, ['QTDE','Qtde','qtde','Quantidade','QUANTIDADE','QTD','Qtd']);
    const conf     = getCol(row, ['Conferida','CONFERIDA','conferida','QtdeConferida','Qtde Conferida','Conf']);
    const statusPl = getCol(row, ['Status','STATUS','status']);
    const loja     = getCol(row, ['Loja','LOJA','loja','Filial','FILIAL','Unidade']);
    const ordem    = getCol(row, ['Numero Ordem de Compra','Numero da Ordem de Compra','NUMERO ORDEM DE COMPRA',
                                   'Ordem de Compra','ORDEM DE COMPRA','OC','Pedido','PEDIDO','NumOC','Num OC']);

    if (!codigo && !produto) return; // pular linhas vazias

    const status = statusPl || calcularStatus(qtde, conf);
    if (loja)  lojas.add(loja);
    if (ordem) ordens.add(ordem);

    itens.push({
      codigo, produto, editora,
      qtdeEsperada: parseInt(qtde) || 0,
      qtdeConferida: parseInt(conf) || 0,
      status, loja, ordemCompra: ordem
    });
  });

  const totalEsperado  = itens.reduce((s, i) => s + i.qtdeEsperada, 0);
  const totalConferido = itens.reduce((s, i) => s + i.qtdeConferida, 0);
  const pendentes   = itens.filter(i => i.status === '-').length;
  const divergentes = itens.filter(i => i.status === 'Superior' || i.status === 'Faltando').length;
  let statusGeral = 'Completo';
  if (pendentes > 0)   statusGeral = 'Parcial';
  else if (divergentes > 0) statusGeral = 'Com Divergência';

  const listaOrdens = [...ordens].filter(Boolean);
  const dadosOriginais = {
    ordemCompra: listaOrdens[0] || nomeArquivo,
    todasOrdens: listaOrdens,
    lojas: [...lojas].filter(Boolean),
    totalItens: itens.length,
    totalEsperado,
    totalConferido,
    statusGeral,
    itens,
    fonteArquivo: nomeArquivo
  };
  return dadosOriginais;
}

// ─── CARREGAR ARQUIVOS ───
async function carregarArquivos(files) {
  if (!files || files.length === 0) return;
  document.getElementById('painelResumo').style.display = 'flex';
  document.getElementById('painelAcoes').style.display  = 'flex';

  for (const file of Array.from(files)) {
    // evitar duplicata
    if (planilhas.find(p => p.nome === file.name)) continue;

    const entrada = { nome: file.name, status: 'lendo', dados: null, card: null };
    planilhas.push(entrada);
    const card = criarCard(entrada);
    entrada.card = card;

    try {
      const json = await lerXlsx(file);
      if (json.length === 0) throw new Error('Planilha vazia');
      const dadosOriginais = montarConferencia(json, file.name);
      entrada.dadosOriginais = dadosOriginais;
      entrada.dados = aplicarModoOk(JSON.parse(JSON.stringify(dadosOriginais)));
      entrada.status = 'pronto';
      atualizarCard(entrada);
    } catch(err) {
      entrada.status = 'erro';
      entrada.erroMsg = err.message;
      atualizarCard(entrada);
    }
  }

  atualizarResumoGeral();
  // limpar input para permitir re-selecionar mesmos arquivos
  document.getElementById('inputLote').value = '';
}

// ─── CRIAR CARD ───
function criarCard(entrada) {
  const div = document.createElement('div');
  div.className = 'planilha-card';
  div.id = 'card-' + entrada.nome.replace(/[^a-z0-9]/gi, '_');
  div.innerHTML = `
    <i class="fa-solid fa-file-excel" style="color:#34d399;font-size:1.4rem;flex-shrink:0"></i>
    <div class="planilha-nome">${entrada.nome}</div>
    <div class="planilha-info" id="info-${div.id}">
      <span><i class="fa-solid fa-spinner fa-spin"></i> Lendo...</span>
    </div>
    <span class="planilha-status ps-processando" id="st-${div.id}">Lendo</span>
    <button class="btn btn-sm btn-outline-danger" onclick="removerPlanilha('${entrada.nome}')" title="Remover">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  document.getElementById('listaPlanilhas').appendChild(div);
  return div;
}

// ─── ATUALIZAR CARD ───
function atualizarCard(entrada) {
  const safeId = 'card-' + entrada.nome.replace(/[^a-z0-9]/gi, '_');
  const card   = document.getElementById(safeId);
  const info   = document.getElementById('info-' + safeId);
  const st     = document.getElementById('st-' + safeId);
  if (!card) return;

  if (entrada.status === 'pronto') {
    const d = entrada.dados;
    const badgeStatus = d.statusGeral === 'Completo'
      ? '<span style="color:#34d399">Completo</span>'
      : d.statusGeral === 'Parcial'
      ? '<span style="color:#fbbf24">Parcial</span>'
      : '<span style="color:#f87171">Com Divergência</span>';

    const okBadge = okMode
      ? '<span style="background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:0 0.4rem;font-size:0.75rem;font-weight:700;margin-left:4px;"><i class="fa-solid fa-bolt"></i> Modo OK</span>'
      : '';

    info.innerHTML = `
      <span><i class="fa-solid fa-boxes-stacked"></i> ${d.totalItens} itens</span>
      <span><i class="fa-solid fa-list-ol"></i> Esp: <strong>${d.totalEsperado}</strong></span>
      <span><i class="fa-solid fa-clipboard-check"></i> Conf: <strong>${d.totalConferido}</strong></span>
      <span><i class="fa-solid fa-store"></i> ${d.lojas.join(', ') || '—'}</span>
      <span><i class="fa-solid fa-file-invoice"></i> ${d.todasOrdens.join(', ') || '—'}</span>
      <span><i class="fa-solid fa-signal"></i> ${badgeStatus}${okBadge}</span>
    `;
    st.className = 'planilha-status ps-aguardando';
    st.textContent = 'Pronto';
    card.className = 'planilha-card status-ok';

  } else if (entrada.status === 'salvo') {
    st.className = 'planilha-status ps-salvo';
    st.innerHTML = '<i class="fa-solid fa-check me-1"></i>Salvo';
    card.className = 'planilha-card status-salvo';

  } else if (entrada.status === 'erro') {
    info.innerHTML = `<span style="color:#f87171"><i class="fa-solid fa-triangle-exclamation"></i> ${entrada.erroMsg || 'Erro desconhecido'}</span>`;
    st.className = 'planilha-status ps-erro';
    st.textContent = 'Erro';
    card.className = 'planilha-card status-erro';

  } else if (entrada.status === 'salvando') {
    st.className = 'planilha-status ps-processando';
    st.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Salvando';
  }
}

// ─── REMOVER PLANILHA ───
function removerPlanilha(nome) {
  planilhas = planilhas.filter(p => p.nome !== nome);
  const safeId = 'card-' + nome.replace(/[^a-z0-9]/gi, '_');
  document.getElementById(safeId)?.remove();
  atualizarResumoGeral();
  if (planilhas.length === 0) {
    document.getElementById('painelResumo').style.display = 'none';
    document.getElementById('painelAcoes').style.display  = 'none';
  }
}

// ─── ATUALIZAR RESUMO GERAL ───
function atualizarResumoGeral() {
  const prontas = planilhas.filter(p => p.status === 'pronto' || p.status === 'salvo');
  const salvas  = planilhas.filter(p => p.status === 'salvo');
  const erros   = planilhas.filter(p => p.status === 'erro');
  const totalItens = prontas.reduce((s, p) => s + (p.dados?.totalItens || 0), 0);

  document.getElementById('rTotal').textContent = planilhas.length;
  document.getElementById('rItens').textContent = totalItens;
  document.getElementById('rSalvas').textContent = salvas.length;
  document.getElementById('rErros').textContent  = erros.length;

  const pct = planilhas.length > 0 ? Math.round((salvas.length / planilhas.length) * 100) : 0;
  document.getElementById('barraProgresso').style.width = pct + '%';
  document.getElementById('textoProgresso').textContent = salvas.length > 0
    ? `${salvas.length} de ${planilhas.length} planilhas salvas`
    : '';

  const btn = document.getElementById('btnSalvarTudo');
  const prontas2 = planilhas.filter(p => p.status === 'pronto');
  btn.disabled = prontas2.length === 0;
  document.getElementById('badgePlanilhas').textContent =
    prontas2.length > 0 ? `${prontas2.length} planilha(s) pronta(s) para salvar` : '';
}

// ─── SALVAR TODAS ───
async function salvarTudo() {
  const prontas = planilhas.filter(p => p.status === 'pronto');
  if (prontas.length === 0) return;

  const btn = document.getElementById('btnSalvarTudo');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Salvando...';

  // Salvar em paralelo (lotes de 5 para não sobrecarregar)
  const lote = 5;
  for (let i = 0; i < prontas.length; i += lote) {
    const grupo = prontas.slice(i, i + lote);
    await Promise.all(grupo.map(async entrada => {
      entrada.status = 'salvando';
      atualizarCard(entrada);
      try {
        const resultado = await DB.salvarConferencia(entrada.dados);
        entrada.status = resultado.sucesso ? 'salvo' : 'erro';
        if (!resultado.sucesso) entrada.erroMsg = resultado.erro;
      } catch(e) {
        entrada.status = 'erro';
        entrada.erroMsg = e.message;
      }
      atualizarCard(entrada);
      atualizarResumoGeral();
    }));
  }

  btn.innerHTML = '<i class="fa-solid fa-floppy-disk me-2"></i>Salvar Todas no Firebase';
  atualizarResumoGeral();
}

// ─── LIMPAR TUDO ───
function limparTudo() {
  planilhas = [];
  document.getElementById('listaPlanilhas').innerHTML = '';
  document.getElementById('painelResumo').style.display = 'none';
  document.getElementById('painelAcoes').style.display  = 'none';
}
