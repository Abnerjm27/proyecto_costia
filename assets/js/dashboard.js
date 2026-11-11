/**
 * dashboard.js — Controlador de Dashboard Financiero & Simulador de Pricing (POO)
 * 
 * Funcionalidad:
 * - Selección reactiva de receta en lista desplegable.
 * - OrderBook de Insumos con variaciones de precios y peso porcentual.
 * - Curva de Sensibilidad interactiva (Margen % vs. Precio COP) Mostrador/Delivery.
 * - Consola de Pricing en tiempo real con paradas de margen y desglose de costos.
 * - Cero emojis en interfaz (únicamente iconos vectoriales SVG).
 * - Estricto cumplimiento de límite < 1.100 líneas.
 */

class DashboardWorkstationController {
    constructor() {
        this.productoActivoId = null;
        this.canalActivo = 'mostrador'; // 'mostrador' | 'delivery'
        this.margenObjetivo = 55; // 25, 35, 45, 55, 65 %
        this.curvaCanal = 'mostrador';
    }

    iniciar() {
        // Soporte para preselección de producto vía query param (?id=...)
        const urlParams = new URLSearchParams(window.location.search);
        const paramId = Number(urlParams.get('id'));
        if (paramId) {
            this.productoActivoId = paramId;
        }

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
        // Selector desplegable de producto activo en el encabezado
        const selectProducto = document.getElementById('select-producto-activo');
        selectProducto?.addEventListener('change', (e) => {
            const id = Number(e.target.value);
            if (id) {
                this.seleccionarProductoActivo(id);
            }
        });

        // Buscador rápido al lado del selector para filtrar recetas
        const inputBuscarProd = document.getElementById('buscar-producto-dashboard');
        inputBuscarProd?.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            this.filtrarSelectorProductos(query);
        });

        inputBuscarProd?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const select = document.getElementById('select-producto-activo');
                if (select && select.options.length > 0 && select.options[0].value) {
                    const primerVal = Number(select.options[0].value);
                    select.value = String(primerVal);
                    this.seleccionarProductoActivo(primerVal);
                    inputBuscarProd.blur();
                }
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

        // Botón de aplicación de precio a la receta
        const btnEjecutar = document.getElementById('btn-ejecutar-orden');
        btnEjecutar?.addEventListener('click', () => {
            this.aplicarPrecioReceta();
        });

        // Botones de canal en la Curva de Sensibilidad
        document.querySelectorAll('.chart-interval-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chart-interval-btn').forEach((b) => b.classList.remove('activo'));
                btn.classList.add('activo');
                this.curvaCanal = btn.dataset.curveChannel || 'mostrador';
                this.renderizarCurva();
            });
        });
    }

    actualizarVista() {
        const insumos = Store.cargarInsumos();
        const productos = Store.cargarProductos();

        if (productos.length > 0) {
            const existe = productos.some((p) => p.id === this.productoActivoId);
            if (!existe) {
                this.productoActivoId = productos[0].id;
            }
        } else {
            this.productoActivoId = null;
        }

        const inputBuscar = document.getElementById('buscar-producto-dashboard');
        const query = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';
        if (query) {
            this.filtrarSelectorProductos(query);
        } else {
            this.actualizarSelectorProductos(productos);
        }

        this.actualizarTicker(productos, insumos);
        this.actualizarOrderBook(productos, insumos);
        this.renderizarCurva(productos, insumos);
        this.actualizarConsolaPricing(productos, insumos);
    }

    actualizarSelectorProductos(productos) {
        const select = document.getElementById('select-producto-activo');
        if (!select) return;

        if (productos.length === 0) {
            select.innerHTML = '<option value="">Sin productos registrados</option>';
            return;
        }

        select.innerHTML = productos.map((p) => {
            const selected = p.id === this.productoActivoId ? 'selected' : '';
            return `<option value="${p.id}" ${selected}>${Store.escapeHtml(p.nombre)}</option>`;
        }).join('');
    }

    filtrarSelectorProductos(query) {
        const select = document.getElementById('select-producto-activo');
        if (!select) return;
        const productos = Store.cargarProductos();
        const filtrados = query
            ? productos.filter(p => p.nombre.toLowerCase().includes(query))
            : productos;
        if (filtrados.length === 0) {
            select.innerHTML = '<option value="">Sin coincidencias</option>';
            return;
        }
        select.innerHTML = filtrados.map((p) => {
            const selected = p.id === this.productoActivoId ? 'selected' : '';
            return `<option value="${p.id}" ${selected}>${Store.escapeHtml(p.nombre)}</option>`;
        }).join('');
        const coincide = filtrados.some(p => p.id === this.productoActivoId);
        if (!coincide && filtrados.length > 0) {
            this.seleccionarProductoActivo(filtrados[0].id);
        }
    }

    seleccionarProductoActivo(id) {
        this.productoActivoId = id;
        const productos = Store.cargarProductos();
        const insumos = Store.cargarInsumos();

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
                elAlerta.textContent = 'Alza Insumos';
                elAlerta.className = 'ticker-badge-alert';
            } else if (cambio.estado === 'baja') {
                elAlerta.textContent = 'Baja Insumos';
                elAlerta.className = 'ticker-badge-gain';
            } else {
                elAlerta.textContent = 'Costos Estables';
                elAlerta.className = 'ticker-badge-ok';
            }
        }
    }

    actualizarOrderBook(productos, insumos) {
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        const body = document.getElementById('lista-insumos-body');
        const contador = document.getElementById('orderbook-insumos-count');
        const elSpread = document.getElementById('orderbook-spread-val');
        const elTarget = document.getElementById('spread-target-label');
        const elSensiDesc = document.getElementById('orderbook-sensi-desc');

        if (!body) return;

        if (!producto || !producto.receta || producto.receta.length === 0) {
            body.innerHTML = `<tr><td colspan="4" class="orderbook-empty">No hay insumos registrados en esta receta.</td></tr>`;
            if (contador) contador.textContent = '0 insumos';
            if (elSpread) elSpread.textContent = '+0.0%';
            return;
        }

        const receta = producto.receta;
        if (contador) contador.textContent = `${receta.length} ${receta.length === 1 ? 'insumo' : 'insumos'}`;

        const costoTotalReceta = producto.calcularCostoTotal(insumos);
        let insumoMayorAlza = null;
        let maxAlzaPct = 0;

        const filas = receta.map((linea) => {
            const ins = insumos.find((i) => i.id === linea.insumoId);
            if (!ins) {
                return `<tr><td colspan="4" class="orderbook-empty">Insumo eliminado</td></tr>`;
            }
            const { costo } = linea.calcularCosto(ins);
            const pesoPct = costoTotalReceta > 0 ? ((costo / costoTotalReceta) * 100).toFixed(1) : '0.0';

            const precioActual = Number(ins.precio) || 0;
            const precioAnterior = Number(ins.precioAnterior) || precioActual;
            const varPct = precioAnterior > 0 ? (((precioActual - precioAnterior) / precioAnterior) * 100).toFixed(1) : '0.0';
            const numVar = parseFloat(varPct);
            const claseVar = numVar > 0 ? 'var-alza' : (numVar < 0 ? 'var-baja' : 'var-cero');
            const signo = numVar > 0 ? '+' : '';

            if (numVar > maxAlzaPct) {
                maxAlzaPct = numVar;
                insumoMayorAlza = ins.nombre;
            }

            return `
                <tr>
                    <td class="col-nombre" title="${Store.escapeHtml(ins.nombre)}">
                        <span class="orderbook-insumo-name">${Store.escapeHtml(ins.nombre)}</span>
                    </td>
                    <td class="col-costo text-right tabular-nums">${Store.fmt(costo)}</td>
                    <td class="col-var text-center">
                        <span class="orderbook-pill-var ${claseVar}">${signo}${varPct}%</span>
                    </td>
                    <td class="col-peso text-right tabular-nums">${pesoPct}%</td>
                </tr>
            `;
        }).join('');

        body.innerHTML = filas;

        const costoUnidad = producto.calcularCostoUnidad(insumos);
        const precioVenta = producto.calcularPrecioVenta(insumos);
        const margenSpread = costoUnidad > 0 ? (((precioVenta - costoUnidad) / costoUnidad) * 100).toFixed(1) : '0.0';

        if (elSpread) elSpread.textContent = `+${margenSpread}%`;
        if (elTarget) elTarget.textContent = `${this.margenObjetivo}%`;

        if (elSensiDesc) {
            const cardAlerta = document.getElementById('orderbook-alert-card');
            if (insumoMayorAlza && maxAlzaPct > 0) {
                elSensiDesc.textContent = `Alza de +${maxAlzaPct.toFixed(1)}% detectada en "${insumoMayorAlza}". Ajusta el margen en la consola derecha para defender tu rentabilidad.`;
                cardAlerta?.classList.add('alerta-activa');
            } else {
                elSensiDesc.textContent = 'Costos de insumos estables en las últimas 48 horas. Sin presiones inflacionarias detectadas en la receta activa.';
                cardAlerta?.classList.remove('alerta-activa');
            }
        }
    }

    renderizarCurva(productosLista = null, insumosLista = null) {
        const canvas = document.getElementById('curva-sensibilidad-canvas');
        if (!canvas) return;

        const productos = productosLista || Store.cargarProductos();
        const insumos = insumosLista || Store.cargarInsumos();
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        if (!producto) return;

        const costoBase = producto.calcularCostoUnidad(insumos);
        const precioActual = producto.calcularPrecioVenta(insumos);

        const comision = this.curvaCanal === 'delivery' ? 0.22 : 0;
        const impoconsumo = 0.08;

        const pMin = Math.round(costoBase * 1.3);
        const pMax = Math.round(costoBase * 2.8);
        const pasos = 6;
        const puntos = [];

        for (let i = 0; i <= pasos; i++) {
            const precio = pMin + Math.round((pMax - pMin) * (i / pasos));
            const netoDespuesComision = precio * (1 - comision);
            const baseSinImpo = netoDespuesComision / (1 + impoconsumo);
            const margen = costoBase > 0 ? Math.round(((baseSinImpo - costoBase) / baseSinImpo) * 100) : 0;
            puntos.push({ precio, margen });
        }

        const width = 540;
        const height = 180;
        const padX = 45;
        const padY = 25;

        const mMin = 20;
        const mMax = 75;

        const xCoords = puntos.map((pt, idx) => padX + (idx / pasos) * (width - padX * 2));
        const yCoords = puntos.map((pt) => {
            const pct = Math.max(0, Math.min(1, (pt.margen - mMin) / (mMax - mMin)));
            return height - padY - pct * (height - padY * 2);
        });

        let pathD = `M ${xCoords[0]} ${yCoords[0]}`;
        for (let i = 1; i < puntos.length; i++) {
            pathD += ` L ${xCoords[i]} ${yCoords[i]}`;
        }

        const areaD = `${pathD} L ${xCoords[xCoords.length - 1]} ${height - padY} L ${xCoords[0]} ${height - padY} Z`;

        const targetY = height - padY - Math.max(0, Math.min(1, (this.margenObjetivo - mMin) / (mMax - mMin))) * (height - padY * 2);

        const y70 = height - padY - ((70 - mMin) / (mMax - mMin)) * (height - padY * 2);
        const y50 = height - padY - ((50 - mMin) / (mMax - mMin)) * (height - padY * 2);
        const y30 = height - padY - ((30 - mMin) / (mMax - mMin)) * (height - padY * 2);

        let svgContent = `
            <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0A6847" stop-opacity="0.30"/>
                    <stop offset="100%" stop-color="#0A6847" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            <!-- Líneas de rejilla porcentuales y etiquetas Y -->
            <line x1="${padX}" y1="${y70}" x2="${width - padX}" y2="${y70}" stroke="rgba(7,31,23,0.08)" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="${padX - 8}" y="${y70 + 3}" font-family="Azeret Mono, monospace" font-size="8" fill="#7A8B83" text-anchor="end">70%</text>

            <line x1="${padX}" y1="${y50}" x2="${width - padX}" y2="${y50}" stroke="rgba(7,31,23,0.08)" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="${padX - 8}" y="${y50 + 3}" font-family="Azeret Mono, monospace" font-size="8" fill="#7A8B83" text-anchor="end">50%</text>

            <line x1="${padX}" y1="${y30}" x2="${width - padX}" y2="${y30}" stroke="rgba(7,31,23,0.08)" stroke-width="1" stroke-dasharray="3,3"/>
            <text x="${padX - 8}" y="${y30 + 3}" font-family="Azeret Mono, monospace" font-size="8" fill="#7A8B83" text-anchor="end">30%</text>

            <!-- Eje base horizontal -->
            <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="rgba(7,31,23,0.18)" stroke-width="1"/>

            <!-- Línea de margen objetivo (Target) -->
            <line x1="${padX}" y1="${targetY}" x2="${width - padX}" y2="${targetY}" stroke="#0A6847" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.75"/>
            <text x="${width - padX}" y="${targetY - 5}" font-family="Azeret Mono, monospace" font-size="8.5" fill="#0A6847" text-anchor="end" font-weight="700">Target ${this.margenObjetivo}%</text>

            <!-- Área sombreada y curva paramétrica -->
            <path d="${areaD}" fill="url(#areaGradient)"/>
            <path d="${pathD}" fill="none" stroke="#0A6847" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        `;

        puntos.forEach((pt, i) => {
            const x = xCoords[i];
            const y = yCoords[i];
            const esCercano = Math.abs(pt.precio - precioActual) < (pMax - pMin) / (pasos * 1.5);
            svgContent += `
                <circle cx="${x}" cy="${y}" r="${esCercano ? 5 : 3.5}" fill="${esCercano ? '#0A6847' : '#FFFFFF'}" stroke="#0A6847" stroke-width="2"/>
                <text x="${x}" y="${height - 6}" font-family="Azeret Mono, monospace" font-size="8.5" fill="#526059" text-anchor="middle">$${Store.fmt(pt.precio).replace('$', '')}</text>
            `;
        });

        const svgCompleto = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="chart-svg-display" width="100%" height="180" preserveAspectRatio="none" style="display:block;overflow:visible;">
                ${svgContent}
            </svg>
        `;

        canvas.innerHTML = svgCompleto;
    }

    obtenerCuotaGastosFijosUnidad(producto, costoDirecto) {
        if (producto && producto.costoManoObra > 0) {
            return Math.round(producto.costoManoObra / Math.max(1, producto.unidadesProducidas || 1));
        }
        const cfg = typeof Store !== 'undefined' && typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : null;
        if (cfg && cfg.cuotaFijaTotalPorLote) {
            const unidades = Math.max(1, producto?.unidadesProducidas || 1);
            if (unidades === 1) {
                return Math.round(cfg.cuotaFijaTotalPorLote / 10);
            }
            return Math.round(cfg.cuotaFijaTotalPorLote / unidades);
        }
        return Math.round(costoDirecto * 0.12);
    }

    actualizarConsolaPricing(productosLista = null, insumosLista = null) {
        const productos = productosLista || Store.cargarProductos();
        const insumos = insumosLista || Store.cargarInsumos();
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        if (!producto) return;

        const nombre = document.getElementById('pricing-receta-nombre');
        const codigo = document.getElementById('pricing-receta-codigo');
        const elCostoDir = document.getElementById('calc-costo-directo');
        const elGastosFijos = document.getElementById('calc-gastos-fijos');
        const elComision = document.getElementById('calc-comision-canal');
        const elImpo = document.getElementById('calc-impoconsumo');
        const elPrecioSugerido = document.getElementById('calc-precio-sugerido');
        const elGananciaNeta = document.getElementById('calc-ganancia-neta');

        if (nombre) nombre.textContent = producto.nombre;
        if (codigo) codigo.textContent = this.obtenerCodigoProducto(producto);

        const unidades = Math.max(1, producto.unidadesProducidas || 1);
        const costoDirecto = Math.round(
            (producto.calcularCostoIngredientes(insumos) +
             producto.calcularCostoMerma(insumos) +
             (producto.costoEmpaque * unidades)) / unidades
        );
        const gastosFijosCuota = this.obtenerCuotaGastosFijosUnidad(producto, costoDirecto);
        const costoBaseTotal = costoDirecto + gastosFijosCuota;

        const margenDecimal = this.margenObjetivo / 100;
        const precioSinComision = margenDecimal < 1 ? Math.round(costoBaseTotal / (1 - margenDecimal)) : costoBaseTotal * 2;

        const tasaComision = this.canalActivo === 'delivery' ? 0.22 : 0;
        const precioConCanal = Math.round(precioSinComision / (1 - tasaComision));

        const tasaImpo = 0.08;
        const impoconsumoValor = Math.round(precioConCanal * tasaImpo);
        const precioSugeridoFinal = precioConCanal + impoconsumoValor;

        const comisionValor = Math.round(precioConCanal * tasaComision);
        const ingresoNetoNegocio = precioSugeridoFinal - impoconsumoValor - comisionValor;
        const gananciaNetaUnidad = ingresoNetoNegocio - costoDirecto - gastosFijosCuota;

        if (elCostoDir) elCostoDir.textContent = Store.fmt(costoDirecto);
        if (elGastosFijos) elGastosFijos.textContent = Store.fmt(gastosFijosCuota);
        if (elComision) elComision.textContent = `${Store.fmt(comisionValor)} (${Math.round(tasaComision * 100)}%)`;
        if (elImpo) elImpo.textContent = `${Store.fmt(impoconsumoValor)} (8%)`;
        if (elPrecioSugerido) elPrecioSugerido.textContent = Store.fmt(precioSugeridoFinal);
        if (elGananciaNeta) elGananciaNeta.textContent = `+${Store.fmt(gananciaNetaUnidad)}`;
    }

    aplicarPrecioReceta() {
        const productos = Store.cargarProductos();
        const insumos = Store.cargarInsumos();
        const producto = productos.find((p) => p.id === this.productoActivoId);
        if (!producto) return;

        const unidades = Math.max(1, producto.unidadesProducidas || 1);
        const costoDirecto = Math.round(
            (producto.calcularCostoIngredientes(insumos) +
             producto.calcularCostoMerma(insumos) +
             (producto.costoEmpaque * unidades)) / unidades
        );
        const gastosFijosCuota = this.obtenerCuotaGastosFijosUnidad(producto, costoDirecto);
        const costoBaseTotal = costoDirecto + gastosFijosCuota;
        const margenDecimal = this.margenObjetivo / 100;
        const precioSinComision = margenDecimal < 1 ? Math.round(costoBaseTotal / (1 - margenDecimal)) : costoBaseTotal * 2;
        const tasaComision = this.canalActivo === 'delivery' ? 0.22 : 0;
        const precioConCanal = Math.round(precioSinComision / (1 - tasaComision));
        const impoconsumoValor = Math.round(precioConCanal * 0.08);
        const precioFinal = precioConCanal + impoconsumoValor;

        producto.modo = 'margen';
        producto.valorModo = this.margenObjetivo;
        producto.precioVentaManual = precioFinal;

        Store.guardarProducto(producto);

        const btn = document.getElementById('btn-ejecutar-orden');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>¡Precio aplicado exitosamente!</span>
            `;
            btn.style.backgroundColor = '#071F17';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.backgroundColor = '';
            }, 2500);
        }

        this.actualizarVista();
    }
}

// Inicialización de la estación
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardController = new DashboardWorkstationController();
    window.dashboardController.iniciar();
});
