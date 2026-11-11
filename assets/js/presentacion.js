/**
 * Costia — JavaScript Interactivo de la Landing Page "Atelier Gastronómico"
 * Motor unificado de la Mesa de Costeo Viva, sincronización de recetas,
 * cálculo proporcional en tiempo real y acordeón FAQ accesible.
 *
 * Cero Emojis · Tipografía Tabular · Micro-interacciones Emil Kowalski
 */

document.addEventListener('DOMContentLoaded', () => {
    inicializarMesaCosteo();
    inicializarFaq();
    inicializarScrollSuave();
});

// ─── 1. RECETAS DEMO SINCRONIZADAS ──────────────────────────────
const RECETAS_DEMO = {
    pan: {
        nombre: 'Pan de Masa Madre (Hogaza 750 g)',
        tipo: 'Panadería artesanal · Lote de 10 hogazas',
        costoLote: 54500,
        unidades: 10,
        margen: 60,
        incluirFijos: true,
        lineas: [
            { desc: 'Harina de fuerza + centeno · 5.0 kg', costo: '$ 28.500' },
            { desc: 'Mantequilla de vaca + sal marina · 600 g', costo: '$ 17.200' },
            { desc: 'Empaque papel kraft + etiqueta · 10 ud', costo: '$ 8.800' }
        ]
    },
    torta: {
        nombre: 'Torta Húmeda de Cacao 70% (12 porciones)',
        tipo: 'Repostería de autor · Molde 22 cm',
        costoLote: 46800,
        unidades: 12,
        margen: 65,
        incluirFijos: true,
        lineas: [
            { desc: 'Cacao 70% origen + cobertura · 450 g', costo: '$ 22.400' },
            { desc: 'Huevos de campo, harina y azúcar · lote', costo: '$ 15.600' },
            { desc: 'Caja pastelera + bases doradas · 12 ud', costo: '$ 8.800' }
        ]
    },
    cafe: {
        nombre: 'Combo Café Filtrado & Alfajor de Almendra',
        tipo: 'Cafetería de especialidad · Lote de 20 combos',
        costoLote: 64000,
        unidades: 20,
        margen: 58,
        incluirFijos: true,
        lineas: [
            { desc: 'Café de especialidad en grano · 400 g', costo: '$ 29.000' },
            { desc: 'Harina de almendra + arequipe · lote', costo: '$ 23.000' },
            { desc: 'Vasos doble pared + servilletas · 20 ud', costo: '$ 12.000' }
        ]
    }
};

// ─── 2. FORMATEO DE MONEDA Y CIFRAS ──────────────────────────────
function formatoPesos(num) {
    if (isNaN(num) || !isFinite(num)) return '$ 0';
    return '$ ' + Math.round(num).toLocaleString('es-CO');
}

