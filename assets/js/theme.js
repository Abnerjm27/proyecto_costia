/**
 * theme.js — Gestor de Tema Costia Pro (POO)
 *
 * Cumple con las reglas duras de EXIS:
 * - POO estricto con encapsulación y ciclo de vida (init).
 * - Cero código procedural huérfano.
 * - Persistencia en localStorage y compatibilidad con accesibilidad WCAG AAA.
 */

class ThemeManager {
    static CLAVE_STORAGE = 'costia_theme';

    constructor() {
        this.temaActual = 'light';
    }

    iniciar() {
        this.cargarPreferencia();
        this.aplicarTema(this.temaActual);
        this.vincularBotones();
    }

    cargarPreferencia() {
        const guardado = localStorage.getItem(ThemeManager.CLAVE_STORAGE);
        this.temaActual = guardado === 'dark' ? 'dark' : 'light';
    }

    aplicarTema(tema) {
        this.temaActual = tema;
        document.documentElement.setAttribute('data-theme', tema);
        localStorage.setItem(ThemeManager.CLAVE_STORAGE, tema);
        this.actualizarBotonUI();
    }

    alternarTema() {
        const nuevoTema = this.temaActual === 'dark' ? 'light' : 'dark';
        this.aplicarTema(nuevoTema);
    }

    vincularBotones() {
        const botones = document.querySelectorAll('.terminal-theme-switch, .bn-theme-switch, #btn-toggle-tema');
        botones.forEach(btn => {
            btn.addEventListener('click', () => this.alternarTema());
        });
    }

    actualizarBotonUI() {
        const botones = document.querySelectorAll('.terminal-theme-switch, .bn-theme-switch, #btn-toggle-tema');
        botones.forEach(btn => {
            const esDark = this.temaActual === 'dark';
            btn.setAttribute('aria-label', `Cambiar tema a ${esDark ? 'claro' : 'oscuro'}`);
            const iconSvg = esDark
                ? '<svg class="tema-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>'
                : '<svg class="tema-icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
            btn.innerHTML = `<span class="tema-icon" aria-hidden="true">${iconSvg}</span> <span>${esDark ? 'Modo Claro' : 'Modo Oscuro'}</span>`;
        });
    }

    registrarServiceWorker() {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
        }
    }
}

// Instancia global
window.themeManager = new ThemeManager();

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.themeManager.iniciar();
            window.themeManager.registrarServiceWorker();
        });
    } else {
        window.themeManager.iniciar();
        window.themeManager.registrarServiceWorker();
    }
}
