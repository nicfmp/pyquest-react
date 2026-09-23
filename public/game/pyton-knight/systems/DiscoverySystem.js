(function () {
    'use strict';
    const key = (r, c) => `${r},${c}`;
    function contains (region, row, column) { return row >= region.row && column >= region.column && row < region.row + region.height && column < region.column + region.width; }
    function lineOfSight (scene, r, c) {
        const a = scene.gutoPosition; const steps = Math.max(Math.abs(r - a.linha), Math.abs(c - a.coluna));
        for (let i = 1; i < steps; i++) {
            const y = Math.round(a.linha + (r - a.linha) * i / steps), x = Math.round(a.coluna + (c - a.coluna) * i / steps);
            if (!scene.mapa[y] || scene.mapa[y][x] === 0) return false;
        }
        return true;
    }
    window.DiscoverySystem = {
        contains,
        ensure (scene) {
            if (!scene.discoveryState || scene.discoveryState.activityId !== scene.atividade.id) scene.discoveryState = { activityId:scene.atividade.id, inscriptions:{}, litRooms:{}, regions:{}, tiles:{}, knownObjects:{} };
            return scene.discoveryState;
        },
        resetActivity (scene) { scene.discoveryState = null; this.ensure(scene); },
        regionAt (scene, row = scene.gutoPosition.linha, column = scene.gutoPosition.coluna) { return (scene.atividade.regions || []).filter(r => contains(r, row, column)).reverse().sort((a,b)=>a.width*a.height-b.width*b.height)[0]; },
        isLit (scene, region) { return !region || !region.lightState || region.lightState === 'lit' || Boolean(this.ensure(scene).litRooms[region.id]); },
        restore (scene) {
            if (!scene.atividade.v3) return;
            const d = this.ensure(scene);
            for (const id of Object.keys(d.inscriptions)) scene.runState.flags[`read_${id}`] = true;
            for (const id of Object.keys(d.litRooms)) scene.runState.flags[`light_${id}`] = true;
            for (const id of Object.keys(d.regions)) scene.runState.flags[`visit_${id}`] = true;
            for (const e of scene.runState.entities) if (e.type === 'light_switch' && (e.rooms || []).every(id => d.litRooms[id])) e.state = 'on';
            this.observe(scene);
        },
        canSee (scene, row, column) {
            if (!scene.atividade.v3) return true;
            const d = this.ensure(scene), region = this.regionAt(scene, row, column);
            if (region && this.isLit(scene, region) && (d.regions[region.id] || d.litRooms[region.id] || region.initiallyVisible)) return true;
            const distance = Math.hypot(row - scene.gutoPosition.linha, column - scene.gutoPosition.coluna);
            const local = this.regionAt(scene);
            const radius = local && local.lightState === 'deepDark' && !this.isLit(scene, local) ? 1.6 : 2.8;
            return distance <= radius && lineOfSight(scene, row, column);
        },
        observe (scene) {
            if (!scene.atividade.v3) return;
            const d = this.ensure(scene), region = this.regionAt(scene);
            if (region) { d.regions[region.id] = true; scene.runState.flags[`visit_${region.id}`] = true; }
            for (let r = 0; r < scene.mapa.length; r++) for (let c = 0; c < scene.mapa[r].length; c++) if (this.canSee(scene, r, c)) d.tiles[key(r,c)] = true;
            for(const e of scene.runState.entities) if(this.canSee(scene,e.row,e.column)) d.knownObjects[e.id]=true;
            window.GameUI?.atualizarDescobertas?.(scene);
        },
        reveal (scene, ids) {
            const d = this.ensure(scene);
            for (const id of ids) { d.litRooms[id] = true; scene.runState.flags[`light_${id}`] = true; }
            this.observe(scene);
        },
        examine (scene, entity) {
            const d = this.ensure(scene);
            const entry = { id:entity.id, title:entity.label || 'Inscrição antiga', text:entity.text || '', region:this.regionAt(scene, entity.row, entity.column)?.label || 'Dungeon' };
            d.inscriptions[entity.id] = entry; scene.runState.flags[`read_${entity.id}`] = true;
            entity.state='read'; window.MapRenderer?.atualizarEntidades(scene);
            window.GameUI?.mostrarInscricao?.(scene, entry);
            window.GameUI?.atualizarDescobertas?.(scene);
            return entry.text;
        },
        onEnter (scene) {
            this.observe(scene);
            const region = this.regionAt(scene);
            scene.runState.darkDanger = false;
            if (!region || region.lightState !== 'deepDark' || this.isLit(scene, region)) { scene.runState.darkSteps = 0; return; }
            scene.runState.darkSteps = (scene.runState.darkSteps || 0) + 1;
            window.AnimationSystem?.pose(scene, 'fear');
            if (scene.runState.darkSteps === 1) {
                window.GameUI?.definirFeedback?.(scene, 'Guto está com medo. A névoa densa é perigosa: acenda o interruptor antes de continuar.', 'warning');
            }
            if (region.fearDamage && (!region.fearVariants || region.fearVariants.includes((scene.sessionVariantIndex||0)%3)) && scene.runState.darkSteps > (region.warningSteps || 2)) scene.runState.darkDanger = true;
        },
        attach (scene) {
            if (!scene.atividade.v3 || !scene.add) return;
            scene.fog = scene.add.graphics().setDepth(80);
        },
        draw (scene) {
            if (!scene.fog || !scene.runState) return;
            const d = this.ensure(scene), g = scene.fog, size = scene.tileSize;
            g.clear();
            const lightProgress = scene.lightRevealProgress === undefined ? 1 : scene.lightRevealProgress;
            for (let r = 0; r < scene.mapa.length; r++) for (let c = 0; c < scene.mapa[r].length; c++) {
                const visible = this.canSee(scene,r,c), region = this.regionAt(scene,r,c);
                const darkness = region && !this.isLit(scene,region);
                let alpha = visible ? (darkness ? .18 : .025) : (d.tiles[key(r,c)] ? .73 : 1);
                if (visible && region && (scene.revealingRooms || []).includes(region.id)) alpha = Math.max(alpha, 1 - lightProgress);
                g.fillStyle(0x080b14, alpha); g.fillRect(c*size, r*size, size+1, size+1);
            }
        }
    };
})();
