// ═══════════════════════════════════════════════════════
// Startweb — Conferência de Materiais · Ebenezer
// Script Principal (v2 — corrigido e melhorado)
// ═══════════════════════════════════════════════════════

const dadosIniciais = [
  { Ean: "9781234567897", PRODUTO: "Livro Gestão 360", EDITORA: "Editora Alpha", QTDE: "12", Loja: "Matriz", "Numero Ordem de Compra": "OC-1001" },
  { Ean: "7894561230123", PRODUTO: "Caneta Lux", EDITORA: "Impressa Beta", QTDE: "24", Loja: "Filial Sul", "Numero Ordem de Compra": "OC-1002" },
  { Ean: "7893216549870", PRODUTO: "Caderno Executivo", EDITORA: "Publishing Gamma", QTDE: "18", Loja: "Filial Norte", "Numero Ordem de Compra": "OC-1003" },
  { Ean: "7896541230785", PRODUTO: "Agenda Corporativa", EDITORA: "SmartPrint", QTDE: "30", Loja: "Matriz", "Numero Ordem de Compra": "OC-1004" },
  { Ean: "9789876543210", PRODUTO: "Fone Headset", EDITORA: "AudioPlus", QTDE: "15", Loja: "Filial Sul", "Numero Ordem de Compra": "OC-1005" },
  { Ean: "7891472583690", PRODUTO: "Bloco de Notas", EDITORA: "OfficePro", QTDE: "40", Loja: "Filial Norte", "Numero Ordem de Compra": "OC-1006" },
  { Ean: "9788529637412", PRODUTO: "Suporte para Tablet", EDITORA: "FlexTech", QTDE: "10", Loja: "Matriz", "Numero Ordem de Compra": "OC-1007" },
  { Ean: "7897418529630", PRODUTO: "Caneca Térmica", EDITORA: "DesignLine", QTDE: "22", Loja: "Filial Oeste", "Numero Ordem de Compra": "OC-1008" },
  // Exemplo de produto duplicado com qtde diferente para testar
  { Ean: "9781234567897", PRODUTO: "Livro Gestão 360", EDITORA: "Editora Alpha", QTDE: "8", Loja: "Filial Sul", "Numero Ordem de Compra": "OC-1009" }
];

// ─── INICIALIZAÇÃO ───
window.addEventListener("DOMContentLoaded", () => {
  carregarDadosIniciais();
  configurarNavegacaoEnter();
});

// ─── NAVEGAÇÃO COM ENTER ───
function configurarNavegacaoEnter() {
  const campoCodigo = document.getElementById("codigo");
  const campoQuantidade = document.getElementById("quantidade");

  campoCodigo.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      campoQuantidade.focus();
      campoQuantidade.select();
    }
  });

  campoQuantidade.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      conferir();
    }
  });
}

function carregarDadosIniciais() {
  const tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";
  dadosIniciais.forEach(item => {
    inserirLinha(item.Ean, item.PRODUTO, item.EDITORA, item.QTDE, item.Loja, item["Numero Ordem de Compra"]);
  });
  atualizarFiltros();
  atualizarEstatisticas();
}

// ─── IMPORTAÇÃO ROBUSTA ───
// Função auxiliar para encontrar valor de coluna com nomes variados
function getColuna(item, nomesPosiveis) {
  // Tentativa direta
  for (const nome of nomesPosiveis) {
    if (item[nome] !== undefined && item[nome] !== null && String(item[nome]).trim() !== "") {
      return String(item[nome]).trim();
    }
  }
  // Tentativa case-insensitive e sem acentos
  const chaves = Object.keys(item);
  for (const nome of nomesPosiveis) {
    const nomeNorm = normalizarTexto(nome);
    const encontrada = chaves.find(k => normalizarTexto(k) === nomeNorm);
    if (encontrada && item[encontrada] !== undefined && item[encontrada] !== null) {
      return String(item[encontrada]).trim();
    }
  }
  return "";
}

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]/g, ""); // remove espaços, pontuação
}

