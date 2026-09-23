(function () {
    'use strict';
    let memoryState = null;
    let storageFailed = false;
    let remoteHydrated = false;
    let syncTimer = null;
    function defaults () { return { schemaVersion: 2, walletCoins: 0, totalXp: 0, completedActivities: [], unlockedMax: 1, rewardedActivities: {}, updatedAt: null }; }
    function normalize (raw) {
        const state = raw && typeof raw === 'object' ? raw : {}; const result = defaults();
        result.walletCoins = Number.isFinite(state.walletCoins) ? Math.max(0, state.walletCoins) : 0;
        result.totalXp = Number.isFinite(state.totalXp) ? Math.max(0, state.totalXp) : 0;
        result.completedActivities = Array.isArray(state.completedActivities) ? [...new Set(state.completedActivities.filter(Number.isInteger))] : [];
        result.unlockedMax = Number.isInteger(state.unlockedMax) ? Math.min(20, Math.max(1, state.unlockedMax)) : 1;
        result.rewardedActivities = state.rewardedActivities && typeof state.rewardedActivities === 'object' ? { ...state.rewardedActivities } : {};
        if (state.coinCollection && state.coinCollection.version === 1) {
            const ledger = state.coinCollection;
            const ids = [...new Set((Array.isArray(ledger.ids) ? ledger.ids : []).filter(id => typeof id === 'string' && /^A(?:0[1-9]|1[0-9]|20)_C0[1-5]$/.test(id)))].sort();
            const legacyCredit = Number.isFinite(ledger.legacyCredit) ? Math.max(0, Math.floor(ledger.legacyCredit)) : 0;
            const spent = Number.isFinite(ledger.spent) ? Math.min(legacyCredit + ids.length, Math.max(0, Math.floor(ledger.spent))) : 0;
            result.coinCollection = { version:1, ids, legacyCredit, spent };
            result.walletCoins = legacyCredit + ids.length - spent;
        }
        result.updatedAt = state.updatedAt || null; return result;
    }
    // Combina o estado local (localStorage deste navegador) com o estado vindo
    // do servidor, sem nunca perder progresso: cada campo fica com o "melhor"
    // valor dos dois lados. Importante no primeiro acesso após essa
    // funcionalidade existir (jogador já tinha progresso salvo só localmente)
    // e ao abrir o jogo num navegador novo (só existe progresso no servidor).
    function mergeStates (a, b) {
        if (!a) return b; if (!b) return a;
        const merged = defaults();
        merged.walletCoins = Math.max(a.walletCoins, b.walletCoins);
        merged.totalXp = Math.max(a.totalXp, b.totalXp);
        merged.completedActivities = [...new Set([...a.completedActivities, ...b.completedActivities])];
        merged.unlockedMax = Math.max(a.unlockedMax, b.unlockedMax);
        merged.rewardedActivities = { ...a.rewardedActivities, ...b.rewardedActivities };
        merged.updatedAt = new Date().toISOString();
        if (a.coinCollection || b.coinCollection) {
            const idsA = a.coinCollection ? a.coinCollection.ids : [];
            const idsB = b.coinCollection ? b.coinCollection.ids : [];
            const ids = [...new Set([...idsA, ...idsB])].sort();
            const legacyCredit = Math.max(a.coinCollection ? a.coinCollection.legacyCredit : 0, b.coinCollection ? b.coinCollection.legacyCredit : 0);
            const spentRaw = Math.max(a.coinCollection ? a.coinCollection.spent : 0, b.coinCollection ? b.coinCollection.spent : 0);
            const spent = Math.min(legacyCredit + ids.length, spentRaw);
            merged.coinCollection = { version: 1, ids, legacyCredit, spent };
            merged.walletCoins = legacyCredit + ids.length - spent;
        }
        return merged;
    }
    function storageAvailable () { try { return typeof window.localStorage !== 'undefined' && window.localStorage !== null; } catch (error) { return false; } }
    function readLocalRaw () {
        if (storageFailed || !storageAvailable()) return null;
        try { const raw = window.localStorage.getItem(window.GAME_CONSTANTS.STORAGE_KEY); return raw ? JSON.parse(raw) : null; }
        catch (error) { storageFailed = true; return null; }
    }
    function writeLocalRaw (value) {
        if (storageFailed || !storageAvailable()) return;
        try { window.localStorage.setItem(window.GAME_CONSTANTS.STORAGE_KEY, JSON.stringify(value)); }
        catch (error) { storageFailed = true; }
    }
    // Só roda uma vez por sessão: na primeira leitura, se o RemoteSync já
    // tiver recebido o estado do servidor (ver index.html — Game.js só carrega
    // depois disso resolver), funde com o que já existir no localStorage.
    function hydrateFromRemoteIfNeeded () {
        if (remoteHydrated) return;
        remoteHydrated = true;
        const remote = (typeof window !== 'undefined') ? window.__PYQUEST_REMOTE__ : null;
        if (!remote || !remote.serverState) return;
        const merged = mergeStates(normalize(readLocalRaw()), normalize(remote.serverState));
        memoryState = merged;
        writeLocalRaw(merged);
        scheduleRemoteSync(merged);
    }
    // Envia o progresso para o backend em segundo plano, sem travar o jogo.
    // Debounced para não disparar uma request a cada moeda coletada.
    function scheduleRemoteSync (value) {
        const remote = (typeof window !== 'undefined') ? window.__PYQUEST_REMOTE__ : null;
        if (!remote || !remote.apiBase || !remote.token) return;
        if (syncTimer) clearTimeout(syncTimer);
        syncTimer = setTimeout(function () {
            syncTimer = null;
            try {
                fetch(`${remote.apiBase}/game-progress`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${remote.token}` },
                    body: JSON.stringify({ state: value }),
                }).catch(function () { /* offline: localStorage continua sendo a fonte de verdade local */ });
            } catch (error) { /* ignora erros de rede */ }
        }, 600);
    }
    // Última tentativa de salvar ao fechar a aba/trocar de página. sendBeacon
    // não permite headers customizados, por isso o token vai como query string
    // só nesta chamada (a rota do backend aceita os dois formatos).
    function flushRemoteSyncOnUnload (value) {
        const remote = (typeof window !== 'undefined') ? window.__PYQUEST_REMOTE__ : null;
        if (!remote || !remote.apiBase || !remote.token) return;
        if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
        try {
            const blob = new Blob([JSON.stringify({ state: value })], { type: 'application/json' });
            navigator.sendBeacon(`${remote.apiBase}/game-progress?token=${encodeURIComponent(remote.token)}`, blob);
        } catch (error) { /* ignora: melhor esforço */ }
    }
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('pagehide', function () { if (memoryState) flushRemoteSyncOnUnload(memoryState); });
    }
    window.PersistenceService = {
        load () {
            hydrateFromRemoteIfNeeded();
            if (memoryState) return JSON.parse(JSON.stringify(memoryState));
            if (storageFailed || !storageAvailable()) { memoryState = normalize(memoryState); return JSON.parse(JSON.stringify(memoryState)); }
            const normalized = normalize(readLocalRaw());
            memoryState = normalized;
            return JSON.parse(JSON.stringify(normalized));
        },
        save (state) {
            const value = normalize(state); value.updatedAt = new Date().toISOString(); memoryState = value;
            writeLocalRaw(value);
            scheduleRemoteSync(value);
            return JSON.parse(JSON.stringify(value));
        },
        resetForTests () {
            memoryState = defaults(); storageFailed = false; remoteHydrated = true;
            if (storageAvailable()) { try { window.localStorage.removeItem(window.GAME_CONSTANTS.STORAGE_KEY); } catch (error) { storageFailed = true; } }
            return this.load();
        }
    };
})();
