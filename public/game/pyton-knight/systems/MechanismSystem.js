(function () {
    'use strict';
    const OPEN = new Set(['open','active','defeated']);
    const error = (message, line) => new window.DungeonSystem.PytonKnightRuntimeError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR,message,line);
    window.MechanismSystem = {
        enterSequencePlate (scene, entity) {
            const group=entity.sequenceGroup||'sequence',s=scene.runState;
            const plates=s.entities.filter(e=>e.mode==='sequence'&&(e.sequenceGroup||'sequence')===group).sort((a,b)=>a.sequenceIndex-b.sequenceIndex);
            const progress=s.sequences[group]||0;
            const signal=(plate,active)=>{plate.state=active?'on':'off';for(const link of plate.connections||[]){const target=window.DungeonSystem.getEntity(scene,link.targetId);if(target)target.state=active?(link.activeState||'open'):(link.inactiveState||'closed');}};
            if(plates[progress]?.id!==entity.id){s.sequences[group]=0;s.flags[`sequence_${group}`]=false;plates.forEach(p=>signal(p,false));return;}
            entity.state='on';s.sequences[group]=progress+1;
            if(progress+1===plates.length){s.flags[`sequence_${group}`]=true;plates.forEach(p=>signal(p,true));}
        },
        requirements (scene, e) {
            const s = scene.runState;
            if (e.requiresKey && !s.hasKey) return false;
            if (e.requires && !e.requires.every(f=>s.flags[f])) return false;
            if (e.requiresAny && !e.requiresAny.some(f=>s.flags[f])) return false;
            if (e.requiresClues && !e.requiresClues.every(id=>scene.discoveryState?.inscriptions[id])) return false;
            if (e.minRubies && (s.flags.rubiesCollected || 0) < e.minRubies) return false;
            if (e.minRunes && (s.flags.runesActivated || 0) < e.minRunes) return false;
            if (e.minTraps && (s.flags.trapsDisabled || 0) < e.minTraps) return false;
            if (e.condition) {
                const v = Number(s.inputsByPedestal?.[e.condition.input]);
                const n = e.condition.value;
                if (!Number.isFinite(v) || !({'>=':v>=n,'>':v>n,'<':v<n,'==':v===n,'!=':v!==n}[e.condition.operator])) return false;
            }
            return true;
        },
        local (scene, types, id, positions = ['same','ahead','adjacent']) {
            const p = scene.gutoPosition, v = window.GAME_CONSTANTS.VETORES_ORIENTACAO[scene.playerFacing];
            return scene.runState.entities.filter(e=>types.includes(e.type) && (!id || e.id===id)).map(e=>({ e, kind:e.row===p.linha&&e.column===p.coluna?'same':e.row===p.linha+v.linha&&e.column===p.coluna+v.coluna?'ahead':Math.abs(e.row-p.linha)+Math.abs(e.column-p.coluna)===1?'adjacent':'remote' })).filter(x=>positions.includes(x.kind)&&window.DiscoverySystem.canSee(scene,x.e.row,x.e.column)).sort((a,b)=>positions.indexOf(a.kind)-positions.indexOf(b.kind))[0]?.e;
        },
        async automatic (scene) {
            for (const e of scene.runState.entities) if (e.automatic && !OPEN.has(e.state) && this.requirements(scene,e)) await window.AnimationSystem.transition(scene,e,e.state,e.type==='guardian'?'defeated':'open');
        },
        async afterMove (scene, previousStates) {
            if (!scene.atividade.v3) return;
            if(previousStates)for(const e of scene.runState.entities)if(previousStates.get(e.id)!==e.state)await window.AnimationSystem.transition(scene,e,previousStates.get(e.id),e.state);
            scene.runState.worldTick++;
            for (const e of scene.runState.entities) {
                if (e.type!=='hazard' || e.state==='inactive') continue;
                if (e.mode==='cycle') {
                    const active = (scene.runState.worldTick + (e.phase || 0)) % (e.period || 4) >= (e.safeTicks || 2);
                    await window.AnimationSystem.transition(scene,e,e.state,active ? 'active' : 'retracted');
                }
                if (e.mode==='trigger' && e.row===scene.gutoPosition.linha && e.column===scene.gutoPosition.coluna) await window.AnimationSystem.transition(scene,e,e.state,'active');
            }
            await this.automatic(scene);
            window.MapRenderer?.atualizarEntidades(scene);
        },
        async call (scene, name, args, metadata, original) {
            const line = metadata?.lineNumber;
            if (['examinar','ativar_interruptor','sala_iluminada','tem_inscricao_a_frente'].includes(name) && args.length) throw error(`${name}() não recebe argumentos.`,line);
            if (name==='examinar') {
                const e=this.local(scene,['inscription'],null,['same','ahead']);
                if (!e) throw error('Olhe para uma inscrição próxima antes de usar examinar().',line);
                await window.AnimationSystem.interact(scene); const text=window.DiscoverySystem.examine(scene,e); await this.automatic(scene); return text;
            }
            if (name==='ativar_interruptor') {
                const e=this.local(scene,['light_switch']);
                if (!e) throw error('Aproxime-se do interruptor de luz.',line);
                await window.AnimationSystem.interact(scene); await window.AnimationSystem.transition(scene,e,e.state,'on');
                window.DiscoverySystem.reveal(scene,e.rooms||[]); await window.AnimationSystem.light(scene,e.rooms||[]); await this.automatic(scene); return true;
            }
            if (name==='sala_iluminada') return window.DiscoverySystem.isLit(scene,window.DiscoverySystem.regionAt(scene));
            if (name==='tem_inscricao_a_frente') return Boolean(this.local(scene,['inscription'],null,['ahead']));
            if (name==='input' && scene.atividade.requireInputContext) {
                const e=this.local(scene,['pedestal']);
                if (e?.requiresClues && !this.requirements(scene,e)) throw error('Faltam registros do mundo. Explore as inscrições antes de responder ao pedestal.',line);
            }
            if (name==='entrar_portao' && scene.atividade.id===15) { const p=scene.runState.entities.find(e=>e.id==='power_pedestal'); if(p?.expectedInput!==undefined && Number(scene.runState.inputs.at(-1))!==Number(p.expectedInput)) throw error('O poder informado não corresponde ao registro encontrado nesta tentativa.',line); }
            if (name==='abrir_porta') {
                const e=this.local(scene,['door','gate','guardian'],args[0]);
                if (e && !this.requirements(scene,e)) { window.GameUI?.definirFeedback(scene,e.lockHint || 'O selo continua fechado. Confira as pistas e os mecanismos necessários.','warning'); return false; }
            }
            const before=new Map(scene.runState.entities.map(e=>[e.id,e.state]));
            const result=await original();
            if (name==='input') { const e=this.local(scene,['pedestal']); if(e) scene.runState.inputsByPedestal[e.id]=String(result); }
            if (!['andar_frente','virar_direita','virar_esquerda'].includes(name)) {
                for (const e of scene.runState.entities) if(before.get(e.id)!==e.state) { if(!(['entrar_espelho','entrar_portao'].includes(name)&&['mirror','portal'].includes(e.type))) await window.AnimationSystem.transition(scene,e,before.get(e.id),e.state); if(e.revealsRooms && ['on','active'].includes(e.state)) window.DiscoverySystem.reveal(scene,e.revealsRooms); }
            }
            await this.automatic(scene); window.DiscoverySystem.observe(scene); return result;
        }
    };
})();
