(function () {
    'use strict';
    const TEXTURE = 'v5_soft_light', MAX_LIGHTS = 64, MAX_BURSTS = 8;
    const MAGIC = new Set(['output_rune','portal','mirror','totem','pedestal']);
    const ACTIVE = new Set(['on','open','active','correct','answered']);
    const colors = { warm:0xffba68, magic:0x95bfff, crystal:0xacffe0, danger:0xe67658 };
    function texture (scene) {
        if (scene.textures.exists(TEXTURE)) return;
        const canvas = scene.textures.createCanvas(TEXTURE, 128, 128);
        const ctx = canvas.getContext(), gradient = ctx.createRadialGradient(64,64,2,64,64,64);
        gradient.addColorStop(0, 'rgba(255,255,255,0.55)');
        gradient.addColorStop(.35, 'rgba(255,255,255,0.22)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient; ctx.fillRect(0,0,128,128); canvas.refresh();
    }
    class Atmosphere {
        constructor (scene) {
            this.scene = scene; this.lights = []; this.bursts = []; this.elapsed = 0; this.disposed = false;
            this.baseScale = { x:scene.guto.scaleX, y:scene.guto.scaleY };
            texture(scene);
            // World-only layers remain BELOW DiscoverySystem's fog (depth 80).
            // This is decorative light; visibility and puzzle light flags are untouched.
            this.ambient = scene.add.rectangle(0,0,scene.mapa[0].length*scene.tileSize,scene.mapa.length*scene.tileSize,0x111d38,.065).setOrigin(0).setDepth(1.5);
            this.halo = this.light({ x:scene.guto.x, y:scene.guto.y, radius:105, color:colors.warm, strength:.24, player:true });
            for (const entity of scene.runState.entities) {
                if (MAGIC.has(entity.type) || ['key','coin','ruby','light_switch','hazard'].includes(entity.type)) {
                    this.light({ row:entity.row, column:entity.column, id:entity.id, radius:MAGIC.has(entity.type)?78:48,
                        color:entity.type==='hazard'?colors.danger:MAGIC.has(entity.type)?colors.magic:colors.warm,
                        strength:.18, magic:MAGIC.has(entity.type) });
                }
            }
            const T = window.GAME_CONSTANTS.TILE;
            for (let row=0; row<scene.mapa.length; row++) for (let column=0; column<scene.mapa[row].length; column++) {
                const tile=scene.mapa[row][column];
                if (tile === T.SAIDA) this.light({row,column,radius:100,color:colors.crystal,strength:.32,magic:true});
                if (tile === T.PAREDE && scene.mapa[row+1] && scene.mapa[row+1][column] !== T.PAREDE && column%5===2) this.light({row,column,radius:110,color:colors.warm,strength:.30,torch:true});
                if (tile === T.PERIGO) this.light({row,column,radius:70,color:colors.danger,strength:.15});
            }
            for (const decor of scene.atividade.decorations || []) {
                if (/torch|fireplace/.test(decor.role)) this.light({...decor,radius:100,color:colors.warm,strength:.28,torch:true});
            }
            this.particles = scene.add.graphics().setDepth(12);
            this.onShutdown = () => this.destroy(); scene.events.once('shutdown', this.onShutdown);
        }
        light (source) {
            if (this.lights.length >= MAX_LIGHTS) return null;
            const s = this.scene;
            source.x = source.x ?? s.startX+source.column*s.tileSize;
            source.y = source.y ?? s.startY+source.row*s.tileSize;
            source.image = s.add.image(source.x,source.y,TEXTURE).setDisplaySize(source.radius*2,source.radius*2).setTint(source.color).setAlpha(source.strength).setDepth(3.5);
            this.lights.push(source); return source;
        }
        burst (row, column, color = colors.magic) {
            if (this.bursts.length >= MAX_BURSTS) this.bursts.shift();
            this.bursts.push({row,column,color,start:this.elapsed});
        }
        update (delta) {
            if (this.disposed) return;
            const s=this.scene, reduced=window.AnimationSystem.reducedMotion();
            this.elapsed += Math.min(delta || 0, 100); const t=this.elapsed/1000, g=this.particles; g.clear();
            let motes=0;
            this.lights.forEach((source, index) => {
                let visible = source.player || window.DiscoverySystem.canSee(s,source.row,source.column);
                let strength=source.strength;
                if (source.id) {
                    const e=s.runState.entities.find(entity => entity.id===source.id);
                    visible = visible && Boolean(e) && e.state!=='collected';
                    if (e?.type === 'hazard') visible = visible && e.state==='active';
                    if (source.magic && !ACTIVE.has(e?.state)) strength *= .55;
                }
                source.image.setVisible(visible); if (!visible) return;
                if (source.player) source.image.setPosition(s.guto.x,s.guto.y).setAlpha(strength*s.guto.alpha);
                else source.image.setAlpha(strength*(reduced?1:1+.08*Math.sin(t*(source.torch?3:1.7)+index)));
                if (source.magic && !reduced && motes<12) {
                    for (let p=0;p<2;p++) {
                        const phase=(t*.32+p*.5+index*.17)%1;
                        g.fillStyle(source.color,Math.sin(phase*Math.PI)*.48);
                        g.fillCircle(source.x+Math.sin(index+p*3+t)*12,source.y+12-phase*34,1.3);
                    }
                    motes++;
                }
            });
            this.bursts = this.bursts.filter(burst => this.elapsed-burst.start<480);
            for (const burst of this.bursts) {
                if (!window.DiscoverySystem.canSee(s,burst.row,burst.column)) continue;
                const phase=(this.elapsed-burst.start)/480, x=s.startX+burst.column*s.tileSize, y=s.startY+burst.row*s.tileSize;
                g.lineStyle(2,burst.color,(1-phase)*.65); g.strokeCircle(x,y,reduced?22:12+phase*22);
            }
            // Scale breathes around the existing sprite; logical position is unchanged.
            const breath=!reduced && !s.executando && !s.navigating && s.playerAnimation?.startsWith('idle_') ? Math.sin(t*2)*.008 : 0;
            s.guto.setScale(this.baseScale.x*(1-breath*.4),this.baseScale.y*(1+breath));
        }
        destroy () {
            if (this.disposed) return;
            this.disposed=true; this.scene.events.off('shutdown',this.onShutdown);
            this.lights.forEach(source => source.image.destroy()); this.lights=[]; this.bursts=[];
            this.ambient.destroy(); this.particles.destroy();
            this.scene.atmosphere=null;
        }
    }
    window.AtmosphereSystem = {
        MAX_LIGHTS, MAX_BURSTS,
        attach (scene) { scene.atmosphere?.destroy(); if (!scene.testMode && scene.atividade.v3) scene.atmosphere = new Atmosphere(scene); return scene.atmosphere; },
        changed (scene, entity, previous) {
            if(entity.discreet || entity.inactivePlate || entity.state==='closing')return;
            if (scene.testMode || previous===null || previous===entity.state || entity.state==='opening' || !window.DiscoverySystem.canSee(scene,entity.row,entity.column)) return;
            const collected=['key','coin','ruby'].includes(entity.type) && entity.state==='collected';
            scene.atmosphere?.burst(entity.row,entity.column,collected?colors.warm:colors.magic);
            if (collected) window.AudioSystem?.play(scene,'collect');
            else if (['door','gate','lever','light_switch','chest','pressure_plate','toggle_plate'].includes(entity.type)) window.AudioSystem?.play(scene,'mechanism');
            else if (MAGIC.has(entity.type)) window.AudioSystem?.play(scene,'interact');
        }
    };
})();
