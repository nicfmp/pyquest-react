(function () {
    'use strict';
    window.DevToolsSystem = {
        move (scene, key) {
            if (!scene.devMode || !scene.devFlying || scene.executando || scene.gameOverPending) return false;
            const directions={ArrowUp:[-1,0,'NORTE'],ArrowRight:[0,1,'LESTE'],ArrowDown:[1,0,'SUL'],ArrowLeft:[0,-1,'OESTE']}, d=directions[key]; if(!d)return false;
            const row=scene.gutoPosition.linha+d[0], column=scene.gutoPosition.coluna+d[1];
            if(row<0 || column<0 || row>=scene.mapa.length || column>=scene.mapa[0].length)return false;
            // Flight inspects geometry without collecting, triggering mechanisms or finishing missions.
            scene.gutoPosition={linha:row,coluna:column};scene.playerFacing=d[2];
            scene.guto?.setPosition(scene.startX+column*scene.tileSize,scene.startY+row*scene.tileSize);
            window.AnimationSystem?.pose(scene);window.GameUI?.atualizarOrientacao(scene);window.DiscoverySystem?.observe(scene);return true;
        },
        attach (scene) {
            scene.devFlying=false;
            if(!scene.atividade.v6 || !scene.devMode || !scene.bookNode)return;
            const button=document.createElement('button');button.className='dev-flight';button.textContent='DEV: ATIVAR VOO';button.title='Setas movem Guto. O save normal não é alterado.';
            scene.bookNode.querySelector('.map-controls').appendChild(button);
            button.addEventListener('click',()=>{if(scene.executando||scene.gameOverPending)return;scene.devFlying=!scene.devFlying;button.textContent=scene.devFlying?'DEV: ENCERRAR VOO':'DEV: ATIVAR VOO';button.setAttribute('aria-pressed',String(scene.devFlying));if(!scene.devFlying)window.DungeonSystem.resetRun(scene);window.GameUI.definirFeedback(scene,scene.devFlying?'Voo de inspeção: use as setas. Código e conclusão ficam suspensos; o save normal está isolado.':'Voo encerrado. Mecanismos e posição restaurados para testar o código.','info');});
            const key=event=>{if(['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName?.toUpperCase())||event.target?.isContentEditable)return;if(this.move(scene,event.key))event.preventDefault();};
            document.addEventListener?.('keydown',key);scene.events?.once('shutdown',()=>document.removeEventListener?.('keydown',key));
        }
    };
})();
