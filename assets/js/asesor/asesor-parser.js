/**
 * asesor-parser.js — Módulo de NLP, Extracción de Datos y Búsqueda Blindada
 *
 * Responsabilidades:
 * - Normalización de texto y moneda ("20 mil" -> 20000, "1.5 millones" -> 1500000).
 * - Extracción de números, unidades gastronómicas e ingredientes desde lenguaje natural.
 * - Búsqueda de alta fidelidad para insumos y productos (evita falsos positivos como avena cubana -> galletas de avena).
 * - Detección de solicitudes no soportadas (DIAN, envíos de correo, diseño, bancos, etc.).
 */

class AsesorParser {
    static escaparRegex(str) {
        return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static normalizarTexto(str) {
        return String(str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    static normalizarUnidad(str) {
        const s = String(str || '').toLowerCase().trim();
        if (/^(kilo|kilos|kg|kilogramo|kilogramos)$/i.test(s)) return 'kg';
        if (/^(gramo|gramos|gr|g)$/i.test(s)) return 'g';
        if (/^(litro|litros|l|lt|lts)$/i.test(s)) return 'l';
        if (/^(mililitro|mililitros|ml|cc)$/i.test(s)) return 'ml';
        if (/^(cucharada|cucharadas|cda|cdas)$/i.test(s)) return 'cucharada';
        if (/^(cucharadita|cucharaditas|cdita|cditas)$/i.test(s)) return 'cucharadita';
        if (/^(taza|tazas|tz|pocillo|pocillos)$/i.test(s)) return 'taza';
        if (/^(pizca|pizcas|pucho|toque)$/i.test(s)) return 'pizca';
        if (/^(libra|libras|lb|lbs)$/i.test(s)) return 'g';
        if (/^(onza|onzas|oz)$/i.test(s)) return 'g';
        if (/^(arroba|arrobas|@)$/i.test(s)) return 'kg';
        return 'unidad';
    }

    static normalizarMontoMoneda(val, tipo = 'general') {
        if (typeof val === 'number') {
            if (val > 0 && val < 500 && (tipo === 'arriendo' || tipo === 'recibos')) {
                return val * 1000;
            }
            return Math.round(val);
        }

        let s = String(val || '').toLowerCase().trim()
            .replace(/\$\s*/g, '')
            .replace(/\bpesos\b/g, '')
            .replace(/\bcop\b/g, '');

        s = s.replace(/\b(\d{1,3})(?:\s+(\d{3}))+(?!\d)/g, m => m.replace(/\s+/g, ''));
        s = s.replace(/\bpalo\s+y\s+medio\b/gi, '1500000');
        s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:palos?)\b/gi, (_, n) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000000)));
        s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:lucas?)\b/gi, (_, n) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000)));
        s = s.replace(/(\d+(?:[.,]\d+)?)\s*mill[oó]n(?:es)?/gi, (_, n) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000000)));
        s = s.replace(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/gi, (_, n) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000)));

        const regexNum = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?\b|\b\d+(?:[.,]\d+)?\b/;
        const m = s.match(regexNum);
        if (m) {
            const raw = m[0];
            let num = 0;
            if (/^\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?$/.test(raw)) {
                const parts = raw.split(/[.,]/);
                if (parts[parts.length - 1].length <= 2) {
                    const dec = parts.pop();
                    num = parseFloat(parts.join('') + '.' + dec);
                } else {
                    num = parseInt(parts.join(''), 10);
                }
            } else {
                num = parseFloat(raw.replace(',', '.'));
            }

            if (num > 0 && num < 500 && (tipo === 'arriendo' || tipo === 'recibos')) {
                num *= 1000;
            }
            return Math.round(num);
        }
        return 0;
    }

    static extraerNumeros(texto) {
        if (!texto) return [];
        let t = String(texto).toLowerCase()
            .replace(/\$\s*/g, '')
            .replace(/\bpesos\b/g, '')
            .replace(/\bcop\b/g, '');

        // Separar magnitudes pegadas a letras (tokenización natural)
        t = t.replace(/(\d+)(h|hrs?|horas?)\b/gi, '$1 horas');
        t = t.replace(/(\d+)(m|mins?|minutos?)\b/gi, '$1 minutos');
        t = t.replace(/(\d+)(k|mil)\b/gi, '$1000');
        t = t.replace(/(\d+)(g|gr|kg|ml|l|lb)\b/gi, '$1 $2');

        t = t.replace(/\b(\d{1,3})(?:\s+(\d{3}))+(?!\d)/g, m => m.replace(/\s+/g, ''));
        t = t.replace(/\bpalo\s+y\s+medio\b/gi, '1500000');
        t = t.replace(/(\d+(?:[.,]\d+)?)\s*(?:palos?)\b/gi, (_, n) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000000)));
        t = t.replace(/(\d+(?:[.,]\d+)?)\s*(?:lucas?)\b/gi, (_, n) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000)));
        t = t.replace(/(\d+(?:[.,]\d+)?)\s*mill[oó]n(?:es)?/gi, (_, n) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000000)));
        t = t.replace(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/gi, (_, n) => String(Math.round(parseFloat(n.replace(',', '.')) * 1000)));

        const resultados = [];
        const regexNum = /\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?\b|\b\d+(?:[.,]\d+)?\b/g;
        let m;
        while ((m = regexNum.exec(t)) !== null) {
            const raw = m[0];
            if (/^\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?$/.test(raw)) {
                const parts = raw.split(/[.,]/);
                if (parts[parts.length - 1].length <= 2) {
                    const dec = parts.pop();
                    resultados.push(parseFloat(parts.join('') + '.' + dec));
                } else {
                    resultados.push(parseInt(parts.join(''), 10));
                }
            } else {
                resultados.push(parseFloat(raw.replace(',', '.')));
            }
        }
        return resultados.filter(n => !isNaN(n));
    }

    static extraerUnidadesDeTexto(texto) {
        const t = String(texto || '').toLowerCase();
        const m1 = t.match(/\b(?:para|salen|producen|rinde|hace|hacen|son|salen\s+unas?)\s+(\d+)\s*(?:unidades|panes|tortas|galletas|porciones|ud|uds|piezas)?\b/i);
        if (m1) return Math.max(1, parseInt(m1[1], 10));

        const m2 = t.match(/\b(\d+)\s*(?:unidades|panes|tortas|galletas|porciones|ud|uds|piezas)\b/i);
        if (m2) return Math.max(1, parseInt(m2[1], 10));

        return null;
    }

    static extraerIngredientesDeTexto(texto) {
        let t = String(texto || '').toLowerCase()
            .replace(/\b(\d{1,3})(?:\s+(\d{3}))+(?!\d)/g, m => m.replace(/\s+/g, ''));

        // Normalización de modismos y jerga colombiana / gastronómica tradicional
        t = t.replace(/(\d+(?:[.,]\d+)?)\s*(?:libras?|lb|lbs)\b/gi, (_, n) => {
            const val = parseFloat(n.replace(',', '.'));
            return `${Math.round(val * 500)} gramos`;
        });
        t = t.replace(/(\d+(?:[.,]\d+)?)\s*(?:onzas?|oz)\b/gi, (_, n) => {
            const val = parseFloat(n.replace(',', '.'));
            return `${Math.round(val * 28.35)} gramos`;
        });
        t = t.replace(/\b(?:un\s+pucho|un\s+toque|una\s+pizca)\s+(?:de\s+)?([a-záéíóúñ]+)/gi, '5 gramos de $1');
        t = t.replace(/\blibra\s+y\s+media\b/g, '750 gramos');
        t = t.replace(/\bmedia\s+libra\b/g, '250 gramos');
        t = t.replace(/\buna\s+libra\b/g, '500 gramos');
        t = t.replace(/\bun\s+cuarto\s+de\s+libra\b/g, '125 gramos');
        t = t.replace(/\bkilo\s+y\s+medio\b/g, '1500 gramos');
        t = t.replace(/\bdos\s+kilos\s+y\s+medio\b/g, '2500 gramos');
        t = t.replace(/\bmedio\s+kilo\b/g, '500 gramos');
        t = t.replace(/\bun\s+kilo\b/g, '1 kg');
        t = t.replace(/\blitro\s+y\s+medio\b/g, '1500 ml');
        t = t.replace(/\bmedio\s+litro\b/g, '500 ml');
        t = t.replace(/\bun\s+litro\b/g, '1 l');
        t = t.replace(/(\d+(?:[.,]\d+)?)\s*pocillos?\b/gi, '$1 tazas');
        t = t.replace(/\bun\s+pocillo\b/g, '1 taza');
        t = t.replace(/\b(un|uno|una)\b/g, '1')
            .replace(/\bdos\b/g, '2')
            .replace(/\btres\b/g, '3')
            .replace(/\bcuatro\b/g, '4')
            .replace(/\bcinco\b/g, '5')
            .replace(/\bseis\b/g, '6');

        const encontrados = [];
        const regexConUnidad = /(\d+(?:[.,]\d+)?)\s*(gramos|gramo|gr|g|kilos|kilo|kilogramos|kg|mililitros|ml|litros|litro|l|libras|libra|lb|onzas|onza|oz|cucharadas|cucharada|cucharaditas|cucharadita|tazas|taza|pocillos|pocillo|unidades|unidad|und)\s+(?:de\s+)?([a-záéíóúñ]+(?:\s+(?:de\s+|sin\s+|con\s+)?[a-záéíóúñ]+){0,3})/gi;

        const mapaUnidades = {
            gramos: 'g', gramo: 'g', gr: 'g', g: 'g',
            kilos: 'kg', kilo: 'kg', kilogramos: 'kg', kg: 'kg',
            mililitros: 'ml', ml: 'ml',
            litros: 'l', litro: 'l', l: 'l',
            libras: 'g', libra: 'g', lb: 'g',
            onzas: 'g', onza: 'g', oz: 'g',
            cucharadas: 'cucharada', cucharada: 'cucharada',
            cucharaditas: 'cucharadita', cucharadita: 'cucharadita',
            tazas: 'taza', taza: 'taza', pocillos: 'taza', pocillo: 'taza',
            unidades: 'unidad', unidad: 'unidad', und: 'unidad',
        };

        const palabrasCorte = /\b(y|con|para|que|salen|producen|unidades|panes|tortas|galletas|porciones)\b/i;

        let m;
        while ((m = regexConUnidad.exec(t)) !== null) {
            let cantidad = parseFloat(m[1].replace(',', '.'));
            const unidadRaw = m[2].toLowerCase();
            const unidad = mapaUnidades[unidadRaw] || 'g';

            // Si vino como libra u onza directa en la regex, convertir a gramos
            if (['libras', 'libra', 'lb'].includes(unidadRaw)) {
                cantidad = Math.round(cantidad * 500);
            } else if (['onzas', 'onza', 'oz'].includes(unidadRaw)) {
                cantidad = Math.round(cantidad * 28.35);
            }

            let nombre = m[3].split(palabrasCorte)[0].trim();
            if (nombre && cantidad > 0 && !/^(pesos|mil|lotes|horas|minutos)$/i.test(nombre)) {
                encontrados.push({ nombre, cantidad, unidad });
            }
        }

        const regexHuevos = /(\d+(?:[.,]\d+)?)\s+(huevos|huevo)\b/gi;
        while ((m = regexHuevos.exec(t)) !== null) {
            const yaEsta = encontrados.some(e => this.normalizarTexto(e.nombre).includes('huevo'));
            if (!yaEsta) {
                encontrados.push({
                    nombre: 'Huevo',
                    cantidad: parseFloat(m[1].replace(',', '.')),
                    unidad: 'unidad'
                });
            }
        }

        return encontrados;
    }

    static extraerDatosInsumoNuevo(texto) {
        let t = texto.trim()
            .replace(/\b(\d{1,3})(?:\s+(\d{3}))+(?!\d)/g, m => m.replace(/\s+/g, ''));
        let nombre = '';
        let cantidad = 1;
        let unidad = 'kg';
        let precioTotal = null;

        const matchCantUnid = t.match(/(\d+(?:[.,]\d+)?)\s*(kilos?|kg|gramos?|g|litros?|l|mililitros?|ml|libras?|lb|arrobas?|@|unidades?|ud|pizcas?|tazas?|cucharadas?)/i);
        if (matchCantUnid) {
            cantidad = parseFloat(matchCantUnid[1].replace(',', '.'));
            unidad = this.normalizarUnidad(matchCantUnid[2]);
        }

        const matchPrecio = t.match(/(?:\$|cost[oó]|vale|cuesta|a\s+|por\s+|precio\s+(?:de\s+)?)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)\s*(?:pesos|cop|mil)?/i);
        if (matchPrecio) {
            precioTotal = this.normalizarMontoMoneda(matchPrecio[1]);
        } else {
            const nums = this.extraerNumeros(t);
            if (matchCantUnid && nums.length > 1) {
                const sinCantidad = nums.filter(n => Math.abs(n - cantidad) > 0.001);
                if (sinCantidad.length > 0) {
                    precioTotal = sinCantidad[sinCantidad.length - 1];
                }
            } else if (nums.length === 1 && !matchCantUnid && nums[0] > 50) {
                precioTotal = nums[0];
            }
        }

        let limp = t
            .replace(/\b(crea(r)?|agrega(r)?|nuevo(a)?|a[ñn]ad(e|ir)|registrar|un\s+insumo|el\s+insumo|insumo|materia\s+prima)\b/gi, '')
            .replace(/(?:\$|cost[oó]|vale|cuesta|a\s+|por\s+|precio\s+(?:de\s+)?)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)\s*(?:pesos|cop|mil)?/gi, '')
            .replace(/(\d+(?:[.,]\d+)?)\s*(kilos?|kg|gramos?|g|litros?|l|mililitros?|ml|libras?|lb|arrobas?|@|unidades?|ud|pizcas?|tazas?|cucharadas?)/gi, '')
            .replace(/\b(\d+)\s*(mil|pesos|cop)\b/gi, '')
            .replace(/[,\.;]/g, ' ')
            .trim();

        if (limp.length > 1) {
            nombre = limp.charAt(0).toUpperCase() + limp.slice(1);
        }

        return {
            nombre,
            cantidad,
            unidad,
            precioTotal,
            esValido: Boolean(nombre && precioTotal && precioTotal > 0 && cantidad > 0)
        };
    }

    static extraerNombreProductoConsultado(texto) {
        if (!texto) return null;
        const t = texto.trim()
            .replace(/^(?:oye|hola|por\s+favor|dame|mu[eé]strame|quiero|necesito|puedes\s+darme|generar|sacar|ver)\s+/i, '');

        const patrones = [
            /(?:ficha\s*t[eé]cnica|hoja\s*de\s*costos?|pdf|imprimir|descargar)\s+(?:de\s+(?:la|el|los|las)?\s*|del\s+)?([^,\.\?!;]+)/i,
            /(?:punto\s*de\s*equilibrio|break\s*even|equilibrio)\s+(?:de\s+(?:la|el|los|las)?\s*|del\s+)?([^,\.\?!;]+)/i,
            /(?:duplica(?:r)?|clona(?:r)?|copia(?:r)?|haz\s*(?:una)?\s*copia)\s+(?:la\s*receta\s*(?:de\s+(?:la|el|los|las)?\s*|del\s+)?|el\s*producto\s+|la\s+|el\s+)?([^,\.\?!;]+)/i,
            /(?:precio|costo|cu[aá]nto\s*cuesta|cu[aá]nto\s*vale|a\s*c[oó]mo\s*est[aá])\s+(?:de\s+(?:la|el|los|las)?\s*|del\s+)?([^,\.\?!;]+)/i,
            /(?:cambia(?:r)?|actualiza(?:r)?|pon(?:er)?|fija(?:r)?)\s+(?:el\s*precio\s*(?:de\s+(?:la|el|los|las)?\s*|del\s+)?)([^,\.\?!;\d]+)/i,
        ];

        for (const regex of patrones) {
            const m = t.match(regex);
            if (m && m[1]) {
                let candid = m[1].trim()
                    .replace(/\b(por\s*favor|gracias|ya|ahora|en\s*pdf|oficial)\b/gi, '')
                    .replace(/^(?:la|el|los|las|de|del)\s+/i, '')
                    .trim();
                if (candid.length >= 3) {
                    return candid;
                }
            }
        }
        return null;
    }

    /**
     * Busca coincidencias de insumos analizando si hay ambigüedad (ej: Azúcar blanca vs Azúcar morena).
     * Retorna { coincidenciaExacta, candidatos, esAmbigua }
     */
    static buscarInsumosConAmbiguedad(texto, insumos = null) {
        const lista = insumos || (window.Store ? Store.cargarInsumos() : []);
        if (!lista || lista.length === 0) {
            return { coincidenciaExacta: null, candidatos: [], esAmbigua: false };
        }

        const tNorm = this.normalizarTexto(texto);

        // 1. Coincidencia completa del nombre completo
        for (const ins of lista) {
            const nomNorm = this.normalizarTexto(ins.nombre);
            const regexCompleta = new RegExp(`\\b${this.escaparRegex(nomNorm)}\\b`, 'i');
            if (regexCompleta.test(tNorm)) {
                return { coincidenciaExacta: ins, candidatos: [ins], esAmbigua: false };
            }
        }

        // 2. Coincidencia estricta para insumos compuestos (todas las palabras presentes en el texto)
        const candidatosCompuestos = [];
        for (const ins of lista) {
            const nomNorm = this.normalizarTexto(ins.nombre);
            const palabras = nomNorm.split(/\s+/).filter(w => w.length > 2 && !['de', 'la', 'el', 'los', 'las', 'con', 'del', 'para', 'en', 'al', 'sin'].includes(w));
            if (palabras.length > 1) {
                const todas = palabras.every(p => new RegExp(`\\b${this.escaparRegex(p)}\\b`, 'i').test(tNorm));
                if (todas) candidatosCompuestos.push(ins);
            }
        }

        if (candidatosCompuestos.length === 1) {
            return { coincidenciaExacta: candidatosCompuestos[0], candidatos: candidatosCompuestos, esAmbigua: false };
        } else if (candidatosCompuestos.length > 1) {
            return { coincidenciaExacta: null, candidatos: candidatosCompuestos, esAmbigua: true };
        }

        // 3. Coincidencia por palabra clave principal distintiva (ej: "azúcar", "harina", "chocolate")
        const puntuados = [];
        for (const ins of lista) {
            const nomNorm = this.normalizarTexto(ins.nombre);
            const palabras = nomNorm.split(/\s+/).filter(w => w.length > 2 && !['de', 'la', 'el', 'los', 'las', 'con', 'del', 'para', 'en', 'al', 'sin'].includes(w));
            let puntos = 0;
            const palabrasCoincidentes = [];
            palabras.forEach((p, idx) => {
                if (new RegExp(`\\b${this.escaparRegex(p)}\\b`, 'i').test(tNorm)) {
                    puntos += (idx === 0 ? 3 : 1);
                    palabrasCoincidentes.push(p);
                }
            });

            if (puntos >= 3) {
                puntuados.push({ insumo: ins, puntos, palabrasCoincidentes });
            }
        }

        if (puntuados.length === 0) {
            return { coincidenciaExacta: null, candidatos: [], esAmbigua: false };
        }

        puntuados.sort((a, b) => b.puntos - a.puntos);
        const maxPuntos = puntuados[0].puntos;
        const mejores = puntuados.filter(p => p.puntos === maxPuntos);

        if (mejores.length === 1) {
            return { coincidenciaExacta: mejores[0].insumo, candidatos: [mejores[0].insumo], esAmbigua: false };
        }

        // Si hay múltiples con igual puntaje, verificar si realmente son ambiguos
        // (es decir, comparten la palabra clave que los activó, ej: "azúcar" para azúcar blanca y morena)
        const primeraPalabraClave = mejores[0].palabrasCoincidentes[0];
        const todosCompartenPalabra = mejores.every(m => m.palabrasCoincidentes.includes(primeraPalabraClave));

        if (todosCompartenPalabra) {
            return { coincidenciaExacta: null, candidatos: mejores.map(m => m.insumo), esAmbigua: true };
        } else {
            // Múltiples insumos distintos mencionados en la misma frase (ej: "harina y azúcar")
            // No es una ambigüedad sobre un solo insumo
            return { coincidenciaExacta: null, candidatos: [], esAmbigua: false };
        }
    }

    static buscarInsumoPorTexto(texto, insumos = null) {
        const res = this.buscarInsumosConAmbiguedad(texto, insumos);
        return res.coincidenciaExacta;
    }

    static buscarInsumoEnInventario(nombreBuscado, insumosDisponibles) {
        const res = this.buscarInsumosEnInventarioConAmbiguedad(nombreBuscado, insumosDisponibles);
        return res.coincidenciaExacta;
    }

    static buscarInsumosEnInventarioConAmbiguedad(nombreBuscado, insumosDisponibles = null) {
        const lista = insumosDisponibles || (window.Store ? Store.cargarInsumos() : []);
        const buscadoNorm = this.normalizarTexto(nombreBuscado).replace(/s$/, '');
        if (!buscadoNorm) return { coincidenciaExacta: null, candidatos: [], esAmbigua: false };

        // Coincidencia exacta
        const exacta = lista.find(ins => this.normalizarTexto(ins.nombre).replace(/s$/, '') === buscadoNorm);
        if (exacta) return { coincidenciaExacta: exacta, candidatos: [exacta], esAmbigua: false };

        // Coincidencia que contenga la palabra o sustantivo
        const candidatos = lista.filter(ins => {
            const insNorm = this.normalizarTexto(ins.nombre).replace(/s$/, '');
            return insNorm.includes(buscadoNorm) || buscadoNorm.includes(insNorm);
        });

        if (candidatos.length === 1) {
            return { coincidenciaExacta: candidatos[0], candidatos, esAmbigua: false };
        } else if (candidatos.length > 1) {
            return { coincidenciaExacta: null, candidatos, esAmbigua: true };
        }

        return { coincidenciaExacta: null, candidatos: [], esAmbigua: false };
    }

    static buscarProductoPorTexto(texto, productos = null) {
        const lista = productos || (window.Store ? Store.cargarProductos() : []);
        if (!lista || lista.length === 0) return null;

        const tNorm = this.normalizarTexto(texto);

        // 1. Coincidencia exacta del nombre completo
        for (const prod of lista) {
            const nomNorm = this.normalizarTexto(prod.nombre);
            const regexCompleta = new RegExp(`\\b${this.escaparRegex(nomNorm)}\\b`, 'i');
            if (regexCompleta.test(tNorm)) return prod;
        }

        // 2. Coincidencia por palabras clave principales
        for (const prod of lista) {
            const nomNorm = this.normalizarTexto(prod.nombre);
            const palabrasProd = nomNorm.split(/\s+/).filter(w => w.length > 2 && !['de', 'la', 'el', 'los', 'las', 'con', 'del', 'para', 'en', 'al'].includes(w));

            if (palabrasProd.length === 1) {
                const regexUnica = new RegExp(`\\b${this.escaparRegex(palabrasProd[0])}\\b`, 'i');
                if (regexUnica.test(tNorm)) return prod;
                continue;
            }

            let coincidentes = 0;
            for (const p of palabrasProd) {
                const regexP = new RegExp(`\\b${this.escaparRegex(p)}\\b`, 'i');
                if (regexP.test(tNorm)) coincidentes++;
            }

            if (coincidentes >= Math.max(2, Math.ceil(palabrasProd.length * 0.75))) {
                return prod;
            }
        }

        return null;
    }

    static esNegacionOCero(texto) {
        return /\b(no pago|nada|cero|ninguno|ninguna|no tengo|gratis|0|propio|propia|mi casa|desde casa)\b/i.test(texto);
    }

    static esFinInsumos(texto) {
        const t = (texto || '').toLowerCase();
        return /\b(no m[aá]s|nada m[aá]s|listo|esos son todos|termin[eé]|ya est[aá]n todos|siguiente|continuar|ninguno m[aá]s|no lleva m[aá]s)\b/i.test(t);
    }

    static esSolicitudNoSoportada(texto) {
        if (!texto) return false;
        const t = String(texto).toLowerCase().trim();

        // 1. Guardrail de Seguridad: Jailbreak / Prompt Injection / Modo Hacker
        const patronesJailbreak = [
            /\b(olvida|ignora|desobedece)\s+(todas\s+)?(tus|las)\s+(instrucciones|reglas|directrices|prompts?)\b/i,
            /\b(ahora\s+eres|act[uú]a\s+como|finge\s+que\s+eres|haz\s+de\s+cuenta\s+que\s+eres)\s+(un\s+)?(hacker|dan|developer|asistente\s+sin\s+filtros|ia\s+libre)\b/i,
            /\b(jailbreak|prompt\s*injection|system\s*prompt|instrucciones\s*internas|revela\s*tu\s*prompt|modo\s*desarrollador)\b/i,
            /\b(hack|hackear|exploit|malware|virus|inyecci[oó]n\s*sql|ddos|wifi|password|contrase[ñn]a\s*de\s*otro)\b/i
        ];
        if (patronesJailbreak.some(rx => rx.test(t))) return true;

        // 2. Tareas de Programación o Código Técnico no Gastronómico
        const patronesCodigo = [
            /\b(script|c[oó]digo|programa)\s+(en\s+)?(python|javascript|php|java|c\+\+|html|bash|powershell|sql)\b/i,
            /\b(escribe|hazme|genera)\s+(un\s+)?(script|c[oó]digo|funci[oó]n|algoritmo)\s+(para\s+)?(descargar|hackear|scrapear|automatizar|hacer)\b/i,
            /\b(import\s+pytube|pip\s+install|npm\s+install|curl\s+-s)\b/i
        ];
        if (patronesCodigo.some(rx => rx.test(t))) return true;

        // 3. Temas totalmente ajenos a Costia (Poemas, Política, Deportes, Farándula, Noticias, Clima)
        const patronesFueraDominio = [
            /\b(poema|poes[ií]a|verso|carta\s*de\s*amor|declaraci[oó]n\s*de\s*amor|enamorar)\b/i,
            /\b(qui[eé]n\s*gan[oó]\s*(el\s*)?(mundial|partido|copa|super\s*bowl)|f[uú]tbol|gol(es)?|messi|cristiano|champions)\b/i,
            /\b(pol[ií]tica|elecciones|presidente|senador|partido\s*pol[ií]tico|guerra|conflicto\s*armado)\b/i,
            /\b(clima|tiempo\s*ma[ñn]ana|temperatura\s*hoy|noticias|chiste|cuento|canta(r)?)\b/i
        ];
        if (patronesFueraDominio.some(rx => rx.test(t))) return true;

        // 4. Intentos de acciones masivas o destructivas directas desde el chat
        const patronesDestructivos = [
            /\b(elimina(r)?|borra(r)?|destruye|limpia(r)?|wipe)\s+(toda\s+)?(la\s+)?(base\s*de\s*datos|cuenta|todos\s*los\s*productos|todo)\b/i,
            /\b(formatea(r)?|reset(ear)?\s*todo|drop\s*table|truncate)\b/i
        ];
        if (patronesDestructivos.some(rx => rx.test(t))) return true;

        // 5. Trámites externos no soportados
        const patronesNoSoportados = [
            /\b(factura(r|ci[oó]n)?\s*electr[oó]nica|dian|impuesto(s)?|declaraci[oó]n\s*de\s*renta|retenci[oó]n)\b/i,
            /\b(env[ií]a(r)?|manda(r)?)\s*(un\s*)?(correo|email|mensaje|whatsapp|sms)\b/i,
            /\b(dise[ñn]a(r)?|hazme|genera(r)?)\s*(un\s*)?(logo|imagen|foto|flyer|banner|publicidad|afiche)\b/i,
            /\b(domicilio(s)?|repartidor(es)?|gps|rastre(ar|o)|mapa)\b/i,
            /\b(conecta(r)?|integra(r)?)\s*(con\s*)?(banco|nequi|daviplata|tarjeta|dat[aá]fono|pasarela)\b/i,
            /\b(reserva(r)?|mesa(s)?|agenda(r)?|cita(s)?)\b/i
        ];
        return patronesNoSoportados.some(rx => rx.test(t));
    }
}

if (typeof window !== 'undefined') {
    window.AsesorParser = AsesorParser;
}
