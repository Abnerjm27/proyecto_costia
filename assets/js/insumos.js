/**
 * insumos.js — Terminal de Inventario y Libro de Órdenes (POO Costia Pro)
 *
 * Encapsula la gestión de la tabla (#insumos-tabla), filtros (#filtro-insumos),
 * métricas KPIs, cálculo unitario reactivo y modal glassmorphism (#modal-insumo).
 * Totalmente desacoplado de CSS/JS inline: eventos delegados en InsumosController.
 * Cumple con WCAG AAA y límite < 1.100 líneas por archivo.
 */

class InsumosController {
    constructor() {
        this.filtroActual   = 'todos';
        this.busquedaActual = '';
    }

    iniciar() {
        this.configurarFiltrosYBusqueda();
        this.configurarModal();
        this.configurarTabla();
        this.configurarDelegacionAlertas();
        this.configurarHashAlzas();
        this.actualizarVista();
        this.registrarServiceWorker();

        // Escuchar sincronizaciones reactivas desde MySQL / Store
        if (typeof Store !== 'undefined' && typeof Store.alActualizar === 'function') {
            Store.alActualizar(() => this.actualizarVista());
        }
    }

    // ─── Búsqueda y Filtros Rápidos (Terminal Pro) ───────────

    configurarFiltrosYBusqueda() {
        const inputBuscar = document.getElementById('buscar-insumo');
        inputBuscar?.addEventListener('input', (e) => {
            this.busquedaActual = e.target.value.trim().toLowerCase();
            this.renderizarTabla();
        });

        const contenedorFiltros = document.getElementById('filtro-insumos') || document.querySelector('.filtros-pills');
        contenedorFiltros?.addEventListener('click', (e) => {
            const btn = e.target.closest('.filtro-pill');
            if (!btn) return;

            document.querySelectorAll('.filtro-pill').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
            this.filtroActual = btn.dataset.filtro || 'todos';

            const bannerInfo = document.getElementById('alzas-banner-info');
            if (bannerInfo) {
                if (this.filtroActual === 'alzas') {
                    bannerInfo.style.display = 'block';
                    bannerInfo.innerHTML = `
                        <div class="alzas-info-card">
                            <div class="alzas-info-card__header">
                                <span class="alzas-info-card__dot" aria-hidden="true"></span>
                                <strong>Historial y Auditoría de Alzas de Insumos</strong>
                            </div>
                            <p>Mostrando materias primas con variaciones y aumentos de costo. Compara el precio base con el actual para proteger tus márgenes.</p>
                        </div>`;
                } else {
                    bannerInfo.style.display = 'none';
                    if (window.location.hash === '#alzas') {
                        history.replaceState(null, '', window.location.pathname);
                    }
                }
            }
            this.renderizarTabla();
        });
    }

