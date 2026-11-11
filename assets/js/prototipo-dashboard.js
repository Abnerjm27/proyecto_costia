/**
 * prototipo-dashboard.js — Controlador Financiero Pro (Arquitectura POO)
 * Reglas EXIS:
 * - POO con encapsulación estricta
 * - Cero código procedural huérfano
 * - Manejo de eventos desacoplado sin atributos inline
 * - Números tabulares y cálculos financieros deterministas
 */

class CostiaProTerminal {
    constructor() {
        this.layoutActual = 'layout-terminal-pro';
        this.productoActivoKey = 'pandebono';
        this.canalActivo = 'mostrador'; // 'mostrador' | 'delivery' | 'mayorista'
        this.margenObjetivo = 55; // %

        // Catálogo de productos con estructura de costos profunda
        this.productos = {
            pandebono: {
                id: 'pandebono',
                codigo: 'PBO/COP',
                nombre: 'Pan de Bono Tradicional',
                categoria: 'Amasijos Colombianos',
                costoDirecto: 820,
                gastosFijosCuota: 180,
                precioMostrador: 1800,
                margenMostrador: 54.2,
                precioDelivery: 2500,
                margenDelivery: 48.0,
                puntoEquilibrioMensual: 4200000,
                alertaCritica: true,
                alertaDetalle: 'Queso costeño subió 12%',
                insumos: [
                    { nombre: 'Queso costeño', costo: 520, pct: 63.4, alza: 12.0, estado: 'critico' },
                    { nombre: 'Almidón de yuca', costo: 180, pct: 21.9, alza: 0.0, estado: 'estable' },
                    { nombre: 'Mantequilla 82%', costo: 80, pct: 9.8, alza: -2.0, estado: 'estable' },
                    { nombre: 'Huevos frescos', costo: 40, pct: 4.9, alza: 0.0, estado: 'neutral' }
                ],
                curvaPrecios: [
                    { precio: 1400, margen: 39 },
                    { precio: 1600, margen: 47 },
                    { precio: 1800, margen: 54 },
                    { precio: 2000, margen: 59 },
                    { precio: 2200, margen: 62 },
                    { precio: 2500, margen: 67 }
                ]
            },
            croissant: {
                id: 'croissant',
                codigo: 'CRS/COP',
                nombre: 'Croissant Francés Mantequilla',
                categoria: 'Pastelería Hojaldrada',
                costoDirecto: 2450,
                gastosFijosCuota: 350,
                precioMostrador: 5000,
                margenMostrador: 51.0,
                precioDelivery: 6900,
                margenDelivery: 45.2,
                puntoEquilibrioMensual: 5800000,
                alertaCritica: false,
                alertaDetalle: 'Costos estables en el periodo',
                insumos: [
                    { nombre: 'Mantequilla extra grasa', costo: 1450, pct: 59.2, alza: 1.5, estado: 'estable' },
                    { nombre: 'Harina de fuerza', costo: 600, pct: 24.5, alza: 0.0, estado: 'estable' },
                    { nombre: 'Azúcar y levadura', costo: 250, pct: 10.2, alza: -1.0, estado: 'estable' },
                    { nombre: 'Huevos y sal', costo: 150, pct: 6.1, alza: 0.0, estado: 'neutral' }
                ],
                curvaPrecios: [
                    { precio: 4000, margen: 38 },
                    { precio: 4500, margen: 45 },
                    { precio: 5000, margen: 51 },
                    { precio: 5500, margen: 55 },
                    { precio: 6000, margen: 59 },
                    { precio: 6900, margen: 64 }
                ]
            },
            empanada: {
                id: 'empanada',
                codigo: 'EMP/COP',
                nombre: 'Empanada de Carne Suprema',
                categoria: 'Fritos y Horneados',
                costoDirecto: 1400,
                gastosFijosCuota: 200,
                precioMostrador: 3000,
                margenMostrador: 53.3,
                precioDelivery: 4200,
                margenDelivery: 44.8,
                puntoEquilibrioMensual: 3900000,
                alertaCritica: false,
                alertaDetalle: 'Sin variaciones críticas',
                insumos: [
                    { nombre: 'Carne de res molida', costo: 750, pct: 53.5, alza: 2.0, estado: 'estable' },
                    { nombre: 'Masa de maíz precocida', costo: 350, pct: 25.0, alza: 0.0, estado: 'estable' },
                    { nombre: 'Aceite vegetal fritura', costo: 180, pct: 12.9, alza: -3.0, estado: 'estable' },
                    { nombre: 'Guiso y condimentos', costo: 120, pct: 8.6, alza: 0.0, estado: 'neutral' }
                ],
                curvaPrecios: [
                    { precio: 2200, margen: 36 },
                    { precio: 2600, margen: 46 },
                    { precio: 3000, margen: 53 },
                    { precio: 3500, margen: 60 },
                    { precio: 4200, margen: 66 }
                ]
            },
            torta: {
                id: 'torta',
                codigo: 'TOR/COP',
                nombre: 'Torta de Zanahoria & Nueces',
                categoria: 'Repostería Fina',
                costoDirecto: 18500,
                gastosFijosCuota: 2500,
                precioMostrador: 38000,
                margenMostrador: 51.3,
                precioDelivery: 49000,
                margenDelivery: 46.1,
                puntoEquilibrioMensual: 6200000,
                alertaCritica: true,
                alertaDetalle: 'Nuez nogal subió 18%',
                insumos: [
                    { nombre: 'Nueces de nogal', costo: 8200, pct: 44.3, alza: 18.0, estado: 'critico' },
                    { nombre: 'Queso crema frosting', costo: 4800, pct: 25.9, alza: 5.0, estado: 'critico' },
                    { nombre: 'Harina y especias', costo: 3200, pct: 17.3, alza: 0.0, estado: 'estable' },
                    { nombre: 'Zanahoria fresca y aceite', costo: 2300, pct: 12.5, alza: -2.0, estado: 'neutral' }
                ],
                curvaPrecios: [
                    { precio: 30000, margen: 38 },
                    { precio: 34000, margen: 45 },
                    { precio: 38000, margen: 51 },
                    { precio: 44000, margen: 58 },
                    { precio: 49000, margen: 62 }
                ]
            }
        };
    }

