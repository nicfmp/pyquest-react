class MainMenu extends Phaser.Scene {
    constructor () { super('MainMenu'); }
    create () {
        const progress = window.PersistenceService.load();
        const width = this.scale.width, height = this.scale.height;
        for (let y = 0; y < height; y += 64) for (let x = 0; x < width; x += 64) this.add.image(x + 32, y + 32, 'official_wall_top_main').setDisplaySize(64,64).setAlpha(.35);
        const host = document.getElementById('interface'); host.classList.remove('leaving'); host.textContent = '';
        const screen = document.createElement('main'); screen.className = 'menu-screen';
        screen.innerHTML = `<section class="menu-card"><span class="menu-eyebrow">EXPLORE. PROGRAME. APRENDA.</span><h1>PYTON<br>KNIGHT</h1><p>Uma dungeon. Vinte desafios.<br>Escreva o código que abre o caminho.</p><div class="menu-stats"><span class="completed"></span><span class="xp"></span><span class="coins"></span></div><div class="menu-progress" aria-label="Progresso"><span></span></div><button class="play-button"></button><p class="menu-current"></p><p class="menu-footer">Quatro unidades de Python · Guto se move pelo seu código</p></section>`;
        host.appendChild(screen);
        screen.querySelector('.completed').textContent = `${progress.completedActivities.length}/20 concluídas`;
        screen.querySelector('.xp').textContent = `${progress.totalXp} XP`; screen.querySelector('.coins').textContent = `${progress.walletCoins} moedas`;
        screen.querySelector('.menu-progress span').style.width = `${progress.completedActivities.length * 5}%`;
        const current = window.ACTIVITIES[Math.max(0, progress.unlockedMax - 1)];
        screen.querySelector('.menu-current').textContent = `Atividade ${current.id} · ${current.nome}`;
        const play = screen.querySelector('.play-button'); play.textContent = progress.completedActivities.length ? 'CONTINUAR A JORNADA →' : 'COMEÇAR A JORNADA →';
        if (window.ACTIVITIES[0]?.v4) {
            screen.querySelector('.coins').textContent = `Total: ${progress.coinCollection?.ids.length || 0} / 100 moedas`;
            screen.querySelector('.coins').title = `Saldo disponível: ${progress.walletCoins} moedas`;
            if (progress.completedActivities.length === 20) {
                screen.querySelector('.menu-eyebrow').textContent = 'JORNADA CONCLUÍDA';
                screen.querySelector('.menu-current').textContent = 'As 20 atividades foram concluídas. Você pode revisitar a dungeon e procurar as moedas restantes.';
                play.textContent = 'REVISITAR A DUNGEON →';
            }
        }
        play.addEventListener('click', () => { play.disabled = true; host.classList.add('leaving'); this.cameras.main.fadeOut(160); this.time.delayedCall(180, () => { host.classList.remove('leaving'); this.scene.start('Game', { atividadeIndex:current.id - 1 }); }); });
        this.events.once('shutdown', () => { host.textContent = ''; });
    }
}
