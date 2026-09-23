(function () {
    'use strict';
    function done (scene, objective, analysis, environment) {
        const state = scene.runState;
        analysis = state.runtimeAnalysis || analysis;
        switch (objective.type) {
        case 'search_stop': return state.searchLog?.length>0 && state.searchLog.at(-1).found && state.searchLog.filter(x=>x.found).length===1;
        case 'discovered': return Boolean(scene.discoveryState?.inscriptions[objective.id]);
        case 'illuminated': return Boolean(scene.discoveryState?.litRooms[objective.id]);
        case 'visited': return Boolean(scene.discoveryState?.regions[objective.id]);
        case 'command_context': return state.actions?.some(a=>a.name===objective.command && a.accepted && (objective.loop ? a.loop>0 && (!objective.loopType || a.loopTypes?.includes(objective.loopType)) : a.condition>0));
        case 'variable_movement': return state.actions?.some(a=>a.name==='andar_frente' && a.variableArgument && a.args[0]>0);
        case 'reassigned': return state.assignments?.some(a=>a.previous!==undefined && a.previous!==a.value && state.actions?.some(x=>x.name==='andar_frente' && x.order>a.order && x.variables?.includes(a.name)));
        case 'accumulator': return state.assignments?.some(a=>a.loop>0 && a.previous!==undefined && a.value===objective.value && a.value!==a.previous);
        case 'reach_exit': return Boolean(state.reachedExit);
        case 'used_concept': return Boolean(analysis && analysis.concepts.has(objective.concept));
        case 'used_command': return Boolean(analysis && analysis.commands.has(objective.command));
        case 'output_equals': return state.outputs.some((value) => window.DungeonSystem.outputMatches(scene, value, objective.value));
        case 'entity_state': { const entity = window.DungeonSystem.getEntity(scene, objective.entityId); return Boolean(entity && entity.state === objective.state); }
        case 'flag': return Boolean(state.flags[objective.flag]);
        case 'has_key': return Boolean(state.hasKey);
        case 'coins': return state.coinsPending >= objective.count;
        case 'variable_equals': return environment && environment[objective.name] === objective.value;
        case 'budget': return Boolean(scene.budgetResult && scene.budgetResult.valid);
        default: return false;
        }
    }
    window.MissionObjectiveSystem = {
        reset (scene) { scene.objectiveStatuses = (scene.atividade.objectives || []).map((objective) => ({ ...objective, completed: false })); if (window.GameUI) window.GameUI.atualizarObjetivos(scene); },
        avaliar (scene, analysis, environment) { const statuses = (scene.atividade.objectives || []).map((objective) => ({ ...objective, completed: done(scene, objective, analysis, environment) })); scene.objectiveStatuses = statuses; if (window.GameUI) window.GameUI.atualizarObjetivos(scene); const pending = statuses.filter((item) => !item.completed); return { statuses, pending, allRequiredCompleted: statuses.length > 0 && pending.length === 0 }; }
    };
})();
