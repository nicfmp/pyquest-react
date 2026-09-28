(function () {
    'use strict';
    const counters = ['deaths','gameOvers','executions','errors','instructions','answers','wrongAnswers'];
    const integer = (n, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n) ? Math.min(max, Math.max(0,n)) : 0;
    const validId = id => Number.isInteger(id) && id >= 1 && id <= 20;
    const enabled = scene => Boolean(scene?.atividade?.v6);
    const q = (scene, selector) => scene.bookNode?.querySelector(selector);
    function discovery (scene, saved = {}) {
        const a = scene.atividade, state = {activityId:a.id, inscriptions:{}, litRooms:{}, regions:{}, tiles:{}, knownObjects:{}};
        for (const id of saved.read || []) {
            const e = (a.entities || []).find(e => e.id === id && (e.type === 'inscription' || e.clue));
            if (e) state.inscriptions[id] = {id, title:e.label || 'Registro antigo', text:e.variantTexts?.[scene.sessionVariantIndex % e.variantTexts.length] || e.text || e.clue, region:(a.regions || []).find(r => window.DiscoverySystem.contains(r,e.row,e.column))?.label || 'Dungeon'};
        }
        for (const field of ['litRooms','regions']) for (const id of saved[field] || []) if ((a.regions || []).some(r => r.id === id)) state[field][id] = true;
        for (const id of saved.known || []) if ((a.entities || []).some(e => e.id === id)) state.knownObjects[id] = true;
        return state;
    }
    window.JourneySystem = {
        enabled,
        normalize (raw, progress) {
            const value = raw && typeof raw === 'object' ? raw : {}, stats = {};
            for (const key of counters) stats[key] = integer(value.stats?.[key]);
            const checkpoints = {};
            for (const [id,c] of Object.entries(value.checkpoints || {})) if (validId(Number(id)) && c && typeof c === 'object') {
                const lists = {}; for (const key of ['read','litRooms','regions','known']) lists[key] = [...new Set((Array.isArray(c[key]) ? c[key] : []).filter(x => typeof x === 'string' && x.length < 100))].slice(0,300);
                checkpoints[id] = {...lists, code:typeof c.code === 'string' ? c.code.slice(0,30000) : '', lives:Math.max(1,integer(c.lives,3) || 3), variant:integer(c.variant,2)};
            }
            return {version:1, currentActivity:validId(value.currentActivity) ? value.currentActivity : progress.unlockedMax,
                completed:Boolean(value.completed || (!raw && progress.completedActivities.includes(20))),
                pendingReturn:validId(value.pendingReturn) ? value.pendingReturn : null,
                recoveryActivity:validId(value.recoveryActivity) ? value.recoveryActivity : null,
                migrated:raw ? Boolean(value.migrated) : progress.completedActivities.length > 0 || progress.totalXp > 0,
                discoveries:[...new Set((Array.isArray(value.discoveries)?value.discoveries:[]).filter(id=>typeof id==='string' && /^\d{1,2}:[\w-]+$/.test(id)))].slice(0,300), stats, checkpoints};
        },
        ensure () {
            let p = window.PersistenceService.load();
            if (!p.journey) { p.journey = this.normalize(null,p); p = window.PersistenceService.save(p); }
            return p;
        },
        update (scene, change) {
            if (scene && !enabled(scene)) return;
            const p = this.ensure(); change(p.journey,p); const saved = window.PersistenceService.save(p);
            if (scene) scene.playerProgress = saved; return saved;
        },
        enter (scene) {
            if (!enabled(scene)) return;
            const p = this.ensure(), c = p.journey.checkpoints[scene.atividade.id];
            scene.playerProgress = p; scene.gameOverPending = Boolean(p.journey.pendingReturn);
            if (c) {
                scene.livesRemaining = c.lives; scene.sessionVariantIndex = scene.requestedVariant === null ? c.variant : scene.sessionVariantIndex;
                scene.discoveryState = discovery(scene,c); scene.resumeCode = c.code;
            }
            if (scene.gameOverPending) scene.livesRemaining = 0;
            this.checkpoint(scene);
        },
        checkpoint (scene) {
            if (!enabled(scene) || scene.discardCheckpoint) return;
            this.flushInstructions(scene);
            this.update(scene,j => {
                if (!j.pendingReturn && !j.completed) j.currentActivity = scene.atividade.id;
                const d = scene.discoveryState || {}, old = j.checkpoints[scene.atividade.id];
                j.discoveries=[...new Set([...j.discoveries,...Object.keys(d.inscriptions || {}).map(id=>`${scene.atividade.id}:${id}`)])];
                j.checkpoints[scene.atividade.id] = {code:scene.editorTexto?.value ?? scene.resumeCode ?? old?.code ?? '', lives:Math.max(1,scene.livesRemaining), variant:scene.sessionVariantIndex || 0,
                    read:Object.keys(d.inscriptions || {}), litRooms:Object.keys(d.litRooms || {}), regions:Object.keys(d.regions || {}), known:Object.keys(d.knownObjects || {})};
            });
        },
        begin (scene) { if (!enabled(scene)) return; scene.journeyExecution = {context:null,counted:0,reported:false}; this.update(scene,j => j.stats.executions++); },
        flushInstructions (scene) {
            const run = scene.journeyExecution; if (!enabled(scene) || !run) return;
            const total = Math.min(run.context?.executedInstructions || 0,window.GAME_CONSTANTS.LIMITES_EXECUCAO.MAX_INSTRUCOES), delta = Math.max(0,total-run.counted);
            if (delta) { run.counted = total; this.update(scene,j => j.stats.instructions += delta); }
        },
        result (scene, result) {
            if (!enabled(scene)) return;
            const run = scene.journeyExecution;
            if (run && !run.reported) {
                run.reported = true;
                const errors = ['SYNTAX_ERROR','SEMANTIC_ERROR','UNKNOWN_COMMAND','LOCKED_CONCEPT','LOOP_GUARD_STOP'];
                if (errors.includes(result.cause)) this.update(scene,j => j.stats.errors++);
            }
            this.checkpoint(scene);
            if (scene.gameOverPending) this.showDeath(scene);
            else if (result.cause === 'SUCCESS' && scene.atividade.id === 20) this.showFinal(scene);
        },
        answer (scene, correct) { if (enabled(scene)) this.update(scene,j => { j.stats.answers++; if (correct === false) j.stats.wrongAnswers++; }); },
        die (scene) {
            if (!enabled(scene)) return false;
            scene.livesRemaining = Math.max(0,scene.livesRemaining - 1);
            this.update(scene,j => { j.stats.deaths++; if (!scene.livesRemaining) { j.stats.gameOvers++; j.pendingReturn = Math.max(1,scene.atividade.id-1); } });
            scene.gameOverPending = scene.livesRemaining === 0;
            if (!scene.gameOverPending) window.DungeonSystem.resetRun(scene);
            return true;
        },
        complete (scene, progress) {
            if (!enabled(scene)) return;
            progress.journey ||= this.normalize(null,progress);
            if(progress.journey.recoveryActivity===scene.atividade.id)progress.journey.recoveryActivity=null;
            if (scene.atividade.id === 20) progress.journey.completed = true;
        },
        async returnAfterDeath (scene) {
            const p = this.ensure(), target = p.journey.pendingReturn; if (!target || scene.navigating) return;
            scene.navigating = true; await window.CommandInterpreter.cancelar(scene);
            // The death panel also opens in MainMenu, which has no activity context.
            scene.playerProgress=this.update(null,j => { j.pendingReturn=null; j.recoveryActivity=target; j.currentActivity=target; if(j.checkpoints[target])j.checkpoints[target].lives=3; });
            scene.gameOverPending=false; scene.discardCheckpoint=true; scene.scene.start('Game',{atividadeIndex:target-1});
        },
        panel (scene, title, message, kind) {
            if (typeof document === 'undefined') return null;
            const host = scene.bookNode || document.getElementById('interface'); if (!host) return null;
            scene.bookNode = host; let panel = host.querySelector('.journey-overlay');
            if (!panel) { panel=document.createElement('div'); panel.className='journey-overlay completion-overlay';
                panel.innerHTML='<section class="completion-card journey-card" role="dialog" aria-modal="true" aria-labelledby="journey-title" tabindex="-1"><header class="completion-header"><div><h2 id="journey-title"></h2><p class="journey-message"></p></div></header><div class="journey-stats completion-body" hidden></div><footer class="journey-actions completion-actions"></footer></section>';
                host.appendChild(panel);
                panel.addEventListener('keydown',event => { if(event.key!=='Tab')return; const buttons=[...panel.querySelectorAll('button')]; if(!buttons.length)return; const first=buttons[0],last=buttons.at(-1); if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.querySelector('.journey-card'))){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();} });
            }
            panel.hidden=false; panel.dataset.kind=kind;
            for(const selector of ['.play-screen','.menu-screen']) { const background=q(scene,selector); if(background)background.inert=true; }
            panel.querySelector('#journey-title').textContent=title; panel.querySelector('.journey-message').textContent=message;
            panel.querySelector('.journey-actions').textContent=''; panel.querySelector('.journey-card').focus(); return panel;
        },
        button (panel, label, action) { const b=document.createElement('button'); b.textContent=label; b.addEventListener('click',action); panel.querySelector('.journey-actions').appendChild(b); },
        showDeath (scene) {
            const target=this.ensure().journey.pendingReturn;
            const panel=this.panel(scene,'GUTO MORREU',`As três vidas se esgotaram. Retorne à Atividade ${target} com três vidas para retomar a jornada.`,'death');
            if(panel)this.button(panel,`RETORNAR À ATIVIDADE ${target}`,()=>this.returnAfterDeath(scene));
        },
        stats (progress = this.ensure()) {
            const j=progress.journey; return {...j.stats,coins:progress.coinCollection?.ids.length || 0,activities:progress.completedActivities.length,
                discoveries:j.discoveries.length,migrated:j.migrated};
        },
        showFinal (scene) {
            window.CompletionSystem?.hide(scene);
            const panel=this.panel(scene,'JORNADA CONCLUÍDA','O silêncio voltou ao santuário. Guto guardou os relatos da dungeon no Livro Mágico — e encontrou seu próprio caminho para casa.','final'); if(!panel)return;
            this.button(panel,'REINICIAR DUNGEON',()=>{if(scene.navigating)return;scene.navigating=true;scene.discardCheckpoint=true;window.PersistenceService.resetJourney();window.GameUI?.limparRascunhos?.();scene.scene.start('Game',{atividadeIndex:0});});
            this.button(panel,'ESTATÍSTICAS DA PARTIDA',()=>{
                const box=panel.querySelector('.journey-stats'),s=this.stats(); box.textContent=''; box.hidden=false;
                const labels={deaths:'Mortes (vidas perdidas)',gameOvers:'Game overs (três vidas)',coins:'Moedas únicas coletadas',instructions:'Instruções executadas',activities:'Atividades concluídas',executions:'Execuções de código solicitadas',errors:'Erros de código',discoveries:'Anotações encontradas',answers:'Respostas submetidas',wrongAnswers:'Respostas rejeitadas pelo validador'};
                for(const [key,label] of Object.entries(labels)){const line=document.createElement('p');line.textContent=`${label}: ${s[key]}`;box.appendChild(line);}
                if(s.migrated){const note=document.createElement('p');note.textContent='Save migrado: mortes, instruções, execuções e respostas são contadas desde a V6; não há estimativa do histórico anterior.';box.appendChild(note);}
            });
        },
        attach (scene) {
            if(!enabled(scene))return;
            const save=()=>this.checkpoint(scene);
            scene.editorTexto?.addEventListener?.('input',save); window.addEventListener?.('pagehide',save);
            const visibility=()=>{if(document.visibilityState==='hidden')save();}; document.addEventListener?.('visibilitychange',visibility);
            scene.events?.once('shutdown',()=>{save();scene.editorTexto?.removeEventListener?.('input',save);window.removeEventListener?.('pagehide',save);document.removeEventListener?.('visibilitychange',visibility);});
            if(scene.gameOverPending)this.showDeath(scene);
        }
    };
})();
