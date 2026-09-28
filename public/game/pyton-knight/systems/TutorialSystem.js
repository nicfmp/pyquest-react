(function () {
    'use strict';
    function conditionMet (scene, condition, analysis) {
        if (!condition) return true;
        if (condition.usedCommand && !analysis.commands.has(condition.usedCommand)) return false;
        if (condition.usedConcept && !analysis.concepts.has(condition.usedConcept)) return false;
        if (condition.flag && !scene.runState.flags[condition.flag]) return false;
        if (condition.minimumPosition) {
            if (scene.gutoPosition.linha < condition.minimumPosition.linha || scene.gutoPosition.coluna < condition.minimumPosition.coluna) return false;
        }
        return true;
    }
    window.TutorialSystem = {
        inicializar (scene) { if (!scene.atividade.tutorialSteps) return; scene.tutorialStepIndex = Number.isInteger(scene.tutorialStepIndex) ? scene.tutorialStepIndex : 0; const step = scene.atividade.tutorialSteps[scene.tutorialStepIndex]; if (step && scene.editorTexto && !scene.atividade.v6) scene.editorTexto.value = step.code; if (window.GameUI) window.GameUI.atualizarTutor(scene); },
        processarExecucao (scene, analysis) {
            const steps = scene.atividade.tutorialSteps;
            if (scene.atividade.v6) {
                // Guidance is observational. It cannot reset a completed world or write code.
                if (steps) { while(scene.tutorialStepIndex < steps.length-1 && conditionMet(scene,steps[scene.tutorialStepIndex].condition,analysis)) scene.tutorialStepIndex++; window.GameUI?.atualizarTutor(scene); }
                return {handled:false};
            }
            if (!steps || scene.tutorialStepIndex >= steps.length - 1) return { handled: false };
            const current = steps[scene.tutorialStepIndex];
            if (!conditionMet(scene, current.condition, analysis)) return { handled: true, result: { cause: window.GAME_CONSTANTS.TERMINOS.INCOMPLETE_EXECUTION, message: 'A microetapa ainda não foi cumprida.' } };
            scene.tutorialStepIndex++; window.DungeonSystem.resetRun(scene); const next = steps[scene.tutorialStepIndex]; if (scene.editorTexto) scene.editorTexto.value = next.code; if (window.GameUI) window.GameUI.atualizarTutor(scene);
            return { handled: true, result: { cause: window.GAME_CONSTANTS.TERMINOS.TUTORIAL_STEP_COMPLETE, message: current.successMessage || `Etapa concluída. Agora: ${next.title}.` } };
        }
    };
})();
