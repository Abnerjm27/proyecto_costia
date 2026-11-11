/**
 * asesor-ui.js — Capa de Interfaz, Drawer, Chat, Reconocimiento de Voz y Markdown
 * Costia · Terminal Pro · Fintech Gastronómica
 *
 * Responsabilidades:
 * - Creación y montaje global del Drawer modal y Botón Flotante (FAB).
 * - Renderizado de mensajes, burbujas y badges sin emojis genéricos.
 * - Chips interactivos y ejecutables por etapa y contexto.
 * - Fila de sugerencias rápidas ejecutables con 1 clic.
 * - Animación de escritura interactiva y Web Speech API en español.
 */

class AsesorUI {
    static asegurarDrawerEnDOM() {
        if (!document.getElementById('contenedor-fab-asesor')) {
            const fabDiv = document.createElement('div');
            fabDiv.className = 'asesor-fab-container';
            fabDiv.id = 'contenedor-fab-asesor';
            fabDiv.innerHTML = `
                <div class="asesor-fab-tooltip" id="tooltip-fab-asesor">
                    <span class="asesor-fab-tooltip__badge">Costia IA</span>
                    <span class="asesor-fab-tooltip__texto">¿Quieres calcular o cambiar algo? ¡Chatea conmigo!</span>
                    <button type="button" class="asesor-fab-tooltip__cerrar" id="btn-cerrar-tooltip-fab" aria-label="Cerrar sugerencia">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <button type="button" class="asesor-fab-btn" id="btn-fab-asesor" aria-label="Abrir Asesor Inteligente con IA" title="Chatear con el Agente IA para crear o modificar recetas, costos y precios">
                    <span class="asesor-fab-btn__pulso"></span>
                    <div class="asesor-fab-btn__icono-wrap">
                        <img src="../assets/img/costia-icon-green.png" alt="IA" class="asesor-fab-btn__icono">
                        <span class="asesor-fab-btn__status"></span>
                    </div>
                    <div class="asesor-fab-btn__contenido">
                        <div class="asesor-fab-btn__titulo">
                            <span>Asesor IA</span>
                            <span class="asesor-fab-btn__chip">Online</span>
                        </div>
                        <small class="asesor-fab-btn__sub">Costeo y pricing en vivo</small>
                    </div>
                </button>
            `;
            document.body.appendChild(fabDiv);
        }

        if (document.getElementById('modal-asesor-costia')) return;

        const drawerDiv = document.createElement('div');
        drawerDiv.className = 'asesor-modal-backdrop';
        drawerDiv.id = 'modal-asesor-costia';
        drawerDiv.setAttribute('role', 'dialog');
        drawerDiv.setAttribute('aria-modal', 'true');
        drawerDiv.setAttribute('aria-labelledby', 'asesor-modal-titulo');
        drawerDiv.innerHTML = `
            <div class="asesor-drawer">
                <header class="asesor-drawer__header">
                    <div class="asesor-drawer__identidad">
                        <img src="../assets/img/costia-icon-green.png" alt="Costia IA" class="asesor-drawer__logo">
                        <div>
                            <h3 id="asesor-modal-titulo">Agente Costia IA</h3>
                            <span class="asesor-drawer__sub" id="asesor-modo-badge">Agente Entrenado Activo</span>
                        </div>
                    </div>
                    <div class="asesor-drawer__acciones">
                        <button type="button" class="asesor-btn-header" id="btn-config-gastos-asesor" title="Ver y editar gastos fijos guardados (arriendo y servicios)">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;margin-right:4px;" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            <span>Gastos fijos</span>
                        </button>
                        <button type="button" class="asesor-btn-header" id="btn-config-ia-asesor" title="Ver estado de IA Local (Ollama)">IA Local</button>
                        <button type="button" class="asesor-btn-header" id="btn-reiniciar-asesor" title="Nueva conversación">Reiniciar</button>
                        <button type="button" class="asesor-btn-cerrar" id="btn-cerrar-asesor" aria-label="Cerrar chat">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </header>

                <div class="asesor-progreso-bar" id="asesor-progreso-chips" role="toolbar" aria-label="Acciones y progreso del asesor"></div>

                <div class="asesor-drawer__cuerpo" id="asesor-mensajes" role="log" aria-live="polite"></div>

                <footer class="asesor-drawer__footer">
                    <div class="asesor-voz-estado" id="asesor-voz-estado">
                        <span class="asesor-voz-onda"></span>
                        <span id="asesor-voz-texto">Escuchando... habla con naturalidad</span>
                    </div>
                    <form class="asesor-chat-form" id="form-chat-asesor">
                        <button
                            type="button"
                            class="asesor-btn-voz"
                            id="btn-voz-asesor"
                            title="Hablar por micrófono (enviar audio/voz)"
                            aria-label="Dictar por voz"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="12" x2="12" y2="19"/>
                                <line x1="8" y1="22" x2="16" y2="22"/>
                            </svg>
                        </button>
                        <input
                            type="text"
                            id="input-chat-asesor"
                            placeholder="Escribe o pulsa el micrófono para hablar..."
                            autocomplete="off"
                            aria-label="Mensaje para el Asesor IA"
                        >
                        <button type="submit" class="asesor-chat-enviar">Enviar</button>
                    </form>
                </footer>
            </div>
        `;
        document.body.appendChild(drawerDiv);
    }

