(function () {
    'use strict';
    class PytonKnightRuntimeError extends Error { constructor (cause, message, lineNumber) { super(message); this.name = 'PytonKnightRuntimeError'; this.cause = cause; this.lineNumber = lineNumber || null; } }
    const API = new Set([
        'andar_frente', 'virar_direita', 'virar_esquerda', 'print', 'input', 'int', 'range',
        'ativar_alavanca', 'abrir_porta', 'entrar_espelho', 'entrar_portao', 'ativar_runa',
        'coletar_rubi', 'abrir_bau', 'desativar_armadilha', 'tem_chave', 'porta_aberta',
        'porta_final_bloqueada', 'armadilha_ativa', 'tem_armadilha_a_frente', 'tem_placa_a_frente',
        'placa_ativa', 'alavanca_ativa', 'alavanca_azul_ativa', 'alavanca_verde_ativa',
        'ponte_ativa', 'tem_bau_a_frente', 'encontrou_chave', 'caminho_livre',
        'interruptor_ativo', 'moedas_coletadas', 'rubis_coletados', 'corredor_continua', 'examinar', 'ativar_interruptor', 'sala_iluminada', 'tem_inscricao_a_frente'
    ]);
    function clone (value) { return JSON.parse(JSON.stringify(value || [])); }
    function defaultState (type) { return ({ door: 'closed', gate: 'closed', lever: 'off', pressure_plate: 'off', toggle_plate: 'off', hazard: 'active', key: 'available', coin: 'available', output_rune: 'off', bridge: 'inactive', bridge_segment: 'inactive', mirror: 'inactive', portal: 'available', chest: 'closed', guardian: 'blocking', pedestal: 'waiting', totem: 'inactive', basilisk: 'protected' })[type] || 'idle'; }
    function matchesRequested (entity, requested) {
        if (requested === undefined || requested === null || requested === '') return true;
        return entity.id === requested || String(entity.value) === String(requested) || String(entity.label || '').toLowerCase() === String(requested).toLowerCase();
    }
    function positionKind (scene, entity) {
        const row = scene.gutoPosition.linha; const column = scene.gutoPosition.coluna;
        if (entity.row === row && entity.column === column) return 'same';
        const vector = window.GAME_CONSTANTS.VETORES_ORIENTACAO[scene.playerFacing];
        if (entity.row === row + vector.linha && entity.column === column + vector.coluna) return 'ahead';
        if (Math.abs(entity.row - row) + Math.abs(entity.column - column) === 1) return 'adjacent';
        return 'remote';
    }
    function contextualEntity (scene, types, requested, excluded, allowedPositions) {
        const list = Array.isArray(types) ? types : [types];
        const allowed = allowedPositions || ['same', 'ahead', 'adjacent'];
        const priority = { same: 0, ahead: 1, adjacent: 2, remote: 3 };
        return scene.runState.entities
            .filter((entity) => list.includes(entity.type) && !(excluded || []).includes(entity.state) && matchesRequested(entity, requested) && allowed.includes(positionKind(scene, entity)))
            .sort((a, b) => priority[positionKind(scene, a)] - priority[positionKind(scene, b)])[0] || null;
    }
    function entityAhead (scene, types, excluded) {
        return contextualEntity(scene, types, undefined, excluded, ['ahead']);
    }
    function requireEntity (scene, types, requested, excluded, allowedPositions, action, line) {
        const entity = contextualEntity(scene, types, requested, excluded, allowedPositions);
        if (entity) return entity;
        throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, `${action} exige que Guto esteja na posição correta da entidade.`, line);
    }
    function applyConnections (scene, entity, active) {
        (entity.connections || []).forEach((connection) => {
            const target = window.DungeonSystem.getEntity(scene, connection.targetId);
            if (target) target.state = active ? (connection.activeState || 'open') : (connection.inactiveState || defaultState(target.type));
        });
    }
    function requirementsMet (scene, entity) {
        if (scene.atividade.v3 && window.MechanismSystem) return window.MechanismSystem.requirements(scene, entity);
        const flags = scene.runState.flags;
        if (entity.requiresKey && !scene.runState.hasKey) return false;
        if (entity.requires && !entity.requires.every((flag) => Boolean(flags[flag]))) return false;
        if (entity.requiresAny && !entity.requiresAny.some((flag) => Boolean(flags[flag]))) return false;
        return true;
    }
    function refresh (scene) { if (window.MapRenderer) window.MapRenderer.atualizarEntidades(scene); if (scene.runState.analysis && window.MissionObjectiveSystem) window.MissionObjectiveSystem.avaliar(scene, scene.runState.analysis, scene.runState.environment); if (window.GameUI) { window.GameUI.atualizarObjetivos(scene); window.GameUI.atualizarMoedasDaExecucao(scene); } }
    function pythonText (value) { return value === true ? 'True' : value === false ? 'False' : value === null ? 'None' : String(value); }
    window.DungeonSystem = {
        PytonKnightRuntimeError,
        isKnownApi (name) { return API.has(name); },
        outputMatches (scene, value, expected) {
            // Only the two inscription puzzles normalize outer whitespace.
            // input(), variables, print's console output and Python == stay exact.
            const wordPuzzle = (scene.atividade.id === 6 && expected === 'AURORA') || (scene.atividade.id === 7 && expected === 'CORAGEM');
            return (wordPuzzle ? String(value).trim() : String(value)) === String(expected);
        },
        getEntity (scene, id) { return scene.runState.entities.find((entity) => entity.id === id) || null; },
        resetRun (scene) {
            const activity = scene.atividade;
            const entities = clone(activity.entities).map((entity) => ({ ...entity, state: entity.initialState || defaultState(entity.type) }));
            if (activity.chestKeyVariants) {
                const selected = activity.chestKeyVariants[(scene.sessionVariantIndex || 0) % activity.chestKeyVariants.length];
                entities.filter((entity) => entity.type === 'chest').forEach((entity) => { entity.content = entity.id === selected ? 'key' : 'empty'; });
            }
            if (activity.variantStates) {
                const variant = activity.variantStates[(scene.sessionVariantIndex || 0) % activity.variantStates.length];
                (variant || []).forEach((change) => { const entity = entities.find((item) => item.id === change.entityId); if (entity) entity.state = change.state; });
            }
            if(activity.v3) entities.forEach(e=>{ if(e.variantMinTraps) e.minTraps=e.variantMinTraps[(scene.sessionVariantIndex||0)%e.variantMinTraps.length]; if(e.variantTexts) e.text=e.variantTexts[(scene.sessionVariantIndex||0)%e.variantTexts.length]; if(e.variantInputs) e.expectedInput=e.variantInputs[(scene.sessionVariantIndex||0)%e.variantInputs.length]; });
            scene.budgetResult = null;
            scene.runState = { entities, answers: {}, outputs: [], inputs: [], inputsByPedestal: {}, sequences: {}, worldTick: 0, traceOrder: 0, actions: [], assignments: [], searchLog: [], coinsPending: 0, flags: { ...(activity.initialFlags || {}) }, hasKey: false, reachedExit: false, environment: {}, analysis: null, occupiedTile: null };
            window.CoinSystem?.restore(scene);
            scene.completionProcessed = false; window.PlayerController.reiniciar(scene); window.DiscoverySystem?.restore(scene); if (window.MapRenderer) window.MapRenderer.atualizarEntidades(scene); if (window.MissionObjectiveSystem) window.MissionObjectiveSystem.reset(scene); if (window.GameUI) window.GameUI.atualizarMoedasDaExecucao(scene);
        },
        isBlocked (scene, row, column) {
            const T = window.GAME_CONSTANTS.TERMINOS;
            if (row < 0 || row >= scene.mapa.length || column < 0 || column >= scene.mapa[0].length) return { cause: T.WALL_COLLISION, message: 'Guto tentou sair dos limites da dungeon.' };
            if (scene.atividade.v3 && scene.mapa[row][column] === window.GAME_CONSTANTS.TILE.PERIGO) return { cause:T.WALL_COLLISION, message:'O fosso de lava é cenário e não pode ser atravessado.' };
            if (scene.mapa[row][column] === window.GAME_CONSTANTS.TILE.PAREDE) return { cause: T.WALL_COLLISION, message: 'Guto tentou atravessar uma parede.' };
            const decor = scene.atividade.decorations?.find(e => e.solid && e.row === row && e.column === column);
            if (decor) return { cause:T.WALL_COLLISION, message:`${decor.label || 'Este objeto'} impede a passagem. Contorne-o; nenhuma vida foi perdida.` };
            if (window.BarrierSystem && window.BarrierSystem.existe && window.BarrierSystem.existe(scene, scene.gutoPosition.linha, scene.gutoPosition.coluna, row, column)) return { cause: T.WALL_COLLISION, message: 'Uma grade bloqueia esse caminho.' };
            const blocker = scene.runState.entities.find((entity) => entity.row === row && entity.column === column && ((['door', 'gate', 'guardian'].includes(entity.type) && !['open', 'inactive', 'defeated'].includes(entity.state)) || (['bridge', 'bridge_segment'].includes(entity.type) && !['active', 'open'].includes(entity.state)) || (entity.type === 'chest' && entity.state !== 'open')));
            if (blocker) return { cause: T.CLOSED_DOOR_BLOCK, message: 'Uma porta ou passagem ainda está fechada.' };
            return null;
        },
        lethalAt (scene, row, column) {
            if (!scene.atividade.v3 && scene.mapa[row][column] === window.GAME_CONSTANTS.TILE.PERIGO) return 'Guto entrou em um perigo letal.';
            if (scene.runState.darkDanger) return 'Guto avançou na escuridão perigosa depois do aviso. Acenda a sala antes de continuar.';
            const danger = scene.runState.entities.find((entity) => entity.row === row && entity.column === column && entity.type === 'hazard' && entity.state === 'active');
            return danger ? 'Guto foi atingido por uma armadilha ativa.' : null;
        },
        onEnter (scene, row, column) {
            const key = `${row},${column}`;
            if (scene.runState.occupiedTile === key) return;
            scene.runState.occupiedTile = key;
            scene.runState.entities.filter((entity) => entity.type === 'pressure_plate' && entity.mode !== 'sequence' && entity.state === 'on' && (entity.row !== row || entity.column !== column)).forEach((entity) => { entity.state = 'off'; scene.runState.flags[entity.flag || entity.id] = false; applyConnections(scene, entity, false); });
            if (scene.mapa[row][column] === window.GAME_CONSTANTS.TILE.SAIDA) scene.runState.reachedExit = true;
            scene.runState.entities.filter((entity) => entity.row === row && entity.column === column).forEach((entity) => {
                if (entity.type === 'key' && entity.state === 'available') { entity.state = 'collected'; scene.runState.hasKey = true; scene.runState.flags.keyCollected = true; }
                if (entity.type === 'coin' && entity.state === 'available' && !entity.manualCollect) { if (scene.atividade.v4) window.CoinSystem.collect(scene, entity); else { entity.state = 'collected'; scene.runState.coinsPending++; } if (entity.flag) scene.runState.flags[entity.flag] = true; }
                if (entity.inactivePlate) return;
                if(scene.atividade.v3 && ['pressure_plate','toggle_plate'].includes(entity.type) && entity.mode==='sequence'){window.MechanismSystem.enterSequencePlate(scene,entity);return;}
                if (entity.type === 'pressure_plate') { entity.state = 'on'; scene.runState.flags[entity.flag || entity.id] = true; applyConnections(scene, entity, true); }
                if (entity.type === 'toggle_plate' && entity.mode !== 'logic') { entity.state = entity.state === 'on' ? 'off' : 'on'; scene.runState.flags[entity.flag || entity.id] = entity.state === 'on'; applyConnections(scene, entity, entity.state === 'on'); }
            });
            if(scene.atividade.v3){ for(const e of scene.runState.entities) if(e.row===row && e.column===column && e.revealsRooms && e.state==='on') window.DiscoverySystem.reveal(scene,e.revealsRooms); window.DiscoverySystem?.onEnter(scene); }
            refresh(scene);
        },
        async callApi (scene, name, args, metadata) {
            if (scene.atividade.v3 && window.MechanismSystem) return window.MechanismSystem.call(scene,name,args,metadata,()=>this._callApi(scene,name,args,metadata));
            return this._callApi(scene,name,args,metadata);
        },
        async _callApi (scene, name, args, metadata) {
            const line = metadata && metadata.lineNumber;
            const noArguments = ['virar_direita', 'virar_esquerda', 'tem_chave', 'porta_aberta', 'porta_final_bloqueada', 'armadilha_ativa', 'tem_armadilha_a_frente', 'tem_placa_a_frente', 'placa_ativa', 'alavanca_ativa', 'alavanca_azul_ativa', 'alavanca_verde_ativa', 'ponte_ativa', 'tem_bau_a_frente', 'encontrou_chave', 'caminho_livre', 'moedas_coletadas', 'rubis_coletados', 'corredor_continua', 'examinar', 'ativar_interruptor', 'sala_iluminada', 'tem_inscricao_a_frente'];
            if ((noArguments.includes(name) && args.length) || (!['print', 'range'].includes(name) && args.length > 1)) throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, `${name}() recebeu argumentos demais.`, line);
            if (name === 'andar_frente') return window.PlayerController.andarFrente(scene, args.length ? args[0] : 1, line);
            if (name === 'virar_direita') { window.PlayerController.virar(scene, 1); return true; }
            if (name === 'virar_esquerda') { window.PlayerController.virar(scene, -1); return true; }
            if (name === 'print') {
                if (scene.atividade.requirePrintContext) requireEntity(scene, ['output_rune', 'pedestal'], undefined, [], ['same', 'ahead', 'adjacent'], 'print()', line);
                const value = args.map(pythonText).join(' '); scene.runState.outputs.push(value); if (window.GameUI) window.GameUI.adicionarConsole(scene, value);
                let matched = false;
                (scene.atividade.outputRules || []).forEach((rule) => { if ((!rule.minInputSources || (metadata?.sources||[]).length>=rule.minInputSources) && (!rule.contextId || contextualEntity(scene, ['output_rune','pedestal'], rule.contextId, [], ['same','ahead','adjacent'])) && this.outputMatches(scene, value, rule.expected) && (!rule.requires || rule.requires.every((flag) => Boolean(scene.runState.flags[flag])))) { matched = true; (rule.flags || []).forEach((flag) => { scene.runState.flags[flag] = true; }); (rule.states || []).forEach((change) => { const entity = this.getEntity(scene, change.entityId); if (entity) entity.state = change.state; }); } });
                if (!matched && scene.atividade.outputRules) { const rune = contextualEntity(scene, 'output_rune', undefined, [], ['same', 'ahead', 'adjacent']); if (rune) rune.state = 'incorrect'; if (window.GameUI) window.GameUI.definirFeedback(scene, 'A runa não reconheceu a saída. Confira os dados e os mecanismos necessários.', 'warning'); }
                refresh(scene); return null;
            }
            if (name === 'input') {
                const pedestal = scene.atividade.requireInputContext ? requireEntity(scene, 'pedestal', undefined, [], ['same', 'ahead', 'adjacent'], 'input()', line) : null;
                if (pedestal) { pedestal.state = 'receiving'; refresh(scene); }
                let value;
                if (scene.testInputQueue && scene.testInputQueue.length) value = scene.testInputQueue.shift();
                else if (window.GameUI && window.GameUI.solicitarEntrada) value = await window.GameUI.solicitarEntrada(scene, args.length ? pythonText(args[0]) : 'Digite a entrada:', pedestal);
                else value = '';
                if (pedestal) { pedestal.state = 'answered'; refresh(scene); }
                scene.runState.inputs.push(String(value)); return String(value);
            }
            if (name === 'int') {
                if (!args.length) return 0;
                const source = args[0]; let value;
                if (typeof source === 'number' && Number.isFinite(source)) value = Math.trunc(source);
                else if (typeof source === 'boolean') value = Number(source);
                else if (typeof source === 'string' && /^[+-]?\d(?:_?\d)*$/.test(source.trim())) value = Number(source.trim().replace(/_/g, ''));
                if (!Number.isSafeInteger(value)) throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, 'int() precisa de um texto inteiro válido ou de um número dentro do limite desta versão.', line);
                return value;
            }
            if (name === 'range') {
                let start = 0; let stop; let step = 1;
                if (args.length < 1 || args.length > 3 || !args.every((value) => Number.isInteger(value) || typeof value === 'boolean')) throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, 'range() aceita de um a três números inteiros. Converta textos com int().', line);
                if (args.length === 1) stop = Number(args[0]); else { start = Number(args[0]); stop = Number(args[1]); if (args.length === 3) step = Number(args[2]); }
                if (![start, stop, step].every(Number.isInteger) || step === 0) throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, 'range() precisa de inteiros e passo diferente de zero.', line);
                const values = []; for (let value = start; step > 0 ? value < stop : value > stop; value += step) { values.push(value); if (values.length > 100) throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.LOOP_GUARD_STOP, 'range() excedeu o limite seguro.', line); } return values;
            }
            if (name === 'ativar_alavanca') { const entity = requireEntity(scene, 'lever', args[0], [], ['same', 'ahead', 'adjacent'], 'ativar_alavanca()', line); const active = entity.state !== 'on'; entity.state = active ? 'on' : 'off'; scene.runState.flags[entity.flag || entity.id] = active; applyConnections(scene, entity, active); refresh(scene); return active; }
            if (name === 'abrir_porta') { const entity = requireEntity(scene, ['door', 'gate', 'guardian'], args[0], ['open', 'defeated'], ['same', 'ahead', 'adjacent'], 'abrir_porta()', line); if (!requirementsMet(scene, entity)) return false; entity.state = entity.type === 'guardian' ? 'defeated' : 'open'; scene.runState.flags[entity.flag || `${entity.id}Open`] = true; applyConnections(scene, entity, true); refresh(scene); return true; }
            if (name === 'entrar_espelho' || name === 'entrar_portao') { const entity = requireEntity(scene, name === 'entrar_espelho' ? 'mirror' : 'portal', args[0], [], ['same'], `${name}()`, line); if (!requirementsMet(scene, entity)) return false;
                if (entity.correct === false) throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, 'Este espelho não corresponde ao cálculo. A passagem não foi ativada.', line);
                if (name === 'entrar_portao' && scene.atividade.id === 15) {
                    const raw = scene.runState.inputs[scene.runState.inputs.length - 1];
                    const power = typeof raw === 'string' && /^[+-]?\d(?:_?\d)*$/.test(raw.trim()) ? Number(raw.trim().replace(/_/g, '')) : NaN;
                    const expected = Number.isSafeInteger(power) ? (power >= 20 ? 3 : power >= 10 ? 2 : 1) : null;
                    if (entity.value !== expected) {
                        scene.runState.flags.correctPortal = false;
                        const explanation = expected === 3 ? 'poder >= 20: escolha Sol (3).' : expected === 2 ? '10 <= poder < 20: escolha Lua (2).' : expected === 1 ? 'poder < 10: escolha Sombra (1).' : 'Leia um poder inteiro no pedestal antes de escolher.';
                        throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, `Portão incorreto. ${explanation}`, line);
                    }
                }
                const previous=entity.state; entity.state = 'active'; scene.runState.flags[entity.flag || `${entity.id}Used`] = true; if(scene.atividade.v3) await window.AnimationSystem.transition(scene,entity,previous,'active'); if (entity.target) { if (scene.atividade.v3) await window.AnimationSystem.teleport(scene,()=>window.PlayerController.teletransportar(scene, entity.target)); else window.PlayerController.teletransportar(scene, entity.target); } refresh(scene); return true; }
            if (name === 'ativar_runa') { const entity = requireEntity(scene, scene.atividade.v3 ? ['totem', 'output_rune'] : ['totem', 'bridge_segment', 'output_rune'], args[0], ['active', 'correct'], ['same', 'ahead'], 'ativar_runa()', line); entity.state = 'active'; scene.runState.flags[entity.flag || entity.id] = true; scene.runState.flags.runesActivated = (scene.runState.flags.runesActivated || 0) + 1; applyConnections(scene, entity, true); refresh(scene); return true; }
            if (name === 'coletar_rubi') { const entity = requireEntity(scene, scene.atividade.v4 ? 'ruby' : 'coin', args[0], ['collected'], ['same'], 'coletar_rubi()', line); entity.state = 'collected'; if (!scene.atividade.v4) scene.runState.coinsPending++; scene.runState.flags.rubiesCollected = scene.atividade.v3 ? (scene.runState.flags.rubiesCollected || 0) + 1 : scene.runState.coinsPending; if (entity.flag) scene.runState.flags[entity.flag] = true; refresh(scene); return true; }
            if (name === 'abrir_bau') { const entity = requireEntity(scene, 'chest', args[0], ['open'], ['same', 'ahead'], 'abrir_bau()', line); entity.state = 'open'; scene.runState.flags.lastChest = entity.id; scene.runState.searchLog.push({id:entity.id,found:entity.content==='key'}); if (entity.content === 'key') { scene.runState.hasKey = true; scene.runState.flags.keyFound = true; } if (scene.atividade.v3 && entity.content === 'coin') scene.runState.coinsPending++; if (scene.atividade.v3 && entity.clue) window.DiscoverySystem.examine(scene, { id:entity.id, label:entity.label || 'Fragmento do baú', text:entity.clue, row:entity.row, column:entity.column }); refresh(scene); return entity.content || 'empty'; }
            if (name === 'desativar_armadilha') { const entity = requireEntity(scene, 'hazard', args[0], ['inactive'], ['ahead'], 'desativar_armadilha()', line); entity.state = 'inactive'; scene.runState.flags.trapsDisabled = (scene.runState.flags.trapsDisabled || 0) + 1; if (entity.flag) scene.runState.flags[entity.flag] = true; refresh(scene); return true; }
            const entities = scene.runState.entities;
            if (name === 'tem_chave' || name === 'encontrou_chave') return scene.runState.hasKey;
            if (name === 'porta_aberta') return entities.some((entity) => ['door', 'gate'].includes(entity.type) && entity.state === 'open');
            if (name === 'porta_final_bloqueada') return entities.some((entity) => ['door', 'gate', 'guardian'].includes(entity.type) && !['open', 'defeated'].includes(entity.state));
            if (name === 'armadilha_ativa') return entities.some((entity) => entity.type === 'hazard' && entity.state === 'active');
            if (name === 'tem_armadilha_a_frente' || name === 'corredor_continua') { const vector = window.GAME_CONSTANTS.VETORES_ORIENTACAO[scene.playerFacing]; const row = scene.gutoPosition.linha + vector.linha; const column = scene.gutoPosition.coluna + vector.coluna; return Boolean(entityAhead(scene, 'hazard', ['inactive']) || (scene.mapa[row] && scene.mapa[row][column] === window.GAME_CONSTANTS.TILE.PERIGO)); }
            if (name === 'tem_placa_a_frente') return Boolean(entityAhead(scene, ['pressure_plate', 'toggle_plate']));
            if (name === 'placa_ativa') return entities.some((entity) => ['pressure_plate', 'toggle_plate'].includes(entity.type) && entity.state === 'on');
            if (name === 'alavanca_ativa') return entities.some((entity) => entity.type === 'lever' && entity.state === 'on');
            if (name === 'alavanca_azul_ativa') { const entity = this.getEntity(scene, 'lever_blue'); return Boolean(entity && entity.state === 'on'); }
            if (name === 'alavanca_verde_ativa') { const entity = this.getEntity(scene, 'lever_green'); return Boolean(entity && entity.state === 'on'); }
            if (name === 'ponte_ativa') return entities.some((entity) => ['bridge', 'bridge_segment'].includes(entity.type) && ['active', 'open'].includes(entity.state));
            if (name === 'tem_bau_a_frente') return Boolean(entityAhead(scene, 'chest', ['open']));
            if (name === 'caminho_livre') { const vector = window.GAME_CONSTANTS.VETORES_ORIENTACAO[scene.playerFacing]; return !this.isBlocked(scene, scene.gutoPosition.linha + vector.linha, scene.gutoPosition.coluna + vector.coluna); }
            if (name === 'rubis_coletados' && scene.atividade.v3) return scene.runState.flags.rubiesCollected || 0;
            if (name === 'moedas_coletadas' && scene.atividade.v4) return window.CoinSystem.stats(scene).collected;
            if (name === 'moedas_coletadas' || name === 'rubis_coletados') return scene.runState.coinsPending;
            throw new PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.UNKNOWN_COMMAND, `O comando ${name}() não existe.`, line);
        }
    };
})();