    configurarHashAlzas() {
        window.addEventListener('hashchange', () => this.gestionarHash());
        document.querySelectorAll('a[href*="#alzas"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = '#alzas';
                this.activarFiltroAlzas();
            });
        });
        // Si la página se carga con el hash #alzas, activar el filtro inmediatamente
        if (window.location.hash === '#alzas' || window.location.hash === '#historial-alzas') {
            setTimeout(() => this.gestionarHash(), 50);
        }
    }

    gestionarHash() {
        const hash = (window.location.hash || '').toLowerCase();
        if (hash === '#alzas' || hash === '#historial-alzas') {
            this.activarFiltroAlzas();
        }
    }

    activarFiltroAlzas() {
        this.filtroActual = 'alzas';
        document.querySelectorAll('.filtro-pill').forEach(b => {
            if (b.dataset.filtro === 'alzas') b.classList.add('activo');
            else b.classList.remove('activo');
        });
        const bannerInfo = document.getElementById('alzas-banner-info');
        if (bannerInfo) {
            bannerInfo.style.display = 'block';
            bannerInfo.innerHTML = `
                <div class="alzas-info-card">
                    <div class="alzas-info-card__header">
                        <span class="alzas-info-card__dot" aria-hidden="true"></span>
                        <strong>Historial y Auditoría de Alzas de Insumos</strong>
                    </div>
                    <p>Mostrando materias primas con variaciones y aumentos de costo. Compara el precio base con el actual para proteger tus márgenes.</p>
                </div>`;
        }
        this.renderizarTabla();
        const target = document.getElementById('alzas') || document.getElementById('insumos-tabla-wrap');
        target?.scrollIntoView({ behavior: 'smooth' });
    }

    cumpleFiltro(insumo) {
        if (this.filtroActual === 'todos') return true;
        if (this.filtroActual === 'alzas') {
            const v = typeof insumo?.obtenerVariacion === 'function' ? insumo.obtenerVariacion() : null;
            return v !== null && (v.estado === 'sube' || Math.abs(v.delta) >= 0.01);
        }
        if (typeof UnidadConverter === 'undefined') return true;

        const unidad = typeof insumo === 'object' && insumo !== null ? insumo.unidad : insumo;
        if (this.filtroActual === 'masa') {
            return Array.isArray(UnidadConverter.UNIDADES_MASA) && UnidadConverter.UNIDADES_MASA.includes(unidad);
        }
        if (this.filtroActual === 'volumen') {
            return Array.isArray(UnidadConverter.UNIDADES_VOLUMEN) && UnidadConverter.UNIDADES_VOLUMEN.includes(unidad);
        }
        if (this.filtroActual === 'otros') {
            const esMasa = Array.isArray(UnidadConverter.UNIDADES_MASA) && UnidadConverter.UNIDADES_MASA.includes(unidad);
            const esVol  = Array.isArray(UnidadConverter.UNIDADES_VOLUMEN) && UnidadConverter.UNIDADES_VOLUMEN.includes(unidad);
            return !esMasa && !esVol;
        }
        return true;
    }

    // ─── Delegación de Eventos en Tabla de Insumos ────────────────

    configurarTabla() {
        const tbody = document.getElementById('insumos-cuerpo');
        tbody?.addEventListener('click', (e) => {
            const btnEditar = e.target.closest('.tabla__btn--editar, [data-action="editar"]');
            if (btnEditar) {
                const id = parseInt(btnEditar.dataset.id, 10);
                if (!isNaN(id)) this.abrirEditar(id);
                return;
            }

            const btnEliminar = e.target.closest('.tabla__btn--eliminar, [data-action="eliminar"]');
            if (btnEliminar) {
                const id = parseInt(btnEliminar.dataset.id, 10);
                if (!isNaN(id)) this.eliminarInsumo(id);
                return;
            }
        });
    }

    configurarDelegacionAlertas() {
        document.addEventListener('click', (e) => {
            const btnConfirmar = e.target.closest('[data-action="confirmar-alertas"]');
            if (btnConfirmar) {
                this.confirmarTodasAlertas();
            }
        });
    }

    // ─── Actualización de UI y KPIs ───────────────────────────────

    actualizarVista() {
        const insumos = Store.cargarInsumos();
        this.actualizarKPIs(insumos);
        this.renderizarBannerAlertas(insumos);
        this.renderizarTabla(insumos);
    }

    renderizarBannerAlertas(insumosLista = null) {
        const insumos   = insumosLista || Store.cargarInsumos();
        const productos = Store.cargarProductos();

        let banner = document.getElementById('insumos-alertas-banner');
        if (!banner) {
            const barra = document.querySelector('.barra-herramientas');
            if (!barra || !barra.parentNode) return;
            banner = document.createElement('div');
            banner.id = 'insumos-alertas-banner';
            barra.parentNode.insertBefore(banner, barra);
        }

        const alertas = productos
            .map(p => ({ producto: p, cambio: p.detectarCambioPrecio(insumos) }))
            .filter(item => item.cambio.estado === 'sube' || item.cambio.estado === 'baja');

        if (alertas.length === 0) {
            banner.innerHTML = '';
            return;
        }

        const itemsHTML = alertas.map(({ producto, cambio }) => {
            const sube       = cambio.estado === 'sube';
            const absDelta   = Math.abs(cambio.delta);
            const dif        = absDelta > 0 && absDelta < 1 ? '$' + absDelta.toFixed(2) : Store.fmt(absDelta);
            const pct        = Math.abs(cambio.deltaPct).toFixed(1);
            const claseBadge = sube ? 'banner-alertas__badge--sube' : 'banner-alertas__badge--baja';
            const signo      = sube ? '+' : '−';
            const flecha     = sube ? '↑' : '↓';

            return `
                <li class="banner-alertas__item">
                    <strong class="banner-alertas__item-nombre">${Store.escapeHtml(producto.nombre)}</strong>
                    <span class="banner-alertas__item-metas">
                        <span class="banner-alertas__badge ${claseBadge}">
                            ${sube ? 'Sube' : 'Baja'} ${flecha} ${dif} (${signo}${pct}%)
                        </span>
                        <small class="banner-alertas__detalle">Antes: ${Store.fmt(cambio.precioAnterior)} → Ahora: <strong>${Store.fmt(cambio.precioActual)}</strong></small>
                    </span>
                </li>`;
        }).join('');

        banner.innerHTML = `
            <div class="banner-alertas" role="alert" aria-live="polite">
                <div class="banner-alertas__header">
                    <div class="banner-alertas__titulo">
                        <span class="banner-alertas__icono" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></span>
                        <span>Alerta de impacto en costos (${alertas.length} ${alertas.length === 1 ? 'producto afectado' : 'productos afectados'})</span>
                    </div>
                    <div class="banner-alertas__acciones">
                        <a href="productos.html" class="banner-alertas__btn-link">
                            Ver en Mis productos →
                        </a>
                        <button type="button" class="banner-alertas__btn-confirmar" data-action="confirmar-alertas">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>Confirmar precios</span>
                        </button>
                    </div>
                </div>
                <ul class="banner-alertas__lista">
                    ${itemsHTML}
                </ul>
            </div>`;
    }

    confirmarTodasAlertas() {
        Store.sellarPrecios();
        this.actualizarVista();
        Store.toast('Precios de referencia actualizados en todos los productos');
    }

    actualizarKPIs(insumos) {
        const elTotal = document.getElementById('kpi-insumos-total');
        const elCaro  = document.getElementById('kpi-insumo-caro');
        const elCat   = document.getElementById('kpi-insumos-categorias');

        if (elTotal) {
            elTotal.textContent = `${insumos.length} ${insumos.length === 1 ? 'registrado' : 'registrados'}`;
        }

        if (elCaro) {
            if (insumos.length === 0) {
                elCaro.textContent = 'Sin registros';
            } else {
                const obtenerNormalizado = (ins) => {
                    const u = (ins.unidad || '').toLowerCase();
                    if (u === 'kg') return { valor: ins.precio, etiqueta: '/kg' };
                    if (u === 'g') return { valor: ins.precio * 1000, etiqueta: '/kg' };
                    if (u === 'arroba') return { valor: ins.precio / 12.5, etiqueta: '/kg' };
                    if (u === 'tonelada') return { valor: ins.precio / 1000, etiqueta: '/kg' };
                    if (u === 'l') return { valor: ins.precio, etiqueta: '/l' };
                    if (u === 'ml') return { valor: ins.precio * 1000, etiqueta: '/l' };
                    if (u === 'taza') return { valor: ins.precio * (1000 / 240), etiqueta: '/l' };
                    if (u === 'cucharada') return { valor: ins.precio * (1000 / 15), etiqueta: '/l' };
                    if (u === 'cucharadita') return { valor: ins.precio * (1000 / 5), etiqueta: '/l' };
                    return { valor: ins.precio, etiqueta: `/${ins.unidad}` };
                };

                const masCaro = insumos.reduce((max, i) => {
                    return obtenerNormalizado(i).valor > obtenerNormalizado(max).valor ? i : max;
                }, insumos[0]);
                const norm = obtenerNormalizado(masCaro);
                elCaro.textContent = `${masCaro.nombre} (${Store.fmt(Math.round(norm.valor))}${norm.etiqueta})`;
            }
        }

        if (elCat) {
            const cats = new Set();
            insumos.forEach(i => {
                if (typeof UnidadConverter !== 'undefined') {
                    if (UnidadConverter.UNIDADES_MASA.includes(i.unidad))         cats.add('Masa');
                    else if (UnidadConverter.UNIDADES_VOLUMEN.includes(i.unidad)) cats.add('Volumen');
                    else                                                          cats.add('Unidades');
                }
            });
            elCat.textContent = cats.size > 0 ? Array.from(cats).join(' · ') : 'Ninguna';
        }
    }

    // ─── Renderizado de la Tabla de Insumos (Libro de Órdenes) ───

    renderizarTabla(insumosLista = null) {
        const insumos   = insumosLista || Store.cargarInsumos();
        const productos = Store.cargarProductos();
        const tbody     = document.getElementById('insumos-cuerpo');
        if (!tbody) return;

        const filtrados = insumos.filter(ins =>
            ins.nombre.toLowerCase().includes(this.busquedaActual) && this.cumpleFiltro(ins)
        );

        if (filtrados.length === 0) {
            const mensajeVacio = this.filtroActual === 'alzas'
                ? 'No se registran alzas activas. Todos los precios de insumos se encuentran estables.'
                : 'No se encontraron insumos coincidentes en el libro de órdenes.';
            tbody.innerHTML = `
                <tr class="tabla__fila-vacia">
                    <td colspan="4" class="tabla__vacio">${mensajeVacio}</td>
                </tr>`;
            return;
        }

        tbody.innerHTML = filtrados.map(ins => {
            // Trazabilidad de insumos usados en productos
            const usoRecetas = (ins.totalRecetas && ins.totalRecetas > 0)
                ? ins.totalRecetas
                : productos.filter(p => (p.receta || []).some(r => r.insumoId === ins.id)).length;

            const usoBadge = usoRecetas > 0
                ? `<span class="tabla__uso-badge tabla__uso-badge--activo"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Usado en ${usoRecetas} ${usoRecetas === 1 ? 'producto' : 'productos'}</span>`
                : `<span class="tabla__uso-badge tabla__uso-badge--inactivo">Sin recetas</span>`;

            // Variación histórica del precio (Chip Terminal Pro)
            const variacion = typeof ins.obtenerVariacion === 'function' ? ins.obtenerVariacion() : null;
            let chipHTML = '';

            if (variacion) {
                const sube     = variacion.estado === 'sube';
                const deltaAbs = Math.abs(variacion.delta);
                const dif      = Store.fmt(deltaAbs);
                const pct      = variacion.pct.toFixed(1);

                if (sube) {
                    chipHTML = `
                        <div class="insumo-var-chip insumo-var-chip--rojo insumo-var--sube" title="Alza de precio: antes ${Store.fmt(variacion.precioAnterior)} (Incremento: +${dif})">
                            <span class="insumo-var-chip__simbolo" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg></span>
                            <span class="insumo-var-chip__texto">+${pct}% Alza</span>
                            <small class="insumo-var-chip__detalle">antes ${Store.fmt(variacion.precioAnterior)}</small>
                        </div>`;
                } else {
                    chipHTML = `
                        <div class="insumo-var-chip insumo-var-chip--verde insumo-var--baja" title="Ahorro en costo: antes ${Store.fmt(variacion.precioAnterior)} (Reducción: −${dif})">
                            <span class="insumo-var-chip__simbolo" aria-hidden="true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
                            <span class="insumo-var-chip__texto">−${pct}% Baja</span>
                            <small class="insumo-var-chip__detalle">antes ${Store.fmt(variacion.precioAnterior)}</small>
                        </div>`;
                }
            } else {
                chipHTML = `
                    <div class="insumo-var-chip insumo-var-chip--neutro" title="Sin variación histórica">
                        <span class="insumo-var-chip__simbolo" aria-hidden="true"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"></line></svg></span>
                        <span class="insumo-var-chip__texto">Estable</span>
                    </div>`;
            }

            return `
            <tr class="tabla__fila fila-insumo" data-id="${ins.id}">
                <td class="tabla__nombre" data-label="Insumo">
                    <div class="tabla__nombre-wrap">
                        <span class="insumo-status-dot" aria-hidden="true"></span>
                        <div class="tabla__nombre-info">
                            <span class="tabla__nombre-texto">${Store.escapeHtml(ins.nombre)}</span>
                            <div class="tabla__meta-uso">${usoBadge}</div>
                        </div>
                    </div>
                </td>
                <td class="tabla__celda-unidad" data-label="Unidad">
                    <span class="tabla__unidad">${Store.escapeHtml(ins.unidad)}</span>
                </td>
                <td class="tabla__precio" data-label="Precio por unidad">
                    <div class="tabla__precio-principal">
                        <span class="tabla__precio-valor">${Store.fmt(ins.precio)}</span>
                        <small class="tabla__precio-sufijo">/ ${Store.escapeHtml(ins.unidad)}</small>
                    </div>
                    <div class="tabla__precio-variacion">
                        ${chipHTML}
                    </div>
                </td>
                <td class="tabla__celda-acciones" data-label="Acciones">
                    <div class="tabla__acciones">
                        <button type="button" class="tabla__btn tabla__btn--editar" data-action="editar" data-id="${ins.id}" title="Editar ${Store.escapeHtml(ins.nombre)}" aria-label="Editar ${Store.escapeHtml(ins.nombre)}">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            <span>Editar</span>
                        </button>
                        <button type="button" class="tabla__btn tabla__btn--eliminar" data-action="eliminar" data-id="${ins.id}" title="Eliminar ${Store.escapeHtml(ins.nombre)}" aria-label="Eliminar ${Store.escapeHtml(ins.nombre)}">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            <span>Eliminar</span>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // ─── Modal de Agregar / Editar (Glassmorphism Pro) ─────────

    configurarModal() {
        const form     = document.getElementById('form-insumo');
        const cantEl   = document.getElementById('insumo-cantidad');
        const unidadEl = document.getElementById('insumo-unidad');
        const precioEl = document.getElementById('insumo-precio');

        const recalcular = () => this.actualizarPreviewUnitario();
        cantEl?.addEventListener('input', recalcular);
        unidadEl?.addEventListener('change', recalcular);
        precioEl?.addEventListener('input', recalcular);

        document.querySelectorAll('a[href="#modal-insumo"], #btn-nuevo-insumo').forEach(btn => {
            btn.addEventListener('click', () => {
                this.limpiarModal();
            });
        });

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarInsumo();
        });
    }

    actualizarPreviewUnitario() {
        const cantidad = parseFloat(document.getElementById('insumo-cantidad')?.value) || 0;
        const unidad   = document.getElementById('insumo-unidad')?.value || 'unidad';
        const precio   = parseFloat(document.getElementById('insumo-precio')?.value) || 0;
        const unitario = cantidad > 0 ? precio / cantidad : 0;

        const txtUnidad = document.getElementById('preview-unidad-txt');
        const txtPrecio = document.getElementById('preview-precio-txt');
        if (txtUnidad) txtUnidad.textContent = unidad;
        if (txtPrecio) txtPrecio.textContent = Store.fmt(unitario);
    }

    limpiarModal() {
        const form = document.getElementById('form-insumo');
        if (form) form.reset();
        const titulo = document.getElementById('modal-titulo');
        if (titulo) titulo.textContent = 'Nuevo insumo';
        document.getElementById('insumo-edit-id')?.remove();
        const cantInput = document.getElementById('insumo-cantidad');
        if (cantInput) cantInput.value = '1';
        this.actualizarPreviewUnitario();
    }

    abrirEditar(id) {
        const insumo = Store.cargarInsumos().find(i => i.id === id);
        if (!insumo) return;

        const titulo = document.getElementById('modal-titulo');
        if (titulo) titulo.textContent = 'Editar insumo';

        const nombreEl = document.getElementById('insumo-nombre');
        const cantEl   = document.getElementById('insumo-cantidad');
        const unidadEl = document.getElementById('insumo-unidad');
        const precioEl = document.getElementById('insumo-precio');

        if (nombreEl) nombreEl.value = insumo.nombre;
        if (cantEl)   cantEl.value   = '1';
        if (unidadEl) unidadEl.value = insumo.unidad;
        if (precioEl) precioEl.value = insumo.precio;

        let hidden = document.getElementById('insumo-edit-id');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id   = 'insumo-edit-id';
            document.getElementById('form-insumo')?.appendChild(hidden);
        }
        hidden.value = id;

        this.actualizarPreviewUnitario();
        window.location.hash = 'modal-insumo';
    }

    async guardarInsumo() {
        const nombreInput = document.getElementById('insumo-nombre');
        const cantInput   = document.getElementById('insumo-cantidad');
        const unidadInput = document.getElementById('insumo-unidad');
        const precioInput = document.getElementById('insumo-precio');
        const editId      = document.getElementById('insumo-edit-id')?.value;

        const nombre       = nombreInput ? nombreInput.value.trim() : '';
        const cantidad     = cantInput ? parseFloat(cantInput.value) || 1 : 1;
        const unidad       = unidadInput ? unidadInput.value : '';
        const precioPagado = precioInput ? parseFloat(precioInput.value) : NaN;

        if (!nombre || !unidad || isNaN(precioPagado) || cantidad <= 0) {
            Store.toast('Completa todos los campos con valores válidos.', 'error');
            return;
        }

        const precioUnitario = Math.round((precioPagado / cantidad) * 100) / 100;
        const btnSubmit = document.querySelector('.modal__btn-guardar');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Guardando insumo...';
        }

        try {
            const res = await Store.guardarInsumoAsync({
                id: editId ? parseInt(editId, 10) : null,
                nombre,
                unidad,
                precio: precioUnitario
            });

            if (res.success) {
                const insumoIdNum = editId ? parseInt(editId, 10) : null;
                const prodsAfectados = insumoIdNum
                    ? Store.cargarProductos().filter(p => (p.receta || []).some(r => r.insumoId === insumoIdNum))
                    : [];

                if (prodsAfectados.length > 0) {
                    Store.toast(`${res.mensaje}. Se actualizaron ${prodsAfectados.length} receta(s) con alerta de variación en "Mis productos".`, 'info');
                } else {
                    Store.toast(res.mensaje);
                }
                this.actualizarVista();
                window.location.hash = '#';
            } else {
                Store.toast(res.mensaje, 'error');
            }
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Guardar insumo';
            }
        }
    }

    async eliminarInsumo(id) {
        const insumo = Store.cargarInsumos().find(i => i.id === id);
        if (!insumo) return;

        // Primer intento sin forzar para validar si está en uso (MySQL o Local)
        const res = await Store.eliminarInsumoAsync(id, false);

        if (res.enUso) {
            const confirmar = await Store.confirmar({
                badge: 'Materia prima en uso',
                titulo: `¿Eliminar "${insumo.nombre}"?`,
                subtitulo: `Este insumo es un ingrediente activo en ${res.productos.length} ${res.productos.length === 1 ? 'receta' : 'recetas'}:`,
                items: res.productos || [],
                advertencia: 'Si lo eliminas, los cálculos de costo y margen de estas recetas se verán alterados.',
                btnConfirmarTexto: 'Sí, eliminar de todas formas',
                btnCancelarTexto: 'Conservar insumo',
                tipo: 'peligro'
            });
            if (!confirmar) return;

            // Segunda llamada forzando eliminación
            const resForzado = await Store.eliminarInsumoAsync(id, true);
            if (resForzado.success) {
                this.actualizarVista();
                Store.toast(`Insumo "${insumo.nombre}" eliminado`, 'info');
            } else {
                Store.toast(resForzado.mensaje, 'error');
            }
            return;
        }

        // Si no está en uso en recetas
        const confirmarSimple = await Store.confirmar({
            badge: 'Confirmar eliminación',
            titulo: `¿Eliminar "${insumo.nombre}"?`,
            subtitulo: 'Esta materia prima no está en uso en ninguna receta activa. Se eliminará de tu inventario.',
            btnConfirmarTexto: 'Eliminar insumo',
            btnCancelarTexto: 'Cancelar',
            tipo: 'alerta'
        });
        if (!confirmarSimple) return;

        const resEliminar = await Store.eliminarInsumoAsync(id, true);
        if (resEliminar.success) {
            this.actualizarVista();
            Store.toast(`Insumo "${insumo.nombre}" eliminado`, 'info');
        } else {
            Store.toast(resEliminar.mensaje, 'error');
        }
    }

    registrarServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
        }
    }
}

// Instancia global del controlador
const controladorInsumos = new InsumosController();
window.controladorInsumos = controladorInsumos;

// Métodos globales para compatibilidad
window.abrirEditar    = (id) => controladorInsumos.abrirEditar(id);
window.eliminarInsumo = (id) => controladorInsumos.eliminarInsumo(id);

document.addEventListener('DOMContentLoaded', () => {
    controladorInsumos.iniciar();
});
