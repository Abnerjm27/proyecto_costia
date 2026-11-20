/**
 * crear-producto.js — Controlador de la vista Crear/Editar Producto (POO)
 * Terminal de Liquidación Financiera y Calculadora de Precios Costia Pro.
 *
 * Encapsula la gestión del formulario de recetas, costos adicionales (merma, empaque, mano de obra),
 * modos de precio (markup vs margen comercial) y cálculos en tiempo real en la clase CrearProductoController.
 */

class CrearProductoController {
    static MULTIPLICADORES = {
        'sin-local':    { encargo: 2.0, feria: 2.3, default: 2.0 },
        'con-arriendo': { 'alto-si': 3.8, 'alto-no': 3.4, 'bajo-si': 3.2, 'bajo-no': 3.0, default: 3.0 },
        'premium':      { 'marca-si': 4.5, 'marca-no': 4.0, 'ubicacion-si': 4.2, 'ubicacion-no': 3.8, default: 3.5 },
    };

    constructor() {
        this.modoPrecio                  = 'margen';
        this.filaIdCounter               = 0;
        this.productoEditandoId          = null;
        this.pasoActual                  = 1;
        this.porcentajeGastoProporcional = 25;
        this.recomendacionModoActual     = null;
    }

    iniciar() {
        this.configurarEventosGenerales();
        const editando = this.cargarProductoSiEsEdicion();
        if (!editando) {
            this.precargarDefaultsNegocio();
            this.agregarFila(); // fila inicial
            this.actualizarResumen();
        }

        // Si MySQL responde con sincronización posterior, recargar si es edición
        Store.alActualizar(() => {
            this.actualizarOpcionesInsumos();
            if (this.productoEditandoId) {
                this.cargarProductoSiEsEdicion();
            }
        });

        // Inicializar Agente Asesor de Costos Ocultos y Precio Justo
        if (window.AsesorCostiaAgent) {
            this.asesorAgente = new AsesorCostiaAgent(this);
            window.asesorAgente = this.asesorAgente;
            this.asesorAgente.iniciar();
        }
    }

    precargarDefaultsNegocio() {
        const cfg = typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : {};
        const margenDef = parseFloat(cfg.margenDefault);
        const multDef = parseFloat(cfg.modeloComercial);

        const inpMargen = document.getElementById('input-margen');
        const sldMargen = document.getElementById('slider-margen');
        const inpMult = document.getElementById('input-multiplicador');
        const selTipo = document.getElementById('tipo-margen');

        if (!isNaN(margenDef) && margenDef > 0) {
            if (inpMargen) inpMargen.value = margenDef;
            if (sldMargen) sldMargen.value = Math.min(200, margenDef);
        }
        if (!isNaN(multDef) && multDef >= 1 && inpMult) {
            inpMult.value = multDef;
        }
        if (selTipo) {
            selTipo.value = 'venta';
        }
    }

    configurarEventosGenerales() {
        // 1. Receta y cantidades
        document.getElementById('producto-nombre')?.addEventListener('input', () => this.actualizarResumen());
        document.getElementById('btn-agregar')?.addEventListener('click', () => this.agregarFila());
        document.getElementById('unidades-producidas')?.addEventListener('input', () => this.actualizarResumen());

        // 1b. Navegación y herramientas del Wizard de 3 pasos
        this.configurarEventosWizard();

        // 2. Costos adicionales
        document.getElementById('porcentaje-merma')?.addEventListener('input', () => this.actualizarResumen());
        document.getElementById('costo-empaque')?.addEventListener('input', () => this.actualizarResumen());
        document.getElementById('costo-mano-obra')?.addEventListener('input', () => this.actualizarResumen());
        this.configurarHerramientasManualesCostos();

        // 3. Modos de precio y tabs
        document.getElementById('tab-margen')?.addEventListener('click', () => this.cambiarModo('margen'));
        document.getElementById('tab-multiplicador')?.addEventListener('click', () => this.cambiarModo('multiplicador'));

        // 4. Panel Margen %
        document.getElementById('tipo-margen')?.addEventListener('change', () => this.actualizarResumen());
        document.getElementById('slider-margen')?.addEventListener('input', () => this.sincronizarMargen('slider'));
        document.getElementById('input-margen')?.addEventListener('input', () => this.sincronizarMargen('input'));

        // 5. Panel Multiplicador ×
        document.getElementById('input-multiplicador')?.addEventListener('input', () => this.actualizarResumen());
        document.getElementById('btn-abrir-cfg-desde-receta')?.addEventListener('click', () => {
            window.location.href = 'configuracion.html#seccion-precios';
        });

        // 6. Botón Asesor IA
        document.getElementById('btn-fab-asesor')?.addEventListener('click', () => {
            if (window.asesorAgente && typeof window.asesorAgente.abrirChat === 'function') {
                window.asesorAgente.abrirChat();
            }
        });

        // 7. Botón de guardado
        document.querySelectorAll('.btn-guardar').forEach(btn => {
            btn.addEventListener('click', () => this.guardarProducto());
        });

        // 8. Delegación de eventos en la tabla de receta (#receta-cuerpo)
        const cuerpo = document.getElementById('receta-cuerpo');
        if (cuerpo) {
            cuerpo.addEventListener('change', (e) => {
                const fila = e.target.closest('.receta-fila');
                if (!fila) return;
                const filaId = parseInt(fila.dataset.id, 10);

                if (e.target.classList.contains('fila-insumo')) {
                    this.alCambiarInsumo(e.target, filaId);
                } else if (e.target.classList.contains('fila-unidad-receta')) {
                    this.actualizarResumen();
                }
            });

            cuerpo.addEventListener('input', (e) => {
                if (e.target.classList.contains('fila-cantidad')) {
                    this.actualizarResumen();
                }
            });

            cuerpo.addEventListener('click', (e) => {
                const btnCorregir = e.target.closest('.btn-corregir-unidad-fila');
                if (btnCorregir) {
                    const fila = btnCorregir.closest('.receta-fila');
                    const selUnidad = fila?.querySelector('.fila-unidad-receta');
                    const targetUnit = btnCorregir.dataset.targetUnit;
                    if (selUnidad && targetUnit) {
                        selUnidad.value = targetUnit;
                        this.actualizarResumen();
                        Store.toast(`Unidad cambiada a ${targetUnit}`);
                    }
                    return;
                }

                const btnEliminar = e.target.closest('.receta-fila__eliminar');
                if (btnEliminar) {
                    const fila = btnEliminar.closest('.receta-fila');
                    if (fila) {
                        this.eliminarFila(parseInt(fila.dataset.id, 10));
                    }
                }
            });
        }
    }

    // ─── Modos de Precio (Margen % y Multiplicador) ──────────────

    cambiarModo(modo) {
        this.modoPrecio = modo;
        const tabMargen = document.getElementById('tab-margen');
        const tabMult   = document.getElementById('tab-multiplicador');
        const panMargen = document.getElementById('panel-margen');
        const panMult   = document.getElementById('panel-multiplicador');

        const esMargen = modo === 'margen';
        tabMargen?.classList.toggle('activo', esMargen);
        tabMargen?.setAttribute('aria-selected', esMargen);
        tabMult?.classList.toggle('activo', !esMargen);
        tabMult?.setAttribute('aria-selected', !esMargen);

        panMargen?.classList.toggle('visible', esMargen);
        panMult?.classList.toggle('visible', !esMargen);

        this.actualizarResumen();
    }

    sincronizarMargen(origen) {
        const slider = document.getElementById('slider-margen');
        const input  = document.getElementById('input-margen');
        if (origen === 'slider' && input && slider) {
            input.value = slider.value;
        } else if (origen === 'input' && slider && input) {
            slider.value = Math.min(200, Math.max(0, input.value));
        }
        this.actualizarResumen();
    }

