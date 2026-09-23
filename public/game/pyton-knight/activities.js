(function () {
    'use strict';
    const MOVEMENT = ['andar_frente', 'virar_direita', 'virar_esquerda'];
    const TRANSVERSE = ['M31', 'M32', 'M33', 'M35', 'M36'];
    const values = { '#': 0, '.': 1, S: 2, X: 3, '^': 4 };
    const mapRows = (rows) => {
        const width = rows[0].length;
        if (!rows.length || !rows.every((row) => row.length === width)) throw new Error('Mapa com linhas de tamanhos diferentes.');
        return rows.map((row) => [...row].map((char) => {
            if (!Object.prototype.hasOwnProperty.call(values, char)) throw new Error(`Símbolo de mapa desconhecido: ${char}`);
            return values[char];
        }));
    };
    function startOf (map) { for (let row = 0; row < map.length; row++) { const column = map[row].indexOf(2); if (column >= 0) return { linha: row, coluna: column }; } throw new Error('Mapa sem início.'); }
    function activity (config) {
        const mechanics = [...TRANSVERSE, ...(config.mechanics || [])];
        if (mechanics.includes('M24')) mechanics.push('M34');
        if (config.instructionBudget) mechanics.push('M37');
        const result = {
            unidade: Math.ceil(config.id / 5), initialFacing: 'LESTE', tutorial: false,
            allowedConcepts: [], allowedCommands: [...MOVEMENT], entities: [], objectives: [],
            rewards: { xpBase: config.id % 5 === 0 ? 160 : 80 + config.id * 5, replayRewards: false },
            ...config,
            mechanics: [...new Set(mechanics)],
            allowedCommands: [...new Set([...MOVEMENT, ...(config.allowedCommands || [])])]
        };
        result.startPosition = result.startPosition || startOf(result.mapa);
        return result;
    }
    window.ACTIVITIES = [
        activity({
            id: 1, titulo: 'ATIVIDADE 1 — PRIMEIROS PASSOS', nome: 'Primeiros Passos', concept: 'Atribuição de variável e movimento orientado', tutorial: true,
            descricao: 'Use uma variável e a orientação de Guto para chegar ao cristal.',
            mapa: [[0,0,0,0,0,0,0],[0,2,1,1,0,0,0],[0,0,0,1,0,0,0],[0,0,0,1,1,1,3]],
            objectives: [{ type: 'reach_exit', label: 'Chegue ao cristal' }, { type: 'used_concept', concept: 'variables', label: 'Use pelo menos uma variável' }],
            tutorialSteps: [
                { title: 'VER — variável e movimento', message: 'Execute o trecho pronto.', code: 'passos = 2\nandar_frente(passos)', condition: { usedCommand: 'andar_frente' } },
                { title: 'EXECUTAR — mudar orientação', message: 'Gire sem mudar de posição.', code: 'passos = 2\nandar_frente(passos)\nvirar_direita()', condition: { usedCommand: 'virar_direita' } },
                { title: 'COMPLETAR — segundo trecho', message: 'Complete o trecho vertical.', code: 'direita = 2\nbaixo = 2\nandar_frente(direita)\nvirar_direita()\nandar_frente(baixo)', condition: { minimumPosition: { linha: 3, coluna: 3 } } },
                { title: 'ESCREVER — programa completo', message: 'Chegue ao cristal.', code: 'direita = 2\nbaixo = 2\nfinal = 3\nandar_frente(direita)\nvirar_direita()\nandar_frente(baixo)\nvirar_esquerda()\nandar_frente(final)' }
            ],
            codigoInicial: 'passos = 2\nandar_frente(passos)',
            officialSolution: 'direita = 2\nbaixo = 2\nfinal = 3\nandar_frente(direita)\nvirar_direita()\nandar_frente(baixo)\nvirar_esquerda()\nandar_frente(final)',
            solutionExplanation: 'Guto avança para Leste, gira para Sul e volta a olhar para Leste.', testInputs: []
        }),
        activity({
            id: 2, titulo: 'ATIVIDADE 2 — O CAMINHO MUTÁVEL', nome: 'O Caminho Mutável', concept: 'Reatribuição', descricao: 'Reatribua a mesma variável em trechos diferentes.',
            mapa: [[0,0,0,0,0,0,0],[0,2,1,1,1,0,0],[0,0,0,0,1,0,0],[0,0,0,0,1,1,3]],
            objectives: [{ type: 'reach_exit', label: 'Chegue ao cristal' }, { type: 'used_concept', concept: 'variables', label: 'Reutilize uma variável' }],
            codigoInicial: 'passos = 3\n# continue o programa',
            officialSolution: 'passos = 3\nandar_frente(passos)\nvirar_direita()\npassos = 2\nandar_frente(passos)\nvirar_esquerda()\nandar_frente(passos)',
            solutionExplanation: 'A variável passos vale 3 no primeiro trecho e 2 nos demais.', testInputs: []
        }),
        activity({
            id: 3, titulo: 'ATIVIDADE 3 — AS GRADES DA MASMORRA', nome: 'As Grades da Masmorra', concept: 'Operações entre variáveis', descricao: 'Calcule distâncias e contorne as grades.',
            mapa: [[0,0,0,0,0,0,0],[0,2,1,1,1,1,0],[0,0,0,0,0,1,0],[0,0,0,1,1,1,0],[0,0,0,1,1,1,3]],
            barreiras: [{ de: { linha: 3, coluna: 4 }, para: { linha: 4, coluna: 4 } }, { de: { linha: 3, coluna: 5 }, para: { linha: 4, coluna: 5 } }],
            objectives: [{ type: 'reach_exit', label: 'Contorne as grades e chegue ao cristal' }, { type: 'used_concept', concept: 'arithmetic', label: 'Use uma operação entre valores' }],
            codigoInicial: 'base = 2\n# calcule os outros trechos',
            officialSolution: 'base = 2\ndobro = base * 2\nfinal = base + 1\nandar_frente(dobro)\nvirar_direita()\nandar_frente(base)\nvirar_direita()\nandar_frente(base)\nvirar_esquerda()\nandar_frente(1)\nvirar_esquerda()\nandar_frente(final)',
            solutionExplanation: 'A rota usa operações para calcular cinco trechos.', testInputs: []
        }),
        activity({
            id: 4, titulo: 'ATIVIDADE 4 — O CORREDOR DE LAVA', nome: 'O Corredor de Lava', concept: 'Operadores +, - e *', descricao: 'Calcule o percurso sem entrar na lava.', instructionBudget: 15,
            mapa: [[0,0,0,0,0,0,0],[0,2,1,1,1,4,0],[0,0,0,0,1,4,0],[0,0,0,0,1,4,0],[0,0,4,1,1,0,0],[0,0,4,1,1,3,0]],
            objectives: [{ type: 'reach_exit', label: 'Atravesse o corredor e chegue ao cristal' }, { type: 'used_concept', concept: 'arithmetic', label: 'Use operações aritméticas' }, { type: 'budget', label: 'Respeite o orçamento de 15 instruções' }],
            codigoInicial: 'valor = 4\n# calcule a rota segura',
            officialSolution: 'valor = 4\ndireita = valor - 1\nbaixo = direita\nvoltar = baixo - 2\nfinal = voltar + 1\nandar_frente(direita)\nvirar_direita()\nandar_frente(baixo)\nvirar_direita()\nandar_frente(voltar)\nvirar_esquerda()\nandar_frente(1)\nvirar_esquerda()\nandar_frente(final)',
            solutionExplanation: 'Os cálculos produzem a rota segura ao redor da lava.', testInputs: []
        }),
        activity({
            id: 5, titulo: 'ATIVIDADE 5 — O LABIRINTO DAS VARIÁVEIS', nome: 'O Labirinto das Variáveis', concept: 'Integração da Unidade 1', descricao: 'Boss: combine variáveis, operações e orientação.', instructionBudget: 17,
            mapa: [[0,0,0,0,0,0,0,0],[0,2,1,1,1,4,0,0],[0,0,0,0,1,0,0,0],[0,0,0,0,1,1,1,4],[0,0,0,0,0,4,1,0],[0,3,1,1,1,1,1,4]],
            objectives: [{ type: 'reach_exit', label: 'Conclua todos os trechos do labirinto' }, { type: 'used_concept', concept: 'variables', label: 'Use atribuição e reatribuição' }, { type: 'used_concept', concept: 'arithmetic', label: 'Use operações entre valores' }, { type: 'budget', label: 'Respeite o orçamento de 17 instruções' }],
            codigoInicial: 'base = 2\n# planeje todos os trechos',
            officialSolution: 'base = 2\ndireita = base + 1\nbaixo = base\nandar_frente(direita)\nvirar_direita()\nandar_frente(baixo)\nvirar_esquerda()\nandar_frente(base)\ndireita = baixo\nvirar_direita()\nandar_frente(direita)\nfinal = direita + 3\nvirar_direita()\nandar_frente(final)',
            solutionExplanation: 'A rota integra cálculo, reatribuição e cinco subtrechos.', testInputs: []
        }),
        activity({
            id: 6, titulo: 'ATIVIDADE 6 — O PEDESTAL DA PALAVRA', nome: 'O Pedestal da Palavra', concept: 'print() e saída de dados',
            descricao: 'Percorra a sala, alcance a Runa de Saída e imprima a palavra que abre a grade.', tutorial: true,
            mapa: mapRows([
                '##########',
                '#S...#####',
                '#....#####',
                '###.....##',
                '#######.##',
                '######..X#',
                '##########'
            ]),
            mechanics: ['M18'], allowedConcepts: ['print'], requiredConcepts: ['print'], requirePrintContext: true,
            regions: [
                { id: 'inicio', label: 'Sala inicial', row: 1, column: 1, width: 4, height: 2, color: 0x294f7a },
                { id: 'runa', label: 'Galeria da Runa', row: 3, column: 3, width: 5, height: 1, color: 0x3d6b80 },
                { id: 'final', label: 'Câmara do cristal', row: 5, column: 6, width: 3, height: 1, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '10 x 7', structure: 'sala inicial, galeria com duas curvas e câmara final', areas: 3, curves: 4 },
            entities: [
                { id: 'pedestal_word', type: 'pedestal', row: 3, column: 6, symbol: 'A' },
                { id: 'rune', type: 'output_rune', row: 3, column: 7 },
                { id: 'gate', type: 'gate', row: 4, column: 7, requires: ['wordPrinted'] }
            ],
            outputRules: [{ expected: 'AURORA', flags: ['wordPrinted'], states: [{ entityId: 'rune', state: 'correct' }, { entityId: 'gate', state: 'open' }] }],
            objectives: [
                { type: 'output_equals', value: 'AURORA', label: 'Produza a saída AURORA junto à runa' },
                { type: 'used_concept', concept: 'print', label: 'Use print()' },
                { type: 'reach_exit', label: 'Atravesse a grade e alcance o cristal' }
            ],
            tutorialSteps: [
                { title: 'VER — deslocamento', message: 'Execute o primeiro trecho da sala.', code: 'andar_frente(3)', condition: { usedCommand: 'andar_frente' } },
                { title: 'EXECUTAR — orientação', message: 'Gire para entrar na galeria.', code: 'andar_frente(3)\nvirar_direita()', condition: { usedCommand: 'virar_direita' } },
                { title: 'COMPLETAR — chegar à runa', message: 'Faça as duas curvas e alcance a inscrição.', code: 'andar_frente(3)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nandar_frente(3)', condition: { minimumPosition: { linha: 3, coluna: 7 } } },
                { title: 'ESCREVER — saída e cristal', message: 'Imprima AURORA junto à runa e atravesse a grade.', code: 'andar_frente(3)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nandar_frente(3)\npalavra = "AURORA"\nprint(palavra)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nandar_frente()' }
            ],
            codigoInicial: 'andar_frente(3)',
            officialSolution: 'andar_frente(3)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nandar_frente(3)\npalavra = "AURORA"\nprint(palavra)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nandar_frente()',
            solutionExplanation: 'Guto percorre duas curvas, imprime a palavra diante da runa, cruza a grade e entra na câmara final.', testInputs: []
        }),
        activity({
            id: 7, titulo: 'ATIVIDADE 7 — O GUARDIÃO DA RESPOSTA', nome: 'O Guardião da Resposta', concept: 'input(), variável e print()',
            descricao: 'Visite o pedestal, reutilize a resposta e atravesse Guardião e porta.',
            mapa: mapRows([
                '###########',
                '#S..#######',
                '#...#######',
                '###.......#',
                '#########.#',
                '#########.#',
                '#########X#',
                '###########'
            ]),
            mechanics: ['M17','M18','M20','M05'], allowedConcepts: ['input','print'], allowedCommands: ['abrir_porta'], requiredConcepts: ['input','print'], requireInputContext: true, requirePrintContext: true,
            regions: [
                { id: 'inicio', label: 'Sala inicial', row: 1, column: 1, width: 3, height: 2, color: 0x294f7a },
                { id: 'pedestal', label: 'Desvio do pedestal', row: 3, column: 3, width: 2, height: 1, color: 0x4b4e83 },
                { id: 'guardiao', label: 'Galeria do Guardião', row: 3, column: 5, width: 5, height: 1, color: 0x6d3a51 },
                { id: 'final', label: 'Porta final', row: 4, column: 9, width: 1, height: 3, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '11 x 8', structure: 'sala inicial, desvio de entrada, galeria do Guardião e porta final', areas: 4, curves: 4 },
            entities: [
                { id: 'input_pedestal', type: 'pedestal', row: 3, column: 3 },
                { id: 'answer_rune', type: 'output_rune', row: 3, column: 4 },
                { id: 'guardian', type: 'guardian', row: 3, column: 8, requires: ['answerEchoed'] },
                { id: 'door', type: 'door', row: 5, column: 9, requires: ['answerEchoed'] }
            ],
            outputRules: [{ expected: 'CORAGEM', flags: ['answerEchoed'], states: [{ entityId: 'answer_rune', state: 'correct' }] }],
            objectives: [
                { type: 'used_concept', concept: 'input', label: 'Receba a palavra no pedestal com input()' },
                { type: 'used_concept', concept: 'print', label: 'Use print() para ecoar a resposta' },
                { type: 'output_equals', value: 'CORAGEM', label: 'Reutilize a resposta com print()' },
                { type: 'entity_state', entityId: 'guardian', state: 'defeated', label: 'Libere o Guardião presencialmente' },
                { type: 'entity_state', entityId: 'door', state: 'open', label: 'Abra a porta final' },
                { type: 'reach_exit', label: 'Alcance o cristal' }
            ],
            codigoInicial: 'andar_frente(2)\n# procure o pedestal de entrada',
            officialSolution: 'andar_frente(2)\nvirar_direita()\nandar_frente(2)\nresposta = input("Palavra: ")\nprint(resposta)\nvirar_esquerda()\nandar_frente(4)\nabrir_porta("guardian")\nandar_frente(2)\nvirar_direita()\nandar_frente()\nabrir_porta("door")\nandar_frente(2)',
            solutionExplanation: 'A rota obriga Guto a visitar o pedestal, enfrentar o Guardião e se reposicionar diante da porta.', testInputs: ['CORAGEM']
        }),
        activity({
            id: 8, titulo: 'ATIVIDADE 8 — A PONTE DOS CONSTRUTORES', nome: 'A Ponte dos Construtores', concept: 'int(input()) e processamento numérico',
            descricao: 'Explore o desvio da alavanca, calcule os segmentos e materialize a ponte.',
            mapa: mapRows([
                '#############',
                '#S.....######',
                '#....#.######',
                '####.#.######',
                '####.#......#',
                '##########..#',
                '##########.X#',
                '#############',
                '#############'
            ]),
            mechanics: ['M03','M07','M17','M18'], allowedConcepts: ['input','int','print'], allowedCommands: ['ativar_alavanca'], requiredConcepts: ['input','int','arithmetic'], requireInputContext: true, requirePrintContext: true,
            regions: [
                { id: 'inicio', label: 'Área inicial', row: 1, column: 1, width: 4, height: 2, color: 0x294f7a },
                { id: 'lever', label: 'Alcova da alavanca', row: 3, column: 4, width: 1, height: 2, color: 0x75582d },
                { id: 'rune', label: 'Pedestal de cálculo', row: 1, column: 6, width: 1, height: 4, color: 0x3d6b80 },
                { id: 'bridge', label: 'Ponte retrátil', row: 4, column: 7, width: 3, height: 1, color: 0x584b3a },
                { id: 'final', label: 'Margem final', row: 4, column: 10, width: 2, height: 3, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '13 x 9', structure: 'duas margens, dois desvios obrigatórios e ponte física de três segmentos', areas: 5, curves: 7 },
            entities: [
                { id: 'lever', type: 'lever', row: 4, column: 4, flag: 'leverDone' },
                { id: 'measure_pedestal', type: 'pedestal', row: 1, column: 6 },
                { id: 'measure_rune', type: 'output_rune', row: 2, column: 6 },
                { id: 'bridge1', type: 'bridge', row: 4, column: 7 },
                { id: 'bridge2', type: 'bridge', row: 4, column: 8 },
                { id: 'bridge3', type: 'bridge', row: 4, column: 9 }
            ],
            outputRules: [{ expected: '6', requires: ['leverDone'], flags: ['measureCorrect'], states: [{ entityId: 'measure_rune', state: 'correct' }, { entityId: 'bridge1', state: 'active' }, { entityId: 'bridge2', state: 'active' }, { entityId: 'bridge3', state: 'active' }] }],
            objectives: [
                { type: 'entity_state', entityId: 'lever', state: 'on', label: 'Visite e ative a alavanca' },
                { type: 'used_concept', concept: 'input', label: 'Leia os dois valores no pedestal' },
                { type: 'used_concept', concept: 'int', label: 'Converta as duas entradas com int()' },
                { type: 'used_concept', concept: 'arithmetic', label: 'Calcule grupos × segmentos' },
                { type: 'output_equals', value: '6', label: 'Envie o total correto para a runa' },
                { type: 'entity_state', entityId: 'bridge3', state: 'active', label: 'Complete a ponte retrátil' },
                { type: 'reach_exit', label: 'Atravesse até o cristal' }
            ],
            codigoInicial: 'andar_frente(3)\n# encontre a alavanca antes do pedestal',
            officialSolution: 'andar_frente(3)\nvirar_direita()\nandar_frente(3)\nativar_alavanca()\nvirar_direita()\nvirar_direita()\nandar_frente(3)\nvirar_direita()\nandar_frente(2)\ngrupos = int(input("Grupos: "))\nsegmentos = int(input("Segmentos: "))\ntotal = grupos * segmentos\nvirar_direita()\nprint(total)\nandar_frente(3)\nvirar_esquerda()\nandar_frente(5)\nvirar_direita()\nandar_frente(2)',
            solutionExplanation: 'O desvio ativa a alavanca; o produto 2 × 3 energiza a runa e torna os três tiles da ponte transitáveis.', testInputs: ['2','3']
        }),
        activity({
            id: 9, titulo: 'ATIVIDADE 9 — O SALÃO DOS ESPELHOS RÚNICOS', nome: 'O Salão dos Espelhos Rúnicos', concept: 'Múltiplas entradas e processamento',
            descricao: 'Calcule a distância e use o espelho correspondente para alcançar o cofre.', instructionBudget: 14,
            mapa: mapRows([
                '###############',
                '#....#####....#',
                '#....#####...X#',
                '#....#####....#',
                '#.#############',
                '#S............#',
                '#....#####....#',
                '#....#####....#',
                '#....#####....#',
                '###############'
            ]),
            mechanics: ['M14','M17','M18','M19'], allowedConcepts: ['input','int','print'], allowedCommands: ['entrar_espelho','abrir_porta'], requiredConcepts: ['input','int','arithmetic'], requireInputContext: true, requirePrintContext: true,
            regions: [
                { id: 'mirror_hall', label: 'Salão central', row: 5, column: 1, width: 13, height: 1, color: 0x4b4e83 },
                { id: 'wrong_a', label: 'Ala do espelho 3', row: 1, column: 1, width: 4, height: 3, color: 0x713c50 },
                { id: 'cofre', label: 'Ala do cofre 5', row: 1, column: 10, width: 4, height: 3, color: 0x385f48 },
                { id: 'wrong_b', label: 'Ala do espelho 7', row: 6, column: 1, width: 4, height: 3, color: 0x713c50 }
            ],
            mapDesign: { dimensions: '15 x 10', structure: 'salão seletor com três espelhos e três alas de destino', areas: 4, curves: 4 },
            entities: [
                { id: 'rune_pedestal', type: 'pedestal', row: 5, column: 1 },
                { id: 'selector_rune', type: 'output_rune', row: 5, column: 2 },
                { id: 'mirror3', type: 'mirror', value: 3, row: 5, column: 4, requires: ['mirror3Ready'], target: { row: 2, column: 3, facing: 'NORTE' } },
                { id: 'mirror5', type: 'mirror', value: 5, row: 5, column: 6, requires: ['mirror5Ready'], flag: 'correctMirror', target: { row: 3, column: 10, facing: 'LESTE' } },
                { id: 'mirror7', type: 'mirror', value: 7, row: 5, column: 8, requires: ['mirror7Ready'], target: { row: 7, column: 3, facing: 'LESTE' } },
                { id: 'wrong_spikes_3', type: 'hazard', row: 1, column: 3 },
                { id: 'wrong_spikes_7', type: 'hazard', row: 7, column: 4 },
                { id: 'cofre', type: 'gate', row: 2, column: 12, requires: ['correctMirror'] }
            ],
            outputRules: [
                { expected: '3', flags: ['mirror3Ready'], states: [{ entityId: 'selector_rune', state: 'correct' }, { entityId: 'mirror3', state: 'active' }] },
                { expected: '5', flags: ['mirror5Ready'], states: [{ entityId: 'selector_rune', state: 'correct' }, { entityId: 'mirror5', state: 'active' }] },
                { expected: '7', flags: ['mirror7Ready'], states: [{ entityId: 'selector_rune', state: 'correct' }, { entityId: 'mirror7', state: 'active' }] }
            ],
            objectives: [
                { type: 'used_concept', concept: 'input', label: 'Obtenha os dois valores rúnicos' },
                { type: 'used_concept', concept: 'int', label: 'Converta os valores para números' },
                { type: 'used_concept', concept: 'arithmetic', label: 'Some as runas para determinar a distância' },
                { type: 'output_equals', value: '5', label: 'Energize o espelho correto' },
                { type: 'flag', flag: 'correctMirror', label: 'Entre fisicamente no espelho 5' },
                { type: 'entity_state', entityId: 'cofre', state: 'open', label: 'Abra o Cofre Rúnico' },
                { type: 'reach_exit', label: 'Alcance o cristal da ala correta' },
                { type: 'budget', label: 'Respeite o orçamento de 14 instruções' }
            ],
            codigoInicial: 'runa1 = int(input("Primeira runa: "))\nruna2 = int(input("Segunda runa: "))',
            officialSolution: 'runa1 = int(input("Primeira runa: "))\nruna2 = int(input("Segunda runa: "))\nportal = runa1 + runa2\nprint(portal)\nandar_frente(portal)\nentrar_espelho(portal)\nandar_frente(2)\nvirar_esquerda()\nabrir_porta("cofre")\nandar_frente()\nvirar_direita()\nandar_frente()',
            solutionExplanation: 'O resultado 5 também é a distância até o espelho correto; na ala correta Guto contorna o cofre antes do cristal.', testInputs: ['2','3']
        }),
        activity({
            id: 10, titulo: 'ATIVIDADE 10 — O COFRE DAS TRÊS RUNAS', nome: 'O Cofre das Três Runas', concept: 'Integração de entrada, processamento e saída',
            descricao: 'Boss: atravesse três câmaras, construa a ponte, use o espelho e abra o cofre.', instructionBudget: 45,
            mapa: mapRows([
                '#################',
                '#S.......########',
                '#....###.########',
                '###.####.########',
                '#.....##.......##',
                '##########.....##',
                '##########.....##',
                '########.......##',
                '###......#####.##',
                '###......#####X##',
                '###......########',
                '#################'
            ]),
            mechanics: ['M03','M07','M14','M17','M18','M19'], allowedConcepts: ['input','int','print'], allowedCommands: ['ativar_alavanca','entrar_espelho','abrir_porta'], requiredConcepts: ['input','int','arithmetic','print'], requireInputContext: true, requirePrintContext: true,
            regions: [
                { id: 'rune_a', label: 'Câmara da Runa A', row: 1, column: 1, width: 4, height: 2, color: 0x294f7a },
                { id: 'lever_b', label: 'Câmara da Alavanca e Runa B', row: 4, column: 1, width: 5, height: 1, color: 0x75582d },
                { id: 'bridge', label: 'Ponte das runas', row: 4, column: 8, width: 5, height: 1, color: 0x584b3a },
                { id: 'mirror_c', label: 'Câmara da Runa C e espelho', row: 4, column: 10, width: 5, height: 4, color: 0x4b4e83 },
                { id: 'cofre', label: 'Câmara do cofre', row: 8, column: 3, width: 6, height: 3, color: 0x6a512f },
                { id: 'final', label: 'Câmara final', row: 7, column: 13, width: 2, height: 3, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '17 x 12', structure: 'seis regiões conectadas por desvio, ponte, espelho e retorno ao eixo final', areas: 6, curves: 12 },
            entities: [
                { id: 'pedestal_a', type: 'pedestal', row: 1, column: 3, symbol: 'A' },
                { id: 'lever', type: 'lever', row: 4, column: 3, flag: 'leverDone' },
                { id: 'pedestal_b', type: 'pedestal', row: 4, column: 4, symbol: 'B' },
                { id: 'rune_b', type: 'output_rune', row: 4, column: 5, symbol: 'B' },
                { id: 'bridge1', type: 'bridge', row: 4, column: 9 },
                { id: 'bridge2', type: 'bridge', row: 4, column: 10 },
                { id: 'bridge3', type: 'bridge', row: 4, column: 11 },
                { id: 'mirror5', type: 'mirror', value: 5, row: 7, column: 10, requires: ['runesPrinted'], flag: 'mirrorDone', target: { row: 9, column: 4, facing: 'LESTE' } },
                { id: 'rune_c', type: 'output_rune', row: 7, column: 11, symbol: 'C' },
                { id: 'pedestal_c', type: 'pedestal', row: 7, column: 12, symbol: 'C' },
                { id: 'cofre', type: 'gate', row: 9, column: 5, requires: ['leverDone','bridgeReady','mirrorDone','runesPrinted'] }
            ],
            outputRules: [
                { expected: '2', requires: ['leverDone'], flags: ['bridgeReady'], states: [{ entityId: 'rune_b', state: 'correct' }, { entityId: 'bridge1', state: 'active' }, { entityId: 'bridge2', state: 'active' }, { entityId: 'bridge3', state: 'active' }] },
                { expected: '5', requires: ['bridgeReady'], flags: ['runesPrinted'], states: [{ entityId: 'rune_c', state: 'correct' }, { entityId: 'mirror5', state: 'active' }] }
            ],
            objectives: [
                { type: 'used_concept', concept: 'input', label: 'Leia A, B e C nos pedestais correspondentes' },
                { type: 'used_concept', concept: 'int', label: 'Converta as três runas para números' },
                { type: 'used_concept', concept: 'arithmetic', label: 'Combine produto e soma' },
                { type: 'used_concept', concept: 'print', label: 'Materialize os resultados nas runas de saída' },
                { type: 'flag', flag: 'leverDone', label: 'Resolva a câmara da alavanca' },
                { type: 'flag', flag: 'bridgeReady', label: 'Calcule o produto e construa a ponte' },
                { type: 'output_equals', value: '5', label: 'Calcule (A × B) + C' },
                { type: 'flag', flag: 'mirrorDone', label: 'Entre no espelho ativado' },
                { type: 'entity_state', entityId: 'cofre', state: 'open', label: 'Abra o Cofre das Três Runas' },
                { type: 'reach_exit', label: 'Alcance o cristal da câmara final' },
                { type: 'budget', label: 'Respeite o orçamento de 45 instruções' }
            ],
            codigoInicial: '# Boss da Unidade 2\n# visite as três runas na ordem espacial',
            officialSolution: 'andar_frente(2)\na = int(input("Runa A: "))\nvirar_direita()\nandar_frente(3)\nativar_alavanca()\nvirar_esquerda()\nandar_frente()\nb = int(input("Runa B: "))\nparcial = a * b\nprint(parcial)\nvirar_direita()\nvirar_direita()\nandar_frente()\nvirar_direita()\nandar_frente(3)\nvirar_direita()\nandar_frente(5)\nvirar_direita()\nandar_frente(3)\nvirar_esquerda()\nandar_frente(4)\nvirar_direita()\nandar_frente(3)\nc = int(input("Runa C: "))\ncodigo = parcial + c\nprint(codigo)\nvirar_direita()\nandar_frente(2)\nentrar_espelho(codigo)\nabrir_porta("cofre")\nandar_frente(4)\nvirar_esquerda()\nandar_frente(2)\nvirar_direita()\nandar_frente(6)\nvirar_direita()\nandar_frente(2)',
            solutionExplanation: 'A Boss distribui A, B e C em câmaras diferentes; o produto abre a ponte e o código final ativa o espelho que leva ao cofre.', testInputs: ['1','2','3']
        }),
        activity({
            id: 11, titulo: 'ATIVIDADE 11 — A PORTA DO GUARDIÃO', nome: 'A Porta do Guardião', concept: 'if e condição booleana',
            descricao: 'Busque a chave no desvio, retorne à rota principal e abra os dois bloqueios com if.', tutorial: true,
            mapa: mapRows([
                '###########',
                '#S......###',
                '#...###.###',
                '###.###.###',
                '#######.###',
                '#######..X#',
                '###########',
                '###########'
            ]),
            mechanics: ['M05','M20','M21','M30'], allowedConcepts: ['if','print'], allowedCommands: ['tem_chave','abrir_porta'], requiredConcepts: ['if'],
            regions: [
                { id: 'inicio', label: 'Sala inicial', row: 1, column: 1, width: 3, height: 2, color: 0x294f7a },
                { id: 'key', label: 'Desvio da chave', row: 2, column: 3, width: 1, height: 2, color: 0x75582d },
                { id: 'main', label: 'Rota principal', row: 1, column: 4, width: 4, height: 1, color: 0x4b4e83 },
                { id: 'guardian', label: 'Porta do Guardião', row: 3, column: 7, width: 3, height: 3, color: 0x6d3a51 }
            ],
            mapDesign: { dimensions: '11 x 8', structure: 'desvio de chave, retorno ao eixo e dois bloqueios em sequência', areas: 4, curves: 7 },
            entities: [
                { id: 'key', type: 'key', row: 3, column: 3 },
                { id: 'door', type: 'door', row: 4, column: 7, requiresKey: true },
                { id: 'guardian', type: 'guardian', row: 5, column: 8, requiresKey: true }
            ],
            objectives: [
                { type: 'has_key', label: 'Colete a chave no desvio' },
                { type: 'used_concept', concept: 'if', label: 'Use if com tem_chave()' },
                { type: 'entity_state', entityId: 'door', state: 'open', label: 'Abra a porta principal' },
                { type: 'entity_state', entityId: 'guardian', state: 'defeated', label: 'Libere o Guardião' },
                { type: 'reach_exit', label: 'Alcance o cristal' }
            ],
            tutorialSteps: [
                { title: 'VER — chave e sensor', message: 'Vá ao desvio, colete a chave e consulte o estado.', code: 'andar_frente(2)\nvirar_direita()\nandar_frente(2)\nprint(tem_chave())', condition: { usedCommand: 'tem_chave' } },
                { title: 'EXECUTAR — primeira condição', message: 'Retorne e abra a porta somente com a chave.', code: 'andar_frente(2)\nvirar_direita()\nandar_frente(2)\nvirar_direita()\nvirar_direita()\nandar_frente(2)\nvirar_direita()\nandar_frente(4)\nvirar_direita()\nandar_frente(2)\nif tem_chave():\n    abrir_porta("door")', condition: { usedConcept: 'if' } },
                { title: 'ESCREVER — concluir', message: 'Atravesse a porta e libere o Guardião antes do cristal.', code: 'andar_frente(2)\nvirar_direita()\nandar_frente(2)\nvirar_direita()\nvirar_direita()\nandar_frente(2)\nvirar_direita()\nandar_frente(4)\nvirar_direita()\nandar_frente(2)\nif tem_chave():\n    abrir_porta("door")\nandar_frente(2)\nvirar_esquerda()\nif tem_chave():\n    abrir_porta("guardian")\nandar_frente(2)' }
            ],
            codigoInicial: 'andar_frente(2)\n# procure a chave antes de testar tem_chave()',
            officialSolution: 'andar_frente(2)\nvirar_direita()\nandar_frente(2)\nvirar_direita()\nvirar_direita()\nandar_frente(2)\nvirar_direita()\nandar_frente(4)\nvirar_direita()\nandar_frente(2)\nif tem_chave():\n    abrir_porta("door")\nandar_frente(2)\nvirar_esquerda()\nif tem_chave():\n    abrir_porta("guardian")\nandar_frente(2)',
            solutionExplanation: 'A chave está fora da rota principal; Guto volta ao eixo, abre a porta e depois enfrenta o Guardião.', testInputs: []
        }),
        activity({
            id: 12, titulo: 'ATIVIDADE 12 — OS DOIS CAMINHOS', nome: 'Os Dois Caminhos', concept: 'if / else',
            descricao: 'Leia o estado da placa e escolha entre duas rotas fisicamente diferentes que convergem no cristal.',
            mapa: mapRows([
                '#############',
                '#############',
                '###.......###',
                '#...#####.###',
                '#S.........X#',
                '###.#####.###',
                '###.......###',
                '#############',
                '#############'
            ]),
            mechanics: ['M01','M09','M30'], allowedConcepts: ['if','else'], allowedCommands: ['placa_ativa'], requiredConcepts: ['if','else'],
            regions: [
                { id: 'start', label: 'Sala da placa', row: 3, column: 1, width: 3, height: 2, color: 0x294f7a },
                { id: 'upper', label: 'Caminho A', row: 2, column: 3, width: 7, height: 2, color: 0x3d6b80 },
                { id: 'lower', label: 'Caminho B', row: 5, column: 3, width: 7, height: 2, color: 0x75582d },
                { id: 'merge', label: 'Convergência', row: 3, column: 9, width: 3, height: 2, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '13 x 9', structure: 'bifurcação verdadeira com rota superior e inferior simétricas', areas: 4, curves: 6 },
            entities: [
                { id: 'plate', type: 'toggle_plate', row: 3, column: 2, connections: [{ targetId: 'spikes_upper', activeState: 'inactive', inactiveState: 'active' }, { targetId: 'spikes_lower', activeState: 'active', inactiveState: 'inactive' }] },
                { id: 'spikes_upper', type: 'hazard', row: 2, column: 6 },
                { id: 'spikes_lower', type: 'hazard', row: 6, column: 6 }
            ],
            variantStates: [
                [{ entityId: 'plate', state: 'on' }, { entityId: 'spikes_upper', state: 'inactive' }, { entityId: 'spikes_lower', state: 'active' }],
                [{ entityId: 'plate', state: 'off' }, { entityId: 'spikes_upper', state: 'active' }, { entityId: 'spikes_lower', state: 'inactive' }]
            ],
            objectives: [
                { type: 'used_concept', concept: 'if', label: 'Use if para avaliar o estado' },
                { type: 'used_concept', concept: 'else', label: 'Use else para a rota alternativa' },
                { type: 'reach_exit', label: 'Escolha a rota segura e alcance o cristal' }
            ],
            codigoInicial: 'andar_frente(2)\nif placa_ativa():\n    # caminho A\nelse:\n    # caminho B',
            officialSolution: 'andar_frente(2)\nif placa_ativa():\n    virar_esquerda()\n    andar_frente(2)\n    virar_direita()\n    andar_frente(6)\n    virar_direita()\n    andar_frente(2)\n    virar_esquerda()\nelse:\n    virar_direita()\n    andar_frente(2)\n    virar_esquerda()\n    andar_frente(6)\n    virar_esquerda()\n    andar_frente(2)\n    virar_direita()\nandar_frente(2)',
            solutionExplanation: 'Cada variante ativa os espinhos de uma ala; if/else conduz por rotas distintas e convergentes.', testInputs: []
        }),
        activity({
            id: 13, titulo: 'ATIVIDADE 13 — A CÂMARA DAS COMPARAÇÕES', nome: 'A Câmara das Comparações', concept: 'Operadores relacionais',
            descricao: 'Compare a energia do pedestal para atravessar duas validações e ignorar as portas incorretas.',
            mapa: mapRows([
                '##############',
                '###########X##',
                '#######.....##',
                '###.###.##.###',
                '###.###.##.###',
                '##.........###',
                '##.........###',
                '####.#########',
                '#S...#########',
                '##############'
            ]),
            mechanics: ['M06','M17','M20','M30'], allowedConcepts: ['input','int','if','comparison'], allowedCommands: ['abrir_porta'], requiredConcepts: ['comparison','if'], requireInputContext: true,
            regions: [
                { id: 'start', label: 'Pedestal de energia', row: 8, column: 1, width: 4, height: 1, color: 0x294f7a },
                { id: 'hall', label: 'Salão de comparação', row: 5, column: 2, width: 9, height: 2, color: 0x4b4e83 },
                { id: 'first', label: 'Porta ≥ 10', row: 3, column: 7, width: 1, height: 3, color: 0x3d6b80 },
                { id: 'second', label: 'Validação final', row: 2, column: 7, width: 5, height: 1, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '14 x 10', structure: 'pedestal, salão com três escolhas e duas validações na rota correta', areas: 4, curves: 6 },
            entities: [
                { id: 'energy_pedestal', type: 'pedestal', row: 8, column: 4 },
                { id: 'door_low', type: 'door', row: 4, column: 3, label: '< 10' },
                { id: 'door_equal', type: 'door', row: 4, column: 10, label: '== 10' },
                { id: 'guardian_high', type: 'guardian', row: 3, column: 7, connections: [{ targetId: 'door_high', activeState: 'open' }] },
                { id: 'door_high', type: 'door', row: 2, column: 7 },
                { id: 'guardian_second', type: 'guardian', row: 2, column: 9, connections: [{ targetId: 'door_second', activeState: 'open' }] },
                { id: 'door_second', type: 'door', row: 2, column: 10 }
            ],
            objectives: [
                { type: 'used_concept', concept: 'comparison', label: 'Use operadores relacionais' },
                { type: 'used_concept', concept: 'if', label: 'Use if para controlar as validações' },
                { type: 'entity_state', entityId: 'door_high', state: 'open', label: 'Abra a porta de energia mínima' },
                { type: 'entity_state', entityId: 'door_second', state: 'open', label: 'Conclua a segunda comparação' },
                { type: 'reach_exit', label: 'Alcance o cristal' }
            ],
            codigoInicial: 'andar_frente(3)\nenergia = int(input("Energia da runa: "))\n# compare com o limite 10',
            officialSolution: 'andar_frente(3)\nenergia = int(input("Energia da runa: "))\nvirar_esquerda()\nandar_frente(3)\nvirar_direita()\nandar_frente(3)\nvirar_esquerda()\nandar_frente()\nif energia >= 10:\n    abrir_porta("guardian_high")\nandar_frente(2)\nvirar_direita()\nandar_frente()\nif energia != 0:\n    abrir_porta("guardian_second")\nandar_frente(3)\nvirar_esquerda()\nandar_frente()',
            solutionExplanation: 'A energia 12 conduz à ala ≥ 10 e ainda precisa satisfazer uma segunda comparação antes do cristal.', testInputs: ['12']
        }),
        activity({
            id: 14, titulo: 'ATIVIDADE 14 — O SELO DAS DUAS ALAVANCAS', nome: 'O Selo das Duas Alavancas', concept: 'and / or',
            descricao: 'Explore as duas alas, atravesse a placa alternadora e volte ao eixo dos dois selos.', instructionBudget: 30, initialFacing: 'NORTE',
            mapa: mapRows([
                '################',
                '################',
                '################',
                '#######...X#####',
                '#...###.####...#',
                '#..............#',
                '#...##....##...#',
                '######....######',
                '######....######',
                '######.S..######',
                '################'
            ]),
            mechanics: ['M02','M03','M06','M09','M30'], allowedConcepts: ['if','and','or'], allowedCommands: ['ativar_alavanca','alavanca_azul_ativa','alavanca_verde_ativa','abrir_porta'], requiredConcepts: ['and','or'],
            regions: [
                { id: 'start', label: 'Antecâmara', row: 7, column: 6, width: 4, height: 3, color: 0x294f7a },
                { id: 'center', label: 'Salão central', row: 5, column: 6, width: 4, height: 4, color: 0x4b4e83 },
                { id: 'blue', label: 'Ala azul', row: 4, column: 1, width: 5, height: 3, color: 0x315d8b },
                { id: 'green', label: 'Ala verde', row: 4, column: 10, width: 5, height: 3, color: 0x386b4b },
                { id: 'seals', label: 'Selos central e lateral', row: 3, column: 7, width: 4, height: 2, color: 0x6d3a51 }
            ],
            mapDesign: { dimensions: '16 x 11', structure: 'salão central, duas alas opostas, retorno obrigatório e dois selos', areas: 5, curves: 9 },
            entities: [
                { id: 'lever_blue', type: 'lever', label: 'azul', row: 5, column: 2, flag: 'lever_blue' },
                { id: 'toggle_plate', type: 'toggle_plate', row: 5, column: 10, connections: [{ targetId: 'spikes', activeState: 'inactive', inactiveState: 'active' }] },
                { id: 'spikes', type: 'hazard', row: 5, column: 11 },
                { id: 'lever_green', type: 'lever', label: 'verde', row: 5, column: 13, flag: 'lever_green' },
                { id: 'gate_main', type: 'gate', row: 4, column: 7, requires: ['lever_blue','lever_green'] },
                { id: 'gate_side', type: 'gate', row: 3, column: 9, requiresAny: ['lever_blue','lever_green'] }
            ],
            objectives: [
                { type: 'entity_state', entityId: 'lever_blue', state: 'on', label: 'Visite e ative a alavanca azul' },
                { type: 'entity_state', entityId: 'lever_green', state: 'on', label: 'Visite e ative a alavanca verde' },
                { type: 'used_concept', concept: 'and', label: 'Use and no selo principal' },
                { type: 'used_concept', concept: 'or', label: 'Use or na passagem secundária' },
                { type: 'entity_state', entityId: 'gate_main', state: 'open', label: 'Abra o portão principal' },
                { type: 'entity_state', entityId: 'gate_side', state: 'open', label: 'Abra a passagem associada a OR' },
                { type: 'reach_exit', label: 'Alcance o cristal' },
                { type: 'budget', label: 'Respeite o orçamento de 30 instruções' }
            ],
            codigoInicial: '# Visite as duas alas e retorne ao portão central',
            officialSolution: 'andar_frente(4)\nvirar_esquerda()\nandar_frente(5)\nativar_alavanca("lever_blue")\nvirar_direita()\nvirar_direita()\nandar_frente(11)\nativar_alavanca("lever_green")\nvirar_direita()\nvirar_direita()\nandar_frente(6)\nvirar_direita()\nif alavanca_azul_ativa() and alavanca_verde_ativa():\n    abrir_porta("gate_main")\nandar_frente(2)\nvirar_direita()\nandar_frente()\nif alavanca_azul_ativa() or alavanca_verde_ativa():\n    abrir_porta("gate_side")\nandar_frente(2)',
            solutionExplanation: 'Guto percorre as duas alas, usa a placa para neutralizar os espinhos e retorna aos selos AND/OR.', testInputs: []
        }),
        activity({
            id: 15, titulo: 'ATIVIDADE 15 — O JULGAMENTO DOS TRÊS PORTÕES', nome: 'O Julgamento dos Três Portões', concept: 'if / elif / else e integração',
            descricao: 'Boss: resolva chave e alavanca, classifique o poder e atravesse uma de três rotas reais.', instructionBudget: 45,
            mapa: mapRows([
                '##################',
                '##############...#',
                '##############..X#',
                '######.####....###',
                '###........###.###',
                '###........###.###',
                '###........###.###',
                '###........###.###',
                '#......###.....###',
                '#......#######.###',
                '#S.....#######.###',
                '##################'
            ]),
            mechanics: ['M01','M02','M03','M06','M14','M20','M21','M30'], allowedConcepts: ['input','int','if','elif','else','comparison'], allowedCommands: ['ativar_alavanca','entrar_portao','abrir_porta'], requiredConcepts: ['if','elif','else','comparison'], requireInputContext: true,
            regions: [
                { id: 'start', label: 'Região da chave', row: 8, column: 1, width: 6, height: 3, color: 0x294f7a },
                { id: 'hall', label: 'Salão dos três portões', row: 4, column: 3, width: 8, height: 4, color: 0x4b4e83 },
                { id: 'sun', label: 'Caminho do Sol', row: 3, column: 11, width: 4, height: 2, color: 0x80652d },
                { id: 'moon', label: 'Caminho da Lua', row: 3, column: 14, width: 1, height: 5, color: 0x315d8b },
                { id: 'shadow', label: 'Caminho da Sombra', row: 8, column: 10, width: 5, height: 1, color: 0x553d69 },
                { id: 'final', label: 'Câmara final', row: 1, column: 14, width: 3, height: 2, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '18 x 12', structure: 'região inicial, salão central e três rotas teleportadas que convergem na câmara final', areas: 6, curves: 14 },
            entities: [
                { id: 'key', type: 'key', row: 8, column: 3 },
                { id: 'lever', type: 'lever', row: 10, column: 6, flag: 'leverDone' },
                { id: 'power_pedestal', type: 'pedestal', row: 6, column: 6 },
                { id: 'portal1', type: 'portal', value: 1, label: 'sombra', row: 6, column: 3, requiresKey: true, requires: ['leverDone'], flag: 'correctPortal', target: { row: 8, column: 10, facing: 'LESTE' } },
                { id: 'portal2', type: 'portal', value: 2, label: 'lua', row: 3, column: 6, requiresKey: true, requires: ['leverDone'], flag: 'correctPortal', target: { row: 6, column: 14, facing: 'NORTE' } },
                { id: 'portal3', type: 'portal', value: 3, label: 'sol', row: 6, column: 10, requiresKey: true, requires: ['leverDone'], flag: 'correctPortal', target: { row: 3, column: 11, facing: 'LESTE' } },
                { id: 'gate', type: 'gate', row: 2, column: 15, requiresKey: true, requires: ['leverDone','correctPortal'] }
            ],
            objectives: [
                { type: 'has_key', label: 'Resolva o desvio da chave' },
                { type: 'flag', flag: 'leverDone', label: 'Ative a alavanca da região inicial' },
                { type: 'used_concept', concept: 'if', label: 'Inicie a classificação com if' },
                { type: 'used_concept', concept: 'elif', label: 'Classifique com if/elif/else' },
                { type: 'used_concept', concept: 'else', label: 'Mantenha uma rota alternativa com else' },
                { type: 'used_concept', concept: 'comparison', label: 'Compare o poder com os dois limiares' },
                { type: 'flag', flag: 'correctPortal', label: 'Entre no portão escolhido pela classificação' },
                { type: 'entity_state', entityId: 'gate', state: 'open', label: 'Abra o portão da câmara final' },
                { type: 'reach_exit', label: 'Alcance o cristal da unidade' },
                { type: 'budget', label: 'Respeite o orçamento de 45 instruções' }
            ],
            codigoInicial: '# Boss da Unidade 3\n# prepare chave e alavanca antes da classificação',
            officialSolution: 'andar_frente(2)\nvirar_esquerda()\nandar_frente(2)\nvirar_direita()\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nandar_frente(3)\nativar_alavanca()\nvirar_esquerda()\nandar_frente(4)\npoder = int(input("Poder da runa: "))\nif poder >= 20:\n    virar_direita()\n    andar_frente(4)\n    entrar_portao(3)\n    andar_frente(3)\n    virar_esquerda()\n    andar_frente()\n    virar_direita()\nelif poder >= 10:\n    andar_frente(3)\n    entrar_portao(2)\n    andar_frente(4)\n    virar_direita()\nelse:\n    virar_esquerda()\n    andar_frente(3)\n    entrar_portao(1)\n    andar_frente(4)\n    virar_esquerda()\n    andar_frente(6)\n    virar_direita()\nabrir_porta("gate")\nandar_frente(2)',
            officialCases: [{ inputs: ['25'], label: 'Sol' }, { inputs: ['15'], label: 'Lua' }, { inputs: ['5'], label: 'Sombra' }],
            solutionExplanation: 'Os três ramos levam a regiões distintas e convergem diante do mesmo portão final.', testInputs: ['25']
        }),
        activity({
            id: 16, titulo: 'ATIVIDADE 16 — A PONTE DOS ECOS', nome: 'A Ponte dos Ecos', concept: 'for + range()',
            descricao: 'Percorra a galeria de totens e materialize uma ponte segmentada com repetição contada.', tutorial: true,
            mapa: mapRows([
                '############',
                '#S...#######',
                '####.#######',
                '####......##',
                '#########.##',
                '#########.##',
                '######X...##',
                '############'
            ]),
            mechanics: ['M08','M26'], allowedConcepts: ['for','range'], allowedCommands: ['ativar_runa'], requiredConcepts: ['for'],
            regions: [
                { id: 'start', label: 'Sala de entrada', row: 1, column: 1, width: 4, height: 1, color: 0x294f7a },
                { id: 'totems', label: 'Galeria dos Ecos', row: 3, column: 4, width: 5, height: 1, color: 0x4b4e83 },
                { id: 'bridge', label: 'Ponte segmentada', row: 3, column: 9, width: 1, height: 4, color: 0x584b3a },
                { id: 'final', label: 'Margem final', row: 6, column: 6, width: 4, height: 1, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '12 x 8', structure: 'entrada em L, galeria visual de cinco totens, ponte em curva e margem final', areas: 4, curves: 4 },
            entities: [
                { id: 't1', type: 'totem', row: 3, column: 4, symbol: '1', connections: [{ targetId: 'bridge1', activeState: 'active' }] },
                { id: 't2', type: 'totem', row: 3, column: 5, symbol: '2', connections: [{ targetId: 'bridge2', activeState: 'active' }] },
                { id: 't3', type: 'totem', row: 3, column: 6, symbol: '3', connections: [{ targetId: 'bridge3', activeState: 'active' }] },
                { id: 't4', type: 'totem', row: 3, column: 7, symbol: '4', connections: [{ targetId: 'bridge4', activeState: 'active' }] },
                { id: 't5', type: 'totem', row: 3, column: 8, symbol: '5', connections: [{ targetId: 'bridge5', activeState: 'active' }] },
                { id: 'bridge1', type: 'bridge_segment', row: 4, column: 9 },
                { id: 'bridge2', type: 'bridge_segment', row: 5, column: 9 },
                { id: 'bridge3', type: 'bridge_segment', row: 6, column: 9 },
                { id: 'bridge4', type: 'bridge_segment', row: 6, column: 8 },
                { id: 'bridge5', type: 'bridge_segment', row: 6, column: 7 }
            ],
            objectives: [
                { type: 'used_concept', concept: 'for', label: 'Use for com range()' },
                { type: 'entity_state', entityId: 't5', state: 'active', label: 'Ative os cinco totens em sequência' },
                { type: 'entity_state', entityId: 'bridge5', state: 'active', label: 'Complete visualmente a ponte segmentada' },
                { type: 'reach_exit', label: 'Contorne a ponte e alcance o cristal' }
            ],
            tutorialSteps: [
                { title: 'VER — chegar à galeria', message: 'Use orientação para alcançar o primeiro totem.', code: 'andar_frente(3)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()', condition: { minimumPosition: { linha: 3, coluna: 4 } } },
                { title: 'COMPLETAR — cinco ecos', message: 'Uma iteração ativa um totem e avança ao próximo.', code: 'andar_frente(3)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nfor i in range(5):\n    ativar_runa()\n    andar_frente()', condition: { flag: 'runesActivated' } },
                { title: 'ESCREVER — atravessar', message: 'Use a ponte que o laço materializou e chegue ao cristal.', code: 'andar_frente(3)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nfor i in range(5):\n    ativar_runa()\n    andar_frente()\nvirar_direita()\nandar_frente(3)\nvirar_direita()\nandar_frente(3)' }
            ],
            codigoInicial: 'andar_frente(3)\n# encontre a galeria dos ecos',
            officialSolution: 'andar_frente(3)\nvirar_direita()\nandar_frente(2)\nvirar_esquerda()\nfor i in range(5):\n    ativar_runa()\n    andar_frente()\nvirar_direita()\nandar_frente(3)\nvirar_direita()\nandar_frente(3)',
            solutionExplanation: 'Cada iteração ativa um totem diferente e um segmento correspondente; a rota então dobra duas vezes sobre a ponte.', testInputs: []
        }),
        activity({
            id: 17, titulo: 'ATIVIDADE 17 — A CÂMARA DOS RUBIS', nome: 'A Câmara dos Rubis', concept: 'for + acumulador',
            descricao: 'Percorra um circuito em espiral, colete cinco rubis e use o acumulador na porta final.',
            mapa: mapRows([
                '##############',
                '#S...#########',
                '####.#########',
                '####.#########',
                '##......######',
                '##.#.##.######',
                '##.#..#.######',
                '##.##.#.######',
                '##....#X######',
                '##############'
            ]),
            mechanics: ['M06','M24','M30'], allowedConcepts: ['for','range','if','comparison'], allowedCommands: ['coletar_rubi','abrir_porta'], requiredConcepts: ['for'],
            regions: [
                { id: 'entry', label: 'Galeria de entrada', row: 1, column: 1, width: 4, height: 4, color: 0x294f7a },
                { id: 'ruby_a', label: 'Alcova dos rubis 1–2', row: 6, column: 4, width: 2, height: 1, color: 0x713c50 },
                { id: 'ruby_b', label: 'Curva dos rubis 3–4', row: 6, column: 2, width: 4, height: 3, color: 0x6d3a51 },
                { id: 'ruby_c', label: 'Ala do rubi 5', row: 4, column: 2, width: 6, height: 1, color: 0x80652d },
                { id: 'final', label: 'Porta acumuladora', row: 4, column: 7, width: 1, height: 5, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '14 x 10', structure: 'entrada, circuito crescente por cinco posições e corredor final selado', areas: 5, curves: 7 },
            entities: [
                { id: 'r1', type: 'coin', row: 6, column: 4, manualCollect: true },
                { id: 'r2', type: 'coin', row: 6, column: 5, manualCollect: true },
                { id: 'r3', type: 'coin', row: 8, column: 5, manualCollect: true },
                { id: 'r4', type: 'coin', row: 8, column: 2, manualCollect: true },
                { id: 'r5', type: 'coin', row: 4, column: 2, manualCollect: true },
                { id: 'door', type: 'door', row: 5, column: 7 }
            ],
            objectives: [
                { type: 'used_concept', concept: 'for', label: 'Percorra o padrão usando for' },
                { type: 'coins', count: 5, label: 'Colete fisicamente os 5 rubis' },
                { type: 'variable_equals', name: 'total', value: 5, label: 'Mantenha o acumulador total igual a 5' },
                { type: 'entity_state', entityId: 'door', state: 'open', label: 'Use o acumulador para abrir a porta' },
                { type: 'reach_exit', label: 'Alcance o cristal' }
            ],
            codigoInicial: 'andar_frente(3)\nvirar_direita()\nandar_frente(5)\nvirar_esquerda()\ntotal = 0\n# percorra o circuito de rubis',
            officialSolution: 'andar_frente(3)\nvirar_direita()\nandar_frente(5)\nvirar_esquerda()\ntotal = 0\nfor i in range(5):\n    coletar_rubi()\n    total += 1\n    andar_frente(i + 1)\n    virar_direita()\nif total == 5:\n    abrir_porta("door")\nandar_frente(4)',
            solutionExplanation: 'As distâncias 1, 2, 3, 4 e 5 formam um circuito espacial; o acumulador libera a porta ao final.', testInputs: []
        }),
        activity({
            id: 18, titulo: 'ATIVIDADE 18 — O CORREDOR DAS PLACAS', nome: 'O Corredor das Placas', concept: 'while e condição de continuidade',
            descricao: 'Atravesse câmaras em zigue-zague, neutralizando uma armadilha por iteração e usando as zonas seguras.',
            mapa: mapRows([
                '################',
                '#S..############',
                '##^.############',
                '###...##########',
                '####^.##########',
                '#####...########',
                '######^.########',
                '#######...######',
                '########^.######',
                '#########....X##',
                '################'
            ]),
            mechanics: ['M02','M09','M12','M30'], allowedConcepts: ['while'], allowedCommands: ['corredor_continua','desativar_armadilha'], requiredConcepts: ['while'],
            regions: [
                { id: 'entry', label: 'Entrada segura', row: 1, column: 1, width: 3, height: 1, color: 0x294f7a },
                { id: 'zone1', label: 'Zona segura 1', row: 3, column: 3, width: 3, height: 1, color: 0x385f48 },
                { id: 'zone2', label: 'Zona segura 2', row: 5, column: 5, width: 3, height: 1, color: 0x385f48 },
                { id: 'zone3', label: 'Zona segura 3', row: 7, column: 7, width: 3, height: 1, color: 0x385f48 },
                { id: 'final', label: 'Saída do zigue-zague', row: 9, column: 9, width: 5, height: 1, color: 0x80652d }
            ],
            mapDesign: { dimensions: '16 x 11', structure: 'quatro pequenas câmaras diagonais, placas alternadoras, riscos laterais e saída reta curta', areas: 5, curves: 8 },
            entities: [
                { id: 'h1', type: 'hazard', row: 1, column: 2 },
                { id: 'h2', type: 'hazard', row: 3, column: 4 },
                { id: 'h3', type: 'hazard', row: 5, column: 6 },
                { id: 'h4', type: 'hazard', row: 7, column: 8 },
                { id: 'p1', type: 'toggle_plate', row: 3, column: 3, connections: [{ targetId: 'side1', activeState: 'inactive' }] },
                { id: 'p2', type: 'toggle_plate', row: 5, column: 5, connections: [{ targetId: 'side2', activeState: 'inactive' }] },
                { id: 'p3', type: 'toggle_plate', row: 7, column: 7, connections: [{ targetId: 'side3', activeState: 'inactive' }] },
                { id: 'p4', type: 'toggle_plate', row: 9, column: 9, connections: [{ targetId: 'side4', activeState: 'inactive' }] },
                { id: 'side1', type: 'hazard', row: 2, column: 2 },
                { id: 'side2', type: 'hazard', row: 4, column: 4 },
                { id: 'side3', type: 'hazard', row: 6, column: 6 },
                { id: 'side4', type: 'hazard', row: 8, column: 8 }
            ],
            objectives: [
                { type: 'used_concept', concept: 'while', label: 'Use while com o sensor orientado' },
                { type: 'entity_state', entityId: 'h4', state: 'inactive', label: 'Desative as quatro armadilhas do eixo' },
                { type: 'entity_state', entityId: 'p4', state: 'on', label: 'Alcance todas as zonas seguras' },
                { type: 'reach_exit', label: 'Conclua o zigue-zague e alcance o cristal' }
            ],
            codigoInicial: 'while corredor_continua():\n    # neutralize o perigo à frente e siga até a próxima zona',
            officialSolution: 'while corredor_continua():\n    desativar_armadilha()\n    andar_frente(2)\n    virar_direita()\n    andar_frente(2)\n    virar_esquerda()\nandar_frente(4)',
            solutionExplanation: 'Cada iteração remove o perigo frontal e desloca Guto até a próxima placa, formando o zigue-zague.', testInputs: []
        }),
        activity({
            id: 19, titulo: 'ATIVIDADE 19 — A CHAVE PERDIDA', nome: 'A Chave Perdida', concept: 'while + break',
            descricao: 'Vasculhe três câmaras de baús, interrompa a busca ao achar a chave e retorne ao eixo da porta final.', instructionBudget: 45,
            mapa: mapRows([
                '##################',
                '###.............X#',
                '###.##.####.######',
                '###.##.####.######',
                '##...#.####...####',
                '##...#.####...####',
                '##.....####...####',
                '##...#....#...####',
                '##...#....#...####',
                '##...#....#...####',
                '#S..........######',
                '##################'
            ]),
            mechanics: ['M21','M22','M23','M30'], allowedConcepts: ['while','if','break','elif','else','comparison'], allowedCommands: ['tem_bau_a_frente','abrir_bau','encontrou_chave','abrir_porta'], requiredConcepts: ['while','break'],
            regions: [
                { id: 'start', label: 'Entrada da busca', row: 10, column: 1, width: 4, height: 1, color: 0x294f7a },
                { id: 'chest1', label: 'Câmara do baú 1', row: 8, column: 2, width: 3, height: 3, color: 0x6a512f },
                { id: 'chest2', label: 'Câmara do baú 2', row: 6, column: 5, width: 5, height: 3, color: 0x75582d },
                { id: 'chest3', label: 'Câmara do baú 3', row: 4, column: 11, width: 3, height: 6, color: 0x6d3a51 },
                { id: 'return', label: 'Eixos de retorno', row: 1, column: 3, width: 9, height: 6, color: 0x4b4e83 },
                { id: 'final', label: 'Porta distante', row: 1, column: 12, width: 5, height: 1, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '18 x 12', structure: 'grande área de busca com três câmaras, eixos de retorno distintos e porta distante', areas: 6, curves: 12 },
            entities: [
                { id: 'chest1', type: 'chest', row: 10, column: 4 },
                { id: 'chest2', type: 'chest', row: 7, column: 6 },
                { id: 'chest3', type: 'chest', row: 9, column: 11 },
                { id: 'door', type: 'door', row: 1, column: 15, requiresKey: true }
            ], chestKeyVariants: ['chest1','chest2','chest3'],
            objectives: [
                { type: 'used_concept', concept: 'while', label: 'Continue a busca usando while' },
                { type: 'used_concept', concept: 'break', label: 'Interrompa a busca com break' },
                { type: 'has_key', label: 'Encontre a chave sem conhecer sua posição' },
                { type: 'entity_state', entityId: 'door', state: 'open', label: 'Retorne e abra a porta distante' },
                { type: 'reach_exit', label: 'Alcance o cristal' },
                { type: 'budget', label: 'Respeite o orçamento de 45 instruções' }
            ],
            codigoInicial: 'andar_frente(2)\ntentativa = 0\n# cada baú ocupa uma câmara diferente',
            officialSolution: 'andar_frente(2)\ntentativa = 0\nwhile tem_bau_a_frente():\n    abrir_bau()\n    if encontrou_chave():\n        break\n    tentativa += 1\n    if tentativa == 1:\n        virar_esquerda()\n        andar_frente(4)\n        virar_direita()\n        andar_frente(3)\n        virar_direita()\n    else:\n        andar_frente(4)\n        virar_esquerda()\n        andar_frente(5)\n        virar_esquerda()\nif tentativa == 0:\n    virar_esquerda()\n    andar_frente(9)\n    virar_direita()\n    andar_frente(11)\nelif tentativa == 1:\n    virar_direita()\n    virar_direita()\n    andar_frente(5)\n    virar_direita()\n    andar_frente(8)\nelse:\n    andar_frente(9)\n    virar_direita()\n    andar_frente(3)\nabrir_porta("door")\nandar_frente(2)',
            solutionExplanation: 'A busca percorre até três câmaras; break preserva a posição encontrada e cada caso usa um eixo de retorno até a porta.', testInputs: []
        }),
        activity({
            id: 20, titulo: 'ATIVIDADE 20 — O SANTUÁRIO DO BASILISCO', nome: 'O Santuário do Basilisco', concept: 'Integração final das quatro unidades',
            descricao: 'Boss final: atravesse cinco regiões conectadas e combine repetição, busca, acumulador e condição.', instructionBudget: 50,
            mapa: mapRows([
                '####################',
                '#S....##############',
                '#.....##############',
                '#......#############',
                '######.#############',
                '######.#############',
                '######...###########',
                '########.###########',
                '########.........###',
                '##########....##.#X#',
                '##########.......#.#',
                '##########.......#.#',
                '##########.........#',
                '####################'
            ]),
            mechanics: ['M02','M03','M06','M08','M09','M12','M21','M23','M24','M26','M30'],
            allowedConcepts: ['for','range','while','if','break','comparison','and'], allowedCommands: ['ativar_runa','corredor_continua','desativar_armadilha','tem_bau_a_frente','abrir_bau','encontrou_chave','coletar_rubi','rubis_coletados','tem_chave','abrir_porta'], requiredConcepts: ['for','while','break','and'],
            regions: [
                { id: 'totems', label: '1. Prova dos Totens', row: 1, column: 1, width: 6, height: 3, color: 0x4b4e83 },
                { id: 'traps', label: '2. Corredor das Armadilhas', row: 4, column: 6, width: 5, height: 5, color: 0x713c50 },
                { id: 'chests', label: '3. Câmara dos Baús', row: 8, column: 10, width: 7, height: 5, color: 0x6a512f },
                { id: 'rubies', label: '4. Câmara dos Rubis', row: 11, column: 15, width: 2, height: 2, color: 0x80652d },
                { id: 'sanctuary', label: '5. Santuário do Basilisco', row: 9, column: 18, width: 1, height: 4, color: 0x385f48 }
            ],
            mapDesign: { dimensions: '20 x 14', structure: 'cinco regiões conectadas: totens, armadilhas, baús, rubis e santuário final', areas: 5, curves: 14 },
            entities: [
                { id: 't1', type: 'totem', row: 1, column: 1, symbol: '1', connections: [{ targetId: 'bridge1', activeState: 'active' }] },
                { id: 't2', type: 'totem', row: 1, column: 3, symbol: '2', connections: [{ targetId: 'bridge2', activeState: 'active' }] },
                { id: 't3', type: 'totem', row: 3, column: 3, symbol: '3', flag: 'totemsDone', connections: [{ targetId: 'bridge3', activeState: 'active' }] },
                { id: 'bridge1', type: 'bridge_segment', row: 3, column: 4 },
                { id: 'bridge2', type: 'bridge_segment', row: 3, column: 5 },
                { id: 'bridge3', type: 'bridge_segment', row: 3, column: 6 },
                { id: 'h1', type: 'hazard', row: 5, column: 6 },
                { id: 'h2', type: 'hazard', row: 7, column: 8, flag: 'trapsDone' },
                { id: 'chest1', type: 'chest', row: 8, column: 13 },
                { id: 'chest2', type: 'chest', row: 10, column: 13 },
                { id: 'chest3', type: 'chest', row: 12, column: 13 },
                { id: 'r1', type: 'coin', row: 12, column: 16, manualCollect: true },
                { id: 'r2', type: 'coin', row: 12, column: 15, manualCollect: true },
                { id: 'r3', type: 'coin', row: 11, column: 15, manualCollect: true, flag: 'rubiesDone' },
                { id: 'basilisk', type: 'guardian', row: 11, column: 18, requiresKey: true, requires: ['totemsDone','trapsDone','rubiesDone'] }
            ], chestKeyVariants: ['chest1','chest2','chest3'],
            objectives: [
                { type: 'entity_state', entityId: 't3', state: 'active', label: 'Prova 1: complete os totens com for' },
                { type: 'entity_state', entityId: 'h2', state: 'inactive', label: 'Prova 2: atravesse as armadilhas com while' },
                { type: 'has_key', label: 'Prova 3: encontre a chave e use break' },
                { type: 'coins', count: 3, label: 'Prova 4: acumule 3 rubis' },
                { type: 'entity_state', entityId: 'basilisk', state: 'defeated', label: 'Prova 5: desative as proteções do Basilisco' },
                { type: 'used_concept', concept: 'for', label: 'Aplique for' },
                { type: 'used_concept', concept: 'while', label: 'Aplique while' },
                { type: 'used_concept', concept: 'break', label: 'Aplique break' },
                { type: 'used_concept', concept: 'and', label: 'Combine as condições finais com and' },
                { type: 'reach_exit', label: 'Alcance o cristal final' },
                { type: 'budget', label: 'Respeite o orçamento de 50 instruções' }
            ],
            codigoInicial: '# Boss final — atravesse as cinco regiões na ordem espacial',
            officialSolution: 'for i in range(3):\n    ativar_runa()\n    andar_frente(2)\n    virar_direita()\nvirar_direita()\nandar_frente(5)\nvirar_direita()\nandar_frente()\nwhile corredor_continua():\n    desativar_armadilha()\n    andar_frente(2)\n    virar_esquerda()\n    andar_frente(2)\n    virar_direita()\nvirar_esquerda()\nandar_frente(2)\ntentativa = 0\nwhile tem_bau_a_frente():\n    abrir_bau()\n    if encontrou_chave():\n        break\n    tentativa += 1\n    virar_direita()\n    andar_frente(2)\n    virar_esquerda()\nandar_frente(4)\nvirar_direita()\nandar_frente(4 - tentativa * 2)\nvirar_direita()\nfor i in range(3):\n    coletar_rubi()\n    andar_frente()\n    virar_direita()\nif tem_chave() and rubis_coletados() == 3:\n    andar_frente()\n    virar_esquerda()\n    andar_frente(2)\n    virar_esquerda()\n    abrir_porta("basilisk")\n    andar_frente(3)',
            solutionExplanation: 'As cinco provas ocupam regiões próprias; o código controla a passagem física entre elas e só libera o santuário após chave e três rubis.', testInputs: []
        })
    ];
})();
