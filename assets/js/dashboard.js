/**
 * dashboard.js — Controlador de Inicio y Simulador de Precios (Costia)
 *
 * Responsabilidades:
 * - Renderizar el resumen de negocio en Inicio: KPIs reales, alerta de alzas y checklist.
 * - Permitir probar márgenes, inflación de insumos y precios directos sin dañar recetas guardadas.
 * - Aplicar un precio simulado de manera persistente y coherente con Mis Recetas.
 * - Adaptar gráficos SVG a modo claro/oscuro y usar comisión de Delivery / Impoconsumo configurados.
 */

class DashboardWorkstationController {
    constructor() {
        this.productoActivoId = null;
        this.canalActivo = 'mostrador'; // 'mostrador' | 'delivery'
        this.margenObjetivo = 35;
        this.inflacionSimuladaPct = 0; // 0..30 %
        this.precioManualSimulado = null;
        this.incluirImpoconsumo = false;
    }

    iniciar() {
        const urlParams = new URLSearchParams(window.location.search);
        const paramId = Number(urlParams.get('producto') || urlParams.get('id'));
        if (paramId) {
            this.productoActivoId = paramId;
        }

        const cfg = this.obtenerConfigNegocio();
        this.incluirImpoconsumo = cfg.incluirImpoconsumo === true;
        const chkImpo = document.getElementById('toggle-impoconsumo-sim');
        if (chkImpo) chkImpo.checked = this.incluirImpoconsumo;

        this.sincronizarEtiquetasConfig();
        this.configurarEventos();
        this.actualizarVista();

        if (typeof Store !== 'undefined' && typeof Store.alActualizar === 'function') {
            Store.alActualizar(() => this.actualizarVista());
        }

        const observer = new MutationObserver(() => this.renderizarCurva());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
        }
    }

    obtenerConfigNegocio() {
        if (typeof Store !== 'undefined' && typeof Store.obtenerConfigGastos === 'function') {
            return Store.obtenerConfigGastos() || {};
        }
        return {};
    }

    sincronizarEtiquetasConfig() {
        const cfg = this.obtenerConfigNegocio();
        const deliveryPct = Number(cfg.comisionDeliveryPct ?? 25);
        const impoPct = Number(cfg.impoconsumoPct ?? 8);

        const setEl = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(val);
        };
        setEl('chart-delivery-pct-label', deliveryPct);
        setEl('legend-delivery-pct', deliveryPct);
        setEl('channel-delivery-pct', deliveryPct);
        setEl('sim-impo-pct-label', impoPct);
    }

    configurarEventos() {
        const selectProducto = document.getElementById('select-producto-activo');
        selectProducto?.addEventListener('change', (e) => {
            const id = Number(e.target.value);
            if (id) this.seleccionarProductoActivo(id);
        });

        const inputBuscarProd = document.getElementById('buscar-producto-dashboard');
        inputBuscarProd?.addEventListener('input', (e) => {
            this.filtrarSelectorProductos(e.target.value.trim().toLowerCase());
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

        document.querySelectorAll('.slider-stop-pill').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.limpiarPrecioManual(false);
                document.querySelectorAll('.slider-stop-pill').forEach((b) => b.classList.remove('activo'));
                btn.classList.add('activo');
                this.margenObjetivo = Number(btn.dataset.marginStop) || 35;
                const display = document.getElementById('calc-target-margin-display');
                if (display) display.textContent = `${this.margenObjetivo}%`;
                const spreadTarget = document.getElementById('spread-target-label');
                if (spreadTarget) spreadTarget.textContent = `${this.margenObjetivo}%`;
                this.actualizarConsolaPricing();
                this.renderizarCurva();
            });
        });

        const sliderInflacion = document.getElementById('slider-inflacion-insumos');
        sliderInflacion?.addEventListener('input', (e) => {
            this.inflacionSimuladaPct = Math.max(0, Math.min(30, Number(e.target.value) || 0));
            const label = document.getElementById('inflacion-simulada-val');
            if (label) label.textContent = this.inflacionSimuladaPct > 0 ? `+${this.inflacionSimuladaPct}%` : '0%';
            this.actualizarOrderBook();
            this.renderizarCurva();
            this.actualizarConsolaPricing();
        });

        const inputPrecioManual = document.getElementById('input-precio-manual-sim');
        inputPrecioManual?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            const btnReset = document.getElementById('btn-reset-precio-sim');
            if (!isNaN(val) && val > 0) {
                this.precioManualSimulado = val;
                if (btnReset) btnReset.style.display = 'inline-flex';
                document.querySelectorAll('.slider-stop-pill').forEach((b) => b.classList.remove('activo'));
            } else {
                this.precioManualSimulado = null;
                if (btnReset) btnReset.style.display = 'none';
                this.marcarPillMargenActivo();
            }
            this.actualizarConsolaPricing();
            this.renderizarCurva();
        });

        document.getElementById('btn-reset-precio-sim')?.addEventListener('click', () => {
            this.limpiarPrecioManual(true);
        });

        document.getElementById('toggle-impoconsumo-sim')?.addEventListener('change', (e) => {
            this.incluirImpoconsumo = e.target.checked === true;
            this.actualizarConsolaPricing();
            this.renderizarCurva();
        });

        document.getElementById('btn-dismiss-onboarding')?.addEventListener('click', () => {
            try { localStorage.setItem('costia_onboarding_dismissed', '1'); } catch (_) {}
            const checklist = document.getElementById('onboarding-checklist');
            if (checklist) checklist.hidden = true;
        });

        document.getElementById('btn-ejecutar-orden')?.addEventListener('click', () => {
            this.aplicarPrecioReceta();
        });
    }

    limpiarPrecioManual(recalcular = true) {
        this.precioManualSimulado = null;
        const input = document.getElementById('input-precio-manual-sim');
        if (input) input.value = '';
        const btnReset = document.getElementById('btn-reset-precio-sim');
        if (btnReset) btnReset.style.display = 'none';
        this.marcarPillMargenActivo();
        if (recalcular) {
            this.actualizarConsolaPricing();
            this.renderizarCurva();
        }
    }

    marcarPillMargenActivo() {
        const stops = [25, 35, 45, 55, 65];
        const cercano = stops.reduce((prev, curr) =>
            Math.abs(curr - this.margenObjetivo) < Math.abs(prev - this.margenObjetivo) ? curr : prev
        );
        document.querySelectorAll('.slider-stop-pill').forEach((b) => {
            b.classList.toggle('activo', Number(b.dataset.marginStop) === cercano && !this.precioManualSimulado);
        });
    }

    sincronizarMargenConProducto() {
        const productos = Store.cargarProductos();
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        if (producto && producto.modo === 'margen' && producto.valorModo > 0 && producto.valorModo < 90) {
            this.margenObjetivo = Math.round(producto.valorModo);
        }
        const display = document.getElementById('calc-target-margin-display');
        if (display) display.textContent = `${this.margenObjetivo}%`;
        const spreadTarget = document.getElementById('spread-target-label');
        if (spreadTarget) spreadTarget.textContent = `${this.margenObjetivo}%`;
        this.marcarPillMargenActivo();
    }

    obtenerInsumosSimulados(insumos) {
        if (!this.inflacionSimuladaPct || this.inflacionSimuladaPct <= 0) return insumos;
        const factor = 1 + (this.inflacionSimuladaPct / 100);
        return insumos.map((ins) => new Insumo({
            id: ins.id,
            nombre: ins.nombre,
            unidad: ins.unidad,
            precio: Math.round(ins.precio * factor * 100) / 100,
            precioAnterior: ins.precio
        }));
    }

    renderizarResumenNegocio(productos, insumos) {
        const elRecetas = document.getElementById('kpi-inicio-recetas');
        const elInsumos = document.getElementById('kpi-inicio-insumos');
        const elMargen = document.getElementById('kpi-inicio-margen');
        const elAlzas = document.getElementById('kpi-inicio-alzas');

        if (elRecetas) elRecetas.textContent = String(productos.length);
        if (elInsumos) elInsumos.textContent = String(insumos.length);

        let sumaMargen = 0;
        productos.forEach((p) => {
            sumaMargen += typeof p.calcularMargenComercialReal === 'function'
                ? p.calcularMargenComercialReal(insumos)
                : 0;
        });
        const promedio = productos.length > 0 ? Math.round(sumaMargen / productos.length) : 0;
        if (elMargen) elMargen.textContent = `${promedio}%`;

        const insumosAlza = insumos.filter((i) => {
            const v = typeof i.obtenerVariacion === 'function' ? i.obtenerVariacion() : null;
            return v && v.estado === 'sube';
        });
        if (elAlzas) elAlzas.textContent = String(insumosAlza.length);

        const banner = document.getElementById('dashboard-alzas-banner');
        const bannerTxt = document.getElementById('dashboard-alzas-texto');
        if (banner && bannerTxt) {
            if (insumosAlza.length > 0) {
                const nombres = insumosAlza.slice(0, 2).map((i) => i.nombre).join(', ');
                const extra = insumosAlza.length > 2 ? ` y ${insumosAlza.length - 2} más` : '';
                bannerTxt.textContent = `${insumosAlza.length} ${insumosAlza.length === 1 ? 'insumo subió' : 'insumos subieron'} de precio (${nombres}${extra}). Revisa si debes ajustar tus recetas.`;
                banner.hidden = false;
            } else {
                banner.hidden = true;
            }
        }

        const checklist = document.getElementById('onboarding-checklist');
        if (checklist) {
            let dismissed = false;
            try { dismissed = localStorage.getItem('costia_onboarding_dismissed') === '1'; } catch (_) {}

            const cfg = this.obtenerConfigNegocio();
            const tieneInsumos = insumos.length > 0;
            const tieneRecetas = productos.length > 0;
            const tieneNegocio = Boolean((cfg.arriendoMensual || 0) > 0 || (cfg.numTrabajadores || 0) > 0 || cfg.tipoUbicacion === 'casa');
            const todoCompleto = tieneInsumos && tieneRecetas && tieneNegocio;

            document.getElementById('step-check-insumos')?.classList.toggle('completado', tieneInsumos);
            document.getElementById('step-check-recetas')?.classList.toggle('completado', tieneRecetas);
            document.getElementById('step-check-negocio')?.classList.toggle('completado', tieneNegocio);

            checklist.hidden = dismissed || todoCompleto;
        }
    }

    actualizarVista() {
        const insumos = Store.cargarInsumos();
        const productos = Store.cargarProductos();
        this.sincronizarEtiquetasConfig();

        if (productos.length > 0) {
            const existe = productos.some((p) => p.id === this.productoActivoId);
            if (!existe) {
                this.productoActivoId = productos[0].id;
            }
        } else {
            this.productoActivoId = null;
        }

        this.renderizarResumenNegocio(productos, insumos);

        const inputBuscar = document.getElementById('buscar-producto-dashboard');
        const query = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';
        if (query) {
            this.filtrarSelectorProductos(query);
        } else {
            this.actualizarSelectorProductos(productos);
        }

        this.sincronizarMargenConProducto();
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
            ? productos.filter((p) => p.nombre.toLowerCase().includes(query))
            : productos;
        if (filtrados.length === 0) {
            select.innerHTML = '<option value="">Sin coincidencias</option>';
            return;
        }
        select.innerHTML = filtrados.map((p) => {
            const selected = p.id === this.productoActivoId ? 'selected' : '';
            return `<option value="${p.id}" ${selected}>${Store.escapeHtml(p.nombre)}</option>`;
        }).join('');
        const coincide = filtrados.some((p) => p.id === this.productoActivoId);
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

        this.sincronizarMargenConProducto();
        this.actualizarTicker(productos, insumos);
        this.actualizarOrderBook(productos, insumos);
        this.renderizarCurva(productos, insumos);
        this.actualizarConsolaPricing(productos, insumos);
    }

    actualizarTicker(productos, insumos) {
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        if (!producto) return;

        const costoUnidad = producto.calcularCostoUnidad(insumos);
        const precioVenta = producto.calcularPrecioVenta(insumos);
        const ganancia = producto.calcularGananciaNeta(insumos);
        const margenReal = typeof producto.calcularMargenComercialReal === 'function'
            ? producto.calcularMargenComercialReal(insumos)
            : 0;
        const cambio = producto.detectarCambioPrecio(insumos);

        const insumoConAlza = (producto.receta || []).some((r) => {
            const ins = insumos.find((i) => i.id === r.insumoId);
            const varIns = ins && typeof ins.obtenerVariacion === 'function' ? ins.obtenerVariacion() : null;
            return varIns && varIns.estado === 'sube';
        });

        const elNombre = document.getElementById('ticker-prod-nombre');
        const elCosto = document.getElementById('ticker-costo-val');
        const elMargen = document.getElementById('ticker-margen-val');
        const elPrecio = document.getElementById('ticker-precio-val');
        const elGanancia = document.getElementById('ticker-ganancia-val');
        const elAlerta = document.getElementById('ticker-alerta-badge');

        if (elNombre) elNombre.textContent = producto.nombre;
        if (elCosto) elCosto.textContent = Store.fmt(costoUnidad);
        if (elMargen) elMargen.textContent = `${margenReal}%`;
        if (elPrecio) elPrecio.textContent = Store.fmt(precioVenta);
        if (elGanancia) elGanancia.textContent = `+${Store.fmt(ganancia)}`;

        if (elAlerta) {
            if (cambio.estado === 'sube' || insumoConAlza) {
                elAlerta.textContent = 'Subió costo insumo';
                elAlerta.className = 'ticker-badge-alert';
            } else if (cambio.estado === 'baja') {
                elAlerta.textContent = 'Bajó costo insumo';
                elAlerta.className = 'ticker-badge-gain';
            } else {
                elAlerta.textContent = 'Costos estables';
                elAlerta.className = 'ticker-badge-ok';
            }
        }
    }

    actualizarOrderBook(productosLista = null, insumosLista = null) {
        const productos = productosLista || Store.cargarProductos();
        const insumosBase = insumosLista || Store.cargarInsumos();
        const insumos = this.obtenerInsumosSimulados(insumosBase);
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
            if (elSpread) elSpread.textContent = '0%';
            return;
        }

        const receta = producto.receta;
        if (contador) contador.textContent = `${receta.length} ${receta.length === 1 ? 'insumo' : 'insumos'}`;

        const costoTotalReceta = producto.calcularCostoTotal(insumos);
        const costoIngredientes = producto.calcularCostoIngredientes(insumos);
        const costoExtra = Math.max(0, costoTotalReceta - costoIngredientes);
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
        });

        if (costoExtra > 0) {
            const pesoExtraPct = costoTotalReceta > 0 ? ((costoExtra / costoTotalReceta) * 100).toFixed(1) : '0.0';
            filas.push(`
                <tr class="orderbook-extra-row">
                    <td class="col-nombre" title="Merma (${producto.porcentajeMerma}%), empaque y gastos operativos del lote">
                        <span class="orderbook-insumo-name">Merma, empaque y gastos</span>
                    </td>
                    <td class="col-costo text-right tabular-nums">${Store.fmt(costoExtra)}</td>
                    <td class="col-var text-center">
                        <span class="orderbook-pill-var var-cero">Fijo</span>
                    </td>
                    <td class="col-peso text-right tabular-nums">${pesoExtraPct}%</td>
                </tr>
            `);
        }

        body.innerHTML = filas.join('');

        const margenRealActual = typeof producto.calcularMargenComercialReal === 'function'
            ? producto.calcularMargenComercialReal(insumos)
            : 0;

        if (elSpread) elSpread.textContent = `${margenRealActual}%`;
        if (elTarget) elTarget.textContent = `${this.margenObjetivo}%`;

        if (elSensiDesc) {
            const cardAlerta = document.getElementById('orderbook-alert-card');
            if (insumoMayorAlza && maxAlzaPct > 0) {
                elSensiDesc.textContent = `Alza de +${maxAlzaPct.toFixed(1)}% detectada en "${insumoMayorAlza}". Prueba ajustar el margen o precio a la derecha.`;
                cardAlerta?.classList.add('alerta-activa');
            } else {
                elSensiDesc.textContent = 'Costos de insumos estables. Sin variaciones al alza detectadas en esta receta.';
                cardAlerta?.classList.remove('alerta-activa');
            }
        }
    }

    renderizarCurva(productosLista = null, insumosLista = null) {
        const canvas = document.getElementById('curva-sensibilidad-canvas');
        if (!canvas) return;

        const productos = productosLista || Store.cargarProductos();
        const insumosBase = insumosLista || Store.cargarInsumos();
        const insumos = this.obtenerInsumosSimulados(insumosBase);
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        if (!producto) return;

        const cfg = this.obtenerConfigNegocio();
        const deliveryPct = Number(cfg.comisionDeliveryPct ?? 25);
        const tasaDelivery = deliveryPct / 100;
        const impoconsumoPct = Number(cfg.impoconsumoPct ?? 8);
        const impoconsumo = this.incluirImpoconsumo ? (impoconsumoPct / 100) : 0;

        const { costoBaseTotal } = this.calcularCostosUnitariosSimulados(producto, insumos);
        const { costoBaseTotal: costoBaseSinInflacion } = this.calcularCostosUnitariosSimulados(producto, insumosBase);

        const pMin = Math.round(costoBaseSinInflacion * 1.25);
        const pMax = Math.round(costoBaseSinInflacion * 3.1);
        const pasos = 6;
        const puntosMostrador = [];
        const puntosDelivery = [];
        const puntosBaseSinAlza = [];

        const calcMargenParaPrecio = (precio, comision, costoRef = costoBaseTotal) => {
            if (precio <= 0) return 0;
            const netoDespuesComision = precio * (1 - comision);
            const baseSinImpo = netoDespuesComision / (1 + impoconsumo);
            return baseSinImpo > 0 ? Math.round(((baseSinImpo - costoRef) / baseSinImpo) * 100) : 0;
        };

        for (let i = 0; i <= pasos; i++) {
            const precio = pMin + Math.round((pMax - pMin) * (i / pasos));
            puntosMostrador.push({ precio, margen: calcMargenParaPrecio(precio, 0, costoBaseTotal) });
            puntosDelivery.push({ precio, margen: calcMargenParaPrecio(precio, tasaDelivery, costoBaseTotal) });
            if (this.inflacionSimuladaPct > 0) {
                puntosBaseSinAlza.push({ precio, margen: calcMargenParaPrecio(precio, 0, costoBaseSinInflacion) });
            }
        }

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || document.body.classList.contains('dark-mode');
        const colGrid = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(7,31,23,0.08)';
        const colAxis = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(7,31,23,0.18)';
        const colLabelY = isDark ? '#CBD5E1' : '#7A8B83';
        const colLabelX = isDark ? '#E2E8F0' : '#526059';
        const colMostrador = isDark ? '#10B981' : '#0A6847';
        const colDelivery = isDark ? '#FBBF24' : '#D97706';
        const colPointBg = isDark ? '#071F17' : '#FFFFFF';

        const width = 540;
        const height = 185;
        const padX = 46;
        const padY = 24;
        const mMin = 0;
        const mMax = 75;

        const mapX = (idx) => padX + (idx / pasos) * (width - padX * 2);
        const mapY = (margen) => {
            const pct = Math.max(0, Math.min(1, (margen - mMin) / (mMax - mMin)));
            return height - padY - pct * (height - padY * 2);
        };

        const buildPath = (pts) => pts.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(pt.margen)}`).join(' ');
        const pathMostrador = buildPath(puntosMostrador);
        const pathDelivery = buildPath(puntosDelivery);
        const pathBaseFantasma = puntosBaseSinAlza.length > 0 ? buildPath(puntosBaseSinAlza) : '';
        const areaMostrador = `${pathMostrador} L ${mapX(pasos)} ${height - padY} L ${mapX(0)} ${height - padY} Z`;

        const targetY = mapY(this.margenObjetivo);
        const gridLines = [60, 40, 20].map((val) => {
            const y = mapY(val);
            return `
                <line x1="${padX}" y1="${y}" x2="${width - padX}" y2="${y}" stroke="${colGrid}" stroke-width="1" stroke-dasharray="3,3"/>
                <text x="${padX - 8}" y="${y + 3}" font-family="Azeret Mono, monospace" font-size="8" fill="${colLabelY}" text-anchor="end">${val}%</text>
            `;
        }).join('');

        const simulacion = this.calcularSimulacionConsola(producto, insumos);
        const precioActivo = simulacion.precioFinal;
        const xActivoPct = pMax > pMin ? Math.max(0, Math.min(1, (precioActivo - pMin) / (pMax - pMin))) : 0.5;
        const xActivo = padX + xActivoPct * (width - padX * 2);
        const yActivo = mapY(simulacion.margenRealPct);

        let svgContent = `
            <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${colMostrador}" stop-opacity="0.22"/>
                    <stop offset="100%" stop-color="${colMostrador}" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            ${gridLines}
            <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="${colAxis}" stroke-width="1"/>
            <line x1="${padX}" y1="${targetY}" x2="${width - padX}" y2="${targetY}" stroke="${colMostrador}" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.8"/>
            <text x="${width - padX}" y="${Math.max(12, targetY - 5)}" font-family="Azeret Mono, monospace" font-size="8.5" fill="${colMostrador}" text-anchor="end" font-weight="700">Meta ${this.margenObjetivo}%</text>

            <path d="${areaMostrador}" fill="url(#areaGradient)"/>
            ${pathBaseFantasma ? `<path d="${pathBaseFantasma}" fill="none" stroke="#94A3B8" stroke-width="1.6" stroke-dasharray="3,3" opacity="0.75"/>` : ''}
            <path d="${pathMostrador}" fill="none" stroke="${colMostrador}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
            <path d="${pathDelivery}" fill="none" stroke="${colDelivery}" stroke-width="2.2" stroke-dasharray="5,4" stroke-linejoin="round" stroke-linecap="round"/>
        `;

        puntosMostrador.forEach((pt, i) => {
            const x = mapX(i);
            const yM = mapY(pt.margen);
            const yD = mapY(puntosDelivery[i].margen);
            svgContent += `
                <circle cx="${x}" cy="${yM}" r="3" fill="${colPointBg}" stroke="${colMostrador}" stroke-width="1.8"/>
                <circle cx="${x}" cy="${yD}" r="2.8" fill="${colPointBg}" stroke="${colDelivery}" stroke-width="1.8"/>
                <text x="${x}" y="${height - 6}" font-family="Azeret Mono, monospace" font-size="8.5" fill="${colLabelX}" text-anchor="middle">$${Store.fmt(pt.precio).replace('$', '')}</text>
            `;
        });

        const colorActivo = this.canalActivo === 'delivery' ? colDelivery : colMostrador;
        svgContent += `
            <line x1="${xActivo}" y1="${padY}" x2="${xActivo}" y2="${height - padY}" stroke="${colorActivo}" stroke-width="1" stroke-dasharray="2,2" opacity="0.55"/>
            <circle cx="${xActivo}" cy="${yActivo}" r="5.5" fill="${colorActivo}" stroke="${colPointBg}" stroke-width="2"/>
        `;

        canvas.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="chart-svg-display" width="100%" height="185" preserveAspectRatio="none" style="display:block;overflow:visible;">
                ${svgContent}
            </svg>
        `;

        const insightEl = document.getElementById('chart-insight-bar');
        if (insightEl) {
            const margenDec = Math.min(0.89, Math.max(0.05, (this.precioManualSimulado ? simulacion.margenRealPct : this.margenObjetivo) / 100));
            const baseMostrador = Math.round(costoBaseTotal / (1 - margenDec));
            const precioMostradorEq = Math.round(baseMostrador * (1 + impoconsumo));
            const divisorDelivery = Math.max(0.1, 1 - tasaDelivery);
            const precioDeliveryEq = Math.round((baseMostrador / divisorDelivery) * (1 + impoconsumo));
            const difPct = precioMostradorEq > 0 ? Math.round(((precioDeliveryEq - precioMostradorEq) / precioMostradorEq) * 100) : Math.round((1 / divisorDelivery - 1) * 100);
            const notaInflacion = this.inflacionSimuladaPct > 0
                ? `<span class="insight-chip insight-chip--alerta">Con +${this.inflacionSimuladaPct}% en insumos, tu costo/u sube a <strong>${Store.fmt(costoBaseTotal)}</strong></span>`
                : '';

            insightEl.innerHTML = `
                <div class="insight-row">
                    <span class="insight-text">
                        Para ganar el mismo margen (<strong>${Math.round(margenDec * 100)}%</strong>) en <strong>Delivery (${deliveryPct}%)</strong> que a <strong>${Store.fmt(precioMostradorEq)}</strong> en Mostrador, debes venderlo a <strong>${Store.fmt(precioDeliveryEq)}</strong> (+${difPct}%).
                    </span>
                    ${notaInflacion}
                </div>
            `;
        }
    }

    obtenerCuotaGastosFijosUnidad(producto, costoDirecto) {
        if (producto && producto.costoManoObra > 0) {
            return Math.round(producto.costoManoObra / Math.max(1, producto.unidadesProducidas || 1));
        }
        const cfg = this.obtenerConfigNegocio();
        if (cfg && cfg.cuotaFijaTotalPorLote) {
            const unidades = Math.max(1, producto?.unidadesProducidas || 1);
            if (unidades === 1) {
                return Math.round(cfg.cuotaFijaTotalPorLote / 10);
            }
            return Math.round(cfg.cuotaFijaTotalPorLote / unidades);
        }
        return Math.round(costoDirecto * 0.12);
    }

    calcularCostosUnitariosSimulados(producto, insumos) {
        const unidades = Math.max(1, producto.unidadesProducidas || 1);
        const costoDirecto = Math.round(
            (producto.calcularCostoIngredientes(insumos) +
             producto.calcularCostoMerma(insumos) +
             (producto.costoEmpaque * unidades)) / unidades
        );
        const gastosFijosCuota = this.obtenerCuotaGastosFijosUnidad(producto, costoDirecto);
        return {
            costoDirecto,
            gastosFijosCuota,
            costoBaseTotal: costoDirecto + gastosFijosCuota
        };
    }

    calcularSimulacionConsola(producto, insumos) {
        const cfg = this.obtenerConfigNegocio();
        const deliveryPct = Number(cfg.comisionDeliveryPct ?? 25);
        const impoconsumoPct = Number(cfg.impoconsumoPct ?? 8);
        const { costoDirecto, gastosFijosCuota, costoBaseTotal } = this.calcularCostosUnitariosSimulados(producto, insumos);
        const tasaComision = this.canalActivo === 'delivery' ? (deliveryPct / 100) : 0;
        const tasaImpo = this.incluirImpoconsumo ? (impoconsumoPct / 100) : 0;

        if (this.precioManualSimulado && this.precioManualSimulado > 0) {
            const precioFinal = Math.round(this.precioManualSimulado);
            const precioSinImpo = Math.round(precioFinal / (1 + tasaImpo));
            const impoconsumoValor = precioFinal - precioSinImpo;
            const comisionValor = Math.round(precioSinImpo * tasaComision);
            const ingresoNetoNegocio = precioSinImpo - comisionValor;
            const gananciaNetaUnidad = ingresoNetoNegocio - costoBaseTotal;
            const margenRealPct = ingresoNetoNegocio > 0
                ? Math.round((gananciaNetaUnidad / ingresoNetoNegocio) * 100)
                : -100;

            return {
                costoDirecto,
                gastosFijosCuota,
                costoBaseTotal,
                tasaComision,
                impoconsumoPct,
                comisionValor,
                impoconsumoValor,
                precioFinal,
                precioBaseMostrador: ingresoNetoNegocio,
                gananciaNetaUnidad,
                margenRealPct
            };
        }

        const margenDecimal = this.margenObjetivo / 100;
        const precioSinComision = margenDecimal < 1 ? Math.round(costoBaseTotal / (1 - margenDecimal)) : costoBaseTotal * 2;
        const divisorCanal = Math.max(0.1, 1 - tasaComision);
        const precioConCanal = Math.round(precioSinComision / divisorCanal);
        const impoconsumoValor = Math.round(precioConCanal * tasaImpo);
        const precioFinal = precioConCanal + impoconsumoValor;
        const comisionValor = Math.round(precioConCanal * tasaComision);
        const ingresoNetoNegocio = precioFinal - impoconsumoValor - comisionValor;
        const gananciaNetaUnidad = ingresoNetoNegocio - costoBaseTotal;

        return {
            costoDirecto,
            gastosFijosCuota,
            costoBaseTotal,
            tasaComision,
            impoconsumoPct,
            comisionValor,
            impoconsumoValor,
            precioFinal,
            precioBaseMostrador: precioSinComision,
            gananciaNetaUnidad,
            margenRealPct: this.margenObjetivo
        };
    }

    actualizarConsolaPricing(productosLista = null, insumosLista = null) {
        const productos = productosLista || Store.cargarProductos();
        const insumosBase = insumosLista || Store.cargarInsumos();
        const insumos = this.obtenerInsumosSimulados(insumosBase);
        const producto = productos.find((p) => p.id === this.productoActivoId) || productos[0];
        if (!producto) return;

        const nombre = document.getElementById('pricing-receta-nombre');
        const elCostoDir = document.getElementById('calc-costo-directo');
        const elGastosFijos = document.getElementById('calc-gastos-fijos');
        const elComision = document.getElementById('calc-comision-canal');
        const elImpo = document.getElementById('calc-impoconsumo');
        const elPrecioSugerido = document.getElementById('calc-precio-sugerido');
        const elGananciaNeta = document.getElementById('calc-ganancia-neta');
        const elMarginDisplay = document.getElementById('calc-target-margin-display');

        if (nombre) nombre.textContent = producto.nombre;

        const sim = this.calcularSimulacionConsola(producto, insumos);

        if (elMarginDisplay) {
            elMarginDisplay.textContent = this.precioManualSimulado
                ? `Real: ${sim.margenRealPct}%`
                : `${this.margenObjetivo}%`;
        }

        if (elCostoDir) elCostoDir.textContent = Store.fmt(sim.costoDirecto);
        if (elGastosFijos) elGastosFijos.textContent = Store.fmt(sim.gastosFijosCuota);
        if (elComision) elComision.textContent = `${Store.fmt(sim.comisionValor)} (${Math.round(sim.tasaComision * 100)}%)`;
        if (elImpo) {
            elImpo.textContent = this.incluirImpoconsumo
                ? `${Store.fmt(sim.impoconsumoValor)} (${sim.impoconsumoPct}%)`
                : '$0 (No aplica)';
        }
        if (elPrecioSugerido) elPrecioSugerido.textContent = Store.fmt(sim.precioFinal);
        if (elGananciaNeta) {
            const signo = sim.gananciaNetaUnidad >= 0 ? '+' : '-';
            elGananciaNeta.textContent = `${signo}${Store.fmt(Math.abs(sim.gananciaNetaUnidad))}`;
            elGananciaNeta.style.color = sim.gananciaNetaUnidad < 0 ? '#B91C1C' : '';
        }
    }

    async aplicarPrecioReceta() {
        const productos = Store.cargarProductos();
        const insumosBase = Store.cargarInsumos();
        const insumosSimulados = this.obtenerInsumosSimulados(insumosBase);
        const producto = productos.find((p) => p.id === this.productoActivoId);
        if (!producto) return;

        const sim = this.calcularSimulacionConsola(producto, insumosSimulados);
        const costoUnidadReal = producto.calcularCostoUnidad(insumosBase);
        const precioObjetivoMostrador = Math.max(costoUnidadReal + 1, sim.precioBaseMostrador || sim.precioFinal);
        const margenExacto = ((precioObjetivoMostrador - costoUnidadReal) / precioObjetivoMostrador) * 100;
        const valorModoGuardar = Math.min(95, Math.max(1, Number(margenExacto.toFixed(4))));

        producto.modo = 'margen';
        producto.tipoMargen = 'venta';
        producto.valorModo = valorModoGuardar;

        const btn = document.getElementById('btn-ejecutar-orden');
        const originalHTML = btn ? btn.innerHTML : '';
        if (btn) btn.disabled = true;

        try {
            const res = await Store.guardarProductoAsync({
                id: producto.id,
                nombre: producto.nombre,
                modo: 'margen',
                valorModo: valorModoGuardar,
                tipoMargen: 'venta',
                unidadesProducidas: producto.unidadesProducidas,
                costoEmpaque: producto.costoEmpaque || 0,
                porcentajeMerma: producto.porcentajeMerma || 0,
                costoManoObra: producto.costoManoObra || 0,
                receta: (producto.receta || []).map((r) => ({
                    insumoId: r.insumoId,
                    cantidad: r.cantidad,
                    unidadReceta: r.unidadReceta
                }))
            });

            if (res && res.success) {
                await Store.aceptarCambioPrecioAsync(producto.id);
                if (typeof Store.toast === 'function') {
                    Store.toast(`Precio actualizado para "${producto.nombre}"`);
                }
                if (btn) {
                    btn.innerHTML = `
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Precio aplicado a receta</span>
                    `;
                    btn.style.backgroundColor = '#071F17';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.style.backgroundColor = '';
                    }, 2200);
                }
            } else if (typeof Store.toast === 'function') {
                Store.toast((res && res.mensaje) || 'No se pudo guardar el precio', 'error');
            }
        } finally {
            if (btn) btn.disabled = false;
        }

        this.actualizarVista();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardController = new DashboardWorkstationController();
    window.dashboardController.iniciar();
});
