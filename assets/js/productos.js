/**
 * productos.js — Controlador del Catálogo de Productos y Recetas (Costia)
 *
 * Responsabilidades:
 * - Renderizar KPIs comerciales reales del portafolio (total, margen promedio s/venta, alertas).
 * - Filtrar y buscar recetas en tiempo real (Todos, Con alerta, Margen %, Multiplicador ×).
 * - Mostrar tarjetas accionables con desglose colapsable (<details>) y alertas de alza confirmables.
 * - Permitir editar (clic en título o botón), simular en Inicio, duplicar y eliminar recetas.
 */

class ProductosWorkstationController {
    constructor() {
        this.filtroActual = 'todos';
        this.busquedaActual = '';
    }

    iniciar() {
        this.configurarEventos();
        this.actualizarVista();

        if (typeof Store !== 'undefined' && typeof Store.alActualizar === 'function') {
            Store.alActualizar(() => this.actualizarVista());
        }

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
        }
    }

    configurarEventos() {
        const inputBuscar = document.getElementById('buscar-producto');
        inputBuscar?.addEventListener('input', (e) => {
            this.busquedaActual = e.target.value.trim().toLowerCase();
            this.renderizarProductos();
        });

        document.querySelectorAll('.filtro-pill').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filtro-pill').forEach((b) => b.classList.remove('activo'));
                btn.classList.add('activo');
                this.filtroActual = btn.dataset.filtro || 'todos';
                this.renderizarProductos();
            });
        });

        const btnExportar = document.getElementById('btn-exportar-backup');
        btnExportar?.addEventListener('click', () => {
            window.location.href = 'ficha-tecnica.html?catalogo=pdf&print=1';
        });

        const grid = document.getElementById('productos-grid');
        grid?.addEventListener('click', (e) => {
            const menuBtn = e.target.closest('.producto-card__menu-btn');
            if (menuBtn) {
                e.stopPropagation();
                this.alternarMenuTarjeta(menuBtn);
                return;
            }

            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

            e.stopPropagation();
            this.cerrarMenusTarjeta();
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
            } else if (action === 'mantener-precio') {
                this.mantenerPrecioYRecalcularMargen(id);
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.producto-card__menu-wrap')) {
                this.cerrarMenusTarjeta();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarMenusTarjeta();
            }
        });
    }

    alternarMenuTarjeta(btn) {
        const wrap = btn.closest('.producto-card__menu-wrap');
        const dropdown = wrap?.querySelector('.producto-card__menu-dropdown');
        const card = btn.closest('.producto-card');
        if (!dropdown || !card) return;

        const estabaAbierto = dropdown.classList.contains('abierto');
        this.cerrarMenusTarjeta();

        if (!estabaAbierto) {
            dropdown.classList.add('abierto');
            card.classList.add('menu-activo');
            btn.setAttribute('aria-expanded', 'true');
        }
    }

    cerrarMenusTarjeta() {
        document.querySelectorAll('.producto-card__menu-dropdown.abierto').forEach((menu) => {
            menu.classList.remove('abierto');
        });
        document.querySelectorAll('.producto-card.menu-activo').forEach((card) => {
            card.classList.remove('menu-activo');
        });
        document.querySelectorAll('.producto-card__menu-btn[aria-expanded="true"]').forEach((b) => {
            b.setAttribute('aria-expanded', 'false');
        });
    }

    actualizarVista() {
        const insumos = Store.cargarInsumos();
        const productos = Store.cargarProductos();
        this.actualizarKPIs(productos, insumos);
        this.renderizarProductos(productos, insumos);
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
            const margenReal = typeof prod.calcularMargenComercialReal === 'function'
                ? prod.calcularMargenComercialReal(insumos)
                : 0;
            sumaMargen += margenReal;

            const cambio = prod.detectarCambioPrecio(insumos);
            if (cambio.estado === 'sube' || cambio.estado === 'baja') {
                conAlerta++;
            }
        });

        const promedio = productos.length > 0 ? Math.round(sumaMargen / productos.length) : 0;

        if (elMargen) {
            elMargen.textContent = `${promedio}% promedio`;
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
                    <h3>Aún no tienes recetas creadas</h3>
                    <p>Crea tu primera receta y Costia calculará automáticamente el costo por porción, margen real y precio de venta sugerido.</p>
                    <a href="crear-producto.html" class="btn-primario">Crear mi primera receta</a>
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
                    <h3>Sin recetas que coincidan</h3>
                    <p>No se encontraron recetas con ese nombre o filtro seleccionado.</p>
                </div>`;
            return;
        }

        grid.innerHTML = filtrados.map((p) => this.crearCardHTML(p, insumos)).join('');
    }

    crearCardHTML(producto, insumos) {
        const unidades = producto.unidadesProducidas || 1;
        const costoUnidad = producto.calcularCostoUnidad(insumos);
        const precioVenta = producto.calcularPrecioVenta(insumos);
        const cambio = producto.detectarCambioPrecio(insumos);
        const tieneCambioPendiente = (cambio.estado === 'sube' || cambio.estado === 'baja') && cambio.precioAnterior > 0;
        const precioMostrador = tieneCambioPendiente ? cambio.precioAnterior : precioVenta;
        const ganancia = precioMostrador - costoUnidad;
        const margenReal = precioMostrador > 0
            ? Math.round(((precioMostrador - costoUnidad) / precioMostrador) * 100)
            : 0;

        const valorFmt = Number(Number(producto.valorModo).toFixed(1));
        const modoLabel = producto.modo === 'margen'
            ? `Margen ${valorFmt}%`
            : `×${valorFmt} costo`;
        const modoClass = producto.modo === 'margen' ? 'modo-margen' : 'modo-multiplicador';

        const chipClase = margenReal >= 25 ? 'chip-gain' : (ganancia > 0 ? 'chip-amber' : 'chip-loss');
        const gananciaFmt = ganancia < 0 ? `-${Store.fmt(Math.abs(ganancia))}` : `+${Store.fmt(ganancia)}`;
        const chipTexto = ganancia < 0
            ? `Pierdes ${Store.fmt(Math.abs(ganancia))}/ud`
            : `Ganas ${Store.fmt(ganancia)}/ud`;

        const badgeAlza = cambio.estado === 'sube'
            ? `<span class="badge-alza-mini" title="Uno o varios insumos subieron de precio">Subió costo</span>`
            : '';

        const alertaHTML = this.construirAlerta(producto.id, cambio);
        const recetaHTML = this.construirReceta(producto, insumos);
        const thumbHTML = producto.imagen
            ? `<div class="producto-card__thumb-wrap"><img src="${Store.escapeHtml(producto.imagen)}" alt="${Store.escapeHtml(producto.nombre)}" class="producto-card__thumb" width="72" height="72" loading="lazy"></div>`
            : '';

        return `
            <article class="producto-card${producto.imagen ? ' producto-card--con-foto' : ''}" data-id="${producto.id}" role="region" aria-label="Receta de ${Store.escapeHtml(producto.nombre)}">
                ${thumbHTML}
                <div class="producto-card__col-info">
                    <div class="producto-card__header">
                        <h3 class="producto-card__nombre" title="Editar ${Store.escapeHtml(producto.nombre)}">
                            <a href="crear-producto.html?id=${producto.id}" class="producto-card__titulo-link">${Store.escapeHtml(producto.nombre)}</a>
                        </h3>
                        <span class="producto-card__modo ${modoClass}">${modoLabel}</span>
                        <span class="${chipClase}">${chipTexto}</span>
                        ${badgeAlza}
                    </div>
                    <div class="producto-card__meta-sub">
                        <span>Rinde: <strong>${unidades} ${unidades === 1 ? 'ud' : 'uds'}</strong></span>
                        <span class="meta-sep">·</span>
                        <span>Margen real: <strong>${margenReal}%</strong></span>
                        <span class="meta-sep">·</span>
                        <a href="dashboard.html?producto=${producto.id}" class="producto-card__activo-tag" title="Simular precios de esta receta">Simular precio →</a>
                    </div>
                    ${alertaHTML}
                    ${recetaHTML}
                </div>

                <div class="producto-card__col-precios">
                    <div class="producto-card__precio-item">
                        <span class="producto-card__etiqueta-sm">Costo Unit.</span>
                        <strong class="producto-card__costo tabular-nums">${Store.fmt(costoUnidad)}</strong>
                    </div>
                    <div class="producto-card__precio-item">
                        <span class="producto-card__etiqueta-sm">Precio Mostrador</span>
                        <strong class="producto-card__precio tabular-nums">${Store.fmt(precioMostrador)}</strong>
                    </div>
                    <div class="producto-card__precio-item">
                        <span class="producto-card__etiqueta-sm">Ganancia / ud</span>
                        <strong class="producto-card__ganancia tabular-nums">${gananciaFmt}</strong>
                    </div>
                </div>

                <div class="producto-card__menu-wrap">
                    <button
                        type="button"
                        class="producto-card__menu-btn"
                        aria-haspopup="menu"
                        aria-expanded="false"
                        aria-label="Opciones de ${Store.escapeHtml(producto.nombre)}"
                        title="Más opciones"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <circle cx="12" cy="5" r="2"/>
                            <circle cx="12" cy="12" r="2"/>
                            <circle cx="12" cy="19" r="2"/>
                        </svg>
                    </button>
                    <div class="producto-card__menu-dropdown" role="menu" aria-label="Acciones para ${Store.escapeHtml(producto.nombre)}">
                        <a href="ficha-tecnica.html?id=${producto.id}" target="_blank" class="producto-menu-item btn-ficha" role="menuitem">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            <span>Ver Ficha Técnica</span>
                        </a>
                        <button type="button" class="producto-menu-item btn-editar" data-action="editar" data-id="${producto.id}" role="menuitem">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            <span>Editar receta</span>
                        </button>
                        <a href="dashboard.html?producto=${producto.id}" class="producto-menu-item" role="menuitem">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                            <span>Simular precio</span>
                        </a>
                        <button type="button" class="producto-menu-item btn-duplicar" data-action="duplicar" data-id="${producto.id}" role="menuitem">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            <span>Duplicar receta</span>
                        </button>
                        <div class="producto-menu-sep" role="separator"></div>
                        <button type="button" class="producto-menu-item producto-menu-item--peligro btn-eliminar" data-action="eliminar" data-id="${producto.id}" role="menuitem">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            <span>Eliminar receta</span>
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
                    <span>Merma (+${producto.porcentajeMerma}%)</span>
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
        return `
            <details class="producto-receta">
                <summary class="producto-receta__resumen">
                    Ver ingredientes (${numInsumos} ${numInsumos === 1 ? 'insumo' : 'insumos'})
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
        const precioNuevoFmt = Store.fmt(cambio.precioActual);
        const precioAntesFmt = Store.fmt(cambio.precioAnterior);
        const texto = sube
            ? `Subió ${dif} (+${pct}%) · Sugerido: ${precioNuevoFmt}`
            : `Bajó ${dif} (−${pct}%) · Sugerido: ${precioNuevoFmt}`;
        const labelAplicar = sube ? `Subir a ${precioNuevoFmt}` : `Bajar a ${precioNuevoFmt}`;

        return `
            <div class="alerta-precio ${clase}" title="Precio anterior: ${precioAntesFmt} → Nuevo sugerido: ${precioNuevoFmt}">
                <span class="alerta-precio__texto">${texto}</span>
                <span class="alerta-precio__acciones">
                    <button type="button" class="alerta-precio__ok alerta-precio__btn-ok" data-action="aceptar-cambio" data-id="${productoId}" title="Actualizar Precio Mostrador a ${precioNuevoFmt}">
                        ${labelAplicar}
                    </button>
                    <button type="button" class="alerta-precio__btn-mantener" data-action="mantener-precio" data-id="${productoId}" title="Mantener ${precioAntesFmt} y recalcular el nuevo margen">
                        Mantener ${precioAntesFmt}
                    </button>
                </span>
            </div>`;
    }

    editarProducto(id) {
        window.location.href = `crear-producto.html?id=${id}`;
    }

    async duplicarProducto(id) {
        const prod = Store.cargarProductos().find((p) => p.id === id);
        if (!prod) return;

        const datosCopia = {
            nombre: `${prod.nombre} (Copia)`,
            imagen: prod.imagen || null,
            modo: prod.modo,
            valorModo: prod.valorModo,
            tipoMargen: prod.tipoMargen || 'venta',
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
                Store.toast(`Receta "${datosCopia.nombre}" duplicada con éxito`);
            }
        } else if (typeof Store.toast === 'function') {
            Store.toast(res.mensaje, 'error');
        }
    }

    async eliminarProducto(id) {
        const prod = Store.cargarProductos().find((p) => p.id === id);
        if (!prod) return;

        const confirmar = await Store.confirmar({
            badge: 'Eliminar receta',
            titulo: `¿Eliminar "${prod.nombre}"?`,
            subtitulo: 'Se eliminará la ficha técnica, los cálculos de costo y la receta completa de este producto.',
            advertencia: 'Esta acción no se puede deshacer.',
            btnConfirmarTexto: 'Sí, eliminar receta',
            btnCancelarTexto: 'Conservar receta',
            tipo: 'peligro'
        });
        if (!confirmar) return;

        const res = await Store.eliminarProductoAsync(id);
        this.actualizarVista();
        if (typeof Store.toast === 'function') {
            Store.toast(res.mensaje || `Receta "${prod.nombre}" eliminada`, 'info');
        }
    }

    async aceptarCambioPrecio(id) {
        await Store.aceptarCambioPrecioAsync(id);
        this.actualizarVista();
        if (typeof Store.toast === 'function') {
            Store.toast('Precio actualizado y alerta confirmada');
        }
    }

    async mantenerPrecioYRecalcularMargen(id) {
        const res = await Store.mantenerPrecioRecalcularMargenAsync(id);
        this.actualizarVista();
        if (typeof Store.toast === 'function') {
            if (res && res.success) {
                const detalle = res.modo === 'multiplicador'
                    ? `Nuevo multiplicador: ×${Number(res.nuevoValorModo.toFixed(2))} (Margen real: ${res.margenReal}%)`
                    : `Nuevo margen: ${Number(res.nuevoValorModo.toFixed(1))}% (Margen real: ${res.margenReal}%)`;
                Store.toast(`Precio mantenido en ${Store.fmt(res.precioMantenido)}. ${detalle}`);
            } else {
                Store.toast((res && res.mensaje) || 'No se pudo mantener el precio anterior.', 'error');
            }
        }
    }
}

const controladorProductos = new ProductosWorkstationController();
window.controladorProductos = controladorProductos;

window.editarProducto = (id) => controladorProductos.editarProducto(id);
window.duplicarProducto = (id) => controladorProductos.duplicarProducto(id);
window.eliminarProducto = (id) => controladorProductos.eliminarProducto(id);
window.aceptarCambioPrecio = (id) => controladorProductos.aceptarCambioPrecio(id);

document.addEventListener('DOMContentLoaded', () => {
    controladorProductos.iniciar();
});
