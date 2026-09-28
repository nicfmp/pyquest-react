(function () {
    'use strict';
    let memoryState = null;
    let devState = null;
    function defaults () { return { schemaVersion: 2, walletCoins: 0, totalXp: 0, completedActivities: [], unlockedMax: 1, rewardedActivities: {}, updatedAt: null }; }
    function normalize (raw) {
        const state = raw && typeof raw === 'object' ? raw : {}; const result = defaults();
        result.walletCoins = Number.isFinite(state.walletCoins) ? Math.max(0, state.walletCoins) : 0;
        result.totalXp = Number.isFinite(state.totalXp) ? Math.max(0, state.totalXp) : 0;
        result.completedActivities = Array.isArray(state.completedActivities) ? [...new Set(state.completedActivities.filter(Number.isInteger))] : [];
        result.unlockedMax = Number.isInteger(state.unlockedMax) ? Math.min(20, Math.max(1, state.unlockedMax)) : 1;
        result.rewardedActivities = state.rewardedActivities && typeof state.rewardedActivities === 'object' ? { ...state.rewardedActivities } : {};
        // A estrutura de moedas permanece compatível com saves anteriores no banco.
        if (state.coinCollection && state.coinCollection.version === 1) {
            const ledger = state.coinCollection;
            const ids = [...new Set((Array.isArray(ledger.ids) ? ledger.ids : []).filter(id => typeof id === 'string' && /^A(?:0[1-9]|1[0-9]|20)_C0[1-5]$/.test(id)))].sort();
            const legacyCredit = Number.isFinite(ledger.legacyCredit) ? Math.max(0, Math.floor(ledger.legacyCredit)) : 0;
            const spent = Number.isFinite(ledger.spent) ? Math.min(legacyCredit + ids.length, Math.max(0, Math.floor(ledger.spent))) : 0;
            result.coinCollection = { version:1, ids, legacyCredit, spent };
            result.walletCoins = legacyCredit + ids.length - spent;
        }
        if (window.ACTIVITIES?.[0]?.v6 && window.JourneySystem) { result.schemaVersion=3; result.journey=window.JourneySystem.normalize(state.journey,result); }
        result.updatedAt = state.updatedAt || null; return result;
    }
    let syncTimer = null;
    let inFlight = false;
    let dirty = false;
    let retryTimer = null;
    let saveNotice = null;

    function showSaveError (message) {
        if (!saveNotice) {
            saveNotice = document.createElement('div');
            saveNotice.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:99999;background:#5d2020;color:white;padding:10px 16px;border-radius:8px;font:14px Arial;text-align:center;max-width:90vw';
            document.body.appendChild(saveNotice);
        }
        saveNotice.textContent = message;
    }
    function clearSaveError () { if (saveNotice) { saveNotice.remove(); saveNotice = null; } }
    function clone (value) { return JSON.parse(JSON.stringify(value)); }
    function devProfile () { return Boolean(window.ACTIVITIES?.[0]?.v6 && new URLSearchParams(window.location.search).get('dev') === '1'); }

    function schedule () {
        if (devProfile() || !dirty) return;
        clearTimeout(syncTimer);
        syncTimer = setTimeout(flush, 400);
    }
    async function flush () {
        clearTimeout(syncTimer);
        if (inFlight || !dirty) return;
        const remote = window.__PYQUEST_REMOTE__;
        if (!remote?.token || !remote?.apiBase) return;
        const snapshot = clone(memoryState);
        dirty = false;
        inFlight = true;
        try {
            const response = await fetch(`${remote.apiBase}/game-progress`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${remote.token}` },
                body: JSON.stringify({ state: snapshot })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            clearSaveError();
            clearTimeout(retryTimer);
            retryTimer = null;
        } catch (error) {
            dirty = true;
            showSaveError('Progresso ainda não salvo. Verifique a conexão; uma nova tentativa será feita automaticamente.');
            clearTimeout(retryTimer);
            retryTimer = setTimeout(() => { retryTimer = null; flush(); }, 5000);
        } finally {
            inFlight = false;
            if (dirty && !retryTimer) schedule();
        }
    }
    window.addEventListener('online', () => { clearTimeout(retryTimer); retryTimer = null; flush(); });
    window.addEventListener('pagehide', () => {
        if ((!dirty && !inFlight) || devProfile()) return;
        const remote = window.__PYQUEST_REMOTE__;
        if (!remote?.token) return;
        // keepalive mantém a requisição ativa enquanto a página é descarregada.
        fetch(`${remote.apiBase}/game-progress`, {
            method: 'PUT', keepalive: true,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${remote.token}` },
            body: JSON.stringify({ state: memoryState })
        }).catch(() => {});
    });

    window.PersistenceService = {
        initialize (serverState) { memoryState = normalize(serverState); },
        load () {
            if (devProfile()) { devState ||= normalize(null); return clone(devState); }
            if (!memoryState) throw new Error('Progresso do banco de dados ainda não carregado.');
            return clone(memoryState);
        },
        save (state) {
            const value = normalize(state);
            value.updatedAt = new Date().toISOString();
            if (devProfile()) { devState = value; return clone(value); }
            if (!memoryState) throw new Error('Progresso do banco de dados ainda não carregado.');
            memoryState = value;
            dirty = true;
            schedule();
            return clone(value);
        },
        resetJourney () { return this.save(defaults()); },
        resetForTests () { devState = normalize(null); return clone(devState); }
    };
})();