    aplicarMargenSugerido() {
        const sugerido   = this.recomendacionModoActual?.margenComp || 30;
        const tipoSug    = this.recomendacionModoActual?.tipoMargenComp;
        const input      = document.getElementById('input-margen');
        const slider     = document.getElementById('slider-margen');
        const selTipo    = document.getElementById('tipo-margen');

        if (input)  input.value  = sugerido;
        if (slider) slider.value = Math.min(200, sugerido);
        if (selTipo && tipoSug) selTipo.value = tipoSug;

        this.actualizarResumen();
        Store.toast(`Margen sugerido aplicado: ${sugerido}%`);
    }

    mostrarPreguntas(categoria) {
        // Compatibilidad: el perfil de negocio se gestiona ahora en Configuración
        this.actualizarMultiplicador();
    }

    actualizarMultiplicador() {
        this.actualizarResumen();
    }

    // ─── Navegación Wizard de 3 Pasos y Recomendaciones ───────────

    /**
     * Enlaza los eventos del stepper, botones Siguiente/Volver y tarjetas de recomendación.
     */
    configurarEventosWizard() {
        document.querySelectorAll('.wizard-step-tab[data-paso]').forEach(tab => {
            tab.addEventListener('click', () => {
                const paso = parseInt(tab.dataset.paso, 10);
                if (paso) this.irAPaso(paso);
            });
        });

        document.getElementById('btn-ir-paso-2')?.addEventListener('click', () => this.irAPaso(2));
        document.getElementById('btn-volver-paso-1')?.addEventListener('click', () => this.irAPaso(1));
        document.getElementById('btn-ir-paso-3')?.addEventListener('click', () => this.irAPaso(3));
        document.getElementById('btn-volver-paso-2')?.addEventListener('click', () => this.irAPaso(2));
        document.getElementById('btn-volver-paso-1-desde-3')?.addEventListener('click', () => this.irAPaso(1));

        document.querySelectorAll('.gastos-prop-pill[data-pct-gasto]').forEach(pill => {
            pill.addEventListener('click', () => {
                const pct = parseFloat(pill.dataset.pctGasto);
                if (isNaN(pct)) return;
                this.porcentajeGastoProporcional = pct;
                document.querySelectorAll('.gastos-prop-pill').forEach(p => p.classList.remove('activo'));
                pill.classList.add('activo');
                this.actualizarResumen();
            });
        });

        document.getElementById('btn-aplicar-gastos-recomendados')?.addEventListener('click', () => {
            this.aplicarGastosProporcionalesSugeridos();
        });

        document.getElementById('btn-corregir-gasto-proporcional')?.addEventListener('click', () => {
            this.aplicarGastosProporcionalesSugeridos();
        });

        document.getElementById('btn-aplicar-modo-recomendado')?.addEventListener('click', () => {
            this.aplicarModoRecomendado();
        });

        document.querySelectorAll('.modo-comp-card[data-seleccionar-modo]').forEach(card => {
            card.addEventListener('click', () => {
                const modoElegido = card.dataset.seleccionarModo;
                if (modoElegido) {
                    this.aplicarModoRecomendado(modoElegido);
                }
            });
        });
    }

    /**
     * Verifica que el Paso 1 tenga al menos un insumo con cantidad y costo válido (> 0).
     */
    tieneInsumosValidos() {
        const items = this.obtenerItemsRecetaFormulario();
        if (items.length === 0) return false;
        const insumos = this.obtenerInsumos();
        const prodTemp = new Producto({
            id: 0,
            nombre: 'validacion',
            receta: items
        });
        return prodTemp.calcularCostoIngredientes(insumos) > 0;
    }

    /**
     * Navega entre los pasos 1, 2 y 3 conservando todo el estado del formulario.
     * Exige al menos un insumo válido en el Paso 1 para avanzar al Paso 2 o Paso 3.
     */
    irAPaso(numeroPaso, opciones = {}) {
        const paso = Math.min(3, Math.max(1, parseInt(numeroPaso, 10) || 1));
        const insumosValidos = this.tieneInsumosValidos();

        if (paso > 1 && !opciones.forzar && !insumosValidos) {
            Store.toast('Primero registra al menos un insumo con cantidad en el Paso 1 para calcular los gastos proporcionales.', 'info');
            const primerSelect = document.querySelector('#receta-cuerpo .fila-insumo');
            if (primerSelect) primerSelect.focus();
            return false;
        }

        this.pasoActual = paso;

        document.querySelectorAll('.wizard-paso-panel').forEach(panel => {
            const panelPaso = parseInt(panel.dataset.pasoPanel, 10);
            panel.classList.toggle('activo', panelPaso === paso);
        });

        document.querySelectorAll('.wizard-step-tab').forEach(tab => {
            const tabPaso = parseInt(tab.dataset.paso, 10);
            const esActivo = tabPaso === paso;
            const estaCompletado = tabPaso < paso || (tabPaso === 1 && insumosValidos && paso > 1);
            tab.classList.toggle('activo', esActivo);
            tab.classList.toggle('completado', estaCompletado);
            tab.setAttribute('aria-selected', esActivo ? 'true' : 'false');
            if (esActivo) {
                tab.setAttribute('aria-current', 'step');
            } else {
                tab.removeAttribute('aria-current');
            }
        });

        const fill = document.getElementById('wizard-progress-fill');
        if (fill) {
            fill.style.width = paso === 1 ? '33.33%' : (paso === 2 ? '66.66%' : '100%');
        }

        const layout = document.getElementById('crear-layout');
        if (layout) {
            layout.classList.toggle('crear-layout--con-resumen', paso === 3);
        }

        this.actualizarResumen();
        return true;
    }

    /**
     * Calcula sugerencias de mano de obra, merma y empaque/desechable
     * estrictamente proporcionales al costo de los insumos del Paso 1.
     */
    calcularGastosProporcionalesSugeridos(costoIngredientesLote, unidades, nombreProducto = '') {
        const unidadesSeguras = Math.max(1, parseInt(unidades, 10) || 1);
        const costoLote = Math.max(0, Number(costoIngredientesLote) || 0);
        const costoInsumoUnidad = costoLote / unidadesSeguras;
        const pctGasto = this.porcentajeGastoProporcional || 25;

        const manoObraSugeridaLote = Math.max(0, Math.round(costoLote * (pctGasto / 100)));
        const manoObraSugeridaUnidad = Math.round(manoObraSugeridaLote / unidadesSeguras);

        const nombreNorm = String(nombreProducto || '').toLowerCase();
        const esHornoComplejo = /\b(empanada|buñuelo|bunuelo|churro|hojaldre|croissant|frito|fritura)\b/i.test(nombreNorm);
        const mermaSugeridaPct = costoLote > 0 ? (esHornoComplejo ? 5 : 3) : 0;

        let empaqueSugeridoUnidad = 0;
        if (costoInsumoUnidad <= 0) {
            empaqueSugeridoUnidad = 0;
        } else if (costoInsumoUnidad <= 500) {
            empaqueSugeridoUnidad = Math.max(10, Math.round((costoInsumoUnidad * 0.06) / 10) * 10);
        } else if (costoInsumoUnidad <= 2000) {
            empaqueSugeridoUnidad = Math.round((costoInsumoUnidad * 0.08) / 10) * 10;
        } else if (costoInsumoUnidad <= 6000) {
            empaqueSugeridoUnidad = 250;
        } else {
            empaqueSugeridoUnidad = 800;
        }

        const costoMermaUnidad = Math.round(costoInsumoUnidad * (mermaSugeridaPct / 100));
        const costoFinalUnidad = Math.round(costoInsumoUnidad + costoMermaUnidad + empaqueSugeridoUnidad + manoObraSugeridaUnidad);

        return {
            pctGasto,
            costoLote,
            unidades: unidadesSeguras,
            costoInsumoUnidad,
            manoObraSugeridaLote,
            manoObraSugeridaUnidad,
            mermaSugeridaPct,
            empaqueSugeridoUnidad,
            costoFinalUnidad
        };
    }