function importar() {
  const file = document.getElementById("importarExcel").files[0];
  if (!file) {
    mostrarFeedback("Selecione um arquivo Excel para importar.", "warning");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    if (json.length === 0) {
      mostrarFeedback("A planilha está vazia ou não foi possível ler os dados.", "danger");
      return;
    }

    const tbody = document.querySelector("#tabela tbody");
    tbody.innerHTML = "";

    json.forEach(item => {
      const codigo = getColuna(item, [
        "Ean", "EAN", "ean", "Código", "Codigo", "codigo", "CODIGO",
        "Cod", "COD", "Código de Barras", "Codigo de Barras", "CodigoBarras"
      ]);
      const produto = getColuna(item, [
        "PRODUTO", "Produto", "produto", "DESCRICAO", "Descricao", "Descrição",
        "descricao", "Nome", "NOME", "nome", "Nome do Produto", "NOME DO PRODUTO"
      ]);
      const editora = getColuna(item, [
        "EDITORA", "Editora", "editora", "Fornecedor", "FORNECEDOR", "fornecedor",
        "Marca", "MARCA", "marca"
      ]);
      const qtde = getColuna(item, [
        "QTDE", "Qtde", "qtde", "Quantidade", "QUANTIDADE", "quantidade",
        "QTD", "Qtd", "qtd", "Qt", "QT"
      ]);
      const loja = getColuna(item, [
        "Loja", "LOJA", "loja", "Filial", "FILIAL", "filial",
        "Unidade", "UNIDADE", "unidade", "Nome Loja", "NOME LOJA"
      ]);
      const ordem = getColuna(item, [
        "Numero Ordem de Compra", "Numero da Ordem de Compra", "NumeroOrdemDeCompra",
        "NUMERO ORDEM DE COMPRA", "numero ordem de compra",
        "Nº Ordem de Compra", "N° Ordem de Compra", "Nº OC", "N OC",
        "Ordem de Compra", "ORDEM DE COMPRA", "ordem de compra",
        "OC", "oc", "Oc", "OrdemCompra", "ORDEMCOMPRA",
        "Numero OC", "NUMERO OC", "Num OC", "NUM OC",
        "Pedido", "PEDIDO", "pedido", "Nº Pedido", "Numero Pedido",
        "NUMERO PEDIDO", "NumPedido", "Num Pedido"
      ]);

      inserirLinha(codigo, produto, editora, qtde, loja, ordem);
    });

    atualizarFiltros();
    atualizarEstatisticas();
    mostrarFeedback(`✓ ${json.length} itens importados com sucesso!`, "success");
  };
  reader.readAsArrayBuffer(file);
}

// ─── ATUALIZAR FILTROS (Loja + Ordem de Compra) ───
function atualizarFiltros() {
  const lojas = new Set();
  const ordens = new Set();

  document.querySelectorAll("#tabela tbody tr").forEach(tr => {
    const loja = tr.cells[6].textContent.trim();
    const ordem = tr.cells[7].textContent.trim();
    if (loja) lojas.add(loja);
    if (ordem) ordens.add(ordem);
  });

  // Atualizar select de Lojas
  const selectLoja = document.getElementById("filtroLoja");
  const lojaAtual = selectLoja.value;
  selectLoja.innerHTML = '<option value="">Todas as Lojas</option>';
  [...lojas].sort().forEach(loja => {
    const opt = document.createElement("option");
    opt.value = loja;
    opt.textContent = loja;
    selectLoja.appendChild(opt);
  });
  selectLoja.value = lojaAtual;

  // Atualizar select de Ordens de Compra
  const selectOrdem = document.getElementById("filtroOrdem");
  const ordemAtual = selectOrdem.value;
  selectOrdem.innerHTML = '<option value="">Todas as Ordens</option>';
  [...ordens].sort().forEach(ordem => {
    const opt = document.createElement("option");
    opt.value = ordem;
    opt.textContent = ordem;
    selectOrdem.appendChild(opt);
  });
  selectOrdem.value = ordemAtual;
}