    iniciar() {
        this.vincularSidebar();
        this.vincularSelectorVistas();
        this.vincularSelectorProducto();
        this.vincularConsolaPrecios();
        this.vincularTabsLedger();
        this.vincularIntervalosGrafico();
        this.actualizarEstacionCompleta();
    }

    vincularSidebar() {
        const triggers = document.querySelectorAll('[data-sidebar-toggle]');
        triggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const group = trigger.closest('.sidebar-item-group');
                if (group) {
                    group.classList.toggle('abierto');
                }
            });
        });

        const btnToggleSidebarTheme = document.getElementById('btn-toggle-sidebar-theme');
        const sidebar = document.getElementById('terminal-sidebar');
        if (btnToggleSidebarTheme && sidebar) {
            btnToggleSidebarTheme.addEventListener('click', () => {
                const esLight = sidebar.classList.toggle('theme-light');
                btnToggleSidebarTheme.textContent = esLight ? 'Estilo Pino Profundo' : 'Estilo Blanco Suave';
            });
        }
    }

    vincularSelectorVistas() {
        const botones = document.querySelectorAll('[data-layout-btn]');
        botones.forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.getAttribute('data-layout-btn');
                this.cambiarLayout(layout);
            });
        });
    }

    cambiarLayout(layoutId) {
        this.layoutActual = layoutId;

        // Actualizar botones
        document.querySelectorAll('[data-layout-btn]').forEach(btn => {
            const activo = btn.getAttribute('data-layout-btn') === layoutId;
            btn.classList.toggle('activo', activo);
            btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
        });

        // Alternar vistas
        document.querySelectorAll('.terminal-view-layout').forEach(v => {
            v.classList.remove('activa');
        });

        const target = document.getElementById(layoutId);
        if (target) {
            target.classList.add('activa');
        }
    }

    vincularSelectorProducto() {
        const select = document.getElementById('select-producto-activo');
        if (select) {
            select.addEventListener('change', (e) => {
                this.productoActivoKey = e.target.value;
                this.actualizarEstacionCompleta();
            });
        }

        // Selección desde filas del ledger o lista
        document.addEventListener('click', (e) => {
            const fila = e.target.closest('[data-select-prod]');
            if (fila) {
                const prodKey = fila.getAttribute('data-select-prod');
                if (this.productos[prodKey]) {
                    this.productoActivoKey = prodKey;
                    if (select) select.value = prodKey;
                    this.actualizarEstacionCompleta();
                }
            }
        });
    }

    vincularConsolaPrecios() {
        // Canales (Mostrador vs Delivery vs Mayorista)
        const canalBtns = document.querySelectorAll('[data-channel]');
        canalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.canalActivo = btn.getAttribute('data-channel');
                canalBtns.forEach(b => b.classList.toggle('activo', b === btn));
                this.recalcularConsola();
            });
        });

        // Sliders de Margen Objetivo (25%, 35%, 45%, 55%, 65%)
        const stopBtns = document.querySelectorAll('[data-margin-stop]');
        stopBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.margenObjetivo = parseInt(btn.getAttribute('data-margin-stop'), 10);
                stopBtns.forEach(b => b.classList.toggle('activo', b === btn));
                this.recalcularConsola();
            });
        });

        // Botón ejecutar orden de precio
        const btnEjecutar = document.getElementById('btn-ejecutar-orden');
        if (btnEjecutar) {
            btnEjecutar.addEventListener('click', () => {
                this.notificarEjecucionPrecio();
            });
        }
    }

    vincularTabsLedger() {
        const tabs = document.querySelectorAll('[data-ledger-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetKey = tab.getAttribute('data-ledger-tab');
                tabs.forEach(t => t.classList.toggle('activo', t === tab));
                
                document.querySelectorAll('.ledger-tab-panel').forEach(p => {
                    p.style.display = p.id === `ledger-${targetKey}` ? 'block' : 'none';
                });
            });
        });
    }

    vincularIntervalosGrafico() {
        const intBtns = document.querySelectorAll('.chart-interval-btn');
        intBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                intBtns.forEach(b => b.classList.toggle('activo', b === btn));
            });
        });
    }

    actualizarEstacionCompleta() {
        const prod = this.productos[this.productoActivoKey];
        if (!prod) return;

        // 1. Ticker Header
        const tickerNombre = document.getElementById('ticker-prod-nombre');
        const tickerCodigo = document.getElementById('ticker-prod-codigo');
        const tickerCosto = document.getElementById('ticker-costo-val');
        const tickerMargen = document.getElementById('ticker-margen-val');
        const tickerPrecio = document.getElementById('ticker-precio-val');
        const tickerPuntoEq = document.getElementById('ticker-puntoeq-val');
        const tickerAlerta = document.getElementById('ticker-alerta-badge');

        if (tickerNombre) tickerNombre.textContent = prod.nombre;
        if (tickerCodigo) tickerCodigo.textContent = prod.codigo;
        if (tickerCosto) tickerCosto.textContent = `$${prod.costoDirecto.toLocaleString('es-CO')}`;
        if (tickerMargen) tickerMargen.textContent = `${prod.margenMostrador.toFixed(1)}%`;
        if (tickerPrecio) tickerPrecio.textContent = `$${prod.precioMostrador.toLocaleString('es-CO')}`;
        if (tickerPuntoEq) tickerPuntoEq.textContent = `$${(prod.puntoEquilibrioMensual / 1000000).toFixed(1)}M/mes`;

        if (tickerAlerta) {
            tickerAlerta.className = prod.alertaCritica ? 'ticker-badge-warn' : 'ticker-badge-gain';
            tickerAlerta.textContent = prod.alertaCritica ? 'Alza Detectada' : 'Margen Estable';
        }

        // 2. Renderizar Order Book de Insumos
        this.renderizarOrderBook(prod);

        // 3. Renderizar Curva de Margen SVG
        this.renderizarGraficoSVG(prod);

        // 4. Recalcular Consola de Ejecución
        this.recalcularConsola();
    }

    renderizarOrderBook(prod) {
        const tbody = document.getElementById('orderbook-tbody');
        if (!tbody) return;

        let html = '';
        prod.insumos.forEach(ins => {
            const esCritico = ins.alza > 0;
            const alzaColor = esCritico ? 'color: #C53030;' : (ins.alza < 0 ? 'color: #0A6847;' : 'color: #718096;');
            const depthClass = esCritico ? 'depth-critical' : 'depth-stable';
            const alzaTexto = ins.alza > 0 ? `+${ins.alza}%` : (ins.alza < 0 ? `${ins.alza}%` : '0%');

            html += `
                <tr class="orderbook-row">
                    <td>
                        <strong>${ins.nombre}</strong>
                        <div class="orderbook-depth-bar ${depthClass}" style="width: ${ins.pct}%;"></div>
                    </td>
                    <td class="mono-val" style="text-align: right;">$${ins.costo.toLocaleString('es-CO')}</td>
                    <td class="mono-val" style="text-align: right; font-weight: 700; ${alzaColor}">${alzaTexto}</td>
                    <td class="mono-val" style="text-align: right;">${ins.pct}%</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Actualizar spread en vivo
        const spreadRealEl = document.getElementById('spread-val-real');
        if (spreadRealEl) spreadRealEl.textContent = `${prod.margenMostrador.toFixed(1)}%`;
    }

    renderizarGraficoSVG(prod) {
        const svgContainer = document.getElementById('chart-svg-container');
        if (!svgContainer) return;

        const puntos = prod.curvaPrecios;
        const width = 600;
        const height = 180;
        const padX = 50;
        const padY = 24;

        const minP = puntos[0].precio;
        const maxP = puntos[puntos.length - 1].precio;
        const minM = 30;
        const maxM = 75;

        const coords = puntos.map(pt => {
            const x = padX + ((pt.precio - minP) / (maxP - minP)) * (width - 2 * padX);
            const y = (height - padY) - ((pt.margen - minM) / (maxM - minM)) * (height - 2 * padY);
            return { x, y, precio: pt.precio, margen: pt.margen };
        });

        const dPath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
        const dArea = `${dPath} L ${coords[coords.length - 1].x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z`;

        // Puntos de referencia
        const puntoMostrador = coords.find(c => c.precio === prod.precioMostrador) || coords[2];

        svgContainer.innerHTML = `
            <defs>
                <linearGradient id="areaVerde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#0A6847" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="#0A6847" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            <!-- Líneas de rejilla horizontal -->
            <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="#E2E8F0" stroke-width="1"/>
            <line x1="${padX}" y1="${height / 2}" x2="${width - padX}" y2="${height / 2}" stroke="#EDF2F7" stroke-width="1" stroke-dasharray="4"/>
            <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" stroke="#EDF2F7" stroke-width="1"/>
            
            <!-- Área y Curva -->
            <path d="${dArea}" fill="url(#areaVerde)"/>
            <path d="${dPath}" fill="none" stroke="#0A6847" stroke-width="2.5" stroke-linecap="round"/>

            <!-- Marcador Actual Mostrador -->
            <circle cx="${puntoMostrador.x}" cy="${puntoMostrador.y}" r="6" fill="#0A6847" stroke="#FFFFFF" stroke-width="2"/>
            <text x="${puntoMostrador.x + 8}" y="${puntoMostrador.y - 8}" font-family="monospace" font-size="11" font-weight="700" fill="#071F17">
                Mostrador: $${prod.precioMostrador.toLocaleString('es-CO')} (${prod.margenMostrador}%)
            </text>

            <!-- Ejes -->
            <text x="${padX}" y="${height - 6}" font-family="monospace" font-size="10" fill="#718096">$${minP.toLocaleString('es-CO')}</text>
            <text x="${width - padX - 45}" y="${height - 6}" font-family="monospace" font-size="10" fill="#718096">$${maxP.toLocaleString('es-CO')}</text>
            <text x="6" y="${padY + 4}" font-family="monospace" font-size="10" fill="#718096">75% Mgn</text>
            <text x="6" y="${height - padY}" font-family="monospace" font-size="10" fill="#718096">30% Mgn</text>
        `;
    }

    recalcularConsola() {
        const prod = this.productos[this.productoActivoKey];
        if (!prod) return;

        const costoBase = prod.costoDirecto + prod.gastosFijosCuota;
        const margenFrac = this.margenObjetivo / 100;

        let comisionPct = 0;
        if (this.canalActivo === 'delivery') comisionPct = 0.22; // 22% Rappi
        if (this.canalActivo === 'mayorista') comisionPct = 0.05; // 5% flete / empaque volumen

        const impoconsumoPct = 0.08; // 8%

        // Precio sugerido: costoBase / (1 - margen - comision - impoconsumo)
        const divisor = 1 - (margenFrac + comisionPct + impoconsumoPct);
        const precioBruto = divisor > 0.1 ? Math.round(costoBase / divisor) : costoBase * 2;
        const precioRedondeado = Math.ceil(precioBruto / 100) * 100;

        const impoconsumoVal = Math.round(precioRedondeado * impoconsumoPct);
        const comisionVal = Math.round(precioRedondeado * comisionPct);
        const gananciaNeta = precioRedondeado - costoBase - impoconsumoVal - comisionVal;

        // Actualizar UI de consola
        const valMargenHeader = document.getElementById('calc-target-margin-display');
        const valCostoBase = document.getElementById('calc-costo-base');
        const valGastosFijos = document.getElementById('calc-gastos-fijos');
        const valComision = document.getElementById('calc-comision-canal');
        const valImpoconsumo = document.getElementById('calc-impoconsumo');
        const valPrecioFinal = document.getElementById('calc-precio-final');
        const valGananciaNeta = document.getElementById('calc-ganancia-neta');

        if (valMargenHeader) valMargenHeader.textContent = `${this.margenObjetivo}%`;
        if (valCostoBase) valCostoBase.textContent = `$${prod.costoDirecto.toLocaleString('es-CO')}`;
        if (valGastosFijos) valGastosFijos.textContent = `$${prod.gastosFijosCuota.toLocaleString('es-CO')}`;
        if (valComision) valComision.textContent = comisionVal > 0 ? `$${comisionVal.toLocaleString('es-CO')} (${comisionPct * 100}%)` : '$0 (0%)';
        if (valImpoconsumo) valImpoconsumo.textContent = `$${impoconsumoVal.toLocaleString('es-CO')} (8%)`;
        if (valPrecioFinal) valPrecioFinal.textContent = `$${precioRedondeado.toLocaleString('es-CO')}`;
        if (valGananciaNeta) valGananciaNeta.textContent = `$${gananciaNeta.toLocaleString('es-CO')}`;
    }

    notificarEjecucionPrecio() {
        const prod = this.productos[this.productoActivoKey];
        const valPrecio = document.getElementById('calc-precio-final')?.textContent || '$0';
        const canalNombre = this.canalActivo.toUpperCase();

        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '24px';
        toast.style.right = '24px';
        toast.style.background = '#071F17';
        toast.style.color = '#FFFFFF';
        toast.style.border = '2px solid #0A6847';
        toast.style.borderRadius = '8px';
        toast.style.padding = '14px 20px';
        toast.style.fontSize = '0.9rem';
        toast.style.boxShadow = '0 10px 28px rgba(0,0,0,0.3)';
        toast.style.zIndex = '9999';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.innerHTML = `
            <span style="color: #2ECC71; display:flex; align-items:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg></span>
            <div>
                <strong>Precio Actualizado con Éxito</strong><br>
                <small>${prod.nombre}: Nuevo precio ${canalNombre} fijado en ${valPrecio} (${this.margenObjetivo}% margen).</small>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}

// Inicialización de la estación
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.costiaProTerminal = new CostiaProTerminal();
            window.costiaProTerminal.iniciar();
        });
    } else {
        window.costiaProTerminal = new CostiaProTerminal();
        window.costiaProTerminal.iniciar();
    }
}