    /**
     * Aplica a los campos del Paso 2 los valores proporcionales sugeridos según el Paso 1.
     */
    aplicarGastosProporcionalesSugeridos() {
        const insumos = this.obtenerInsumos();
        const items = this.obtenerItemsRecetaFormulario();
        const unidades = Math.max(1, parseInt(document.getElementById('unidades-producidas')?.value, 10) || 1);
        const nombre = document.getElementById('producto-nombre')?.value.trim() || '';

        const prodTemp = new Producto({ id: 0, nombre: nombre || 'preview', unidadesProducidas: unidades, receta: items });
        const costoLote = prodTemp.calcularCostoIngredientes(insumos);

        if (costoLote <= 0) {
            Store.toast('Primero registra al menos un insumo en el Paso 1.', 'info');
            return;
        }

        const prop = this.calcularGastosProporcionalesSugeridos(costoLote, unidades, nombre);

        const inpMerma   = document.getElementById('porcentaje-merma');
        const inpEmpaque = document.getElementById('costo-empaque');
        const inpMano    = document.getElementById('costo-mano-obra');

        if (inpMerma)   inpMerma.value   = prop.mermaSugeridaPct;
        if (inpEmpaque) inpEmpaque.value = prop.empaqueSugeridoUnidad;
        if (inpMano)    inpMano.value    = prop.manoObraSugeridaLote;

        this.actualizarResumen();
        Store.toast(
            `Gastos proporcionales (${prop.pctGasto}%) aplicados: Mano de obra ${Store.fmt(prop.manoObraSugeridaLote)}, merma ${prop.mermaSugeridaPct}%, empaque ${Store.fmt(prop.empaqueSugeridoUnidad)}/ud.`
        );
    }

    /**
     * Evalúa los Pasos 1 y 2 para recomendar el modo de fijación de precio óptimo
     * (Margen % cuando ya se registraron gastos reales vs Multiplicador × cuando son bajos/cero).
     */
    calcularRecomendacionModo({ nombre, unidades, costoInsumoUnidad, gastoAdicionalUnidad, receta, merma, empaque, manoObra, insumos }) {
        const ratioGastos = costoInsumoUnidad > 0 ? (gastoAdicionalUnidad / costoInsumoUnidad) : 0;
        const recCat = (typeof AsesorFinanzas !== 'undefined' && typeof AsesorFinanzas.calcularMargenRecomendadoSegunProducto === 'function')
            ? AsesorFinanzas.calcularMargenRecomendadoSegunProducto(nombre, 1, unidades)
            : { margen: 40, razon: 'Margen equilibrado estándar.' };

        let modoRecomendado = 'margen';
        let tipoMargenSugerido = 'venta';
        let margenComp = recCat.margen;
        let multComp = unidades >= 10 ? 2.0 : 2.5;
        let razon = '';

        if (ratioGastos < 0.12) {
            modoRecomendado = 'multiplicador';
            razon = 'En el Paso 2 registraste pocos o cero gastos operativos adicionales. El modo Multiplicador × es mejor aquí porque multiplica el costo de tus insumos para absorber gastos ocultos no detallados y asegurar tu ganancia.';
        } else if (ratioGastos > 0.85) {
            modoRecomendado = 'margen';
            tipoMargenSugerido = 'costo';
            margenComp = 30;
            razon = 'Los gastos del Paso 2 ya tienen un peso alto sobre tus insumos. El modo Margen % sobre costo (30%) es mejor para no inflar en exceso el precio final y mantener competitividad.';
        } else {
            modoRecomendado = 'margen';
            tipoMargenSugerido = 'venta';
            margenComp = recCat.margen;
            razon = 'En el Paso 2 ya incluiste gastos operativos, merma y empaque proporcionales a tus insumos. El modo Margen % es ideal porque suma tu utilidad exacta sobre el costo real sin duplicar gastos.';
        }

        const construirPreview = (modo, valorModo, tipoMargen = 'costo') => {
            const p = new Producto({
                id: 0,
                nombre: nombre || 'preview',
                modo,
                valorModo,
                tipoMargen,
                unidadesProducidas: unidades,
                costoEmpaque: empaque,
                porcentajeMerma: merma,
                costoManoObra: manoObra,
                receta
            });
            return {
                precio: p.calcularPrecioVenta(insumos),
                ganancia: p.calcularGananciaNeta(insumos)
            };
        };

        const prevMargen = construirPreview('margen', margenComp, tipoMargenSugerido);
        const prevMult   = construirPreview('multiplicador', multComp, 'costo');

        return {
            modo: modoRecomendado,
            ratioGastos,
            margenComp,
            tipoMargenComp: tipoMargenSugerido,
            precioMargenComp: prevMargen.precio,
            gananciaMargenComp: prevMargen.ganancia,
            multComp,
            precioMultComp: prevMult.precio,
            gananciaMultComp: prevMult.ganancia,
            valorRecomendado: modoRecomendado === 'margen' ? margenComp : multComp,
            razon
        };
    }

    /**
     * Aplica el modo de precio recomendado (o el seleccionado desde las tarjetas comparativas del Paso 3).
     */
    aplicarModoRecomendado(modoForzado = null) {
        const rec = this.recomendacionModoActual;
        if (!rec) return;

        const modo = modoForzado || rec.modo;
        if (modo === 'margen') {
            const inpMargen = document.getElementById('input-margen');
            const slMargen  = document.getElementById('slider-margen');
            const selTipo   = document.getElementById('tipo-margen');
            if (inpMargen) inpMargen.value = rec.margenComp;
            if (slMargen)  slMargen.value  = Math.min(200, rec.margenComp);
            if (selTipo)   selTipo.value   = rec.tipoMargenComp;
            this.cambiarModo('margen');
            Store.toast(`Modo Margen % (${rec.margenComp}%) aplicado según tu receta y gastos.`);
        } else {
            const inpMult = document.getElementById('input-multiplicador');
            if (inpMult) inpMult.value = rec.multComp;
            this.cambiarModo('multiplicador');
            Store.toast(`Modo Multiplicador ×${rec.multComp} aplicado según tu receta y gastos.`);
        }
    }

