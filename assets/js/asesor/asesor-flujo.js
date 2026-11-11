/**
 * asesor-flujo.js — Motor de Diálogo Guiado por Etapas y Estado del Producto
 * Costia · Terminal Pro · Fintech Gastronómica
 *
 * Responsabilidades:
 * - Conducción paso a paso de la creación de recetas (insumos, unidades, espacio, recibos, tiempo, empaque).
 * - Máquina de estados conversacional del asesor.
 * - Respuestas contextuales y fallback amigable sin emojis genéricos.
 */

class AsesorFlujo {
    static responder(agente, texto) {
        const t = texto.toLowerCase();
        const nums = agente.extraerNumeros(texto);
        const prod = agente.obtenerDatosProductoActual();

        if (agente.etapaActual === 'esperando_insumos' && prod.costoTabla > 0) {
            agente.etapaActual = 'esperando_mas_insumos';
        }

        if (agente.etapaActual === 'esperando_insumos') {
            if (nums.length === 0) {
                agente.agregarMensajeAgente(`
                    Dime qué ingredientes lleva tu receta con sus cantidades (por ejemplo: <em>"500 gramos de harina, 100 gramos de azúcar y 2 huevos"</em>) o dime cuánto te cuestan los ingredientes del lote.
                `);
                return;
            }

            let costoMan = nums[0];
            if (costoMan > 0 && costoMan < 100) costoMan *= 1000;
            const unidDetectadas = agente.extraerUnidadesDeTexto(texto);
            const unidMan = unidDetectadas || (nums.length >= 2 ? Math.max(1, Math.round(nums[1])) : null);

            agente.estado.costoIngredientesManual = costoMan;

            if (unidMan) {
                agente.asignarUnidadesProducidas(unidMan);
                agente.etapaActual = 'ubicacion';
                agente.actualizarBarraProgreso();
                const costoUd = Math.round(costoMan / unidMan);
                agente.agregarMensajeAgente(`
                    ¡Perfecto! Tomamos <strong>${Store.fmt(costoMan)} en ingredientes</strong> para <strong>${unidMan} unidad(es)</strong> (${Store.fmt(costoUd)}/ud).<br><br>
                    Ahora dime: <strong>¿produces desde tu casa o pagas arriendo de un local?</strong>
                `);
            } else {
                agente.etapaActual = 'preguntar_unidades';
                agente.actualizarBarraProgreso();
                agente.agregarMensajeAgente(`
                    Anotado: <strong>${Store.fmt(costoMan)} en ingredientes</strong>.<br><br>
                    <strong>¿Cuántas unidades salen o rinde este lote?</strong> (Por ejemplo: <em>"12 panes"</em> o simplemente el número <em>"10"</em>).
                `);
            }
            return;
        }

        if (agente.etapaActual === 'esperando_mas_insumos') {
            if (agente.esFinInsumos(t)) {
                if (!agente.unidadesEspecificadas) {
                    agente.etapaActual = 'preguntar_unidades';
                    agente.actualizarBarraProgreso();
                    agente.agregarMensajeAgente(`
                        ¡Listo! Receta registrada con éxito.<br><br>
                        <strong>¿Cuántas unidades rinde o salen con esta receta?</strong> (Por ejemplo: <em>"12 panes"</em>, <em>"20 porciones"</em> o el número <em>"10"</em>).
                    `);
                } else {
                    agente.etapaActual = 'ubicacion';
                    agente.actualizarBarraProgreso();
                    agente.agregarMensajeAgente(`
                        ¡Excelente! Insumos y unidades confirmados.<br><br>
                        Ahora pasemos a tus gastos de espacio: <strong>¿produces desde tu casa o pagas arriendo de un local?</strong>
                    `);
                }
                return;
            }

            const unid = agente.extraerUnidadesDeTexto(texto);
            if (unid) {
                agente.asignarUnidadesProducidas(unid);
                agente.etapaActual = 'ubicacion';
                agente.actualizarBarraProgreso();
                const p = agente.obtenerDatosProductoActual();
                agente.agregarMensajeAgente(`
                    ¡Anotado! <strong>${unid} unidad(es)</strong> por lote (${Store.fmt(p.costoIngredienteUnidad)}/ud en ingredientes).<br><br>
                    Ahora cuéntame: <strong>¿produces desde tu casa o pagas arriendo de un local?</strong>
                `);
                return;
            }

            agente.agregarMensajeAgente(`
                Si tienes más ingredientes, díctamelos (ej: <em>"200g de mantequilla"</em>). Si ya terminaste, solo dime <strong>"listo"</strong> o <strong>"no más"</strong>.
            `);
            return;
        }

        if (agente.etapaActual === 'preguntar_unidades') {
            const unid = agente.extraerUnidadesDeTexto(texto) || (nums.length > 0 ? nums[0] : null);
            if (unid && unid > 0) {
                agente.asignarUnidadesProducidas(unid);
                agente.etapaActual = 'ubicacion';
                agente.actualizarBarraProgreso();
                const p = agente.obtenerDatosProductoActual();
                agente.agregarMensajeAgente(`
                    ¡Anotado! <strong>${unid} unidad(es)</strong> por lote. El costo de insumos por unidad queda en <strong>${Store.fmt(p.costoIngredienteUnidad)}</strong>.<br><br>
                    Ahora cuéntame: <strong>¿produces desde tu casa o pagas arriendo de un local?</strong>
                `);
            } else {
                agente.agregarMensajeAgente(`¿Cuántas unidades salen con esta receta? (Por ejemplo: <em>"10"</em> o <em>"12 porciones"</em>).`);
            }
            return;
        }

        if (agente.etapaActual === 'ubicacion') {
            const esCasa = /\b(casa|apartamento|hogar|propio|propia|no pago|nada|familiar)\b/.test(t) || agente.esNegacionOCero(t);
            const esLocal = /\b(local|arriendo|alquiler|taller|fabrica|bodega)\b/.test(t);

            if (esCasa) {
                agente.estado.ubicacionDescripcion = 'Desde casa';
                agente.estado.arriendoMensual = 0;
                agente.etapaActual = 'recibos';
                agente.actualizarBarraProgreso();
                agente.agregarMensajeAgente(`
                    ¡Excelente! Trabajar desde casa ahorra arriendo fijo directo.<br><br>
                    Pero los servicios como luz, gas y agua sí se consumen en producción.<br>
                    <strong>¿Cuánto pagas al mes aproximadamente en recibos (luz, gas y agua)?</strong> (Ej: <em>"180 mil"</em> o <em>"250000"</em>).
                `);
                return;
            }

            if (esLocal || nums.length > 0) {
                agente.estado.ubicacionDescripcion = 'Local comercial';
                if (nums.length > 0) {
                    agente.estado.arriendoMensual = agente.normalizarMontoMoneda(nums[0], 'arriendo');
                    agente.etapaActual = 'recibos';
                    agente.actualizarBarraProgreso();
                    agente.agregarMensajeAgente(`
                        Anotado: arriendo de <strong>${Store.fmt(agente.estado.arriendoMensual)}/mes</strong>.<br><br>
                        Y de <strong>servicios públicos (luz, gas, agua)</strong>, ¿cuánto pagas mensualmente en promedio? (Ej: <em>"350 mil"</em>).
                    `);
                } else {
                    agente.agregarMensajeAgente(`¿Cuánto pagas de arriendo mensual por el local? (Ej: <em>"1 millón"</em> o <em>"800.000"</em>).`);
                }
                return;
            }

            agente.agregarMensajeAgente(`¿Produces desde tu casa o en un local con arriendo?`);
            return;
        }

        if (agente.etapaActual === 'recibos') {
            if (nums.length > 0) {
                agente.estado.recibosMensuales = agente.normalizarMontoMoneda(nums[0], 'recibos');
                agente.etapaActual = 'tiempo_empleados';
                agente.actualizarBarraProgreso();
                agente.agregarMensajeAgente(`
                    Listo: <strong>${Store.fmt(agente.estado.recibosMensuales)}/mes</strong> en servicios públicos.<br><br>
                    Pasemos a tu tiempo: <strong>¿cuánto tiempo te toma preparar y hornear este lote?</strong> (Ej: <em>"2 horas"</em>, <em>"45 minutos"</em> o <em>"1.5 horas"</em>).
                `);
            } else if (agente.esNegacionOCero(t)) {
                agente.estado.recibosMensuales = 0;
                agente.etapaActual = 'tiempo_empleados';
                agente.actualizarBarraProgreso();
                agente.agregarMensajeAgente(`Sin costo de servicios asignado.<br><br>¿Cuánto tiempo te toma preparar este lote? (Ej: <em>"1 hora y media"</em>).`);
            } else {
                agente.agregarMensajeAgente(`Dime un valor aproximado mensual de luz, gas y agua (ej: <em>"200 mil"</em>).`);
            }
            return;
        }

        if (agente.etapaActual === 'tiempo_empleados') {
            let horas = null;
            if (/\b(media\s*hora|30\s*min(?:utos?)?|0[.,]5\s*h(?:oras?)?)\b/i.test(t)) horas = 0.5;
            else if (/\b(hora\s*y\s*media|1[.,]5\s*h(?:oras?)?)\b/i.test(t)) horas = 1.5;
            else if (/\b(hora\s*y\s*cuarto|1[.,]25\s*h(?:oras?)?)\b/i.test(t)) horas = 1.25;
            else if (/\b(dos\s*horas\s*y\s*media|2[.,]5\s*h(?:oras?)?)\b/i.test(t)) horas = 2.5;
            else if (/\b(tres\s*horas\s*y\s*media|3[.,]5\s*h(?:oras?)?)\b/i.test(t)) horas = 3.5;
            else if (/\b(45\s*min(?:utos?)?|0[.,]75\s*h(?:oras?)?)\b/i.test(t)) horas = 0.75;
            else if (/\b(15\s*min(?:utos?)?|0[.,]25\s*h(?:oras?)?)\b/i.test(t)) horas = 0.25;
            else if (/\b(\d+(?:[.,]\d+)?)\s*(?:h|hrs?|horas?)\b/i.test(t)) {
                const mH = t.match(/\b(\d+(?:[.,]\d+)?)\s*(?:h|hrs?|horas?)\b/i);
                if (mH) horas = parseFloat(mH[1].replace(',', '.'));
            }
            else if (/\b(\d+)\s*(?:m|mins?|minutos?)\b/i.test(t)) {
                const mM = t.match(/\b(\d+)\s*(?:m|mins?|minutos?)\b/i);
                if (mM) horas = Math.round((parseInt(mM[1], 10) / 60) * 100) / 100;
            }
            else if (nums.length > 0) {
                if (/\bminut/.test(t) && nums[0] >= 10) horas = Math.round((nums[0] / 60) * 100) / 100;
                else horas = nums[0];
            }

            if (horas !== null && horas > 0) {
                agente.estado.horasPorLote = horas;
                agente.etapaActual = 'empaque_merma';
                agente.actualizarBarraProgreso();
                agente.agregarMensajeAgente(`
                    Anotado: <strong>${horas} hora(s)</strong> de trabajo por lote.<br><br>
                    Último detalle de gastos ocultos:<br>
                    <strong>¿Cuánto te cuesta el empaque por unidad</strong> (caja, bolsa, etiqueta, sticker) y tienes alguna merma estimada? (Ej: <em>"500 de caja y 3% de merma"</em>, o <em>"no uso empaque"</em>).
                `);
            } else {
                agente.agregarMensajeAgente(`¿Cuántas horas o minutos te toma preparar este lote? (Ej: <em>"1 hora"</em>, <em>"2.5 horas"</em> o <em>"45 minutos"</em>).`);
            }
            return;
        }

        if (agente.etapaActual === 'empaque_merma') {
            const noEmpaque = /\b(no|nada|ninguno|cero|sin empaque)\b/.test(t) || agente.esNegacionOCero(t);

            if (noEmpaque) {
                agente.estado.empaqueUnidad = 0;
                agente.estado.mermaPct = 2;
            } else {
                let emp = nums.length > 0 ? nums[0] : 0;
                let mer = nums.length > 1 ? nums[1] : (/\bmerma\b/.test(t) && nums.length === 1 ? nums[0] : 3);
                if (emp > 0 && emp < 50 && !/\bpeso|mil\b/.test(t)) emp = emp * 100;
                if (mer > 30) mer = 5;

                agente.estado.empaqueUnidad = emp;
                agente.estado.mermaPct = mer;
            }

            agente.etapaActual = 'completado';
            agente.actualizarBarraProgreso();
            agente.sincronizarFormularioEnVivo();
            agente.mostrarTarjetaProductoArmado();
            return;
        }

        if (agente.etapaActual === 'completado') {
            if (nums.length > 0 && (nums[0] >= 10 && nums[0] <= 90)) {
                agente.estado.margenManual = nums[0];
                agente.sincronizarFormularioEnVivo();
                agente.mostrarTarjetaProductoArmado();
                return;
            }

            agente.responderConsultaEstrategica(t, nums);
            return;
        }

        const contextoPagina = agente.obtenerContextoPagina();

        if (agente.etapaActual === 'insumos_global' || contextoPagina === 'insumos') {
            const insumos = Store.cargarInsumos();
            const resumen = insumos.slice(0, 5).map(i => `• <strong>${i.nombre}</strong> (${Store.fmt(i.precio)}/${i.unidad})`).join('<br>');
            agente.agregarMensajeAgente(`
                Aquí en tu inventario de insumos puedes:<br><br>
                • <strong>Crear insumos:</strong> ej: <em>"crea canela en polvo 250g a 12000"</em>.<br>
                • <strong>Actualizar precios:</strong> ej: <em>"sube el precio de la azúcar a 3500"</em>.<br>
                • <strong>Historial de variaciones:</strong> ej: <em>"¿qué insumos han subido de precio?"</em>.<br><br>
                <strong>Insumos guardados:</strong><br>
                ${resumen || '<em>(Aún no tienes insumos registrados)</em>'}<br><br>
                Dime qué cambio o consulta deseas realizar.
            `);
            return;
        }

        if (agente.etapaActual === 'productos_global' || contextoPagina === 'productos') {
            const prods = Store.cargarProductos();
            const resumen = prods.slice(0, 5).map(p => `• <strong>${p.nombre}</strong>`).join('<br>');
            agente.agregarMensajeAgente(`
                En tu catálogo de productos puedo asistirte con:<br><br>
                • <strong>Ficha técnica oficial en PDF:</strong> ej: <em>"dame la ficha de la torta"</em>.<br>
                • <strong>Punto de equilibrio:</strong> ej: <em>"cuántas unidades debo vender para cubrir fijos"</em>.<br>
                • <strong>Duplicar recetas:</strong> ej: <em>"duplica el pan artesanal"</em>.<br>
                • <strong>Cambiar precio de venta:</strong> ej: <em>"cambia el precio del pan a 4500"</em>.<br><br>
                ¿Con cuál de tus productos deseas trabajar?
            `);
            return;
        }

        agente.agregarMensajeAgente(`
            No alcancé a captar la instrucción exacta, pero estoy listo para ayudarte.<br><br>
            Puedes pedirme:<br>
            • <strong>Ingredientes:</strong> <em>"lleva 500g de harina y 2 huevos"</em>.<br>
            • <strong>Actualizar insumos:</strong> <em>"sube el precio de la azúcar a 50000"</em>.<br>
            • <strong>Ficha Técnica / PDF:</strong> <em>"dame la ficha de mi producto"</em>.<br>
            • <strong>Punto de Equilibrio:</strong> <em>"cuántas unidades debo vender al mes"</em>.<br><br>
            ¿Qué deseas calcular o registrar?
        `);
    }

