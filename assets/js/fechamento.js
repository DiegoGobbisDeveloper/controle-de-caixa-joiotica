/*
 * Fechamento de caixa diário.
 *
 * São dois caixas:
 *  - Caixa de fora: saídas do dia. Todo valor retirado daqui vai para o cofre.
 *  - Cofre: começa com o saldo do último fechamento e recebe as entradas e
 *    saídas lançadas manualmente.
 *
 * Os totais são sempre recalculados a partir da lista de lançamentos, assim
 * não existe risco de o número na tela ficar diferente do que foi lançado.
 */

const LIMITE_HISTORICO = 30;

const estado = {
    anteriorFora:  0,
    anteriorCofre: 0,
    fora:  [],  // { id, descricao, valor }
    cofre: [],  // { id, descricao, valor } — valor negativo é saída
};

let proximoId = 1;

// ------------------------------------------------------------
// Cálculos
// ------------------------------------------------------------

function somar(lancamentos) {
    return lancamentos.reduce(function (total, item) { return total + item.valor; }, 0);
}

function totalFora() {
    return somar(estado.fora);
}

function saldoCofre() {
    return estado.anteriorCofre + totalFora() + somar(estado.cofre);
}

/** Texto usado no histórico e no relatório impresso. */
function descreverLancamento(item) {
    const tipo = item.valor < 0 ? 'saída' : 'entrada';
    return `${item.descricao}: ${formatarMoeda(Math.abs(item.valor))} (${tipo})`;
}

// ------------------------------------------------------------
// Tela
// ------------------------------------------------------------

function renderizarLista(idLista, lancamentos) {
    document.getElementById(idLista).innerHTML = lancamentos.map(function (item) {
        const classe = item.valor < 0 ? 'valor-saida' : 'valor-entrada';
        return `
            <li>
                <span>
                    <strong>${escaparHtml(item.descricao)}</strong>:
                    <span class="${classe}">${formatarMoeda(item.valor)}</span>
                </span>
                <button type="button" class="btn-remove-item no-print" data-id="${item.id}" title="Remover">✕</button>
            </li>`;
    }).join('');
}

function atualizarTela() {
    const saldo = saldoCofre();

    document.getElementById('prevFora').textContent          = formatarMoeda(estado.anteriorFora);
    document.getElementById('prevCofre').textContent         = formatarMoeda(estado.anteriorCofre);
    document.getElementById('totalRetiradoFora').textContent = formatarMoeda(totalFora());
    document.getElementById('saldoCofre').textContent        = formatarMoeda(saldo);

    const caixaSaldo = document.getElementById('caixaSaldoCofre');
    caixaSaldo.classList.toggle('saldo-positivo', saldo > 0);
    caixaSaldo.classList.toggle('saldo-negativo', saldo < 0);

    renderizarLista('listaReferenciasFora',  estado.fora);
    renderizarLista('listaReferenciasCofre', estado.cofre);
}

function renderizarHistorico() {
    const fechamentos = lerFechamentos();
    const container = document.getElementById('historicoLista');

    if (fechamentos.length === 0) {
        container.innerHTML = '<p class="historico-vazio">Nenhuma sessão salva ainda.</p>';
        return;
    }

    const listarItens = function (itens) {
        if (!itens || itens.length === 0) return '<li>—</li>';
        return itens.map(function (texto) { return `<li>${escaparHtml(texto)}</li>`; }).join('');
    };

    container.innerHTML = fechamentos.map(function (sessao) {
        return `
            <details class="hist-entry">
                <summary>
                    <div class="hist-entry-header">
                        <strong>📅 ${formatarData(sessao.data)}</strong>
                        <span class="hist-salvo-em">Salvo: ${escaparHtml(sessao.savedAt || '')}</span>
                    </div>
                    <div class="hist-entry-vals">
                        <span>Total Fora: <strong>${formatarMoeda(sessao.totalFora)}</strong></span>
                        <span>Saldo Cofre: <strong>${formatarMoeda(sessao.saldoCofre)}</strong></span>
                        <span class="hist-detail-toggle no-print">🔍 Detalhes</span>
                    </div>
                </summary>
                <div class="hist-detalhe">
                    <em>Saídas (Fora):</em>
                    <ul>${listarItens(sessao.itensFora)}</ul>
                    <em>Cofre:</em>
                    <ul>${listarItens(sessao.itensCofre)}</ul>
                </div>
            </details>`;
    }).join('');
}

// ------------------------------------------------------------
// Ações
// ------------------------------------------------------------

/** Lê descrição e valor do formulário. Retorna null se algo estiver errado. */
function lerFormulario(idDescricao, idValor) {
    const descricao = document.getElementById(idDescricao).value.trim();
    const valor = parseFloat(document.getElementById(idValor).value);

    if (!descricao) {
        alert('Preencha a descrição.');
        return null;
    }
    if (Number.isNaN(valor) || valor <= 0) {
        alert('Valor inválido. Use apenas números positivos.');
        return null;
    }

    document.getElementById(idDescricao).value = '';
    document.getElementById(idValor).value = '';
    document.getElementById(idDescricao).focus();
    return { id: proximoId++, descricao: descricao, valor: valor };
}

