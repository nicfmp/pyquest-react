(function () {
    'use strict';
    const ASSETS = { ambient:'assets/audio/ambient.wav', interact:'assets/audio/interact.wav', collect:'assets/audio/collect.wav', mechanism:'assets/audio/mechanism.wav', portal:'assets/audio/portal.wav', damage:'assets/audio/damage.wav', complete:'assets/audio/complete.wav' };
    const key = name => `v5_${name}`;
    class AudioSession {
        constructor (game) {
            this.game = game; this.manager = game.sound; this.music = null; this.effects = new Map();
            this.musicVolume = .18; this.effectsVolume = .35; this.muted = false;
            this.interacted = false; this.destroyed = false; this.listeners = new Set(); this.lastCue = -Infinity;
            this.onGesture = event => {
                if (!event.isTrusted) return;
                this.interacted = true;
                // Phaser owns the AudioContext and its browser unlock lifecycle.
                this.start();
            };
            this.onUnlock = () => { this.start(); this.notify(); };
            document.addEventListener('pointerdown', this.onGesture, true);
            document.addEventListener('keydown', this.onGesture, true);
            this.manager?.on('unlocked', this.onUnlock);
            game.events.once('destroy', () => this.destroy());
        }
        available (name) { return Boolean(this.game.cache?.audio?.exists(key(name))); }
        start () {
            if (this.destroyed || !this.interacted || this.manager?.locked || !this.available('ambient')) return;
            if (!this.music) this.music = this.manager.add(key('ambient'), { loop:true, volume:this.musicVolume, mute:this.muted });
            if (!this.music.isPlaying && !this.music.isPaused) this.music.play();
            this.notify();
        }
        play (name) {
            if (this.destroyed || this.muted || !this.interacted || this.manager?.locked || !this.effectsVolume || !this.available(name)) return;
            const now = performance.now();
            // Dense chains of mechanisms produce one cue, never a wall of sound.
            if (now - this.lastCue < 100 && !['damage','complete','portal'].includes(name)) return;
            let sound = this.effects.get(name);
            if (!sound) { sound = this.manager.add(key(name), { volume:this.effectsVolume }); this.effects.set(name, sound); }
            if (sound.isPlaying) return;
            this.lastCue = now; sound.play();
        }
        setVolume (channel, value) {
            const volume = Number(value); if (!Number.isFinite(volume)) return;
            if (channel === 'music') { this.musicVolume = Math.max(0, Math.min(1, volume)); this.music?.setVolume(this.musicVolume); }
            if (channel === 'effects') { this.effectsVolume = Math.max(0, Math.min(1, volume)); this.effects.forEach(sound => sound.setVolume(this.effectsVolume)); }
            this.notify();
        }
        setMuted (muted) {
            this.muted = Boolean(muted); this.music?.setMute(this.muted);
            this.effects.forEach(sound => sound.setMute(this.muted)); this.notify();
        }
        status () {
            if (!this.available('ambient')) return 'Áudio indisponível neste navegador';
            if (this.muted) return 'Áudio silenciado';
            if (!this.music?.isPlaying) return 'Interaja com a página para iniciar o áudio';
            return 'Trilha ambiente em reprodução';
        }
        notify () { this.listeners.forEach(listener => listener()); }
        destroy () {
            if (this.destroyed) return;
            this.destroyed = true;
            document.removeEventListener('pointerdown', this.onGesture, true);
            document.removeEventListener('keydown', this.onGesture, true);
            this.manager?.off('unlocked', this.onUnlock);
            this.music?.destroy(); this.music = null;
            this.effects.forEach(sound => sound.destroy()); this.effects.clear(); this.listeners.clear();
        }
    }
    window.AudioSystem = {
        ASSETS, AudioSession,
        forScene (scene) {
            const game = scene.sys?.game || scene.game;
            if (!game?.sound) return null;
            if (!game.pkAudio) game.pkAudio = new AudioSession(game);
            return game.pkAudio;
        },
        preload (scene) { Object.entries(ASSETS).forEach(([name,path]) => scene.load.audio(key(name), path)); },
        play (scene, name) { if (!scene.testMode) this.forScene(scene)?.play(name); },
        mount (scene, host) {
            const audio = this.forScene(scene); if (!audio || !host) return;
            scene.audioControlsCleanup?.();
            const controls = document.createElement('details'); controls.className = 'audio-controls';
            controls.innerHTML = `<summary>ÁUDIO</summary><div class="audio-panel"><strong>Som da dungeon</strong><button type="button" class="audio-mute" aria-pressed="false">Silenciar áudio</button><label>Música <output class="music-value"></output><input class="music-volume" type="range" min="0" max="100" step="1" aria-label="Volume da música"></label><label>Efeitos <output class="effects-value"></output><input class="effects-volume" type="range" min="0" max="100" step="1" aria-label="Volume dos efeitos"></label><small class="audio-status" role="status"></small></div>`;
            host.appendChild(controls);
            const q = selector => controls.querySelector(selector);
            const sync = () => {
                q('.audio-mute').setAttribute('aria-pressed', String(audio.muted));
                q('.audio-mute').textContent = audio.muted ? 'Ativar áudio' : 'Silenciar áudio';
                for (const channel of ['music','effects']) {
                    const value = Math.round(audio[`${channel}Volume`] * 100);
                    q(`.${channel}-volume`).value = String(value); q(`.${channel}-value`).textContent = `${value}%`;
                }
                q('.audio-status').textContent = audio.status();
            };
            const handlers = [];
            const listen = (node, type, callback) => { node.addEventListener(type, callback); handlers.push(() => node.removeEventListener(type, callback)); };
            listen(q('.audio-mute'), 'click', () => audio.setMuted(!audio.muted));
            for (const channel of ['music','effects']) listen(q(`.${channel}-volume`), 'input', event => audio.setVolume(channel, Number(event.target.value) / 100));
            listen(controls, 'keydown', event => { if (event.key === 'Escape') { controls.open = false; q('summary').focus(); } });
            audio.listeners.add(sync); audio.start(); sync();
            const cleanup = () => { handlers.forEach(remove => remove()); audio.listeners.delete(sync); controls.remove(); scene.events.off('shutdown', cleanup); if (scene.audioControlsCleanup === cleanup) scene.audioControlsCleanup = null; };
            scene.audioControlsCleanup = cleanup; scene.events.once('shutdown', cleanup);
        }
    };
})();
