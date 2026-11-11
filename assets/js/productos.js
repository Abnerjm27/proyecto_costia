/**
 * productos.js — Controlador de Estación de Trabajo Financiera Costia Pro (POO)
 *
 * Arquitectura Modular en 3 Columnas:
 * 1. Order Book de Insumos & Sensibilidad
 * 2. Curva de Rentabilidad Financiera & Catálogo Ledger
 * 3. Consola de Pricing en Tiempo Real (Order Form)
 *
 * Cumple con:
 * - POO con ciclo de vida iniciar() y encapsulación total.
 * - WCAG AAA con objetivos táctiles >= 44x44px y números tabulares.
 * - Cero emojis en interfaz (únicamente iconos vectoriales SVG).
 * - Cero ocurrencias de palabras reservadas externas.
 * - Estricto límite de < 1.100 líneas.
 */

class ProductosWorkstationController {
    constructor() {
        this.filtroActual = 'todos';
        this.busquedaActual = '';
        this.productoActivoId = null;
        this.canalActivo = 'mostrador'; // 'mostrador' | 'delivery'
        this.margenObjetivo = 55; // 25, 35, 45, 55, 65 %
        this.curvaCanal = 'mostrador';
    }

    iniciar() {
        this.configurarEventos();
        this.actualizarVista();

        // Suscripción a cambios reactivos del Store
        if (typeof Store !== 'undefined' && typeof Store.alActualizar === 'function') {
            Store.alActualizar(() => this.actualizarVista());
        }

        // Registro de Service Worker para PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
        }
    }

    configurarEventos() {
        // Buscador reactivo
        const inputBuscar = document.getElementById('buscar-producto');
        inputBuscar?.addEventListener('input', (e) => {
            this.busquedaActual = e.target.value.trim().toLowerCase();
            const productos = Store.cargarProductos();
            const insumos = Store.cargarInsumos();
            this.renderizarProductos(productos, insumos);
        });

        // Filtros rápidos estilo Ledger
        document.querySelectorAll('.filtro-pill').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filtro-pill').forEach((b) => b.classList.remove('activo'));
                btn.classList.add('activo');
                this.filtroActual = btn.dataset.filtro || 'todos';
                const productos = Store.cargarProductos();
                const insumos = Store.cargarInsumos();
                this.renderizarProductos(productos, insumos);
            });
        });

        // Botón de exportación de catálogo completo en PDF
        const btnExportar = document.getElementById('btn-exportar-backup');
        btnExportar?.addEventListener('click', () => {
            window.location.href = 'ficha-tecnica.html?catalogo=pdf&print=1';
        });

        // Selector rápido de producto en Ticker
        const selectProducto = document.getElementById('select-producto-activo');
        selectProducto?.addEventListener('change', (e) => {
            const id = Number(e.target.value);
            if (id) {
                this.seleccionarProductoActivo(id);
            }
        });

        // Selector de canal en Consola de Pricing
        document.querySelectorAll('.channel-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.channel-btn').forEach((b) => {
                    b.classList.remove('activo');
                    b.setAttribute('aria-checked', 'false');
                });
                btn.classList.add('activo');
                btn.setAttribute('aria-checked', 'true');
                this.canalActivo = btn.dataset.channel || 'mostrador';
                this.actualizarConsolaPricing();
                this.renderizarCurva();
            });
        });

        // Selector de paradas de margen en Consola de Pricing
        document.querySelectorAll('.slider-stop-pill').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.slider-stop-pill').forEach((b) => b.classList.remove('activo'));
                btn.classList.add('activo');
                this.margenObjetivo = Number(btn.dataset.marginStop) || 55;
                const display = document.getElementById('calc-target-margin-display');
                if (display) display.textContent = `${this.margenObjetivo}%`;
                const spreadTarget = document.getElementById('spread-target-label');
                if (spreadTarget) spreadTarget.textContent = `${this.margenObjetivo}%`;
                this.actualizarConsolaPricing();
            });
        });

        // Botón de ejecución de orden de precios
        const btnEjecutar = document.getElementById('btn-ejecutar-orden');
        btnEjecutar?.addEventListener('click', () => {
            this.aplicarPrecioReceta();
        });

        // Botones de intervalo de canal en gráfico de curva
        document.querySelectorAll('.chart-interval-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-interval-btn').forEach((b) => b.classList.remove('activo'));
                btn.classList.add('activo');
                this.curvaCanal = btn.dataset.curveChannel || 'mostrador';
                this.renderizarCurva();
            });
        });

        // Delegación de eventos en el grid de productos
        const grid = document.getElementById('productos-grid');
        grid?.addEventListener('click', (e) => {
            const card = e.target.closest('article.producto-card');
            const actionBtn = e.target.closest('[data-action]');

            if (actionBtn) {
                e.stopPropagation();
                const action = actionBtn.dataset.action;
                const id = Number(actionBtn.dataset.id);
                if (!id) return;

                if (action === 'editar') {
                    this.editarProducto(id);
                } else if (action === 'duplicar') {
                    this.duplicarProducto(id);
                } else if (action === 'eliminar') {
                    this.eliminarProducto(id);
                } else if (action === 'aceptar-cambio') {
                    this.aceptarCambioPrecio(id);
                }
                return;
            }

            if (card && card.dataset.id) {
                const id = Number(card.dataset.id);
                if (id) {
                    this.seleccionarProductoActivo(id);
                }
            }
        });

        // Toggle de tema visual en el Sidebar
        const btnTema = document.getElementById('btn-toggle-sidebar-theme');
        btnTema?.addEventListener('click', () => {
            if (typeof ThemeManager !== 'undefined' && ThemeManager.toggle) {
                ThemeManager.toggle();
            } else {
                document.body.classList.toggle('costia-light-theme');
            }
        });
    }

    actualizarVista() {
        const insumos = Store.cargarInsumos();
        const productos = Store.cargarProductos();

        // Validar selección de producto activo
        if (productos.length > 0) {
            const existe = productos.some((p) => p.id === this.productoActivoId);
            if (!existe) {
                this.productoActivoId = productos[0].id;
            }
        } else {
            this.productoActivoId = null;
        }

        this.actualizarKPIs(productos, insumos);
        this.renderizarProductos(productos, insumos);
        this.actualizarSelectorProductos(productos);
        this.actualizarTicker(productos, insumos);
        this.actualizarOrderBook(productos, insumos);
        this.renderizarCurva(productos, insumos);
        this.actualizarConsolaPricing(productos, insumos);
    }

    actualizarKPIs(productos, insumos) {
        const elTotal = document.getElementById('kpi-prod-total');
        const elMargen = document.getElementById('kpi-prod-margen');
        const elAlertas = document.getElementById('kpi-prod-alertas');
        const cardAlertas = document.getElementById('kpi-card-alertas');
        const pillAlerta = document.getElementById('pill-alerta');

        if (elTotal) {
            elTotal.textContent = `${productos.length} ${productos.length === 1 ? 'activo' : 'activos'}`;
        }

        let sumaMargen = 0;
        let conAlerta = 0;

        productos.forEach((prod) => {
            const costo = prod.calcularCostoUnidad(insumos);
            const precio = prod.calcularPrecioVenta(insumos);
            if (costo > 0) {
                sumaMargen += ((precio - costo) / costo) * 100;
            }
            const cambio = prod.detectarCambioPrecio(insumos);
            if (cambio.estado === 'sube' || cambio.estado === 'baja') {
                conAlerta++;
            }
        });

        const promedio = productos.length > 0 ? Math.round(sumaMargen / productos.length) : 0;

        if (elMargen) {
            elMargen.textContent = `+${promedio}% s/costo`;
        }

        if (elAlertas) {
            if (conAlerta > 0) {
                elAlertas.textContent = `${conAlerta} ${conAlerta === 1 ? 'producto cambió' : 'productos cambiaron'}`;
                cardAlertas?.classList.add('kpi-card--alerta');
            } else {
                elAlertas.textContent = 'Todo al día';
                cardAlertas?.classList.remove('kpi-card--alerta');
            }
        }

        if (pillAlerta) {
            pillAlerta.textContent = conAlerta > 0 ? `Con alerta (${conAlerta})` : 'Con alerta';
        }
    }

    renderizarProductos(productosLista = null, insumosLista = null) {
        const insumos = insumosLista || Store.cargarInsumos();
        const productos = productosLista || Store.cargarProductos();
        const grid = document.getElementById('productos-grid');
        if (!grid) return;

        if (productos.length === 0) {
            grid.innerHTML = `
                <div class="estado-vacio">
                    <img class="estado-vacio__icono" src="../assets/img/chef-hat.png" alt="" width="56" height="56">
                    <h3>Portafolio sin productos</h3>
                    <p>Crea tu primer producto con su receta y Costia calculará automáticamente el desglose financiero, costos y precio de venta sugerido.</p>
                    <a href="crear-producto.html" class="btn-primario">+ Crear mi primer producto</a>
                </div>`;
            return;
        }

        const filtrados = productos.filter((p) => {
            const coincideTexto = p.nombre.toLowerCase().includes(this.busquedaActual);
            if (!coincideTexto) return false;

            if (this.filtroActual === 'todos') return true;
            if (this.filtroActual === 'margen') return p.modo === 'margen';
            if (this.filtroActual === 'multiplicador') return p.modo === 'multiplicador';
            if (this.filtroActual === 'alerta') {
                const c = p.detectarCambioPrecio(insumos);
                return c.estado === 'sube' || c.estado === 'baja';
            }
            return true;
        });

        if (filtrados.length === 0) {
            grid.innerHTML = `
                <div class="estado-vacio">
                    <h3>Sin resultados en la estación</h3>
                    <p>No se encontraron recetas que coincidan con los criterios de búsqueda o filtro seleccionados.</p>
                </div>`;
            return;
        }

        grid.innerHTML = filtrados.map((p) => this.crearCardHTML(p, insumos)).join('');
    }

    crearCardHTML(producto, insumos) {
        const unidades = producto.unidadesProducidas || 1;
        const costoUnidad = producto.calcularCostoUnidad(insumos);
        const precioVenta = producto.calcularPrecioVenta(insumos);
        const ganancia = producto.calcularGananciaNeta(insumos);
        const cambio = producto.detectarCambioPrecio(insumos);

        const modoLabel = producto.modo === 'margen'
            ? `Margen ${producto.valorModo}%`
            : `×${producto.valorModo}`;
        const modoClass = producto.modo === 'margen' ? 'modo-margen' : 'modo-multiplicador';

        const margenPct = costoUnidad > 0 ? Math.round(((precioVenta - costoUnidad) / costoUnidad) * 100) : 0;
        const chipClase = margenPct >= 30 ? 'chip-gain' : (margenPct > 0 ? 'chip-amber' : 'chip-loss');
        const chipTexto = `+${margenPct}% ROI`;

        const esActivo = producto.id === this.productoActivoId;
        const claseActiva = esActivo ? 'card--seleccionada' : '';

        const badgeAlza = cambio.estado === 'sube' 
            ? `<span class="badge-alza-mini" title="Uno o varios insumos subieron de precio">Alza detectada</span>` 
            : '';

        return `
            <article class="producto-card ${claseActiva}" data-id="${producto.id}" role="region" aria-label="Receta de ${Store.escapeHtml(producto.nombre)}">
                <div class="producto-card__col-info">
                    <div class="producto-card__header">
                        <span class="producto-card__indicador-activo ${esActivo ? 'activo' : ''}" aria-hidden="true"></span>
                        <h3 class="producto-card__nombre" title="${Store.escapeHtml(producto.nombre)}">${Store.escapeHtml(producto.nombre)}</h3>
                        <span class="producto-card__modo ${modoClass}">${modoLabel}</span>
                        <span class="${chipClase}">${chipTexto}</span>
                        ${badgeAlza}
                    </div>
                    <div class="producto-card__meta-sub">
                        <span>Rinde: <strong>${unidades} ${unidades === 1 ? 'ud' : 'uds'}</strong></span>
                        <span class="meta-sep">·</span>
                        <span>${producto.receta?.length || 0} insumos</span>
                        <span class="meta-sep">·</span>
                        <a href="dashboard.html?id=${producto.id}" class="producto-card__activo-tag" title="Abrir en simulador de pricing">Simular en Dashboard →</a>
                    </div>
                </div>

                <div class="producto-card__col-precios">
                    <div class="producto-card__precio-item">
                        <span class="producto-card__etiqueta-sm">Costo Unit.</span>
                        <strong class="producto-card__costo tabular-nums">${Store.fmt(costoUnidad)}</strong>
                    </div>
                    <div class="producto-card__precio-item">
                        <span class="producto-card__etiqueta-sm">Precio Mostrador</span>
                        <strong class="producto-card__precio tabular-nums">${Store.fmt(precioVenta)}</strong>
                    </div>
                    <div class="producto-card__precio-item">
                        <span class="producto-card__etiqueta-sm">Ganancia</span>
                        <strong class="producto-card__ganancia tabular-nums">+${Store.fmt(ganancia)}</strong>
                    </div>
                </div>

                <div class="producto-card__col-acciones">
                    <a href="ficha-tecnica.html?id=${producto.id}" target="_blank" class="btn-ficha" title="Ver e imprimir Ficha Técnica oficial en PDF">
                        <svg class="btn-ficha__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        <span>Ficha Técnica</span>
                    </a>
                    <div class="producto-card__botones-secundarios">
                        <a href="dashboard.html?id=${producto.id}" class="btn-card-action" title="Abrir en simulador de pricing" aria-label="Simular precio de ${Store.escapeHtml(producto.nombre)}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </a>
                        <button type="button" class="btn-card-action btn-editar" data-action="editar" data-id="${producto.id}" aria-label="Editar ${Store.escapeHtml(producto.nombre)}" title="Editar receta">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button type="button" class="btn-card-action btn-duplicar" data-action="duplicar" data-id="${producto.id}" title="Clonar receta" aria-label="Duplicar ${Store.escapeHtml(producto.nombre)}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button type="button" class="btn-card-action btn-eliminar" data-action="eliminar" data-id="${producto.id}" aria-label="Eliminar ${Store.escapeHtml(producto.nombre)}" title="Eliminar receta">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            </article>`;
    }

    construirReceta(producto, insumos) {
        const items = (producto.receta || []).map((linea) => {
            const ins = insumos.find((i) => i.id === linea.insumoId);
            if (!ins) {
                return `<li class="producto-receta__item"><span>Insumo eliminado</span><span>—</span></li>`;
            }
            const { costo } = linea.calcularCosto(ins);
            return `
                <li class="producto-receta__item">
                    <span>${Store.escapeHtml(ins.nombre)} <small class="tabular-nums">(${linea.cantidad} ${Store.escapeHtml(linea.unidadReceta)})</small></span>
                    <strong class="tabular-nums">${Store.fmt(costo)}</strong>
                </li>`;
        }).join('');

        let extrasHTML = '';
        if (producto.porcentajeMerma > 0) {
            extrasHTML += `
                <li class="producto-receta__item">
                    <span>Merma en cocción (+${producto.porcentajeMerma}%)</span>
                    <strong class="tabular-nums">+${Store.fmt(producto.calcularCostoMerma(insumos))}</strong>
                </li>`;
        }
        if (producto.costoEmpaque > 0) {
            extrasHTML += `
                <li class="producto-receta__item">
                    <span>Empaque (${Store.fmt(producto.costoEmpaque)}/ud)</span>
                    <strong class="tabular-nums">+${Store.fmt(producto.costoEmpaque * producto.unidadesProducidas)}</strong>
                </li>`;
        }
        if (producto.costoManoObra > 0) {
            extrasHTML += `
                <li class="producto-receta__item">
                    <span>Mano de obra / fijos</span>
                    <strong class="tabular-nums">+${Store.fmt(producto.costoManoObra)}</strong>
                </li>`;
        }

        const numInsumos = (producto.receta || []).length;
        const lotesTxt = producto.unidadesProducidas > 1 ? ` · Rinde ${producto.unidadesProducidas} uds.` : '';

        return `
            <details class="producto-receta">
                <summary class="producto-receta__resumen">
                    <span>Ver receta (${numInsumos} ${numInsumos === 1 ? 'insumo' : 'insumos'}${lotesTxt})</span>
                    <span class="producto-receta__flecha" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                </summary>
                <ul class="producto-receta__lista">${items}${extrasHTML}</ul>
            </details>`;
    }

    construirAlerta(productoId, cambio) {
        if (cambio.estado === 'igual' || cambio.estado === 'nuevo') return '';

        const sube = cambio.estado === 'sube';
        const pct = Math.abs(cambio.deltaPct).toFixed(1);
        const absDelta = Math.abs(cambio.delta);
        const dif = absDelta > 0 && absDelta < 1 ? '$' + absDelta.toFixed(2) : Store.fmt(absDelta);
        const clase = sube ? 'alerta-precio--sube' : 'alerta-precio--baja';
        const texto = sube ? `Sube ${dif} (+${pct}%) por insumos` : `Baja ${dif} (−${pct}%) por insumos`;

        return `
            <div class="alerta-precio ${clase}" title="Antes: ${Store.fmt(cambio.precioAnterior)} → Ahora: ${Store.fmt(cambio.precioActual)}">
                <span class="alerta-precio__icono">
                    <img src="../assets/img/${sube ? 'trending-up.svg' : 'trending-down.svg'}" alt="" width="18" height="18">
                </span>
                <div class="alerta-precio__cuerpo">
                    <span class="alerta-precio__texto">${texto}</span>
                    <small class="alerta-precio__detalle tabular-nums">Antes: ${Store.fmt(cambio.precioAnterior)}</small>
                </div>
                <button type="button" class="alerta-precio__ok" data-action="aceptar-cambio" data-id="${productoId}" title="Marcar como revisado">
                    OK
                </button>
            </div>`;
    }

    actualizarSelectorProductos(productos) {
        const select = document.getElementById('select-producto-activo');
        if (!select) return;

        select.innerHTML = productos.map((p) => {
            const selected = p.id === this.productoActivoId ? 'selected' : '';
            return `<option value="${p.id}" ${selected}>${Store.escapeHtml(p.nombre)}</option>`;
        }).join('');
    }

    seleccionarProductoActivo(id) {
        this.productoActivoId = id;
        const productos = Store.cargarProductos();
        const insumos = Store.cargarInsumos();

        // Actualizar tarjetas seleccionadas
        document.querySelectorAll('article.producto-card').forEach((card) => {
            if (Number(card.dataset.id) === id) {
                card.classList.add('card--seleccionada');
            } else {
                card.classList.remove('card--seleccionada');
            }
        });

        // Actualizar select del ticker
        const select = document.getElementById('select-producto-activo');
        if (select) select.value = String(id);

        this.actualizarTicker(productos, insumos);
        this.actualizarOrderBook(productos, insumos);
        this.renderizarCurva(productos, insumos);
        this.actualizarConsolaPricing(productos, insumos);
    }

    obtenerCodigoProducto(producto) {
        if (!producto || !producto.nombre) return 'REC/COP';
        const palabras = producto.nombre.trim().split(/\s+/);
        if (palabras.length >= 2) {
            return (palabras[0].substring(0, 2) + palabras[1].substring(0, 1)).toUpperCase() + '/COP';
        }
        return producto.nombre.substring(0, 3).toUpperCase() + '/COP';
    }

    actualizarTicker(productos, insumos) {
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        if (!producto) return;

        const codigo = this.obtenerCodigoProducto(producto);
        const costoUnidad = producto.calcularCostoUnidad(insumos);
        const precioVenta = producto.calcularPrecioVenta(insumos);
        const ganancia = producto.calcularGananciaNeta(insumos);
        const margenPct = costoUnidad > 0 ? Math.round(((precioVenta - costoUnidad) / costoUnidad) * 100) : 0;
        const cambio = producto.detectarCambioPrecio(insumos);

        const elCodigo = document.getElementById('ticker-prod-codigo');
        const elNombre = document.getElementById('ticker-prod-nombre');
        const elCosto = document.getElementById('ticker-costo-val');
        const elMargen = document.getElementById('ticker-margen-val');
        const elPrecio = document.getElementById('ticker-precio-val');
        const elGanancia = document.getElementById('ticker-ganancia-val');
        const elAlerta = document.getElementById('ticker-alerta-badge');

        if (elCodigo) elCodigo.textContent = codigo;
        if (elNombre) elNombre.textContent = producto.nombre;
        if (elCosto) elCosto.textContent = Store.fmt(costoUnidad);
        if (elMargen) elMargen.textContent = `+${margenPct}%`;
        if (elPrecio) elPrecio.textContent = Store.fmt(precioVenta);
        if (elGanancia) elGanancia.textContent = `+${Store.fmt(ganancia)}`;

        if (elAlerta) {
            if (cambio.estado === 'sube') {
                elAlerta.textContent = 'Alza Detectada';
                elAlerta.className = 'ticker-badge-warn';
            } else if (cambio.estado === 'baja') {
                elAlerta.textContent = 'Insumos Bajaron';
                elAlerta.className = 'ticker-badge-gain';
            } else {
                elAlerta.textContent = 'Costos Estables';
                elAlerta.className = 'ticker-badge-ok';
            }
        }
    }

    actualizarOrderBook(productos, insumos) {
        const tbody = document.getElementById('orderbook-tbody');
        const countBadge = document.getElementById('orderbook-count');
        const spreadReal = document.getElementById('spread-val-real');
        const sensibilidadTexto = document.getElementById('orderbook-sensibilidad-texto');
        if (!tbody) return;

        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        if (!producto || !producto.receta || producto.receta.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94A3B8; padding: 16px;">Sin insumos cargados</td></tr>`;
            if (countBadge) countBadge.textContent = '0 insumos';
            if (spreadReal) spreadReal.textContent = '0%';
            return;
        }

        const costoTotalReceta = producto.calcularCostoTotal(insumos);
        let insumoMayorAlza = null;
        let maxAlzaPct = 0;

        const filas = producto.receta.map((linea) => {
            const ins = insumos.find((i) => i.id === linea.insumoId);
            if (!ins) {
                return `<tr><td colspan="4">Insumo eliminado</td></tr>`;
            }
            const { costo } = linea.calcularCosto(ins);
            const pesoPct = costoTotalReceta > 0 ? ((costo / costoTotalReceta) * 100).toFixed(1) : '0.0';

            // Detección de alza porcentual
            const precioActual = Number(ins.precio) || 0;
            const precioAnterior = Number(ins.precioAnterior) || precioActual;
            const varPct = precioAnterior > 0 ? (((precioActual - precioAnterior) / precioAnterior) * 100).toFixed(1) : '0.0';

            if (Number(varPct) > maxAlzaPct) {
                maxAlzaPct = Number(varPct);
                insumoMayorAlza = ins.nombre;
            }

            const varClase = Number(varPct) > 0 ? 'orderbook-val-alza' : 'orderbook-val-estable';
            const varSigno = Number(varPct) > 0 ? `+${varPct}%` : `${varPct}%`;

            return `
                <tr>
                    <td><strong>${Store.escapeHtml(ins.nombre)}</strong></td>
                    <td class="text-right tabular-nums">${Store.fmt(costo)}</td>
                    <td class="text-right tabular-nums ${varClase}">${varSigno}</td>
                    <td class="text-right tabular-nums">${pesoPct}%</td>
                </tr>`;
        }).join('');

        tbody.innerHTML = filas;
        if (countBadge) countBadge.textContent = `${producto.receta.length} insumos`;

        const costoUnidad = producto.calcularCostoUnidad(insumos);
        const precioVenta = producto.calcularPrecioVenta(insumos);
        const spreadPct = costoUnidad > 0 ? (((precioVenta - costoUnidad) / costoUnidad) * 100).toFixed(1) : '0.0';

        if (spreadReal) spreadReal.textContent = `+${spreadPct}%`;

        if (sensibilidadTexto) {
            if (insumoMayorAlza && maxAlzaPct > 0) {
                sensibilidadTexto.textContent = `Alza de +${maxAlzaPct}% en "${insumoMayorAlza}". Ajusta el margen en la consola derecha para defender tu rentabilidad.`;
            } else {
                sensibilidadTexto.textContent = `Estructura equilibrada. Margen de seguridad sólido para venta en mostrador y delivery.`;
            }
        }
    }

    renderizarCurva(productosLista = null, insumosLista = null) {
        const container = document.getElementById('chart-svg-container');
        if (!container) return;

        const productos = productosLista || Store.cargarProductos();
        const insumos = insumosLista || Store.cargarInsumos();
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];

        if (!producto) {
            container.innerHTML = `<div style="padding: 20px; color: #94A3B8; font-size: 0.85rem;">Selecciona una receta para visualizar la curva de rentabilidad.</div>`;
            return;
        }

        const costoUnidad = producto.calcularCostoUnidad(insumos);
        const precioActual = producto.calcularPrecioVenta(insumos);
        const comision = this.curvaCanal === 'delivery' ? 0.22 : 0.00;

        // Generar 6 puntos paramétricos de precio
        const baseMin = Math.max(500, Math.round(costoUnidad * 1.2));
        const baseMax = Math.round(costoUnidad * 2.8);
        const paso = Math.round((baseMax - baseMin) / 5);

        const puntos = [];
        for (let i = 0; i < 6; i++) {
            const p = baseMin + i * paso;
            const comisionVal = p * comision;
            const impoconsumo = p * 0.08;
            const neta = p - costoUnidad - comisionVal - impoconsumo;
            const margen = p > 0 ? Math.round((neta / p) * 100) : 0;
            puntos.push({ precio: p, margen: Math.max(10, Math.min(80, margen)) });
        }

        // Dimensiones SVG
        const W = 620;
        const H = 160;
        const padX = 50;
        const padY = 25;
        const plotW = W - padX * 2;
        const plotH = H - padY * 2;

        const minP = puntos[0].precio;
        const maxP = puntos[puntos.length - 1].precio;
        const minM = 10;
        const maxM = 75;

        const toX = (val) => padX + ((val - minP) / (maxP - minP)) * plotW;
        const toY = (val) => H - padY - ((val - minM) / (maxM - minM)) * plotH;

        const coords = puntos.map((pt) => ({ x: toX(pt.precio), y: toY(pt.margen) }));
        const pathData = coords.reduce((acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`), '');
        const areaData = `${pathData} L ${coords[coords.length - 1].x} ${H - padY} L ${coords[0].x} ${H - padY} Z`;

        // Punto de precio actual
        const curX = toX(Math.max(minP, Math.min(maxP, precioActual)));
        const curY = toY(this.margenObjetivo);

        // Línea target
        const targetY = toY(this.margenObjetivo);

        container.innerHTML = `
            <svg viewBox="0 0 ${W} ${H}" width="100%" height="160" aria-label="Curva de margen vs precio">
                <defs>
                    <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="#0A6847" stop-opacity="0.28"/>
                        <stop offset="100%" stop-color="#0A6847" stop-opacity="0.02"/>
                    </linearGradient>
                </defs>

                <!-- Cuadrícula horizontal -->
                <line x1="${padX}" y1="${toY(30)}" x2="${W - padX}" y2="${toY(30)}" stroke="rgba(7,31,23,0.08)" stroke-dasharray="3 3"/>
                <line x1="${padX}" y1="${toY(50)}" x2="${W - padX}" y2="${toY(50)}" stroke="rgba(7,31,23,0.08)" stroke-dasharray="3 3"/>
                <line x1="${padX}" y1="${toY(70)}" x2="${W - padX}" y2="${toY(70)}" stroke="rgba(7,31,23,0.08)" stroke-dasharray="3 3"/>

                <!-- Etiquetas Eje Y -->
                <text x="${padX - 8}" y="${toY(30) + 4}" font-size="10" fill="#4A6358" text-anchor="end" font-family="Azeret Mono">30%</text>
                <text x="${padX - 8}" y="${toY(50) + 4}" font-size="10" fill="#4A6358" text-anchor="end" font-family="Azeret Mono">50%</text>
                <text x="${padX - 8}" y="${toY(70) + 4}" font-size="10" fill="#4A6358" text-anchor="end" font-family="Azeret Mono">70%</text>

                <!-- Línea de Margen Objetivo -->
                <line x1="${padX}" y1="${targetY}" x2="${W - padX}" y2="${targetY}" stroke="#2ECC71" stroke-width="1.5" stroke-dasharray="4 4"/>
                <text x="${W - padX}" y="${targetY - 4}" font-size="10" fill="#0A6847" font-weight="700" text-anchor="end" font-family="Azeret Mono">Target ${this.margenObjetivo}%</text>

                <!-- Área y línea de curva -->
                <path d="${areaData}" fill="url(#curveGradient)"/>
                <path d="${pathData}" fill="none" stroke="#0A6847" stroke-width="2.5" stroke-linecap="round"/>

                <!-- Puntos interactivos -->
                ${coords.map((c, i) => `
                    <circle cx="${c.x}" cy="${c.y}" r="4" fill="#FFFFFF" stroke="#0A6847" stroke-width="2"/>
                    <text x="${c.x}" y="${H - 6}" font-size="9.5" fill="#4A6358" text-anchor="middle" font-family="Azeret Mono">${Store.fmt(puntos[i].precio)}</text>
                `).join('')}

                <!-- Marcador de Posición Actual -->
                <circle cx="${curX}" cy="${curY}" r="6" fill="#0A6847" stroke="#FFFFFF" stroke-width="2.5"/>
            </svg>`;
    }

    actualizarConsolaPricing(productosLista = null, insumosLista = null) {
        const productos = productosLista || Store.cargarProductos();
        const insumos = insumosLista || Store.cargarInsumos();
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];

        const elNombre = document.getElementById('pricing-prod-nombre');
        const elCodigo = document.getElementById('pricing-prod-codigo');
        const elCostoBase = document.getElementById('calc-costo-base');
        const elGastosFijos = document.getElementById('calc-gastos-fijos');
        const elComision = document.getElementById('calc-comision-canal');
        const elImpoconsumo = document.getElementById('calc-impoconsumo');
        const elPrecioFinal = document.getElementById('calc-precio-final');
        const elGananciaNeta = document.getElementById('calc-ganancia-neta');

        if (!producto) {
            if (elNombre) elNombre.textContent = 'Sin receta seleccionada';
            return;
        }

        const codigo = this.obtenerCodigoProducto(producto);
        if (elNombre) elNombre.textContent = producto.nombre;
        if (elCodigo) elCodigo.textContent = codigo;

        // Cálculos financieros deterministas
        const costoDirecto = producto.calcularCostoUnidad(insumos);
        const gastosFijosCuota = producto.costoManoObra > 0
            ? Math.round(producto.costoManoObra / (producto.unidadesProducidas || 1))
            : Math.round(costoDirecto * 0.12);

        const costoBaseTotal = costoDirecto + gastosFijosCuota;
        const comisionPct = this.canalActivo === 'delivery' ? 0.22 : 0.00;
        const impoconsumoPct = 0.08;

        // Margen deseado sobre costo directo
        const factorMargen = 1 + this.margenObjetivo / 100;
        const precioBase = costoBaseTotal * factorMargen;

        // Ajuste por comisión de canal para no erosionar el margen
        const precioVentaSugerido = comisionPct > 0
            ? Math.round(precioBase / (1 - comisionPct))
            : Math.round(precioBase);

        const comisionMonto = Math.round(precioVentaSugerido * comisionPct);
        const impoconsumoMonto = Math.round(precioVentaSugerido * impoconsumoPct);
        const gananciaNeta = precioVentaSugerido - costoDirecto - gastosFijosCuota - comisionMonto - impoconsumoMonto;

        if (elCostoBase) elCostoBase.textContent = Store.fmt(costoDirecto);
        if (elGastosFijos) elGastosFijos.textContent = Store.fmt(gastosFijosCuota);
        if (elComision) elComision.textContent = `${Store.fmt(comisionMonto)} (${Math.round(comisionPct * 100)}%)`;
        if (elImpoconsumo) elImpoconsumo.textContent = `${Store.fmt(impoconsumoMonto)} (8%)`;
        if (elPrecioFinal) elPrecioFinal.textContent = Store.fmt(precioVentaSugerido);
        if (elGananciaNeta) elGananciaNeta.textContent = `+${Store.fmt(gananciaNeta)}`;

        this.precioSugeridoCalculado = precioVentaSugerido;
    }

    async aplicarPrecioReceta() {
        const productos = Store.cargarProductos();
        const prod = productos.find((p) => p.id === this.productoActivoId);
        if (!prod) return;

        prod.modo = 'margen';
        prod.valorModo = this.margenObjetivo;
        prod.tipoMargen = 'costo';

        const res = await Store.guardarProductoAsync(prod);
        if (res.success) {
            this.actualizarVista();
            if (typeof Store.toast === 'function') {
                Store.toast(`Precio aplicado con éxito a "${prod.nombre}" con margen de ${this.margenObjetivo}%`);
            }
        } else {
            if (typeof Store.toast === 'function') {
                Store.toast(res.mensaje || 'Error al aplicar precio', 'error');
            }
        }
    }

    editarProducto(id) {
        window.location.href = `crear-producto.html?id=${id}`;
    }

    async duplicarProducto(id) {
        const prod = Store.cargarProductos().find((p) => p.id === id);
        if (!prod) return;

        const datosCopia = {
            nombre: `${prod.nombre} (Copia)`,
            modo: prod.modo,
            valorModo: prod.valorModo,
            tipoMargen: prod.tipoMargen || 'costo',
            unidadesProducidas: prod.unidadesProducidas,
            costoEmpaque: prod.costoEmpaque || 0,
            porcentajeMerma: prod.porcentajeMerma || 0,
            costoManoObra: prod.costoManoObra || 0,
            receta: (prod.receta || []).map((r) => ({
                insumoId: r.insumoId,
                cantidad: r.cantidad,
                unidadReceta: r.unidadReceta
            }))
        };

        const res = await Store.guardarProductoAsync(datosCopia);
        if (res.success) {
            this.actualizarVista();
            if (typeof Store.toast === 'function') {
                Store.toast(`Producto "${datosCopia.nombre}" duplicado con éxito`);
            }
        } else {
            if (typeof Store.toast === 'function') {
                Store.toast(res.mensaje, 'error');
            }
        }
    }

    async eliminarProducto(id) {
        const prod = Store.cargarProductos().find((p) => p.id === id);
        if (!prod) return;

        const confirmar = await Store.confirmar({
            badge: 'Eliminar producto',
            titulo: `¿Eliminar "${prod.nombre}"?`,
            subtitulo: 'Se eliminará la ficha técnica, los cálculos de costo y la receta completa de este producto.',
            advertencia: 'Esta acción no se puede deshacer.',
            btnConfirmarTexto: 'Sí, eliminar producto',
            btnCancelarTexto: 'Conservar producto',
            tipo: 'peligro'
        });
        if (!confirmar) return;

        const res = await Store.eliminarProductoAsync(id);
        this.actualizarVista();
        if (typeof Store.toast === 'function') {
            Store.toast(res.mensaje || `Producto "${prod.nombre}" eliminado`, 'info');
        }
    }

    async aceptarCambioPrecio(id) {
        await Store.aceptarCambioPrecioAsync(id);
        this.actualizarVista();
        if (typeof Store.toast === 'function') {
            Store.toast('Precio actualizado y alerta confirmada');
        }
    }
}

// Instancia global del controlador
const controladorProductos = new ProductosWorkstationController();
window.controladorProductos = controladorProductos;

// Compatibilidad con invocaciones previas
window.editarProducto = (id) => controladorProductos.editarProducto(id);
window.duplicarProducto = (id) => controladorProductos.duplicarProducto(id);
window.eliminarProducto = (id) => controladorProductos.eliminarProducto(id);
window.aceptarCambioPrecio = (id) => controladorProductos.aceptarCambioPrecio(id);

document.addEventListener('DOMContentLoaded', () => {
    controladorProductos.iniciar();
});
