(function () {
    'use strict';
    const byId = id => window.ACTIVITIES.find(a => a.id === id);
    const entity = (a,id) => a.entities.find(e => e.id === id);
    const notes = {
        '3/base':'O mestre media a pedra com duas marcas no cinzel: essa era sua unidade. No inverno, repetiu a medida duas vezes para reconstruir a escada do arquivo. O aprendiz guardou o restante do projeto na outra ala.',
        '3/fator':'Perdi o cinzel do mestre, mas não sua medida. Na última galeria couberam três unidades; uma pedra a mais sustentava o cristal. Que o próximo aprendiz confira as contas antes de caminhar.',
        '5/sigilo':'A guardiã exigia três testemunhos de quem atravessava: a luz reacendida, o mecanismo movido e este registro lido. Do salão ao cristal, cinco passos para cada testemunho. Ninguém devia partir às cegas.',
        '6/juramento':'Passamos a noite ouvindo pedras ceder. Ao primeiro fio de luz, renovamos o juramento: esperar juntos a AURORA. Não prometemos vencer pela força; prometemos não abandonar quem ainda caminhava no escuro.',
        '7/memoria':'O escudo do capitão estava partido. Mesmo assim, ele voltou para buscar o último aprendiz. Os sobreviventes chamaram seu gesto de CORAGEM. O guardião conserva a memória desse retorno, não o nome de uma espada.',
        '8/grupos':'Duas equipes chegaram à margem com ferramentas emprestadas. Cada uma assumiu uma parte igual da ponte. A quantidade fabricada por equipe ficou anotada na oficina do outro lado do salão.',
        '8/segmentos':'A carpinteira entregou três segmentos a cada equipe. Conferimos o material multiplicando a produção de uma equipe pelo número de equipes. Só depois acionamos o guincho; a ponte não perdoa contas incompletas.',
        '9/primeira':'O astrônomo gravou no sol o menor número primo. Dizia que até a menor luz podia orientar um viajante, desde que ele também consultasse a memória da lua.',
        '9/segunda':'A cartógrafa desenhou um triângulo na lua e contou seus lados. Somou essa lembrança à marca do sol: assim encontrou o espelho certo, sem confiar no brilho dos outros.',
        '10/a':'Uma sentinela permaneceu no posto até a aurora. Sua marca representa a unidade. O ferreiro pediu que levassem esse valor à próxima oficina, em vez de tentar adivinhar o selo do cofre.',
        '10/b':'Um par de martelos trabalhava na forja. O mestre multiplicava a marca da aurora por esse par para preparar os apoios da ponte. A alavanca só devia mover o material depois da leitura dos dois registros.',
        '10/c':'Três vigias protegeram o arquivo durante o incêndio. Seus nomes se perderam, mas a conta ficou: somar os vigias ao produto da forja. O espelho preserva esse tributo antes do cofre.',
        '13/energia':'A zeladora contou doze pulsações antes de selar a fonte: uma dúzia de unidades permaneceu guardada. Registrou a medida para que futuros viajantes não confundissem a força disponível com o mínimo exigido pelos validadores.',
        '13/limiar':'O primeiro validador aceitou nossa passagem quando a reserva atingiu uma dezena. O segundo apenas recusava a ausência total de energia. Anote separadamente o limiar de admissão e a energia medida na fonte: são registros diferentes.',
        '15/sol':'Ao meio-dia, o sentinela erguia o terceiro portão para poderes de vinte ou mais. A Lei do Sol era consultada primeiro; nenhum viajante forte devia ser enviado ao caminho das sombras.',
        '15/lua':'A vigia da Lua recebia, pelo segundo portão, quem alcançasse dez sem satisfazer a Lei do Sol. Ela lia os dois registros antes de julgar: os intervalos não deviam disputar o mesmo viajante.',
        '16/ecos':'O construtor bateu em cada totem uma única vez. Cada resposta trouxe uma pedra à travessia. Repetir o gesto no mesmo totem apenas devolvia o eco; era preciso reconhecer o padrão ao longo da galeria.',
        '17/lore':'A lapidadora deixou uma gema em cada nicho. Conferia o trabalho acrescentando uma à contagem anterior, nunca recomeçando do zero. Ao final, o total registrado tinha de concordar com as gemas reunidas.',
        '20/lei':'O último vigia não enfrentou o Basilisco com uma espada. Reuniu três ecos, tornou seguros os espinhos, procurou a chave sem violar baús vazios e trouxe três rubis. O selo reconheceu o conjunto desses feitos, não uma promessa.'
    };
    for(const a of window.ACTIVITIES) {
        a.v6=true;
        for(const e of a.entities) { e.v6=true; if(notes[`${a.id}/${e.id}`])e.text=notes[`${a.id}/${e.id}`]; }
        if(a.tutorialSteps){a.codigoInicial='# Escreva seu programa aqui. Consulte o Tutor e os comandos disponíveis.';a.tutorialSteps=a.tutorialSteps.map((step,i)=>({title:['OBSERVE — reconheça o caminho','EXPLORE — investigue os mecanismos','PLANEJE — conecte suas descobertas','ESCREVA — teste sua solução'][i],condition:step.condition,message:step.message,example:i===0?'andar_frente(1)':i===1?'examinar()':i===2?'virar_direita()':'# Revise os objetivos e o orçamento.'}));}
    }
    for(const a of window.ACTIVITIES.filter(a=>a.tutorialSteps)) a.tutorialSteps[3].message='Escreva a solução usando o que descobriu. Uma solução completa conclui a missão diretamente; o Tutor não preenche seu código.';
    const a6=byId(6);
    a6.descricao='Leia o juramento preservado no arquivo. Diante do pedestal, receba a resposta no campo de entrada e use print para dar voz ao compromisso dos cavaleiros.';
    a6.allowedConcepts=['print','input'];a6.requireInputContext=true;
    a6.entities.push({id:'juramento_pedestal',type:'pedestal',row:7,column:10,skin:'v3',v6:true,label:'Juramento',requiresClues:['juramento'],questions:[{id:'juramento',prompt:'Juramento — qual palavra reúne os cavaleiros?',expected:'AURORA',clue:'juramento'}]});
    entity(a6,'grade').requires.push('answer_juramento');
    a6.outputRules.forEach(r=>{r.minInputSources=1;r.requires=[...(r.requires||[]),'answer_juramento'];});
    a6.objectives.splice(1,0,{type:'flag',flag:'answer_juramento',label:'Responda ao juramento no campo de entrada'});
    a6.officialSolution=a6.officialSolution.replace('palavra = "AURORA"','palavra = input("Juramento: ")');a6.testInputs=['AURORA'];
    a6.explorationHints=['Explore o arquivo antes de responder. A resposta é digitada no campo de input, durante a execução.','Use print com o valor recebido; mantenha apenas código no editor.'];
    const a12=byId(12),sw=entity(a12,'plate');
    Object.assign(sw,{id:'route_switch',type:'mechanism_switch',initialState:'off',discreet:true,flag:'routeSwitch',label:'Interruptor antigo',connections:[{targetId:'spikes_upper',activeState:'inactive',inactiveState:'active'},{targetId:'spikes_lower',activeState:'active',inactiveState:'inactive'}]});delete sw.mode;
    a12.variantStates=null;entity(a12,'spikes_upper').initialState='active';entity(a12,'spikes_lower').initialState='inactive';
    a12.allowedCommands=a12.allowedCommands.filter(c=>c!=='placa_ativa').concat('interruptor_ativo');
    a12.descricao='Um interruptor discreto governa a bifurcação. Ilumine as galerias, procure o mecanismo no vestíbulo e consulte seu estado no código para escolher a passagem segura.';
    a12.explorationHints=['O mecanismo no canto norte do vestíbulo responde a ativar_interruptor() quando Guto olha para ele. Pisá-lo não o aciona.','O estado pode ser consultado com interruptor_ativo(). Ativo libera a galeria superior; inativo mantém a inferior segura. Observe os espinhos para confirmar a consequência.'];
    a12.objectives.unshift({type:'flag',flag:'routeSwitch',label:'Acione intencionalmente o interruptor da bifurcação'});
    a12.officialSolution=a12.officialSolution.replace('ativar_interruptor()\n','ativar_interruptor()\nvirar_esquerda()\nandar_frente()\nvirar_esquerda()\nativar_interruptor()\nvirar_esquerda()\nandar_frente()\nvirar_esquerda()\n').replace('placa_ativa()','interruptor_ativo()');
    a12.instructionBudget+=7;
    const a13=byId(13),pedestal=entity(a13,'pedestal');
    pedestal.questions=[{id:'fonte',prompt:'Registro da Fonte — quantas unidades foram preservadas?',expected:12,clue:'energia'},{id:'validadores',prompt:'Regra dos Validadores — qual é o limiar do primeiro selo?',expected:10,clue:'limiar'}];
    for(const e of a13.entities.filter(e=>e.type==='guardian')){e.requires=[...(e.requires||[]),'answer_fonte','answer_validadores'];e.condition.input='fonte';}
    a13.objectives.unshift({type:'flag',flag:'answer_fonte',label:'Responda corretamente ao Registro da Fonte'},{type:'flag',flag:'answer_validadores',label:'Responda corretamente à Regra dos Validadores'});
    a13.descricao='Investigue os dois arquivos. No pedestal, responda separadamente à medida da fonte e ao limiar dos validadores. Compare os valores recebidos para negociar cada passagem.';
    a13.explorationHints=['Cada registro responde a uma pergunta diferente. O pedestal apresenta os campos de entrada em sequência.','Guarde as duas entradas numéricas em variáveis; use-as nas condições para interagir com os validadores.'];
    a13.officialSolution=a13.officialSolution.replace('limiar = 10\n','').replace('energia = int(input("Energia da fonte: "))','energia = int(input("Registro da Fonte: "))\nlimiar = int(input("Regra dos Validadores: "))');a13.testInputs=['12','10'];
    const a14=byId(14);Object.assign(entity(a14,'plate'),{row:3,column:6});
    a14.entities.push({id:'manutencao',type:'inscription',row:2,column:7,skin:'v3',v6:true,label:'Diário de manutenção',text:'A ala verde feriu dois aprendizes antes de descobrirmos o contrapeso. Na câmara azul, a pedra móvel junto à parede oeste recolhe as pontas do corredor sul. As outras peças são antigas bases sem ligação. Observe o caminho de volta: não pise outra vez no contrapeso.'});
    a14.descricao='As duas alas precisam cooperar para abrir o selo final. Antes de seguir ao sul, investigue a manutenção dos espinhos na câmara azul; atravessar o corredor não resolve o mecanismo por você.';
    a14.explorationHints=['O Diário de manutenção explica como tornar seguro o caminho para a alavanca verde.','Uma passagem aceita azul OU verde; o selo final exige azul E verde. Planeje as condições e a rota.'];
    a14.officialSolution=a14.officialSolution.replace('ativar_alavanca("lever_blue")\nvirar_direita()\nvirar_direita()', 'ativar_alavanca("lever_blue")\nexaminar()\nvirar_esquerda()\nandar_frente()\nvirar_direita()\nvirar_direita()\nandar_frente()\nvirar_direita()');a14.instructionBudget+=5;
    const falsePlates={14:[[2,6],[3,8]],18:[[2,5],[5,8],[8,11],[11,14]]};
    for(const [id,points] of Object.entries(falsePlates)) for(const [i,[row,column]] of points.entries()) byId(Number(id)).entities.push({id:`inert_plate_${i+1}`,type:'toggle_plate',row,column,skin:'v3',v6:true,inactivePlate:true,initialState:'off',label:'Placa antiga'});
    for(const a of window.ACTIVITIES) if(a.explorationHints)a.guide=a.explorationHints;
    ['Guardei o mapa no primeiro baú para que a próxima expedição não partisse sem orientação. A chave mudava de mãos a cada vigília; nenhuma marca externa revelava seu esconderijo.',
     'A segunda caixa pertenceu à curandeira. Ela pedia que a busca terminasse assim que a chave fosse encontrada: os demais pertences deviam permanecer em paz.',
     'O último vigia registrou as caixas já abertas para não repetir a procura. Paciência, observação e uma parada no momento certo valiam mais que força nas fechaduras.'].forEach((text,i)=>{entity(byId(19),`chest${i+1}`).clue=text;});
    const judgment=entity(byId(15),'sombra');judgment.variantTexts=[25,15,5].map(power=>`O escrivão enviava ao primeiro portão quem não alcançasse o limiar lunar. No registro desta visita, anotou ${power} unidades de poder. Compare essa medida com as leis das duas salas antes de escolher.`);judgment.text=judgment.variantTexts[0];
})();
