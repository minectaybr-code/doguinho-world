// =====================
// ESTADO DO JOGO
// =====================

const mapa = [
    ["⬜","⬜","🧱","⬜","⬜","⬜"],
    ["🧱","⬜","⬜","⬜","🧱","🧱"],
    ["🧱","⬜","🧱","⬜","⬜","⬜"],
    ["⬜","⬜","🧱","🧱","🧱","⬜"],
    ["⬜","🧱","⬜","⬜","🧱","⬜"],
    ["⬜","🧱","⬜","⬜","⬜","🏁"]
];

let player = {
    x: 5,
    y: 0,
    direcao: "cima"
};

let venceu = false;
let executando = false;
let movimentos = 0;
let funcoesUsuario = {};
let execucaoId = 0;



// ELEMENTOS DA INTERFACE


function elemento(id) {
    return document.getElementById(id);
}

function atualizarStatus(texto, tipo = "") {
    const mensagem = elemento("mensagem");

    if (!mensagem) return;

    mensagem.className = tipo ? `status ${tipo}` : "status";
    mensagem.textContent = texto;
}

function atualizarContador() {
    const contador = elemento("contadorMovimentos");

    if (contador) {
        contador.textContent = `Movimentos: ${movimentos}`;
    }
}

function atualizarComandoAtual(texto = "Nenhum comando rodando.") {
    const comando = elemento("comandoAtual");

    if (comando) {
        comando.textContent = texto;
    }
}

function atualizarBotoes() {
    const btnExecutar = elemento("btnExecutar");
    const btnReiniciar = elemento("btnReiniciar");

    if (btnExecutar) {
        btnExecutar.disabled = executando;
        btnExecutar.textContent = executando
            ? "⏳ Rodando..."
            : "▶ Rodar código";
    }

    if (btnReiniciar) {
        btnReiniciar.disabled = false;
    }
}



// DESENHAR MAPA


function desenhar() {
    const tela = elemento("mapa");

    if (!tela) return;

    tela.innerHTML = "";

    for (let x = 0; x < mapa.length; x++) {
        for (let y = 0; y < mapa[x].length; y++) {
            const bloco = document.createElement("div");
            bloco.className = "celula";

            if (player.x === x && player.y === y) {
                bloco.textContent = "🐶";
                bloco.classList.add("doguinho", `virado-${player.direcao}`);
            } else {
                bloco.textContent = mapa[x][y];

                if (mapa[x][y] === "🧱") {
                    bloco.classList.add("parede");
                }

                if (mapa[x][y] === "🏁") {
                    bloco.classList.add("objetivo");
                }
            }

            tela.appendChild(bloco);
        }
    }
}



// VITÓRIA

function verificarVitoria() {
    if (mapa[player.x][player.y] !== "🏁") {
        return false;
    }

    venceu = true;
    atualizarStatus("Boa! O doguinho chegou na casinha.", "sucesso");
    atualizarComandoAtual("Chegou na casinha!");

    return true;
}

// REINICIAR JOGO

function reiniciar() {
    // Cancela qualquer execução pendente.
    execucaoId++;
    executando = false;

    player.x = 5;
    player.y = 0;
    player.direcao = "cima";

    venceu = false;
    movimentos = 0;
    funcoesUsuario = {};

    atualizarStatus("Fase recomeçada.");
    atualizarComandoAtual("Nenhum comando rodando.");
    atualizarContador();
    atualizarBotoes();
    limparDestaqueEditor();
    desenhar();
}



// MOVIMENTOS


function andar() {
    let novoX = player.x;
    let novoY = player.y;

    if (player.direcao === "cima") novoX--;
    if (player.direcao === "baixo") novoX++;
    if (player.direcao === "esquerda") novoY--;
    if (player.direcao === "direita") novoY++;

    return moverPara(novoX, novoY);
}

function tras() {
    if (player.direcao === "cima") return moverPara(player.x + 1, player.y);
    if (player.direcao === "baixo") return moverPara(player.x - 1, player.y);
    if (player.direcao === "esquerda") return moverPara(player.x, player.y + 1);
    return moverPara(player.x, player.y - 1);
}

// O virar() agora gira o doguinho apenas 90 graus no sentido horário
function virar() {
    const direcoes = ["cima", "direita", "baixo", "esquerda"];
    let atual = direcoes.indexOf(player.direcao);

    atual = (atual + 1) % direcoes.length;

    player.direcao = direcoes[atual];

    desenhar();

    return true;
}

