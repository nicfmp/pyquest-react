// Ponte entre o jogo (que roda dentro de um <iframe> no site PyQuest) e o
// backend. O React embute o jogo passando ?apiBase=...&token=... na URL do
// iframe; esse arquivo lê esses parâmetros e busca o progresso salvo no
// servidor ANTES do Game.js ser carregado (ver index.html), para que
// PersistenceService já encontre o estado do servidor pronto na primeira
// chamada de load(). Se não houver apiBase/token (jogo aberto fora do site,
// ou offline), tudo continua funcionando normalmente a partir do localStorage.
(function () {
    'use strict';

    function readParam(name) {
        try { return new URLSearchParams(window.location.search).get(name); }
        catch (error) { return null; }
    }

    const apiBase = readParam('apiBase');
    const token = readParam('token');
    const TIMEOUT_MS = 4000;

    function timeout(ms) {
        return new Promise((resolve) => setTimeout(() => resolve(null), ms));
    }

    async function fetchServerState() {
        if (!apiBase || !token) return null;
        try {
            const response = await Promise.race([
                fetch(`${apiBase}/game-progress`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                timeout(TIMEOUT_MS),
            ]);
            if (!response || !response.ok) return null;
            const body = await response.json();
            return body && body.state && typeof body.state === 'object' ? body.state : null;
        } catch (error) {
            return null;
        }
    }

    const remote = { apiBase, token, serverState: null, ready: null };
    remote.ready = fetchServerState().then((state) => {
        remote.serverState = state;
        return state;
    });

    window.__PYQUEST_REMOTE__ = remote;
})();
