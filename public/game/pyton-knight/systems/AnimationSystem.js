(function () {
    'use strict';
    const directions = { SUL:'down', OESTE:'left', LESTE:'right', NORTE:'up' };
    const rows = { down:0, left:2, right:1, up:3 };
    function duration (scene, ms) { return scene.testMode ? 0 : ms / (scene.animationSpeed || 1); }
    window.AnimationSystem = {
        async tween (scene, targets, values, ms = 220) {
            if (!targets || scene.testMode || !scene.tweens) return;
            await new Promise(resolve => scene.tweens.add({ targets, ...values, duration:duration(scene,ms), onComplete:resolve, onStop:resolve }));
        },
        register (scene) {
            if (!scene.anims || !scene.textures.exists('guto_v3')) return;
            for (const [name,row] of Object.entries(rows)) {
                for (const kind of ['idle','walk']) {
                    const k = `${kind}_${name}`;
                    if (!scene.anims.exists(k)) scene.anims.create({ key:k, frames:scene.anims.generateFrameNumbers('guto_v3', { frames:kind === 'idle' ? [row*4] : [row*4+1,row*4+2,row*4+3,row*4+2] }), frameRate:10, repeat:-1 });
                }
            }
        },
        pose (scene, state = 'idle') {
            scene.playerAnimation = `${state}_${directions[scene.playerFacing]}`;
            if (!scene.guto?.play) return;
            scene.guto.play(`${state === 'walk' ? 'walk' : 'idle'}_${directions[scene.playerFacing]}`, true);
            if (state === 'hurt') scene.guto.setTint(0xf17573);
            else if (state === 'fear') scene.guto.setTint(0xaeb6df);
            else scene.guto.clearTint();
        },
        async move (scene, row, column) {
            this.pose(scene, 'walk');
            await this.tween(scene, scene.guto, { x:scene.startX + column*scene.tileSize, y:scene.startY + row*scene.tileSize }, 210);
            this.pose(scene);
        },
        async interact (scene) {
            this.pose(scene, 'interact');
            if (scene.guto && !scene.testMode) { const y = scene.guto.y; await this.tween(scene,scene.guto,{y:y-4},80); await this.tween(scene,scene.guto,{y},80); }
            this.pose(scene);
        },
        async hurt (scene) {
            this.pose(scene,'hurt');
            if(scene.guto){const x=scene.guto.x;await this.tween(scene,scene.guto,{x:x-5,alpha:.45},110);await this.tween(scene,scene.guto,{x:x+5,alpha:1},110);await this.tween(scene,scene.guto,{x},90);}
        },
        async fear (scene) {
            this.pose(scene,'fear');
            if(scene.guto){const x=scene.guto.x;await this.tween(scene,scene.guto,{x:x-2},65);await this.tween(scene,scene.guto,{x:x+2},65);await this.tween(scene,scene.guto,{x},65);}
        },
        async teleport (scene, action) {
            await this.tween(scene, scene.guto, {alpha:0},180); action();
            await this.tween(scene, scene.guto, {alpha:1},220); this.pose(scene);
        },
        async transition (scene, entity, oldState, newState) {
            if (oldState === newState) return;
            const physical = ['door','gate','guardian','bridge','bridge_segment','chest'].includes(entity.type);
            entity.transitionTo = newState; entity.state = physical ? 'opening' : newState;
            window.MapRenderer?.atualizarEntidades(scene);
            const visual = scene.entitySprites?.get(entity.id);
            if (visual && !scene.testMode) {
                if (entity.type === 'lever' || entity.type === 'light_switch') {
                    if (visual.handle) await this.tween(scene,visual.handle,{angle:newState==='on'?35:-35},180);
                    else {await this.tween(scene,visual.image,{angle:newState==='on'?8:-8},90);await this.tween(scene,visual.image,{angle:0},90);}
                } else if (['door','gate','guardian'].includes(entity.type)) {
                    const y = visual.image.y; await this.tween(scene,visual.image,{y:y-14,alpha:.4},260); visual.image.setY(y);
                } else if (['bridge','bridge_segment'].includes(entity.type)) {
                    visual.image.setAlpha(.15); await this.tween(scene,visual.image,{alpha:1},260);
                } else if (entity.type === 'chest') {
                    visual.image.setTexture('official_v3_chest_opening'); await this.tween(scene,visual.image,{alpha:1},230);
                } else if(entity.type==='hazard'){for(let frame=0;frame<7;frame++){visual.image.setTexture('official_spikes_on',newState==='active'?frame:6-frame);await this.tween(scene,visual.image,{alpha:1},40);}} else { visual.image.setAlpha(.4); await this.tween(scene,visual.image,{alpha:1},200); }
            }
            entity.state = newState; delete entity.transitionTo;
            window.MapRenderer?.atualizarEntidades(scene);
        },
        async light (scene, rooms) {
            scene.revealingRooms = rooms; scene.lightRevealProgress = 0;
            await this.tween(scene, scene, { lightRevealProgress:1 }, 480);
            scene.lightRevealProgress = 1; scene.revealingRooms = [];
        }
    };
})();
