/**
 * models.js — Modelos de Dominio y Utilidades del Negocio (POO)
 *
 * Contiene las clases centrales para representar los conceptos del dominio:
 * - UnidadConverter: Lógica matemática y conversión de unidades gastronómicas.
 * - Insumo: Materia prima con costo unitario y trazabilidad de uso.
 * - ItemReceta: Ingrediente y cantidad dentro de una receta.
 * - Producto: Entidad que calcula su costo, margen y precio de venta.
 */

// ============================================================
// 1. CONVERTIDOR Y UTILIDADES DE UNIDADES
// ============================================================

class UnidadConverter {
    static UNIDADES_MASA    = ['g', 'kg', 'arroba', 'tonelada', 'pizca'];
    static UNIDADES_VOLUMEN = ['ml', 'l', 'taza', 'cucharada', 'cucharadita'];

    static COMPATIBLES = {
        'kg':          ['g', 'kg', 'arroba', 'tonelada', 'pizca'],
        'g':           ['g', 'kg', 'arroba', 'tonelada', 'pizca'],
        'arroba':      ['g', 'kg', 'arroba', 'tonelada'],
        'tonelada':    ['g', 'kg', 'arroba', 'tonelada'],
        'pizca':       ['pizca', 'g', 'kg'],

        'l':           ['ml', 'l', 'taza', 'cucharada', 'cucharadita'],
        'ml':          ['ml', 'l', 'taza', 'cucharada', 'cucharadita'],
        'cucharada':   ['cucharada', 'cucharadita', 'taza', 'ml', 'l'],
        'cucharadita': ['cucharadita', 'cucharada', 'taza', 'ml', 'l'],
        'taza':        ['taza', 'cucharada', 'cucharadita', 'ml', 'l'],

        'unidad':      ['unidad'],
    };

    static ETIQUETAS = {
        'g':           'Gramos (g)',
        'kg':          'Kilogramos (kg)',
        'arroba':      'Arroba (@ = 12.5 kg)',
        'tonelada':    'Tonelada (t = 1.000 kg)',
        'pizca':       'Pizca (~0.5 g)',
        'ml':          'Mililitros (ml)',
        'l':           'Litros (l)',
        'cucharada':   'Cucharada (~15 ml)',
        'cucharadita': 'Cucharadita (~5 ml)',
        'taza':        'Taza (~240 ml)',
        'unidad':      'Unidad',
    };

    static convertir(cantidad, desde, hacia) {
        if (desde === hacia) return cantidad;

        // Masa estándar a gramos base
        const A_GRAMOS = {
            'pizca': 0.5,
            'g': 1,
            'kg': 1000,
            'arroba': 12500,
            'tonelada': 1000000
        };
        if (A_GRAMOS[desde] !== undefined && A_GRAMOS[hacia] !== undefined) {
            const gramos = cantidad * A_GRAMOS[desde];
            return gramos / A_GRAMOS[hacia];
        }

        // Volumen estándar a mililitros base
        const A_ML = {
            'cucharadita': 5,
            'cucharada': 15,
            'taza': 240,
            'ml': 1,
            'l': 1000
        };
        if (A_ML[desde] !== undefined && A_ML[hacia] !== undefined) {
            const mililitros = cantidad * A_ML[desde];
            return mililitros / A_ML[hacia];
        }

        return null;
    }

    static formatearCantidad(n) {
        if (!n || n === 0) return '0';
        if (n < 0.01) return n.toFixed(4);
        if (n < 1)    return n.toFixed(3);
        if (n < 10)   return n.toFixed(2);
        return n.toFixed(n % 1 === 0 ? 0 : 2);
    }

    static formatearMoneda(n) {
        return '$' + Math.round(n || 0).toLocaleString('es-CL');
    }
}

// ============================================================
// 2. MODELO INSUMO
// ============================================================

class Insumo {
    constructor({ id, nombre, unidad, precio, precio_anterior = null, fecha_cambio = null, total_recetas = 0, productos_usados = [] }) {
        this.id              = Number(id);
        this.nombre          = String(nombre).trim();
        this.unidad          = String(unidad).trim();
        this.precio          = Number(precio) || 0; // Precio por 1 unidad base
        this.precioAnterior  = (precio_anterior !== null && precio_anterior !== undefined && !isNaN(precio_anterior))
            ? Number(precio_anterior)
            : null;
        this.fechaCambio     = fecha_cambio || null;
        this.totalRecetas    = Number(total_recetas) || 0;
        this.productosUsados = Array.isArray(productos_usados) ? productos_usados : [];
    }

