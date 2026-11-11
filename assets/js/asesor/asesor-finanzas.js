/**
 * asesor-finanzas.js — Motor Financiero, Gastos Ocultos y Punto de Equilibrio
 *
 * Responsabilidades:
 * - Prorrateo de arriendo, luz, gas y agua por lote/hora.
 * - Cálculo de merma en cocción y costos de empaque unitario.
 * - Heurística de márgenes recomendados por tipo de producto (repostería, panadería artesanal, masivo, etc.).
 * - Cálculo matemático de Punto de Equilibrio (Break-Even).
 * - Simulación de precios para plataformas de delivery (Rappi / Didi).
 */

class AsesorFinanzas {
    /**
     * Calcula el margen comercial recomendado según categoría y complejidad del producto
     */
    static calcularMargenRecomendadoSegunProducto(nombreProd = '', horasLote = 0, unidades = 1) {
        const nombre = (nombreProd || '').toLowerCase().trim();
        let margen = 38;
        let razon = 'Margen equilibrado estándar de pastelería y panadería comercial.';
        let categoria = 'general';

        // 1. Repostería fina, tortas decoradas, temáticas, postres gourmet, brownies
        if (/\b(torta|pastel|cake|tres leches|cheesecake|postre|mousse|brownie|tiramis[uú]|cupcake|frosting|fondant|alfajor|tartaleta|pie|marquesa|macaron|ganache|red velvet|charlotte|selva negra)\b/i.test(nombre)) {
            margen = 50;
            razon = 'La repostería y tortas tienen alto valor percibido y mayor arte de decorado; el estándar del mercado es 45% a 55%.';
            categoria = 'reposteria_fina';
        }
        // 2. Panadería artesanal, masa madre, hojaldres, brioche, panes especiales
        else if (/\b(croissant|hojaldre|masa madre|sourdough|baguette|brioche|pan campesino|focaccia|ciabatta|panettone|rosc[oó]n|pan de masa madre)\b/i.test(nombre)) {
            margen = 44;
            razon = 'Técnica de hojaldrado, fermentación lenta y masa madre justifican un margen artesanal del 40% al 48%.';
            categoria = 'panaderia_artesanal';
        }
        // 3. Galletas, donas, pasabocas, empanadas, fritos/horneados individuales
        else if (/\b(galleta|cookie|dona|doughnut|berlina|churro|empanada|pastel de gloria|pasaboca|muffin|pandebono|buñuelo|pan de yuca|almoj[aá]bana|dedito|tequeño|quiche)\b/i.test(nombre)) {
            margen = 40;
            razon = 'Los pasabocas, galletas y bocados individuales tienen rotación constante y venta al paso; un margen del 38% al 42% maximiza ganancia y rotación.';
            categoria = 'pasabocas_galletas';
        }
        // 4. Pan corriente y de rotación diaria masiva
        else if (/\b(pan rollo|pan corriente|pan blandito|pan perro|pan hamburguesa|pan franc[eé]s|pan tajado|pan piñita|pan de leche|pan coco|pan de queso|pan aliñado)\b/i.test(nombre)) {
            margen = 32;
            razon = 'Pan de consumo diario y alta competencia de barrio; un margen del 28% al 35% te asegura competitividad de precio ganando por volumen.';
            categoria = 'pan_diario';
        }

        // Modificadores inteligentes según carga de trabajo y volumen
        if (horasLote >= 2.5 && margen < 54) {
            margen += 3;
            razon += ` (+3% adicional sugerido por requerir ${horasLote}h de mano de obra artesanal).`;
        } else if (unidades >= 60 && margen > 30) {
            margen -= 2;
            razon += ` (-2% ajustado por economía de escala al elaborar lote grande de ${unidades} ud).`;
        }

        return { margen, razon, categoria };
    }

