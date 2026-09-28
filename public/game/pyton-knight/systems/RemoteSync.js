// O site envia a autenticação ao iframe por postMessage, sem colocar o token na URL.
(function () {
    'use strict';

    let resolveReady, rejectReady;
    const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
    const remote = { apiBase: null, token: null, serverState: null, ready };
    window.__PYQUEST_REMOTE__ = remote;

    const watchdog = setTimeout(() => rejectReady(new Error('Não foi possível conectar o jogo à sua conta.')), 60000);
    window.addEventListener('message', async (event) => {
        if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.type !== 'pyquest:auth' || remote.token) return;
        const { apiBase, token } = event.data;
        if (typeof apiBase !== 'string' || typeof token !== 'string' || !token || !apiBase.startsWith('http')) return;
        remote.apiBase = apiBase;
        remote.token = token;
        try {
            const response = await fetch(`${apiBase}/game-progress`, { headers: { Authorization: `Bearer ${token}` } });
            if (!response.ok) throw new Error(response.status === 401 ? 'Sua sessão expirou. Entre novamente para jogar.' : 'Não foi possível carregar seu progresso do banco de dados.');
            const body = await response.json();
            clearTimeout(watchdog);
            remote.serverState = body?.state && typeof body.state === 'object' && !Array.isArray(body.state) ? body.state : null;
            if (!remote.serverState) {
                // Importação opcional do save antigo; o armazenamento local deixa de ser usado depois dela.
                let previous = null;
                try { previous = JSON.parse(localStorage.getItem('pyton_knight_progress_v2')); } catch (error) { /* nenhum save antigo válido */ }
                const hasProgress = previous && typeof previous === 'object' &&
                    (previous.completedActivities?.length || previous.totalXp || previous.walletCoins || Object.keys(previous.journey?.checkpoints || {}).length);
                if (hasProgress && window.confirm('Existe progresso antigo neste navegador. Ele pertence à sua conta? Clique em OK para importar para o banco de dados.')) {
                    const imported = await fetch(`${apiBase}/game-progress`, {
                        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ state: previous })
                    });
                    if (!imported.ok) throw new Error('Não foi possível importar o progresso antigo. Tente novamente.');
                    remote.serverState = previous;
                    try { localStorage.removeItem('pyton_knight_progress_v2'); } catch (error) { /* save no banco confirmado */ }
                }
            }
            resolveReady(remote.serverState);
        } catch (error) {
            clearTimeout(watchdog);
            rejectReady(error);
        }
    });
    window.parent.postMessage({ type: 'pyquest:ready' }, window.location.origin);
})();