    static abrirChat(onInitCallback) {
        this.asegurarDrawerEnDOM();
        const panel = document.getElementById('modal-asesor-costia');
        if (!panel) return;

        panel.classList.add('visible');
        document.body.style.overflow = 'hidden';

        const fab = document.getElementById('contenedor-fab-asesor');
        if (fab) fab.classList.add('oculto');

        const contenedor = document.getElementById('asesor-mensajes');
        if (contenedor && contenedor.children.length === 0 && typeof onInitCallback === 'function') {
            onInitCallback();
        }
        setTimeout(() => document.getElementById('input-chat-asesor')?.focus(), 180);
    }

    static cerrarChat(grabandoVoz, reconocimiento) {
        if (grabandoVoz && reconocimiento) {
            try { reconocimiento.stop(); } catch (_) {}
        }
        const panel = document.getElementById('modal-asesor-costia');
        if (!panel) return;

        panel.classList.remove('visible');
        document.body.style.overflow = '';

        const fab = document.getElementById('contenedor-fab-asesor');
        if (fab) fab.classList.remove('oculto');
    }

    static agregarMensajeAgente(html) {
        const contenedor = document.getElementById('asesor-mensajes');
        if (!contenedor) return;

        const msg = document.createElement('div');
        msg.className = 'asesor-msg asesor-msg--agente';
        msg.innerHTML = `
            <div class="asesor-msg__avatar">
                <img src="../assets/img/costia-icon-green.png" alt="Costia">
            </div>
            <div class="asesor-msg__burbuja">
                ${html}
            </div>
        `;
        contenedor.appendChild(msg);
        contenedor.scrollTop = contenedor.scrollHeight;
    }

    static agregarMensajeUsuario(texto) {
        const contenedor = document.getElementById('asesor-mensajes');
        if (!contenedor) return;

        const msg = document.createElement('div');
        msg.className = 'asesor-msg asesor-msg--usuario';
        msg.innerHTML = `
            <div class="asesor-msg__burbuja">
                ${this.escaparHTML(texto)}
            </div>
        `;
        contenedor.appendChild(msg);
        contenedor.scrollTop = contenedor.scrollHeight;
    }

