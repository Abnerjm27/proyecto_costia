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
            const actionBtn = e.target.closest('[data-action]');
            if (!actionBtn) return;

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
        const ganancia = producto.calcularGananciaNeta(insumos);
        const margenReal = typeof producto.calcularMargenComercialReal === 'function'
            ? producto.calcularMargenComercialReal(insumos)
            : 0;
        const cambio = producto.detectarCambioPrecio(insumos);

        const valorFmt = Number(Number(producto.valorModo).toFixed(1));
        const modoLabel = producto.modo === 'margen'
            ? `Margen ${valorFmt}%`
            : `×${valorFmt} costo`;
        const modoClass = producto.modo === 'margen' ? 'modo-margen' : 'modo-multiplicador';

        const chipClase = margenReal >= 25 ? 'chip-gain' : (ganancia > 0 ? 'chip-amber' : 'chip-loss');
        const chipTexto = `Ganas ${Store.fmt(ganancia)}/ud`;

        const badgeAlza = cambio.estado === 'sube'
            ? `<span class="badge-alza-mini" title="Uno o varios insumos subieron de precio">Subió costo</span>`
            : '';

        const alertaHTML = this.construirAlerta(producto.id, cambio);
        const recetaHTML = this.construirReceta(producto, insumos);

        return `
            <article class="producto-card" data-id="${producto.id}" role="region" aria-label="Receta de ${Store.escapeHtml(producto.nombre)}">
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
                        <strong class="producto-card__precio tabular-nums">${Store.fmt(precioVenta)}</strong>
                    </div>
                    <div class="producto-card__precio-item">
                        <span class="producto-card__etiqueta-sm">Ganancia / ud</span>
                        <strong class="producto-card__ganancia tabular-nums">+${Store.fmt(ganancia)}</strong>
                    </div>
                </div>

                <div class="producto-card__col-acciones">
                    <a href="ficha-tecnica.html?id=${producto.id}" target="_blank" class="btn-ficha" title="Ver e imprimir Ficha Técnica en PDF">
                        <svg class="btn-ficha__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        <span>Ficha Técnica</span>
                    </a>
                    <div class="producto-card__botones-secundarios">
                        <a href="dashboard.html?producto=${producto.id}" class="btn-card-action" title="Simular precio en Inicio" aria-label="Simular precio de ${Store.escapeHtml(producto.nombre)}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
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
        const texto = sube ? `Subió ${dif} (+${pct}%) por insumos` : `Bajó ${dif} (−${pct}%) por insumos`;

        return `
            <div class="alerta-precio ${clase}" title="Antes: ${Store.fmt(cambio.precioAnterior)} → Ahora: ${Store.fmt(cambio.precioActual)}">
                <span class="alerta-precio__texto">${texto}</span>
                <button type="button" class="alerta-precio__ok alerta-precio__btn-ok" data-action="aceptar-cambio" data-id="${productoId}" title="Confirmar nuevo precio de referencia">
                    Confirmar
                </button>
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