    obtenerVariacion() {
        if (this.precioAnterior === null || this.precioAnterior === undefined || isNaN(this.precioAnterior) || this.precioAnterior <= 0) {
            return null;
        }
        if (Math.abs(this.precio - this.precioAnterior) < 0.01) {
            return null;
        }
        const delta = this.precio - this.precioAnterior;
        const pct   = (delta / this.precioAnterior) * 100;
        return {
            estado: delta > 0 ? 'sube' : 'baja',
            delta,
            pct: Math.abs(pct),
            precioAnterior: this.precioAnterior,
            precioActual: this.precio,
            fecha: this.fechaCambio
        };
    }

    esCompatible(otraUnidad) {
        const permitidas = UnidadConverter.COMPATIBLES[this.unidad] || [this.unidad];
        return permitidas.includes(otraUnidad);
    }

    toJSON() {
        return {
            id:               this.id,
            nombre:           this.nombre,
            unidad:           this.unidad,
            precio:           this.precio,
            precio_anterior:  this.precioAnterior,
            fecha_cambio:     this.fechaCambio,
            total_recetas:    this.totalRecetas,
            productos_usados: this.productosUsados,
        };
    }
}

// ============================================================
// 3. MODELO ITEM RECETA
// ============================================================

class ItemReceta {
    constructor({ insumoId, cantidad, unidadReceta, insumo_nombre = null, insumo_precio = null, insumo_unidad = null }) {
        this.insumoId     = Number(insumoId);
        this.cantidad     = Number(cantidad) || 0;
        this.unidadReceta = String(unidadReceta).trim();
        this.insumoNombre = insumo_nombre;
        this.insumoPrecio = insumo_precio !== null ? Number(insumo_precio) : null;
        this.insumoUnidad = insumo_unidad;
    }

    calcularCosto(insumo) {
        // Si no se pasa el insumo completo pero el item tiene precio y unidad guardados
        const insumoRef = insumo || (this.insumoPrecio !== null ? {
            nombre: this.insumoNombre,
            unidad: this.insumoUnidad,
            precio: this.insumoPrecio,
        } : null);

        if (!insumoRef || this.cantidad <= 0 || !this.unidadReceta) {
            return { costo: 0, equiv: null, error: false };
        }

        const cantConvertida = UnidadConverter.convertir(this.cantidad, this.unidadReceta, insumoRef.unidad);
        if (cantConvertida === null) {
            return {
                costo: 0,
                equiv: `"${this.unidadReceta}" no es compatible con "${insumoRef.unidad}"`,
                error: true
            };
        }

        const costo = cantConvertida * insumoRef.precio;
        const equiv = (this.unidadReceta !== insumoRef.unidad)
            ? `${UnidadConverter.formatearCantidad(this.cantidad)} ${this.unidadReceta} = ${UnidadConverter.formatearCantidad(cantConvertida)} ${insumoRef.unidad}`
            : null;

        return { costo, equiv, error: false };
    }

    toJSON() {
        return {
            insumoId:      this.insumoId,
            cantidad:      this.cantidad,
            unidadReceta:  this.unidadReceta,
            insumo_nombre: this.insumoNombre,
            insumo_precio: this.insumoPrecio,
            insumo_unidad: this.insumoUnidad,
        };
    }
}

// ============================================================
// 4. MODELO PRODUCTO
// ============================================================

class Producto {
    constructor({
        id,
        nombre,
        modo = 'margen',
        valorModo = 30,
        tipoMargen = 'costo',
        unidadesProducidas = 1,
        costoEmpaque = 0,
        porcentajeMerma = 0,
        costoManoObra = 0,
        receta = [],
        precioVentaAnterior = null,
        costoSnapshot = null
    }) {
        this.id                  = Number(id);
        this.nombre              = String(nombre).trim();
        this.modo                = modo === 'multiplicador' ? 'multiplicador' : 'margen';
        const valorRaw           = Number(valorModo);
        this.valorModo           = (!isNaN(valorRaw) && valorRaw > 0)
            ? Math.round(valorRaw * 10000) / 10000
            : (this.modo === 'multiplicador' ? 2.0 : 30);
        this.tipoMargen          = tipoMargen === 'venta' ? 'venta' : 'costo';
        this.unidadesProducidas  = Math.max(1, parseInt(unidadesProducidas) || 1);
        this.costoEmpaque        = Math.max(0, parseFloat(costoEmpaque) || 0);
        this.porcentajeMerma     = Math.max(0, parseFloat(porcentajeMerma) || 0);
        this.costoManoObra       = Math.max(0, parseFloat(costoManoObra) || 0);
        this.receta              = receta.map(item => item instanceof ItemReceta ? item : new ItemReceta(item));
        this.precioVentaAnterior = precioVentaAnterior !== null ? Number(precioVentaAnterior) : null;
        this.costoSnapshot       = costoSnapshot !== null ? Number(costoSnapshot) : null;
    }

