window.ProgressionSystem = {
    inicializar (scene) { scene.playerProgress = window.PersistenceService.load(); return scene.playerProgress; },
    atividadeDesbloqueada (scene, id) { return Boolean(scene.devMode) || id <= (scene.playerProgress || window.PersistenceService.load()).unlockedMax; },
    concluirAtividade (scene) {
        if (scene.completionProcessed) return scene.lastReward || { xp: 0, coins: 0, firstCompletion: false };
        scene.completionProcessed = true;
        const activity = scene.atividade; const balance = window.GAME_CONSTANTS.BALANCEAMENTO_PROVISORIO; const progress = window.PersistenceService.load();
        const rewarded = Boolean(progress.rewardedActivities[activity.id]); const replay = !activity.v4 && (Boolean(activity.rewards && activity.rewards.replayRewards) || balance.RECOMPENSA_EM_REPLAY);
        let xp = 0; let coins = 0;
        if (!rewarded || replay) {
            const base = activity.rewards && Number.isFinite(activity.rewards.xpBase) ? activity.rewards.xpBase : balance.XP_BASE_PADRAO;
            xp = Math.round(base * (balance.MULTIPLICADOR_XP_POR_VIDAS[scene.livesRemaining] || 0.5));
            coins = activity.v4 ? 0 : Math.max(0, Number(scene.runState.coinsPending) || 0);
            progress.totalXp += xp; progress.walletCoins += coins;
            progress.rewardedActivities[activity.id] = { xp, coins, livesRemaining: scene.livesRemaining, rewardedAt: new Date().toISOString() };
        }
        if (!progress.completedActivities.includes(activity.id)) progress.completedActivities.push(activity.id);
        progress.completedActivities.sort((a, b) => a - b); progress.unlockedMax = Math.max(progress.unlockedMax, Math.min(window.ACTIVITIES.length, activity.id + 1));
        scene.playerProgress = window.PersistenceService.save(progress); scene.lastReward = { xp, coins, firstCompletion: !rewarded, livesRemaining: scene.livesRemaining };
        if (window.GameUI) window.GameUI.atualizarProgresso(scene); return scene.lastReward;
    }
};
