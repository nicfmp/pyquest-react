(function () {
    'use strict';
    const RESTRICTED = ['print', 'input', 'int', 'if', 'elif', 'else', 'comparison', 'and', 'or', 'not', 'for', 'range', 'while', 'break'];
    const BUILTINS = new Set(['andar_frente', 'virar_direita', 'virar_esquerda', 'print', 'input', 'int', 'range']);
    class InterpreterError extends Error { constructor (cause, message, lineNumber) { super(message); this.name = 'InterpreterError'; this.cause = cause; this.lineNumber = lineNumber || null; } }
    function truthy (value) { return Array.isArray(value) ? value.length > 0 : Boolean(value); }
    function checkCancellation (scene) { if (scene.cancelRequested) throw new InterpreterError('EXECUTION_CANCELLED', 'Execução interrompida. O código foi preservado.'); }
    function compare (left, right, operator, line) {
        const numericTypes = (value) => typeof value === 'number' || typeof value === 'boolean';
        if (numericTypes(left) && numericTypes(right)) { left = Number(left); right = Number(right); }
        if (operator === '==') return left === right;
        if (operator === '!=') return left !== right;
        if (typeof left !== typeof right || !['number', 'string'].includes(typeof left)) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, 'Compare dois números ou dois textos. Converta input() com int() quando necessário.', line);
        return operator === '>' ? left > right : operator === '<' ? left < right : operator === '>=' ? left >= right : left <= right;
    }
    function numeric (left, right, line, label) { if (typeof left !== 'number' || typeof right !== 'number') throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, `${label} só pode combinar números.`, line); return [left, right]; }
    function mergeSources (...sources) { return [...new Set(sources.flat())]; }
    function variableNames (expression) { if(!expression || typeof expression!=='object') return []; if(expression.type==='variable')return [expression.name]; return Object.values(expression).flatMap(v=>Array.isArray(v)?v.flatMap(variableNames):typeof v==='object'?variableNames(v):[]); }
    async function evaluate (scene, expression, context, line) {
        context.sources ||= new WeakMap(); context.valueSources ||= {};
        const value=await evaluateValue(scene,expression,context,line);
        let sources=[];
        if(expression.type==='variable') sources=context.valueSources[expression.name] || [];
        else if(expression.type==='call' && expression.name==='input') sources=[`input:${scene.runState.inputs.length}`];
        else if(expression.type==='call') sources=mergeSources(...expression.args.map(a=>context.sources.get(a)||[]));
        else if(expression.type==='binary') sources=mergeSources(context.sources.get(expression.left)||[],context.sources.get(expression.right)||[]);
        else if(expression.type==='unary') sources=context.sources.get(expression.argument)||[];
        else if(expression.type==='comparison') sources=mergeSources(...expression.operands.map(a=>context.sources.get(a)||[]));
        context.sources.set(expression,sources); return value;
    }
    async function evaluateValue (scene, expression, context, line) {
        checkCancellation(scene);
        const T = window.GAME_CONSTANTS.TERMINOS;
        const used = context.runtimeAnalysis;
        if (expression.type === 'variable') used.concepts.add('variables');
        if (expression.type === 'literal' && typeof expression.value === 'string') used.concepts.add('strings');
        if (expression.type === 'literal' && typeof expression.value === 'boolean') used.concepts.add('booleans');
        if (expression.type === 'comparison') used.concepts.add('comparison');
        if (expression.type === 'unary' && expression.operator === 'not') used.concepts.add('not');
        if (expression.type === 'binary') used.concepts.add(['and','or'].includes(expression.operator) ? expression.operator : 'arithmetic');
        if (expression.type === 'call') { used.commands.add(expression.name); if (['print','input','int','range'].includes(expression.name)) used.concepts.add(expression.name); }
        if (expression.type === 'literal') return expression.value;
        if (expression.type === 'variable') { if (!Object.prototype.hasOwnProperty.call(context.environment, expression.name)) throw new InterpreterError(T.SEMANTIC_ERROR, `Essa variável ainda não foi criada: ${expression.name}.`, line); return context.environment[expression.name]; }
        if (expression.type === 'unary') {
            const value = await evaluate(scene, expression.argument, context, line);
            if (expression.operator === 'not') return !truthy(value);
            if (typeof value !== 'number') throw new InterpreterError(T.SEMANTIC_ERROR, 'O sinal numérico só pode ser aplicado a números.', line);
            return expression.operator === '-' ? -value : value;
        }
        if (expression.type === 'comparison') {
            let left = await evaluate(scene, expression.operands[0], context, line);
            for (let index = 0; index < expression.operators.length; index++) {
                const right = await evaluate(scene, expression.operands[index + 1], context, line);
                if (!compare(left, right, expression.operators[index], line)) return false;
                left = right;
            }
            return true;
        }
        if (expression.type === 'binary') {
            if (expression.operator === 'and') { const left = await evaluate(scene, expression.left, context, line); return truthy(left) ? evaluate(scene, expression.right, context, line) : left; }
            if (expression.operator === 'or') { const left = await evaluate(scene, expression.left, context, line); return truthy(left) ? left : evaluate(scene, expression.right, context, line); }
            const left = await evaluate(scene, expression.left, context, line); const right = await evaluate(scene, expression.right, context, line);
            if (expression.operator === '+') { if ((typeof left === 'number' && typeof right === 'number') || (typeof left === 'string' && typeof right === 'string')) return left + right; throw new InterpreterError(T.SEMANTIC_ERROR, 'A soma precisa combinar dois números ou dois textos.', line); }
            if (['-', '*', '/'].includes(expression.operator)) { const values = numeric(left, right, line, expression.operator === '-' ? 'A subtração' : expression.operator === '*' ? 'A multiplicação' : 'A divisão'); if (expression.operator === '/' && right === 0) throw new InterpreterError(T.SEMANTIC_ERROR, 'Não é possível dividir por zero.', line); return expression.operator === '-' ? values[0] - values[1] : expression.operator === '*' ? values[0] * values[1] : values[0] / values[1]; }
            if (expression.operator === '==') return left === right;
            if (expression.operator === '!=') return left !== right;
            if (expression.operator === '>') return left > right;
            if (expression.operator === '<') return left < right;
            if (expression.operator === '>=') return left >= right;
            if (expression.operator === '<=') return left <= right;
        }
        if (expression.type === 'call') { const args = []; for (const argument of expression.args) args.push(await evaluate(scene, argument, context, line)); const sources=mergeSources(...expression.args.map(a=>context.sources.get(a)||[]));
            const result = await window.DungeonSystem.callApi(scene, expression.name, args, { lineNumber: line, context, sources });
            scene.runState.actions?.push({ name:expression.name, args, line, loop:context.loopDepth||0, condition:context.conditionDepth||0, variableArgument:expression.args.some(arg=>arg.type!=='literal'), variables:expression.args.flatMap(variableNames), sources, loopTypes:[...(context.loopTypes||[])], order:++scene.runState.traceOrder, accepted:result!==false });
            return result; }
        throw new InterpreterError(T.SEMANTIC_ERROR, 'A expressão não pôde ser interpretada.', line);
    }
    function tick (context, statement) { context.executedInstructions++; if (context.executedInstructions > window.GAME_CONSTANTS.LIMITES_EXECUCAO.MAX_INSTRUCOES) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.LOOP_GUARD_STOP, 'A execução ultrapassou o limite seguro.', statement.lineNumber); }
    async function executeBlock (scene, statements, context, insideLoop) {
        for (const statement of statements) {
            checkCancellation(scene);
            tick(context, statement);
            if (statement.type === 'assignment') {
                context.runtimeAnalysis.concepts.add('variables');
                const previous = context.environment[statement.name];
                const value = await evaluate(scene, statement.expression, context, statement.lineNumber);
                if (statement.operator === '=') context.environment[statement.name] = value;
                else {
                    if (!Object.prototype.hasOwnProperty.call(context.environment, statement.name)) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, `Essa variável ainda não foi criada: ${statement.name}.`, statement.lineNumber);
                    const current = context.environment[statement.name]; const operator = statement.operator[0];
                    if (operator === '+') { if (!((typeof current === 'number' && typeof value === 'number') || (typeof current === 'string' && typeof value === 'string'))) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, 'A soma precisa combinar dois números ou dois textos.', statement.lineNumber); context.environment[statement.name] = current + value; }
                    else { const values = numeric(current, value, statement.lineNumber, operator === '-' ? 'A subtração' : operator === '*' ? 'A multiplicação' : 'A divisão'); if (operator === '/' && value === 0) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, 'Não é possível dividir por zero.', statement.lineNumber); context.environment[statement.name] = operator === '-' ? values[0] - values[1] : operator === '*' ? values[0] * values[1] : values[0] / values[1]; }
                }
                context.valueSources[statement.name]=statement.operator==='=' ? context.sources.get(statement.expression)||[] : mergeSources(context.valueSources[statement.name]||[],context.sources.get(statement.expression)||[]);
                scene.runState.assignments?.push({ name:statement.name, previous, value:context.environment[statement.name], loop:context.loopDepth||0, operator:statement.operator, order:++scene.runState.traceOrder });
                continue;
            }
            if (statement.type === 'expression') { await evaluate(scene, statement.expression, context, statement.lineNumber); continue; }
            if (statement.type === 'if') {
                context.runtimeAnalysis.concepts.add('if');
                if (statement.branches.length > 1) context.runtimeAnalysis.concepts.add('elif');
                if (statement.elseBody) context.runtimeAnalysis.concepts.add('else');
                let selected = false;
                for (const branch of statement.branches) { if (truthy(await evaluate(scene, branch.condition, context, branch.lineNumber || statement.lineNumber))) { const signal = await scopedBlock(scene, branch.body, context, insideLoop, 'conditionDepth'); if (signal) return signal; selected = true; break; } }
                if (!selected && statement.elseBody) { const signal = await scopedBlock(scene, statement.elseBody, context, insideLoop, 'conditionDepth'); if (signal) return signal; }
                continue;
            }
            if (statement.type === 'for') {
                const iterable = await evaluate(scene, statement.iterable, context, statement.lineNumber); if (!Array.isArray(iterable)) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR, 'O for desta versão deve usar range().', statement.lineNumber);
                let iterations = 0; for (const value of iterable) { context.runtimeAnalysis.concepts.add('for'); if (++iterations > window.GAME_CONSTANTS.LIMITES_EXECUCAO.MAX_ITERACOES_POR_LOOP) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.LOOP_GUARD_STOP, 'A repetição ultrapassou o limite seguro.', statement.lineNumber); context.environment[statement.variable] = value; const signal = await scopedBlock(scene, statement.body, context, true, 'loopDepth', statement.type); if (signal === 'break') break; }
                continue;
            }
            if (statement.type === 'while') {
                let iterations = 0; while (truthy(await evaluate(scene, statement.condition, context, statement.lineNumber))) { context.runtimeAnalysis.concepts.add('while'); if (++iterations > window.GAME_CONSTANTS.LIMITES_EXECUCAO.MAX_ITERACOES_POR_LOOP) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.LOOP_GUARD_STOP, 'A repetição ultrapassou o limite seguro.', statement.lineNumber); const signal = await scopedBlock(scene, statement.body, context, true, 'loopDepth', statement.type); if (signal === 'break') break; }
                continue;
            }
            if (statement.type === 'break') { context.runtimeAnalysis.concepts.add('break'); if (!insideLoop) throw new InterpreterError(window.GAME_CONSTANTS.TERMINOS.SYNTAX_ERROR, 'break só pode ser usado dentro de um laço.', statement.lineNumber); return 'break'; }
        }
        return null;
    }
    async function scopedBlock (scene, body, context, insideLoop, field, loopType) { context[field]=(context[field]||0)+1; if(loopType){context.loopTypes ||= [];context.loopTypes.push(loopType);} try { return await executeBlock(scene,body,context,insideLoop); } finally { context[field]--; if(loopType)context.loopTypes.pop(); } }
    function report (scene, result, type) { scene.lastTermination = result; window.JourneySystem?.result(scene,result); if (window.GameUI) { window.GameUI.definirFeedback(scene, result.message, type || 'info', result.cause); if (window.GameUI.marcarErro) window.GameUI.marcarErro(scene, result.lineNumber || null); } return result; }
    function finishBusy (scene) { scene.executando = false; if (window.GameUI) window.GameUI.definirExecutando(scene, false); }
    window.CommandInterpreter = {
        executar (scene, options) {
            if (scene.gameOverPending || scene.devFlying) return Promise.resolve({cause:'EXECUTION_BLOCKED',message:'Encerre o voo ou retorne após a morte antes de executar.'});
            if (scene.executando) return Promise.resolve({ cause: 'BUSY', message: 'A execução atual ainda não terminou.' });
            const task = this.executarPrograma(scene, options); scene.executionTask = task; return task;
        },
        async cancelar (scene) {
            scene.cancelRequested = true;
            if (window.GameUI && window.GameUI.cancelarEntrada) window.GameUI.cancelarEntrada(scene);
            if (scene.executionTask) await scene.executionTask;
        },
        async executarPrograma (scene, options) {
            if (scene.executando) return { cause: 'BUSY', message: 'A execução atual ainda não terminou.' };
            window.JourneySystem?.begin(scene);
            const code = options && typeof options.code === 'string' ? options.code : scene.editorTexto.value;
            if (!code || !code.trim()) return report(scene, { cause: window.GAME_CONSTANTS.TERMINOS.SYNTAX_ERROR, message: 'Digite pelo menos uma instrução antes de executar.' }, 'error');
            scene.cancelRequested = false; scene.executando = true;
            if (!scene.atividade.v4) scene.executionCount = (scene.executionCount || 0) + 1;
            window.CompletionSystem?.hide(scene);
            window.DungeonSystem.resetRun(scene); if (window.GameUI) { window.GameUI.limparConsole(scene); window.GameUI.definirExecutando(scene, true); if (window.GameUI.marcarErro) window.GameUI.marcarErro(scene, null); }
            let parsed;
            try { parsed = window.PythonSubsetParser.parse(code); }
            catch (error) { finishBusy(scene); return report(scene, { cause: window.GAME_CONSTANTS.TERMINOS.SYNTAX_ERROR, message: `${error.lineNumber ? `Linha ${error.lineNumber}: ` : ''}${error.message}`, lineNumber: error.lineNumber || null }, 'error'); }
            const { program, analysis } = parsed; scene.runState.analysis = analysis; scene.budgetResult = window.CodeBudgetValidator.validar(scene.atividade, analysis);
            const allowedConcepts = new Set(['variables', 'strings', 'booleans', 'arithmetic', ...(scene.atividade.allowedConcepts || [])]);
            const concept = RESTRICTED.find((item) => analysis.concepts.has(item) && !allowedConcepts.has(item));
            if (concept) { finishBusy(scene); return report(scene, { cause: window.GAME_CONSTANTS.TERMINOS.LOCKED_CONCEPT, message: `${concept} ainda não foi desbloqueado.` }, 'warning'); }
            const allowedCommands = new Set(scene.atividade.allowedCommands || []);
            for (const command of analysis.commands) {
                if (!window.DungeonSystem.isKnownApi(command)) { finishBusy(scene); return report(scene, { cause: window.GAME_CONSTANTS.TERMINOS.UNKNOWN_COMMAND, message: `O comando ${command}() não existe na API do Pyton Knight.` }, 'warning'); }
                if (!BUILTINS.has(command) && !allowedCommands.has(command)) { finishBusy(scene); return report(scene, { cause: window.GAME_CONSTANTS.TERMINOS.LOCKED_CONCEPT, message: `${command}() ainda não está disponível nesta atividade.` }, 'warning'); }
            }
            if (!scene.budgetResult.valid && !scene.atividade.v4) { finishBusy(scene); window.MissionObjectiveSystem.avaliar(scene, analysis, {}); return report(scene, { cause: window.GAME_CONSTANTS.TERMINOS.CODE_BUDGET_EXCEEDED, message: `Seu código usa ${scene.budgetResult.used} instruções e o limite é ${scene.budgetResult.limit}.` }, 'warning'); }
            if (scene.atividade.v4 && !program.body.length) { finishBusy(scene); return report(scene, { cause:window.GAME_CONSTANTS.TERMINOS.SYNTAX_ERROR, message:'Digite pelo menos uma instrução antes de executar.' }, 'error'); }
            if (scene.atividade.v4) scene.executionCount = (scene.executionCount || 0) + 1;
            const runtimeAnalysis = { ...analysis, concepts: new Set(), commands: new Set() };
            scene.runState.runtimeAnalysis = runtimeAnalysis;
            const context = { environment: {}, executedInstructions: 0, analysis, runtimeAnalysis };
            if (scene.journeyExecution) scene.journeyExecution.context = context;
            try {
                scene.runState.environment = context.environment;
                await executeBlock(scene, program.body, context, false); checkCancellation(scene); scene.runState.environment = { ...context.environment };
                const tutorial = window.TutorialSystem.processarExecucao(scene, runtimeAnalysis); if (tutorial.handled) { finishBusy(scene); return report(scene, tutorial.result, tutorial.result.cause === window.GAME_CONSTANTS.TERMINOS.TUTORIAL_STEP_COMPLETE ? 'success' : 'info'); }
                const mission = window.MissionObjectiveSystem.avaliar(scene, analysis, context.environment);
                if (mission.allRequiredCompleted) { const reward = window.ProgressionSystem.concluirAtividade(scene); const rewardText = reward.firstCompletion ? ` +${reward.xp} XP${reward.coins ? ` e +${reward.coins} moedas` : ''}.` : ' Recompensas já consolidadas.'; finishBusy(scene); if (window.GameUI) window.GameUI.mostrarResumoConclusao(scene, reward); return report(scene, { cause: window.GAME_CONSTANTS.TERMINOS.SUCCESS, message: `Atividade concluída com ${scene.livesRemaining} vida(s).${rewardText}`, reward, objectives: mission.statuses }, 'success'); }
                if (scene.atividade.v4 && !scene.budgetResult.valid && scene.runState.reachedExit) {
                    finishBusy(scene);
                    return report(scene, { cause:window.GAME_CONSTANTS.TERMINOS.CODE_BUDGET_EXCEEDED, message:`Você alcançou o objetivo, mas seu código ainda ultrapassa o limite da atividade. Reduza a quantidade de instruções para concluir.\nInstruções utilizadas: ${scene.budgetResult.used} / ${scene.budgetResult.limit}${mission.pending.some(o=>o.type!=='budget') ? '\nConfira também os objetivos pendentes no Livro Mágico.' : ''}`, objectives:mission.statuses }, 'warning');
                }
                finishBusy(scene); return report(scene, { cause: window.GAME_CONSTANTS.TERMINOS.INCOMPLETE_EXECUTION, message: `Ainda falta: ${mission.pending[0].label}.${mission.pending.length > 1 ? '\nConsulte os demais objetivos da missão.' : ''}`, objectives: mission.statuses }, 'info');
            }
            catch (error) {
                const cause = error.cause || window.GAME_CONSTANTS.TERMINOS.SEMANTIC_ERROR; let message = `${error.lineNumber ? `Linha ${error.lineNumber}: ` : ''}${error.message}`;
                if (cause === window.GAME_CONSTANTS.TERMINOS.HAZARD_DEATH) { if(scene.atividade.v3) await window.AnimationSystem.hurt(scene); if (scene.atividade.v6) { window.JourneySystem.die(scene); message += scene.gameOverPending ? ' As três vidas acabaram. Retorne à atividade anterior.' : ` Restam ${scene.livesRemaining} vida(s).`; } else { scene.livesRemaining--; if (scene.livesRemaining <= 0) { scene.livesRemaining = 3; message += ' As vidas acabaram; a sessão voltou a 3 vidas.'; } else message += ` Restam ${scene.livesRemaining} vida(s).`; window.DungeonSystem.resetRun(scene); } }
                finishBusy(scene); if (window.GameUI) window.GameUI.atualizarVidas(scene); if (cause === window.GAME_CONSTANTS.TERMINOS.HAZARD_DEATH && window.MapRenderer.feedbackDano) window.MapRenderer.feedbackDano(scene); return report(scene, { cause, message, lineNumber: error.lineNumber || null }, cause === 'EXECUTION_CANCELLED' ? 'info' : cause === window.GAME_CONSTANTS.TERMINOS.HAZARD_DEATH ? 'danger' : 'error');
            }
        }
    };
})();
