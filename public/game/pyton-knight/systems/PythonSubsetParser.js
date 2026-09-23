(function () {
    'use strict';
    class ParseError extends Error { constructor (message, lineNumber) { super(message); this.name = 'ParseError'; this.lineNumber = lineNumber || null; } }
    function splitStatements (line) {
        const result = []; let current = ''; let quote = null; let depth = 0;
        for (let index = 0; index < line.length; index++) {
            const char = line[index];
            if (quote) { current += char; if (char === quote && line[index - 1] !== '\\') quote = null; continue; }
            if (char === '"' || char === "'") { quote = char; current += char; continue; }
            if (char === '#') break;
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (char === ';' && depth === 0) { if (current.trim()) result.push(current.trim()); current = ''; }
            else current += char;
        }
        if (current.trim()) result.push(current.trim()); return result;
    }
    function prepareLines (source) {
        const lines = [];
        source.replace(/\r\n?/g, '\n').split('\n').forEach((raw, index) => {
            // Empty/comment-only lines do not participate in Python indentation.
            if (!raw.trim() || raw.trimStart().startsWith('#')) return;
            if (/^\s*\t/.test(raw)) throw new ParseError('Use espaços, não tabulações, para indentar.', index + 1);
            const leading = raw.match(/^ */)[0].length;
            splitStatements(raw.slice(leading)).forEach((text) => lines.push({ text, indent: leading, lineNumber: index + 1 }));
        });
        return lines;
    }
    class Lexer {
        constructor (source, lineNumber) { this.source = source; this.lineNumber = lineNumber; this.index = 0; this.tokens = []; }
        run () {
            while (this.index < this.source.length) {
                const char = this.source[this.index];
                if (/\s/.test(char)) { this.index++; continue; }
                if (/\d/.test(char)) { this.readNumber(); continue; }
                if (/[A-Za-z_]/.test(char)) { this.readIdentifier(); continue; }
                if (char === '"' || char === "'") { this.readString(char); continue; }
                const two = this.source.slice(this.index, this.index + 2);
                if (['==', '!=', '>=', '<='].includes(two)) { this.tokens.push({ type: 'operator', value: two }); this.index += 2; continue; }
                if ('+-*/><(),'.includes(char)) { this.tokens.push({ type: 'operator', value: char }); this.index++; continue; }
                throw new ParseError(`Símbolo não reconhecido: ${char}`, this.lineNumber);
            }
            this.tokens.push({ type: 'eof', value: null }); return this.tokens;
        }
        readNumber () { const start = this.index; while (/[\d.]/.test(this.source[this.index] || '')) this.index++; const text = this.source.slice(start, this.index); if (!/^\d+(\.\d+)?$/.test(text)) throw new ParseError(`Número inválido: ${text}`, this.lineNumber); this.tokens.push({ type: 'number', value: Number(text) }); }
        readIdentifier () { const start = this.index; while (/[A-Za-z0-9_]/.test(this.source[this.index] || '')) this.index++; this.tokens.push({ type: 'identifier', value: this.source.slice(start, this.index) }); }
        readString (quote) { this.index++; let value = ''; while (this.index < this.source.length && this.source[this.index] !== quote) { const char = this.source[this.index++]; if (char === '\\' && this.index < this.source.length) { const next = this.source[this.index++]; value += next === 'n' ? '\n' : next; } else value += char; } if (this.source[this.index] !== quote) throw new ParseError('Texto sem aspas de fechamento.', this.lineNumber); this.index++; this.tokens.push({ type: 'string', value }); }
    }
    class ExpressionParser {
        constructor (source, lineNumber) { this.lineNumber = lineNumber; this.tokens = new Lexer(source, lineNumber).run(); this.index = 0; }
        peek (value) { const token = this.tokens[this.index]; return value === undefined ? token : token.value === value; }
        take (value) { const token = this.tokens[this.index]; if (value !== undefined && token.value !== value) throw new ParseError(`Esperado '${value}'.`, this.lineNumber); this.index++; return token; }
        parse () { const result = this.parseOr(); if (this.peek().type !== 'eof') throw new ParseError('Expressão inválida.', this.lineNumber); return result; }
        parseOr () { let left = this.parseAnd(); while (this.peek('or')) { this.take(); left = { type: 'binary', operator: 'or', left, right: this.parseAnd() }; } return left; }
        parseAnd () { let left = this.parseNot(); while (this.peek('and')) { this.take(); left = { type: 'binary', operator: 'and', left, right: this.parseNot() }; } return left; }
        parseNot () { if (this.peek('not')) { this.take(); return { type: 'unary', operator: 'not', argument: this.parseNot() }; } return this.parseComparison(); }
        parseComparison () { const operands = [this.parseAddition()]; const operators = []; while (['==', '!=', '>', '<', '>=', '<='].includes(this.peek().value)) { operators.push(this.take().value); operands.push(this.parseAddition()); } return operators.length ? { type: 'comparison', operands, operators } : operands[0]; }
        parseAddition () { let left = this.parseMultiplication(); while (['+', '-'].includes(this.peek().value)) { const operator = this.take().value; left = { type: 'binary', operator, left, right: this.parseMultiplication() }; } return left; }
        parseMultiplication () { let left = this.parseUnary(); while (['*', '/'].includes(this.peek().value)) { const operator = this.take().value; left = { type: 'binary', operator, left, right: this.parseUnary() }; } return left; }
        parseUnary () { if (['+', '-'].includes(this.peek().value)) return { type: 'unary', operator: this.take().value, argument: this.parseUnary() }; return this.parsePrimary(); }
        parsePrimary () {
            const token = this.peek();
            if (token.type === 'number' || token.type === 'string') { this.take(); return { type: 'literal', value: token.value }; }
            if (token.type === 'identifier') {
                this.take();
                if (token.value === 'True' || token.value === 'False') return { type: 'literal', value: token.value === 'True' };
                if (this.peek('(')) { this.take('('); const args = []; if (!this.peek(')')) { do { args.push(this.parseOr()); if (!this.peek(',')) break; this.take(','); } while (true); } this.take(')'); return { type: 'call', name: token.value, args }; }
                return { type: 'variable', name: token.value };
            }
            if (this.peek('(')) { this.take('('); const result = this.parseOr(); this.take(')'); return result; }
            throw new ParseError('Expressão esperada.', this.lineNumber);
        }
    }
    function parseExpression (text, lineNumber) { return new ExpressionParser(text, lineNumber).parse(); }
    function parseProgram (source) {
        const lines = prepareLines(source);
        function childBlock (index, parentIndent, header) {
            const next = lines[index];
            if (!next || next.indent <= parentIndent) throw new ParseError('Esperado um bloco indentado após os dois-pontos.', next ? next.lineNumber : header.lineNumber);
            return block(index, next.indent);
        }
        function block (index, indent) {
            const body = [];
            while (index < lines.length) {
                const line = lines[index];
                if (line.indent < indent) break;
                if (line.indent > indent) throw new ParseError('Indentação inesperada.', line.lineNumber);
                const text = line.text;
                if (/^(elif\b|else\s*:)/.test(text)) break;
                if (/^if\s+.+:$/.test(text)) {
                    const branches = []; let current = line;
                    while (true) {
                        const match = current.text.match(/^(?:if|elif)\s+(.+):$/); if (!match) break;
                        const child = childBlock(index + 1, indent, current); if (!child.body.length) throw new ParseError('Bloco condicional vazio.', current.lineNumber);
                        branches.push({ condition: parseExpression(match[1], current.lineNumber), body: child.body, lineNumber: current.lineNumber }); index = child.index;
                        if (index < lines.length && lines[index].indent === indent && /^elif\s+.+:$/.test(lines[index].text)) { current = lines[index]; continue; }
                        break;
                    }
                    let elseBody = null;
                    if (index < lines.length && lines[index].indent === indent && lines[index].text === 'else:') { const child = childBlock(index + 1, indent, lines[index]); if (!child.body.length) throw new ParseError('Bloco else vazio.', lines[index].lineNumber); elseBody = child.body; index = child.index; }
                    body.push({ type: 'if', branches, elseBody, lineNumber: line.lineNumber }); continue;
                }
                const forMatch = text.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+):$/);
                if (forMatch) { const child = childBlock(index + 1, indent, line); if (!child.body.length) throw new ParseError('Bloco for vazio.', line.lineNumber); body.push({ type: 'for', variable: forMatch[1], iterable: parseExpression(forMatch[2], line.lineNumber), body: child.body, lineNumber: line.lineNumber }); index = child.index; continue; }
                const whileMatch = text.match(/^while\s+(.+):$/);
                if (whileMatch) { const child = childBlock(index + 1, indent, line); if (!child.body.length) throw new ParseError('Bloco while vazio.', line.lineNumber); body.push({ type: 'while', condition: parseExpression(whileMatch[1], line.lineNumber), body: child.body, lineNumber: line.lineNumber }); index = child.index; continue; }
                if (text === 'break') { body.push({ type: 'break', lineNumber: line.lineNumber }); index++; continue; }
                const assignment = text.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=|=(?!=))\s*(.+)$/);
                if (assignment) body.push({ type: 'assignment', name: assignment[1], operator: assignment[2], expression: parseExpression(assignment[3], line.lineNumber), lineNumber: line.lineNumber });
                else body.push({ type: 'expression', expression: parseExpression(text, line.lineNumber), lineNumber: line.lineNumber });
                index++;
            }
            return { body, index };
        }
        const parsed = block(0, 0); if (parsed.index !== lines.length) throw new ParseError('Estrutura de bloco inválida.', lines[parsed.index].lineNumber); return { type: 'program', body: parsed.body };
    }
    function analyze (program) {
        const concepts = new Set(); const commands = new Set(); let instructionCount = 0;
        function expression (node) {
            if (!node) return;
            if (node.type === 'variable') concepts.add('variables');
            if (node.type === 'literal') { if (typeof node.value === 'string') concepts.add('strings'); if (typeof node.value === 'boolean') concepts.add('booleans'); }
            if (node.type === 'unary') { if (node.operator === 'not') concepts.add('not'); expression(node.argument); }
            if (node.type === 'comparison') { concepts.add('comparison'); node.operands.forEach(expression); }
            if (node.type === 'binary') { if (['+', '-', '*', '/'].includes(node.operator)) concepts.add('arithmetic'); if (['==', '!=', '>', '<', '>=', '<='].includes(node.operator)) concepts.add('comparison'); if (node.operator === 'and' || node.operator === 'or') concepts.add(node.operator); expression(node.left); expression(node.right); }
            if (node.type === 'call') { commands.add(node.name); if (['print', 'input', 'int', 'range'].includes(node.name)) concepts.add(node.name); node.args.forEach(expression); }
        }
        function statements (items) {
            items.forEach((item) => { instructionCount++; if (item.type === 'assignment') { concepts.add('variables'); expression(item.expression); } else if (item.type === 'expression') expression(item.expression); else if (item.type === 'if') { concepts.add('if'); item.branches.forEach((branch, index) => { if (index) concepts.add('elif'); expression(branch.condition); statements(branch.body); }); if (item.elseBody) { concepts.add('else'); statements(item.elseBody); } } else if (item.type === 'for') { concepts.add('for'); expression(item.iterable); statements(item.body); } else if (item.type === 'while') { concepts.add('while'); expression(item.condition); statements(item.body); } else if (item.type === 'break') concepts.add('break'); });
        }
        statements(program.body); return { concepts, commands, instructionCount };
    }
    window.PythonSubsetParser = { ParseError, parse (source) { const program = parseProgram(source); return { program, analysis: analyze(program) }; } };
})();
