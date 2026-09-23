(function () {
    'use strict';
    // IDs are permanent collectible identities; spending must never remove them.
    window.CoinSystem = {
        ensure (scene) {
            let progress = window.PersistenceService.load();
            if (!progress.coinCollection) {
                progress.coinCollection = { version:1, ids:[], legacyCredit:progress.walletCoins, spent:0 };
                progress = window.PersistenceService.save(progress);
            }
            if (scene) scene.playerProgress = progress;
            return progress;
        },
        restore (scene) {
            if (!scene.atividade.v4) return;
            const ids = new Set(this.ensure(scene).coinCollection.ids);
            for (const e of scene.runState.entities) if (e.type === 'coin' && ids.has(e.id)) e.state = 'collected';
        },
        collect (scene, entity) {
            if (!scene.atividade.v4 || entity.type !== 'coin' ||
                !scene.atividade.entities.some(e => e.type === 'coin' && e.id === entity.id) ||
                entity.row !== scene.gutoPosition.linha || entity.column !== scene.gutoPosition.coluna) return false;
            const progress = this.ensure(scene), ids = progress.coinCollection.ids;
            const fresh = !ids.includes(entity.id);
            if (fresh) {
                ids.push(entity.id);
                // Synchronous durable write at pickup, independent of execution/completion.
                scene.playerProgress = window.PersistenceService.save(progress);
            }
            entity.state = 'collected';
            window.GameUI?.atualizarProgresso(scene);
            return fresh;
        },
        stats (scene) {
            const ids = (scene.playerProgress || this.ensure(scene)).coinCollection?.ids || [];
            const prefix = `A${String(scene.atividade.id).padStart(2,'0')}_`;
            return { collected:ids.filter(id => id.startsWith(prefix)).length, available:5, total:ids.length, totalAvailable:100 };
        }
    };
})();