function moverPara(x, y) {
    if (
        x < 0 ||
        y < 0 ||
        x >= mapa.length ||
        y >= mapa[0].length
    ) {
        atualizarStatus("Opa. Daqui o doguinho não passa.", "erro");
        return false;
    }

    if (mapa[x][y] === "🧱") {
        atualizarStatus("Ih, bateu na parede.", "erro");
        return false;
    }

    player.x = x;
    player.y = y;
    movimentos++;

    atualizarContador();
    desenhar();

    return !verificarVitoria();
}



// INTERPRETADOR PYTHON 

// O interpretador trabalha com uma pequena árvore de comandos.
// Ele suporta:
//   andar(), tras(), virar()
//   if caminho_livre():
//   else:
//   for i in range(n):
//   def nome():
//   nome()
//   # comentários

function removerComentario(linha) {
    const posicao = linha.indexOf("#");
    return posicao === -1 ? linha : linha.substring(0, posicao);
}

function obterIndentacao(linha) {
    let nivel = 0;

    for (const caractere of linha) {
        if (caractere === " ") {
            nivel++;
        } else if (caractere === "\t") {
            nivel += 4;
        } else {
            break;
        }
    }

    return nivel;
}

function linhaVazia(linha) {
    return removerComentario(linha).trim() === "";
}

function tokenizarCodigo(linhas) {
    const tokens = [];

    for (let i = 0; i < linhas.length; i++) {
        const original = linhas[i];
        const semComentario = removerComentario(original);

        if (semComentario.trim() === "") continue;

        tokens.push({
            linha: i + 1,
            texto: semComentario.trim(),
            indentacao: obterIndentacao(original)
        });
    }

    return tokens;
}

function erroSintaxe(linha, mensagem) {
    return {
        erro: `Linha ${linha}: ${mensagem}`
    };
}

