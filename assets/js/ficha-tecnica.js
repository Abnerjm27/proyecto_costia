/**
 * ficha-tecnica.js — Controlador de Ficha Técnica de Costeo y Catálogo de Fichas
 * Costia · Inteligencia Financiera Gastronómica · Terminal Pro
 *
 * Responsabilidades:
 * - Renderizar catálogo organizado de fichas técnicas con buscador en vivo.
 * - Desglosar y calcular costos por lote y unidad con modelos oficiales.
 * - Renderizar hoja imprimible estandarizada para cocina, taller y PDF.
 * - Soportar navegación bidireccional limpia entre catálogo y ficha individual.
 */

class FichaTecnicaControlador {
    static inicializar() {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const prodId = params.get('id');
        const esCatalogoPdf = params.get('catalogo') === 'pdf' || params.get('vista') === 'catalogo-pdf';

        const productos = typeof Store !== 'undefined' && typeof Store.cargarProductos === 'function' ? Store.cargarProductos() : [];
        const insumos   = typeof Store !== 'undefined' && typeof Store.cargarInsumos === 'function' ? Store.cargarInsumos() : [];

        const seccionCatalogo  = document.getElementById('seccion-catalogo-fichas');
        const vistaHoja        = document.getElementById('vista-hoja-container') || document.getElementById('ficha-imprimible');
        const vistaCatalogoPdf = document.getElementById('vista-catalogo-pdf-container');

        if (esCatalogoPdf) {
            // MODO EXPORTACIÓN DE CATÁLOGO COMPLETO EN PDF (Ver y exportar todos los productos)
            if (seccionCatalogo) seccionCatalogo.style.display = 'none';
            if (vistaHoja) vistaHoja.style.display = 'none';
            if (vistaCatalogoPdf) vistaCatalogoPdf.style.display = '';

            this.renderizarCatalogoCompletoPdf(productos, insumos);
        } else if (prodId) {
            // MODO FICHA INDIVIDUAL (Vista directa o previsualización de impresión)
            const prodActivo = productos.find(p => String(p.id) === String(prodId)) || productos[0];
            const activoId = prodActivo ? prodActivo.id : Number(prodId);

            if (seccionCatalogo) seccionCatalogo.style.display = 'none';
            if (vistaCatalogoPdf) vistaCatalogoPdf.style.display = 'none';
            if (vistaHoja) vistaHoja.style.display = '';

            this.renderizarSelector(productos, activoId);
            this.cargarFicha(activoId);
        } else {
            // MODO CATÁLOGO (Listado organizado sin hoja abajo)
            if (seccionCatalogo) {
                seccionCatalogo.style.display = '';
                if (vistaHoja) vistaHoja.style.display = 'none';
                if (vistaCatalogoPdf) vistaCatalogoPdf.style.display = 'none';
                this.renderizarCatalogo(productos, insumos, '');
                this.configurarBuscador(productos, insumos);
            } else {
                // Si la página solo tiene la hoja (ej. ficha-preview.html sin id en url)
                const primerId = productos.length > 0 ? productos[0].id : 1;
                this.renderizarSelector(productos, primerId);
                this.cargarFicha(primerId);
            }
        }

        // Vincular botones de imprimir
        document.querySelectorAll('.btn-preview--imprimir, #btn-imprimir-ficha, #btn-imprimir-catalogo-pdf').forEach(btn => {
            btn.addEventListener('click', () => window.print());
        });

        // Impresión automática con parámetro print=1
        if (params.get('print') === '1') {
            setTimeout(() => window.print(), 350);
        }
    }

    static configurarBuscador(productos, insumos) {
        const inputBuscar = document.getElementById('input-buscar-ficha');
        if (!inputBuscar) return;

        inputBuscar.addEventListener('input', (e) => {
            const query = (e.target.value || '').trim().toLowerCase();
            this.renderizarCatalogo(productos, insumos, query);
        });
    }

