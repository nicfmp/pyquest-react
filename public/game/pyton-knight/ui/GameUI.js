(function () {
    'use strict';
    const drafts = new Map();
    function q (scene, selector) { return scene.bookNode ? scene.bookNode.querySelector(selector) : null; }
    function setText (scene, selector, value) { const node = q(scene, selector); if (node) node.textContent = value; }
    function element (tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
    const NAMES = { door:'Porta', gate:'Grade / cofre', guardian:'Guardião', lever:'Alavanca', pressure_plate:'Placa de pressão', toggle_plate:'Placa alternadora', hazard:'Espinhos', key:'Chave', coin:'Moeda', ruby:'Rubi', pedestal:'Pedestal', output_rune:'Runa de saída', bridge:'Ponte', bridge_segment:'Segmento', mirror:'Espelho', portal:'Portão', chest:'Baú', totem:'Totem' };
    window.GameUI = {
        criar (scene) {
            const host = document.getElementById('interface'); host.textContent = '';
            host.innerHTML = `<div class="play-screen">
                <section class="map-panel" aria-label="Dungeon">
                    <header class="map-header"><div><span class="brand">PYTON KNIGHT</span><p class="map-subtitle"></p></div><button class="menu-button" title="Voltar ao menu">MENU</button></header>
                    <div class="map-hud"><span class="lives"></span><span class="facing"></span><span class="progress"></span><span class="phase-coins"></span><span class="key-status"></span></div>
                    <div class="dungeon-viewport" aria-label="Mapa da dungeon: arraste para explorar e use a roda para aproximar" role="img"></div>
                    <footer class="map-controls"><div class="zoom-controls"><button class="zoom-out" aria-label="Diminuir zoom">−</button><output class="zoom-value">100%</output><button class="zoom-in" aria-label="Aumentar zoom">+</button></div><button class="center-guto">Centralizar no Guto</button><button class="journal-toggle" title="Ler as pistas já encontradas">DIÁRIO <span class="journal-count">0</span></button><span class="camera-status">Arraste para explorar</span></footer>
                    <aside class="clue-dialog" hidden aria-live="polite"><button class="clue-close" aria-label="Fechar inscrição">×</button><strong class="clue-title"></strong><p class="clue-text"></p></aside><select class="dev-selector" aria-label="Atividade de desenvolvimento" hidden></select>
                </section>
                <section class="magic-book" aria-label="Livro Mágico"><aside class="journal-panel" hidden><div class="journal-header"><h2>Diário de Descobertas</h2><button class="journal-close">VOLTAR AO LIVRO</button></div><p class="journal-intro">Aqui ficam os textos que Guto encontrou. Interprete as pistas e construa seu programa.</p><div class="journal-entries"></div></aside>
                    <header class="book-header"><div><small class="activity-number"></small><h1></h1><p class="concept"></p></div><span class="book-label">LIVRO<br>MÁGICO</span></header>
                    <section class="mission-area scroll-area" tabindex="0" aria-label="Missão, objetivos e dados"><h2>Missão</h2><p class="description"></p><ul class="objectives"></ul><div class="inscriptions"><h2>Como explorar</h2><ul class="level-data"></ul></div><div class="tutor"><h2>Tutor</h2><strong class="tutor-title"></strong><p class="tutor-message"></p><p class="tutorial-count"></p></div></section>
                    <section class="resources scroll-area" tabindex="0" aria-label="Recursos disponíveis"><h2>Recursos Python <small>nesta atividade</small></h2><div class="python-resources chips"></div><details open><summary>Comandos disponíveis · Pyton Knight</summary><div class="command-resources chips"></div></details><details class="sensor-details" open><summary>Sensores disponíveis · Pyton Knight</summary><div class="sensor-resources chips"></div></details><details><summary>Identificadores dos objetos</summary><ul class="object-identifiers"></ul></details></section>
                    <section class="editor-area"><div class="editor-heading"><label for="pk-code">Código Python</label><output class="budget"></output></div><div class="editor-frame"><div class="gutter-clip" aria-hidden="true"><pre class="line-numbers"></pre></div><div class="code-surface"><div class="error-line" hidden aria-hidden="true"></div><textarea id="pk-code" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-describedby="editor-help"></textarea></div></div><small id="editor-help">Tab: indentar · Shift + Tab: recuar · Enter: continuar o bloco</small></section>
                    <form class="input-area" hidden><label class="input-prompt" for="pk-runtime-input"></label><div class="input-row"><input id="pk-runtime-input" class="runtime-input" placeholder="Digite aqui" autocomplete="off"><button class="input-send" type="submit">ENVIAR ↵</button></div><small class="input-data"></small><small>Digite o valor e pressione Enter ou ENVIAR.</small></form>
                    <section class="output-area"><div class="output-heading"><h2>Console e feedback</h2><span class="run-state">Pronto para executar</span></div><pre class="console" aria-label="Saída de print" tabindex="0"></pre><div class="feedback" data-type="info" role="status" aria-live="polite" tabindex="0">Escreva seu programa e pressione EXECUTAR.</div></section>
                    <footer class="actions"><button class="run">▶ EXECUTAR</button><button class="restore" title="Reiniciar código, tutorial e descobertas desta atividade">REINICIAR</button><button class="previous">← ANTERIOR</button><button class="next">PRÓXIMA →</button></footer>
                </section>
            </div>`;
            scene.bookNode = host; scene.editorTexto = q(scene, '#pk-code'); scene.editorTexto.value = scene.atividade.codigoInicial || '';
            window.AudioSystem?.mount(scene, q(scene,'.map-header'));
            setText(scene, '.activity-number', `UNIDADE ${scene.atividade.unidade} / ATIVIDADE ${scene.atividade.id} DE 20`);
            setText(scene, 'h1', scene.atividade.nome); setText(scene, '.concept', scene.atividade.concept); setText(scene, '.description', scene.atividade.descricao);
            setText(scene, '.map-subtitle', scene.atividade.tutorial ? 'Observe, programe e descubra o caminho.' : 'Seu código conduz Guto pela dungeon.');
            window.ActivityGuide.data(scene.atividade.id).forEach((text) => q(scene, '.level-data').appendChild(element('li', text)));
            const resources = window.ActivityGuide.resources(scene.atividade);
            resources.python.forEach((text) => q(scene, '.python-resources').appendChild(element('span', text)));
            for (const [items, selector] of [[resources.commands, '.command-resources'], [resources.sensors, '.sensor-resources']]) items.forEach((item) => { const chip = element('code', item.syntax); chip.title = item.description; q(scene, selector).appendChild(chip); });
            q(scene, '.sensor-details').hidden = resources.sensors.length === 0;
            (scene.atividade.v3 ? [] : scene.atividade.entities || []).forEach((entity) => { const li = element('li'); li.appendChild(element('code', entity.id)); li.appendChild(element('span', ` — ${NAMES[entity.type] || entity.type}${entity.label ? ` (${entity.label})` : entity.value !== undefined ? ` (${entity.value})` : ''}`)); q(scene, '.object-identifiers').appendChild(li); });
            scene.codeEditor = window.CodeEditor.attach(scene.editorTexto, q(scene, '.line-numbers'), q(scene, '.error-line'), (code) => {
                let used = '—'; try { used = window.PythonSubsetParser.parse(code).analysis.instructionCount; } catch (_) {}
                setText(scene, '.budget', scene.atividade.instructionBudget ? `${used} / ${scene.atividade.instructionBudget} instruções` : `${used} instruções`);
                const budget=q(scene,'.budget');
                if (budget) { const over=typeof used==='number' && used>scene.atividade.instructionBudget; budget.dataset.over=String(over); budget.title=scene.atividade.v4 ? 'Instruções semânticas. Acima do limite, você pode executar e explorar; otimize para concluir.' : 'Instruções semânticas'; budget.setAttribute('aria-label',`${used} instruções semânticas${scene.atividade.instructionBudget ? ` de ${scene.atividade.instructionBudget}` : ''}${scene.atividade.v4 && over ? '; acima do limite, exploração permitida' : ''}`); }
            });
            q(scene,'.journal-toggle').addEventListener('click',()=>{ q(scene,'.journal-panel').hidden=false; this.atualizarDescobertas(scene); });
            q(scene,'.journal-close').addEventListener('click',()=>{ q(scene,'.journal-panel').hidden=true; });
            q(scene,'.clue-close').addEventListener('click',()=>{ q(scene,'.clue-dialog').hidden=true; });
            q(scene, '.run').addEventListener('click', () => window.CommandInterpreter.executar(scene));
            q(scene, '.restore').addEventListener('click', async () => {
                if(scene.gameOverPending)return;
                await window.CommandInterpreter.cancelar(scene);
                window.CompletionSystem?.hide(scene);
                scene.tutorialStepIndex = 0; scene.cancelRequested = false;
                window.DiscoverySystem?.resetActivity(scene); const clue=q(scene,'.clue-dialog'); if(clue) clue.hidden=true;
                scene.editorTexto.value = scene.atividade.codigoInicial || '';
                window.DungeonSystem.resetRun(scene); window.TutorialSystem.inicializar(scene); scene.codeEditor.refresh(); scene.codeEditor.markError(null); this.limparConsole(scene); window.JourneySystem?.checkpoint(scene);
                if (scene.cameraController) scene.cameraController.centerOnGuto();
                this.definirFeedback(scene, 'Atividade reiniciada: código, mecanismos e descobertas restaurados. As vidas foram preservadas.', 'info');
            });
            q(scene, '.previous').addEventListener('click', () => this.navegar(scene, scene.atividadeIndex - 1));
            q(scene, '.next').addEventListener('click', () => this.navegar(scene, scene.atividadeIndex + 1));
            q(scene, '.menu-button').addEventListener('click', () => this.navegar(scene, null));
            q(scene, '.zoom-in').addEventListener('click', () => scene.cameraController.zoom(scene.cameraController.model.zoom * 1.2));
            q(scene, '.zoom-out').addEventListener('click', () => scene.cameraController.zoom(scene.cameraController.model.zoom / 1.2));
            q(scene, '.center-guto').addEventListener('click', () => scene.cameraController.centerOnGuto());
            if (scene.devMode) {
                const select = q(scene, '.dev-selector'); select.hidden = false;
                window.ACTIVITIES.forEach((activity, index) => { const option = element('option', `${activity.id}. ${activity.nome}`); option.value = String(index); select.appendChild(option); }); select.value = String(scene.atividadeIndex);
                select.addEventListener('change', () => this.navegar(scene, Number(select.value)));
            }
            this.atualizarObjetivos(scene); this.atualizarTutor(scene);
        },
        mostrarInscricao (scene, entry) { const panel=q(scene,'.clue-dialog'); if(!panel) return; setText(scene,'.clue-title',entry.title); setText(scene,'.clue-text',entry.text); panel.hidden=false; },
        atualizarDescobertas (scene) {
            const d=scene.discoveryState; if(!d||!scene.bookNode) return;
            const list=q(scene,'.journal-entries'); if(!list) return; list.textContent='';
            const entries=Object.values(d.inscriptions); setText(scene,'.journal-count',entries.length);
            if(!entries.length) list.appendChild(element('p','Nenhuma inscrição examinada. Explore a dungeon e use examinar() diante de um texto antigo.'));
            entries.forEach(entry=>{const article=element('article');article.appendChild(element('small',entry.region));article.appendChild(element('h3',entry.title));article.appendChild(element('p',entry.text));list.appendChild(article);});
            if(scene.atividade.v3){const ids=q(scene,'.object-identifiers');if(ids){ids.textContent='';(scene.runState?.entities||[]).filter(e=>d.knownObjects?.[e.id]).forEach(e=>{const li=element('li');li.appendChild(element('code',e.id));li.appendChild(element('span',` — ${NAMES[e.type]||e.label||e.type}`));ids.appendChild(li);});}}
        },
        limparRascunhos () { drafts.clear(); },
        restaurarRascunho (scene) { if(scene.atividade.v6){ if(scene.resumeCode !== undefined) scene.editorTexto.value=scene.resumeCode; scene.codeEditor.refresh(); return; } const draft = drafts.get(scene.atividade.id); if (draft) { scene.tutorialStepIndex = draft.step; scene.editorTexto.value = draft.code; this.atualizarTutor(scene); } scene.codeEditor.refresh(); },
        async navegar (scene, index) {
            if (scene.navigating || scene.gameOverPending) return;
            if (index !== null && (index < 0 || index >= window.ACTIVITIES.length || !window.ProgressionSystem.atividadeDesbloqueada(scene, index + 1))) return;
            scene.navigating = true; await window.CommandInterpreter.cancelar(scene);
            window.JourneySystem?.checkpoint(scene);
            drafts.set(scene.atividade.id, { code: scene.editorTexto.value, step: scene.tutorialStepIndex || 0 });
            scene.bookNode.classList.add('leaving'); scene.cameras.main.fadeOut(180, 10, 12, 17);
            scene.time.delayedCall(190, () => scene.scene.start(index === null ? 'MainMenu' : 'Game', index === null ? {} : { atividadeIndex: index }));
        },
        destruir (scene) { this.cancelarEntrada(scene); if (scene.codeEditor) scene.codeEditor.destroy(); if (scene.cameraController) scene.cameraController.destroy(); if (scene.bookNode) { scene.bookNode.textContent = ''; scene.bookNode.classList.remove('leaving'); } scene.bookNode = null; },
        atualizarObjetivos (scene) { const list = q(scene, '.objectives'); if (!list) return; list.textContent = ''; (scene.objectiveStatuses || scene.atividade.objectives || []).forEach((item) => list.appendChild(element('li', `${item.completed ? '✓' : '○'} ${item.label}`, item.completed ? 'done' : ''))); setText(scene, '.key-status', scene.runState && scene.runState.hasKey ? 'Chave coletada' : ''); },
        atualizarTutor (scene) { const box = q(scene, '.tutor'); if (!box) return; const steps = scene.atividade.tutorialSteps; box.hidden = !steps; if (steps) { const step = steps[scene.tutorialStepIndex || 0]; setText(scene, '.tutor-title', step.title); setText(scene, '.tutor-message', (step.message || 'Explore e observe o resultado.') + (step.example ? ` Exemplo de sintaxe: ${step.example}` : '')); setText(scene, '.tutorial-count', `Etapa ${(scene.tutorialStepIndex || 0) + 1} de ${steps.length}`); } if (scene.codeEditor) scene.codeEditor.refresh(); },
        atualizarVidas (scene) { setText(scene, '.lives', `${'♥'.repeat(scene.livesRemaining)}${'♡'.repeat(3 - scene.livesRemaining)}  ${scene.livesRemaining}/3`); },
        atualizarOrientacao (scene) { const vector = window.GAME_CONSTANTS.VETORES_ORIENTACAO[scene.playerFacing]; setText(scene, '.facing', `${vector.simbolo} ${scene.playerFacing}`); },
        atualizarProgresso (scene) { const progress = scene.playerProgress || window.PersistenceService.load(); setText(scene, '.progress', `XP ${progress.totalXp} · Moedas ${progress.walletCoins}`); if(scene.atividade.v4){const coins=window.CoinSystem.stats(scene);setText(scene,'.phase-coins',`Moedas da fase: ${coins.collected} / 5 · Total: ${coins.total} / 100`);} const next = q(scene, '.next'); if (next) next.disabled = Boolean(scene.executando) || scene.atividadeIndex >= 19 || !window.ProgressionSystem.atividadeDesbloqueada(scene, scene.atividadeIndex + 2); const previous = q(scene, '.previous'); if (previous) previous.disabled = Boolean(scene.executando) || scene.atividadeIndex <= 0; },
        atualizarMoedasDaExecucao (scene) { if(scene.atividade.v4){this.atualizarProgresso(scene);return;} const progress = scene.playerProgress || window.PersistenceService.load(); const pending = scene.runState ? scene.runState.coinsPending : 0; setText(scene, '.progress', `XP ${progress.totalXp} · Moedas ${progress.walletCoins}${pending ? ` (+${pending})` : ''}`); },
        atualizarCamera (scene, zoom, tracking) { setText(scene, '.zoom-value', `${Math.round(zoom * 100)}%`); setText(scene, '.camera-status', tracking ? 'Acompanhando Guto' : 'Arraste para explorar'); },
        marcarErro (scene, line) { if (scene.codeEditor) scene.codeEditor.markError(line); },
        definirFeedback (scene, message, type, cause) { const node = q(scene, '.feedback'); if (!node) return; node.dataset.type = type || 'info'; node.dataset.cause = cause || ''; node.textContent = message; node.scrollTop = 0; },
        definirExecutando (scene, value) { const run = q(scene, '.run'); if (run) { run.disabled = value; run.textContent = value ? 'EXECUTANDO…' : '▶ EXECUTAR'; } if (scene.editorTexto) scene.editorTexto.readOnly = value; setText(scene, '.run-state', value ? 'Executando seu programa' : 'Pronto para executar'); this.atualizarProgresso(scene); if (scene.cameraController) scene.cameraController.setExecuting(value); },
        adicionarConsole (scene, value) { const node = q(scene, '.console'); if (node) { node.textContent += `${value}\n`; node.scrollTop = node.scrollHeight; } },
        limparConsole (scene) { const node = q(scene, '.console'); if (node) node.textContent = ''; },
        mostrarResumoConclusao (scene, reward) { this.atualizarProgresso(scene); this.definirFeedback(scene, `Vitória! ${reward.xp ? `+${reward.xp} XP` : 'Recompensa já recebida'}${reward.coins ? ` · +${reward.coins} moedas` : ''}.`, 'success'); if (window.MapRenderer.feedbackConclusao) window.MapRenderer.feedbackConclusao(scene); if(scene.atividade.v4) window.CompletionSystem.show(scene,reward); },
        cancelarEntrada (scene) { if (scene.cancelInput) scene.cancelInput(); },
        solicitarEntrada (scene, prompt) {
            const form = q(scene, '.input-area'), input = q(scene, '.runtime-input');
            if (!form || !input) return Promise.reject(Object.assign(new Error('Campo de entrada indisponível.'), { cause:'EXECUTION_CANCELLED' }));
            form.hidden = false; setText(scene, '.input-data', scene.atividade.v3 ? 'Consulte as pistas encontradas no Diário.' : window.ActivityGuide.data(scene.atividade.id)[0] || ''); setText(scene, '.input-prompt', String(prompt || 'Digite a entrada:')); setText(scene, '.run-state', 'Aguardando sua entrada'); input.value = ''; input.focus();
            return new Promise((resolve, reject) => {
                let settled = false;
                const cleanup = () => { settled = true; form.hidden = true; form.removeEventListener('submit', finish); scene.cancelInput = null; setText(scene, '.run-state', scene.executando ? 'Executando seu programa' : 'Pronto para executar'); };
                const finish = (event) => { event.preventDefault(); if (settled) return; const value = input.value; cleanup(); resolve(value); };
                scene.cancelInput = () => { if (settled) return; cleanup(); reject(Object.assign(new Error('Entrada cancelada. O código foi preservado.'), { cause: 'EXECUTION_CANCELLED' })); };
                form.addEventListener('submit', finish);
            });
        }
    };
})();
