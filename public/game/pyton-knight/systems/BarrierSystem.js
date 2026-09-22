window.BarrierSystem = {

    // =========================================
    // DESENHAR TODAS AS BARREIRAS DA ATIVIDADE
    // =========================================

    desenhar(scene)
    {
        const barreiras = scene.barreiras || [];

        for (const barreira of barreiras)
        {
            const de = barreira.de;
            const para = barreira.para;

            const x1 =
                scene.startX +
                de.coluna * scene.tileSize;

            const y1 =
                scene.startY +
                de.linha * scene.tileSize;

            const x2 =
                scene.startX +
                para.coluna * scene.tileSize;

            const y2 =
                scene.startY +
                para.linha * scene.tileSize;

            const meioX =
                (x1 + x2) / 2;

            const meioY =
                (y1 + y2) / 2;


            // Same logical edge; only the original red marker becomes an official gate.
            const horizontal = de.coluna === para.coluna;
            scene.add.image(meioX, meioY, 'official_gate_front')
                .setDisplaySize(scene.tileSize * 0.95, scene.tileSize * 0.22)
                .setAngle(horizontal ? 0 : 90).setDepth(8);

        }
    },


    // =========================================
    // VERIFICAR SE EXISTE BARREIRA
    // ENTRE DUAS CASAS
    // =========================================

    existe(
        scene,
        linhaAtual,
        colunaAtual,
        novaLinha,
        novaColuna
    )
    {
        const barreiras =
            scene.barreiras || [];


        return barreiras.some(
            barreira =>
            {
                const ida =
                    barreira.de.linha === linhaAtual &&
                    barreira.de.coluna === colunaAtual &&
                    barreira.para.linha === novaLinha &&
                    barreira.para.coluna === novaColuna;


                const volta =
                    barreira.para.linha === linhaAtual &&
                    barreira.para.coluna === colunaAtual &&
                    barreira.de.linha === novaLinha &&
                    barreira.de.coluna === novaColuna;


                return ida || volta;
            }
        );
    }

};