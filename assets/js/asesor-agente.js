/**
 * asesor-agente.js — Orquestador Central y Máquina de Estados del Agente Costia IA
 *
 * Arquitectura Modular:
 * - AsesorParser (asesor/asesor-parser.js): NLP, extracción de datos, regex y búsquedas de alta fidelidad.
 * - AsesorFinanzas (asesor/asesor-finanzas.js): Fórmulas de costos, prorrateo, margen sugerido y punto de equilibrio.
 * - AsesorUI (asesor/asesor-ui.js): Drawer, chat bubbles, Web Speech API, barras de progreso y Markdown.
 *
 * Responsabilidades de este archivo:
 * - Coordinar el flujo conversacional y la máquina de estados por etapas.
 * - Gestionar comandos contextuales (Fichas Técnicas, Crear Insumos, Duplicar, Variaciones, etc.).
 * - Integración con backend IA Local (Ollama) con timeout estricto de 3.5s y fallback determinista instantáneo.
 * - Sincronización bidireccional en tiempo real con el formulario de recetas y Store.
 */

class AsesorCostiaAgent {
    constructor(controlador = null) {
        this.controlador = controlador;
        this.reconocimiento = null;
        this.grabandoVoz = false;
        this.ollamaActivo = false;
        this.modeloOllama = 'qwen2.5:3b';
        this.etapaActual = 'inicio';
        this.unidadesEspecificadas = false;

        this.estado = {
            costoIngredientesManual: null,
            unidadesManual:          null,
            ubicacionDescripcion:    null,
            arriendoMensual:         null,
            recibosMensuales:        null,
            horasPorLote:            null,
            pagoHoraManoObra:        6500,
            empaqueUnidad:           null,
            mermaPct:                null,
            margenManual:            null,
            margenSugerido:          null,
        };

        this.insumosPendientesConfirmar = [];
        this.insumoPendienteDesambiguar = null;
        this.historial = [];
    }