    /**
     * Actualiza los textos, métricas proporcionales, alertas y recomendaciones de los 3 pasos.
     */
    actualizarTarjetasWizard({ nombre, unidades, receta, costoIngredientes, costoMerma, empaque, manoObra, merma, insumos }) {
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        const itemsCount = receta.length;
        const tieneInsumos = itemsCount > 0 && costoIngredientes > 0;
        const costoInsumoUnidad = costoIngredientes / unidades;
        const prop = this.calcularGastosProporcionalesSugeridos(costoIngredientes, unidades, nombre);

        // 1. Stepper y Paso 1
        setTxt(
            'stepper-resumen-1',
            tieneInsumos ? `${itemsCount} insumo(s) · ${Store.fmt(costoInsumoUnidad)}/ud` : 'Define receta y unidades'
        );
        setTxt(
            'paso-1-estado-texto',
            tieneInsumos
                ? `${itemsCount} insumo(s) · Lote ${Store.fmt(costoIngredientes)} (${Store.fmt(costoInsumoUnidad)}/ud)`
                : 'Agrega al menos 1 insumo para continuar'
        );

        // 2. Tarjeta de Gastos Proporcionales en Paso 2
        setTxt('gasto-ref-insumos-lote', Store.fmt(costoIngredientes));
        setTxt('gasto-ref-unidades', unidades);
        setTxt('gasto-ref-insumo-unidad', Store.fmt(costoInsumoUnidad));
        setTxt('rec-mano-obra-lote', Store.fmt(prop.manoObraSugeridaLote));
        setTxt('rec-mano-obra-unidad', `${Store.fmt(prop.manoObraSugeridaUnidad)} / unidad`);
        setTxt('rec-merma-pct', `${prop.mermaSugeridaPct}%`);
        setTxt('rec-empaque-unidad', Store.fmt(prop.empaqueSugeridoUnidad));
        setTxt('rec-costo-final-unidad', Store.fmt(prop.costoFinalUnidad));

        const gastoDirectoUnidad = (manoObra / unidades) + empaque;
        setTxt(
            'stepper-resumen-2',
            tieneInsumos
                ? (manoObra > 0 || empaque > 0 || merma > 0
                    ? `Merma ${merma}% · Gastos ${Store.fmt(gastoDirectoUnidad)}/ud`
                    : `Sugerido: ${Store.fmt(prop.manoObraSugeridaUnidad + prop.empaqueSugeridoUnidad)}/ud`)
                : 'Proporcional a tus insumos'
        );

        // Alerta de gasto desproporcionado (ej: pan de $300 con $4.000 de gastos)
        const alertaBox = document.getElementById('alerta-desproporcion-gastos');
        const alertaTxt = document.getElementById('alerta-desproporcion-texto');
        if (alertaBox && alertaTxt) {
            const umbralDesproporcion = Math.max(costoInsumoUnidad * 0.85, 100);
            if (tieneInsumos && gastoDirectoUnidad > umbralDesproporcion) {
                alertaBox.style.display = 'flex';
                alertaTxt.innerHTML = `<strong>Gasto desproporcionado:</strong> Estás sumando <strong>${Store.fmt(gastoDirectoUnidad)}/ud</strong> en gastos adicionales sobre solo <strong>${Store.fmt(costoInsumoUnidad)}/ud</strong> de insumos. Para este producto se recomienda cerca de <strong>${Store.fmt(prop.manoObraSugeridaUnidad + prop.empaqueSugeridoUnidad)}/ud</strong>.`;
            } else {
                alertaBox.style.display = 'none';
            }
        }

        // 3. Recomendación inteligente de Modo en Paso 3
        const gastoAdicionalTotalUnidad = Math.max(0, (costoMerma + (empaque * unidades) + manoObra) / unidades);
        const recModo = this.calcularRecomendacionModo({
            nombre,
            unidades,
            costoInsumoUnidad,
            gastoAdicionalUnidad: gastoAdicionalTotalUnidad,
            receta,
            merma,
            empaque,
            manoObra,
            insumos
        });
        this.recomendacionModoActual = recModo;

        const tituloRec = recModo.modo === 'margen'
            ? `Modo recomendado: Margen % (${recModo.margenComp}% ${recModo.tipoMargenComp === 'venta' ? 'sobre venta' : 'sobre costo'})`
            : `Modo recomendado: Multiplicador Comercial (×${recModo.multComp})`;
        setTxt('rec-modo-titulo', tituloRec);
        setTxt('rec-modo-razon', recModo.razon);

        setTxt('comp-margen-precio', Store.fmt(recModo.precioMargenComp));
        setTxt('comp-margen-meta', `Con ${recModo.margenComp}% · Ganancia +${Store.fmt(recModo.gananciaMargenComp)}/ud`);
        setTxt('comp-mult-precio', Store.fmt(recModo.precioMultComp));
        setTxt('comp-mult-meta', `Con ×${recModo.multComp} · Ganancia +${Store.fmt(recModo.gananciaMultComp)}/ud`);

        const cardCompMargen = document.getElementById('card-comp-margen');
        const cardCompMult   = document.getElementById('card-comp-multiplicador');
        const badgeCompM     = document.getElementById('comp-badge-margen');
        const badgeCompX     = document.getElementById('comp-badge-mult');
        const badgeTabM      = document.getElementById('badge-rec-margen');
        const badgeTabX      = document.getElementById('badge-rec-mult');

        const esMargenRec = recModo.modo === 'margen';
        cardCompMargen?.classList.toggle('recomendada', esMargenRec);
        cardCompMult?.classList.toggle('recomendada', !esMargenRec);
        if (badgeCompM) badgeCompM.textContent = esMargenRec ? 'Recomendado' : 'Alternativa';
        if (badgeCompX) badgeCompX.textContent = !esMargenRec ? 'Recomendado' : 'Alternativa';
        if (badgeTabM)  badgeTabM.style.display = esMargenRec ? 'inline-flex' : 'none';
        if (badgeTabX)  badgeTabX.style.display = !esMargenRec ? 'inline-flex' : 'none';

        setTxt('margen-sugerido-texto', `${recModo.margenComp}%`);
        setTxt(
            'stepper-resumen-3',
            tieneInsumos
                ? (esMargenRec ? `Sugerido: Margen ${recModo.margenComp}%` : `Sugerido: Mult. ×${recModo.multComp}`)
                : 'Modo recomendado y liquidación'
        );

        // Actualizar estado visual de completado en las pestañas del stepper
        const tab1 = document.getElementById('tab-paso-1');
        if (tab1) {
            tab1.classList.toggle('completado', tieneInsumos && this.pasoActual > 1);
        }
    }

    // ─── Filas de Ingredientes en la Receta ───────────────────────

    obtenerInsumos() {
        return Store.cargarInsumos();
    }

    actualizarOpcionesInsumos() {
        const insumos = this.obtenerInsumos();
        document.querySelectorAll('.receta-fila').forEach(fila => {
            const selInsumo = fila.querySelector('.fila-insumo');
            if (!selInsumo) return;
            const valorActual = selInsumo.value;

            const opciones = insumos.map(i =>
                `<option value="${i.id}" ${i.id == valorActual ? 'selected' : ''}>${Store.escapeHtml(i.nombre)} — ${Store.fmt(i.precio)}/${Store.escapeHtml(i.unidad)}</option>`
            ).join('');

            selInsumo.innerHTML = `
                <option value="" disabled ${!valorActual ? 'selected' : ''}>Seleccionar insumo</option>
                ${opciones}
            `;
        });
    }

    agregarFila(datosFila = null) {
        this.filaIdCounter++;
        const id   = this.filaIdCounter;
        const body = document.getElementById('receta-cuerpo');
        if (!body) return;

        const insumos  = this.obtenerInsumos();
        const opciones = insumos.map(i =>
            `<option value="${i.id}">${Store.escapeHtml(i.nombre)} — ${Store.fmt(i.precio)}/${Store.escapeHtml(i.unidad)}</option>`
        ).join('');

        const tr = document.createElement('tr');
        tr.className = 'receta-fila';
        tr.dataset.id = id;
        tr.innerHTML = `
            <td class="celda-insumo" data-label="Insumo">
                <select class="fila-insumo" aria-label="Seleccionar insumo para la receta">
                    <option value="" disabled selected>Seleccionar insumo</option>
                    ${opciones}
                </select>
            </td>
            <td class="celda-cantidad" data-label="Cantidad">
                <input type="number" class="fila-cantidad" value="${datosFila ? datosFila.cantidad : 1}" min="0" step="any" aria-label="Cantidad utilizada">
            </td>
            <td class="celda-unidad" data-label="Unidad (receta)">
                <select class="fila-unidad-receta" disabled aria-label="Unidad de medida en receta">
                    <option value="">—</option>
                </select>
            </td>
            <td class="col-subtotal celda-subtotal" data-label="Subtotal">
                <div class="celda-subtotal__contenido">
                    <span class="fila-subtotal">$0</span>
                    <small class="fila-equiv"></small>
                </div>
            </td>
            <td class="celda-eliminar">
                <button type="button" class="receta-fila__eliminar" aria-label="Eliminar insumo de la receta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </td>
        `;

        body.appendChild(tr);

        if (datosFila) {
            const selInsumo = tr.querySelector('.fila-insumo');
            selInsumo.value = datosFila.insumoId;
            this.alCambiarInsumo(selInsumo, id);
            const selUnidad = tr.querySelector('.fila-unidad-receta');
            if (selUnidad) selUnidad.value = datosFila.unidadReceta;
        }

        this.actualizarResumen();
    }

