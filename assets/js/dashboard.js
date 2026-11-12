/*
 * Layout principal: menu lateral e área onde cada módulo é carregado
 * dentro de um iframe.
 */

const PAGINAS = {
    inicio:     'inicio.html',
    fechamento: 'fechamento-caixa.html',
    cheques:    'cheques.html',
};

function abrirPagina(itemMenu) {
    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.classList.toggle('active', item === itemMenu);
    });
    document.getElementById('pageTitle').textContent = itemMenu.querySelector('.nav-label').textContent;
    document.getElementById('pageFrame').src = PAGINAS[itemMenu.dataset.pagina];
}

function iniciarDashboard() {
    document.getElementById('nomeUsuario').textContent = obterSessao().usuario;

    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.addEventListener('click', function (evento) {
            evento.preventDefault();
            abrirPagina(item);
        });
    });

    document.getElementById('toggleSidebar').addEventListener('click', function () {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });

    document.getElementById('btnSair').addEventListener('click', function () {
        encerrarSessao();
        window.location.href = 'index.html';
    });

    abrirPagina(document.querySelector('.nav-item.active'));
}

if (exigirSessao()) iniciarDashboard();