function lancarFora(evento) {
    evento.preventDefault();
    const lancamento = lerFormulario('referenciaFora', 'valorFora');
    if (!lancamento) return;

    estado.fora.push(lancamento);
    atualizarTela();
}

function lancarCofre(evento) {
    evento.preventDefault();
    const ehSaida = document.getElementById('tipoOperacao').value === 'subtrair';
    const lancamento = lerFormulario('referenciaCofre', 'valorCofre');
    if (!lancamento) return;

    if (ehSaida) lancamento.valor = -lancamento.valor;
    estado.cofre.push(lancamento);
    atualizarTela();
}

/** Remoção pelos botões ✕ das duas listas (delegação de evento). */
function removerLancamento(evento, lista) {
    const botao = evento.target.closest('.btn-remove-item');
    if (!botao || !confirm('Remover este lançamento?')) return;

    const id = Number(botao.dataset.id);
    estado[lista] = estado[lista].filter(function (item) { return item.id !== id; });
    atualizarTela();
}

function salvarFechamento() {
    const novaSessao = {
        data:       document.getElementById('dataAtual').value,
        totalFora:  totalFora().toFixed(2),
        saldoCofre: saldoCofre().toFixed(2),
        itensFora:  estado.fora.map(descreverLancamento),
        itensCofre: estado.cofre.map(descreverLancamento),
        savedAt:    new Date().toLocaleString('pt-BR'),
    };

    salvarFechamentos([novaSessao, ...lerFechamentos()].slice(0, LIMITE_HISTORICO));
    renderizarHistorico();
    alert('Fechamento salvo com sucesso!');
}

function limparTudo() {
    if (!confirm('Isso apagará todos os lançamentos e o histórico completo. Confirmar?')) return;

    estado.anteriorFora  = 0;
    estado.anteriorCofre = 0;
    estado.fora  = [];
    estado.cofre = [];

    salvarFechamentos([]);
    atualizarTela();
    renderizarHistorico();
}

function imprimirRelatorio() {
    const listarItens = function (itens) {
        if (itens.length === 0) return '<li>Sem registros</li>';
        return itens.map(function (item) { return `<li>${escaparHtml(descreverLancamento(item))}</li>`; }).join('');
    };

    const janela = window.open('', '', 'height=700,width=620');
    if (!janela) {
        alert('O navegador bloqueou a janela de impressão. Libere os pop-ups para este site.');
        return;
    }

    janela.document.write(`
        <html><head><title>Relatório de Caixa</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
            h2 { text-align: center; }
            h3 { border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 20px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 4px; font-size: 14px; }
            .total { font-size: 16px; font-weight: bold; margin-top: 10px; }
            .assinatura { text-align: center; margin-top: 40px; }
        </style></head><body>
            <h2>Relatório de Caixa</h2>
            <p><strong>Data:</strong> ${formatarData(document.getElementById('dataAtual').value)}</p>
            <p><strong>Anterior Cofre:</strong> ${formatarMoeda(estado.anteriorCofre)}</p>
            <h3>Caixa de Fora (Saídas)</h3>
            <ul>${listarItens(estado.fora)}</ul>
            <p class="total">Total Saídas: ${formatarMoeda(totalFora())}</p>
            <h3>Caixa Interno (Cofre)</h3>
            <ul>${listarItens(estado.cofre)}</ul>
            <p class="total">Saldo Final Cofre: ${formatarMoeda(saldoCofre())}</p>
            <div class="assinatura">_____________________________<br>Assinatura Responsável</div>
        </body></html>
    `);
    janela.document.close();
    janela.print();
}

// ------------------------------------------------------------
// Inicialização
// ------------------------------------------------------------

function iniciarFechamento() {
    const ultimo = lerFechamentos()[0];
    estado.anteriorFora  = ultimo ? paraNumero(ultimo.totalFora)  : 0;
    estado.anteriorCofre = ultimo ? paraNumero(ultimo.saldoCofre) : 0;

    document.getElementById('dataAtual').value = dataHojeISO();

    document.getElementById('formFora').addEventListener('submit', lancarFora);
    document.getElementById('formCofre').addEventListener('submit', lancarCofre);
    document.getElementById('listaReferenciasFora').addEventListener('click', function (e) { removerLancamento(e, 'fora'); });
    document.getElementById('listaReferenciasCofre').addEventListener('click', function (e) { removerLancamento(e, 'cofre'); });
    document.getElementById('btnSalvar').addEventListener('click', salvarFechamento);
    document.getElementById('btnImprimir').addEventListener('click', imprimirRelatorio);
    document.getElementById('btnLimpar').addEventListener('click', limparTudo);
    document.getElementById('btnHistorico').addEventListener('click', function () {
        const painel = document.getElementById('historicoPanel');
        painel.hidden = !painel.hidden;
    });

    atualizarTela();
    renderizarHistorico();
}

if (exigirSessao()) iniciarFechamento();