// ─── FILTRO UNIFICADO ───
// Todos os filtros trabalham juntos (pesquisa + loja + ordem)
function aplicarFiltros() {
  const termo = document.getElementById("busca").value.toLowerCase().trim();
  const lojaFiltro = document.getElementById("filtroLoja").value;
  const ordemFiltro = document.getElementById("filtroOrdem").value;

  document.querySelectorAll("#tabela tbody tr").forEach(tr => {
    const codigo = tr.cells[0].textContent.toLowerCase();
    const produto = tr.cells[1].textContent.toLowerCase();
    const editora = tr.cells[2].textContent.toLowerCase();
    const loja = tr.cells[6].textContent.trim();
    const ordem = tr.cells[7].textContent.trim();

    // Verifica pesquisa (código, produto, editora ou ordem)
    const matchBusca = termo === "" ||
      codigo.includes(termo) ||
      produto.includes(termo) ||
      editora.includes(termo) ||
      ordem.toLowerCase().includes(termo);

    // Verifica filtro de loja
    const matchLoja = lojaFiltro === "" || loja === lojaFiltro;

    // Verifica filtro de ordem
    const matchOrdem = ordemFiltro === "" || ordem === ordemFiltro;

    tr.style.display = (matchBusca && matchLoja && matchOrdem) ? "" : "none";
  });

  // Atualizar estatísticas com base nos itens filtrados
  atualizarEstatisticas();
}

// ─── CONFERIR (CORRIGIDO PARA PRODUTOS DUPLICADOS) ───
function conferir() {
  const codigo = document.getElementById("codigo").value.trim();
  const qtd = parseInt(document.getElementById("quantidade").value);

  if (!codigo) {
    mostrarFeedback("Digite ou bipe um código de barras.", "warning");
    document.getElementById("codigo").focus();
    return;
  }
  if (isNaN(qtd) || qtd < 0) {
    mostrarFeedback("Informe uma quantidade válida.", "warning");
    document.getElementById("quantidade").focus();
    return;
  }

  // Encontrar todas as linhas visíveis com o mesmo código
  const linhasVisiveis = [];
  document.querySelectorAll("#tabela tbody tr").forEach(tr => {
    if (tr.style.display !== "none" && tr.cells[0].textContent.trim() === codigo) {
      linhasVisiveis.push(tr);
    }
  });

  if (linhasVisiveis.length === 0) {
    mostrarFeedback(`✗ Código "${codigo}" não encontrado na tabela.`, "danger");
    return;
  }

  // CORREÇÃO: Atualizar apenas a PRIMEIRA linha ainda não conferida (status "-")
  // Se todas já foram conferidas, atualiza a primeira
  let linhaAlvo = linhasVisiveis.find(tr => {
    const select = tr.cells[5].querySelector("select");
    return select && select.value === "-";
  });

  // Se não há linha pendente, usar a primeira
  if (!linhaAlvo) {
    linhaAlvo = linhasVisiveis[0];
  }

  // Atualizar a quantidade conferida
  linhaAlvo.cells[4].textContent = qtd;

  // Atualizar o status baseado na comparação
  const esperado = parseInt(linhaAlvo.cells[3].textContent);
  const select = linhaAlvo.cells[5].querySelector("select");

  if (qtd === esperado) {
    select.value = "OK";
    linhaAlvo.className = "table-success";
  } else if (qtd > esperado) {
    select.value = "Superior";
    linhaAlvo.className = "table-warning";
  } else {
    select.value = "Faltando";
    linhaAlvo.className = "table-danger";
  }

  // Contar quantas linhas com esse código ainda estão pendentes
  const pendentes = linhasVisiveis.filter(tr => {
    const sel = tr.cells[5].querySelector("select");
    return sel && sel.value === "-";
  }).length;

  const totalComMesmoCodigo = linhasVisiveis.length;

  // Animação de destaque na linha conferida
  linhaAlvo.classList.remove("row-highlight");
  void linhaAlvo.offsetWidth; // force reflow
  linhaAlvo.classList.add("row-highlight");

  // Scroll suave até a linha conferida (a tabela rola, mas o painel fica fixo)
  linhaAlvo.scrollIntoView({ behavior: "smooth", block: "center" });

  // Feedback
  if (totalComMesmoCodigo > 1) {
    const conferidos = totalComMesmoCodigo - pendentes;
    mostrarFeedback(
      `✓ Conferido ${conferidos}/${totalComMesmoCodigo} itens com código ${codigo} — ` +
      `Produto: ${linhaAlvo.cells[1].textContent} | Loja: ${linhaAlvo.cells[6].textContent}`,
      pendentes > 0 ? "info" : "success"
    );
  } else {
    mostrarFeedback(
      `✓ Conferido: ${linhaAlvo.cells[1].textContent} — Esperado: ${esperado} | Conferido: ${qtd}`,
      qtd === esperado ? "success" : "warning"
    );
  }

  // Limpar campos e focar para próxima leitura
  document.getElementById("codigo").value = "";
  document.getElementById("quantidade").value = "";
  document.getElementById("codigo").focus();

  atualizarEstatisticas();
}