    eliminarFila(id) {
        const filas = document.querySelectorAll('.receta-fila');
        if (filas.length <= 1) {
            Store.toast('La receta debe tener al menos un insumo.', 'info');
            return;
        }
        document.querySelector(`.receta-fila[data-id="${id}"]`)?.remove();
        this.actualizarResumen();
    }

    alCambiarInsumo(select, filaId) {
        const fila      = document.querySelector(`.receta-fila[data-id="${filaId}"]`);
        if (!fila) return;

        const insumos   = this.obtenerInsumos();
        const insumo    = insumos.find(i => i.id === parseInt(select.value, 10));
        const selUnidad = fila.querySelector('.fila-unidad-receta');
        if (!insumo || !selUnidad) return;

        const compatibles = UnidadConverter.COMPATIBLES[insumo.unidad] || [insumo.unidad];
        let unidadDefault = insumo.unidad;
        if (['kg', 'arroba', 'tonelada'].includes(insumo.unidad) && compatibles.includes('g')) {
            unidadDefault = 'g';
        } else if (insumo.unidad === 'l' && compatibles.includes('ml')) {
            unidadDefault = 'ml';
        }

        selUnidad.innerHTML = compatibles.map(u =>
            `<option value="${u}" ${u === unidadDefault ? 'selected' : ''}>${UnidadConverter.ETIQUETAS[u] || u}</option>`
        ).join('');
        selUnidad.disabled = false;

        this.actualizarResumen();
    }

    // ─── Cálculos y Resumen en Tiempo Real ────────────────────────

    obtenerItemsRecetaFormulario() {
        const items = [];
        document.querySelectorAll('.receta-fila').forEach(fila => {
            const insumoId     = parseInt(fila.querySelector('.fila-insumo')?.value, 10);
            const cantidad     = parseFloat(fila.querySelector('.fila-cantidad')?.value) || 0;
            const unidadReceta = fila.querySelector('.fila-unidad-receta')?.value || '';
            if (insumoId && cantidad > 0 && unidadReceta) {
                items.push(new ItemReceta({ insumoId, cantidad, unidadReceta }));
            }
        });
        return items;
    }

