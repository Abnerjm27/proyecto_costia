/**
 * asesor-comandos.js — Intenciones y Comandos Globales del Asesor IA
 * Costia · Terminal Pro · Fintech Gastronómica
 *
 * Responsabilidades:
 * - Procesamiento de órdenes en lenguaje natural (insumos, recetas, gastos fijos, fichas).
 * - Desambiguación interactiva de insumos similares.
 * - Duplicación de recetas, consultas de rentabilidad y cálculo de punto de equilibrio.
 * - Rediseño estricto: Cero emojis genéricos (uso de tipografía y badges semánticos).
 */

class AsesorComandos {
    static async procesar(agente, texto, nums, contextoActual) {
        // 0. Detección preventiva de solicitudes no soportadas (fuera del alcance gastronómico/financiero)
        if (agente.esSolicitudNoSoportada(texto)) {
            agente.agregarMensajeAgente(`
                <strong>Soy Costia IA, tu copiloto financiero y gastronómico.</strong><br><br>
                Solo puedo ayudarte con tareas de tu negocio gastronómico: costeo de recetas, cálculo de mermas, punto de equilibrio, precios de venta, márgenes y fichas técnicas en PDF.<br><br>
                Por seguridad y diseño de Costia, no puedo realizar tareas fuera de este alcance (como programación, poemas, temas ajenos o eliminación de datos sin confirmación).<br><br>
                ¿En qué receta, ingrediente o costo te puedo colaborar hoy?
            `);
            return true;
        }

        // Consultas globales directas (Rentabilidad, Punto de Equilibrio, Simulación de Pricing)
        if (/\b(rentab(ilidad)?|m[aá]s\s*rentable|ganancia\s*promedio)\b/i.test(texto)) {
            agente.ejecutarAccionChip('dashboard_rentabilidad');
            return true;
        }

        if (/\b(punto\s*de\s*equilibrio|break\s*even|cu[aá]ntas\s*ventas\s*(?:necesito|debo))\b/i.test(texto)) {
            agente.ejecutarAccionChip('dashboard_breakeven');
            return true;
        }

        if (/\b(simula(r)?|simulaci[oó]n\s*de\s*precio)\b/i.test(texto)) {
            agente.ejecutarAccionChip('dashboard_simular');
            return true;
        }

        // A. Comando para crear un insumo nuevo en inventario desde cualquier página
        const esPeticionCrearInsumo = (
            /\b(crea(r)?|agrega(r)?|nuevo(a)?|a[ñn]ad(e|ir)|registrar)\b.*?\b(insumo|ingrediente|materia prima)\b/i.test(texto) ||
            (contextoActual === 'insumos' && /\b(crea(r)?|agrega(r)?|nuevo(a)?|a[ñn]ad(e|ir))\b/i.test(texto) && !/\b(producto|receta)\b/i.test(texto))
        );

        if (esPeticionCrearInsumo) {
            const datosIns = agente.extraerDatosInsumoNuevo(texto);
            if (datosIns && datosIns.esValido) {
                const precioUnitario = Math.round((datosIns.precioTotal / datosIns.cantidad) * 100) / 100;
                await Store.guardarInsumoAsync({
                    id: null,
                    nombre: datosIns.nombre,
                    unidad: datosIns.unidad,
                    precio: precioUnitario
                });
                Store.notificarActualizacion();
                agente.actualizarBarraProgreso();
                agente.agregarMensajeAgente(`
                    ¡Listo! Creé el insumo <strong>${datosIns.nombre}</strong> con éxito:
                    <div class="asesor-confirmar-insumo" style="background:#eef8f3;border-color:#10b981;">
                        <div class="asesor-confirmar-insumo__titulo">Insumo guardado en inventario</div>
                        <div><strong>Compraste:</strong> ${datosIns.cantidad} ${datosIns.unidad}</div>
                        <div><strong>Precio pagado:</strong> ${Store.fmt(datosIns.precioTotal)}</div>
                        <div><strong>Costo base:</strong> ${Store.fmt(precioUnitario)} por ${datosIns.unidad}</div>
                    </div>
                    <small style="color:#0f5132;">Ya está disponible en tu inventario y listo para usar en cualquier receta.</small>
                `);
                return true;
            } else if (datosIns && datosIns.nombre) {
                agente.agregarMensajeAgente(`
                    Entendido, vamos a registrar el insumo <strong>${datosIns.nombre}</strong>.<br><br>
                    ¿Qué cantidad compraste y cuánto pagaste en total? (Por ejemplo: <em>"1 kilo a 25 mil"</em> o <em>"500 gramos a 8000"</em>).
                `);
                return true;
            }
        }

        // B. Historial de variaciones de insumos
        const pideHistorialVariaciones = /\b(historial|variaci[oó]n|cambios|subi[oó]|baj[oó]|alzas?|precios?)\b/i.test(texto) && /\b(insumos?|ingredientes?|precios?)\b/i.test(texto);
        if (pideHistorialVariaciones) {
            const insumos = Store.cargarInsumos();
            const conHistorial = insumos.filter(i => Array.isArray(i.historialPrecios) && i.historialPrecios.length > 1);

            if (conHistorial.length === 0) {
                agente.agregarMensajeAgente(`
                    Actualmente no tienes insumos con variaciones de precio registradas.<br>
                    Puedes registrar un cambio diciendo por ejemplo: <em>"la harina subió a 3.500"</em>.
                `);
                return true;
            }

            const resumenVariaciones = conHistorial.map(i => {
                const ult = i.historialPrecios[i.historialPrecios.length - 1];
                const pen = i.historialPrecios[i.historialPrecios.length - 2];
                const dif = ult.precio - pen.precio;
                const pct = pen.precio > 0 ? Math.round((dif / pen.precio) * 100) : 0;
                const indicativo = dif > 0 ? '[Alza]' : '[Baja]';
                return `• <strong>${i.nombre}</strong>: de ${Store.fmt(pen.precio)} a <strong>${Store.fmt(ult.precio)}</strong> (${dif > 0 ? '+' : ''}${pct}%) ${indicativo}`;
            }).join('<br>');

            agente.agregarMensajeAgente(`
                <strong>Historial de variaciones en tus insumos:</strong><br><br>
                ${resumenVariaciones}<br><br>
                <small style="color:#6b7280;">Tip: Las recetas calculan el costo con el precio más reciente de cada ingrediente.</small>
            `);
            return true;
        }

        // C. Actualizar gastos fijos (arriendo, servicios, trabajadores y nómina)
        // Nota: Si el usuario está en el paso guiado de la receta (etapa 'recibos' o 'ubicacion'), delegamos a AsesorFlujo
        if (agente.etapaActual === 'recibos' && (/\b(servicios|luz|gas|agua|recibos)\b/i.test(texto) || nums.length > 0)) {
            return false;
        }
        if (agente.etapaActual === 'ubicacion' && (/\b(arriendo|alquiler|local|casa)\b/i.test(texto) || nums.length > 0)) {
            return false;
        }

        const pideCambiarFijos = /\b(arriendo|alquiler|servicios|luz|agua|gas|recibos|fijos|trabajador|trabajadores|empleado|empleados|nomina|nómina|sueldo|salario)\b/i.test(texto) && (nums.length > 0 || /\b(cambia|actualiza|sube|baja|pon|guarda|fija|tengo)\b/i.test(texto));
        if (pideCambiarFijos) {
            const cfg = (typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : Store.cargarConfigGastos()) || {};
            let cambio = false;

            if (/\b(trabajador|trabajadores|empleado|empleados)\b/i.test(texto) && nums.length > 0) {
                const matchTrab = texto.match(/(\d+)\s*(trabajador|trabajadores|empleado|empleados)/i);
                const cantTrab = matchTrab ? parseInt(matchTrab[1]) : (nums[0] < 100 ? nums[0] : 1);
                cfg.numTrabajadores = cantTrab;
                cambio = true;
            }

            if (/\b(salario|sueldo|nomina|nómina)\b/i.test(texto) && nums.length > 0) {
                const montoSal = nums.find(n => n >= 500000) || (nums[nums.length - 1] > 100 ? agente.normalizarMontoMoneda(nums[nums.length - 1], 'arriendo') : 1423500);
                cfg.salarioTrabajador = montoSal;
                cambio = true;
            }

            if (/\b(arriendo|alquiler)\b/i.test(texto) && nums.length > 0) {
                const nuevoArriendo = agente.normalizarMontoMoneda(nums[0], 'arriendo');
                cfg.arriendoMensual = nuevoArriendo;
                cfg.configurado = true;
                agente.estado.arriendoMensual = nuevoArriendo;
                cambio = true;
            }

            if (/\b(servicios|luz|gas|agua|recibos)\b/i.test(texto) && nums.length > 0) {
                const nuevoServ = agente.normalizarMontoMoneda(nums[nums.length > 1 ? 1 : 0], 'recibos');
                cfg.recibosMensuales = nuevoServ;
                cfg.configurado = true;
                agente.estado.recibosMensuales = nuevoServ;
                cambio = true;
            }

            if (cambio) {
                Store.guardarConfigGastos(cfg);
                agente.actualizarBarraProgreso();
                const trabLabel = (cfg.numTrabajadores || 0) > 0 ? `• <strong>Nómina:</strong> ${cfg.numTrabajadores} trabajador(es) × ${Store.fmt(cfg.salarioTrabajador || 0)} = ${Store.fmt(cfg.nominaMensualTotal || 0)}/mes<br>` : '';
                agente.agregarMensajeAgente(`
                    ¡Listo! Gastos fijos actualizados en tu negocio:<br>
                    • <strong>Arriendo:</strong> ${Store.fmt(cfg.arriendoMensual || 0)}/mes<br>
                    • <strong>Servicios:</strong> ${Store.fmt(cfg.recibosMensuales || 0)}/mes<br>
                    ${trabLabel}
                    • <strong>Cuota fija por lote:</strong> ${Store.fmt(cfg.cuotaFijaTotalPorLote || 0)} / lote<br><br>
                    <small style="color:#0f5132;">Tus productos, recetas y fichas técnicas se actualizarán con estos nuevos montos.</small>
                `);
                return true;
            }
        }

        // D. Duplicar / Clonar Recetas desde el chat
        const pideDuplicar = /\b(duplica(r)?|clona(r)?|copia(r)?|reproduce|dupl[ií]came)\b.*?\b(receta|producto)?\b/i.test(texto);
        if (pideDuplicar) {
            const productos = Store.cargarProductos();
            let prodRef = agente.buscarProductoPorTexto(texto);

            if (prodRef) {
                const nuevoNombre = `${prodRef.nombre} (Copia)`;
                const clon = Store.duplicarProducto(prodRef.id, nuevoNombre);
                if (clon) {
                    agente.agregarMensajeAgente(`
                        ¡Listo! He duplicado la receta de <strong>${prodRef.nombre}</strong> con el nombre <strong>${nuevoNombre}</strong>.<br><br>
                        Tiene los mismos ingredientes y proporciones guardados.<br><br>
                        <a href="crear-producto.html?editar=${clon.id}" class="asesor-btn-confirmar" style="display:inline-block;text-decoration:none;padding:8px 14px;">
                            Abrir y editar ${nuevoNombre}
                        </a>
                    `);
                    return true;
                }
            } else if (productos.length > 0) {
                const botonesProds = productos.map(p => `
                    <button type="button" class="asesor-btn-secundario" data-duplicar-id="${p.id}" style="margin:4px;padding:6px 12px;font-size:12px;border:1px solid #10b981;background:#f0fdf4;border-radius:6px;cursor:pointer;">
                        Duplicar ${p.nombre}
                    </button>
                `).join('');

                agente.agregarMensajeAgente(`
                    ¿Cuál de tus recetas deseas duplicar?<br><br>
                    ${botonesProds}
                `);

                setTimeout(() => {
                    document.querySelectorAll('[data-duplicar-id]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-duplicar-id');
                            const base = productos.find(p => p.id === id);
                            if (base) {
                                const nuevo = Store.duplicarProducto(id, `${base.nombre} (Copia)`);
                                if (nuevo) {
                                    agente.agregarMensajeAgente(`
                                        ¡Listo! Receta duplicada: <strong>${nuevo.nombre}</strong>.<br><br>
                                        <a href="crear-producto.html?editar=${nuevo.id}" class="asesor-btn-confirmar" style="display:inline-block;text-decoration:none;padding:8px 14px;">
                                            Editar receta copiada
                                        </a>
                                    `);
                                }
                            }
                        });
                    });
                }, 50);
                return true;
            }
        }

        // E. Cambiar Precio de Venta de un Producto
        const pideCambiarPrecioVenta = /\b(cambia(r)?|sube|baja|pon(le)?|fija(r)?|modifica(r)?)\b.*?\b(precio|venta|cobro)\b/i.test(texto);
        if (pideCambiarPrecioVenta && nums.length > 0) {
            const prodRef = agente.buscarProductoPorTexto(texto);
            if (prodRef) {
                const nuevoPrecio = nums[0];
                prodRef.precioVentaManual = nuevoPrecio;
                prodRef.usarPrecioManual = true;
                Store.guardarProducto(prodRef);
                Store.notificarActualizacion();

                const insumos = Store.cargarInsumos();
                const nuevoMargen = prodRef.calcularMargenReal(insumos);
                const nuevaGanancia = prodRef.calcularGananciaNeta(insumos);

                agente.agregarMensajeAgente(`
                    ¡Listo! Actualicé el precio de venta de <strong>${prodRef.nombre}</strong> a <strong>${Store.fmt(nuevoPrecio)}</strong>.<br><br>
                    • <strong>Margen libre real:</strong> ${nuevoMargen}%<br>
                    • <strong>Ganancia neta:</strong> +${Store.fmt(nuevaGanancia)} por unidad.<br>
                    <small style="color:#0f5132;">El cambio ya está guardado en tu catálogo y en la ficha técnica.</small>
                `);
                return true;
            }
        }

        // F. Consulta / Impresión de Ficha Técnica Oficial en PDF
        const pideFichaTecnica = /\b(ficha(\s*t[eé]cnica)?|pdf|imprimir|hoja\s*de\s*costos|ficha\s*oficial)\b/i.test(texto);
        if (pideFichaTecnica) {
            const productos = Store.cargarProductos();
            const nombreConsultado = agente.extraerNombreProductoConsultado(texto);
            let prodRef = agente.buscarProductoPorTexto(texto);

            if (!prodRef && nombreConsultado) {
                const listaActuales = productos.length > 0
                    ? productos.map(p => `• <strong>${p.nombre}</strong>`).join('<br>')
                    : '<em>(Aún no tienes productos registrados)</em>';

                agente.agregarMensajeAgente(`
                    <strong>Producto no encontrado:</strong><br>
                    No encontré registrado ningún producto con el nombre <strong>"${nombreConsultado}"</strong>.<br><br>
                    <strong>Tus productos registrados son:</strong><br>
                    ${listaActuales}<br><br>
                    ¿Deseas ver la ficha técnica de alguno de ellos o prefieres crear la receta de <strong>"${nombreConsultado}"</strong>?<br><br>
                    <a href="crear-producto.html" class="asesor-btn-confirmar" style="display:inline-block;text-decoration:none;padding:8px 14px;">
                        + Crear receta de ${nombreConsultado}
                    </a>
                `);
                return true;
            }

            if (prodRef) {
                agente.agregarMensajeAgente(`
                    <strong>Ficha Técnica de ${prodRef.nombre}:</strong><br><br>
                    He preparado la ficha técnica oficial con la composición al gramo, merma, empaque, cuota de arriendo y punto de equilibrio listo para imprimir o guardar en PDF.<br><br>
                    <div style="display:flex;gap:8px;flex-direction:column;margin-top:6px;">
                        <a href="ficha-tecnica.html?id=${prodRef.id}" target="_blank" class="asesor-btn-confirmar" style="display:block;text-align:center;text-decoration:none;padding:10px 14px;">
                            Ver Ficha Técnica Oficial
                        </a>
                        <a href="ficha-tecnica.html?id=${prodRef.id}&print=1" target="_blank" class="asesor-btn-secundario" style="display:block;text-align:center;text-decoration:none;padding:8px 14px;background:#f3f4f6;color:#1b4332;border:1px solid #d1d5db;border-radius:10px;font-weight:600;">
                            Imprimir / Guardar en PDF directo
                        </a>
                    </div>
                `);
                return true;
            } else if (productos.length > 0) {
                const botonesProds = productos.map(p => `
                    <a href="ficha-tecnica.html?id=${p.id}" target="_blank" style="display:block;padding:8px 12px;margin-bottom:6px;background:#eef8f3;color:#0b3d2e;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;border:1px solid rgba(15,157,108,0.2);">
                        ${p.nombre} →
                    </a>
                `).join('');

                agente.agregarMensajeAgente(`
                    <strong>Fichas Técnicas Oficiales en PDF:</strong><br>
                    Selecciona qué producto deseas ver o imprimir:<br><br>
                    ${botonesProds}
                `);
                return true;
            }
        }

        // G. Consulta de Punto de Equilibrio (Break-Even)
        const pidePuntoEquilibrio = /\b(punto\s*de\s*equilibrio|break\s*even|equilibrio|cu[aá]nt[ao]s?\s*(unidades|panes|porciones|productos)?\s*(debo|tengo\s*que|necesito|para)\s*vender|cubrir\s*(arriendo|fijos|gastos))\b/i.test(texto);
        if (pidePuntoEquilibrio) {
            const insumos = Store.cargarInsumos();
            const productos = Store.cargarProductos();
            const cfg = (typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : Store.cargarConfigGastos()) || {};
            const fijosTotal = (cfg.arriendoMensual || 0) + (cfg.recibosMensuales || 0);

            const nombreConsultado = agente.extraerNombreProductoConsultado(texto);
            let prodRef = agente.buscarProductoPorTexto(texto);

            if (!prodRef && nombreConsultado) {
                const listaActuales = productos.length > 0
                    ? productos.map(p => `• <strong>${p.nombre}</strong>`).join('<br>')
                    : '<em>(Aún no tienes productos registrados)</em>';

                agente.agregarMensajeAgente(`
                    <strong>Producto no encontrado:</strong><br>
                    No encontré registrado el producto <strong>"${nombreConsultado}"</strong> para calcular su punto de equilibrio.<br><br>
                    <strong>Tus productos registrados son:</strong><br>
                    ${listaActuales}<br><br>
                    ¿Deseas calcular el punto de equilibrio de alguno de ellos o crear la receta de <strong>"${nombreConsultado}"</strong>?<br><br>
                    <a href="crear-producto.html" class="asesor-btn-confirmar" style="display:inline-block;text-decoration:none;padding:8px 14px;">
                        + Crear receta de ${nombreConsultado}
                    </a>
                `);
                return true;
            }

            if (prodRef) {
                const costoUd = prodRef.calcularCostoUnidad(insumos);
                const precioVenta = prodRef.calcularPrecioVenta(insumos);
                const gananciaUd = prodRef.calcularGananciaNeta(insumos);

                if (fijosTotal > 0 && gananciaUd > 0) {
                    const pe = agente.calcularPuntoEquilibrio(gananciaUd, fijosTotal);
                    agente.agregarMensajeAgente(`
                        <strong>Punto de Equilibrio de ${prodRef.nombre}:</strong><br><br>
                        • <strong>Gastos fijos mensuales:</strong> ${Store.fmt(fijosTotal)}/mes (arriendo: ${Store.fmt(cfg.arriendoMensual || 0)} + recibos: ${Store.fmt(cfg.recibosMensuales || 0)})<br>
                        • <strong>Ganancia neta por unidad:</strong> +${Store.fmt(gananciaUd)} (Precio: ${Store.fmt(precioVenta)} − Costo: ${Store.fmt(costoUd)})<br><br>
                        Para cubrir tus gastos fijos exclusivamente con este producto, requieres vender mínimo:
                        <div style="background:#eef8f3;border:1px solid #10b981;border-radius:10px;padding:10px 14px;margin:8px 0;font-size:14px;color:#0b3d2e;">
                            <strong>Meta: ${pe.unidadesMes} unidades al mes</strong> (~<strong>${pe.unidadesDia} unidades/día</strong>).
                        </div>
                        <small style="color:#0f5132;">A partir de la unidad ${pe.unidadesMes + 1}, toda venta es ganancia líquida pura para tu negocio.</small>
                    `);
                    return true;
                } else if (fijosTotal <= 0) {
                    agente.agregarMensajeAgente(`
                        Para calcular tu punto de equilibrio exacto, primero configuremos tus gastos fijos mensuales.<br><br>
                        Dime cuánto pagas de arriendo y de recibos (ej: <em>"pago 800 mil de arriendo y 200 mil de luz"</em>) o pulsa <strong>Gastos fijos</strong> arriba.
                    `);
                    return true;
                }
            } else if (productos.length > 0) {
                const botonesPE = productos.map(p => `
                    <button type="button" class="asesor-btn-secundario" data-pe-id="${p.id}" style="margin:4px;padding:6px 12px;font-size:12px;border:1px solid #10b981;background:#f0fdf4;border-radius:6px;cursor:pointer;">
                        ${p.nombre}
                    </button>
                `).join('');

                agente.agregarMensajeAgente(`
                    <strong>Punto de Equilibrio:</strong><br>
                    Selecciona para cuál de tus productos deseas calcular cuántas unidades necesitas vender al mes:<br><br>
                    ${botonesPE}
                `);

                setTimeout(() => {
                    document.querySelectorAll('[data-pe-id]').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const id = btn.getAttribute('data-pe-id');
                            const p = productos.find(x => x.id === id);
                            if (p) {
                                const inputChat = document.getElementById('input-chat-asesor');
                                if (inputChat) {
                                    inputChat.value = `punto de equilibrio de ${p.nombre}`;
                                    agente.procesarEntradaUsuario();
                                }
                            }
                        });
                    });
                }, 50);
                return true;
            }
        }

        // H. Consulta de Rentabilidad de un Producto
        const pideRentabilidad = /\b(cu[aá]nto\s*(gano|le\s*gano|dejo|margen|ganancia)|rentable|rentabilidad)\b/i.test(texto);
        if (pideRentabilidad) {
            const prodRef = agente.buscarProductoPorTexto(texto);
            if (prodRef) {
                const insumos = Store.cargarInsumos();
                const costoUd = prodRef.calcularCostoUnidad(insumos);
                const precioVenta = prodRef.calcularPrecioVenta(insumos);
                const gananciaUd = prodRef.calcularGananciaNeta(insumos);
                const margenPct = prodRef.calcularMargenReal(insumos);

                agente.agregarMensajeAgente(`
                    <strong>Rentabilidad de ${prodRef.nombre}:</strong><br><br>
                    • <strong>Costo por unidad:</strong> ${Store.fmt(costoUd)}<br>
                    • <strong>Precio de venta:</strong> ${Store.fmt(precioVenta)}<br>
                    • <strong>Ganancia neta:</strong> +${Store.fmt(gananciaUd)} por unidad<br>
                    • <strong>Margen real:</strong> <strong>${margenPct}%</strong><br><br>
                    ${margenPct >= 40 ? 'Excelente margen de rentabilidad comercial.' : 'Margen ajustado. Considera revisar el tiempo o el precio de venta.'}
                `);
                return true;
            }
        }

        // I. Si el usuario pide crear una nueva receta desde cualquier pantalla
        const pideCrearReceta = /\b(crea(r)?|nueva|nuevo|empezar|hacer|costear)\b.*?\b(receta|producto|torta|pan|galleta|postre|plato)\b/i.test(texto);
        if (pideCrearReceta && contextoActual !== 'crear-producto') {
            agente.agregarMensajeAgente(`
                ¡Claro que sí! Vamos a costear tu nuevo producto al gramo con gastos ocultos.<br><br>
                <a href="crear-producto.html" class="asesor-btn-confirmar" style="display:inline-block;text-decoration:none;padding:10px 16px;">
                    Abrir Creador de Recetas
                </a>
            `);
            return true;
        }

        return false;
    }

    static ejecutarAccionChip(agente, accion) {
        if (!accion) return;
        const prod = agente.obtenerDatosProductoActual();

        switch(accion) {
            case 'ingredientes':
                agente.etapaActual = 'esperando_insumos';
                agente.agregarMensajeAgente(`
                    <strong>Gestión de Ingredientes de la Receta:</strong><br>
                    Dime qué materias primas lleva tu preparación y en qué cantidad. Por ejemplo:<br>
                    • <em>"Lleva 500 gramos de harina, 200g de mantequilla y 3 huevos"</em><br>
                    • <em>"Añade 50g de levadura a 4.500"</em><br>
                    • <em>"¿Cuánto cuesta el kilo de queso?"</em><br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Lleva 500g de harina y 200g mantequilla">+ 500g Harina y 200g Mantequilla</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="¿Cuánto cuesta la mantequilla?">¿Cuánto cuesta la mantequilla?</button>
                    </div>
                `);
                break;

            case 'unidades':
                agente.etapaActual = 'unidades';
                agente.agregarMensajeAgente(`
                    <strong>Rendimiento del Lote:</strong><br>
                    ¿Cuántas porciones o unidades finales salen de esta receta?<br>
                    Actualmente está en <strong>${prod.unidades} unidad(es)</strong>.<br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Rinde 10 unidades">Rinde 10 unidades</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Rinde 12 porciones">Rinde 12 porciones</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Rinde 24 unidades">Rinde 24 unidades</button>
                    </div>
                `);
                break;

            case 'espacio':
                agente.etapaActual = 'ubicacion';
                agente.agregarMensajeAgente(`
                    <strong>Uso de Espacio y Arriendo:</strong><br>
                    ¿Trabajas desde tu casa o pagas arriendo mensual de local/taller?<br>
                    Si pagas arriendo, lo distribuiré equitativamente entre tus recetas para que no pierdas dinero.<br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Trabajo desde casa">Trabajo desde casa ($0)</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Pago 1.200.000 de arriendo">Pago $1.200.000 arriendo</button>
                    </div>
                `);
                break;

            case 'servicios':
                agente.etapaActual = 'recibos';
                agente.agregarMensajeAgente(`
                    <strong>Servicios Públicos (Luz / Gas / Agua):</strong><br>
                    ¿Cuánto pagas en promedio al mes por el consumo energético y servicios de tu cocina o taller?<br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Pago 350.000 de servicios">Pago $350.000 de recibos</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Pago 600.000 de servicios">Pago $600.000 de recibos</button>
                    </div>
                `);
                break;

            case 'mano_obra':
                agente.etapaActual = 'tiempo_empleados';
                agente.agregarMensajeAgente(`
                    <strong>Tiempo y Mano de Obra:</strong><br>
                    ¿Cuánto tiempo en horas o minutos toma preparar este lote y cuánto vale la hora de trabajo?<br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Tardo 1 hora y trabajo solo">1 hora de trabajo</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Tardo 2 horas">2 horas de trabajo</button>
                    </div>
                `);
                break;

            case 'empaque':
                agente.etapaActual = 'empaque_merma';
                agente.agregarMensajeAgente(`
                    <strong>Empaque y Merma Técnica:</strong><br>
                    ¿Cuánto gastas en el empaque individual (bolsa, domo, etiqueta) y qué porcentaje de merma calculas en cocción o porcionado?<br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Empaque 500 y 5% merma">Empaque $500 y 5% merma</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Empaque 1000 sin merma">Empaque $1.000 sin merma</button>
                    </div>
                `);
                break;

            case 'dashboard_rentabilidad':
            case 'productos_rentabilidad': {
                const prods = typeof Store !== 'undefined' ? Store.cargarProductos() : [];
                const insumos = typeof Store !== 'undefined' ? Store.cargarInsumos() : [];
                if (prods.length === 0) {
                    agente.agregarMensajeAgente(`Actualmente no tienes productos registrados en tu catálogo. Puedes crear uno diciendo: <em>"quiero costear un producto nuevo"</em>.`);
                    return;
                }
                const analizados = prods.map(p => {
                    const costo = p.calcularCostoUnidad(insumos);
                    const precio = p.calcularPrecioVenta(insumos);
                    const ganancia = p.calcularGananciaNeta(insumos);
                    const margenPct = costo > 0 ? Math.round((ganancia / costo) * 100) : 0;
                    return { nombre: p.nombre, costo, precio, ganancia, margenPct };
                }).sort((a, b) => b.margenPct - a.margenPct);

                const top = analizados[0];
                const bajo = analizados[analizados.length - 1];
                agente.agregarMensajeAgente(`
                    <strong>Análisis de Rentabilidad en Vivo:</strong><br><br>
                    • <strong>Producto más rentable:</strong> ${top.nombre} (Margen: <strong>+${top.margenPct}%</strong>, ganancia neta: <strong>+${Store.fmt(top.ganancia)}/ud</strong>).<br>
                    ${analizados.length > 1 ? `• <strong>Menor margen:</strong> ${bajo.nombre} (+${bajo.margenPct}% margen).<br>` : ''}
                    • <strong>Promedio de ganancia:</strong> +${Store.fmt(analizados.reduce((acc, p) => acc + p.ganancia, 0) / analizados.length)} / unidad.<br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Simular precio de venta de ${top.nombre}">Simular ${top.nombre}</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="¿Cuál es mi punto de equilibrio?">Punto de equilibrio</button>
                    </div>
                `);
                break;
            }

            case 'dashboard_simular':
            case 'productos_precio':
                agente.agregarMensajeAgente(`
                    <strong>Simulador de Precios y Elasticidad:</strong><br>
                    Dime el nombre del producto y el margen deseado o nuevo precio que quieres probar.<br>
                    Ejemplos:<br>
                    • <em>"¿A cómo vendo el Pan artesanal para ganar el 60%?"</em><br>
                    • <em>"Cambia el precio del pan a 4.500"</em><br>
                    • <em>"¿Cuánto debería cobrar en Rappi por la Torta de chocolate?"</em><br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="¿A cómo vendo el Pan artesanal con 55% de margen?">Pan con 55% margen</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="¿Cuánto cobrar en Rappi por la Torta de chocolate?">Precio Rappi Torta</button>
                    </div>
                `);
                break;

            case 'dashboard_breakeven':
            case 'productos_breakeven':
            case 'fichas_breakeven': {
                const gastos = typeof Store !== 'undefined' ? Store.cargarConfigGastos() : {};
                const fijos = (gastos.arriendoMensual || 0) + (gastos.recibosMensuales || 0);
                const prods = typeof Store !== 'undefined' ? Store.cargarProductos() : [];
                const insumos = typeof Store !== 'undefined' ? Store.cargarInsumos() : [];

                if (fijos === 0) {
                    agente.agregarMensajeAgente(`
                        <strong>Punto de Equilibrio:</strong><br>
                        Aún no tienes registrados costos fijos mensuales (arriendo y servicios). Puedes configurarlos diciendo: <em>"el arriendo vale 1.200.000 y servicios 300.000"</em> o abriendo el botón <strong>Gastos fijos</strong> arriba.
                    `);
                    return;
                }

                let textoBE = `<strong>Punto de Equilibrio Operativo (${Store.fmt(fijos)}/mes fijos):</strong><br><br>`;
                prods.slice(0, 3).forEach(p => {
                    const ganancia = p.calcularGananciaNeta(insumos);
                    if (ganancia > 0) {
                        const udsMes = Math.ceil(fijos / ganancia);
                        const udsDia = (udsMes / 30).toFixed(1);
                        textoBE += `• <strong>${p.nombre}:</strong> vender <strong>${udsMes} uds/mes</strong> (~${udsDia} uds/día).<br>`;
                    }
                });
                textoBE += `<br>A partir de esas ventas, todo ingreso adicional es ganancia pura de bolsillo.`;
                agente.agregarMensajeAgente(textoBE);
                break;
            }

            case 'gastos_fijos':
                if (typeof Store !== 'undefined' && typeof Store.abrirModalConfigGastos === 'function') {
                    Store.abrirModalConfigGastos();
                } else {
                    agente.agregarMensajeAgente(`Puedes decirme tus gastos fijos directamente: por ejemplo <em>"mi arriendo vale 1.200.000 y recibos 400.000"</em>.`);
                }
                break;

            case 'insumos_crear':
                agente.agregarMensajeAgente(`
                    <strong>Crear Insumo en Inventario:</strong><br>
                    Dime el nombre, la cantidad y el costo de compra. Yo lo guardo automáticamente en tu base de datos.<br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Crea Harina de almendras 1 kg a 28000">Harina almendras 1kg $28.000</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="Crea Chocolate cobertura 500 gramos a 12000">Chocolate 500g $12.000</button>
                    </div>
                `);
                break;

            case 'insumos_alza':
                agente.agregarMensajeAgente(`
                    <strong>Registrar Alza de Insumo:</strong><br>
                    Dime qué insumo cambió de precio para actualizar tus costos y alertarte sobre el impacto en tus recetas.<br>
                    <div class="asesor-sugerencias-fila">
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="La harina de trigo subió a 4200">Harina subió a $4.200</button>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="La mantequilla subió a 4500">Mantequilla subió a $4.500</button>
                    </div>
                `);
                break;

            case 'insumos_historial':
                agente.procesarEntradaUsuarioConTexto('¿qué insumos han subido o cambiado de precio?');
                break;

            case 'productos_crear':
                if (window.location.pathname.includes('crear-producto.html')) {
                    agente.ejecutarAccionChip('ingredientes');
                } else {
                    window.location.href = 'crear-producto.html';
                }
                break;

            case 'productos_fichas':
            case 'fichas_imprimir':
                agente.agregarMensajeAgente(`
                    <strong>Fichas Técnicas Oficiales de Costeo:</strong><br>
                    Puedes abrir cualquier ficha técnica para imprimirla o guardarla en PDF con formato estandarizado.<br>
                    <div class="asesor-sugerencias-fila">
                        <a href="ficha-tecnica.html" class="asesor-sugerencia-pill">Abrir Catálogo de Fichas</a>
                        <button type="button" class="asesor-sugerencia-pill" data-sugerencia="dame la ficha técnica del pan artesanal">Ficha Pan artesanal</button>
                    </div>
                `);
                break;

            case 'fichas_desglose':
                agente.agregarMensajeAgente(`
                    <strong>Desglose de Materias Primas y Costos:</strong><br>
                    El costo de cada unidad se calcula sumando:<br>
                    1. <strong>Insumos directos</strong> (gramo a gramo según precio de compra).<br>
                    2. <strong>Merma técnica</strong> (pérdida en horneado o limpieza).<br>
                    3. <strong>Empaque y embalaje</strong> por unidad.<br>
                    4. <strong>Cuota de gastos fijos</strong> (arriendo y servicios prorrateados).
                `);
                break;

            case 'fichas_delivery': {
                const cfgDel = typeof Store !== 'undefined' && typeof Store.obtenerConfigGastos === 'function' ? Store.obtenerConfigGastos() : {};
                const pctDel = cfgDel.comisionDeliveryPct ?? 25;
                const ejemplo = Math.round(10000 / (1 - pctDel / 100));
                agente.agregarMensajeAgente(`
                    <strong>Precio Recomendado para Plataformas (Rappi / DiDi):</strong><br>
                    Tu comisión de apps configurada es <strong>${pctDel}%</strong>. Para no perder tu margen de mostrador, el precio en app se calcula dividiendo tu precio de mostrador entre <code>(1 - comisión)</code>.<br>
                    Por ejemplo, con ${pctDel}% de comisión: un producto de $10.000 mostrador debe venderse en <strong>${Store.fmt(ejemplo)}</strong> en la app.
                `);
                break;
            }

            default:
                break;
        }
        agente.actualizarBarraProgreso();
    }
}

if (typeof window !== 'undefined') {
    window.AsesorComandos = AsesorComandos;
}
