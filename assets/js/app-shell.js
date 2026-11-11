/**
 * app-shell.js — Manejador de navegación y eventos del Shell Costia Pro
 * Controla el Left Sidebar vertical, submenús desplegables, cajón móvil off-canvas
 * y accesibilidad de teclado (Escape, focus trap).
 */

class AppShell {
    constructor() {
        this.sidebar = document.getElementById('terminal-sidebar');
        this.backdrop = document.getElementById('costia-drawer-backdrop') || document.getElementById('sidebar-backdrop');
        this.btnMobileToggle = document.getElementById('btn-mobile-sidebar-toggle') || 
                                document.getElementById('btn-toggle-sidebar') || 
                                document.querySelector('[data-mobile-menu-toggle="true"]');
        this.btnCloseSidebar = document.getElementById('btn-sidebar-close') || 
                               document.getElementById('btn-cerrar-sidebar') || 
                               document.querySelector('[data-sidebar-close="true"]');
    }

    static iniciar() {
        const instancia = new AppShell();
        instancia.vincularEventos();
        return instancia;
    }

    vincularEventos() {
        if (!this.sidebar) return;

        // 1. Abrir menú móvil
        if (this.btnMobileToggle) {
            this.btnMobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.abrirDrawer();
            });
        }

        // 2. Cerrar menú móvil
        if (this.btnCloseSidebar) {
            this.btnCloseSidebar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cerrarDrawer();
            });
        }

        // 3. Clic en backdrop para cerrar
        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => {
                this.cerrarDrawer();
            });
        }

        // 4. Tecla Escape para cerrar en móvil
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarDrawer();
            }
        });

        // 5. Cerrar drawer al hacer clic en un link en pantallas móviles (< 900px)
        this.sidebar.querySelectorAll('.sidebar-item-link, .sidebar-sublink').forEach(link => {
            if (!link.hasAttribute('data-sidebar-toggle')) {
                link.addEventListener('click', () => {
                    if (window.innerWidth < 900) {
                        this.cerrarDrawer();
                    }
                });
            }
        });

        // 6. Submenús desplegables
        this.sidebar.querySelectorAll('[data-sidebar-toggle="true"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.closest('.sidebar-item-group');
                if (group) {
                    const abierto = group.classList.toggle('abierto');
                    btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
                }
            });
        });

        // 7. Alternador de tema del sidebar (Pino Profundo vs Blanco Suave)
        const btnToggleSidebarTheme = document.getElementById('btn-toggle-sidebar-theme');
        if (btnToggleSidebarTheme && this.sidebar) {
            btnToggleSidebarTheme.addEventListener('click', () => {
                const esLight = this.sidebar.classList.toggle('theme-light');
                const textoEl = document.getElementById('label-sidebar-theme') || 
                                btnToggleSidebarTheme.querySelector('.sidebar-theme-btn-text');
                if (textoEl) {
                    textoEl.textContent = esLight ? 'Modo Pino' : 'Modo Claro';
                }
            });
        }

        // 8. Acceso rápido al Asesor IA desde el sidebar
        const linkAsesor = document.getElementById('link-sidebar-asesor');
        if (linkAsesor) {
            linkAsesor.addEventListener('click', (e) => {
                if (window.asesorAgente && typeof window.asesorAgente.abrirChat === 'function') {
                    e.preventDefault();
                    window.asesorAgente.abrirChat();
                    if (window.innerWidth < 900) {
                        this.cerrarDrawer();
                    }
                }
            });
        }

        // 9. Abrir configuración de Gastos Fijos & Nómina dentro de Configuración
        this.sidebar.querySelectorAll('#link-sidebar-config-gastos').forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth < 900) this.cerrarDrawer();
            });
        });

        // 10. Restaurar datos demo desde Configuración en el sidebar
        const btnRestaurarDemo = document.getElementById('link-sidebar-restaurar-demo');
        if (btnRestaurarDemo) {
            btnRestaurarDemo.addEventListener('click', async (e) => {
                e.preventDefault();
                if (typeof Store !== 'undefined' && typeof Store.confirmarRestauracionDemo === 'function') {
                    await Store.confirmarRestauracionDemo();
                    if (window.innerWidth < 900) {
                        this.cerrarDrawer();
                    }
                }
            });
        }
    }

    abrirDrawer() {
        if (!this.sidebar) return;
        this.sidebar.classList.add('drawer-abierto');
        document.body.classList.add('sidebar-open');
        if (this.backdrop) this.backdrop.classList.add('activo');
        if (this.btnMobileToggle) this.btnMobileToggle.setAttribute('aria-expanded', 'true');
    }

    cerrarDrawer() {
        if (!this.sidebar) return;
        this.sidebar.classList.remove('drawer-abierto');
        document.body.classList.remove('sidebar-open');
        if (this.backdrop) this.backdrop.classList.remove('activo');
        if (this.btnMobileToggle) this.btnMobileToggle.setAttribute('aria-expanded', 'false');
    }
}

// Inicialización automática respetando el ciclo de vida del DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppShell.iniciar());
} else {
    AppShell.iniciar();
}

window.AppShell = AppShell;