    static mostrarEscribiendo() {
        const contenedor = document.getElementById('asesor-mensajes');
        if (!contenedor) return null;

        const el = document.createElement('div');
        el.className = 'asesor-msg asesor-msg--agente asesor-msg--typing';
        el.innerHTML = `
            <div class="asesor-msg__avatar">
                <img src="../assets/img/costia-icon-green.png" alt="Costia">
            </div>
            <div class="asesor-msg__burbuja asesor-typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        contenedor.appendChild(el);
        contenedor.scrollTop = contenedor.scrollHeight;
        return el;
    }

    static detenerIndicadorVoz() {
        const btnVoz  = document.getElementById('btn-voz-asesor');
        const estadoVoz = document.getElementById('asesor-voz-estado');
        if (btnVoz) {
            btnVoz.classList.remove('asesor-btn-voz--activo');
            btnVoz.classList.remove('grabando');
        }
        if (estadoVoz) {
            estadoVoz.classList.remove('activo');
            estadoVoz.style.display = 'none';
        }
    }

    static mostrarEstadoOllama(ollamaActivo, modeloOllama) {
        if (ollamaActivo) {
            if (window.Store) Store.toast(`Conectado a tu IA Local (${modeloOllama})`);
            this.agregarMensajeAgente(`
                <strong>IA Local Conectada y Lista:</strong><br><br>
                El servidor de <strong>Ollama</strong> está activo en tu equipo (puerto 11434) ejecutando el modelo <strong>${modeloOllama}</strong>.<br><br>
                Tus consultas complejas y dictados de recetas están potenciados con inteligencia artificial local privada en tu máquina, con respaldo del motor financiero de Costia.
            `);
        } else {
            this.agregarMensajeAgente(`
                <strong>Estado de IA Local:</strong> En este momento no detecto el servidor de Ollama respondiendo en tu equipo (puerto 11434).<br><br>
                <em>No te preocupes:</em> el <strong>Asesor Experto Entrenado de Costia</strong> está activo al 100% calculando costos ocultos, punto de equilibrio, fichas técnicas y proporciones exactas.<br><br>
                <small class="asesor-ollama-hint">Para habilitar IA generativa local, inicia Ollama en tu equipo con <code>ollama run qwen2.5:3b</code> y vuelve a pulsar este botón.</small>
            `);
        }
    }

    static actualizarBarraProgreso(contexto, estado, prod) {
        const el = document.getElementById('asesor-progreso-chips');
        if (!el) return;

        let chips = [];

        if (contexto === 'dashboard') {
            const prods = window.Store ? Store.cargarProductos() : [];
            const cfg = window.Store ? Store.cargarConfigGastos() : null;
            chips = [
                { label: 'Rentabilidad', accion: 'dashboard_rentabilidad', ok: prods.length > 0, val: `${prods.length} productos` },
                { label: 'Simular Precios', accion: 'dashboard_simular', ok: true },
                { label: 'Punto Equilibrio', accion: 'dashboard_breakeven', ok: Boolean(cfg?.configurado) },
                { label: 'Gastos Fijos', accion: 'gastos_fijos', ok: Boolean(cfg?.configurado) }
            ];
        } else if (contexto === 'insumos') {
            const insumos = window.Store ? Store.cargarInsumos() : [];
            const cfg = window.Store ? Store.cargarConfigGastos() : null;
            chips = [
                { label: '+ Nuevo Insumo', accion: 'insumos_crear', ok: true },
                { label: 'Registrar Alza', accion: 'insumos_alza', ok: true },
                { label: 'Historial Precios', accion: 'insumos_historial', ok: insumos.length > 0 },
                { label: 'Gastos Fijos', accion: 'gastos_fijos', ok: Boolean(cfg?.configurado) }
            ];
        } else if (contexto === 'productos') {
            const prods = window.Store ? Store.cargarProductos() : [];
            chips = [
                { label: '+ Crear Receta', accion: 'productos_crear', ok: true },
                { label: 'Fichas Técnicas', accion: 'productos_fichas', ok: prods.length > 0 },
                { label: 'Punto Equilibrio', accion: 'productos_breakeven', ok: prods.length > 0 },
                { label: 'Ajustar Precio', accion: 'productos_precio', ok: prods.length > 0 }
            ];
        } else if (contexto === 'ficha-tecnica') {
            chips = [
                { label: 'Imprimir / PDF', accion: 'fichas_imprimir', ok: true },
                { label: 'Desglose Lote', accion: 'fichas_desglose', ok: true },
                { label: 'Apps Delivery', accion: 'fichas_delivery', ok: true },
                { label: 'Punto Equilibrio', accion: 'fichas_breakeven', ok: true }
            ];
        } else {
            // Contexto: crear-producto
            chips = [
                { label: 'Ingredientes', accion: 'ingredientes', ok: Boolean(prod?.tieneIngredientes || estado?.costoIngredientesManual !== null) },
                { label: 'Unidades',     accion: 'unidades',     ok: Boolean((prod?.unidades && prod.unidades > 1) || estado?.unidadesManual !== null) },
                { label: 'Espacio/Local',accion: 'espacio',      ok: estado?.arriendoMensual !== null },
                { label: 'Luz/Gas/Agua', accion: 'servicios',    ok: estado?.recibosMensuales !== null },
                { label: 'Tiempo/Mano',  accion: 'mano_obra',    ok: estado?.horasPorLote !== null },
                { label: 'Empaque/Merma',accion: 'empaque',      ok: estado?.empaqueUnidad !== null }
            ];
        }

        el.innerHTML = chips.map(c => `
            <button type="button" class="asesor-chip ${c.ok ? 'asesor-chip--ok' : ''}" data-chip-accion="${c.accion}" title="Haz clic para activar: ${c.label}">
                ${c.ok ? '<svg class="asesor-chip__check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>' : '<span class="asesor-chip__dot" aria-hidden="true"></span>'}
                <strong>${c.label}</strong>
                ${c.val ? `<small>(${c.val})</small>` : ''}
            </button>
        `).join('');
    }

    static mostrarTarjetaProductoArmado(c, onConfirmar) {
        const fmt = window.Store ? Store.fmt : (v => `$${v}`);

        this.agregarMensajeAgente(`
            ¡Listo! He calculado la estructura oficial de <strong>${c.nombre}</strong> (${c.unidades} ud.) de forma proporcional:
            <div class="asesor-ficha-final">
                <div class="asesor-ficha-final__fila">
                    <span>Ingredientes directos (${c.unidades} ud.)</span>
                    <strong>${fmt(c.baseIngredientes)} (${fmt(c.costoAparenteUnidad)}/ud)</strong>
                </div>
                <div class="asesor-ficha-final__fila">
                    <span>Luz, gas y agua de cocción</span>
                    <strong>+${fmt(c.recibosLote)} / lote</strong>
                </div>
                <div class="asesor-ficha-final__fila">
                    <span>Uso de espacio / Arriendo</span>
                    <strong>+${fmt(c.arriendoLote)} / lote</strong>
                </div>
                <div class="asesor-ficha-final__fila">
                    <span>Mano de obra proporcional</span>
                    <strong>+${fmt(c.manoObraLote)} / lote</strong>
                </div>
                <div class="asesor-ficha-final__fila">
                    <span>Empaque (${fmt(c.empaqueUnidad)}/ud) + Merma (${c.mermaPct}%)</span>
                    <strong>+${fmt(c.costoEmpaqueLote + c.costoMermaLote + c.desgasteLote)} / lote</strong>
                </div>

                <div class="asesor-ficha-final__comparacion">
                    <div>
                        <small>Costo solo materias primas</small>
                        <span>${fmt(c.costoAparenteUnidad)} / ud</span>
                    </div>
                    <div class="destacado">
                        <small>Costo REAL completo</small>
                        <span>${fmt(c.costoRealUnidad)} / ud</span>
                    </div>
                </div>

                <div class="asesor-ficha-final__recomendacion">
                    <div class="asesor-margen-badge">
                        <span>Margen recomendado:</span>
                        <strong>${c.margenComercial}%</strong>
                    </div>
                    <div class="asesor-margen-razon">${c.razonMargen}</div>
                    <div class="precio-grande">${fmt(c.precioRecomendado)} <small>por unidad</small></div>
                    <span class="ganancia-tag">Ganancia libre real: +${fmt(c.gananciaUnidad)} por unidad</span>
                </div>

                <button type="button" class="asesor-btn-confirmar" id="btn-confirmar-asesoria">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px; vertical-align:middle;" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>Aplicar al producto
                </button>
            </div>
        `);

        const contenedor = document.getElementById('asesor-mensajes');
        const botones = contenedor?.querySelectorAll('#btn-confirmar-asesoria');
        const ultimoBtn = botones && botones.length > 0 ? botones[botones.length - 1] : null;
        ultimoBtn?.addEventListener('click', () => {
            if (typeof onConfirmar === 'function') onConfirmar();
        });
    }

    static formatearMarkdown(texto) {
        if (!texto) return '';
        return String(texto)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
    }

    static escaparHTML(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

if (typeof window !== 'undefined') {
    window.AsesorUI = AsesorUI;
}
