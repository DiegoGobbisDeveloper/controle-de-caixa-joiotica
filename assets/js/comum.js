/*
 * Funções compartilhadas por todas as páginas.
 *
 * Os dados ficam no localStorage do navegador e a sessão do usuário logado
 * no sessionStorage, que some quando o navegador é fechado.
 * As chaves são as mesmas desde a primeira versão, então nada do que o
 * cliente já cadastrou se perde.
 */

const CHAVES = {
    usuarios: 'jt_usuarios',
    sessao:   'jt_sessao',
    caixa:    'jt_caixa',
    cheques:  'jt_cheques',
};

// ------------------------------------------------------------
// Armazenamento
// ------------------------------------------------------------

function lerJSON(armazenamento, chave, valorPadrao) {
    try {
        const bruto = armazenamento.getItem(chave);
        return bruto ? JSON.parse(bruto) : valorPadrao;
    } catch {
        // JSON corrompido não pode derrubar a página inteira
        return valorPadrao;
    }
}

function lerDados(chave, valorPadrao) {
    return lerJSON(localStorage, chave, valorPadrao);
}

function salvarDados(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

function lerFechamentos() {
    return lerDados(CHAVES.caixa, {}).sessions || [];
}

function salvarFechamentos(fechamentos) {
    salvarDados(CHAVES.caixa, { sessions: fechamentos });
}

function lerCheques() {
    return lerDados(CHAVES.cheques, []).map(function (cheque) {
        return {
            emitente:     cheque.emitente,
            numeroCheque: cheque.numeroCheque,
            agencia:      cheque.agencia,
            dataEntrega:  cheque.dataEntrega,
            dataDesconto: cheque.dataDesconto,
            valor:        paraNumero(cheque.valor),
            // Versões antigas gravavam o booleano como texto
            depositado:   cheque.depositado === true || cheque.depositado === 'true',
        };
    });
}

function salvarCheques(cheques) {
    salvarDados(CHAVES.cheques, cheques);
}

// ------------------------------------------------------------
// Sessão
// ------------------------------------------------------------

function obterSessao() {
    return lerJSON(sessionStorage, CHAVES.sessao, null);
}

function iniciarSessao(usuario) {
    sessionStorage.setItem(CHAVES.sessao, JSON.stringify({ usuario: usuario }));
}

function encerrarSessao() {
    sessionStorage.removeItem(CHAVES.sessao);
}

/**
 * Manda para o login quem tentar abrir uma página sem estar logado.
 * Usa window.top porque as páginas internas rodam dentro do iframe do dashboard.
 */
function exigirSessao() {
    if (obterSessao()) return true;
    window.top.location.href = 'index.html';
    return false;
}

// ------------------------------------------------------------
// Formatação
// ------------------------------------------------------------

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatarMoeda(valor) {
    return formatadorMoeda.format(paraNumero(valor));
}

/** Aceita número ou texto nos formatos "150.00" e "150,00", usados pelas versões antigas. */
function paraNumero(valor) {
    if (typeof valor === 'number') return valor;
    const numero = parseFloat(String(valor ?? '').replace(',', '.'));
    return Number.isNaN(numero) ? 0 : numero;
}

/** "2026-11-11" → "11/11/2026" */
function formatarData(dataISO) {
    if (!dataISO) return '—';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

/**
 * Data de hoje no fuso do computador, no formato AAAA-MM-DD.
 * toISOString() não serve aqui: ele usa UTC e, depois das 21h no Brasil,
 * já devolve o dia seguinte.
 */
function dataHojeISO() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${hoje.getFullYear()}-${mes}-${dia}`;
}

/** Evita que um texto digitado pelo usuário seja interpretado como HTML. */
function escaparHtml(texto) {
    return String(texto ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
