(function () {
    'use strict';
    // Player-facing facts, deliberately independent of solutions and testInputs.
    const DATA = {
        1: ['Guto começa olhando para Leste. Cada casa caminhável corresponde a um passo.'],
        2: ['Reatribuir é guardar um novo valor no mesmo nome de variável.'],
        3: ['As grades bloqueiam a passagem entre duas casas, mesmo quando ambas têm piso.'],
        4: ['A lava é letal. Uma colisão com parede ou grade apenas interrompe o programa.'],
        5: ['Planeje as curvas antes de executar. O orçamento conta instruções, inclusive na mesma linha.'],
        6: ['Palavra gravada: AURORA', 'Produza a palavra junto à runa. A grade abre automaticamente.'],
        7: ['Palavra gravada: CORAGEM', 'Receba a palavra no pedestal e envie-a à runa com print(). Depois interaja com o Guardião e com a porta, quando estiver perto de cada um.'],
        8: ['Grupos: 2 · Segmentos por grupo: 3', 'A inscrição pede o produto: grupos × segmentos. Acione a alavanca antes de enviar o total à runa.'],
        9: ['Primeira runa: 2 · Segunda runa: 3', 'Some as duas runas. O resultado identifica o espelho e a distância a partir do pedestal. Caminhe até o espelho para entrar nele.'],
        10: ['Runa A: 1 · Runa B: 2 · Runa C: 3', 'Inscrição da ponte: A × B. Inscrição final: (A × B) + C. Envie cada resultado junto à runa correspondente.'],
        11: ['A chave está no desvio. Os dois bloqueios exigem a chave e interação próxima.'],
        12: ['Placa ON: rota superior segura. Placa OFF: rota inferior segura.', 'Consulte placa_ativa() na bifurcação. A placa fica no desvio; seu estado inicial pode variar.'],
        13: ['Energia da runa: 12', 'Primeiro Guardião: energia maior ou igual a 10. Segundo Guardião: energia diferente de 0.', 'Converta a entrada em número. Cada Guardião abre a porta conectada quando você interage perto dele.'],
        14: ['Selo principal: alavanca azul E alavanca verde. Passagem secundária: azul OU verde.', 'A placa alterna os espinhos a cada nova pisada. As alavancas mantêm o estado até novo acionamento.'],
        15: ['Poder da runa: 25', 'Sol (3): poder ≥ 20. Lua (2): 10 ≤ poder < 20. Sombra (1): poder < 10.', 'Os portões exigem chave e alavanca. Caminhe até o portão correspondente antes de entrar.'],
        16: ['A galeria tem 5 totens. Cada ativação constrói um segmento da ponte.'],
        17: ['A porta pede 5 rubis. O acumulador desta atividade deve se chamar total e terminar com 5.', 'Colete no tile do rubi. Observe o padrão de distâncias no circuito.'],
        18: ['corredor_continua() verifica perigo ativo à frente. desativar_armadilha() age no perigo à frente.', 'As placas do percurso alternam os perigos laterais. Observe as curvas entre as zonas seguras.'],
        19: ['A chave está em um dos 3 baús; a posição varia entre sessões. Ela só é revelada ao abrir o baú.', 'Abrir um baú exige estar nele ou olhar para ele na casa anterior. Interrompa a busca quando encontrar a chave.'],
        20: ['Provas: 3 totens, armadilhas, busca em 3 baús e coleta de 3 rubis.', 'A proteção final exige chave, totens completos, armadilhas neutralizadas e rubis coletados.']
    };
    const COMMANDS = {
        examinar: ['examinar()', 'Lê a inscrição no tile de Guto ou à frente e registra no Diário.'],
        ativar_interruptor: ['ativar_interruptor()', 'Acende as salas ligadas a um interruptor próximo. A luz permanece entre execuções.'],
        andar_frente: ['andar_frente(n)', 'Avança n casas na direção atual; sem n, avança uma.'],
        virar_direita: ['virar_direita()', 'Gira 90° para a direita, sem deslocar Guto.'],
        virar_esquerda: ['virar_esquerda()', 'Gira 90° para a esquerda, sem deslocar Guto.'],
        abrir_porta: ['abrir_porta("id")', 'Interage com porta, grade ou Guardião próximo. O id é opcional quando não há ambiguidade.'],
        ativar_alavanca: ['ativar_alavanca("id")', 'Alterna uma alavanca próxima. O id é opcional.'],
        entrar_espelho: ['entrar_espelho(valor)', 'Entra no espelho cujo tile Guto ocupa.'],
        entrar_portao: ['entrar_portao(valor)', 'Entra no portão cujo tile Guto ocupa.'],
        ativar_runa: ['ativar_runa()', 'Ativa um totem/runa no tile de Guto ou à frente.'],
        coletar_rubi: ['coletar_rubi()', 'Coleta o rubi no tile de Guto.'],
        abrir_bau: ['abrir_bau()', 'Abre o baú no tile de Guto ou à frente.'],
        desativar_armadilha: ['desativar_armadilha()', 'Desativa o perigo que está à frente.']
    };
    const SENSORS = {
        tem_chave: 'Informa se Guto possui a chave.', encontrou_chave: 'Informa se a busca encontrou a chave.',
        placa_ativa: 'Informa se existe uma placa ligada.', alavanca_azul_ativa: 'Lê a alavanca azul.', alavanca_verde_ativa: 'Lê a alavanca verde.',
        corredor_continua: 'Informa se há perigo ativo à frente.', tem_bau_a_frente: 'Detecta um baú fechado à frente.', rubis_coletados: 'Retorna os rubis desta execução.'
    };
    const PYTHON = { print: 'print()', input: 'input()', int: 'int()', range: 'range()', comparison: '== != > < >= <=', if: 'if', elif: 'elif', else: 'else', and: 'and', or: 'or', not: 'not', for: 'for', while: 'while', break: 'break' };
    window.ActivityGuide = {
        data (id) { const activity=window.ACTIVITIES.find(a=>a.id===id); return activity?.v3 ? activity.guide || [] : DATA[id] || []; },
        resources (activity) {
            return {
                python: ['variáveis', '+ - * /', ...(activity.allowedConcepts || []).map((name) => PYTHON[name] || name)],
                commands: (activity.allowedCommands || []).filter((name) => COMMANDS[name]).map((name) => ({ name, syntax: COMMANDS[name][0], description: COMMANDS[name][1] })),
                sensors: (activity.allowedCommands || []).filter((name) => !COMMANDS[name]).map((name) => ({ name, syntax: name + '()', description: SENSORS[name] || 'Consulta o estado atual da dungeon.' }))
            };
        }
    };
})();