    static renderizarCatalogo(productos, insumos, filtro = '') {
        const grid = document.getElementById('galeria-fichas-grid') || document.getElementById('fichas-catalogo-grid');
        const badgeCount = document.getElementById('catalogo-fichas-count');
        if (!grid) return;

        const fmt = (val) => (typeof Store !== 'undefined' && typeof Store.fmt === 'function') 
            ? Store.fmt(val) 
            : `$ ${Math.round(val).toLocaleString('es-CO')}`;

        const filtrados = productos.filter(p => {
            if (!filtro) return true;
            const cod = `rec-${String(p.id).padStart(3, '0')}`.toLowerCase();
            const nom = (p.nombre || '').toLowerCase();
            return nom.includes(filtro) || cod.includes(filtro);
        });

        if (badgeCount) {
            badgeCount.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'ficha activa' : 'fichas activas'}`;
        }

        if (filtrados.length === 0) {
            grid.innerHTML = `
                <div class="catalogo-fichas-vacio" style="grid-column: 1 / -1;">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <h3>No se encontraron fichas técnicas</h3>
                    <p>No hay recetas que coincidan con "${Store.escapeHtml(filtro)}".</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filtrados.map(p => {
            const costoUd = p.calcularCostoUnidad(insumos);
            const precioVenta = p.calcularPrecioVenta(insumos);
            const gananciaUd = p.calcularGananciaNeta(insumos);
            const precioDelivery = (typeof AsesorFinanzas !== 'undefined' && typeof AsesorFinanzas.calcularPrecioAppDelivery === 'function')
                ? AsesorFinanzas.calcularPrecioAppDelivery(precioVenta, 25)
                : Math.round(precioVenta / 0.75);

            const modoLabel = p.modo === 'margen'
                ? `Margen ${p.valorModo}%`
                : `×${p.valorModo} costo`;

            const cantInsumos = p.receta ? p.receta.length : 0;
            const uds = Math.max(1, p.unidadesProducidas || 1);

            return `
                <article class="ficha-card" data-id="${p.id}">
                    <div>
                        <div class="ficha-card__top">
                            <span class="ficha-card__codigo">REC-${String(p.id).padStart(3, '0')}</span>
                            <span class="ficha-card__badge-modo">${Store.escapeHtml(modoLabel)}</span>
                        </div>
                        <h2 class="ficha-card__titulo">${Store.escapeHtml(p.nombre)}</h2>
                        <p class="ficha-card__subtitulo">${cantInsumos} insumos registrados · Rinde ${uds} ${uds === 1 ? 'unidad' : 'unidades'}</p>
                        
                        <div class="ficha-card__specs">
                            <div class="ficha-card__spec-item">
                                <small>Costo unitario</small>
                                <strong class="valor-ambar">${fmt(costoUd)}</strong>
                            </div>
                            <div class="ficha-card__spec-item">
                                <small>Precio mostrador</small>
                                <strong class="valor-esmeralda">${fmt(precioVenta)}</strong>
                            </div>
                            <div class="ficha-card__spec-item">
                                <small>Ganancia neta</small>
                                <strong class="valor-esmeralda">+${fmt(gananciaUd)}</strong>
                            </div>
                            <div class="ficha-card__spec-item">
                                <small>Delivery (Apps 25%)</small>
                                <strong>${fmt(precioDelivery)}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="ficha-card__footer">
                        <div class="ficha-card__delivery-hint">
                            Lote: <strong>${uds} uds</strong>
                        </div>
                        <a href="ficha-preview.html?id=${p.id}" class="btn-abrir-ficha" title="Ver ficha técnica completa">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            <span>Ver Ficha Técnica</span>
                        </a>
                    </div>
                </article>
            `;
        }).join('');
    }