    actualizarResumen() {
        const insumos = this.obtenerInsumos();

        // 1. Calcular subtotales por fila individual
        document.querySelectorAll('.receta-fila').forEach(fila => {
            const insumoId     = parseInt(fila.querySelector('.fila-insumo')?.value, 10);
            const cantidad     = parseFloat(fila.querySelector('.fila-cantidad')?.value) || 0;
            const unidadReceta = fila.querySelector('.fila-unidad-receta')?.value || '';
            const subtotalEl   = fila.querySelector('.fila-subtotal');
            const equivEl      = fila.querySelector('.fila-equiv');

            if (!insumoId || cantidad <= 0 || !unidadReceta) {
                if (subtotalEl) subtotalEl.textContent = '$0';
                if (equivEl)    equivEl.textContent    = '';
                return;
            }

            const insumo = insumos.find(i => i.id === insumoId);
            const item   = new ItemReceta({ insumoId, cantidad, unidadReceta });
            const res    = item.calcularCosto(insumo);

            if (subtotalEl) subtotalEl.textContent = Store.fmt(res.costo);
            if (equivEl) {
                if (res.costo >= 150000 && ['kg', 'l', 'arroba', 'tonelada'].includes(unidadReceta)) {
                    const targetUnit = unidadReceta === 'l' ? 'ml' : 'g';
                    equivEl.innerHTML = `${Store.escapeHtml(res.equiv || '')}
                        <span class="fila-sanity-warn">
                            Costo inusual en ${Store.escapeHtml(unidadReceta)}.
                            <button type="button" class="btn-corregir-unidad-fila" data-target-unit="${targetUnit}">Cambiar a ${targetUnit}</button>
                        </span>`;
                } else {
                    equivEl.textContent = res.equiv || '';
                }
            }
        });

        // 2. Extraer parámetros del formulario
        const nombre     = document.getElementById('producto-nombre')?.value.trim() || '';
        const unidades   = Math.max(1, parseInt(document.getElementById('unidades-producidas')?.value, 10) || 1);
        const merma      = Math.max(0, parseFloat(document.getElementById('porcentaje-merma')?.value) || 0);
        const empaque    = Math.max(0, parseFloat(document.getElementById('costo-empaque')?.value) || 0);
        const manoObra   = Math.max(0, parseFloat(document.getElementById('costo-mano-obra')?.value) || 0);
        const tipoMargen = document.getElementById('tipo-margen')?.value || 'venta';
        const receta     = this.obtenerItemsRecetaFormulario();

        const valorModo = this.modoPrecio === 'margen'
            ? (parseFloat(document.getElementById('input-margen')?.value) || 0)
            : (parseFloat(document.getElementById('input-multiplicador')?.value) || 1);

        // 3. Construir modelo Producto temporal para delegar los cálculos financieros
        const productoTemp = new Producto({
            id: 0,
            nombre: nombre || 'preview',
            modo: this.modoPrecio,
            valorModo,
            tipoMargen,
            unidadesProducidas: unidades,
            costoEmpaque: empaque,
            porcentajeMerma: merma,
            costoManoObra: manoObra,
            receta
        });

        const costoIngredientes = productoTemp.calcularCostoIngredientes(insumos);
        const costoMerma        = productoTemp.calcularCostoMerma(insumos);
        const costoTotal        = productoTemp.calcularCostoTotal(insumos);
        const costoUnidad       = productoTemp.calcularCostoUnidad(insumos);
        const precioVenta       = productoTemp.calcularPrecioVenta(insumos);
        const gananciaUnidad    = productoTemp.calcularGananciaNeta(insumos);

        const configGastos        = (typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : (typeof Store.cargarConfigGastos === 'function' ? Store.cargarConfigGastos() : {})) || {};
        const impoconsumoPct      = configGastos.impoconsumoPct ?? 8;
        const comisionDeliveryPct = Number(configGastos.comisionDeliveryPct ?? 25);
        const precioConImpuesto   = Math.round(precioVenta * (1 + (impoconsumoPct / 100)));
        const impoconsumoMonto    = Math.max(0, precioConImpuesto - precioVenta);
        const precioDelivery      = (typeof AsesorFinanzas !== 'undefined' && typeof AsesorFinanzas.calcularPrecioAppDelivery === 'function')
            ? AsesorFinanzas.calcularPrecioAppDelivery(precioVenta, comisionDeliveryPct)
            : Math.round(precioVenta / (1 - (comisionDeliveryPct / 100)));

        // 4. Reflejar en la UI
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setTxt('costo-unidad',            Store.fmt(costoUnidad));
        setTxt('res-costo-ingredientes',  Store.fmt(costoIngredientes));

        // Filas condicionales en el resumen
        const fMerma = document.getElementById('res-fila-merma');
        if (fMerma) {
            fMerma.style.display = merma > 0 ? 'flex' : 'none';
            setTxt('res-pct-merma', `${merma}%`);
            setTxt('res-costo-merma', `+${Store.fmt(costoMerma)}`);
        }

        const fEmpaque = document.getElementById('res-fila-empaque');
        if (fEmpaque) {
            fEmpaque.style.display = empaque > 0 ? 'flex' : 'none';
            setTxt('res-costo-empaque', `+${Store.fmt(empaque * unidades)}`);
        }

        const fMano = document.getElementById('res-fila-mano-obra');
        if (fMano) {
            fMano.style.display = manoObra > 0 ? 'flex' : 'none';
            setTxt('res-costo-mano-obra', `+${Store.fmt(manoObra)}`);
        }

        setTxt('res-costo-total',          Store.fmt(costoTotal));
        setTxt('res-unidades',             unidades);
        setTxt('res-costo-unidad',         Store.fmt(costoUnidad));
        setTxt('res-ganancia-unidad',      `+${Store.fmt(gananciaUnidad)}`);
        setTxt('res-precio-venta',         Store.fmt(precioVenta));
        setTxt('res-precio-impoconsumo',   Store.fmt(precioConImpuesto));
        setTxt('res-impoconsumo-monto',    Store.fmt(impoconsumoMonto));
        setTxt('res-precio-delivery',      Store.fmt(precioDelivery));
        setTxt('res-sugerido-delivery',    Store.fmt(precioDelivery));
        setTxt('res-delivery-label-pct',   `(Apps ${comisionDeliveryPct}% com.):`);

        if (this.modoPrecio === 'margen') {
            const etiquetaModo = tipoMargen === 'venta'
                ? `Margen ${valorModo}% (s/venta)`
                : `Margen ${valorModo}% (s/costo)`;
            setTxt('res-modo', etiquetaModo);
        } else {
            setTxt('res-modo', `Multiplicador ×${valorModo}`);
        }

        // Texto explicativo del método de cálculo
        const infoMargen = document.getElementById('tipo-margen-info');
        if (infoMargen) {
            infoMargen.textContent = tipoMargen === 'venta'
                ? `Ej: si cuesta $6.000 y quieres ${valorModo}% sobre venta, el precio garantiza que el ${valorModo}% de cada peso cobrado sea ganancia.`
                : `Mark-up: si el costo es $1.000 y aplicas ${valorModo}%, el precio final será $${Math.round(1000 * (1 + valorModo / 100)).toLocaleString('es-CO')}.`;
        }

        // Estado y advertencia de Gastos Fijos en unidades individuales
        const badgeGastos = document.getElementById('desglose-gastos-ocultos-badge');
        if (badgeGastos) {
            const cfg = typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : (Store.cargarConfigGastos ? Store.cargarConfigGastos() : {});
            const cuotaLote = cfg?.cuotaFijaTotalPorLote || 28035;
            const cuotaPorcionSugerida = Math.round(cuotaLote / 10);
            const txtPill = document.getElementById('txt-preset-porcion');
            if (txtPill) txtPill.textContent = Store.fmt(cuotaPorcionSugerida);

            if (manoObra <= 0) {
                badgeGastos.style.display = 'none';
                badgeGastos.innerHTML = '';
            } else if (unidades === 1 && manoObra >= 15000) {
                badgeGastos.style.display = 'block';
                badgeGastos.innerHTML = `
                    <div class="aviso-cuota-unitaria">
                        <div class="aviso-cuota-unitaria__info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span><strong>Alerta (1 sola unidad):</strong> Tienes cargada la cuota de lote completo (<strong>${Store.fmt(manoObra)}</strong>) a 1 sola unidad. Si es un plato, café o porción, el precio quedará inflado.</span>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <button type="button" class="btn-prorratear-inline" id="btn-prorratear-inline">
                                Prorratear porción (${Store.fmt(cuotaPorcionSugerida)})
                            </button>
                            <button type="button" class="costos-preset-btn" id="btn-ver-modal-condicion" style="font-size:11px; padding:4px 8px; min-height:auto;">
                                Opciones
                            </button>
                        </div>
                    </div>`;
                document.getElementById('btn-prorratear-inline')?.addEventListener('click', () => {
                    const inputMano = document.getElementById('costo-mano-obra');
                    if (inputMano) {
                        inputMano.value = cuotaPorcionSugerida;
                        this.actualizarResumen();
                        Store.toast(`Cuota prorrateada a ${Store.fmt(cuotaPorcionSugerida)}/porción individual`);
                    }
                });
                document.getElementById('btn-ver-modal-condicion')?.addEventListener('click', () => {
                    this.mostrarModalCondicionGastosFijos({
                        cuotaLote,
                        cuotaPorcion: cuotaPorcionSugerida,
                        onSeleccionar: (monto, tipo) => {
                            const inputMano = document.getElementById('costo-mano-obra');
                            if (inputMano) {
                                inputMano.value = monto;
                                this.actualizarResumen();
                                Store.toast(tipo === 'porcion' ? `Cuota individual aplicada: ${Store.fmt(monto)}` : `Cuota de lote completo aplicada: ${Store.fmt(monto)}`);
                            }
                        }
                    });
                });
            } else if (unidades === 1) {
                badgeGastos.style.display = 'block';
                badgeGastos.innerHTML = `<span style="color:var(--bn-text-secondary); font-size:12px;">Cuota por porción individual aplicada: <strong>${Store.fmt(manoObra)}/unidad</strong>.</span>`;
            } else {
                const porUnidad = Math.round(manoObra / unidades);
                badgeGastos.style.display = 'block';
                badgeGastos.innerHTML = `<span style="color:var(--bn-text-secondary); font-size:12px;">Cuota de lote: <strong>${Store.fmt(manoObra)}</strong> (${Store.fmt(porUnidad)} por unidad en tanda de ${unidades}).</span>`;
            }
        }

        // 5. Actualizar tarjetas de recomendación proporcional, alertas y modo sugerido del Wizard
        this.actualizarTarjetasWizard({
            nombre,
            unidades,
            receta,
            costoIngredientes,
            costoMerma,
            empaque,
            manoObra,
            merma,
            insumos
        });
    }

    // ─── Guardar Producto en MySQL y Store ─────────────────────────

