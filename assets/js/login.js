/*
 * Tela de acesso: login e cadastro de usuários.
 *
 * As contas ficam no próprio navegador. A senha nunca é gravada em texto puro,
 * só o hash SHA-256 dela. Contas criadas antes dessa mudança são convertidas
 * automaticamente no primeiro login.
 */

const TAMANHO_MINIMO_SENHA = 4;

// Quem já está logado vai direto para o sistema
if (obterSessao()) {
    window.location.href = 'dashboard.html';
}

function lerUsuarios() {
    return lerDados(CHAVES.usuarios, []);
}

function salvarUsuarios(usuarios) {
    salvarDados(CHAVES.usuarios, usuarios);
}

/** O nome do usuário entra no hash para que senhas iguais não gerem o mesmo resultado. */
async function gerarHashSenha(usuario, senha) {
    const bytes = new TextEncoder().encode(`${usuario}:${senha}`);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), function (byte) {
        return byte.toString(16).padStart(2, '0');
    }).join('');
}

function mostrarMensagem(idElemento, texto, tipo) {
    const elemento = document.getElementById(idElemento);
    elemento.textContent = texto;
    elemento.className = `msg ${tipo}`;
}

function limparMensagens() {
    document.querySelectorAll('.msg').forEach(function (elemento) {
        elemento.className = 'msg';
    });
}

function mostrarAba(aba) {
    document.querySelectorAll('[data-aba]').forEach(function (botao) {
        botao.classList.toggle('active', botao.dataset.aba === aba);
    });
    document.getElementById('form-login').hidden    = aba !== 'login';
    document.getElementById('form-registro').hidden = aba !== 'registro';
    limparMensagens();
}

async function fazerLogin(evento) {
    evento.preventDefault();

    const usuario = document.getElementById('login-usuario').value.trim();
    const senha   = document.getElementById('login-senha').value;

    if (!usuario || !senha) {
        mostrarMensagem('msg-login', 'Preencha usuário e senha.', 'erro');
        return;
    }

    const usuarios = lerUsuarios();
    const conta = usuarios.find(function (u) { return u.usuario === usuario; });
    const hash = await gerarHashSenha(usuario, senha);

    let senhaConfere = false;

    if (conta && conta.senhaHash) {
        senhaConfere = conta.senhaHash === hash;
    } else if (conta && conta.senha === senha) {
        // Conta antiga com senha em texto puro: troca pelo hash e apaga a original
        senhaConfere = true;
        conta.senhaHash = hash;
        delete conta.senha;
        salvarUsuarios(usuarios);
    }

    if (!senhaConfere) {
        mostrarMensagem('msg-login', 'Usuário ou senha incorretos.', 'erro');
        return;
    }

    iniciarSessao(usuario);
    window.location.href = 'dashboard.html';
}

async function fazerRegistro(evento) {
    evento.preventDefault();

    const formulario = evento.target;
    const usuario  = document.getElementById('reg-usuario').value.trim();
    const senha    = document.getElementById('reg-senha').value;
    const confirma = document.getElementById('reg-confirma').value;

    if (!usuario || !senha || !confirma) {
        mostrarMensagem('msg-registro', 'Preencha todos os campos.', 'erro');
        return;
    }
    if (senha !== confirma) {
        mostrarMensagem('msg-registro', 'As senhas não coincidem.', 'erro');
        return;
    }
    if (senha.length < TAMANHO_MINIMO_SENHA) {
        mostrarMensagem('msg-registro', `A senha deve ter no mínimo ${TAMANHO_MINIMO_SENHA} caracteres.`, 'erro');
        return;
    }

    const usuarios = lerUsuarios();
    if (usuarios.some(function (u) { return u.usuario === usuario; })) {
        mostrarMensagem('msg-registro', 'Esse usuário já está cadastrado.', 'erro');
        return;
    }

    usuarios.push({ usuario: usuario, senhaHash: await gerarHashSenha(usuario, senha) });
    salvarUsuarios(usuarios);

    formulario.reset();
    mostrarMensagem('msg-registro', 'Conta criada! Faça login para continuar.', 'sucesso');
    setTimeout(function () { mostrarAba('login'); }, 1500);
}

document.querySelectorAll('[data-aba]').forEach(function (botao) {
    botao.addEventListener('click', function () { mostrarAba(botao.dataset.aba); });
});
document.getElementById('form-login').addEventListener('submit', fazerLogin);
document.getElementById('form-registro').addEventListener('submit', fazerRegistro);