function analisarBloco(tokens, inicio, indentacaoEsperada) {
    const comandos = [];
    let i = inicio;

    while (i < tokens.length) {
        const token = tokens[i];

        if (token.indentacao < indentacaoEsperada) {
            break;
        }

        if (token.indentacao > indentacaoEsperada) {
            return {
                erro: `Linha ${token.linha}: essa indentação não bate com o bloco acima.`
            };
        }

        const texto = token.texto;

        
        // DEF
        
        if (texto.startsWith("def ")) {
            const match = texto.match(/^def\s+([a-zA-Z_]\w*)\(\):$/);

            if (!match) {
                return erroSintaxe(
                    token.linha,
                    "essa função não está no formato certo. Tente: def nome():"
                );
            }

            const nome = match[1];

            if (funcoesUsuario[nome]) {
                return erroSintaxe(
                    token.linha,
                    `a função "${nome}" já foi criada.`
                );
            }

            if (i + 1 >= tokens.length || tokens[i + 1].indentacao <= indentacaoEsperada) {
                return erroSintaxe(
                    token.linha,
                    `a função "${nome}" precisa ter código dentro dela.`
                );
            }

            const bloco = analisarBloco(
                tokens,
                i + 1,
                tokens[i + 1].indentacao
            );

            if (bloco.erro) return bloco;

            funcoesUsuario[nome] = bloco.comandos;
            i = bloco.proximo;

            continue;
        }

        
        // FOR
        
        if (texto.startsWith("for ")) {
            const match = texto.match(
                /^for\s+([a-zA-Z_]\w*)\s+in\s+range\(\s*(\d+)\s*\):$/
            );

            if (!match) {
                return erroSintaxe(
                    token.linha,
                    "esse for não está no formato certo. Tente: for i in range(n):"
                );
            }

            const quantidade = Number(match[2]);

            if (quantidade > 100) {
                return erroSintaxe(
                    token.linha,
                    "o máximo permitido é range(100)."
                );
            }

            if (i + 1 >= tokens.length || tokens[i + 1].indentacao <= indentacaoEsperada) {
                return erroSintaxe(
                    token.linha,
                    "depois do for precisa ter um bloco indentado."
                );
            }

            const bloco = analisarBloco(
                tokens,
                i + 1,
                tokens[i + 1].indentacao
            );

            if (bloco.erro) return bloco;

            comandos.push({
                tipo: "for",
                quantidade,
                corpo: bloco.comandos,
                linha: token.linha
            });

            i = bloco.proximo;
            continue;
        }

       
        // IF
        
        if (texto.startsWith("if ")) {
            const match = texto.match(/^if\s+(.+):$/);

            if (!match) {
                return erroSintaxe(
                    token.linha,
                    "esse if não está no formato certo. Tente: if caminho_livre():"
                );
            }

            const condicao = match[1];

            if (condicao !== "caminho_livre()") {
                return erroSintaxe(
                    token.linha,
                    `não conheço essa condição ainda: "${condicao}".`
                );
            }

            if (i + 1 >= tokens.length || tokens[i + 1].indentacao <= indentacaoEsperada) {
                return erroSintaxe(
                    token.linha,
                    "depois do if precisa ter um bloco indentado."
                );
            }

            const blocoIf = analisarBloco(
                tokens,
                i + 1,
                tokens[i + 1].indentacao
            );

            if (blocoIf.erro) return blocoIf;

            i = blocoIf.proximo;

            let blocoElse = [];

            // ELSE precisa estar no mesmo nível do IF.
            if (
                i < tokens.length &&
                tokens[i].indentacao === indentacaoEsperada &&
                tokens[i].texto === "else:"
            ) {
                if (i + 1 >= tokens.length || tokens[i + 1].indentacao <= indentacaoEsperada) {
                    return erroSintaxe(
                        tokens[i].linha,
                        "depois do else precisa ter um bloco indentado."
                    );
                }

                const resultadoElse = analisarBloco(
                    tokens,
                    i + 1,
                    tokens[i + 1].indentacao
                );

                if (resultadoElse.erro) return resultadoElse;

                blocoElse = resultadoElse.comandos;
                i = resultadoElse.proximo;
            }

            comandos.push({
                tipo: "if",
                condicao,
                corpo: blocoIf.comandos,
                senao: blocoElse,
                linha: token.linha
            });

            continue;
        }

        // ---------------------
        // ELSE FORA DE UM IF
        // ---------------------
        if (texto === "else:") {
            return erroSintaxe(
                token.linha,
                "esse else precisa vir depois de um if."
            );
        }

        // ---------------------
        // COMANDO NORMAL
        // ---------------------
        if (!/^[a-zA-Z_]\w*\(\)$/.test(texto)) {
            return erroSintaxe(
                token.linha,
                `comando inválido: "${texto}".`
            );
        }

        comandos.push({
            tipo: "comando",
            nome: texto,
            linha: token.linha
        });

        i++;
    }

    return {
        comandos,
        proximo: i
    };
}

function interpretar(linhas) {
    funcoesUsuario = {};

    const tokens = tokenizarCodigo(linhas);

    if (tokens.length === 0) {
        return [];
    }

    const resultado = analisarBloco(tokens, 0, tokens[0].indentacao);

    if (resultado.erro) {
        return resultado;
    }

    return resultado.comandos;
}

function caminho_livre() {
    let x = player.x;
    let y = player.y;

    if (player.direcao === "cima") x--;
    if (player.direcao === "baixo") x++;
    if (player.direcao === "esquerda") y--;
    if (player.direcao === "direita") y++;

    if (
        x < 0 ||
        y < 0 ||
        x >= mapa.length ||
        y >= mapa[0].length
    ) {
        return false;
    }

    return mapa[x][y] !== "🧱";
}

function comandoBasico(nome) {
    if (nome === "andar()") return andar();
    if (nome === "tras()") return tras();
    if (nome === "virar()") return virar();

    return "desconhecido";
}

function avaliarCondicao(condicao) {
    if (condicao === "caminho_livre()") {
        return caminho_livre();
    }

    return false;
}