// ─── FEEDBACK VISUAL ───
function mostrarFeedback(mensagem, tipo) {
  const bar = document.getElementById("feedbackConferencia");
  bar.textContent = mensagem;
  bar.className = "feedback-bar feedback-" + tipo;
  bar.style.display = "block";

  // Auto-hide after 5s
  clearTimeout(bar._timeout);
  bar._timeout = setTimeout(() => {
    bar.style.display = "none";
  }, 5000);
}

// ─── ESTATÍSTICAS (conta quantidades totais, não linhas) ───
function atualizarEstatisticas() {
  let totalLinhas = 0, totalQtdEsperada = 0, totalQtdConferida = 0;
  let ok = 0, divergente = 0, pendente = 0;

  document.querySelectorAll("#tabela tbody tr").forEach(tr => {
    // Ignorar linhas ocultas pelos filtros
    if (tr.style.display === "none") return;
    totalLinhas++;
    const qtdEsperada = parseInt(tr.cells[3].textContent) || 0;
    const qtdConferida = parseInt(tr.cells[4].textContent) || 0;
    totalQtdEsperada += qtdEsperada;
    totalQtdConferida += qtdConferida;
    const select = tr.cells[5].querySelector("select");
    if (!select) return;
    const status = select.value;
    if (status === "OK") ok++;
    else if (status === "Superior" || status === "Faltando") divergente++;
    else pendente++;
  });

  document.getElementById("statTotal").textContent = totalQtdEsperada;
  document.getElementById("statTotalConferida").textContent = totalQtdConferida;
  document.getElementById("statLinhas").textContent = totalLinhas;
  document.getElementById("statOk").textContent = ok;
  document.getElementById("statDivergente").textContent = divergente;
  document.getElementById("statPendente").textContent = pendente;
}

