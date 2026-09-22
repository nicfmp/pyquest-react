(function () {
    'use strict';
    let memoryState = null;
    let storageFailed = false;
    function defaults () { return { schemaVersion: 2, walletCoins: 0, totalXp: 0, completedActivities: [], unlockedMax: 1, rewardedActivities: {}, updatedAt: null }; }
    function normalize (raw) {
        const state = raw && typeof raw === 'object' ? raw : {}; const result = defaults();
        result.walletCoins = Number.isFinite(state.walletCoins) ? Math.max(0, state.walletCoins) : 0;
        result.totalXp = Number.isFinite(state.totalXp) ? Math.max(0, state.totalXp) : 0;
        result.completedActivities = Array.isArray(state.completedActivities) ? [...new Set(state.completedActivities.filter(Number.isInteger))] : [];
        result.unlockedMax = Number.isInteger(state.unlockedMax) ? Math.min(20, Math.max(1, state.unlockedMax)) : 1;
        result.rewardedActivities = state.rewardedActivities && typeof state.rewardedActivities === 'object' ? { ...state.rewardedActivities } : {};
        // Optional V4 extension: the storage key and V2 progression remain compatible.
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
    function storageAvailable () { try { return typeof window.localStorage !== 'undefined' && window.localStorage !== null; } catch (error) { return false; } }
    window.PersistenceService = {
        load () { if (storageFailed || !storageAvailable()) { memoryState = normalize(memoryState); return JSON.parse(JSON.stringify(memoryState)); } try { const raw = window.localStorage.getItem(window.GAME_CONSTANTS.STORAGE_KEY); return normalize(raw ? JSON.parse(raw) : null); } catch (error) { storageFailed = true; return normalize(memoryState); } },
        save (state) { const value = normalize(state); value.updatedAt = new Date().toISOString(); memoryState = value; if (!storageFailed && storageAvailable()) { try { window.localStorage.setItem(window.GAME_CONSTANTS.STORAGE_KEY, JSON.stringify(value)); } catch (error) { storageFailed = true; memoryState = value; } } else memoryState = value; return JSON.parse(JSON.stringify(value)); },
        resetForTests () { memoryState = defaults(); storageFailed = false; if (storageAvailable()) { try { window.localStorage.removeItem(window.GAME_CONSTANTS.STORAGE_KEY); } catch (error) { storageFailed = true; } } return this.load(); }
    };
})();