// ─── 3. MOTOR UNIFICADO DE LA MESA DE COSTEO ─────────────────────
function inicializarMesaCosteo() {
    const tabs = document.querySelectorAll('.hero-receta-tab');
    const elRecetaNombre = document.getElementById('mesa-receta-nombre');
    const elRecetaTipo = document.getElementById('mesa-receta-tipo');
    const elInsumosLista = document.getElementById('mesa-insumos-lista');

    const inputCosto = document.getElementById('sim-costo');
    const inputUnidades = document.getElementById('sim-unidades');
    const btnMenos = document.getElementById('btn-unidades-menos');
    const btnMas = document.getElementById('btn-unidades-mas');
    const inputMargen = document.getElementById('sim-margen');
    const valMargenDisplay = document.getElementById('sim-margen-display');
    const checkFijos = document.getElementById('sim-fijos');

    // Elementos de la barra proporcional
    const barraCosto = document.getElementById('barra-seg-costo');
    const barraFijos = document.getElementById('barra-seg-fijos');
    const barraUtilidad = document.getElementById('barra-seg-utilidad');
    const txtLeyendaCosto = document.getElementById('leyenda-pct-costo');
    const txtLeyendaFijos = document.getElementById('leyenda-pct-fijos');
    const txtLeyendaUtilidad = document.getElementById('leyenda-pct-utilidad');

    // Elementos de resultados numéricos
    const resCosto = document.getElementById('sim-res-costo');
    const resFijos = document.getElementById('sim-res-fijos');
    const resPrecio = document.getElementById('sim-res-precio');
    const resGanancia = document.getElementById('sim-res-ganancia');
    const resLote = document.getElementById('sim-res-lote');
    const badgeEstado = document.getElementById('sim-estado-badge');
    const resConsejo = document.getElementById('sim-res-consejo');

    if (!inputCosto || !inputUnidades || !inputMargen) return;

    function recalcular() {
        const costoLote = Math.max(100, parseFloat(inputCosto.value) || 0);
        const unidades = Math.max(1, Math.round(parseFloat(inputUnidades.value) || 1));
        const margenPct = Math.min(85, Math.max(10, parseFloat(inputMargen.value) || 50));
        const incluirFijos = checkFijos ? checkFijos.checked : true;

        if (valMargenDisplay) {
            valMargenDisplay.textContent = `${margenPct}%`;
        }

        // Costos unitarios
        const costoDirectoUd = costoLote / unidades;
        const costoFijoUd = incluirFijos ? Math.round(costoDirectoUd * 0.18) : 0;
        const costoTotalUd = costoDirectoUd + costoFijoUd;

        // Precio de venta calculado: CostoTotal / (1 - Margen%)
        const factorMargen = 1 - (margenPct / 100);
        const precioSugerido = factorMargen > 0.05 ? costoTotalUd / factorMargen : costoTotalUd * 2;
        const gananciaUd = Math.max(0, precioSugerido - costoTotalUd);
        const gananciaLote = gananciaUd * unidades;

        // Actualización de la barra proporcional (suma garantizada al 100%)
        if (precioSugerido > 0) {
            const pctCosto = Math.round((costoDirectoUd / precioSugerido) * 100);
            const pctFijos = incluirFijos ? Math.round((costoFijoUd / precioSugerido) * 100) : 0;
            const pctUtilidad = Math.max(0, 100 - pctCosto - pctFijos);

            if (barraCosto) barraCosto.style.width = `${pctCosto}%`;
            if (barraFijos) barraFijos.style.width = `${pctFijos}%`;
            if (barraUtilidad) barraUtilidad.style.width = `${pctUtilidad}%`;

            if (txtLeyendaCosto) txtLeyendaCosto.textContent = `${pctCosto}%`;
            if (txtLeyendaFijos) txtLeyendaFijos.textContent = `${pctFijos}%`;
            if (txtLeyendaUtilidad) txtLeyendaUtilidad.textContent = `${pctUtilidad}%`;
        }

        // Desglose de resultados
        if (resCosto) resCosto.textContent = formatoPesos(costoTotalUd);
        if (resFijos) resFijos.textContent = incluirFijos ? formatoPesos(costoFijoUd) : '$ 0 (sin fijos)';
        if (resPrecio) resPrecio.textContent = formatoPesos(precioSugerido);
        if (resGanancia) resGanancia.textContent = formatoPesos(gananciaUd);
        if (resLote) resLote.textContent = formatoPesos(gananciaLote);

        // Diagnóstico IA sin emojis con clases semánticas
        if (badgeEstado && resConsejo) {
            if (margenPct < 40) {
                badgeEstado.textContent = 'Margen ajustado';
                badgeEstado.className = 'mesa-ia-badge estado-ajustado';
                resConsejo.textContent = 'Un margen inferior al 40% deja poca cobertura ante subidas de ingredientes o mermas inesperadas. Se aconseja elevarlo al menos al 50%.';
            } else if (margenPct >= 65) {
                badgeEstado.textContent = 'Alta rentabilidad';
                badgeEstado.className = 'mesa-ia-badge estado-alto';
                resConsejo.textContent = 'Margen excelente para repostería de autor, panadería de fermentación prolongada o productos con alto valor artesanal percibido.';
            } else {
                badgeEstado.textContent = 'Margen saludable';
                badgeEstado.className = 'mesa-ia-badge estado-optimo';
                resConsejo.textContent = 'Rango óptimo para panadería artesanal y rotación diaria. Cubre mermas, absorbe servicios y protege tu utilidad neta.';
            }
        }
    }

    // Alternador de Recetas Demo
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const recetaKey = tab.dataset.receta;
            const receta = RECETAS_DEMO[recetaKey];
            if (!receta) return;

            tabs.forEach(t => {
                t.classList.remove('activo');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('activo');
            tab.setAttribute('aria-selected', 'true');

            // Cargar datos en los controles
            inputCosto.value = receta.costoLote;
            inputUnidades.value = receta.unidades;
            inputMargen.value = receta.margen;
            if (checkFijos) checkFijos.checked = receta.incluirFijos;

            // Micro-transición suave en la lista de insumos
            if (elInsumosLista) {
                elInsumosLista.style.opacity = '0.3';
                elInsumosLista.style.transform = 'translateY(4px)';

                setTimeout(() => {
                    if (elRecetaNombre) elRecetaNombre.textContent = receta.nombre;
                    if (elRecetaTipo) elRecetaTipo.textContent = receta.tipo;

                    elInsumosLista.innerHTML = receta.lineas.map(l => `
                        <li>
                            <span>${l.desc}</span>
                            <strong class="insumo-precio">${l.costo}</strong>
                        </li>
                    `).join('');

                    elInsumosLista.style.opacity = '1';
                    elInsumosLista.style.transform = 'translateY(0)';
                }, 120);
            }

            recalcular();
        });
    });

    // Eventos en controles de entrada
    [inputCosto, inputUnidades, inputMargen].forEach(el => {
        el.addEventListener('input', recalcular);
    });

    if (checkFijos) {
        checkFijos.addEventListener('change', recalcular);
    }

    // Botones Stepper de unidades
    if (btnMenos) {
        btnMenos.addEventListener('click', () => {
            const actual = parseInt(inputUnidades.value, 10) || 1;
            if (actual > 1) {
                inputUnidades.value = actual - 1;
                recalcular();
            }
        });
    }

    if (btnMas) {
        btnMas.addEventListener('click', () => {
            const actual = parseInt(inputUnidades.value, 10) || 1;
            inputUnidades.value = actual + 1;
            recalcular();
        });
    }

    // Cálculo inicial inmediato
    recalcular();
}