// ─── INSERIR LINHA ───
function inserirLinha(codigo, produto, editora, qtde, loja, ordem) {
  const tbody = document.querySelector("#tabela tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td contenteditable="true">${codigo}</td>
    <td contenteditable="true">${produto}</td>
    <td contenteditable="true">${editora}</td>
    <td contenteditable="true">${qtde}</td>
    <td contenteditable="true">-</td>
    <td>
      <select class="form-select form-select-sm" onchange="atualizarStatusLinha(this)">
        <option value="-">-</option>
        <option value="OK">OK</option>
        <option value="Superior">Superior</option>
        <option value="Faltando">Faltando</option>
        <option value="Em análise">Em análise</option>
        <option value="Recebido parcial">Recebido parcial</option>
      </select>
    </td>
    <td contenteditable="true">${loja}</td>
    <td contenteditable="true">${ordem}</td>
    <td>
      <button class="btn btn-sm btn-danger" onclick="removerLinha(this)">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
}

function removerLinha(btn) {
  btn.closest("tr").remove();
  atualizarFiltros();
  atualizarEstatisticas();
}

function atualizarStatusLinha(select) {
  const tr = select.closest("tr");
  tr.className = "";
  switch (select.value) {
    case "OK": tr.className = "table-success"; break;
    case "Superior": tr.className = "table-warning"; break;
    case "Faltando": tr.className = "table-danger"; break;
    default: tr.className = ""; break;
  }
  atualizarEstatisticas();
}

// ─── ADICIONAR NOVO ───
function adicionar() {
  inserirLinha("", "", "", "0", "", "");
  atualizarFiltros();
  atualizarEstatisticas();

  // Focar no campo de código da nova linha
  const linhas = document.querySelectorAll("#tabela tbody tr");
  const ultima = linhas[linhas.length - 1];
  if (ultima) {
    ultima.scrollIntoView({ behavior: "smooth", block: "center" });
    ultima.cells[0].focus();
  }
}

// ─── EXPORTAR EXCEL ───
function exportar() {
  const linhas = [];
  document.querySelectorAll("#tabela tbody tr").forEach(tr => {
    if (tr.style.display !== "none") {
      const cols = tr.querySelectorAll("td");
      linhas.push({
        Ean: cols[0].textContent,
        PRODUTO: cols[1].textContent,
        EDITORA: cols[2].textContent,
        QTDE: cols[3].textContent,
        Conferida: cols[4].textContent,
        Status: tr.cells[5].querySelector("select").value,
        Loja: cols[6].textContent,
        "Numero Ordem de Compra": cols[7].textContent
      });
    }
  });

  if (linhas.length === 0) {
    mostrarFeedback("Nenhum item para exportar.", "warning");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Materiais");
  XLSX.writeFile(wb, "materiais.xlsx");
  mostrarFeedback(`✓ ${linhas.length} itens exportados para Excel.`, "success");
}

// ─── EXPORTAR PDF ───
function exportarPDF() {
  const PDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!PDFClass) {
    mostrarFeedback("Biblioteca jsPDF não encontrada. Verifique sua conexão.", "danger");
    return;
  }

  const doc = new PDFClass({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  const now = new Date();
  const datetime = now.toLocaleString('pt-BR', { hour12: false });
  const headerTitle = 'Conferência de Materiais - Startweb / Ebenezer';

  // Somar quantidades esperadas e conferidas dos itens visíveis
  let totalEsperado = 0;
  let totalConferido = 0;
  document.querySelectorAll('#tabela tbody tr').forEach(tr => {
    if (tr.style.display !== 'none') {
      const qtdEsp = parseInt(tr.cells[3].textContent) || 0;
      const qtdConf = parseInt(tr.cells[4].textContent) || 0;
      totalEsperado += qtdEsp;
      totalConferido += qtdConf;
    }
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(headerTitle, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Impressão: ${datetime}`, 40, 60);
  doc.text('Desenvolvedor responsável: Roberto Ursine - Startweb', 40, 76);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Total Esperado: ${totalEsperado}    |    Total Conferido: ${totalConferido}`, 40, 92);
  doc.setFont('helvetica', 'normal');

  const linhasPDF = [];
  document.querySelectorAll('#tabela tbody tr').forEach(tr => {
    if (tr.style.display !== 'none') {
      const cols = tr.querySelectorAll('td');
      linhasPDF.push([
        cols[0].textContent,
        cols[1].textContent,
        cols[2].textContent,
        cols[3].textContent,
        cols[4].textContent,
        tr.cells[5].querySelector('select').value,
        cols[6].textContent,
        cols[7].textContent
      ]);
    }
  });

  if (linhasPDF.length === 0) {
    mostrarFeedback("Nenhum item disponível para exportar em PDF.", "warning");
    return;
  }

  if (doc.autoTable) {
    doc.autoTable({
      head: [[
        'Código', 'Produto', 'Editora', 'Qtde Esperada', 'Qtde Conferida', 'Status', 'Loja', 'Nº Ordem de Compra'
      ]],
      body: linhasPDF,
      startY: 110,
      margin: { left: 40, right: 40, bottom: 40 },
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 247, 255] },
      didDrawPage: function (data) {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.text(`Emitido por Startweb | Roberto Ursine`, 40, pageHeight - 30);
        doc.text(`Data/Hora de impressão: ${datetime}`, 40, pageHeight - 16);
      }
    });
  } else {
    let y = 100;
    doc.setFontSize(9);
    doc.text('Código | Produto | Editora | Qtde Esperada | Qtde Conferida | Status | Loja | Nº Ordem de Compra', 40, y);
    linhasPDF.forEach(row => {
      y += 14;
      if (y > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        y = 40;
      }
      doc.text(row.join(' | '), 40, y);
    });
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.text(`Emitido por Startweb | Roberto Ursine`, 40, pageHeight - 30);
    doc.text(`Data/Hora de impressão: ${datetime}`, 40, pageHeight - 16);
  }

  doc.save('conferencia-materiais.pdf');
  mostrarFeedback("✓ PDF exportado com sucesso!", "success");
}

// ─── ORDENAÇÃO DA TABELA ───
let sortState = { colIndex: null, ascending: true };

function ordenarTabela(colIndex) {
  const tbody = document.querySelector("#tabela tbody");
  const linhas = Array.from(tbody.querySelectorAll("tr"));

  // Toggle ascendente/descendente se clicar na mesma coluna
  if (sortState.colIndex === colIndex) {
    sortState.ascending = !sortState.ascending;
  } else {
    sortState.colIndex = colIndex;
    sortState.ascending = true;
  }

  linhas.sort((a, b) => {
    let valA, valB;

    // Para coluna de status (5), pegar o valor do select
    if (colIndex === 5) {
      valA = a.cells[colIndex].querySelector("select")?.value || "";
      valB = b.cells[colIndex].querySelector("select")?.value || "";
    } else {
      valA = a.cells[colIndex].textContent.trim();
      valB = b.cells[colIndex].textContent.trim();
    }

    // Tentar comparar como número
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return sortState.ascending ? numA - numB : numB - numA;
    }

    // Comparar como texto
    const cmp = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
    return sortState.ascending ? cmp : -cmp;
  });

  // Re-inserir linhas ordenadas
  linhas.forEach(tr => tbody.appendChild(tr));

  // Atualizar indicador visual nos headers
  atualizarIndicadoresOrdenacao();
}

function atualizarIndicadoresOrdenacao() {
  const headers = document.querySelectorAll("#tabela thead th");
  headers.forEach((th, i) => {
    // Remover indicadores antigos
    const oldIndicator = th.querySelector(".sort-indicator");
    if (oldIndicator) oldIndicator.remove();

    // Adicionar indicador na coluna ativa
    if (i === sortState.colIndex && i < 8) { // não na coluna de ações
      const indicator = document.createElement("span");
      indicator.className = "sort-indicator";
      indicator.innerHTML = sortState.ascending
        ? ' <i class="fa-solid fa-sort-up"></i>'
        : ' <i class="fa-solid fa-sort-down"></i>';
      th.appendChild(indicator);
    }
  });
}

// Adicionar clique nos headers para ordenar
function configurarOrdenacao() {
  const headers = document.querySelectorAll("#tabela thead th");
  headers.forEach((th, i) => {
    if (i < 8) { // Não na coluna de ações
      th.style.cursor = "pointer";
      th.title = "Clique para ordenar";
      th.addEventListener("click", () => ordenarTabela(i));

      // Adicionar ícone de sort genérico
      const sortIcon = document.createElement("span");
      sortIcon.className = "sort-icon";
      sortIcon.innerHTML = ' <i class="fa-solid fa-sort"></i>';
      th.appendChild(sortIcon);
    }
  });
}

// Inicializar ordenação quando a página carregar
window.addEventListener("DOMContentLoaded", configurarOrdenacao);

// ─── SALVAR CONFERÊNCIA NO FIREBASE ───
function prepararDadosSalvar() {
  const rows = [];
  const lojas = new Set();
  const ordens = new Set();

  document.querySelectorAll("#tabela tbody tr").forEach(tr => {
    const cols = tr.querySelectorAll("td");
    const status = tr.cells[5].querySelector("select")?.value || "-";
    const loja = cols[6].textContent.trim();
    const ordem = cols[7].textContent.trim();
    if (loja) lojas.add(loja);
    if (ordem) ordens.add(ordem);
    rows.push({
      codigo: cols[0].textContent.trim(),
      produto: cols[1].textContent.trim(),
      editora: cols[2].textContent.trim(),
      qtdeEsperada: parseInt(cols[3].textContent) || 0,
      qtdeConferida: parseInt(cols[4].textContent) || 0,
      status: status,
      loja: loja,
      ordemCompra: ordem
    });
  });

  const totalEsperado = rows.reduce((s, r) => s + r.qtdeEsperada, 0);
  const totalConferido = rows.reduce((s, r) => s + r.qtdeConferida, 0);
  const pendentes = rows.filter(r => r.status === "-").length;
  const divergentes = rows.filter(r => r.status === "Superior" || r.status === "Faltando").length;
  let statusGeral = "Completo";
  if (pendentes > 0) statusGeral = "Parcial";
  else if (divergentes > 0) statusGeral = "Com Divergência";

  const listaOrdens = [...ordens].filter(Boolean);
  return {
    ordemCompra: listaOrdens[0] || "Sem Ordem",
    todasOrdens: listaOrdens,
    lojas: [...lojas].filter(Boolean),
    totalItens: rows.length,
    totalEsperado,
    totalConferido,
    statusGeral,
    itens: rows
  };
}

function salvarConferencia() {
  const dados = prepararDadosSalvar();
  if (dados.totalItens === 0) {
    mostrarFeedback("Não há itens para salvar.", "warning");
    return;
  }
  document.getElementById("modalOrdem").textContent = dados.todasOrdens.join(", ") || "Sem Ordem";
  document.getElementById("modalLojas").textContent = dados.lojas.join(", ") || "Sem Loja";
  document.getElementById("modalTotal").textContent = dados.totalItens;
  document.getElementById("modalEsperado").textContent = dados.totalEsperado;
  document.getElementById("modalConferido").textContent = dados.totalConferido;
  const statusEl = document.getElementById("modalStatus");
  statusEl.textContent = dados.statusGeral;
  statusEl.className = "fw-bold " + (dados.statusGeral === "Completo" ? "text-success" : dados.statusGeral === "Parcial" ? "text-warning" : "text-danger");
  window._dadosSalvar = dados;
  const modal = new bootstrap.Modal(document.getElementById("modalSalvar"));
  modal.show();
}

async function confirmarSalvar() {
  const dados = window._dadosSalvar;
  if (!dados) return;
  const btn = document.getElementById("btnConfirmarSalvar");
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Salvando...';
  try {
    const resultado = await DB.salvarConferencia(dados);
    bootstrap.Modal.getInstance(document.getElementById("modalSalvar")).hide();
    if (resultado.sucesso) {
      mostrarFeedback("✓ Conferência salva com sucesso no Firebase!", "success");
    } else {
      mostrarFeedback("Erro ao salvar: " + resultado.erro, "danger");
    }
  } catch (e) {
    mostrarFeedback("Erro inesperado: " + e.message, "danger");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check me-1"></i>Confirmar e Salvar';
  }
}
