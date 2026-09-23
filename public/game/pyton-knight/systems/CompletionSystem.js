(function () {
    'use strict';
    const PEDAGOGICAL = new Set(['used_concept','used_command','command_context','variable_movement','reassigned','accumulator','search_stop','variable_equals','budget']);
    const find = (scene, selector) => scene.bookNode?.querySelector(selector);
    function node (tag, text, className) {
        const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n;
    }
    window.CompletionSystem = {
        model (scene) {
            const statuses = scene.objectiveStatuses || [];
            if (!scene.atividade.v4 || !scene.completionProcessed || !scene.budgetResult?.valid || !statuses.length || statuses.some(o => !o.completed)) return null;
            const chests = scene.runState.entities.filter(e => e.type === 'chest');
            return { id:scene.atividade.id, name:scene.atividade.nome,
                objectives:statuses.filter(o => !PEDAGOGICAL.has(o.type)).map(o => o.label),
                rules:statuses.filter(o => PEDAGOGICAL.has(o.type)).map(o => o.label),
                coins:window.CoinSystem.stats(scene), chests:chests.length ? { opened:chests.filter(e => e.state === 'open').length, total:chests.length } : null,
                lives:scene.livesRemaining, attempts:scene.executionCount || 0, budget:{ ...scene.budgetResult }, final:scene.atividade.id === window.ACTIVITIES.length };
        },
        hide (scene) {
            const panel = find(scene,'.completion-overlay'); if (panel) panel.hidden = true;
            const screen = find(scene,'.play-screen'); if (screen) screen.inert = false;
            scene.completionModel = null;
        },
        show (scene, reward) {
            const model = this.model(scene); if (!model || !scene.bookNode) return false;
            let panel = find(scene,'.completion-overlay');
            if (!panel) {
                panel = node('div',undefined,'completion-overlay');
                panel.innerHTML = `<section class="completion-card" role="dialog" aria-modal="true" aria-labelledby="completion-title" aria-describedby="completion-reward" tabindex="-1">
                    <header class="completion-header"><span class="completion-emblem" aria-hidden="true">✦</span><div><small class="completion-eyebrow">CRISTAL CONQUISTADO</small><h2 id="completion-title"></h2><p id="completion-reward"></p></div></header>
                    <div class="completion-body"><section><h3>Objetivos concluídos</h3><ul class="completion-objectives"></ul></section><section><h3>Regras pedagógicas cumpridas</h3><ul class="completion-rules"></ul></section><dl class="completion-stats"></dl></div>
                    <footer class="completion-actions"><button class="completion-retry">TENTAR NOVAMENTE</button><button class="completion-next"></button></footer>
                </section>`;
                scene.bookNode.appendChild(panel);
                find(scene,'.completion-retry').addEventListener('click',()=>this.retry(scene));
                find(scene,'.completion-next').addEventListener('click',()=>this.next(scene));
                panel.addEventListener('keydown',event=>{
                    if (event.key !== 'Tab') return;
                    const first=find(scene,'.completion-retry'), last=find(scene,'.completion-next');
                    if (event.shiftKey && (document.activeElement === first || document.activeElement === find(scene,'.completion-card'))) { event.preventDefault(); last.focus(); }
                    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
                });
            }
            scene.completionModel = model;
            find(scene,'#completion-title').textContent = `Atividade ${model.id} — ${model.name}`;
            find(scene,'#completion-reward').textContent = reward.firstCompletion ? `+${reward.xp} XP · Progresso salvo` : 'Progresso salvo · Recompensa de conclusão já recebida';
            for (const [selector,items] of [['.completion-objectives',model.objectives],['.completion-rules',model.rules]]) {
                const list=find(scene,selector); list.textContent=''; for (const label of items) list.appendChild(node('li',`✓ ${label}`));
            }
            const stats=find(scene,'.completion-stats'); stats.textContent='';
            const values=[['Moedas coletadas nesta atividade',`${model.coins.collected} / 5`],['Total de moedas únicas',`${model.coins.total} / 100`],...(model.chests ? [['Baús abertos',`${model.chests.opened} / ${model.chests.total}`]] : []),['Vidas restantes',`${model.lives} / 3`],['Tentativas',model.attempts],['Instruções semânticas',`${model.budget.used} / ${model.budget.limit}`]];
            for (const [label,value] of values) { const group=node('div');group.appendChild(node('dt',label));group.appendChild(node('dd',value));stats.appendChild(group); }
            find(scene,'.completion-next').textContent=model.final ? 'CONCLUIR JORNADA' : 'PRÓXIMA ATIVIDADE →';
            panel.hidden=false; find(scene,'.play-screen').inert=true; find(scene,'.completion-card').focus(); return true;
        },
        async retry (scene) {
            if (!scene.completionModel) return;
            await window.CommandInterpreter.cancelar(scene);
            this.hide(scene); scene.cancelRequested=false; scene.livesRemaining=3; scene.executionCount=0;
            window.DiscoverySystem.resetActivity(scene);
            window.DungeonSystem.resetRun(scene);
            const clue=find(scene,'.clue-dialog'); if (clue) clue.hidden=true;
            window.GameUI.limparConsole(scene); window.GameUI.atualizarVidas(scene); window.GameUI.atualizarProgresso(scene);
            scene.codeEditor?.markError(null); scene.cameraController?.centerOnGuto();
            window.GameUI.definirFeedback(scene,'Nova partida iniciada. Seu código foi preservado; moedas e recompensas já recebidas continuam salvas.','info');
            find(scene,'.run')?.focus();
        },
        async next (scene) {
            if (!scene.completionModel) return;
            return window.GameUI.navegar(scene,scene.completionModel.final ? null : scene.atividadeIndex + 1);
        }
    };
})();
