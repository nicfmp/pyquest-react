(function () {
    'use strict';
    const MIN_ZOOM = 0.55, MAX_ZOOM = 2, INITIAL_ZOOM = 1;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    class CameraModel {
        constructor (worldWidth, worldHeight, width, height) {
            this.worldWidth = worldWidth; this.worldHeight = worldHeight;
            this.width = Math.max(1, width); this.height = Math.max(1, height);
            this.zoom = INITIAL_ZOOM; this.centerX = worldWidth / 2; this.centerY = worldHeight / 2; this.constrain();
        }
        constrain () {
            const halfX = this.width / (2 * this.zoom), halfY = this.height / (2 * this.zoom);
            this.centerX = this.worldWidth <= halfX * 2 ? this.worldWidth / 2 : clamp(this.centerX, halfX, this.worldWidth - halfX);
            this.centerY = this.worldHeight <= halfY * 2 ? this.worldHeight / 2 : clamp(this.centerY, halfY, this.worldHeight - halfY);
        }
        resize (width, height) { this.width = Math.max(1, width); this.height = Math.max(1, height); this.constrain(); }
        pan (dx, dy) { this.centerX -= dx / this.zoom; this.centerY -= dy / this.zoom; this.constrain(); }
        setZoom (zoom, x = this.width / 2, y = this.height / 2) {
            const next = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
            this.centerX += (x - this.width / 2) * (1 / this.zoom - 1 / next);
            this.centerY += (y - this.height / 2) * (1 / this.zoom - 1 / next);
            this.zoom = next; this.constrain();
        }
        center (x, y) { this.centerX = x; this.centerY = y; this.constrain(); }
        approach (x, y, dt) { const factor = 1 - Math.exp(-Math.max(0, dt) / 130); this.centerX += (x - this.centerX) * factor; this.centerY += (y - this.centerY) * factor; this.constrain(); }
        view () { return { left: this.centerX - this.width / (2 * this.zoom), top: this.centerY - this.height / (2 * this.zoom), width: this.width / this.zoom, height: this.height / this.zoom }; }
    }
    class Controller {
        constructor (scene, element) {
            this.scene = scene; this.element = element; this.camera = scene.cameras.main; this.tracking = false; this.centering = false; this.drag = null;
            const rect = element.getBoundingClientRect();
            this.model = new CameraModel(scene.mapa[0].length * scene.tileSize, scene.mapa.length * scene.tileSize, rect.width, rect.height);
            this.handlers = {
                pointerdown: (event) => { if (event.button !== 0) return; this.tracking = false; this.centering = false; this.drag = { x: event.clientX, y: event.clientY, id: event.pointerId }; element.setPointerCapture(event.pointerId); element.classList.add('dragging'); },
                pointermove: (event) => { if (!this.drag || this.drag.id !== event.pointerId) return; this.model.pan(event.clientX - this.drag.x, event.clientY - this.drag.y); this.drag.x = event.clientX; this.drag.y = event.clientY; this.apply(); },
                pointerup: (event) => { if (this.drag && this.drag.id === event.pointerId) { this.drag = null; element.classList.remove('dragging'); if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId); } },
                wheel: (event) => { event.preventDefault(); const box = element.getBoundingClientRect(); this.zoom(this.model.zoom * Math.exp(-event.deltaY * 0.0015), event.clientX - box.left, event.clientY - box.top); }
            };
            Object.entries(this.handlers).forEach(([name, handler]) => element.addEventListener(name, handler, name === 'wheel' ? { passive: false } : undefined));
            element.addEventListener('pointercancel', this.handlers.pointerup); element.addEventListener('lostpointercapture', this.handlers.pointerup);
            this.onResize = () => this.resize(); scene.scale.on('resize', this.onResize);
            if (typeof ResizeObserver !== 'undefined') { this.observer = new ResizeObserver(this.onResize); this.observer.observe(element); }
            this.resize(); this.centerOnGuto(false);
        }
        resize () { const rect = this.element.getBoundingClientRect(); this.camera.setViewport(rect.x, rect.y, Math.max(1, rect.width), Math.max(1, rect.height)); this.model.resize(rect.width, rect.height); this.apply(); }
        apply () {
            // Phaser scroll is expressed before zoom around the viewport center.
            this.camera.setZoom(this.model.zoom); this.camera.setScroll(this.model.centerX - this.model.width / 2, this.model.centerY - this.model.height / 2);
            if (window.GameUI && window.GameUI.atualizarCamera) window.GameUI.atualizarCamera(this.scene, this.model.zoom, this.tracking);
        }
        zoom (value, x, y) { this.model.setZoom(value, x, y); this.apply(); }
        centerOnGuto (smooth = true) {
            if (smooth) { this.centering = true; this.centerElapsed = 0; }
            else { this.model.center(this.scene.startX + this.scene.gutoPosition.coluna * this.scene.tileSize, this.scene.startY + this.scene.gutoPosition.linha * this.scene.tileSize); this.apply(); }
            this.tracking = Boolean(this.scene.executando); this.drag = null;
        }
        setExecuting (value) { this.tracking = Boolean(value); if (value) { this.centering = true; this.centerElapsed = 0; } this.apply(); }
        update (dt) {
            if (!this.tracking && !this.centering) return;
            const x = this.scene.atividade?.v3 && this.scene.guto ? this.scene.guto.x : this.scene.startX + this.scene.gutoPosition.coluna * this.scene.tileSize, y = this.scene.atividade?.v3 && this.scene.guto ? this.scene.guto.y : this.scene.startY + this.scene.gutoPosition.linha * this.scene.tileSize;
            this.model.approach(x, y, dt); this.apply();
            if (!this.tracking) { this.centerElapsed = (this.centerElapsed || 0) + dt; if (this.centerElapsed >= 850) this.centering = false; }
        }
        destroy () { Object.entries(this.handlers).forEach(([name, handler]) => this.element.removeEventListener(name, handler)); this.element.removeEventListener('pointercancel', this.handlers.pointerup); this.element.removeEventListener('lostpointercapture', this.handlers.pointerup); this.scene.scale.off('resize', this.onResize); if (this.observer) this.observer.disconnect(); }
    }
    window.CameraController = { MIN_ZOOM, MAX_ZOOM, INITIAL_ZOOM, CameraModel, attach: (scene, element) => new Controller(scene, element) };
})();
