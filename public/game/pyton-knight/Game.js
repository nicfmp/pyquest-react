class Game extends Phaser.Scene {
    constructor () { super('Game'); }
    init (data) {
        this.atividadeIndex = data && Number.isInteger(data.atividadeIndex) ? data.atividadeIndex : 0;
        this.requestedVariant = data && Number.isInteger(data.variantIndex) ? data.variantIndex : null;
        this.tutorialStepIndex = 0; this.navigating = false; this.cancelRequested = false; this.runState = null; this.cameraController = null; this.codeEditor = null; this.executionTask = null; this.discoveryState = null;
    }
    create () {
        const dependencies = [window.GAME_CONSTANTS, window.ACTIVITIES, window.BarrierSystem, window.PythonSubsetParser, window.CodeBudgetValidator, window.PersistenceService, window.ProgressionSystem, window.MissionObjectiveSystem, window.TutorialSystem, window.DungeonSystem, window.PlayerController, window.CommandInterpreter, window.MapRenderer, window.GameUI, window.CameraController, window.CodeEditor, window.ActivityGuide, window.AssetCatalog];
        if (dependencies.some((item) => !item)) { this.add.text(30, 80, 'Um módulo do jogo não carregou. Recarregue a página.', { font:'18px Arial', color:'#eaa4a4' }); return; }
        this.devMode = new URLSearchParams(window.location.search).get('dev') === '1'; this.playerProgress = window.ProgressionSystem.inicializar(this);
        this.atividadeIndex = Math.max(0, Math.min(window.ACTIVITIES.length - 1, this.atividadeIndex));
        if (!window.ProgressionSystem.atividadeDesbloqueada(this, this.atividadeIndex + 1)) this.atividadeIndex = Math.max(0, this.playerProgress.unlockedMax - 1);
        this.atividade = window.ACTIVITIES[this.atividadeIndex]; this.mapa = this.atividade.mapa; this.barreiras = this.atividade.barreiras || [];
        this.startPosition = { ...this.atividade.startPosition }; this.gutoPosition = { ...this.startPosition }; this.playerFacing = this.atividade.initialFacing || 'LESTE';
        this.livesRemaining = 3; this.executando = false; this.executionCount = 0;
        this.sessionVariantIndex = this.requestedVariant !== null ? this.requestedVariant : (this.atividade.id + new Date().getUTCDate()) % 3;
        this.tileSize = 64; this.startX = 32; this.startY = 32;
        window.AnimationSystem?.register(this); window.MapRenderer.desenhar(this); window.DiscoverySystem?.attach(this); window.BarrierSystem.desenhar(this); window.GameUI.criar(this); window.DungeonSystem.resetRun(this); window.TutorialSystem.inicializar(this);
        window.GameUI.restaurarRascunho(this); window.GameUI.atualizarVidas(this); window.GameUI.atualizarOrientacao(this); window.GameUI.atualizarProgresso(this);
        this.cameraController = window.CameraController.attach(this, this.bookNode.querySelector('.dungeon-viewport'));
        this.cameras.main.fadeIn(220, 10, 12, 17);
        this.events.once('shutdown', () => { this.cancelRequested = true; window.GameUI.destruir(this); });
    }
    update (_time, delta) { if (this.cameraController) this.cameraController.update(delta); window.DiscoverySystem?.draw(this); window.DecorationSystem?.updateMarkers(this); if(this.atividade?.v3 && this.guto && this.gutoFacingIndicator) this.gutoFacingIndicator.setPosition(this.guto.x,this.guto.y-this.tileSize*.48); }
}
const config = {
    type: Phaser.AUTO, width: window.innerWidth, height: window.innerHeight, parent:'game-container', backgroundColor:'#0c0f15',
    pixelArt:true, roundPixels:true, scale:{ mode:Phaser.Scale.RESIZE }, scene:[Boot, Preloader, MainMenu, Game]
};
window.pytonKnightGame = new Phaser.Game(config);