    /**
     * Determina el contexto operativo actual según la URL
     */
    obtenerContextoPagina() {
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('insumos.html')) return 'insumos';
        if (path.includes('productos.html')) return 'productos';
        if (path.includes('dashboard.html')) return 'dashboard';
        if (path.includes('ficha-tecnica.html') || path.includes('ficha-preview.html')) return 'ficha-tecnica';
        return 'crear-producto';
    }

    asegurarDrawerEnDOM() {
        AsesorUI.asegurarDrawerEnDOM();
    }

    iniciar() {
        this.asegurarDrawerEnDOM();

        const btnAbrir        = document.getElementById('btn-abrir-asesor');
        const btnAbrir2       = document.getElementById('btn-abrir-asesor-precio');
        const btnFab          = document.getElementById('btn-fab-asesor');
        const btnCerrar       = document.getElementById('btn-cerrar-asesor');
        const btnReiniciar    = document.getElementById('btn-reiniciar-asesor');
        const btnConfigIA     = document.getElementById('btn-config-ia-asesor');
        const btnConfigGastos = document.getElementById('btn-config-gastos-asesor');
        const btnVoz          = document.getElementById('btn-voz-asesor');
        const panel           = document.getElementById('modal-asesor-costia');
        const formChat        = document.getElementById('form-chat-asesor');

        btnAbrir?.addEventListener('click', () => this.abrirChat());
        btnAbrir2?.addEventListener('click', () => this.abrirChat());
        btnFab?.addEventListener('click', (e) => {
            e.preventDefault();
            this.abrirChat();
        });
        btnCerrar?.addEventListener('click', () => this.cerrarChat());
        btnReiniciar?.addEventListener('click', () => this.reiniciarConversacion());
        btnConfigIA?.addEventListener('click', async () => {
            await this.verificarOllamaLocal();
            this.mostrarEstadoOllama();
        });
        btnConfigGastos?.addEventListener('click', () => Store.abrirModalConfigGastos());
        btnVoz?.addEventListener('click', () => this.alternarGrabacionVoz());

        // Delegación global para botones flotantes o atajos de apertura
        document.addEventListener('click', (e) => {
            const fab = e.target.closest('#btn-fab-asesor, .asesor-fab-btn, #btn-abrir-asesor, #btn-abrir-asesor-precio, .asesor-card-trigger__btn, .btn-asesor-resumen, #link-sidebar-asesor');
            if (fab) {
                e.preventDefault();
                e.stopPropagation();
                this.abrirChat();
            }
        });

        // Clic en chips interactivos de progreso y acciones
        const chipsContainer = document.getElementById('asesor-progreso-chips');
        chipsContainer?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-chip-accion]');
            if (btn && btn.dataset.chipAccion) {
                e.preventDefault();
                this.ejecutarAccionChip(btn.dataset.chipAccion);
            }
        });

        // Clic en sugerencias rápidas dentro del chat
        const mensajesContainer = document.getElementById('asesor-mensajes');
        mensajesContainer?.addEventListener('click', (e) => {
            const pill = e.target.closest('.asesor-sugerencia-pill, [data-sugerencia]');
            if (pill) {
                e.preventDefault();
                const texto = pill.dataset.sugerencia || pill.textContent.trim();
                const input = document.getElementById('input-chat-asesor');
                if (input) {
                    input.value = texto;
                    this.procesarEntradaUsuario();
                }
            }
        });

        const btnCerrarTooltip = document.getElementById('btn-cerrar-tooltip-fab');
        btnCerrarTooltip?.addEventListener('click', (e) => {
            e.stopPropagation();
            const tip = document.getElementById('tooltip-fab-asesor');
            if (tip) tip.classList.add('oculto');
            sessionStorage.setItem('costia_fab_tooltip_dismissed', '1');
        });

        if (sessionStorage.getItem('costia_fab_tooltip_dismissed') === '1') {
            const tip = document.getElementById('tooltip-fab-asesor');
            if (tip) tip.classList.add('oculto');
        }

        // Si la URL pide abrir el asesor automáticamente (?abrirAsesor=1)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('abrirAsesor') === '1' || urlParams.get('asesor') === '1') {
            setTimeout(() => this.abrirChat(), 350);
        }

        panel?.addEventListener('click', (e) => {
            if (e.target === panel) this.cerrarChat();
        });

        formChat?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.procesarEntradaUsuario();
        });

        // Atajo Escape para cerrar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel?.classList.contains('visible')) {
                this.cerrarChat();
            }
        });

        this.configurarReconocimientoVoz();
        this.verificarOllamaLocal();
    }

    configurarReconocimientoVoz() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            const btnVoz = document.getElementById('btn-voz-asesor');
            if (btnVoz) btnVoz.title = 'Reconocimiento de voz no soportado en este navegador (usa Chrome o Edge)';
            return;
        }

        const btnVoz = document.getElementById('btn-voz-asesor');

        const rec = new SpeechRecognition();
        rec.lang = 'es-CO';
        rec.continuous = false;
        rec.interimResults = true;

        rec.onstart = () => {
            this.grabandoVoz = true;
            btnVoz?.classList.add('grabando');
            const estadoEl = document.getElementById('asesor-voz-estado');
            const textoEl  = document.getElementById('asesor-voz-texto');
            if (estadoEl) estadoEl.style.display = 'flex';
            if (textoEl)  textoEl.textContent = 'Escuchando... habla ahora (toca el micrófono para enviar)';
        };

        rec.onresult = (event) => {
            let transcripcion = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcripcion += event.results[i][0].transcript;
            }
            const input = document.getElementById('input-chat-asesor');
            if (input) input.value = transcripcion;
        };

        rec.onerror = () => {
            this.detenerIndicadorVoz();
        };

        rec.onend = () => {
            const habiaTexto = document.getElementById('input-chat-asesor')?.value.trim();
            this.detenerIndicadorVoz();
            if (habiaTexto) {
                this.procesarEntradaUsuario();
            }
        };

        this.reconocimiento = rec;
    }

    alternarGrabacionVoz() {
        if (!this.reconocimiento) {
            Store.toast('Usa Google Chrome o Microsoft Edge para dictar por voz.', 'info');
            return;
        }

        if (this.grabandoVoz) {
            this.reconocimiento.stop();
        } else {
            try {
                this.reconocimiento.start();
            } catch (_) {
                this.reconocimiento.stop();
            }
        }
    }

    detenerIndicadorVoz() {
        this.grabandoVoz = false;
        AsesorUI.detenerIndicadorVoz();
    }

    async verificarOllamaLocal() {
        // Canal 1: Conexión a través del puente backend PHP (evita ERR_CONNECTION_REFUSED en consola del navegador si Ollama está inactivo)
        try {
            const ctrlPhp = new AbortController();
            const tidPhp = setTimeout(() => ctrlPhp.abort(), 2000);
            const res = await fetch('../backend/api/asesor.php?ping=1', {
                signal: ctrlPhp.signal,
                cache: 'no-store'
            });
            clearTimeout(tidPhp);
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'ok' && (data.ollama_disponible || data.ollamaActivo)) {
                    this.ollamaActivo = true;
                    this.modeloOllama = data.modelo || 'qwen2.5:3b';
                    this._actualizarBadgeIA(true);
                    return true;
                } else if (data.status === 'ok' && !data.ollamaActivo) {
                    this.ollamaActivo = false;
                    this._actualizarBadgeIA(false);
                    return false;
                }
            }
        } catch (_) {
            // Si el backend no responde, intentar Canal 2 directo
        }

        // Canal 2: Conexión directa del navegador a Ollama (puerto 11434 con CORS)
        try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 1800);
            const resTags = await fetch('http://127.0.0.1:11434/api/tags', {
                signal: ctrl.signal
            });
            clearTimeout(tid);
            if (resTags.ok) {
                const dataTags = await resTags.json();
                const models = (dataTags.models || []).map(m => m.name);
                if (models.length > 0) {
                    this.ollamaActivo = true;
                    this.modeloOllama = models[0] || 'qwen2.5:3b';
                    this._actualizarBadgeIA(true);
                    return true;
                }
            }
        } catch (_) {
            // Silencioso
        }

        this.ollamaActivo = false;
        this._actualizarBadgeIA(false);
        return false;
    }

    _actualizarBadgeIA(activo) {
        const badge = document.getElementById('asesor-modo-badge');
        if (!badge) return;
        if (activo) {
            badge.textContent = `IA Local (${this.modeloOllama})`;
            badge.classList.add('activo');
        } else {
            badge.textContent = 'Agente Entrenado Activo';
            badge.classList.remove('activo');
        }
    }

    mostrarEstadoOllama() {
        AsesorUI.mostrarEstadoOllama(this.ollamaActivo, this.modeloOllama);
    }

    abrirChat() {
        this.verificarOllamaLocal();
        AsesorUI.abrirChat(() => this.reiniciarConversacion());
    }

    cerrarChat() {
        AsesorUI.cerrarChat(this.grabandoVoz, this.reconocimiento);
        this.detenerIndicadorVoz();
    }

    obtenerDatosProductoActual() {
        const insumos      = this.controlador ? this.controlador.obtenerInsumos() : Store.cargarInsumos();
        const items        = this.controlador ? this.controlador.obtenerItemsRecetaFormulario() : [];
        const unidadesForm = Math.max(1, parseInt(document.getElementById('unidades-producidas')?.value) || 1);
        const nombre       = document.getElementById('producto-nombre')?.value.trim() || 'tu producto';

        const costoTabla = items.reduce((acc, item) => {
            const ins = insumos.find(i => i.id === item.insumoId);
            return acc + item.calcularCosto(ins).costo;
        }, 0);

        const costoIngredientesLote = costoTabla > 0
            ? costoTabla
            : (this.estado.costoIngredientesManual || 0);

        const unidades = this.estado.unidadesManual || unidadesForm;

        return {
            nombre,
            unidades,
            costoTabla,
            costoIngredientesLote,
            costoIngredienteUnidad: unidades > 0 ? Math.round(costoIngredientesLote / unidades) : 0,
            tieneIngredientes: costoIngredientesLote > 0,
            unidadesEspecificadas: this.unidadesEspecificadas || (items.length > 0 && unidadesForm > 1),
        };
    }

    asignarUnidadesProducidas(cantidad) {
        const cant = Math.max(1, Math.round(cantidad));
        this.estado.unidadesManual = cant;
        this.unidadesEspecificadas = true;
        const inp = document.getElementById('unidades-producidas');
        if (inp) inp.value = cant;
        this.controlador?.actualizarResumen();
    }

    reiniciarConversacion() {
        const contenedor = document.getElementById('asesor-mensajes');
        if (contenedor) contenedor.innerHTML = '';

        const cfg = Store.cargarConfigGastos();
        const tieneGastosGuardados = cfg && cfg.configurado && cfg.arriendoMensual !== null && cfg.recibosMensuales !== null;

        this.estado = {
            costoIngredientesManual: null,
            unidadesManual:          null,
            ubicacionDescripcion:    tieneGastosGuardados ? (cfg.ubicacionDescripcion || (cfg.arriendoMensual > 0 ? 'Local en arriendo' : 'Desde casa')) : null,
            arriendoMensual:         tieneGastosGuardados ? cfg.arriendoMensual : null,
            recibosMensuales:        tieneGastosGuardados ? cfg.recibosMensuales : null,
            horasPorLote:            null,
            pagoHoraManoObra:        tieneGastosGuardados ? (cfg.pagoHoraManoObra || 6500) : null,
            empaqueUnidad:           null,
            mermaPct:                null,
            margenManual:            null,
            margenSugerido:          null,
        };
        this.insumosPendientesConfirmar = [];
        this.insumoPendienteDesambiguar = null;
        this.historial = [];

        const itemsPrevios = this.controlador ? this.controlador.obtenerItemsRecetaFormulario() : [];
        const unidPrevias  = parseInt(document.getElementById('unidades-producidas')?.value) || 1;
        this.unidadesEspecificadas = (itemsPrevios.length > 0 && unidPrevias > 1);

        const contexto = this.obtenerContextoPagina();

        if (contexto === 'dashboard') {
            this.etapaActual = 'dashboard_global';
            this.actualizarBarraProgreso();
            const prods = typeof Store !== 'undefined' ? Store.cargarProductos() : [];
            const cfg = typeof Store !== 'undefined' ? Store.cargarConfigGastos() : {};
            const totalFijos = (cfg.arriendoMensual || 0) + (cfg.recibosMensuales || 0);
            this.agregarMensajeAgente(`
                ¡Hola! Soy tu <strong>Asesor IA Financiero</strong> de Costia.<br>
                Estás en el <strong>Dashboard Financiero</strong>. Puedo analizar tu negocio gastronómico en vivo con:<br><br>
                • <strong>Rentabilidad de tu portafolio:</strong> Tienes ${prods.length} productos activos.<br>
                • <strong>Simulador de Precios y Margen:</strong> Probar márgenes y comisiones de delivery.<br>
                • <strong>Punto de equilibrio operativo:</strong> Tienes ${Store.fmt(totalFijos)}/mes en costos fijos declarados.<br>
                • <strong>Actualizar datos por chat o voz:</strong> ej: <em>"cambia el arriendo a 1.2 millones"</em> o <em>"la harina subió a 4.200"</em>.<br><br>
                Toca cualquier botón interactivo arriba o escríbeme lo que desees calcular.
            `);
            return;
        }

        if (contexto === 'ficha-tecnica') {
            this.etapaActual = 'fichas_global';
            this.actualizarBarraProgreso();
            this.agregarMensajeAgente(`
                ¡Hola! Soy el <strong>Agente Costia IA</strong>.<br>
                Estás en el <strong>Catálogo y Fichas Técnicas Oficiales</strong>. Puedo ayudarte con:<br><br>
                • <strong>Imprimir y Exportar:</strong> Guardar cualquier ficha técnica en PDF estandarizado.<br>
                • <strong>Desglose de Lote:</strong> Explicar costos de materias primas por gramo o unidad.<br>
                • <strong>Punto de Equilibrio:</strong> Calcular cuántas unidades por día requieres vender.<br>
                • <strong>Sugerido Apps Delivery:</strong> Calcular el recargo de plataformas (Rappi / DiDi 25%).<br><br>
                Toca cualquier botón arriba o dime qué ficha deseas consultar.
            `);
            return;
        }

        if (contexto === 'insumos') {
            this.etapaActual = 'insumos_global';
            this.actualizarBarraProgreso();
            this.agregarMensajeAgente(`
                ¡Hola! Soy el <strong>Agente Costia IA</strong>.<br>
                Estás en tu inventario de <strong>Insumos</strong>. Puedo ayudarte directamente aquí con:<br><br>
                • <strong>Crear insumos:</strong> ej: <em>"crea chocolate cobertura 1 kg a 25000"</em> o <em>"agrega polvo de hornear 500g a 8000"</em>.<br>
                • <strong>Actualizar precios:</strong> ej: <em>"la harina subió a 3500"</em> o <em>"el azúcar bajó a 2600"</em>.<br>
                • <strong>Historial de variaciones:</strong> ej: <em>"¿qué insumos han subido o cambiado de precio?"</em>.<br>
                • <strong>Consultar costos:</strong> ej: <em>"¿a cómo está la mantequilla?"</em>.<br>
                • <strong>Gastos fijos:</strong> ej: <em>"cambia el arriendo a 1.2 millones"</em>.<br><br>
                Toca los botones de acción arriba o habla con tu micrófono.
            `);
            return;
        }

        if (contexto === 'productos') {
            this.etapaActual = 'productos_global';
            this.actualizarBarraProgreso();
            this.agregarMensajeAgente(`
                ¡Hola! Soy el <strong>Agente Costia IA</strong>.<br>
                Estás en tu catálogo de <strong>Mis Productos</strong>. Puedo ayudarte directamente aquí con:<br><br>
                • <strong>Ficha Técnica / PDF:</strong> ej: <em>"dame la ficha técnica de la torta"</em> o <em>"imprimir ficha técnica"</em>.<br>
                • <strong>Punto de equilibrio:</strong> ej: <em>"¿cuál es mi punto de equilibrio?"</em> o <em>"¿cuántas unidades debo vender para cubrir fijos?"</em>.<br>
                • <strong>Duplicar recetas:</strong> ej: <em>"duplica el pan artesanal"</em>.<br>
                • <strong>Cambiar precio de venta:</strong> ej: <em>"cambia el precio del pan a 4500"</em>.<br>
                • <strong>Consultar rentabilidad:</strong> ej: <em>"¿cuánto gano con la torta de chocolate?"</em>.<br>
                • <strong>Crear nueva receta:</strong> ej: <em>"quiero costear un producto nuevo"</em>.<br>
                • <strong>Gastos fijos:</strong> ej: <em>"cambia el arriendo a 1.2 millones"</em>.<br><br>
                ¿En qué te puedo colaborar hoy? Toca los botones de acción arriba o háblame por voz.
            `);
            return;
        }

        this.actualizarBarraProgreso();
        const prod = this.obtenerDatosProductoActual();

        if (!prod.tieneIngredientes) {
            this.etapaActual = 'esperando_insumos';
            this.agregarMensajeAgente(`
                ¡Hola! Soy el <strong>Agente Asesor de Costia</strong>.<br><br>
                Veo que tu receta aún no tiene insumos cargados. <strong>Dime qué ingredientes lleva tu producto y en qué cantidades</strong> (por ejemplo: <em>"lleva 500 gramos de harina, 100 gramos de mantequilla y 2 huevos"</em>) y yo mismo te armo la tabla.<br><br>
                <em>Tip: También puedes tocar directamente los botones de acción arriba (<strong>Ingredientes, Unidades, Espacio/Local</strong>) para configurar cada elemento paso a paso.</em>
            `);
        } else if (tieneGastosGuardados) {
            this.etapaActual = 'tiempo_empleados';
            this.agregarMensajeAgente(`
                ¡Hola! Soy el <strong>Agente Asesor de Costia</strong>.<br>
                Veo que la receta de <strong>${prod.nombre}</strong> suma <strong>${Store.fmt(prod.costoIngredientesLote)}</strong> en insumos para <strong>${prod.unidades} unidad(es)</strong>.<br><br>
                He tomado los gastos fijos guardados de tu negocio: <strong>${this.estado.ubicacionDescripcion} (${Store.fmt(this.estado.arriendoMensual)}/mes)</strong> y <strong>servicios (${Store.fmt(this.estado.recibosMensuales)}/mes)</strong>.<br><br>
                Pasemos a tu tiempo: <strong>¿cuánto tiempo (en horas o minutos) te toma preparar este lote y cuánto vale la hora de trabajo?</strong> (Ej: <em>"1 hora y trabajo solo"</em>).<br>
                <small style="color:#6b7280;">(Si deseas cambiar el arriendo o servicios para este producto, solo dime <em>"cambia el arriendo a X"</em> o abre <strong>Gastos fijos</strong> arriba).</small>
            `);
        } else {
            this.etapaActual = 'ubicacion';
            this.agregarMensajeAgente(`
                ¡Hola! Soy el <strong>Agente Asesor de Costia</strong>.<br>
                Veo que la receta de <strong>${prod.nombre}</strong> suma <strong>${Store.fmt(prod.costoIngredientesLote)}</strong> en insumos para <strong>${prod.unidades} unidad(es)</strong>.<br><br>
                Para sumar tus gastos ocultos sin inflar el precio, cuéntame:<br>
                <strong>¿Trabajas desde casa o pagas arriendo de local?</strong>
            `);
        }
    }

    ejecutarAccionChip(accion) {
        if (!accion) return;
        if (typeof AsesorComandos !== 'undefined' && typeof AsesorComandos.ejecutarAccionChip === 'function') {
            AsesorComandos.ejecutarAccionChip(this, accion);
            return;
        }
        this.actualizarBarraProgreso();
    }

    agregarMensajeAgente(html) {
        AsesorUI.agregarMensajeAgente(html);
        const textoPlano = String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        this.historial.push({ rol: 'agente', texto: textoPlano });
    }

    agregarMensajeUsuario(texto) {
        AsesorUI.agregarMensajeUsuario(texto);
        this.historial.push({ rol: 'usuario', texto });
    }

    mostrarEscribiendo() {
        return AsesorUI.mostrarEscribiendo();
    }

    // ─── Métodos Facade delegados a módulos especializados ─────────────────

    escaparRegex(str) { return AsesorParser.escaparRegex(str); }
    normalizarTexto(str) { return AsesorParser.normalizarTexto(str); }
    normalizarUnidad(str) { return AsesorParser.normalizarUnidad(str); }
    normalizarMontoMoneda(str, campo) { return AsesorParser.normalizarMontoMoneda(str, campo); }
    extraerNumeros(texto) { return AsesorParser.extraerNumeros(texto); }
    extraerUnidadesDeTexto(texto) { return AsesorParser.extraerUnidadesDeTexto(texto); }
    extraerIngredientesDeTexto(texto) { return AsesorParser.extraerIngredientesDeTexto(texto); }
    extraerDatosInsumoNuevo(texto) { return AsesorParser.extraerDatosInsumoNuevo(texto); }
    extraerNombreProductoConsultado(texto, limite) { return AsesorParser.extraerNombreProductoConsultado(texto, limite); }
    buscarInsumoPorTexto(texto, insumos) { return AsesorParser.buscarInsumoPorTexto(texto, insumos); }
    buscarInsumoEnInventario(nombreMencionado, insumos) { return AsesorParser.buscarInsumoEnInventario(nombreMencionado, insumos); }
    buscarProductoPorTexto(texto, productos) { return AsesorParser.buscarProductoPorTexto(texto, productos); }
    esNegacionOCero(texto) { return AsesorParser.esNegacionOCero(texto); }
    esFinInsumos(texto) { return AsesorParser.esFinInsumos(texto); }
    esSolicitudNoSoportada(texto) { return AsesorParser.esSolicitudNoSoportada(texto); }

    calcularMargenRecomendadoSegunProducto(nombreProd) { return AsesorFinanzas.calcularMargenRecomendadoSegunProducto(nombreProd); }
    calcularEstructuraProducto() { return AsesorFinanzas.calcularEstructuraProducto(this.estado, this.obtenerDatosProductoActual()); }
    calcularPuntoEquilibrio(gananciaUnitaria, fijosMensuales) { return AsesorFinanzas.calcularPuntoEquilibrio(gananciaUnitaria, fijosMensuales); }
    calcularPrecioAppDelivery(precioRecomendado, comisionPct) { return AsesorFinanzas.calcularPrecioAppDelivery(precioRecomendado, comisionPct); }

    formatearMarkdown(texto) { return AsesorUI.formatearMarkdown(texto); }
    escaparHTML(str) { return AsesorUI.escaparHTML(str); }

    actualizarBarraProgreso() {
        AsesorUI.actualizarBarraProgreso(this.obtenerContextoPagina(), this.estado, this.obtenerDatosProductoActual());
    }

    // ─── Gestión de Ingredientes en Formulario ──────────────────────────────

    agregarIngredienteATablaFormulario(insumo, cantidad, unidad) {
        if (!this.controlador) return;
        const filas = document.querySelectorAll('#receta-cuerpo tr.receta-fila');
        let filaVacia = null;
        for (const fila of filas) {
            const select = fila.querySelector('.fila-insumo');
            if (select && (!select.value || select.value === '')) {
                filaVacia = fila;
                break;
            }
        }

        const unidadElegida = unidad || insumo.unidad;

        if (filaVacia) {
            const filaId = parseInt(filaVacia.dataset.id);
            const selInsumo = filaVacia.querySelector('.fila-insumo');
            const inputCant = filaVacia.querySelector('.fila-cantidad');
            const selUnidad = filaVacia.querySelector('.fila-unidad-receta');

            if (selInsumo) {
                selInsumo.value = insumo.id;
                this.controlador.alCambiarInsumo(selInsumo, filaId);
            }
            if (inputCant) {
                inputCant.value = cantidad;
            }
            if (selUnidad && unidadElegida) {
                const opciones = Array.from(selUnidad.options).map(o => o.value);
                if (opciones.includes(unidadElegida)) {
                    selUnidad.value = unidadElegida;
                }
            }
            this.controlador.actualizarResumen();
        } else {
            this.controlador.agregarFila({
                insumoId: insumo.id,
                cantidad: cantidad,
                unidadReceta: unidadElegida
            });
        }
    }

    procesarIngredientesMencionados(listaIngredientes, textoOriginal = '') {
        if (typeof AsesorFlujo !== 'undefined' && typeof AsesorFlujo.procesarIngredientesMencionados === 'function') {
            return AsesorFlujo.procesarIngredientesMencionados(this, listaIngredientes, textoOriginal);
        }
        return false;
    }

    // ─── Enrutador Principal de Entrada del Usuario ─────────────────────────

    procesarEntradaUsuarioConTexto(texto) {
        const input = document.getElementById('input-chat-asesor');
        if (input) input.value = texto;
        return this.procesarEntradaUsuario();
    }

    async procesarEntradaUsuario() {
        const input = document.getElementById('input-chat-asesor');
        if (!input) return;
        const texto = input.value.trim();
        if (!texto) return;

        input.value = '';
        this.agregarMensajeUsuario(texto);

        const nums = this.extraerNumeros(texto);
        const contextoActual = this.obtenerContextoPagina();

        // -1. Verificar si el usuario está respondiendo a una desambiguación pendiente (ej: "¿cuál azúcar?")
        if (this.insumoPendienteDesambiguar) {
            const pendiente = this.insumoPendienteDesambiguar;
            const tClarif = this.normalizarTexto(texto);
            const elegido = pendiente.candidatos.find(c => {
                const nom = this.normalizarTexto(c.nombre);
                return nom.includes(tClarif) || tClarif.includes(nom) ||
                    nom.split(/\s+/).some(w => w.length > 2 && tClarif.includes(w) && !['de', 'la', 'el', 'los', 'las', 'con', 'del', 'para', 'en', 'al', 'sin'].includes(w));
            });

            if (elegido) {
                this.insumoPendienteDesambiguar = null;
                if (pendiente.accion === 'actualizar_precio') {
                    const precioAntiguo = elegido.precio;
                    elegido.precio = pendiente.precio;
                    await Store.guardarInsumoAsync(elegido);
                    Store.notificarActualizacion();

                    const dif = pendiente.precio - precioAntiguo;
                    const txtDif = dif > 0
                        ? `(subió +${Store.fmt(dif)})`
                        : (dif < 0 ? `(bajó -${Store.fmt(Math.abs(dif))})` : '(sin variación)');

                    this.agregarMensajeAgente(`
                        ¡Listo! Seleccionaste <strong>${elegido.nombre}</strong>.<br>
                        Su precio quedó actualizado en <strong>${Store.fmt(pendiente.precio)}</strong> por ${elegido.unidad} ${txtDif}.<br>
                        <small style="color:#0f5132;">Todas tus recetas que lleven ${elegido.nombre} recalcularán su costo automáticamente.</small>
                    `);
                    return;
                } else if (pendiente.accion === 'agregar_receta') {
                    this.agregarIngredienteATablaFormulario(elegido, pendiente.cantidad, pendiente.unidad);
                    this.actualizarBarraProgreso();
                    const prod = this.obtenerDatosProductoActual();
                    this.agregarMensajeAgente(`
                        Añadí <strong>${pendiente.cantidad} ${pendiente.unidad} de ${elegido.nombre}</strong> a tu receta.<br>
                        El costo acumulado de insumos va en <strong>${Store.fmt(prod.costoIngredientesLote)}</strong>.<br><br>
                        ¿Lleva algún otro ingrediente o dime <strong>"no más" / "listo"</strong>?
                    `);
                    return;
                }
            }
        }

        // Delegación a comandos e intenciones globales
        if (typeof AsesorComandos !== 'undefined' && await AsesorComandos.procesar(this, texto, nums, contextoActual)) {
            return;
        }

        // B. Reconocimiento Natural de Ingredientes para Recetas y Flujo de Etapas
        const tUser = this.normalizarTexto(texto);
        const ingredientesDetectados = this.extraerIngredientesDeTexto(texto);
        const enEtapaInsumos = (this.etapaActual === 'esperando_insumos' || this.etapaActual === 'esperando_mas_insumos');
        const esPeticionPrecioInsumoExplicita = /\b(subi[oó]|baj[oó]|cambi[oó]\s*(?:el\s*)?precio|aument[oó]|nuevo\s*precio|actualiza(?:r)?\s*(?:el\s*)?precio)\b/i.test(texto);

        // Si se mencionan ingredientes para receta o estamos esperando insumos (y no es orden explícita de precio de inventario)
        if ((enEtapaInsumos || ingredientesDetectados.length > 0 || (contextoActual === 'crear-producto' && !esPeticionPrecioInsumoExplicita)) && !esPeticionPrecioInsumoExplicita) {
            if (ingredientesDetectados.length > 0) {
                const procesados = this.procesarIngredientesMencionados(ingredientesDetectados, texto);
                if (procesados) return;
            }

            // Si el usuario indica que terminó de ingresar insumos
            if (enEtapaInsumos && this.esFinInsumos(texto)) {
                if (!this.unidadesEspecificadas) {
                    this.etapaActual = 'preguntar_unidades';
                    this.actualizarBarraProgreso();
                    this.agregarMensajeAgente(`
                        ¡Listo! Receta registrada con éxito.<br><br>
                        <strong>¿Cuántas unidades rinde o salen con esta receta?</strong> (Por ejemplo: <em>"12 panes"</em>, <em>"20 porciones"</em> o el número <em>"10"</em>).
                    `);
                } else {
                    this.etapaActual = 'ubicacion';
                    this.actualizarBarraProgreso();
                    this.agregarMensajeAgente(`
                        ¡Excelente! Insumos y unidades confirmados.<br><br>
                        Ahora pasemos a tus gastos de espacio: <strong>¿produces desde tu casa o pagas arriendo de un local?</strong>
                    `);
                }
                return;
            }
        }

        // Si estamos esperando la cantidad de unidades que rinde el lote
        if (this.etapaActual === 'preguntar_unidades') {
            const unid = this.extraerUnidadesDeTexto(texto) || (nums.length > 0 ? nums[0] : null);
            if (unid && unid > 0) {
                this.asignarUnidadesProducidas(unid);
                this.etapaActual = 'ubicacion';
                this.actualizarBarraProgreso();
                const p = this.obtenerDatosProductoActual();
                this.agregarMensajeAgente(`
                    ¡Anotado! <strong>${unid} unidad(es)</strong> por lote. El costo de insumos por unidad queda en <strong>${Store.fmt(p.costoIngredienteUnidad)}</strong>.<br><br>
                    Ahora cuéntame: <strong>¿produces desde tu casa o pagas arriendo de un local?</strong>
                `);
                return;
            }
        }

        // C. Comando para actualizar o consultar precio de un insumo existente (con desambiguación)
        const esIntencionPrecioInsumo = (
            /\b(subi[oó]|baj[oó]|cambi[oó]|aument[oó]|nuevo\s*precio|sube|baja|pon(?:le)?|fija(?:r)?|actualiza(?:r)?|cost[oó]|vale|cuesta|a\s*c[oó]mo\s*est[aá]|cu[aá]nto\s*(?:cuesta|vale)|precio\s*(?:de|del)?)\b/i.test(texto) ||
            (contextoActual === 'insumos' && (/\b(a|en)\s*\$?\s*\d+/i.test(texto) || (nums.length > 0 && !/\b(gramos?|gr?|g|kilos?|kg|litros?|l|mililitros?|ml)\b/i.test(texto))))
        ) && !/\b(producto|receta|ficha|torta|pan)\b/i.test(texto);

        if (esIntencionPrecioInsumo) {
            const busquedaInsumo = AsesorParser.buscarInsumosConAmbiguedad(texto);

            // Caso C.1: Ambigüedad detectada (múltiples insumos parecidos que comparten palabra clave, ej: Azúcar blanca y Azúcar morena)
            if (busquedaInsumo.esAmbigua && busquedaInsumo.candidatos.length > 1) {
                const matchPrecio = texto.match(/(?:\$|a\s+|en\s+|subi[oó]\s+a\s+|baj[oó]\s+a\s+|precio\s+(?:de\s+)?)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)/i);
                let precioDetectado = null;
                if (matchPrecio) {
                    precioDetectado = this.normalizarMontoMoneda(matchPrecio[1]);
                } else if (nums.length > 0 && /\b(subi[oó]|baj[oó]|cambi[oó]|aument[oó]|nuevo\s*precio|sube|baja|pon(?:le)?|fija(?:r)?|actualiza(?:r)?)\b/i.test(texto)) {
                    precioDetectado = nums[nums.length - 1];
                }

                if (precioDetectado && precioDetectado > 0) {
                    this.insumoPendienteDesambiguar = {
                        accion: 'actualizar_precio',
                        precio: precioDetectado,
                        candidatos: busquedaInsumo.candidatos
                    };

                    const botones = busquedaInsumo.candidatos.map(c => `
                        <button type="button" class="asesor-btn-secundario btn-desambiguar-insumo" data-insumo-id="${c.id}" data-precio="${precioDetectado}" style="text-align:left;margin:4px 0;padding:8px 12px;font-size:13px;border:1px solid #10b981;background:#f0fdf4;border-radius:8px;cursor:pointer;display:block;width:100%;">
                            <strong>${c.nombre}</strong> <small style="color:#065f46;">(actual: ${Store.fmt(c.precio)}/${c.unidad})</small>
                        </button>
                    `).join('');

                    this.agregarMensajeAgente(`
                        <strong>Encontré ${busquedaInsumo.candidatos.length} insumos parecidos en tu inventario:</strong><br>
                        ¿A cuál de ellos deseas actualizarle el precio a <strong>${Store.fmt(precioDetectado)}</strong>?<br><br>
                        ${botones}<br>
                        <small style="color:#6b7280;">(Toca el botón correspondiente o respóndeme cuál deseas, ej: <em>"al azúcar morena"</em>).</small>
                    `);

                    setTimeout(() => {
                        document.querySelectorAll('.btn-desambiguar-insumo').forEach(btn => {
                            btn.addEventListener('click', async () => {
                                const id = btn.getAttribute('data-insumo-id');
                                const precio = parseFloat(btn.getAttribute('data-precio'));
                                const insumos = Store.cargarInsumos();
                                const insumoElegido = insumos.find(i => String(i.id) === String(id));
                                if (insumoElegido) {
                                    this.insumoPendienteDesambiguar = null;
                                    const precioAntiguo = insumoElegido.precio;
                                    insumoElegido.precio = precio;
                                    await Store.guardarInsumoAsync(insumoElegido);
                                    Store.notificarActualizacion();

                                    const dif = precio - precioAntiguo;
                                    const txtDif = dif > 0 ? `(subió +${Store.fmt(dif)})` : (dif < 0 ? `(bajó -${Store.fmt(Math.abs(dif))})` : '');
                                    this.agregarMensajeAgente(`
                                        ¡Listo! Actualicé el precio de <strong>${insumoElegido.nombre}</strong> a <strong>${Store.fmt(precio)}</strong> por ${insumoElegido.unidad} ${txtDif}.<br>
                                        <small style="color:#0f5132;">Todas tus recetas que lleven ${insumoElegido.nombre} recalcularán su costo automáticamente.</small>
                                    `);
                                }
                            });
                        });
                    }, 50);
                    return;
                } else {
                    const listado = busquedaInsumo.candidatos.map(c => `• <strong>${c.nombre}:</strong> ${Store.fmt(c.precio)} por ${c.unidad}`).join('<br>');
                    this.agregarMensajeAgente(`
                        Tienes <strong>${busquedaInsumo.candidatos.length} insumos parecidos</strong> en tu inventario:<br><br>
                        ${listado}<br><br>
                        Si deseas actualizar el precio de alguno, dime por ejemplo: <em>"sube el azúcar morena a 3500"</em>.
                    `);
                    return;
                }
            }

            // Caso C.2: Insumo único o coincidencia exacta
            const insumoCoincidente = busquedaInsumo.coincidenciaExacta;
            if (insumoCoincidente) {
                const matchPrecio = texto.match(/(?:\$|a\s+|en\s+|subi[oó]\s+a\s+|baj[oó]\s+a\s+|precio\s+(?:de\s+)?)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)/i);
                let precioDetectado = null;
                if (matchPrecio) {
                    precioDetectado = this.normalizarMontoMoneda(matchPrecio[1]);
                } else if (nums.length > 0 && /\b(subi[oó]|baj[oó]|cambi[oó]|aument[oó]|nuevo\s*precio|sube|baja|pon(?:le)?|fija(?:r)?|actualiza(?:r)?)\b/i.test(texto)) {
                    precioDetectado = nums[nums.length - 1];
                }

                if (precioDetectado && precioDetectado > 0) {
                    const precioAntiguo = insumoCoincidente.precio;
                    insumoCoincidente.precio = precioDetectado;
                    await Store.guardarInsumoAsync(insumoCoincidente);
                    Store.notificarActualizacion();

                    const dif = precioDetectado - precioAntiguo;
                    const txtDif = dif > 0
                        ? `(subió +${Store.fmt(dif)})`
                        : (dif < 0 ? `(bajó -${Store.fmt(Math.abs(dif))})` : '(sin variación)');

                    this.agregarMensajeAgente(`
                        ¡Actualizado! El precio de <strong>${insumoCoincidente.nombre}</strong> ahora es <strong>${Store.fmt(precioDetectado)}</strong> por ${insumoCoincidente.unidad} ${txtDif}.<br>
                        <small style="color:#0f5132;">Todas tus recetas que lleven ${insumoCoincidente.nombre} recalcularán su costo automáticamente.</small>
                    `);
                    return;
                } else {
                    this.agregarMensajeAgente(`
                        El insumo <strong>${insumoCoincidente.nombre}</strong> actualmente cuesta <strong>${Store.fmt(insumoCoincidente.precio)}</strong> por ${insumoCoincidente.unidad}.<br><br>
                        Si deseas actualizarlo, dime el nuevo valor (ej: <em>"cambió a 4200"</em>).
                    `);
                    return;
                }
            }
        }

        // L. Actualizaciones Específicas en Caliente
        const actualizadoEnCaliente = this.intentarActualizarCampoEspecifico(texto, nums);
        if (actualizadoEnCaliente) {
            this.sincronizarFormularioEnVivo();
            this.actualizarBarraProgreso();

            if (this.etapaActual === 'completado' || this.estaCompleto()) {
                this.etapaActual = 'completado';
                this.mostrarTarjetaProductoArmado();
                return;
            }
        }

        // M. Preguntas Estratégicas sobre Apps de Delivery (Rappi, Didi) o Pisos de Negociación
        if (this.estaCompleto() && /\b(rappi|didi|uber|app|domicilio|cuanto\s*cobrar|piso|minimo|descuento)\b/i.test(tUser)) {
            this.responderConsultaEstrategica(tUser, nums);
            return;
        }

        // N. Envío a Ollama Local si está activo (con timeout estricto de 3.5s vía AbortController)
        const typingEl = this.mostrarEscribiendo();

        if (this.ollamaActivo) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            try {
                const res = await fetch('../backend/api/asesor.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal,
                    body: JSON.stringify({
                        mensaje: texto,
                        contexto: {
                            etapaActual: this.etapaActual,
                            estado: this.estado,
                            producto: this.obtenerDatosProductoActual(),
                            historial: this.historial.slice(-6)
                        }
                    })
                });
                clearTimeout(timeoutId);
                const data = await res.json();

                if (res.ok && data.status === 'success' && data.respuesta) {
                    typingEl?.remove();

                    if (Array.isArray(data.ingredientesDetectados) && data.ingredientesDetectados.length > 0) {
                        if (this.etapaActual === 'esperando_insumos' || this.etapaActual === 'esperando_mas_insumos' || mencionaIngredientesExplicito) {
                            this.procesarIngredientesMencionados(data.ingredientesDetectados, texto);
                            return;
                        }
                    }

                    if (data.estadoActualizado) {
                        if (data.estadoActualizado.unidadesManual && !this.unidadesEspecificadas) {
                            this.asignarUnidadesProducidas(data.estadoActualizado.unidadesManual);
                        }

                        if (data.estadoActualizado.arriendoMensual !== null && data.estadoActualizado.arriendoMensual !== undefined) {
                            data.estadoActualizado.arriendoMensual = this.normalizarMontoMoneda(data.estadoActualizado.arriendoMensual, 'arriendo');
                        }
                        if (data.estadoActualizado.recibosMensuales !== null && data.estadoActualizado.recibosMensuales !== undefined) {
                            data.estadoActualizado.recibosMensuales = this.normalizarMontoMoneda(data.estadoActualizado.recibosMensuales, 'recibos');
                        }

                        const tieneNum = /\d/.test(tUser) || /\b(un|dos|tres|cuatro|cinco|medio|mil|mill[oó]n|k)\b/i.test(tUser);
                        const esCero = /\b(casa|propio|propia|no pago|sin arriendo|cero|0)\b/i.test(tUser);

                        if (!tieneNum && !esCero && this.estado.arriendoMensual === null) {
                            if (data.estadoActualizado.arriendoMensual !== null) {
                                data.estadoActualizado.arriendoMensual = null;
                                data.completo = false;
                            }
                        }

                        Object.keys(this.estado).forEach(k => {
                            if (data.estadoActualizado[k] !== null && data.estadoActualizado[k] !== undefined) {
                                this.estado[k] = data.estadoActualizado[k];
                            }
                        });
                    }
                    this.actualizarBarraProgreso();
                    this.agregarMensajeAgente(this.formatearMarkdown(data.respuesta));

                    if (data.completo || this.estaCompleto()) {
                        this.etapaActual = 'completado';
                        this.sincronizarFormularioEnVivo();
                        this.mostrarTarjetaProductoArmado();
                    }
                    return;
                }
            } catch (_) {
                clearTimeout(timeoutId);
            }
        }

        // O. Motor Conversacional Local Inmediato (Cero esperas)
        setTimeout(() => {
            typingEl?.remove();
            this.responderConAgenteEntrenado(texto);
        }, 150);
    }

    // ─── Motor Conversacional de Reglas Experto ──────────────────────────────

    responderConAgenteEntrenado(texto) {
        if (typeof AsesorFlujo !== 'undefined' && typeof AsesorFlujo.responder === 'function') {
            return AsesorFlujo.responder(this, texto);
        }
    }

    intentarActualizarCampoEspecifico(texto, nums) {
        const t = texto.toLowerCase();
        let huboCambio = false;

        if (/\b(arriendo|alquiler)\b/.test(t)) {
            if (/\b(casa|propio|propia|no pago|cero|0)\b/.test(t) || this.esNegacionOCero(t)) {
                this.estado.arriendoMensual = 0;
                this.estado.ubicacionDescripcion = 'Desde casa';
                huboCambio = true;
            } else if (nums.length > 0) {
                this.estado.arriendoMensual = this.normalizarMontoMoneda(nums[0], 'arriendo');
                this.estado.ubicacionDescripcion = 'Local comercial';
                huboCambio = true;
            }
        }

        if (/\b(luz|gas|agua|recibo|servicio)\b/.test(t)) {
            if (this.esNegacionOCero(t)) {
                this.estado.recibosMensuales = 0;
                huboCambio = true;
            } else if (nums.length > 0) {
                this.estado.recibosMensuales = this.normalizarMontoMoneda(nums[0], 'recibos');
                huboCambio = true;
            }
        }

        if (/\b(hora|tiempo|demoro|tardo|minuto)\b/.test(t)) {
            if (/\b(media\s*hora|30\s*min)/.test(t)) {
                this.estado.horasPorLote = 0.5;
                huboCambio = true;
            } else if (nums.length > 0) {
                this.estado.horasPorLote = /\bminut/.test(t) && nums[0] >= 10 ? Math.round((nums[0]/60)*100)/100 : nums[0];
                huboCambio = true;
            }
        }

        if (/\b(empaque|caja|bolsa|domo)\b/.test(t) && nums.length > 0) {
            this.estado.empaqueUnidad = nums[0];
            huboCambio = true;
        }

        if (/\bmerma\b/.test(t) && nums.length > 0) {
            this.estado.mermaPct = Math.min(30, nums[0]);
            huboCambio = true;
        }

        if (/\bmargen\b/.test(t) && nums.length > 0 && nums[0] <= 90) {
            this.estado.margenManual = nums[0];
            huboCambio = true;
        }

        return huboCambio;
    }

    estaCompleto() {
        const prod = this.obtenerDatosProductoActual();
        return (
            prod.tieneIngredientes &&
            this.estado.arriendoMensual !== null &&
            this.estado.recibosMensuales !== null &&
            this.estado.horasPorLote !== null &&
            this.estado.empaqueUnidad !== null
        );
    }

    mostrarTarjetaProductoArmado() {
        const c = this.calcularEstructuraProducto();
        AsesorUI.mostrarTarjetaProductoArmado(c, () => {
            this.sincronizarFormularioEnVivo();
            this.cerrarChat();
            Store.toast('¡Receta y costos ocultos aplicados al producto!');
        });
    }

    sincronizarFormularioEnVivo() {
        const c = this.calcularEstructuraProducto();

        const inpMerma = document.getElementById('porcentaje-merma');
        if (inpMerma && c.mermaPct > 0) inpMerma.value = c.mermaPct;

        const inpEmpaque = document.getElementById('costo-empaque');
        if (inpEmpaque && c.empaqueUnidad > 0) inpEmpaque.value = c.empaqueUnidad;

        const inpCostoFijo = document.getElementById('costos-fijos-adicionales');
        if (inpCostoFijo) {
            inpCostoFijo.value = c.arriendoLote + c.recibosLote + c.manoObraLote + c.desgasteLote;
        }

        const inpMargen = document.getElementById('margen-ganancia');
        if (inpMargen && c.margenComercial > 0) inpMargen.value = c.margenComercial;

        const inpPrecio = document.getElementById('precio-venta-manual');
        if (inpPrecio) {
            inpPrecio.value = c.precioRecomendado;
        }

        this.controlador?.actualizarResumen();
    }

    responderConsultaEstrategica(t, nums = []) {
        const c = this.calcularEstructuraProducto();
        if (/\b(rappi|didi|uber|app|plataforma)\b/.test(t)) {
            const precioApp = this.calcularPrecioAppDelivery(c.precioRecomendado, 25);
            this.agregarMensajeAgente(`
                Si vendes en <strong>Rappi / Didi</strong> (~25% comisión), publícalo en <strong>${Store.fmt(precioApp)}</strong> para conservar tu ganancia de <strong>${Store.fmt(c.gananciaUnidad)}/ud</strong>.
            `);
        } else {
            const pisoMinimo = Math.round(c.costoRealUnidad * 1.18);
            this.agregarMensajeAgente(`
                Tu costo real con servicios y tiempo es <strong>${Store.fmt(c.costoRealUnidad)}/ud</strong>. Tu precio recomendado es <strong>${Store.fmt(c.precioRecomendado)}</strong> y nunca deberías bajar de <strong>${Store.fmt(pisoMinimo)}</strong>.
            `);
        }
    }
}

if (typeof window !== 'undefined') {
    window.AsesorCostiaAgent = AsesorCostiaAgent;
}

// Auto-instanciación del Agente Asesor IA si la página no lo instanció explícitamente
if (typeof document !== 'undefined') {
    const initAgente = () => {
        if (!window.asesorAgente) {
            window.asesorAgente = new AsesorCostiaAgent(window.controladorCrear || null);
            window.asesorAgente.iniciar();
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAgente);
    } else {
        initAgente();
    }
}
