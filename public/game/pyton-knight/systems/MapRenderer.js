(function () {
    'use strict';
    const ACTIVE = new Set(['open', 'active', 'on', 'correct', 'defeated', 'answered']);
    function xy (scene, row, column) { return { x: scene.startX + column * scene.tileSize, y: scene.startY + row * scene.tileSize }; }
    function sprite (scene, point, role, size = 1, frame) { return scene.add.image(point.x, point.y, `official_${role}`, frame).setDisplaySize(scene.tileSize * size, scene.tileSize * size).setDepth(6); }
    function appearance (entity) {
        const active = ACTIVE.has(entity.state);
        if (entity.visualVariant==='v4_totem') return {role:active?'v4_totem_on':'v4_totem_off',size:1,caption:`Totem ${entity.symbol || ''}`};
        if (entity.visualVariant==='bookshelf') return {role:entity.state==='read'?'bookshelf_right':'bookshelf_left',size:.94,caption:'Arquivo'};
        if (entity.type==='ruby') return {role:'v3_ruby',size:.72};
        if(entity.skin==='v3'){
            const role=({lever:active?'v3_lever_on':'v3_lever_off',light_switch:active?'v3_light_on':'v3_light_off',inscription:entity.state==='read'?'v3_book_open':'v3_book_closed',output_rune:active?'v3_rune_on':'v3_rune_off',pressure_plate:active?'v3_rune_on':'v3_rune_off',toggle_plate:active?'v3_rune_on':'v3_rune_off',mirror:active?'v3_portal_on':'v3_portal_off',portal:active?'v3_portal_on':'v3_portal_off',chest:entity.state==='open'?'v3_chest_open':entity.state==='opening'?'v3_chest_opening':'v3_chest_closed',coin:entity.manualCollect?'v3_ruby':'coin_pile'})[entity.type];
            if(role) return {role,size:entity.type==='coin'?.72:1,caption:['portal','mirror'].includes(entity.type)?`${entity.label||'Espelho'} · ${entity.value}`:entity.type==='light_switch'?'Luz':entity.type==='inscription'?'Inscrição':entity.type==='lever'?(entity.label||'Alavanca'):''};
            if(['bridge','bridge_segment'].includes(entity.type))return {role:active||entity.state==='opening'?'v3_bridge':'shadow_void'};
            if(entity.id==='cofre')return {role:active?'v3_chest_open':entity.state==='opening'?'v3_chest_opening':'v3_chest_closed'};
            if(entity.type==='hazard')return {role:entity.state==='active'?'spikes_on':'spikes_off',frame:entity.state==='active'?6:3,caption:entity.state==='inactive'?'Desativados':entity.mode==='cycle'?'Ciclo':''};
        }
        switch (entity.type) {
        case 'door': return { role: active ? 'door_wood_open' : 'door_wood_closed' };
        case 'gate': return { role: entity.id === 'cofre' ? (active ? 'chest_open_fallback' : 'chest_gold') : (active ? 'arch_open' : 'gate_front'), frame:entity.id === 'cofre' && active ? 5 : undefined };
        case 'guardian': return { role: entity.id === 'basilisk' ? 'custom_basilisk' : 'custom_guardian', size:.96, caption: active ? 'Passagem liberada' : entity.id === 'basilisk' ? 'Basilisco' : 'Guardião' };
        case 'lever': return { role:'button', frame:active ? 1 : 0, size:.72, caption:entity.label || 'Alavanca', lever:true };
        case 'pressure_plate': return { role:'button', frame:active ? 1 : 0, size:.68, caption:active ? 'Pressionada' : 'Livre' };
        case 'toggle_plate': return { role:'button', frame:active ? 1 : 0, size:.7, caption:active ? 'ON' : 'OFF' };
        case 'hazard': return { role:entity.state === 'inactive' ? 'spikes_off' : 'floor_spikes_gray', frame:entity.state === 'inactive' ? 3 : undefined, caption:entity.state === 'inactive' ? 'Seguro' : '', size:entity.state === 'inactive' ? .85 : 1 };
        case 'key': return { role:'key_idle', frame:0, size:.78 };
        case 'coin': return { role:'coin_pile', size:.85, caption:'Rubi' };
        case 'pedestal': return { role:'custom_pedestal', size:.88, caption:`Pedestal${entity.symbol ? ` ${entity.symbol}` : ''}` };
        case 'output_rune': return { role:'custom_rune', caption:entity.state === 'incorrect' ? 'Rever saída' : 'Runa' };
        case 'bridge': case 'bridge_segment': return { role:active ? 'floor_edge' : 'shadow_void' };
        case 'mirror': return { role:active ? 'arch_open' : 'arch_dark', caption:`Espelho ${entity.value}` };
        case 'portal': return { role:active ? 'arch_open' : 'gate_stone', caption:`${entity.label || 'Portão'} · ${entity.value}` };
        case 'chest': return { role:active ? 'chest_open_fallback' : 'chest_gold', frame:active ? 5 : undefined, caption:active ? (entity.content === 'key' ? 'Chave!' : 'Vazio') : 'Baú' };
        case 'totem': return { role:'custom_totem', size:.88, caption:`Totem ${entity.symbol || ''}` };
        default: return { role:'custom_rune', caption:entity.label || entity.id };
        }
    }
    window.MapRenderer = {
        appearance,
        tileRole (scene,row,column) {
            const tile=scene.mapa[row][column],near=(dr,dc)=>scene.mapa[row+dr]?.[column+dc]!==undefined && scene.mapa[row+dr][column+dc]!==0;
            if(tile===0){if(near(1,0))return (row+column)%4===0?'wall_face_alt':'wall_face_main';if(scene.atividade.v3 && ![[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].some(([r,c])=>near(r,c)))return 'deep_void';return 'wall_top_main';}
            if(!scene.atividade.v3)return 'floor_main';
            if(tile===3 || (scene.runState?.entities||scene.atividade.entities||[]).some(e=>e.row===row&&e.column===column&&['totem','output_rune','pedestal'].includes(e.type)))return 'v3_floor_rune';
            return (row*7+column*11)%9===0?'v3_floor_cracked':'v3_floor';
        },
        desenhar (scene) {
            const T = window.GAME_CONSTANTS.TILE;
            scene.entitySprites = new Map(); scene.entityVisuals = []; scene.decorations = [];
            for (let row = 0; row < scene.mapa.length; row++) for (let column = 0; column < scene.mapa[row].length; column++) {
                const tile = scene.mapa[row][column], point = xy(scene, row, column);
                const floorBelow = scene.mapa[row + 1] && scene.mapa[row + 1][column] !== T.PAREDE;
                const role = this.tileRole(scene,row,column);
                sprite(scene, point, role).setDepth(1);
                if (tile === T.PAREDE && floorBelow && column % 5 === 2) scene.decorations.push(sprite(scene, point, column % 2 ? 'torch_left' : 'torch_right').setDepth(2));
                if (tile === T.SAIDA) { scene.exitVisual = scene.add.image(point.x, point.y, scene.atividade.v3?'official_v3_crystal':'saida').setDisplaySize(scene.tileSize * .74, scene.tileSize * .86).setDepth(4); }
                if (tile === T.PERIGO) { sprite(scene, point, 'fireplace_bright').setDepth(3); if(!scene.atividade.v3) scene.add.text(point.x, point.y + 22, 'LAVA', { font:'bold 9px Arial', color:'#ffbb82', backgroundColor:'#241311' }).setOrigin(.5).setDepth(7); }
            }
            window.DecorationSystem?.draw(scene);
            // Position is authoritative even if a map marker differs.
            const start = xy(scene, scene.startPosition.linha, scene.startPosition.coluna);
            scene.guto = scene.atividade.v3 ? scene.add.sprite(start.x,start.y,'guto_v3',4).setDisplaySize(scene.tileSize,scene.tileSize).setDepth(20) : scene.add.image(start.x, start.y, 'guto').setDisplaySize(scene.tileSize * .64, scene.tileSize * .85).setDepth(20);
            if(scene.atividade.v3) window.AnimationSystem.pose(scene);
            scene.gutoFacingIndicator = scene.add.text(start.x, start.y - scene.tileSize * .48, '→', { font:'bold 22px Arial', color:'#ffe0a1', stroke:'#101318', strokeThickness:4 }).setOrigin(.5).setDepth(22);
            (scene.atividade.regions || []).forEach((region) => {
                const point = xy(scene, region.row, region.column);
                scene.add.text(point.x - 25, point.y - 30, region.label, { font:'11px Arial', color:'#c6bdac', backgroundColor:'#151920dd', padding:{x:4,y:2} }).setDepth(3);
            });
            this.atualizarEntidades(scene);
        },
        atualizarEntidades (scene) {
            if (!scene.runState || !scene.entitySprites) return;
            const seen = new Set();
            scene.runState.entities.forEach((entity) => {
                if (!Number.isFinite(entity.row) || !Number.isFinite(entity.column)) return;
                seen.add(entity.id); let visual = scene.entitySprites.get(entity.id);
                const point = xy(scene, entity.row, entity.column); const look = appearance(entity);
                if (!visual) {
                    visual = { image:sprite(scene, point, look.role, look.size || 1, look.frame), label:scene.add.text(point.x, point.y + 24, '', { font:'bold 9px Arial', color:'#e9e1d1', backgroundColor:'#131820dd', padding:{x:3,y:2} }).setOrigin(.5).setDepth(9), state:null };
                    if (look.lever) visual.handle = scene.add.rectangle(point.x, point.y - 3, 5, 23, 0xbaa383).setOrigin(.5,.9).setDepth(8);
                    scene.entitySprites.set(entity.id, visual); scene.entityVisuals.push(visual.image, visual.label); if (visual.handle) scene.entityVisuals.push(visual.handle);
                }
                const collected = ['key','coin','ruby'].includes(entity.type) && entity.state === 'collected';
                visual.image.setTexture(`official_${look.role}`, look.frame).setDisplaySize(scene.tileSize * (look.size || 1), scene.tileSize * (look.size || 1)).setVisible(!collected);
                if (look.role.startsWith('custom_')) { const asset = window.AssetCatalog[look.role]; const ratio = asset.sourceWidth / asset.sourceHeight; const size = scene.tileSize * (look.size || 1); visual.image.setDisplaySize(size * Math.min(1, ratio), size * Math.min(1, 1 / ratio)); }
                if (entity.type === 'key') visual.image.setDisplaySize(scene.tileSize * .38, scene.tileSize * .76);
                visual.label.setText(look.caption || '').setVisible(!collected && Boolean(look.caption));
                if (visual.handle) visual.handle.setAngle(entity.state === 'on' ? 35 : -35);
                visual.image.clearTint();
                if (['output_rune','totem'].includes(entity.type) && entity.visualVariant!=='v4_totem') visual.image.setTint(ACTIVE.has(entity.state) ? 0xffe3a0 : 0x929ca8);
                if (entity.type === 'guardian' && ACTIVE.has(entity.state)) visual.image.setTint(0x869b8e);
                if(entity.skin==='v3' && entity.type==='inscription' && scene.discoveryState?.inscriptions[entity.id]) visual.image.setTexture(entity.visualVariant==='bookshelf'?'official_bookshelf_right':'official_v3_book_open');
                if (entity.state === 'incorrect') visual.image.setTint(0xdf8a82);
                if (entity.type === 'pedestal' && entity.state === 'receiving') visual.image.setTint(0xffdfa2);
                if (entity.type === 'lever' && entity.label === 'verde') visual.image.setTint(0x8caf91);
                if (entity.type === 'lever' && entity.label === 'azul') visual.image.setTint(0x94b6d5);
                if (!scene.atividade.v3 && visual.state !== null && visual.state !== entity.state && !scene.testMode && scene.tweens) {
                    scene.tweens.killTweensOf(visual.image);
                    if (!collected) { visual.image.setAlpha(.45); scene.tweens.add({ targets:visual.image, alpha:1, duration:220 }); }
                } else visual.image.setAlpha(1);
                visual.state = entity.state;
            });
            for (const [id, visual] of scene.entitySprites) if (!seen.has(id)) { visual.image.destroy(); visual.label.destroy(); if (visual.handle) visual.handle.destroy(); visual.marker?.destroy(); scene.entitySprites.delete(id); }
            window.DecorationSystem?.updateMarkers(scene);
        },
        feedbackDano (scene) { if (scene.guto && scene.tweens) { scene.guto.setTint(0xff887d); scene.time.delayedCall(220, () => scene.guto && scene.guto.active && scene.guto.clearTint()); } },
        feedbackConclusao (scene) { if(scene.atividade.v3 && scene.guto && scene.tweens){window.AnimationSystem.pose(scene,'victory');scene.tweens.add({targets:scene.guto,y:scene.guto.y-10,duration:200,yoyo:true,repeat:2});} if (scene.exitVisual && scene.tweens) { scene.tweens.killTweensOf(scene.exitVisual); scene.tweens.add({ targets:scene.exitVisual, alpha:.45, duration:220, yoyo:true, repeat:2 }); } }
    };
})();