    static procesarIngredientesMencionados(agente, listaIngredientes, textoOriginal = '') {
        if (!Array.isArray(listaIngredientes) || listaIngredientes.length === 0) return false;

        const cantUnid = agente.extraerUnidadesDeTexto(textoOriginal);
        if (cantUnid) {
            agente.asignarUnidadesProducidas(cantUnid);
        }

        const agregados = [];
        const ambiguos = [];
        const noExisten = [];

        listaIngredientes.forEach(item => {
            const busq = AsesorParser.buscarInsumosEnInventarioConAmbiguedad(item.nombre);
            if (busq.coincidenciaExacta) {
                agente.agregarIngredienteATablaFormulario(busq.coincidenciaExacta, item.cantidad, item.unidad);
                agregados.push(`<strong>${item.cantidad} ${item.unidad} de ${busq.coincidenciaExacta.nombre}</strong>`);
            } else if (busq.esAmbigua && busq.candidatos.length > 1) {
                ambiguos.push({ item, candidatos: busq.candidatos });
            } else {
                noExisten.push(item);
            }
        });

        agente.controlador?.actualizarResumen();
        agente.actualizarBarraProgreso();

        if (agregados.length > 0 && ambiguos.length === 0 && noExisten.length === 0) {
            const prod = agente.obtenerDatosProductoActual();
            agente.etapaActual = 'esperando_mas_insumos';

            let textoUnidades = agente.unidadesEspecificadas
                ? ` (calculado para <strong>${prod.unidades} ud.</strong> · ${Store.fmt(prod.costoIngredienteUnidad)}/ud)`
                : '';

            agente.agregarMensajeAgente(`
                Agregué a tu receta: ${agregados.join(', ')}.<br>
                El costo acumulado de insumos va en <strong>${Store.fmt(prod.costoIngredientesLote)}</strong>${textoUnidades}.<br><br>
                <strong>¿Tu producto lleva algún otro ingrediente?</strong> (Puedes dictarme más insumos, o decirme <strong>"no más"</strong> o <strong>"listo"</strong> si ya están todos).
            `);
            return true;
        }

        if (ambiguos.length > 0) {
            const msgPrevio = agregados.length > 0
                ? `Ya agregué: ${agregados.join(', ')}.<br><br>`
                : '';

            ambiguos.forEach((amb, idx) => {
                const uid = `amb-ins-${Date.now()}-${idx}`;
                agente.insumoPendienteDesambiguar = {
                    accion: 'agregar_receta',
                    cantidad: amb.item.cantidad,
                    unidad: amb.item.unidad,
                    candidatos: amb.candidatos
                };

                const botones = amb.candidatos.map(c => `
                    <button type="button" class="asesor-btn-secundario btn-sel-ambiguo" data-insumo-id="${c.id}" data-cant="${amb.item.cantidad}" data-unid="${amb.item.unidad}" style="text-align:left;margin:4px 0;padding:8px 12px;font-size:13px;border:1px solid #10b981;background:#f0fdf4;border-radius:8px;cursor:pointer;display:block;width:100%;">
                        <strong>${c.nombre}</strong> (${Store.fmt(c.precio)}/${c.unidad})
                    </button>
                `).join('');

                agente.agregarMensajeAgente(`
                    ${idx === 0 ? msgPrevio : ''}
                    <strong>¿Cuál «${amb.item.nombre}» lleva tu receta?</strong><br>
                    Tienes ${amb.candidatos.length} insumos similares en tu inventario para los <strong>${amb.item.cantidad} ${amb.item.unidad}</strong>:<br><br>
                    <div id="card-${uid}">${botones}</div>
                    <small style="color:#6b7280;">(Toca el botón o respóndeme cuál prefieres para añadirlo).</small>
                `);

                setTimeout(() => {
                    document.querySelectorAll('.btn-sel-ambiguo').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-insumo-id');
                            const cant = parseFloat(btn.getAttribute('data-cant'));
                            const unid = btn.getAttribute('data-unid');
                            const insumos = Store.cargarInsumos();
                            const insElegido = insumos.find(i => String(i.id) === String(id));
                            if (insElegido) {
                                agente.insumoPendienteDesambiguar = null;
                                agente.agregarIngredienteATablaFormulario(insElegido, cant, unid);
                                agente.actualizarBarraProgreso();
                                const prod = agente.obtenerDatosProductoActual();
                                agente.agregarMensajeAgente(`
                                    Añadí <strong>${cant} ${unid} de ${insElegido.nombre}</strong> a tu receta.<br>
                                    El costo acumulado de insumos va en <strong>${Store.fmt(prod.costoIngredientesLote)}</strong>.<br><br>
                                    ¿Tu producto lleva algún otro ingrediente o dime <strong>"no más" / "listo"</strong>?
                                `);
                            }
                        });
                    });
                }, 50);
            });
            return true;
        }

        if (noExisten.length > 0) {
            const msgAgregados = agregados.length > 0
                ? `Ya agregué a tu receta: ${agregados.join(', ')}.<br><br>`
                : '';

            noExisten.forEach((faltante, idx) => {
                const uid = `nuevo-ins-${Date.now()}-${idx}`;
                const nombreCapitalizado = faltante.nombre.charAt(0).toUpperCase() + faltante.nombre.slice(1);
                const unidadBaseSugerida = faltante.unidad === 'g' ? 'kg' : (faltante.unidad === 'ml' ? 'l' : faltante.unidad);

                agente.agregarMensajeAgente(`
                    ${idx === 0 ? msgAgregados : ''}
                    El insumo <strong>«${nombreCapitalizado}»</strong> (${faltante.cantidad} ${faltante.unidad}) no está registrado en tu inventario.<br>
                    ¿Confirmas crearlo para añadirlo de una vez a tus insumos y a esta receta?
                    <div class="asesor-confirmar-insumo" id="card-${uid}">
                        <div class="asesor-confirmar-insumo__titulo">Nuevo insumo: ${nombreCapitalizado}</div>
                        <div class="asesor-confirmar-insumo__grid">
                            <input type="number" id="precio-${uid}" placeholder="Precio de compra ($)" min="1" step="any" required>
                            <select id="unidad-${uid}">
                                <option value="kg" ${unidadBaseSugerida === 'kg' ? 'selected' : ''}>por kg</option>
                                <option value="g" ${unidadBaseSugerida === 'g' ? 'selected' : ''}>por g</option>
                                <option value="l" ${unidadBaseSugerida === 'l' ? 'selected' : ''}>por litro</option>
                                <option value="ml" ${unidadBaseSugerida === 'ml' ? 'selected' : ''}>por ml</option>
                                <option value="unidad" ${unidadBaseSugerida === 'unidad' ? 'selected' : ''}>por unidad</option>
                            </select>
                        </div>
                        <div class="asesor-confirmar-insumo__acciones">
                            <button type="button" class="asesor-confirmar-insumo__btn-ok" id="btn-ok-${uid}">
                                Crear y añadir (${faltante.cantidad} ${faltante.unidad})
                            </button>
                            <button type="button" class="asesor-confirmar-insumo__btn-cancel" id="btn-cancel-${uid}">
                                Omitir
                            </button>
                        </div>
                    </div>
                `);

                setTimeout(() => {
                    document.getElementById(`btn-ok-${uid}`)?.addEventListener('click', async () => {
                        const precioVal = parseFloat(document.getElementById(`precio-${uid}`)?.value);
                        const unidadVal = document.getElementById(`unidad-${uid}`)?.value || 'kg';
                        if (!precioVal || precioVal <= 0) {
                            Store.toast(`Ingresa cuánto te cuesta comprar 1 ${unidadVal} de ${nombreCapitalizado}`, 'error');
                            document.getElementById(`precio-${uid}`)?.focus();
                            return;
                        }

                        const btnOk = document.getElementById(`btn-ok-${uid}`);
                        if (btnOk) {
                            btnOk.disabled = true;
                            btnOk.textContent = 'Creando...';
                        }

                        const nuevoInsumo = {
                            id: null,
                            nombre: nombreCapitalizado,
                            unidad: unidadVal,
                            precio: precioVal
                        };

                        await Store.guardarInsumoAsync(nuevoInsumo);
                        Store.notificarActualizacion();

                        const insumosActuales = Store.cargarInsumos();
                        const creado = insumosActuales.find(i => i.nombre.toLowerCase() === nombreCapitalizado.toLowerCase()) || nuevoInsumo;

                        document.getElementById(`card-${uid}`)?.remove();

                        agente.agregarIngredienteATablaFormulario(creado, faltante.cantidad, faltante.unidad);
                        agente.controlador?.actualizarResumen();
                        agente.actualizarBarraProgreso();

                        const prod = agente.obtenerDatosProductoActual();
                        agente.etapaActual = 'esperando_mas_insumos';

                        let txtUnidades = agente.unidadesEspecificadas
                            ? ` (para <strong>${prod.unidades} ud.</strong> · ${Store.fmt(prod.costoIngredienteUnidad)}/ud)`
                            : '';

                        agente.agregarMensajeAgente(`
                            Guardé <strong>${nombreCapitalizado}</strong> en tu inventario a <strong>${Store.fmt(precioVal)} por ${unidadVal}</strong> y lo añadí a esta receta.<br><br>
                            Tu receta suma <strong>${Store.fmt(prod.costoIngredientesLote)}</strong> en insumos${txtUnidades}.<br>
                            <strong>¿Tu producto lleva algún otro ingrediente?</strong> (Díctamelo o dime <strong>"no más" / "listo"</strong>).
                        `);
                    });

                    document.getElementById(`btn-cancel-${uid}`)?.addEventListener('click', () => {
                        document.getElementById(`card-${uid}`)?.remove();
                    });
                }, 50);
            });
            return true;
        }

        return false;
    }
}

if (typeof window !== 'undefined') {
    window.AsesorFlujo = AsesorFlujo;
}