async function executarArvore(comandos, contexto = {}) {
    for (const comando of comandos) {
        if (venceu) return false;

        if (comando.tipo === "comando") {
            atualizarComandoAtual(
                `Linha ${comando.linha}: ${comando.nome}`
            );

            destacarComando(comando.nome);

            await esperar(450);

            if (venceu) return false;

            if (funcoesUsuario[comando.nome.replace("()", "")]) {
                const nomeFuncao = comando.nome.replace("()", "");

                if (contexto.funcoesAtivas &&
                    contexto.funcoesAtivas.includes(nomeFuncao)) {
                    atualizarStatus(
                        `A função "${nomeFuncao}" chamou ela mesma.`,
                        "erro"
                    );
                    return false;
                }

                const novasFuncoesAtivas = [
                    ...(contexto.funcoesAtivas || []),
                    nomeFuncao
                ];

                const resultado = await executarArvore(
                    funcoesUsuario[nomeFuncao],
                    { funcoesAtivas: novasFuncoesAtivas }
                );

                if (resultado === false) return false;

                await esperar(250);
                continue;
            }

            const resultado = comandoBasico(comando.nome);

            if (resultado === "desconhecido") {
                atualizarStatus(
                    `Não conheço "${comando.nome}" nessa linha.`,
                    "erro"
                );
                return false;
            }

            if (resultado === false) {
                atualizarComandoAtual(
                    `Parei na linha ${comando.linha}.`
                );
                return false;
            }

            await esperar(250);
            continue;
        }

        if (comando.tipo === "for") {
            atualizarComandoAtual(
                `Linha ${comando.linha}: for i in range(${comando.quantidade})`
            );

            destacarComando(`for i in range(${comando.quantidade}):`);

            await esperar(350);

            for (let i = 0; i < comando.quantidade; i++) {
                if (venceu) return false;

                atualizarComandoAtual(
                    `Linha ${comando.linha}: repetição ${i + 1}/${comando.quantidade}`
                );

                const resultado = await executarArvore(
                    comando.corpo,
                    contexto
                );

                if (resultado === false) return false;
            }

            continue;
        }

        if (comando.tipo === "if") {
            const condicao = avaliarCondicao(comando.condicao);
            const caminho = condicao ? comando.corpo : comando.senao;

            atualizarComandoAtual(
                `Linha ${comando.linha}: ${condicao ? "if" : "else"}`
            );

            destacarComando(
                condicao
                    ? `if ${comando.condicao}:`
                    : "else:"
            );

            await esperar(350);

            if (caminho.length > 0) {
                const resultado = await executarArvore(
                    caminho,
                    contexto
                );

                if (resultado === false) return false;
            }

            continue;
        }
    }

    return true;
}

function executar() {
    if (executando) return;

    const textarea = elemento("codigo");
    if (!textarea) return;

    const linhas = textarea.value.split("\n");
    const comandos = interpretar(linhas);

    if (comandos.erro) {
        atualizarStatus(comandos.erro, "erro");
        return;
    }

    executarComandos(comandos);
}

// =====================
// EXECUÇÃO ANIMADA
// =====================

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executarComandos(comandos) {
    executando = true;
    atualizarBotoes();

    const minhaExecucao = ++execucaoId;

    atualizarStatus("Rodando o código...", "executando");

    try {
        if (minhaExecucao !== execucaoId) return;

        const resultado = await executarArvore(comandos);

        if (minhaExecucao !== execucaoId) return;

        if (venceu) {
            return;
        }

        if (resultado === false) {
            return;
        }

        atualizarStatus("✅ Código executado até o fim!", "sucesso");
        atualizarComandoAtual("Fim do código.");
    } finally {
        if (minhaExecucao === execucaoId) {
            executando = false;
            atualizarBotoes();
            limparDestaqueEditor();
        }
    }
}



// DESTAQUE DO EDITOR


function destacarComando(comando) {
    const indicador = elemento("comandoAtual");

    if (indicador) {
        indicador.dataset.comando = comando;
    }
}

function limparDestaqueEditor() {
    const indicador = elemento("comandoAtual");

    if (indicador) {
        delete indicador.dataset.comando;
    }
}



// TAB NO EDITOR


window.addEventListener("DOMContentLoaded", () => {
    const editor = elemento("codigo");

    if (!editor) {
        console.error("Editor não encontrado.");
        return;
    }

    editor.addEventListener("keydown", function(e) {
        if (e.key === "Tab") {
            e.preventDefault();

            const inicio = this.selectionStart;
            const fim = this.selectionEnd;

            this.value =
                this.value.substring(0, inicio) +
                "    " +
                this.value.substring(fim);

            this.selectionStart = inicio + 4;
            this.selectionEnd = inicio + 4;
        }
    });

    atualizarContador();
    atualizarBotoes();
    desenhar();
});