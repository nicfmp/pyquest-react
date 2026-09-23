(function () {
    'use strict';
    const SIZE = 4;
    function lineStart (text, position) { return position <= 0 ? 0 : text.lastIndexOf('\n', position - 1) + 1; }
    function codePart (line) {
        let quote = null; let escaped = false;
        for (let index = 0; index < line.length; index++) {
            const char = line[index];
            if (escaped) { escaped = false; continue; }
            if (char === '\\' && quote) { escaped = true; continue; }
            if (quote) { if (char === quote) quote = null; }
            else if (char === '"' || char === "'") quote = char;
            else if (char === '#') return line.slice(0, index).trimEnd();
        }
        return line.trimEnd();
    }
    function transform (text, start, end, key, shift) {
        const begin = lineStart(text, start);
        if (key === 'Enter') {
            const prefix = text.slice(begin, start);
            const indent = prefix.match(/^ */)[0];
            const addition = codePart(prefix).endsWith(':') ? ' '.repeat(SIZE) : '';
            const insert = '\n' + indent + addition;
            return { text: text.slice(0, start) + insert + text.slice(end), start: start + insert.length, end: start + insert.length };
        }
        if (key !== 'Tab') return null;
        if (!shift && start === end) {
            return { text: text.slice(0, start) + ' '.repeat(SIZE) + text.slice(end), start: start + SIZE, end: end + SIZE };
        }
        const stop = text.indexOf('\n', end > start && text[end - 1] === '\n' ? end - 1 : end);
        const finish = stop === -1 ? text.length : stop;
        const lines = text.slice(begin, finish).split('\n');
        let firstDelta = 0; let totalDelta = 0;
        const replacement = lines.map((line, index) => {
            const count = shift ? Math.min(SIZE, line.match(/^ */)[0].length) : SIZE;
            const delta = shift ? -count : count;
            if (!index) firstDelta = delta;
            totalDelta += delta;
            return shift ? line.slice(count) : ' '.repeat(SIZE) + line;
        }).join('\n');
        return { text: text.slice(0, begin) + replacement + text.slice(finish), start: Math.max(begin, start + firstDelta), end: Math.max(begin, end + totalDelta) };
    }
    function alignBranch (text, cursor) {
        const begin = lineStart(text, cursor); const line = text.slice(begin, cursor);
        if (!/^\s*(?:else\s*:|elif\s+.+:)\s*$/.test(line)) return null;
        const indent = line.match(/^ */)[0].length;
        const previous = text.slice(0, begin).split('\n'); const closed = new Set();
        for (let index = previous.length - 1; index >= 0; index--) {
            const part = codePart(previous[index]); if (!part.trim()) continue;
            const level = part.match(/^ */)[0].length;
            if (level > indent) continue;
            if (/^\s*else\s*:/.test(part)) closed.add(level);
            if (/^\s*(?:if|elif)\s+.+:/.test(part) && !closed.has(level)) {
                if (level === indent) return null;
                const replacement = ' '.repeat(level) + line.trimStart();
                return { text: text.slice(0, begin) + replacement + text.slice(cursor), start: begin + replacement.length, end: begin + replacement.length };
            }
        }
        return null;
    }
    class CodeEditor {
        constructor (textarea, gutter, highlight, onChange) {
            this.textarea = textarea; this.gutter = gutter; this.highlight = highlight; this.onChange = onChange; this.errorLine = null;
            this.onKeyDown = (event) => {
                if (textarea.readOnly || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || !['Enter', 'Tab'].includes(event.key)) return;
                event.preventDefault(); this.apply(transform(textarea.value, textarea.selectionStart, textarea.selectionEnd, event.key, event.shiftKey));
            };
            this.onInput = (event) => { this.errorLine = null; if (event.inputType === 'insertText' && event.data === ':') { const result = alignBranch(textarea.value, textarea.selectionStart); if (result) this.apply(result); } this.refresh(); };
            this.onScroll = () => this.paint();
            textarea.addEventListener('keydown', this.onKeyDown); textarea.addEventListener('input', this.onInput); textarea.addEventListener('scroll', this.onScroll); this.refresh();
        }
        apply (result) {
            if (!result) return;
            const field = this.textarea; const top = field.scrollTop; const left = field.scrollLeft;
            field.value = result.text; field.setSelectionRange(result.start, result.end); field.scrollTop = top; field.scrollLeft = left; this.errorLine = null; this.refresh();
        }
        refresh () {
            const lines = this.textarea.value.split('\n').length;
            this.gutter.textContent = Array.from({ length: lines }, (_, index) => String(index + 1)).join('\n'); this.paint();
            if (this.onChange) this.onChange(this.textarea.value);
        }
        paint () {
            this.gutter.style.transform = `translateY(${-this.textarea.scrollTop}px)`;
            this.textarea.setAttribute('aria-invalid', this.errorLine ? 'true' : 'false');
            this.highlight.hidden = !this.errorLine;
            if (this.errorLine) this.highlight.style.top = `${10 + (this.errorLine - 1) * 22 - this.textarea.scrollTop}px`;
        }
        markError (line) {
            this.errorLine = Number.isInteger(line) && line > 0 ? line : null;
            if (this.errorLine) { const y = (line - 1) * 22; if (y < this.textarea.scrollTop || y > this.textarea.scrollTop + this.textarea.clientHeight - 32) this.textarea.scrollTop = Math.max(0, y - 44); }
            this.paint();
        }
        destroy () { this.textarea.removeEventListener('keydown', this.onKeyDown); this.textarea.removeEventListener('input', this.onInput); this.textarea.removeEventListener('scroll', this.onScroll); }
    }
    window.CodeEditor = { SIZE, transform, alignBranch, attach: (...args) => new CodeEditor(...args) };
})();