    async guardarProducto() {
        const nombre     = document.getElementById('producto-nombre')?.value.trim();
        const unidades   = Math.max(1, parseInt(document.getElementById('unidades-producidas')?.value, 10) || 1);
        const merma      = Math.max(0, parseFloat(document.getElementById('porcentaje-merma')?.value) || 0);
        const empaque    = Math.max(0, parseFloat(document.getElementById('costo-empaque')?.value) || 0);
        const manoObra   = Math.max(0, parseFloat(document.getElementById('costo-mano-obra')?.value) || 0);
        const tipoMargen = document.getElementById('tipo-margen')?.value || 'venta';
        const receta     = this.obtenerItemsRecetaFormulario();

        if (!nombre) {
            this.irAPaso(1, { forzar: true });
            Store.toast('Ingresa el nombre del producto.', 'error');
            document.getElementById('producto-nombre')?.focus();
            return;
        }

        if (receta.length === 0) {
            this.irAPaso(1, { forzar: true });
            Store.toast('Agrega al menos un insumo con cantidad válida a la receta.', 'error');
            return;
        }

        const valorModo = this.modoPrecio === 'margen'
            ? (parseFloat(document.getElementById('input-margen')?.value) || 0)
            : (parseFloat(document.getElementById('input-multiplicador')?.value) || 1);

        const botonesGuardar = document.querySelectorAll('.btn-guardar');
        botonesGuardar.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Guardando receta...';
        });

        try {
            const prodTemp = new Producto({
                id:                  this.productoEditandoId || 0,
                nombre,
                modo:                this.modoPrecio,
                valorModo,
                tipoMargen,
                unidadesProducidas:  unidades,
                costoEmpaque:        empaque,
                porcentajeMerma:     merma,
                costoManoObra:       manoObra,
                receta
            });
            const precioVentaCalculado = prodTemp.calcularPrecioVenta(this.obtenerInsumos());

            const datosProducto = {
                id:                  this.productoEditandoId,
                nombre,
                modo:                this.modoPrecio,
                valorModo,
                tipoMargen,
                unidadesProducidas:  unidades,
                costoEmpaque:        empaque,
                porcentajeMerma:     merma,
                costoManoObra:       manoObra,
                precioVentaAnterior: precioVentaCalculado,
                receta:              receta.map(r => ({
                    insumoId:     r.insumoId,
                    cantidad:     r.cantidad,
                    unidadReceta: r.unidadReceta
                }))
            };

            const res = await Store.guardarProductoAsync(datosProducto);
            if (res.success) {
                Store.toastDiferido(this.productoEditandoId ? `Producto "${nombre}" actualizado con éxito` : `Producto "${nombre}" creado con éxito`);
                window.location.href = 'productos.html';
            } else {
                Store.toast(res.mensaje || 'Error al guardar el producto.', 'error');
            }
        } finally {
            botonesGuardar.forEach(btn => {
                btn.disabled = false;
                btn.textContent = this.productoEditandoId ? 'Guardar cambios' : 'Guardar producto';
            });
        }
    }

    cargarProductoSiEsEdicion() {
        const params  = new URLSearchParams(window.location.search);
        const idParam = parseInt(params.get('id'), 10);
        if (!idParam) return false;

        const producto = Store.cargarProductos().find(p => p.id === idParam);
        if (!producto) return false;

        this.productoEditandoId = producto.id;

        const titulo = document.querySelector('.contenido__titulo');
        if (titulo) titulo.textContent = 'Editar producto';
        document.querySelectorAll('.btn-guardar, .wizard-btn-guardar').forEach(btn => {
            btn.textContent = 'Guardar cambios';
        });

        document.getElementById('producto-nombre').value     = producto.nombre;
        document.getElementById('unidades-producidas').value = producto.unidadesProducidas || 1;

        const inpMerma = document.getElementById('porcentaje-merma');
        if (inpMerma) inpMerma.value = producto.porcentajeMerma || 0;

        const inpEmpaque = document.getElementById('costo-empaque');
        if (inpEmpaque) inpEmpaque.value = producto.costoEmpaque || 0;

        const inpMano = document.getElementById('costo-mano-obra');
        if (inpMano) inpMano.value = producto.costoManoObra || 0;

        const selTipoMargen = document.getElementById('tipo-margen');
        if (selTipoMargen) selTipoMargen.value = producto.tipoMargen || 'venta';

        if (producto.modo === 'multiplicador') {
            this.cambiarModo('multiplicador');
            document.getElementById('input-multiplicador').value = producto.valorModo || 2.0;
        } else {
            this.cambiarModo('margen');
            document.getElementById('input-margen').value  = producto.valorModo || 30;
            document.getElementById('slider-margen').value = Math.min(200, producto.valorModo || 30);
        }

        if (producto.receta && producto.receta.length > 0) {
            document.getElementById('receta-cuerpo').innerHTML = '';
            producto.receta.forEach(item => this.agregarFila(item));
            this.actualizarResumen();
            return true;
        }

        return false;
    }

    configurarHerramientasManualesCostos() {
        // 1. Píldoras y presets directos de Merma, Empaque y Mano de obra
        document.querySelectorAll('.costos-preset-btn[data-campo]').forEach(btn => {
            btn.addEventListener('click', () => {
                const campoId = btn.dataset.campo;
                const valor = parseFloat(btn.dataset.valor);
                const input = document.getElementById(campoId);
                if (input && !isNaN(valor)) {
                    input.value = valor;
                    this.actualizarResumen();
                    const etiqueta = campoId === 'porcentaje-merma' ? `${valor}%` : Store.fmt(valor);
                    Store.toast(`Valor aplicado: ${etiqueta}`);
                }
            });
        });

        // 2. Presets directos de Margen %
        document.querySelectorAll('.costos-preset-btn[data-margen]').forEach(btn => {
            btn.addEventListener('click', () => {
                const m = parseFloat(btn.dataset.margen);
                if (!isNaN(m)) {
                    const sl = document.getElementById('slider-margen');
                    const inp = document.getElementById('input-margen');
                    if (sl) sl.value = Math.min(200, m);
                    if (inp) inp.value = m;
                    this.actualizarResumen();
                    Store.toast(`Margen objetivo fijado al ${m}%`);
                }
            });
        });

        // 3. Presets directos de Multiplicador ×
        document.querySelectorAll('.costos-preset-btn[data-multiplicador]').forEach(btn => {
            btn.addEventListener('click', () => {
                const mult = parseFloat(btn.dataset.multiplicador);
                if (!isNaN(mult)) {
                    const inp = document.getElementById('input-multiplicador');
                    if (inp) {
                        inp.value = mult;
                        this.actualizarResumen();
                        Store.toast(`Multiplicador comercial fijado a ×${mult}`);
                    }
                }
            });
        });

        // 4. Botón: Cargar cuota sugerida desde Gastos Fijos guardados del negocio
        document.getElementById('btn-cargar-gastos-fijos-form')?.addEventListener('click', () => {
            const cfg = typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : (Store.cargarConfigGastos ? Store.cargarConfigGastos() : {});
            const arriendo = Number(cfg.arriendoMensual) || 0;
            const recibos = Number(cfg.recibosMensuales) || 0;
            const trab = Math.max(0, Number(cfg.numTrabajadores) || 0);
            const sal = Number(cfg.salarioTrabajador) || 0;
            const nominaTotal = Number(cfg.nominaMensualTotal) || (trab * sal);
            const lotesMes = Math.max(1, Number(cfg.lotesMensualesEstimados) || 100);

            const cuotaLote = cfg.cuotaFijaTotalPorLote || Math.round((arriendo + recibos + nominaTotal) / lotesMes);
            if (!cuotaLote || cuotaLote <= 0) {
                Store.toast('Aún no has configurado gastos fijos ni nómina. Abriendo configuración...', 'info');
                if (typeof Store.abrirModalConfigGastos === 'function') Store.abrirModalConfigGastos();
                return;
            }
            const inputMano = document.getElementById('costo-mano-obra');
            if (!inputMano) return;

            const unidades = Math.max(1, parseInt(document.getElementById('unidades-producidas')?.value, 10) || 1);
            inputMano.value = cuotaLote;
            this.actualizarResumen();

            if (unidades === 1) {
                const cuotaPorcion = Math.round(cuotaLote / 10);
                Store.toast(`Cuota de lote cargada (${Store.fmt(cuotaLote)}). Si es un plato o porción individual, usa "Prorratear porción" abajo (${Store.fmt(cuotaPorcion)}).`);
            } else {
                const cuotaUnitaria = Math.round(cuotaLote / unidades);
                Store.toast(`Cuota calculada: ${Store.fmt(cuotaLote)}/lote (${Store.fmt(cuotaUnitaria)} por unidad en lote de ${unidades})`);
            }
        });

        // 4b. Botón: Cargar cuota prorrateada por porción individual
        document.getElementById('btn-cargar-cuota-porcion')?.addEventListener('click', () => {
            const cfg = typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : (Store.cargarConfigGastos ? Store.cargarConfigGastos() : {});
            const cuotaLote = cfg.cuotaFijaTotalPorLote || 28035;
            const cuotaPorcion = Math.round(cuotaLote / 10);
            const inputMano = document.getElementById('costo-mano-obra');
            if (inputMano) {
                inputMano.value = cuotaPorcion;
                this.actualizarResumen();
                Store.toast(`Cuota individual aplicada: ${Store.fmt(cuotaPorcion)}/porción (prorrateo de gastos fijos)`);
            }
        });

        // 5. Toggle de la calculadora manual detallada
        const btnToggleCalc = document.getElementById('btn-toggle-calc-mano-obra');
        const boxCalc = document.getElementById('calc-mano-obra-box');
        btnToggleCalc?.addEventListener('click', () => {
            if (!boxCalc) return;
            const visible = boxCalc.style.display !== 'none';
            boxCalc.style.display = visible ? 'none' : 'block';
            if (!visible) {
                this.recalcularDetalleManualManoObra();
            }
        });

        // 6. Steppers y pills de la calculadora manual
        document.querySelectorAll('.calc-pill[data-horas]').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.calc-pill').forEach(p => p.classList.remove('calc-pill--active'));
                pill.classList.add('calc-pill--active');
                const inp = document.getElementById('calc-horas-lote');
                if (inp) inp.value = pill.dataset.horas;
                this.recalcularDetalleManualManoObra();
            });
        });

        ['calc-horas-lote', 'calc-tarifa-hora', 'calc-servicio-energia', 'calc-arriendo-lote'].forEach(id => {
            const el = document.getElementById(id);
            el?.addEventListener('input', () => this.recalcularDetalleManualManoObra());
            el?.addEventListener('change', () => this.recalcularDetalleManualManoObra());
        });

        // 7. Botón aplicar cálculo manual al lote
        document.getElementById('btn-aplicar-calc-mano-obra')?.addEventListener('click', () => {
            const total = this.recalcularDetalleManualManoObra();
            const inputMano = document.getElementById('costo-mano-obra');
            if (inputMano) {
                inputMano.value = total;
                this.actualizarResumen();
                Store.toast(`Se aplicaron ${Store.fmt(total)} de mano de obra y costos ocultos a la receta.`);
            }
        });
    }

    recalcularDetalleManualManoObra() {
        const horas = Math.max(0, parseFloat(document.getElementById('calc-horas-lote')?.value) || 0);
        const tarifa = Math.max(0, parseFloat(document.getElementById('calc-tarifa-hora')?.value) || 0);
        const energia = Math.max(0, parseFloat(document.getElementById('calc-servicio-energia')?.value) || 0);
        const arriendo = Math.max(0, parseFloat(document.getElementById('calc-arriendo-lote')?.value) || 0);

        const subtotalTrabajo = Math.round(horas * tarifa);
        const total = subtotalTrabajo + energia + arriendo;

        const elPreview = document.getElementById('calc-total-preview-val');
        if (elPreview) elPreview.textContent = Store.fmt(total);
        return total;
    }

    mostrarModalCondicionGastosFijos({ cuotaLote, cuotaPorcion, onSeleccionar }) {
        document.getElementById('modal-condicion-gastos')?.remove();
        const backdrop = document.createElement('div');
        backdrop.id = 'modal-condicion-gastos';
        backdrop.className = 'costia-confirm-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('aria-labelledby', 'cond-modal-titulo');

        backdrop.innerHTML = `
            <div class="modal-condicion-card">
                <div class="modal-condicion-header">
                    <div class="modal-condicion-icono">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </div>
                    <div>
                        <span class="modal-condicion-badge">Ajuste Inteligente de Gastos</span>
                        <h3 id="cond-modal-titulo" class="modal-condicion-titulo">Receta de 1 unidad detectada</h3>
                        <p class="modal-condicion-sub">Tienes una cuota fija de <strong>${Store.fmt(cuotaLote)}/lote</strong> configurada. Para evitar un precio inflado en un solo producto, elige cómo imputarla:</p>
                    </div>
                </div>

                <div class="modal-condicion-opciones">
                    <button type="button" class="modal-gasto-opcion modal-gasto-opcion--recomendada" id="btn-opt-porcion">
                        <div class="modal-gasto-opcion__header">
                            <strong>Porción o plato individual</strong>
                            <span class="badge-recomendado">Recomendado</span>
                        </div>
                        <div class="modal-gasto-opcion__valor">${Store.fmt(cuotaPorcion)} <small>/ unidad</small></div>
                        <p class="modal-gasto-opcion__desc">Prorratea los gastos fijos entre 10 porciones estándar de producción. Ideal para cafés, sándwiches, platos a la carta, bebidas o porciones individuales.</p>
                    </button>

                    <button type="button" class="modal-gasto-opcion" id="btn-opt-lote">
                        <div class="modal-gasto-opcion__header">
                            <strong>Lote de pieza grande / Torta completa</strong>
                            <span class="badge-opcion-secundaria">Tanda completa</span>
                        </div>
                        <div class="modal-gasto-opcion__valor">${Store.fmt(cuotaLote)} <small>/ pieza</small></div>
                        <p class="modal-gasto-opcion__desc">Carga la cuota de lote completa a este único producto. Úsalo si es una torta decorada entera, banquete o producto de alta dedicación que consume toda la tanda.</p>
                    </button>
                </div>

                <div class="costia-confirm-acciones" style="margin-top:4px;">
                    <button type="button" class="btn-confirm-cancelar" id="btn-cond-cancelar">Cancelar</button>
                </div>
            </div>`;

        document.body.appendChild(backdrop);
        requestAnimationFrame(() => {
            backdrop.classList.add('activo');
            document.getElementById('btn-opt-porcion')?.focus();
        });

        const cerrar = () => {
            backdrop.classList.remove('activo');
            setTimeout(() => backdrop.remove(), 200);
        };

        document.getElementById('btn-opt-porcion')?.addEventListener('click', () => {
            cerrar();
            if (typeof onSeleccionar === 'function') onSeleccionar(cuotaPorcion, 'porcion');
        });
        document.getElementById('btn-opt-lote')?.addEventListener('click', () => {
            cerrar();
            if (typeof onSeleccionar === 'function') onSeleccionar(cuotaLote, 'lote');
        });
        document.getElementById('btn-cond-cancelar')?.addEventListener('click', cerrar);
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cerrar(); });

        const manejarTeclado = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', manejarTeclado);
                cerrar();
            }
        };
        document.addEventListener('keydown', manejarTeclado);
    }
}

// Instancia global del controlador
const controladorCrear = new CrearProductoController();
window.controladorCrear = controladorCrear;

// Funciones puente para mantener compatibilidad con scripts externos
window.irAPaso                = (paso, opts) => controladorCrear.irAPaso(paso, opts);
window.cambiarModo            = (modo) => controladorCrear.cambiarModo(modo);
window.sincronizarMargen      = (orig) => controladorCrear.sincronizarMargen(orig);
window.aplicarMargenSugerido  = () => controladorCrear.aplicarMargenSugerido();
window.mostrarPreguntas       = (cat) => controladorCrear.mostrarPreguntas(cat);
window.actualizarMultiplicador = () => controladorCrear.actualizarMultiplicador();
window.actualizarResumen      = () => controladorCrear.actualizarResumen();
window.guardarProducto        = () => controladorCrear.guardarProducto();
window.eliminarFila           = (id) => controladorCrear.eliminarFila(id);
window.alCambiarInsumo        = (sel, id) => controladorCrear.alCambiarInsumo(sel, id);

// Registro limpio de Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

document.addEventListener('DOMContentLoaded', () => {
    controladorCrear.iniciar();
});