    static renderizarSelector(productos, activoId) {
        const select = document.getElementById('select-ficha-producto');
        if (!select) return;

        select.innerHTML = productos.map(p => {
            const sel = p.id === activoId ? 'selected' : '';
            return `<option value="${p.id}" ${sel}>${Store.escapeHtml(p.nombre)} (REC-${String(p.id).padStart(3, '0')})</option>`;
        }).join('');

        select.addEventListener('change', (e) => {
            const id = Number(e.target.value);
            if (id) {
                this.cargarFicha(id);
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', `?id=${id}`);
                }
            }
        });
    }

    static cargarFicha(prodId) {
        const productos = typeof Store !== 'undefined' && typeof Store.cargarProductos === 'function' ? Store.cargarProductos() : [];
        const insumos   = typeof Store !== 'undefined' && typeof Store.cargarInsumos === 'function' ? Store.cargarInsumos() : [];
        const gastos    = (typeof Store !== 'undefined' && (typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : (typeof Store.cargarConfigGastos === 'function' ? Store.cargarConfigGastos() : {}))) || {};
        const negocio   = (typeof Store !== 'undefined' && (typeof Store.obtenerNegocio === 'function' ? Store.obtenerNegocio() : (typeof Store.cargarNegocio === 'function' ? Store.cargarNegocio() : 'Costia Negocio'))) || 'Costia Negocio';

        const prod = productos.find(p => p.id === prodId);
        if (!prod) return;

        const setElTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const fmt = (val) => (typeof Store !== 'undefined' && typeof Store.fmt === 'function') 
            ? Store.fmt(val) 
            : `$ ${Math.round(val).toLocaleString('es-CO')}`;

        // 1. Encabezado institucional
        setElTxt('ficha-negocio-nombre', negocio);
        setElTxt('ficha-codigo', `REC-${String(prod.id).padStart(3, '0')}`);
        setElTxt('ficha-fecha', new Date().toLocaleDateString('es-CO'));
        setElTxt('ficha-prod-nombre', prod.nombre);
        setElTxt('barra-subtitulo', `${prod.nombre} (${negocio})`);

        // 2. Cálculos del modelo
        const costoUnidad  = prod.calcularCostoUnidad(insumos);
        const precioVenta  = prod.calcularPrecioVenta(insumos);
        const gananciaUd   = prod.calcularGananciaNeta(insumos);
        const mermaCosto   = prod.calcularCostoMerma(insumos);
        const uds          = Math.max(1, prod.unidadesProducidas || 1);

        const precioDelivery = (typeof AsesorFinanzas !== 'undefined' && typeof AsesorFinanzas.calcularPrecioAppDelivery === 'function')
            ? AsesorFinanzas.calcularPrecioAppDelivery(precioVenta, 25)
            : Math.round(precioVenta / 0.75);

        setElTxt('ficha-precio-venta', `${fmt(precioVenta)} / ud`);
        setElTxt('ficha-precio-delivery-header', `${fmt(precioDelivery)} / ud`);
        setElTxt('ficha-unidades', `${uds} ${uds === 1 ? 'unidad' : 'unidades'}`);
        setElTxt('ficha-merma-pct', `${prod.porcentajeMerma || 0}%`);
        setElTxt('ficha-empaque-costo', fmt(prod.costoEmpaque || 0));

        const modoLabel = prod.modo === 'margen'
            ? `Margen ${prod.valorModo}% (${prod.tipoMargen === 'venta' ? 's/venta' : 's/costo'})`
            : `×${prod.valorModo} costo`;
        setElTxt('ficha-modo-label', modoLabel);

        // 3. Tabla de ingredientes del lote
        const tbody = document.getElementById('ficha-tbody-ingredientes');
        let subtotalLote = 0;

        if (tbody) {
            if (prod.receta && prod.receta.length > 0) {
                tbody.innerHTML = prod.receta.map(linea => {
                    const ins = insumos.find(i => i.id === linea.insumoId);
                    if (!ins) {
                        return `<tr><td>Insumo no encontrado</td><td class="col-num">${linea.cantidad}</td><td>${linea.unidadReceta}</td><td class="col-num">—</td><td class="col-num">—</td></tr>`;
                    }
                    const { costo } = linea.calcularCosto(ins);
                    subtotalLote += costo;
                    return `
                        <tr>
                            <td>${Store.escapeHtml(ins.nombre)}</td>
                            <td class="col-num">${linea.cantidad}</td>
                            <td>${Store.escapeHtml(linea.unidadReceta)}</td>
                            <td class="col-num">${fmt(ins.precio)} / ${Store.escapeHtml(ins.unidad)}</td>
                            <td class="col-num"><strong>${fmt(costo)}</strong></td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Sin ingredientes registrados.</td></tr>`;
            }
        }

        setElTxt('ficha-tfoot-label', `Subtotal Materias Primas del Lote (${uds} uds)`);
        setElTxt('ficha-subtotal-insumos', fmt(subtotalLote));

        // 4. Desglose de costos unitarios
        const costoInsumosUd = subtotalLote / uds;
        const mermaUd = mermaCosto / uds;
        const empaqueUd = prod.costoEmpaque || 0;
        const manoObraUd = (prod.costoManoObra || 0) / uds;

        setElTxt('ficha-desg-insumos', fmt(costoInsumosUd));
        setElTxt('ficha-desg-merma', `+${fmt(mermaUd)}`);
        setElTxt('ficha-desg-empaque', `+${fmt(empaqueUd)}`);
        setElTxt('ficha-desg-fijos', `+${fmt(manoObraUd)}`);
        setElTxt('ficha-desg-costo-total', fmt(costoUnidad));

        setElTxt('ficha-desg-costo-base', fmt(costoUnidad));
        setElTxt('ficha-desg-margen-pct', modoLabel);
        setElTxt('ficha-desg-ganancia-ud', `+${fmt(gananciaUd)}`);
        setElTxt('ficha-desg-ganancia-lote', fmt(gananciaUd * uds));
        setElTxt('ficha-desg-precio-final', fmt(precioVenta));
        setElTxt('ficha-desg-precio-delivery', fmt(precioDelivery));

        // 5. Break-Even
        const nominaTotal = Number(gastos.nominaMensualTotal) || ((Number(gastos.numTrabajadores) || 0) * (Number(gastos.salarioTrabajador) || 0));
        const fijosTotal = (Number(gastos.arriendoMensual) || 0) + (Number(gastos.recibosMensuales) || 0) + nominaTotal;
        const elBE = document.getElementById('ficha-break-even-texto');

        if (elBE) {
            if (fijosTotal > 0 && gananciaUd > 0) {
                const unidadesBE = Math.ceil(fijosTotal / gananciaUd);
                const diasMes = 30;
                const unidadesDia = (unidadesBE / diasMes).toFixed(1);
                const trabLabel = (gastos.numTrabajadores || 0) > 0 ? ` (${gastos.numTrabajadores} trabajadores + arriendo y servicios)` : '';
                elBE.innerHTML = `
                    Para cubrir tus gastos fijos mensuales y nómina${trabLabel} (${fmt(fijosTotal)}/mes) exclusivamente con este producto, requieres vender mínimo <strong>${unidadesBE} unidades al mes</strong> (aprox. <strong>${unidadesDia} unidades/día</strong>). A partir de la unidad ${unidadesBE + 1}, todo ingreso es beneficio líquido.
                `;
            } else if (gananciaUd <= 0) {
                elBE.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="vertical-align:-2px;margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> <strong>Atención:</strong> El precio actual no genera ganancia neta positiva. Ajusta el margen de venta para calcular el punto de equilibrio operativo.
                `;
            } else {
                elBE.innerHTML = `
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="vertical-align:-2px;margin-right:4px;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> <strong>Sin costos fijos de arriendo registrados:</strong> Estás produciendo desde casa o sin costos fijos declarados. Cada venta aporta directamente a tu beneficio neto desde la primera unidad.
                `;
            }
        }
    }

    static renderizarCatalogoCompletoPdf(productos, insumos) {
        const contenedor = document.getElementById('catalogo-imprimible-completo');
        if (!contenedor) return;

        const negocio = (typeof Store !== 'undefined' && (typeof Store.obtenerNegocio === 'function' ? Store.obtenerNegocio() : (typeof Store.cargarNegocio === 'function' ? Store.cargarNegocio() : 'Costia Negocio'))) || 'Costia Negocio';
        const fmt = (val) => (typeof Store !== 'undefined' && typeof Store.fmt === 'function') 
            ? Store.fmt(val) 
            : `$ ${Math.round(val).toLocaleString('es-CO')}`;
        const fecha = new Date().toLocaleDateString('es-CO');

        const subtitulo = document.getElementById('barra-catalogo-subtitulo');
        if (subtitulo) {
            subtitulo.textContent = `${productos.length} productos registrados · ${negocio} · Listo para guardar como PDF`;
        }

        if (!productos || productos.length === 0) {
            contenedor.innerHTML = `
                <div class="catalogo-fichas-vacio" style="padding: 40px 20px; text-align: center;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <h3 style="margin-top: 12px;">No hay productos para exportar</h3>
                    <p style="color: var(--gris-texto); font-size: 13px;">Registra tus primeras recetas en el sistema para generar el catálogo consolidado en PDF.</p>
                </div>
            `;
            return;
        }

        // 1. Encabezado institucional maestro
        let html = `
            <header class="ficha-header">
                <div class="ficha-marca">
                    <img src="../assets/img/costia-icon-green.png" alt="Costia">
                    <div>
                        <h1 class="ficha-marca__titulo">Catálogo Oficial de Productos &amp; Recetas</h1>
                        <div class="ficha-marca__negocio">${Store.escapeHtml(negocio)}</div>
                    </div>
                </div>
                <div class="ficha-meta">
                    <span class="ficha-badge-codigo">CATÁLOGO MAESTRO</span><br>
                    <span>Fecha: <strong>${fecha}</strong></span><br>
                    <span>Portafolio: <strong>${productos.length} ${productos.length === 1 ? 'producto activo' : 'productos activos'}</strong></span><br>
                    <span>Estado: <strong class="ficha-estado-vigente">Vigente</strong></span>
                </div>
            </header>

            <div class="catalogo-pdf-intro">
                <span><strong>Consolidado Oficial de Costeo y Pricing</strong> · Portabilidad y Fichas Técnicas</span>
                <span>${fecha}</span>
            </div>

            <!-- 2. Tabla Resumen Ejecutivo de Portafolio -->
            <h2 class="seccion-titulo" style="margin-top: 20px;">01. Resumen Ejecutivo del Portafolio</h2>
            <table class="catalogo-pdf-tabla-resumen">
                <thead>
                    <tr>
                        <th style="width: 12%;">Código</th>
                        <th style="width: 28%;">Receta / Producto</th>
                        <th style="width: 10%; text-align: center;">Rinde</th>
                        <th class="col-num" style="width: 15%;">Costo Unit.</th>
                        <th style="width: 12%; text-align: center;">Margen</th>
                        <th class="col-num" style="width: 15%;">Precio Venta</th>
                        <th class="col-num" style="width: 15%;">Ganancia/ud</th>
                    </tr>
                </thead>
                <tbody>
        `;

        productos.forEach(p => {
            const costoUd = p.calcularCostoUnidad(insumos);
            const precioVenta = p.calcularPrecioVenta(insumos);
            const gananciaUd = p.calcularGananciaNeta(insumos);
            const uds = Math.max(1, p.unidadesProducidas || 1);
            const modoLabel = p.modo === 'margen' ? `${p.valorModo}%` : `×${p.valorModo}`;

            html += `
                <tr>
                    <td><strong class="ficha-card__codigo">REC-${String(p.id).padStart(3, '0')}</strong></td>
                    <td><strong>${Store.escapeHtml(p.nombre)}</strong></td>
                    <td style="text-align: center;">${uds} ${uds === 1 ? 'ud' : 'uds'}</td>
                    <td class="col-num">${fmt(costoUd)}</td>
                    <td style="text-align: center;"><span class="ficha-card__badge-modo">${Store.escapeHtml(modoLabel)}</span></td>
                    <td class="col-num"><strong style="color: var(--esmeralda);">${fmt(precioVenta)}</strong></td>
                    <td class="col-num"><strong style="color: var(--esmeralda);">+${fmt(gananciaUd)}</strong></td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>

            <!-- 3. Desglose detallado por cada producto -->
            <h2 class="seccion-titulo" style="margin-top: 30px;">02. Escandallos Técnicos y Estructura de Recetas</h2>
        `;

        productos.forEach(p => {
            const costoUd = p.calcularCostoUnidad(insumos);
            const precioVenta = p.calcularPrecioVenta(insumos);
            const gananciaUd = p.calcularGananciaNeta(insumos);
            const mermaCosto = p.calcularCostoMerma(insumos);
            const uds = Math.max(1, p.unidadesProducidas || 1);
            const precioDelivery = (typeof AsesorFinanzas !== 'undefined' && typeof AsesorFinanzas.calcularPrecioAppDelivery === 'function')
                ? AsesorFinanzas.calcularPrecioAppDelivery(precioVenta, 25)
                : Math.round(precioVenta / 0.75);

            const modoLabel = p.modo === 'margen'
                ? `Margen ${p.valorModo}% (${p.tipoMargen === 'venta' ? 's/venta' : 's/costo'})`
                : `×${p.valorModo} costo`;

            let subtotalLote = 0;
            let filasIngredientes = '';

            if (p.receta && p.receta.length > 0) {
                filasIngredientes = p.receta.map(linea => {
                    const ins = insumos.find(i => i.id === linea.insumoId);
                    if (!ins) {
                        return `<tr><td>Insumo no encontrado</td><td class="col-num">${linea.cantidad}</td><td>${linea.unidadReceta}</td><td class="col-num">—</td><td class="col-num">—</td></tr>`;
                    }
                    const { costo } = linea.calcularCosto(ins);
                    subtotalLote += costo;
                    return `
                        <tr>
                            <td>${Store.escapeHtml(ins.nombre)}</td>
                            <td class="col-num">${linea.cantidad}</td>
                            <td>${Store.escapeHtml(linea.unidadReceta)}</td>
                            <td class="col-num">${fmt(ins.precio)} / ${Store.escapeHtml(ins.unidad)}</td>
                            <td class="col-num"><strong>${fmt(costo)}</strong></td>
                        </tr>
                    `;
                }).join('');
            } else {
                filasIngredientes = `<tr><td colspan="5" style="text-align: center; color: var(--gris-texto);">Sin ingredientes registrados.</td></tr>`;
            }

            const costoInsumosUd = subtotalLote / uds;
            const mermaUd = mermaCosto / uds;
            const empaqueUd = p.costoEmpaque || 0;
            const manoObraUd = (p.costoManoObra || 0) / uds;

            html += `
                <section class="catalogo-pdf-card" aria-label="Ficha de ${Store.escapeHtml(p.nombre)}">
                    <div class="catalogo-pdf-card__header">
                        <div>
                            <span class="ficha-card__codigo">REC-${String(p.id).padStart(3, '0')}</span>
                            <h3 class="catalogo-pdf-card__nombre">${Store.escapeHtml(p.nombre)}</h3>
                            <div class="catalogo-pdf-card__meta">
                                <span>Rendimiento: <strong>${uds} ${uds === 1 ? 'unidad' : 'unidades'}</strong></span>
                                <span>Merma: <strong>${p.porcentajeMerma || 0}%</strong></span>
                                <span>Empaque/ud: <strong>${fmt(empaqueUd)}</strong></span>
                                <span>Fórmula: <strong>${Store.escapeHtml(modoLabel)}</strong></span>
                            </div>
                        </div>
                        <div class="catalogo-pdf-card__precios">
                            <div class="catalogo-pdf-card__precio-mostrador">${fmt(precioVenta)} / ud</div>
                            <div class="catalogo-pdf-card__precio-delivery">Delivery Apps (25%): <strong>${fmt(precioDelivery)}</strong></div>
                        </div>
                    </div>

                    <div class="catalogo-pdf-kpis-mini">
                        <div class="catalogo-pdf-kpi-item">
                            <small>Subtotal Insumos Lote</small>
                            <strong>${fmt(subtotalLote)}</strong>
                        </div>
                        <div class="catalogo-pdf-kpi-item">
                            <small>Costo Unitario Real</small>
                            <strong style="color: var(--ambar);">${fmt(costoUd)}</strong>
                        </div>
                        <div class="catalogo-pdf-kpi-item">
                            <small>Ganancia Neta / ud</small>
                            <strong style="color: var(--esmeralda);">+${fmt(gananciaUd)}</strong>
                        </div>
                        <div class="catalogo-pdf-kpi-item">
                            <small>Ganancia del Lote</small>
                            <strong style="color: var(--esmeralda);">${fmt(gananciaUd * uds)}</strong>
                        </div>
                    </div>

                    <table class="ficha-tabla" style="margin-bottom: 12px;">
                        <thead>
                            <tr>
                                <th style="width: 38%;">Ingrediente</th>
                                <th class="col-num" style="width: 14%;">Cantidad</th>
                                <th style="width: 12%;">Unidad</th>
                                <th class="col-num" style="width: 18%;">Costo Unit.</th>
                                <th class="col-num" style="width: 18%;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filasIngredientes}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4">Subtotal Materias Primas del Lote (${uds} uds)</td>
                                <td class="col-num">${fmt(subtotalLote)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="display: flex; gap: 16px; font-size: 11.5px; color: var(--gris-texto); background: #FAFDFB; padding: 6px 12px; border-radius: 6px;">
                        <span>Insumos/ud: <strong>${fmt(costoInsumosUd)}</strong></span>
                        <span>Merma/ud: <strong>+${fmt(mermaUd)}</strong></span>
                        <span>Empaque/ud: <strong>+${fmt(empaqueUd)}</strong></span>
                        <span>Gastos operativos/ud: <strong>+${fmt(manoObraUd)}</strong></span>
                    </div>
                </section>
            `;
        });

        // 4. Pie de página institucional del catálogo maestro
        html += `
            <footer class="ficha-footer" style="margin-top: 32px;">
                <span>Generado con precisión por <strong>Costia</strong> · Inteligencia Financiera Gastronómica</span>
                <span>Catálogo Maestro Oficial · ${Store.escapeHtml(negocio)} · Total: ${productos.length} recetas</span>
            </footer>
        `;

        contenedor.innerHTML = html;
    }
}

if (typeof window !== 'undefined') {
    window.FichaTecnicaControlador = FichaTecnicaControlador;
    document.addEventListener('DOMContentLoaded', () => {
        FichaTecnicaControlador.inicializar();
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FichaTecnicaControlador;
}
