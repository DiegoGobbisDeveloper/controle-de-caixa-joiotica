/*
 * Controle de cheques pré-datados.
 *
 * A lista em memória é a fonte da verdade: toda alteração mexe nela, grava
 * no localStorage e redesenha a tabela. A tabela fica sempre ordenada pela
 * data de desconto, com os vencimentos mais próximos no topo.
 */

const CAMPOS = ['emitente', 'numeroCheque', 'agencia', 'dataEntrega', 'dataDesconto', 'valor'];

let cheques = [];
let idEmEdicao = null;
let proximoId = 1;

// ------------------------------------------------------------
// Dados
// ------------------------------------------------------------

function persistir() {
    // O id só existe em memória, para localizar a linha clicada
    salvarCheques(cheques.map(function (cheque) {
        const { id, ...dados } = cheque;
        return dados;
    }));
}

function ordenarPorDesconto() {
    cheques.sort(function (a, b) { return a.dataDesconto.localeCompare(b.dataDesconto); });
}

function buscarCheque(id) {
    return cheques.find(function (cheque) { return cheque.id === id; });
}

function totalPendente() {
    return cheques
        .filter(function (cheque) { return !cheque.depositado; })
        .reduce(function (total, cheque) { return total + cheque.valor; }, 0);
}

// ------------------------------------------------------------
// Tela
// ------------------------------------------------------------

function renderizarTabela() {
    document.getElementById('chequeListBody').innerHTML = cheques.map(function (cheque) {
        const classes = [
            cheque.depositado ? 'linha-depositada' : '',
            cheque.id === idEmEdicao ? 'linha-editando' : '',
        ].join(' ');

        return `
            <tr class="${classes}" data-id="${cheque.id}">
                <td class="td-depositado">
                    <button type="button" data-acao="depositar"
                            class="btn-depositar ${cheque.depositado ? 'btn-depositado' : ''}"
                            title="${cheque.depositado ? 'Clique para desfazer' : 'Marcar como depositado'}">
                        ${cheque.depositado ? '✔ Depositado' : 'Depositar'}
                    </button>
                </td>
                <td>${escaparHtml(cheque.emitente)}</td>
                <td>${escaparHtml(cheque.numeroCheque)}</td>
                <td>${escaparHtml(cheque.agencia)}</td>
                <td>${formatarData(cheque.dataEntrega)}</td>
                <td>${formatarData(cheque.dataDesconto)}</td>
                <td>${formatarMoeda(cheque.valor)}</td>
                <td class="td-acoes">
                    <button type="button" data-acao="editar"  class="btn-editar">✏ Editar</button>
                    <button type="button" data-acao="deletar" class="btn-deletar">✕ Deletar</button>
                </td>
            </tr>`;
    }).join('');

    document.getElementById('total').textContent = formatarMoeda(totalPendente());
}

function atualizar() {
    ordenarPorDesconto();
    persistir();
    renderizarTabela();
}

/** Alterna o formulário entre "cadastrar" e "editar". */
function definirModoEdicao(id) {
    idEmEdicao = id;
    const editando = id !== null;

    document.getElementById('btnCadastrar').textContent = editando ? 'Salvar Alterações' : 'Cadastrar Cheque';
    document.getElementById('btnCancelarEdicao').hidden = !editando;

    if (!editando) document.getElementById('chequeForm').reset();
    renderizarTabela();
}

// ------------------------------------------------------------
// Ações
// ------------------------------------------------------------

function enviarFormulario(evento) {
    evento.preventDefault();

    // Campos obrigatórios e valor mínimo já são validados pelo próprio HTML
    const dados = {};
    CAMPOS.forEach(function (campo) {
        dados[campo] = document.getElementById(campo).value.trim();
    });
    dados.valor = parseFloat(dados.valor);

    if (idEmEdicao !== null) {
        Object.assign(buscarCheque(idEmEdicao), dados);
    } else {
        cheques.push({ id: proximoId++, ...dados, depositado: false });
    }

    definirModoEdicao(null);
    atualizar();
    document.getElementById('emitente').focus();
}

function editarCheque(cheque) {
    CAMPOS.forEach(function (campo) {
        document.getElementById(campo).value = campo === 'valor' ? cheque.valor.toFixed(2) : cheque[campo];
    });
    definirModoEdicao(cheque.id);
    document.getElementById('emitente').focus();
}

function deletarCheque(cheque) {
    if (!confirm('Remover este cheque?')) return;

    cheques = cheques.filter(function (item) { return item !== cheque; });
    if (cheque.id === idEmEdicao) definirModoEdicao(null);
    atualizar();
}

/** Trata os botões de cada linha numa única escuta na tabela. */
function tratarCliqueNaTabela(evento) {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;

    const cheque = buscarCheque(Number(botao.closest('tr').dataset.id));

    if (botao.dataset.acao === 'depositar') {
        cheque.depositado = !cheque.depositado;
        atualizar();
    } else if (botao.dataset.acao === 'editar') {
        editarCheque(cheque);
    } else if (botao.dataset.acao === 'deletar') {
        deletarCheque(cheque);
    }
}

function salvarComoPDF() {
    // A biblioteca vem de CDN, então depende de internet
    if (!window.jspdf) {
        alert('Não foi possível carregar o gerador de PDF. Verifique a conexão com a internet.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const documento = new jsPDF();

    const linhas = cheques.map(function (cheque) {
        return [
            cheque.emitente,
            cheque.numeroCheque,
            cheque.agencia,
            formatarData(cheque.dataEntrega),
            formatarData(cheque.dataDesconto),
            formatarMoeda(cheque.valor),
            cheque.depositado ? 'Depositado' : 'Pendente',
        ];
    });

    documento.setFontSize(16);
    documento.text('Planilha de Cheques Pré-Datados', 10, 14);
    documento.autoTable({
        head: [['Emitente', 'Nº Cheque', 'Agência', 'Entrega', 'Desconto', 'Valor', 'Status']],
        body: linhas,
        startY: 22,
        theme: 'grid',
    });
    documento.setFontSize(12);
    documento.text(`Total Pendente: ${formatarMoeda(totalPendente())}`, 10, documento.lastAutoTable.finalY + 10);
    documento.save('cheques_pre_datados.pdf');
}

// ------------------------------------------------------------
// Inicialização
// ------------------------------------------------------------

function iniciarCheques() {
    cheques = lerCheques().map(function (cheque) {
        return { id: proximoId++, ...cheque };
    });
    ordenarPorDesconto();
    renderizarTabela();

    document.getElementById('chequeForm').addEventListener('submit', enviarFormulario);
    document.getElementById('btnCancelarEdicao').addEventListener('click', function () { definirModoEdicao(null); });
    document.getElementById('chequeListBody').addEventListener('click', tratarCliqueNaTabela);
    document.getElementById('btnSalvarPdf').addEventListener('click', salvarComoPDF);
}

if (exigirSessao()) iniciarCheques();
