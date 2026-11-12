/*
 * Página inicial: resumo do último fechamento e cheques que já deveriam
 * ter sido depositados.
 */

function mostrarUltimoFechamento() {
    const ultimo = lerFechamentos()[0];
    if (!ultimo) return;

    document.getElementById('homePrevFora').textContent  = formatarMoeda(ultimo.totalFora);
    document.getElementById('homePrevCofre').textContent = formatarMoeda(ultimo.saldoCofre);
    document.getElementById('homeUltimaData').textContent =
        formatarData(ultimo.data) + (ultimo.savedAt ? `  •  ${ultimo.savedAt}` : '');
}

function mostrarChequesPendentes() {
    const hoje = dataHojeISO();
    const container = document.getElementById('chequesAlerta');

    // Datas em AAAA-MM-DD podem ser comparadas direto como texto
    const pendentes = lerCheques().filter(function (cheque) {
        return !cheque.depositado && cheque.dataDesconto <= hoje;
    });

    if (pendentes.length === 0) {
        container.innerHTML = '<div class="empty-msg">Nenhum cheque pendente para hoje ou em atraso.</div>';
        return;
    }

    container.innerHTML = pendentes.map(function (cheque) {
        const ehHoje = cheque.dataDesconto === hoje;

        return `
            <div class="cheque-card ${ehHoje ? 'hoje' : ''}">
                <div class="cheque-info">
                    <span class="cheque-emitente">${escaparHtml(cheque.emitente)}</span>
                    <span class="cheque-detalhe">
                        Cheque Nº ${escaparHtml(cheque.numeroCheque)}  •
                        Agência: ${escaparHtml(cheque.agencia)}  •
                        Desconto: ${formatarData(cheque.dataDesconto)}
                    </span>
                </div>
                <div class="cheque-lateral">
                    <span class="badge ${ehHoje ? 'badge-hoje' : 'badge-atraso'}">${ehHoje ? 'Hoje' : 'Em atraso'}</span>
                    <span class="cheque-valor">${formatarMoeda(cheque.valor)}</span>
                </div>
            </div>`;
    }).join('');
}

if (exigirSessao()) {
    mostrarUltimoFechamento();
    mostrarChequesPendentes();
}
