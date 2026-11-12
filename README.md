# Sistema de Controle de Caixa

## O problema

Ser desenvolvedor é resolver problemas reais. Desenvolvi um mini sistema web de fechamento de caixa para a empresa onde trabalho, substituindo um processo antigo que apresentava muitos erros e inconsistências. Aquela solução facilitou o controle do caixa interno e das saídas externas, com autenticação por usuário, histórico de sessões e geração de relatórios para impressão.

Com o uso, surgiu uma nova necessidade: o controle de cheques pré-datados ainda era feito em uma planilha mal organizada, causando erros nos valores e perda de datas de depósito. Fui solicitado a resolver esse problema também. Em vez de criar algo separado, evoluí o sistema anterior, integrando o controle de cheques ao fechamento de caixa em uma solução única, mais completa e mais organizada para o fluxo de trabalho da empresa.

## O que é

Um sistema web de controle financeiro que roda direto no navegador, sem servidor, banco de dados externo ou instalação. Ele reúne o fechamento de caixa diário, o controle de cheques pré-datados e os alertas de depósito em uma interface com login por usuário.

| Tecnologia | Uso no projeto |
|---|---|
| HTML5 | Estrutura das páginas |
| CSS3 (com variáveis) | Layout, responsividade e paleta de cores única |
| JavaScript (ES6+, sem frameworks) | Regras de negócio e persistência |
| localStorage | Dados de usuários, fechamentos e cheques |
| sessionStorage | Sessão do usuário logado |
| Web Crypto (SHA-256) | Hash das senhas |
| jsPDF + jsPDF-AutoTable | Exportação dos cheques em PDF |

## Estrutura de arquivos

```
├── index.html               Login e cadastro de usuários
├── dashboard.html           Layout com menu lateral; carrega os módulos em um iframe
├── inicio.html              Resumo do último fechamento e cheques a depositar
├── fechamento-caixa.html    Fechamento de caixa diário
├── cheques.html             Controle de cheques pré-datados
└── assets/
    ├── css/
    │   ├── base.css         Reset, paleta de cores e estilos comuns
    │   ├── login.css
    │   ├── dashboard.css
    │   ├── inicio.css
    │   ├── fechamento.css
    │   └── cheques.css
    └── js/
        ├── comum.js         Armazenamento, sessão e formatação usados por todas as páginas
        ├── login.js
        ├── dashboard.js
        ├── inicio.js
        ├── fechamento.js
        └── cheques.js
```

Cada página tem um CSS e um JS com o mesmo nome. Tudo que é usado em mais de um lugar fica em `base.css` e `comum.js`.

## Funcionalidades

### Autenticação

- Cadastro de usuários com confirmação de senha
- Senhas guardadas como hash SHA-256, nunca em texto puro
- Sessão no sessionStorage, encerrada ao fechar o navegador
- Todas as páginas internas exigem login; sem sessão, o usuário volta para a tela de acesso

### Página inicial

- Último total de saídas externas e último saldo do cofre
- Data e hora do último fechamento salvo
- Cheques não depositados com data de desconto até hoje, separando os do dia dos que estão em atraso

### Fechamento de caixa

- Saídas do caixa de fora, com descrição e valor
- Movimentações do cofre, como entrada ou saída
- Remoção de qualquer lançamento, com recálculo dos totais
- Saldo do cofre com cor para positivo e negativo
- Histórico dos últimos 30 fechamentos, com os lançamentos de cada um
- Relatório para impressão com espaço para assinatura

### Cheques pré-datados

- Cadastro com emitente, número, agência, data de entrega, data de desconto e valor
- Tabela sempre ordenada pela data de desconto
- Marcação de depositado (e desfazer, se clicar por engano)
- Edição sem risco de perder o cheque: ele só é alterado quando o usuário salva
- Total pendente, sem contar os já depositados
- Exportação da tabela em PDF

## Como executar

1. Baixe ou clone o repositório
2. Abra o `index.html` no navegador
3. Crie uma conta na aba "Criar Conta" e faça login

Não precisa instalar nada. O sistema funciona offline; só a exportação em PDF precisa de internet, porque a biblioteca é carregada por CDN.

## Decisões técnicas

**Sem servidor:** os dados ficam no localStorage do navegador. Para uso em uma única máquina, isso elimina custo de infraestrutura e funciona sem internet.

**Módulos em iframe:** o dashboard carrega cada módulo em um iframe. O layout não recarrega na navegação e cada página continua funcionando sozinha.

**Estado em memória como fonte da verdade:** fechamento e cheques mantêm os dados em listas JavaScript e redesenham a tela a partir delas. Os totais são sempre recalculados, nunca lidos de volta do HTML.

**Texto do usuário sempre escapado:** tudo que é digitado passa por `escaparHtml` antes de ir para a tela, o que impede que um nome ou descrição quebre a página.

**Compatibilidade com dados antigos:** as chaves do localStorage são as mesmas da primeira versão. Valores gravados em formatos antigos são convertidos na leitura e senhas antigas viram hash no primeiro login.

**Histórico limitado a 30 sessões:** evita que o localStorage cresça sem limite e mantém rastreabilidade suficiente para o dia a dia.

## Limitações conhecidas

- A autenticação protege o uso no dia a dia, mas não é segurança de verdade: quem tem acesso ao navegador consegue ler o localStorage.
- Os dados ficam presos ao navegador e ao computador onde foram cadastrados.
- Lançamentos do fechamento que ainda não foram salvos se perdem ao trocar de página.
"# controle-de-caixa-joiotica" 
