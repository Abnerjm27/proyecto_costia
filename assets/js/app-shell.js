/**
 * app-shell.js — Shell unificado de navegación y acciones globales de Costia
 * Renderiza y sincroniza la barra lateral plana (1 clic por módulo),
 * el pie de utilidades (Asesor IA, Tema Claro/Oscuro, Cerrar Sesión real),
 * badge dinámico de insumos con alza y cajón móvil off-canvas.
 */

class AppShell {
    static NAV_ITEMS = [
        {
            key: 'dashboard',
            href: 'dashboard.html',
            label: 'Inicio',
            icon: '<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>'
        },
        {
            key: 'insumos',
            href: 'insumos.html',
            label: 'Insumos',
            icon: '<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
        },
        {
            key: 'productos',
            href: 'productos.html',
            label: 'Mis Recetas',
            icon: '<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>'
        },
        {
            key: 'crear-producto',
            href: 'crear-producto.html',
            label: 'Nueva Receta',
            icon: '<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
        },
        {
            key: 'ficha-tecnica',
            href: 'ficha-tecnica.html',
            label: 'Fichas PDF',
            icon: '<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
        },
        {
            key: 'equilibrio',
            href: 'equilibrio.html',
            label: 'Equilibrio',
            icon: '<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v18"/><path d="M5 7h14"/><path d="M3 14l2-7 2 7a2 2 0 0 1-4 0z"/><path d="M17 14l2-7 2 7a2 2 0 0 1-4 0z"/></svg>'
        },
        {
            key: 'configuracion',
            href: 'configuracion.html',
            id: 'link-sidebar-config-page',
            label: 'Mi Negocio',
            icon: '<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
        }
    ];

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
        instancia.renderizarShellUnificado();
        instancia.vincularEventos();
        instancia.actualizarBadgeAlzas();

        if (typeof Store !== 'undefined' && typeof Store.alActualizar === 'function') {
            Store.alActualizar(() => instancia.actualizarBadgeAlzas());
        }
        return instancia;
    }

    obtenerPaginaActual() {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('insumos.html')) return 'insumos';
        if (path.includes('productos.html')) return 'productos';
        if (path.includes('crear-producto.html')) return 'crear-producto';
        if (path.includes('ficha-tecnica.html') || path.includes('ficha-preview.html')) return 'ficha-tecnica';
        if (path.includes('equilibrio.html')) return 'equilibrio';
        if (path.includes('configuracion.html')) return 'configuracion';
        return 'dashboard';
    }

    renderizarShellUnificado() {
        if (!this.sidebar) return;
        const paginaActual = this.obtenerPaginaActual();

        document.querySelectorAll('.costia-mobile-brand').forEach(brand => {
            brand.setAttribute('href', 'dashboard.html');
        });

        const navLinksHTML = AppShell.NAV_ITEMS.map(item => {
            const esActivo = item.key === paginaActual;
            const idAttr = item.id ? ` id="${item.id}"` : '';
            const currentAttr = esActivo ? ' aria-current="page"' : '';
            const badgeAlzas = item.key === 'insumos'
                ? '<span class="sidebar-nav-badge" id="sidebar-badge-alzas" hidden></span>'
                : (item.key === 'productos'
                    ? '<span class="sidebar-nav-badge" id="sidebar-badge-recetas" hidden></span>'
                    : '');

            return `
                <li>
                    <a href="${item.href}"${idAttr} class="sidebar-item-link${esActivo ? ' activo' : ''}"${currentAttr}>
                        <span class="sidebar-icon-label">
                            ${item.icon}
                            <span>${item.label}</span>
                        </span>
                        ${badgeAlzas}
                    </a>
                </li>
            `;
        }).join('');

        this.sidebar.innerHTML = `
            <div class="sidebar-inner">
                <div class="sidebar-brand-box">
                    <a href="dashboard.html" class="sidebar-brand-link">
                        <img src="../assets/img/costia-icon-green.png" alt="Logo Costia" width="28" height="28" class="sidebar-brand-logo">
                        <span class="sidebar-brand-title">Costia</span>
                    </a>
                    <button type="button" class="sidebar-close-btn" id="btn-sidebar-close" aria-label="Cerrar menú lateral">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <ul class="sidebar-nav-list" role="navigation" aria-label="Módulos principales">
                    ${navLinksHTML}
                </ul>

                <div class="sidebar-footer-box">
                    <button type="button" class="sidebar-item-link terminal-theme-switch" id="btn-toggle-tema" aria-label="Cambiar tema de la aplicación">
                        <span class="sidebar-icon-label">
                            <svg class="sidebar-icon tema-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            <span>Modo Oscuro</span>
                        </span>
                    </button>
                    <a href="login.html" class="sidebar-item-link sidebar-logout-link" id="btn-sidebar-logout">
                        <span class="sidebar-icon-label">
                            <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            <span>Cerrar Sesión</span>
                        </span>
                    </a>
                </div>
            </div>
        `;

        this.btnCloseSidebar = document.getElementById('btn-sidebar-close');

        if (window.themeManager && typeof window.themeManager.vincularBotones === 'function') {
            window.themeManager.vincularBotones();
            window.themeManager.actualizarBotonUI();
        }
    }

    _aplicarBadge(id, cantidad, singular, plural) {
        const badge = document.getElementById(id);
        if (!badge) return;
        if (cantidad > 0) {
            const texto = `${cantidad} ${cantidad === 1 ? singular : plural}`;
            badge.textContent = String(cantidad);
            badge.title = texto;
            badge.setAttribute('aria-label', texto);
            badge.hidden = false;
        } else {
            badge.removeAttribute('aria-label');
            badge.hidden = true;
        }
    }

    actualizarBadgeAlzas() {
        if (typeof Store === 'undefined') return;
        const insumos = Store.cargarInsumos();
        const conAlza = insumos.filter(i => {
            const v = typeof i.obtenerVariacion === 'function' ? i.obtenerVariacion() : null;
            return v && v.estado === 'sube';
        }).length;
        this._aplicarBadge('sidebar-badge-alzas', conAlza, 'insumo subió de precio', 'insumos subieron de precio');

        const productos = Store.cargarProductos();
        const recetasConAlza = productos.filter(p => {
            const c = typeof p.detectarCambioPrecio === 'function' ? p.detectarCambioPrecio(insumos) : null;
            return c && c.estado === 'sube';
        }).length;
        this._aplicarBadge('sidebar-badge-recetas', recetasConAlza, 'receta subió de precio', 'recetas subieron de precio');
    }

    vincularEventos() {
        if (!this.sidebar) return;

        if (this.btnMobileToggle) {
            this.btnMobileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.abrirDrawer();
            });
        }

        if (this.btnCloseSidebar) {
            this.btnCloseSidebar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.cerrarDrawer();
            });
        }

        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => {
                this.cerrarDrawer();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarDrawer();
            }
        });

        this.sidebar.querySelectorAll('.sidebar-item-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 900) {
                    this.cerrarDrawer();
                }
            });
        });

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

        const btnLogout = document.getElementById('btn-sidebar-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', async (e) => {
                if (typeof Store !== 'undefined' && typeof Store.cerrarSesion === 'function') {
                    e.preventDefault();
                    await Store.cerrarSesion();
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppShell.iniciar());
} else {
    AppShell.iniciar();
}

window.AppShell = AppShell;