    /**
     * Calcula la estructura financiera completa de un producto por lote y unidad
     */
    static calcularEstructuraProducto(estado, prodInfo) {
        const baseIngredientes = prodInfo.costoIngredientesLote || 0;
        const unidades         = Math.max(1, prodInfo.unidades || 1);
        const horasLote        = Math.max(0.25, estado.horasPorLote || 1);

        const factorHogar = (estado.arriendoMensual || 0) === 0 ? 0.35 : 0.75;
        const recibosProductivosMes = (estado.recibosMensuales || 0) * factorHogar;

        const costoHoraRecibos  = recibosProductivosMes / 240;
        const costoHoraArriendo = (estado.arriendoMensual || 0) / 240;

        let recibosLote  = Math.round(costoHoraRecibos * horasLote);
        let arriendoLote = Math.round(costoHoraArriendo * horasLote);

        const tarifaHora = estado.pagoHoraManoObra || 6500;
        let manoObraLote = Math.round(horasLote * tarifaHora);

        if (baseIngredientes > 0) {
            const topeRecibos  = Math.round(baseIngredientes * 0.12);
            const topeArriendo = Math.round(baseIngredientes * 0.18);
            const topeMano     = Math.round(baseIngredientes * 0.30);

            recibosLote  = Math.min(recibosLote, Math.max(150, topeRecibos));
            arriendoLote = Math.min(arriendoLote, topeArriendo);
            manoObraLote = Math.min(manoObraLote, Math.max(400, topeMano));
        }

        const desgasteLote = Math.round((recibosLote + manoObraLote) * 0.05);
        const totalOcultosFijosLote = recibosLote + arriendoLote + manoObraLote + desgasteLote;

        const mermaPct      = estado.mermaPct ?? 3;
        const empaqueUnidad = estado.empaqueUnidad ?? 0;

        const costoMermaLote   = Math.round(baseIngredientes * (mermaPct / 100));
        const costoEmpaqueLote = Math.round(empaqueUnidad * unidades);

        const costoAparenteUnidad = Math.round(baseIngredientes / unidades);
        const costoRealLote       = baseIngredientes + costoMermaLote + costoEmpaqueLote + totalOcultosFijosLote;
        const costoRealUnidad     = Math.round(costoRealLote / unidades);

        const recMargen = this.calcularMargenRecomendadoSegunProducto(prodInfo.nombre, horasLote, unidades);
        const margenComercial = estado.margenManual !== null
            ? estado.margenManual
            : (estado.margenSugerido !== null ? estado.margenSugerido : recMargen.margen);
        const razonMargen = estado.margenManual !== null
            ? `Margen definido manualmente por ti: ${margenComercial}%.`
            : recMargen.razon;

        const precioRecomendado = Math.round(costoRealUnidad / (1 - (margenComercial / 100)));
        const gananciaUnidad    = Math.max(0, precioRecomendado - costoRealUnidad);

        const impoconsumoPct    = estado.impoconsumoPct ?? 8;
        const precioConImpuesto = Math.round(precioRecomendado * (1 + (impoconsumoPct / 100)));
        const precioDeliveryApp = this.calcularPrecioAppDelivery(precioRecomendado, 25);

        return {
            nombre: prodInfo.nombre,
            unidades,
            tieneIngredientes: prodInfo.tieneIngredientes,
            costoTabla: prodInfo.costoTabla,
            horasLote,
            baseIngredientes,
            costoAparenteUnidad,
            recibosLote,
            arriendoLote,
            manoObraLote,
            desgasteLote,
            totalOcultosFijosLote,
            costoMermaLote,
            mermaPct,
            empaqueUnidad,
            costoEmpaqueLote,
            costoRealLote,
            costoRealUnidad,
            margenComercial,
            razonMargen,
            categoriaSugerida: recMargen.categoria,
            precioRecomendado,
            gananciaUnidad,
            gananciaLote: gananciaUnidad * unidades,
            impoconsumoPct,
            precioConImpuesto,
            precioDeliveryApp,
        };
    }

    /**
     * Calcula las unidades mínimas al mes y al día para alcanzar el Punto de Equilibrio
     */
    static calcularPuntoEquilibrio(gananciaUnitaria, gastosFijosMensuales) {
        if (!gastosFijosMensuales || gastosFijosMensuales <= 0) {
            return { tieneFijos: false, unidadesMes: 0, unidadesDia: 0 };
        }
        if (!gananciaUnitaria || gananciaUnitaria <= 0) {
            return { tieneFijos: true, sinGanancia: true, unidadesMes: 0, unidadesDia: 0 };
        }
        const unidadesMes = Math.ceil(gastosFijosMensuales / gananciaUnitaria);
        const unidadesDia = Number((unidadesMes / 30).toFixed(1));
        return {
            tieneFijos: true,
            sinGanancia: false,
            unidadesMes,
            unidadesDia,
            gastosFijos: gastosFijosMensuales,
            gananciaUnitaria
        };
    }

    /**
     * Calcula el precio de venta para aplicaciones de delivery preservando la ganancia
     */
    static calcularPrecioAppDelivery(precioRecomendado, comisionPct = 25) {
        const factor = Math.max(0.1, 1 - (comisionPct / 100));
        return Math.round(precioRecomendado / factor);
    }
}

if (typeof window !== 'undefined') {
    window.AsesorFinanzas = AsesorFinanzas;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AsesorFinanzas;
}
