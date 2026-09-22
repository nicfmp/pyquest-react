(function () {
    'use strict';
    window.DecorationSystem = {
        draw (scene) {
            if (!scene.atividade.v4) return;
            for (const decor of scene.atividade.decorations || []) {
                const image=scene.add.image(scene.startX+decor.column*scene.tileSize,scene.startY+decor.row*scene.tileSize,`official_${decor.role}`)
                    .setDisplaySize(scene.tileSize*(decor.size||.7),scene.tileSize*(decor.size||.7)).setDepth(2);
                scene.decorations.push(image);
            }
        },
        isInvestigableNearby (scene, entity) {
            return Boolean(scene.atividade.v4 && entity.type==='inscription' &&
                !scene.discoveryState?.inscriptions[entity.id] &&
                Math.abs(entity.row-scene.gutoPosition.linha)+Math.abs(entity.column-scene.gutoPosition.coluna)<=1 &&
                window.DiscoverySystem.canSee(scene,entity.row,entity.column));
        },
        updateMarkers (scene) {
            if (!scene.atividade?.v4 || !scene.entitySprites) return;
            for (const entity of scene.runState?.entities || []) {
                if (entity.type !== 'inscription') continue;
                const visual=scene.entitySprites.get(entity.id); if (!visual) continue;
                const visible=this.isInvestigableNearby(scene,entity);
                if (!visual.marker && visible) {
                    visual.marker=scene.add.text(scene.startX+entity.column*scene.tileSize,scene.startY+entity.row*scene.tileSize-scene.tileSize*.5,'!',{font:'bold 19px monospace',color:'#ffe6a0',backgroundColor:'#22243c',stroke:'#161622',strokeThickness:2,padding:{x:4,y:0}}).setOrigin(.5).setDepth(24);
                    scene.entityVisuals.push(visual.marker);
                }
                visual.marker?.setVisible(visible);
            }
        }
    };
})();