    calcularCostoIngredientes(listaInsumos = []) {
        return this.receta.reduce((total, item) => {
            const insumo = listaInsumos.find(i => i.id === item.insumoId);
            const { costo } = item.calcularCosto(insumo);
            return total + costo;
        }, 0);
    }

    calcularCostoMerma(listaInsumos = []) {
        const costoIngredientes = this.calcularCostoIngredientes(listaInsumos);
        return costoIngredientes * (this.porcentajeMerma / 100);
    }

    calcularCostoTotal(listaInsumos = []) {
        const costoIngredientes = this.calcularCostoIngredientes(listaInsumos);
        const costoMerma        = this.calcularCostoMerma(listaInsumos);
        const empaqueTotal      = this.costoEmpaque * this.unidadesProducidas;
        return costoIngredientes + costoMerma + empaqueTotal + this.costoManoObra;
    }

    calcularCostoUnidad(listaInsumos = []) {
        const total = this.calcularCostoTotal(listaInsumos);
        return total / this.unidadesProducidas;
    }

    calcularPrecioVenta(listaInsumos = []) {
        const costoUnidad = this.calcularCostoUnidad(listaInsumos);
        if (this.modo === 'multiplicador') {
            return costoUnidad * this.valorModo;
        }

        // Modo Margen %
        if (this.tipoMargen === 'venta') {
            // Margen sobre precio de venta (Margen comercial: Ganancia / Precio = %)
            if (this.valorModo >= 100) {
                return costoUnidad * 10;
            }
            return costoUnidad / (1 - (this.valorModo / 100));
        }

        // Margen sobre costo (Markup estándar: Costo * (1 + %))
        return costoUnidad * (1 + (this.valorModo / 100));
    }

    calcularGananciaNeta(listaInsumos = []) {
        const costoUnidad = this.calcularCostoUnidad(listaInsumos);
        const precioVenta = this.calcularPrecioVenta(listaInsumos);
        return Math.max(0, precioVenta - costoUnidad);
    }

    calcularMargenComercialReal(listaInsumos = []) {
        const costoUnidad = this.calcularCostoUnidad(listaInsumos);
        const precioVenta = this.calcularPrecioVenta(listaInsumos);
        if (precioVenta <= 0) return 0;
        return Math.round(((precioVenta - costoUnidad) / precioVenta) * 100);
    }

    calcularPrecioDelivery(listaInsumos = [], comisionPct = 25) {
        const precioVenta = this.calcularPrecioVenta(listaInsumos);
        const pct = Math.min(80, Math.max(0, Number(comisionPct) || 0));
        if (pct <= 0) return Math.round(precioVenta);
        return Math.round(precioVenta / (1 - (pct / 100)));
    }

    detectarCambioPrecio(listaInsumos = []) {
        const precioActual = this.calcularPrecioVenta(listaInsumos);
        if (this.precioVentaAnterior === null || isNaN(this.precioVentaAnterior)) {
            return { estado: 'nuevo', precioActual, precioAnterior: precioActual, delta: 0, deltaPct: 0 };
        }

        const delta = precioActual - this.precioVentaAnterior;
        if (Math.abs(delta) < 0.01) {
            return { estado: 'igual', precioActual, precioAnterior: this.precioVentaAnterior, delta: 0, deltaPct: 0 };
        }

        const deltaPct = this.precioVentaAnterior > 0 ? (delta / this.precioVentaAnterior) * 100 : 0;
        return {
            estado: delta > 0 ? 'sube' : 'baja',
            precioActual,
            precioAnterior: this.precioVentaAnterior,
            delta,
            deltaPct
        };
    }

    toJSON() {
        return {
            id:                  this.id,
            nombre:              this.nombre,
            modo:                this.modo,
            valorModo:           this.valorModo,
            tipoMargen:          this.tipoMargen,
            unidadesProducidas:  this.unidadesProducidas,
            costoEmpaque:        this.costoEmpaque,
            porcentajeMerma:     this.porcentajeMerma,
            costoManoObra:       this.costoManoObra,
            receta:              this.receta.map(r => r.toJSON()),
            precioVentaAnterior: this.precioVentaAnterior,
            costoSnapshot:       this.costoSnapshot
        };
    }
}

// Exportación al objeto global
window.UnidadConverter = UnidadConverter;
window.Insumo          = Insumo;
window.ItemReceta      = ItemReceta;
window.Producto        = Producto;
