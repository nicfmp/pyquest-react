(function () {
    'use strict';
    function RuntimeError (cause, message, lineNumber) { const error = new Error(message); error.cause = cause; error.lineNumber = lineNumber || null; return error; }
    function updateVisual (scene) {
        if (scene.guto && scene.guto.setPosition) scene.guto.setPosition(scene.startX + scene.gutoPosition.coluna * scene.tileSize, scene.startY + scene.gutoPosition.linha * scene.tileSize);
        if (scene.gutoFacingIndicator && scene.gutoFacingIndicator.setText) { scene.gutoFacingIndicator.setText(window.GAME_CONSTANTS.VETORES_ORIENTACAO[scene.playerFacing].simbolo); if (scene.gutoFacingIndicator.setPosition) scene.gutoFacingIndicator.setPosition(scene.startX + scene.gutoPosition.coluna * scene.tileSize, scene.startY + scene.gutoPosition.linha * scene.tileSize - scene.tileSize * 0.48); }
        if (scene.atividade.v3) window.AnimationSystem?.pose(scene);
        else if (scene.guto && scene.guto.setFlipX) scene.guto.setFlipX(scene.playerFacing === 'OESTE');
        if (window.GameUI) window.GameUI.atualizarOrientacao(scene);
    }
    async function smallDelay (scene) {
        if (scene.testMode || !scene.time || !scene.time.delayedCall) return;
        await new Promise((resolve) => scene.time.delayedCall(140, resolve));
    }
    window.PlayerController = {
        reiniciar (scene) { scene.gutoPosition = { ...scene.startPosition }; scene.playerFacing = scene.atividade.initialFacing || 'LESTE'; updateVisual(scene); },
        teletransportar (scene, target) { scene.gutoPosition = { linha: target.row, coluna: target.column }; if (target.facing) scene.playerFacing = target.facing; updateVisual(scene); window.DungeonSystem.onEnter(scene, target.row, target.column); },
        virar (scene, delta) { const list = window.GAME_CONSTANTS.ORIENTACOES; const current = list.indexOf(scene.playerFacing); scene.playerFacing = list[(current + delta + list.length) % list.length]; updateVisual(scene); },
        async andarFrente (scene, amount, lineNumber) {
            const steps = amount === undefined ? 1 : amount;
            if (!Number.isInteger(steps) || steps < 0 || steps > window.GAME_CONSTANTS.LIMITES_EXECUCAO.MAX_PASSOS_POR_COMANDO) throw RuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, `andar_frente() aceita um inteiro entre 0 e ${window.GAME_CONSTANTS.LIMITES_EXECUCAO.MAX_PASSOS_POR_COMANDO}.`, lineNumber);
            for (let index = 0; index < steps; index++) {
                if (scene.cancelRequested) throw RuntimeError('EXECUTION_CANCELLED', 'Execução interrompida. O código foi preservado.', lineNumber);
                const vector = window.GAME_CONSTANTS.VETORES_ORIENTACAO[scene.playerFacing];
                const row = scene.gutoPosition.linha + vector.linha; const column = scene.gutoPosition.coluna + vector.coluna;
                const issue = window.DungeonSystem.isBlocked(scene, row, column);
                if (issue) throw RuntimeError(issue.cause, issue.message, lineNumber);
                if (scene.atividade.v3) await window.AnimationSystem.move(scene,row,column);
                const previousStates=scene.atividade.v3 ? new Map(scene.runState.entities.map(e=>[e.id,e.state])) : null;
                scene.gutoPosition = { linha: row, coluna: column }; updateVisual(scene); window.DungeonSystem.onEnter(scene, row, column);
                if(scene.atividade.v3 && scene.playerAnimation?.startsWith('fear_')) await window.AnimationSystem.fear(scene);
                if (scene.atividade.v3) await window.MechanismSystem.afterMove(scene,previousStates); else await smallDelay(scene);
                const lethal = window.DungeonSystem.lethalAt(scene, row, column);
                if (lethal) throw RuntimeError(window.GAME_CONSTANTS.TERMINOS.HAZARD_DEATH, lethal, lineNumber);
            }
            return true;
        }
    };
})();
