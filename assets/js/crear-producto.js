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
        this.modoPrecio         = 'margen';
        this.filaIdCounter      = 0;
        this.productoEditandoId = null;
    }

    iniciar() {
        this.configurarEventosGenerales();
        const editando = this.cargarProductoSiEsEdicion();
        if (!editando) {
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

    configurarEventosGenerales() {
        // 1. Receta y cantidades
        document.getElementById('btn-agregar')?.addEventListener('click', () => this.agregarFila());
        document.getElementById('unidades-producidas')?.addEventListener('input', () => this.actualizarResumen());

        // 2. Costos adicionales
        document.getElementById('porcentaje-merma')?.addEventListener('input', () => this.actualizarResumen());
        document.getElementById('costo-empaque')?.addEventListener('input', () => this.actualizarResumen());
        document.getElementById('costo-mano-obra')?.addEventListener('input', () => this.actualizarResumen());
        this.configurarHerramientasManualesCostos();

        // 3. Modos de precio y tabs estilo Terminal Pro
        document.getElementById('tab-margen')?.addEventListener('click', () => this.cambiarModo('margen'));
        document.getElementById('tab-multiplicador')?.addEventListener('click', () => this.cambiarModo('multiplicador'));

        // 4. Panel Margen %
        document.querySelector('.sugerencia__aplicar')?.addEventListener('click', () => this.aplicarMargenSugerido());
        document.getElementById('tipo-margen')?.addEventListener('change', () => this.actualizarResumen());
        document.getElementById('slider-margen')?.addEventListener('input', () => this.sincronizarMargen('slider'));
        document.getElementById('input-margen')?.addEventListener('input', () => this.sincronizarMargen('input'));

        // 5. Panel Multiplicador ×
        document.getElementById('input-multiplicador')?.addEventListener('input', () => this.actualizarResumen());
        document.getElementById('btn-abrir-cfg-desde-receta')?.addEventListener('click', () => {
            window.location.href = 'configuracion.html#seccion-precios';
        });

        // 6. Asesor IA y triggers
        const abrirChatAsesor = () => {
            if (window.asesorAgente && typeof window.asesorAgente.abrirChat === 'function') {
                window.asesorAgente.abrirChat();
            }
        };
        document.getElementById('btn-abrir-asesor')?.addEventListener('click', abrirChatAsesor);
        document.getElementById('btn-abrir-asesor-precio')?.addEventListener('click', abrirChatAsesor);
        document.getElementById('btn-fab-asesor')?.addEventListener('click', abrirChatAsesor);

        // Tooltip del botón flotante
        document.getElementById('btn-cerrar-tooltip-fab')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const tooltip = document.getElementById('tooltip-fab-asesor');
            if (tooltip) tooltip.style.display = 'none';
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
        const input  = document.getElementById('input-margen');
        const slider = document.getElementById('slider-margen');
        if (input)  input.value  = 30;
        if (slider) slider.value = 30;
        this.actualizarResumen();
    }

    mostrarPreguntas(categoria) {
        // Compatibilidad: el perfil de negocio se gestiona ahora en Configuración
        this.actualizarMultiplicador();
    }

    actualizarMultiplicador() {
        this.actualizarResumen();
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
        selUnidad.innerHTML = compatibles.map(u =>
            `<option value="${u}" ${u === insumo.unidad ? 'selected' : ''}>${UnidadConverter.ETIQUETAS[u] || u}</option>`
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
            if (equivEl)    equivEl.textContent    = res.equiv || '';
        });

        // 2. Extraer parámetros del formulario
        const unidades   = Math.max(1, parseInt(document.getElementById('unidades-producidas')?.value, 10) || 1);
        const merma      = Math.max(0, parseFloat(document.getElementById('porcentaje-merma')?.value) || 0);
        const empaque    = Math.max(0, parseFloat(document.getElementById('costo-empaque')?.value) || 0);
        const manoObra   = Math.max(0, parseFloat(document.getElementById('costo-mano-obra')?.value) || 0);
        const tipoMargen = document.getElementById('tipo-margen')?.value || 'costo';

        const valorModo = this.modoPrecio === 'margen'
            ? (parseFloat(document.getElementById('input-margen')?.value) || 0)
            : (parseFloat(document.getElementById('input-multiplicador')?.value) || 1);

        // 3. Construir modelo Producto temporal para delegar los cálculos financieros
        const productoTemp = new Producto({
            id: 0,
            nombre: 'preview',
            modo: this.modoPrecio,
            valorModo,
            tipoMargen,
            unidadesProducidas: unidades,
            costoEmpaque: empaque,
            porcentajeMerma: merma,
            costoManoObra: manoObra,
            receta: this.obtenerItemsRecetaFormulario()
        });

        const costoIngredientes = productoTemp.calcularCostoIngredientes(insumos);
        const costoMerma        = productoTemp.calcularCostoMerma(insumos);
        const costoTotal        = productoTemp.calcularCostoTotal(insumos);
        const costoUnidad       = productoTemp.calcularCostoUnidad(insumos);
        const precioVenta       = productoTemp.calcularPrecioVenta(insumos);
        const gananciaUnidad    = productoTemp.calcularGananciaNeta(insumos);

        const configGastos      = (typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : (typeof Store.cargarConfigGastos === 'function' ? Store.cargarConfigGastos() : {})) || {};
        const impoconsumoPct    = configGastos.impoconsumoPct ?? 8;
        const precioConImpuesto = Math.round(precioVenta * (1 + (impoconsumoPct / 100)));
        const precioDelivery    = (typeof AsesorFinanzas !== 'undefined' && typeof AsesorFinanzas.calcularPrecioAppDelivery === 'function')
            ? AsesorFinanzas.calcularPrecioAppDelivery(precioVenta, 25)
            : Math.round(precioVenta / 0.75);

        // 4. Reflejar en la UI
        const setTxt = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setTxt('costo-unidad',            Store.fmt(costoUnidad));
        setTxt('res-costo-ingredientes',  Store.fmt(costoIngredientes));

        // Filas condicionales en el resumen de liquidación
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

        setTxt('res-costo-total',        Store.fmt(costoTotal));
        setTxt('res-unidades',           unidades);
        setTxt('res-costo-unidad',       Store.fmt(costoUnidad));
        setTxt('res-ganancia-unidad',    `+${Store.fmt(gananciaUnidad)}`);
        setTxt('res-precio-venta',       Store.fmt(precioVenta));
        setTxt('res-precio-impoconsumo', Store.fmt(precioConImpuesto));
        setTxt('res-impoconsumo-monto',  Store.fmt(precioConImpuesto));
        setTxt('res-precio-delivery',    Store.fmt(precioDelivery));
        setTxt('res-sugerido-delivery',  Store.fmt(precioDelivery));

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
                ? `Margen Comercial: Tu ganancia será el ${valorModo}% del precio de venta final.`
                : `Mark-up estándar: Tu ganancia será el ${valorModo}% calculado sobre el costo por unidad.`;
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
    }

    // ─── Guardar Producto en MySQL y Store ─────────────────────────

    async guardarProducto() {
        const nombre     = document.getElementById('producto-nombre')?.value.trim();
        const unidades   = Math.max(1, parseInt(document.getElementById('unidades-producidas')?.value, 10) || 1);
        const merma      = Math.max(0, parseFloat(document.getElementById('porcentaje-merma')?.value) || 0);
        const empaque    = Math.max(0, parseFloat(document.getElementById('costo-empaque')?.value) || 0);
        const manoObra   = Math.max(0, parseFloat(document.getElementById('costo-mano-obra')?.value) || 0);
        const tipoMargen = document.getElementById('tipo-margen')?.value || 'costo';
        const receta     = this.obtenerItemsRecetaFormulario();

        if (!nombre) {
            Store.toast('Ingresa el nombre del producto.', 'error');
            document.getElementById('producto-nombre')?.focus();
            return;
        }

        if (receta.length === 0) {
            Store.toast('Agrega al menos un insumo con cantidad válida a la receta.', 'error');
            return;
        }

        const valorModo = this.modoPrecio === 'margen'
            ? (parseFloat(document.getElementById('input-margen')?.value) || 0)
            : (parseFloat(document.getElementById('input-multiplicador')?.value) || 1);

        const btnGuardar = document.querySelector('.btn-guardar');
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Liquidando orden...';
        }

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
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.textContent = this.productoEditandoId ? 'Guardar cambios' : 'Guardar producto';
            }
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
        const btnGuardar = document.querySelector('.btn-guardar');
        if (btnGuardar) btnGuardar.textContent = 'Guardar cambios';

        document.getElementById('producto-nombre').value     = producto.nombre;
        document.getElementById('unidades-producidas').value = producto.unidadesProducidas || 1;

        const inpMerma = document.getElementById('porcentaje-merma');
        if (inpMerma) inpMerma.value = producto.porcentajeMerma || 0;

        const inpEmpaque = document.getElementById('costo-empaque');
        if (inpEmpaque) inpEmpaque.value = producto.costoEmpaque || 0;

        const inpMano = document.getElementById('costo-mano-obra');
        if (inpMano) inpMano.value = producto.costoManoObra || 0;

        const selTipoMargen = document.getElementById('tipo-margen');
        if (selTipoMargen) selTipoMargen.value = producto.tipoMargen || 'costo';

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