// ─── 4. ACORDEÓN FAQ CON CSS GRID ACCESIBLE ─────────────────────
function inicializarFaq() {
    const items = document.querySelectorAll('.faq__item');
    if (!items.length) return;

    items.forEach(item => {
        const pregunta = item.querySelector('.faq__pregunta');
        const respuesta = item.querySelector('.faq__respuesta');
        if (!pregunta || !respuesta) return;

        pregunta.addEventListener('click', () => {
            const estaAbierto = item.classList.contains('activo');

            // Cierre mutuamente excluyente para mantener orden visual
            items.forEach(otro => {
                if (otro !== item) {
                    otro.classList.remove('activo');
                    const p = otro.querySelector('.faq__pregunta');
                    if (p) p.setAttribute('aria-expanded', 'false');
                }
            });

            if (estaAbierto) {
                item.classList.remove('activo');
                pregunta.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('activo');
                pregunta.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

// ─── 5. SCROLL SUAVE PARA NAVEGACIÓN INTERNA ────────────────────
function inicializarScrollSuave() {
    document.querySelectorAll('a[href^="#"]').forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            const href = enlace.getAttribute('href');
            if (!href || href === '#') return;
            const destino = document.querySelector(href);
            if (destino) {
                e.preventDefault();
                const offset = 76; // Compensación precisa de la barra fija
                const pos = destino.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: Math.max(0, pos),
                    behavior: 'smooth'
                });
            }
        });
    });
}
