/**
 * store.js — Servicio Central de Almacenamiento, Estado y Sincronización (POO)
 * Sincronización híbrida: Backend PHP/MySQL con fallback local transparente en localStorage.
 */

class StoreService {
    static INSUMOS_DEFAULT = [
        { id: 1, nombre: 'Harina de trigo', unidad: 'kg', precio: 3200, imagen: '../assets/img/demo/insumos/harina.jpg' },
        { id: 2, nombre: 'Levadura seca', unidad: 'g', precio: 45, imagen: '../assets/img/demo/insumos/levadura.jpg' },
        { id: 3, nombre: 'Mantequilla', unidad: 'g', precio: 18, imagen: '../assets/img/demo/insumos/mantequilla.jpg' },
        { id: 4, nombre: 'Azúcar blanca', unidad: 'kg', precio: 2800, imagen: '../assets/img/demo/insumos/azucar.jpg' },
        { id: 5, nombre: 'Huevo', unidad: 'unidad', precio: 350, imagen: '../assets/img/demo/insumos/huevo.jpg' },
        { id: 6, nombre: 'Chocolate amargo', unidad: 'g', precio: 62, imagen: '../assets/img/demo/insumos/chocolate.jpg' },
        { id: 7, nombre: 'Leche entera', unidad: 'l', precio: 4200, imagen: '../assets/img/demo/insumos/leche.jpg' },
        { id: 8, nombre: 'Café molido', unidad: 'g', precio: 55, imagen: '../assets/img/demo/insumos/cafe.jpg' },
        { id: 9, nombre: 'Queso campesino', unidad: 'g', precio: 24, imagen: '../assets/img/demo/insumos/queso.jpg' },
        { id: 10, nombre: 'Avena en hojuelas', unidad: 'g', precio: 9, imagen: '../assets/img/demo/insumos/avena.jpg' },
    ];

    static PRODUCTOS_DEFAULT = [
        { id: 1, nombre: 'Pan artesanal', imagen: '../assets/img/ofertas/pan-artesanal.png', modo: 'margen', valorModo: 35, tipoMargen: 'venta', unidadesProducidas: 10, costoEmpaque: 50, porcentajeMerma: 5, costoManoObra: 800, precioVentaAnterior: 821.92, costoSnapshot: 534.25, receta: [{ insumoId: 1, cantidad: 500, unidadReceta: 'g' }, { insumoId: 2, cantidad: 10, unidadReceta: 'g' }, { insumoId: 3, cantidad: 100, unidadReceta: 'g' }] },
        { id: 2, nombre: 'Torta de chocolate', imagen: '../assets/img/ofertas/torta-chocolate.png', modo: 'margen', valorModo: 38, tipoMargen: 'venta', unidadesProducidas: 1, costoEmpaque: 1800, porcentajeMerma: 4, costoManoObra: 3200, precioVentaAnterior: 34836.13, costoSnapshot: 21598.40, receta: [{ insumoId: 1, cantidad: 300, unidadReceta: 'g' }, { insumoId: 3, cantidad: 200, unidadReceta: 'g' }, { insumoId: 4, cantidad: 0.25, unidadReceta: 'kg' }, { insumoId: 5, cantidad: 4, unidadReceta: 'unidad' }, { insumoId: 6, cantidad: 150, unidadReceta: 'g' }] },
        { id: 3, nombre: 'Galletas de avena', imagen: '../assets/img/ofertas/galletas-avena.png', modo: 'margen', valorModo: 40, tipoMargen: 'venta', unidadesProducidas: 24, costoEmpaque: 35, porcentajeMerma: 3, costoManoObra: 700, precioVentaAnterior: 397.35, costoSnapshot: 238.41, receta: [{ insumoId: 1, cantidad: 200, unidadReceta: 'g' }, { insumoId: 10, cantidad: 150, unidadReceta: 'g' }, { insumoId: 3, cantidad: 80, unidadReceta: 'g' }, { insumoId: 4, cantidad: 0.1, unidadReceta: 'kg' }, { insumoId: 5, cantidad: 1, unidadReceta: 'unidad' }] },
        { id: 4, nombre: 'Croissant de mantequilla', imagen: '../assets/img/ofertas/croissant.png', modo: 'margen', valorModo: 40, tipoMargen: 'venta', unidadesProducidas: 12, costoEmpaque: 120, porcentajeMerma: 6, costoManoObra: 2200, precioVentaAnterior: 1780.94, costoSnapshot: 1068.57, receta: [{ insumoId: 1, cantidad: 600, unidadReceta: 'g' }, { insumoId: 2, cantidad: 15, unidadReceta: 'g' }, { insumoId: 3, cantidad: 250, unidadReceta: 'g' }, { insumoId: 7, cantidad: 250, unidadReceta: 'ml' }, { insumoId: 4, cantidad: 60, unidadReceta: 'g' }, { insumoId: 5, cantidad: 1, unidadReceta: 'unidad' }] },
        { id: 5, nombre: 'Pan de queso campesino', imagen: '../assets/img/demo/productos/pan-queso.jpg', modo: 'margen', valorModo: 35, tipoMargen: 'venta', unidadesProducidas: 12, costoEmpaque: 90, porcentajeMerma: 4, costoManoObra: 1800, precioVentaAnterior: 1981.23, costoSnapshot: 1287.80, receta: [{ insumoId: 1, cantidad: 400, unidadReceta: 'g' }, { insumoId: 9, cantidad: 350, unidadReceta: 'g' }, { insumoId: 3, cantidad: 60, unidadReceta: 'g' }, { insumoId: 5, cantidad: 2, unidadReceta: 'unidad' }, { insumoId: 7, cantidad: 150, unidadReceta: 'ml' }] },
        { id: 6, nombre: 'Capuchino artesanal (12 oz)', imagen: '../assets/img/demo/productos/capuchino.jpg', modo: 'margen', valorModo: 45, tipoMargen: 'venta', unidadesProducidas: 1, costoEmpaque: 420, porcentajeMerma: 5, costoManoObra: 550, precioVentaAnterior: 5471.09, costoSnapshot: 3009.10, receta: [{ insumoId: 8, cantidad: 18, unidadReceta: 'g' }, { insumoId: 7, cantidad: 220, unidadReceta: 'ml' }, { insumoId: 4, cantidad: 10, unidadReceta: 'g' }] },
        { id: 7, nombre: 'Brownie de chocolate', imagen: '../assets/img/demo/productos/brownie.jpg', modo: 'multiplicador', valorModo: 2.2, tipoMargen: 'costo', unidadesProducidas: 16, costoEmpaque: 60, porcentajeMerma: 2, costoManoObra: 0, precioVentaAnterior: 2529.43, costoSnapshot: 1149.74, receta: [{ insumoId: 6, cantidad: 200, unidadReceta: 'g' }, { insumoId: 3, cantidad: 150, unidadReceta: 'g' }, { insumoId: 4, cantidad: 200, unidadReceta: 'g' }, { insumoId: 5, cantidad: 3, unidadReceta: 'unidad' }, { insumoId: 1, cantidad: 120, unidadReceta: 'g' }] },
    ];

    /**
     * Escapa caracteres especiales en cadenas para prevenir inyecciones XSS (Cross-Site Scripting).
     * Reemplaza &, <, >, ", ' de forma segura conforme a estándares OWASP.
     * @param {string|any} str Cadena o valor a escapar
     * @returns {string} Cadena segura sanitizada para HTML
     */
    static escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    escapeHtml(str) {
        return StoreService.escapeHtml(str);
    }

    constructor() {
        this.CLAVE_INSUMOS = 'costia_insumos'; this.CLAVE_PRODUCTOS = 'costia_productos';
        this.CLAVE_NEGOCIO = 'costia_negocio'; this.CLAVE_CONFIG_GASTOS = 'costia_config_gastos';
        this.CLAVE_TOAST = 'costia_toast'; this.usuario = null; this.tieneSesion = false; this.listeners = [];
    }

    alActualizar(fn) { if (typeof fn === 'function') this.listeners.push(fn); }
    notificarActualizacion() { this.listeners.forEach(fn => { try { fn(); } catch (_) {} }); }

    // ─── Verificación de Sesión y Sincronización ──────────────────

    async verificarSesion() {
        try {
            const res = await fetch('../backend/auth/session.php', { cache: 'no-store' });
            if (!res.ok) return false;
            const data = await res.json();

            if (data.autenticado && data.usuario) {
                this.tieneSesion = true;
                this.usuario     = data.usuario;
                if (data.usuario.negocio) localStorage.setItem(this.CLAVE_NEGOCIO, String(data.usuario.negocio).trim());
                this.actualizarBadgeUI();
                await this.sincronizarConServidor();
                return true;
            }
            this.tieneSesion = false;
            this.usuario     = null;
            return false;
        } catch (_) {
            this.tieneSesion = false;
            this.usuario     = null;
            return false;
        }
    }

    async sincronizarConServidor() {
        if (!this.tieneSesion) return;

        try {
            const [resIns, resProd, resCfg] = await Promise.all([
                fetch('../backend/api/insumos.php', { cache: 'no-store' }),
                fetch('../backend/api/productos.php', { cache: 'no-store' }),
                fetch('../backend/api/configuracion.php', { cache: 'no-store' })
            ]);

            if (resIns.ok) {
                const dataIns = await resIns.json();
                if (dataIns.status === 'success' && Array.isArray(dataIns.insumos)) {
                    const locales = this.cargarInsumos();
                    const fusionados = dataIns.insumos.map(remoto => {
                        const local = locales.find(l => l.id === remoto.id);
                        return {
                            ...remoto,
                            precio_anterior: remoto.precio_anterior ?? local?.precioAnterior ?? null,
                            fecha_cambio: remoto.fecha_cambio ?? local?.fechaCambio ?? null
                        };
                    });
                    this.guardarInsumosLocal(fusionados);
                }
            }

            if (resProd.ok) {
                const dataProd = await resProd.json();
                if (dataProd.status === 'success' && Array.isArray(dataProd.productos)) this.guardarProductosLocal(dataProd.productos);
            }

            if (resCfg && resCfg.ok) {
                const dataCfg = await resCfg.json();
                if (dataCfg.status === 'success') {
                    if (dataCfg.negocio) {
                        localStorage.setItem(this.CLAVE_NEGOCIO, String(dataCfg.negocio).trim());
                        this.actualizarBadgeUI();
                    }
                    if (dataCfg.config_gastos && typeof dataCfg.config_gastos === 'object') {
                        localStorage.setItem(this.CLAVE_CONFIG_GASTOS, JSON.stringify(dataCfg.config_gastos));
                    }
                }
            }

            this.notificarActualizacion();
        } catch (err) {
            console.warn('No se pudo sincronizar con la base de datos MySQL; usando almacenamiento local.', err);
        }
    }

    actualizarBadgeUI() {
        const badges = document.querySelectorAll('.app-header__negocio');
        badges.forEach(badge => {
            const nombre = this.cargarNegocio();
            badge.innerHTML = `<span class="app-header__negocio-texto">${StoreService.escapeHtml(nombre)}</span>`;
            badge.setAttribute('title', 'Ir a Configuración del Negocio');
            badge.style.cursor = 'pointer';
        });
    }

    // ─── Insumos (Lectura y Escritura Híbrida) ─────────────────────

    cargarInsumos() {
        const raw = localStorage.getItem(this.CLAVE_INSUMOS);
        const lista = raw ? JSON.parse(raw) : StoreService.INSUMOS_DEFAULT;
        return lista.map(item => {
            if (item && !Object.prototype.hasOwnProperty.call(item, 'imagen')) {
                const def = StoreService.INSUMOS_DEFAULT.find(d => d.id === Number(item.id));
                if (def && def.imagen) {
                    return new Insumo({ ...item, imagen: def.imagen });
                }
            }
            return new Insumo(item);
        });
    }

    guardarInsumosLocal(insumos) {
        localStorage.setItem(this.CLAVE_INSUMOS, JSON.stringify(insumos.map(i => i instanceof Insumo ? i.toJSON() : i)));
    }

    guardarInsumos(insumos) { this.guardarInsumosLocal(insumos); }

    async guardarInsumoAsync({ id, nombre, unidad, precio, imagen = undefined }) {
        // Asegurar que todos los productos tengan sellado su precio de venta anterior
        // con los valores vigentes de insumos ANTES de aplicar el cambio de precio
        const insumosAntes = this.cargarInsumos();
        const prodsActuales = this.cargarProductos();

        let precioAnterior = null;
        let fechaCambio = null;
        let imagenFinal = imagen !== undefined
            ? (ImageHelper.esImagenValida(imagen) ? imagen : null)
            : null;

        if (id) {
            const idNum = parseInt(id);
            const insumoExistente = insumosAntes.find(i => i.id === idNum);
            precioAnterior = insumoExistente ? insumoExistente.precioAnterior : null;
            fechaCambio = insumoExistente ? insumoExistente.fechaCambio : null;
            if (imagen === undefined && insumoExistente) {
                imagenFinal = insumoExistente.imagen || null;
            }

            if (insumoExistente && Math.abs(Number(insumoExistente.precio) - Number(precio)) >= 0.01) {
                precioAnterior = Number(insumoExistente.precio);
                fechaCambio = new Date().toISOString();
            }

            const insumosDespues = insumosAntes.map(i =>
                i.id === idNum
                    ? new Insumo({ id: idNum, nombre, unidad, precio, imagen: imagenFinal, precio_anterior: precioAnterior, fecha_cambio: fechaCambio })
                    : i
            );

            prodsActuales.forEach(p => {
                const precioAntes   = p.calcularPrecioVenta(insumosAntes);
                const precioDespues = p.calcularPrecioVenta(insumosDespues);

                if (p.precioVentaAnterior === null || isNaN(p.precioVentaAnterior)) {
                    p.precioVentaAnterior = precioAntes;
                } else if (
                    Math.abs(precioDespues - p.precioVentaAnterior) < 0.01 &&
                    Math.abs(precioAntes - precioDespues) >= 0.01
                ) {
                    // Si el cambio vuelve al valor que tenía como base sin haber confirmado el anterior,
                    // tomamos el precio inmediatamente previo para reflejar la variación recién hecha
                    p.precioVentaAnterior = precioAntes;
                }
            });
            this.guardarProductosLocal(prodsActuales);
        }

        if (this.tieneSesion) {
            try {
                const payload = { accion: id ? 'actualizar' : 'crear', id, nombre, unidad, precio };
                if (imagen !== undefined) payload.imagen = imagenFinal;
                const res = await fetch('../backend/api/insumos.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    // Actualizar memoria local preservando la variación recién computada
                    const insumosActualizados = this.cargarInsumos();
                    const idxRemoto = insumosActualizados.findIndex(i => i.id === parseInt(id));
                    if (idxRemoto !== -1) {
                        insumosActualizados[idxRemoto].precioAnterior = precioAnterior;
                        insumosActualizados[idxRemoto].fechaCambio = fechaCambio;
                        this.guardarInsumosLocal(insumosActualizados);
                    }
                    await this.sincronizarConServidor();
                    return { success: true, mensaje: data.mensaje };
                } else {
                    return { success: false, mensaje: data.mensaje || 'Error al guardar en el servidor.' };
                }
            } catch (err) {
                console.warn('Fallo de red al guardar insumo en MySQL; aplicando respaldo local.', err);
            }
        }

        // Modo Local / Fallback
        const insumos = this.cargarInsumos();
        if (id) {
            const idx = insumos.findIndex(i => i.id === parseInt(id));
            if (idx !== -1) {
                insumos[idx] = new Insumo({
                    id,
                    nombre,
                    unidad,
                    precio,
                    imagen: imagenFinal,
                    precio_anterior: precioAnterior,
                    fecha_cambio: fechaCambio
                });
            }
        } else {
            const nuevoId = insumos.length > 0 ? Math.max(...insumos.map(i => i.id)) + 1 : 1;
            insumos.push(new Insumo({ id: nuevoId, nombre, unidad, precio, imagen: imagenFinal }));
        }
        this.guardarInsumosLocal(insumos);
        this.notificarActualizacion();
        return { success: true, mensaje: id ? `Insumo "${nombre}" actualizado` : `Insumo "${nombre}" agregado` };
    }

    async eliminarInsumoAsync(id, forzar = false) {
        if (this.tieneSesion) {
            try {
                const res = await fetch(`../backend/api/insumos.php?id=${id}${forzar ? '&forzar=1' : ''}`, {
                    method: 'DELETE'
                });
                const data = await res.json();

                if (data.status === 'alerta_en_uso') {
                    return {
                        success: false,
                        enUso: true,
                        productos: data.productos || [],
                        mensaje: data.mensaje
                    };
                }

                if (res.ok && data.status === 'success') {
                    await this.sincronizarConServidor();
                    return { success: true, mensaje: data.mensaje };
                } else {
                    return { success: false, mensaje: data.mensaje || 'Error al eliminar en la base de datos.' };
                }
            } catch (err) {
                console.warn('Fallo de red al eliminar en MySQL; aplicando respaldo local.', err);
            }
        }

        // ─── Modo local / fallback transparente ──────────────────
        if (!forzar) {
            const productos = this.cargarProductos();
            const afectaron = productos.filter(p => {
                if (!Array.isArray(p.receta)) return false;
                return p.receta.some(r => Number(r.insumoId) === Number(id));
            });

            if (afectaron.length > 0) {
                return {
                    success: false,
                    enUso: true,
                    productos: afectaron.map(p => p.nombre),
                    mensaje: `El insumo está siendo utilizado en ${afectaron.length} ${afectaron.length === 1 ? 'producto activo' : 'productos activos'}.`
                };
            }
        }

        const insumos = this.cargarInsumos().filter(i => i.id !== id);
        this.guardarInsumosLocal(insumos);
        this.notificarActualizacion();
        return { success: true, mensaje: 'Insumo eliminado con éxito.' };
    }

    // ─── Productos (Lectura y Escritura Híbrida) ───────────────────

    cargarProductos() {
        const raw = localStorage.getItem(this.CLAVE_PRODUCTOS);
        const lista = raw ? JSON.parse(raw) : StoreService.PRODUCTOS_DEFAULT;
        const insumosActuales = this.cargarInsumos();
        const insumosBase = insumosActuales.map(ins => {
            const def = StoreService.INSUMOS_DEFAULT.find(d => d.id === ins.id);
            return def ? new Insumo(def) : ins;
        });

        return lista.map(item => {
            let itemConFoto = item;
            if (item && !Object.prototype.hasOwnProperty.call(item, 'imagen')) {
                const defImg = StoreService.PRODUCTOS_DEFAULT.find(d => d.id === Number(item.id));
                if (defImg && defImg.imagen) {
                    itemConFoto = { ...item, imagen: defImg.imagen };
                }
            }
            const prod = new Producto(itemConFoto);
            // Recuperar precio anterior si estaba nulo para cualquier producto
            if (prod.precioVentaAnterior === null || isNaN(prod.precioVentaAnterior)) {
                const def = StoreService.PRODUCTOS_DEFAULT.find(d => d.id === prod.id);
                prod.precioVentaAnterior = (def && def.precioVentaAnterior)
                    ? def.precioVentaAnterior
                    : prod.calcularPrecioVenta(insumosBase);
            }
            return prod;
        });
    }

    guardarProductosLocal(productos) {
        localStorage.setItem(this.CLAVE_PRODUCTOS, JSON.stringify(productos.map(p => p instanceof Producto ? p.toJSON() : p)));
    }

    guardarProductos(productos) { this.guardarProductosLocal(productos); }

    async guardarProductoAsync(datosProducto) {
        if (this.tieneSesion) {
            try {
                const res = await fetch('../backend/api/productos.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosProducto)
                });
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    await this.sincronizarConServidor();
                    return { success: true, mensaje: data.mensaje };
                } else {
                    return { success: false, mensaje: data.mensaje || 'Error al guardar producto en MySQL.' };
                }
            } catch (err) {
                console.warn('Fallo al guardar producto en MySQL; guardando localmente.', err);
            }
        }

        // Modo Local
        const productos = this.cargarProductos();
        const id = datosProducto.id ? parseInt(datosProducto.id) : null;

        if (id) {
            const idx = productos.findIndex(p => p.id === id);
            if (idx !== -1) {
                const tieneCampoImagen = Object.prototype.hasOwnProperty.call(datosProducto, 'imagen');
                const imagenFinal = tieneCampoImagen
                    ? (ImageHelper.esImagenValida(datosProducto.imagen) ? datosProducto.imagen : null)
                    : (productos[idx].imagen || null);
                Object.assign(productos[idx], {
                    nombre: datosProducto.nombre,
                    imagen: imagenFinal,
                    modo: datosProducto.modo,
                    valorModo: datosProducto.valorModo,
                    tipoMargen: datosProducto.tipoMargen || 'costo',
                    unidadesProducidas: datosProducto.unidadesProducidas,
                    costoEmpaque: datosProducto.costoEmpaque || 0,
                    porcentajeMerma: datosProducto.porcentajeMerma || 0,
                    costoManoObra: datosProducto.costoManoObra || 0,
                    receta: datosProducto.receta.map(r => new ItemReceta(r))
                });
                productos[idx].precioVentaAnterior = (datosProducto.precioVentaAnterior !== undefined && datosProducto.precioVentaAnterior !== null)
                    ? Number(datosProducto.precioVentaAnterior)
                    : productos[idx].calcularPrecioVenta(this.cargarInsumos());
            }
        } else {
            const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
            const imagenNueva = ImageHelper.esImagenValida(datosProducto.imagen) ? datosProducto.imagen : null;
            const nuevoProd = new Producto({
                id: nuevoId,
                nombre: datosProducto.nombre,
                imagen: imagenNueva,
                modo: datosProducto.modo,
                valorModo: datosProducto.valorModo,
                tipoMargen: datosProducto.tipoMargen || 'costo',
                unidadesProducidas: datosProducto.unidadesProducidas,
                costoEmpaque: datosProducto.costoEmpaque || 0,
                porcentajeMerma: datosProducto.porcentajeMerma || 0,
                costoManoObra: datosProducto.costoManoObra || 0,
                receta: datosProducto.receta,
                precioVentaAnterior: datosProducto.precioVentaAnterior ?? null
            });
            if (nuevoProd.precioVentaAnterior === null || isNaN(nuevoProd.precioVentaAnterior)) {
                nuevoProd.precioVentaAnterior = nuevoProd.calcularPrecioVenta(this.cargarInsumos());
            }
            productos.push(nuevoProd);
        }

        this.guardarProductosLocal(productos);
        this.notificarActualizacion();
        return { success: true, mensaje: 'Producto guardado con éxito' };
    }

    async eliminarProductoAsync(id) {
        if (this.tieneSesion) {
            try {
                const res = await fetch(`../backend/api/productos.php?id=${id}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                if (res.ok && data.status === 'success') {
                    await this.sincronizarConServidor();
                    return { success: true, mensaje: data.mensaje };
                }
            } catch (err) {
                console.warn('Fallo de red al eliminar producto en MySQL; eliminando localmente.', err);
            }
        }

        const productos = this.cargarProductos().filter(p => p.id !== id);
        this.guardarProductosLocal(productos);
        this.notificarActualizacion();
        return { success: true, mensaje: 'Producto eliminado' };
    }

    async aceptarCambioPrecioAsync(id) {
        const insumos   = this.cargarInsumos();
        const productos = this.cargarProductos();
        const prod      = productos.find(p => p.id === id);
        if (!prod) return;

        const nuevoPrecio = prod.calcularPrecioVenta(insumos);

        if (this.tieneSesion) {
            try {
                await fetch('../backend/api/productos.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accion: 'aceptar_alerta',
                        id,
                        precio: nuevoPrecio
                    })
                });
                await this.sincronizarConServidor();
                return;
            } catch (_) {}
        }

        prod.precioVentaAnterior = nuevoPrecio;
        this.guardarProductosLocal(productos);
        this._sellarInsumosSinAlertasPendientes((prod.receta || []).map(r => r.insumoId));
        this.notificarActualizacion();
    }

    async mantenerPrecioRecalcularMargenAsync(id) {
        const insumos   = this.cargarInsumos();
        const productos = this.cargarProductos();
        const prod      = productos.find(p => p.id === id);
        if (!prod) return { success: false, mensaje: 'Producto no encontrado.' };

        const precioObjetivo = prod.precioVentaAnterior;
        const costoUnidad    = prod.calcularCostoUnidad(insumos);

        if (precioObjetivo === null || isNaN(precioObjetivo) || precioObjetivo <= 0) {
            return { success: false, mensaje: 'No hay un precio anterior válido para mantener.' };
        }
        if (costoUnidad >= precioObjetivo) {
            return {
                success: false,
                mensaje: `No es posible mantener ${this.fmt(precioObjetivo)} porque el costo actual (${this.fmt(costoUnidad)}) iguala o supera ese precio.`
            };
        }

        let nuevoValorModo;
        if (prod.modo === 'multiplicador') {
            nuevoValorModo = costoUnidad > 0
                ? Math.round((precioObjetivo / costoUnidad) * 10000) / 10000
                : prod.valorModo;
        } else if (prod.tipoMargen === 'venta') {
            nuevoValorModo = Math.round((((precioObjetivo - costoUnidad) / precioObjetivo) * 100) * 10000) / 10000;
        } else {
            nuevoValorModo = costoUnidad > 0
                ? Math.round((((precioObjetivo - costoUnidad) / costoUnidad) * 100) * 10000) / 10000
                : prod.valorModo;
        }

        if (!(nuevoValorModo > 0)) {
            return { success: false, mensaje: 'El margen resultante no es positivo. Ajusta el precio o edita la receta.' };
        }

        const prodActualizado = new Producto({
            ...prod.toJSON(),
            valorModo: nuevoValorModo
        });
        const precioVentaExacto = prodActualizado.calcularPrecioVenta(insumos);

        const res = await this.guardarProductoAsync({
            id:                  prod.id,
            nombre:              prod.nombre,
            modo:                prod.modo,
            valorModo:           nuevoValorModo,
            tipoMargen:          prod.tipoMargen || 'venta',
            unidadesProducidas:  prod.unidadesProducidas,
            costoEmpaque:        prod.costoEmpaque || 0,
            porcentajeMerma:     prod.porcentajeMerma || 0,
            costoManoObra:       prod.costoManoObra || 0,
            precioVentaAnterior: precioVentaExacto,
            receta: (prod.receta || []).map(r => ({
                insumoId:     r.insumoId,
                cantidad:     r.cantidad,
                unidadReceta: r.unidadReceta
            }))
        });

        if (!res.success) return res;

        this._sellarInsumosSinAlertasPendientes((prod.receta || []).map(r => r.insumoId));
        this.notificarActualizacion();

        const margenReal = Math.round(((precioObjetivo - costoUnidad) / precioObjetivo) * 100);
        return {
            success: true,
            precioMantenido: precioObjetivo,
            nuevoValorModo,
            modo: prod.modo,
            margenReal
        };
    }

    // ─── Negocio y Configuración de Gastos Fijos ──────────────────

    cargarNegocio() { return localStorage.getItem(this.CLAVE_NEGOCIO) || 'Panadería El Roble'; }
    obtenerNegocio() { return this.cargarNegocio(); }
    guardarNegocio(nombre) {
        localStorage.setItem(this.CLAVE_NEGOCIO, nombre.trim());
        this.sincronizarConfigServidor();
    }

    async sincronizarConfigServidor() {
        if (!this.tieneSesion) return;
        try {
            await fetch('../backend/api/configuracion.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    negocio: this.cargarNegocio(),
                    config_gastos: this.cargarConfigGastos()
                })
            });
        } catch (_) {}
    }

    cargarConfigGastos() {
        const raw = localStorage.getItem(this.CLAVE_CONFIG_GASTOS);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (_) { return null; }
    }

    obtenerConfigGastos() {
        const defaults = {
            tipoUbicacion: 'local', ubicacionDescripcion: 'Local en arriendo',
            arriendoMensual: 1200000, recibosMensuales: 180000,
            numTrabajadores: 1, salarioTrabajador: 1423500,
            nominaMensualTotal: 1423500, lotesMensualesEstimados: 100,
            cuotaManoObraPorLote: 14235, cuotaFijaTotalPorLote: 28035,
            pagoHoraManoObra: 8897, horasMesManoObra: 160, otrosGastosMensuales: 100000,
            incluirImpoconsumo: false, impoconsumoPct: 8, comisionDeliveryPct: 25,
            margenDefault: '40', modeloComercial: '2.5'
        };
        const guardado = this.cargarConfigGastos();
        return guardado ? { ...defaults, ...guardado } : defaults;
    }

    guardarConfigGastos(config) {
        const actual = this.cargarConfigGastos() || {};
        const trab = Math.max(0, parseInt(config.numTrabajadores ?? actual.numTrabajadores ?? 1) || 0);
        const sal = Math.max(0, parseInt(config.salarioTrabajador ?? actual.salarioTrabajador ?? 1423500) || 0);
        const lotes = Math.max(1, parseInt(config.lotesMensualesEstimados ?? actual.lotesMensualesEstimados ?? 100) || 100);
        const arriendo = Math.max(0, parseInt(config.arriendoMensual ?? actual.arriendoMensual ?? 0) || 0);
        const recibos = Math.max(0, parseInt(config.recibosMensuales ?? actual.recibosMensuales ?? 0) || 0);
        const incluirImpo = config.incluirImpoconsumo !== undefined
            ? Boolean(config.incluirImpoconsumo)
            : Boolean(actual.incluirImpoconsumo);
        const impoconsumoPct = Math.max(0, Math.min(30, Number(config.impoconsumoPct ?? actual.impoconsumoPct ?? 8) || 0));
        const comisionDeliveryPct = Math.max(0, Math.min(50, Number(config.comisionDeliveryPct ?? actual.comisionDeliveryPct ?? 25) || 0));

        const nominaTotal = trab * sal;
        const cuotaMano = Math.round(nominaTotal / lotes);
        const fijosTotal = arriendo + recibos + nominaTotal;
        const cuotaTotal = Math.round(fijosTotal / lotes);
        const pagoHora = trab > 0 ? Math.round(sal / 160) : 6500;

        const nuevo = {
            ...actual, ...config,
            numTrabajadores: trab,
            salarioTrabajador: sal,
            nominaMensualTotal: nominaTotal,
            lotesMensualesEstimados: lotes,
            cuotaManoObraPorLote: cuotaMano,
            cuotaFijaTotalPorLote: cuotaTotal,
            pagoHoraManoObra: pagoHora,
            incluirImpoconsumo: incluirImpo,
            impoconsumoPct,
            comisionDeliveryPct,
            margenDefault: String(config.margenDefault ?? actual.margenDefault ?? '40'),
            modeloComercial: String(config.modeloComercial ?? actual.modeloComercial ?? '2.5'),
            configurado: true,
            actualizadoEn: new Date().toISOString()
        };
        localStorage.setItem(this.CLAVE_CONFIG_GASTOS, JSON.stringify(nuevo));
        this.notificarActualizacion();
        this.sincronizarConfigServidor();
        return nuevo;
    }

    abrirModalConfigGastos() {
        if (window.location.pathname.includes('configuracion.html')) {
            document.getElementById('seccion-gastos-fijos')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        let modal = document.getElementById('modal-config-gastos');
        const cfg = this.obtenerConfigGastos();

        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-config-gastos';
            modal.className = 'modal-config-backdrop';
            modal.innerHTML = `
                <div class="modal-config-card" role="dialog" aria-modal="true" aria-labelledby="cfg-modal-titulo">
                    <header class="modal-config-header">
                        <div class="modal-config-header__info">
                            <span class="modal-config-header__icono">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            </span>
                            <div>
                                <h3 id="cfg-modal-titulo">Gastos Fijos, Trabajadores y Salarios</h3>
                                <p>Configura tu equipo, sueldos y costos operativos para calcular la cuota exacta de tus productos.</p>
                            </div>
                        </div>
                        <button type="button" class="modal-config-cerrar" id="btn-cerrar-config-gastos" aria-label="Cerrar">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </header>
                    <div class="modal-config-body">
                        <div class="modal-cfg-banner-full" style="background:#F6F2EA; border:1px solid #E4DCCA; border-radius:10px; padding:8px 12px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                            <span style="font-size:11.5px; color:#0D241C; line-height:1.3;">También puedes configurar identidad, comisiones e impuestos desde Mi Negocio.</span>
                            <a href="configuracion.html#seccion-gastos-fijos" style="font-size:11.5px; font-weight:700; color:#0F6A4A; text-decoration:none; background:#FDFBF7; border:1px solid #0F6A4A; padding:4px 8px; border-radius:6px; white-space:nowrap;">Abrir Mi Negocio &rarr;</a>
                        </div>
                        <div class="cfg-grupo">
                            <label class="cfg-label">Lugar de producción</label>
                            <div class="cfg-espacio-selector">
                                <label class="cfg-radio-card" id="card-espacio-casa">
                                    <input type="radio" name="cfg-espacio" value="casa">
                                    <div class="cfg-radio-content">
                                        <span class="cfg-radio-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
                                        <div><strong>Desde casa / Propio</strong><small>$0 arriendo comercial</small></div>
                                    </div>
                                </label>
                                <label class="cfg-radio-card" id="card-espacio-local">
                                    <input type="radio" name="cfg-espacio" value="local">
                                    <div class="cfg-radio-content">
                                        <span class="cfg-radio-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3h18l-2 9H5L3 3z"/><path d="M3 12v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-9"/></svg></span>
                                        <div><strong>Local en arriendo</strong><small>Punto comercial</small></div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div class="cfg-grupo" id="wrap-cfg-arriendo">
                            <label class="cfg-label" for="cfg-input-arriendo">Arriendo mensual ($ COP) <span class="cfg-hint">Canon mensual del local</span></label>
                            <div class="cfg-input-prefix"><span>$</span><input type="number" id="cfg-input-arriendo" min="0" step="10000" placeholder="Ej: 1200000"></div>
                        </div>
                        <div class="cfg-grupo">
                            <label class="cfg-label" for="cfg-input-recibos">Servicios públicos mensuales ($ COP) <span class="cfg-hint">Suma de luz, gas, agua</span></label>
                            <div class="cfg-input-prefix"><span>$</span><input type="number" id="cfg-input-recibos" min="0" step="5000" placeholder="Ej: 180000"></div>
                        </div>
                        <div class="cfg-row-dos-col">
                            <div class="cfg-grupo">
                                <label class="cfg-label" for="cfg-input-trabajadores">N° Trabajadores <span class="cfg-hint">Personal que opera</span></label>
                                <div class="cfg-input-prefix"><span>#</span><input type="number" id="cfg-input-trabajadores" min="0" max="50" step="1" placeholder="Ej: 2"></div>
                            </div>
                            <div class="cfg-grupo">
                                <label class="cfg-label" for="cfg-input-salario">Salario mensual c/u ($ COP) <span class="cfg-hint">Sueldo promedio</span></label>
                                <div class="cfg-input-prefix"><span>$</span><input type="number" id="cfg-input-salario" min="0" step="50000" placeholder="Ej: 1423500"></div>
                            </div>
                        </div>
                        <div class="cfg-grupo">
                            <label class="cfg-label" for="cfg-input-lotes-mes">Producción estimada mensual <span class="cfg-hint">Lotes o recetas promedio preparados al mes</span></label>
                            <div class="cfg-input-prefix"><span>#</span><input type="number" id="cfg-input-lotes-mes" min="1" step="5" placeholder="Ej: 100"></div>
                        </div>

                        <!-- Tarjeta de liquidación automática calculada en vivo -->
                        <div class="cfg-calc-box" id="cfg-calc-box" style="background:#FAFDFB; border:1.5px solid #0A6847; border-radius:12px; padding:12px 14px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                <span style="font-weight:700; font-size:12.5px; color:#071F17; display:flex; align-items:center; gap:6px;">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A6847" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                                    Cálculo de cuota para tus productos:
                                </span>
                                <span style="font-size:11px; font-weight:700; color:#0A6847; background:rgba(10,104,71,0.1); padding:2px 8px; border-radius:8px;" id="cfg-badge-nomina">$0 nómina</span>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                <div style="background:#fff; border:1px solid rgba(7,31,23,0.1); border-radius:8px; padding:8px 10px;">
                                    <div style="color:#526059; font-size:10.5px;">Mano de obra / lote:</div>
                                    <strong style="font-size:14px; color:#0A6847; font-family:monospace;" id="cfg-disp-cuota-mano">$0</strong>
                                </div>
                                <div style="background:#fff; border:1px solid rgba(7,31,23,0.1); border-radius:8px; padding:8px 10px;">
                                    <div style="color:#526059; font-size:10.5px;">Cuota fija total / lote:</div>
                                    <strong style="font-size:14px; color:#071F17; font-family:monospace;" id="cfg-disp-cuota-total">$0</strong>
                                </div>
                            </div>
                            <div style="font-size:11px; color:#526059; margin-top:6px; line-height:1.35;">
                                Esta cuota se prorratea en tus recetas para que el precio de venta cubra la nómina de tus empleados y los costos fijos.
                            </div>
                        </div>

                        <div class="cfg-grupo">
                            <label class="cfg-label" for="cfg-select-modelo">Modelo comercial de tu negocio <span class="cfg-hint">Multiplicador por defecto para tus recetas</span></label>
                            <select id="cfg-select-modelo" style="width:100%; min-height:42px; padding:8px 12px; border:1px solid rgba(7,31,23,0.15); border-radius:8px; font-size:13px; background:#fff; color:#10211B;">
                                <option value="2.0">Por encargo / Delivery estándar (Multiplicador ×2.0)</option>
                                <option value="2.5" selected>Local o mostrador tradicional (Multiplicador ×2.5)</option>
                                <option value="3.0">Cafetería o restaurante gourmet (Multiplicador ×3.0)</option>
                                <option value="3.5">Pastelería fina o repostería premium (Multiplicador ×3.5)</option>
                            </select>
                        </div>
                    </div>
                    <footer class="modal-config-footer">
                        <button type="button" class="btn-cfg-cancelar" id="btn-cancelar-config-gastos">Cancelar</button>
                        <button type="button" class="btn-cfg-guardar" id="btn-guardar-config-gastos"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true" style="margin-right:4px;vertical-align:-1px;"><polyline points="20 6 9 17 4 12"/></svg>Guardar Configuración</button>
                    </footer>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#btn-cerrar-config-gastos')?.addEventListener('click', () => this.cerrarModalConfigGastos());
            modal.querySelector('#btn-cancelar-config-gastos')?.addEventListener('click', () => this.cerrarModalConfigGastos());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.cerrarModalConfigGastos();
            });

            // Función reactiva de cálculo en vivo
            const recalcularPreview = () => {
                const esCasa = modal.querySelector('input[name="cfg-espacio"]:checked')?.value === 'casa';
                const arriendoVal = esCasa ? 0 : Math.max(0, parseInt(modal.querySelector('#cfg-input-arriendo')?.value) || 0);
                const recibosVal = Math.max(0, parseInt(modal.querySelector('#cfg-input-recibos')?.value) || 0);
                const trabVal = Math.max(0, parseInt(modal.querySelector('#cfg-input-trabajadores')?.value) || 0);
                const salVal = Math.max(0, parseInt(modal.querySelector('#cfg-input-salario')?.value) || 0);
                const lotesVal = Math.max(1, parseInt(modal.querySelector('#cfg-input-lotes-mes')?.value) || 100);

                const nominaTotal = trabVal * salVal;
                const fijosTotal = arriendoVal + recibosVal + nominaTotal;
                const cuotaMano = Math.round(nominaTotal / lotesVal);
                const cuotaTotal = Math.round(fijosTotal / lotesVal);

                const badgeNom = modal.querySelector('#cfg-badge-nomina');
                const dispMano = modal.querySelector('#cfg-disp-cuota-mano');
                const dispTotal = modal.querySelector('#cfg-disp-cuota-total');

                if (badgeNom) badgeNom.textContent = `${Store.fmt(nominaTotal)} nómina`;
                if (dispMano) dispMano.textContent = `${Store.fmt(cuotaMano)} / lote`;
                if (dispTotal) dispTotal.textContent = `${Store.fmt(cuotaTotal)} / lote`;
            };

            ['#cfg-input-arriendo', '#cfg-input-recibos', '#cfg-input-trabajadores', '#cfg-input-salario', '#cfg-input-lotes-mes'].forEach(sel => {
                const el = modal.querySelector(sel);
                el?.addEventListener('input', recalcularPreview);
                el?.addEventListener('change', recalcularPreview);
            });

            // Toggle casa vs local
            const radios = modal.querySelectorAll('input[name="cfg-espacio"]');
            radios.forEach(r => {
                r.addEventListener('change', () => {
                    const esCasa = modal.querySelector('input[name="cfg-espacio"]:checked')?.value === 'casa';
                    const wrapArriendo = modal.querySelector('#wrap-cfg-arriendo');
                    const inpArriendo = modal.querySelector('#cfg-input-arriendo');
                    if (wrapArriendo && inpArriendo) {
                        if (esCasa) {
                            wrapArriendo.style.opacity = '0.45';
                            wrapArriendo.style.pointerEvents = 'none';
                            inpArriendo.value = 0;
                        } else {
                            wrapArriendo.style.opacity = '1';
                            wrapArriendo.style.pointerEvents = 'auto';
                            if (parseInt(inpArriendo.value) === 0) inpArriendo.value = 1200000;
                        }
                    }
                    modal.querySelectorAll('.cfg-radio-card').forEach(c => c.classList.remove('activo'));
                    r.closest('.cfg-radio-card')?.classList.add('activo');
                    recalcularPreview();
                });
            });

            // Guardar configuración
            modal.querySelector('#btn-guardar-config-gastos')?.addEventListener('click', () => {
                const esCasa = modal.querySelector('input[name="cfg-espacio"]:checked')?.value === 'casa';
                const arriendoVal = esCasa ? 0 : Math.max(0, parseInt(modal.querySelector('#cfg-input-arriendo')?.value) || 0);
                const recibosVal = Math.max(0, parseInt(modal.querySelector('#cfg-input-recibos')?.value) || 0);
                const trabVal = Math.max(0, parseInt(modal.querySelector('#cfg-input-trabajadores')?.value) || 0);
                const salVal = Math.max(0, parseInt(modal.querySelector('#cfg-input-salario')?.value) || 0);
                const lotesVal = Math.max(1, parseInt(modal.querySelector('#cfg-input-lotes-mes')?.value) || 100);
                const modeloVal = modal.querySelector('#cfg-select-modelo')?.value || '2.5';

                this.guardarConfigGastos({
                    tipoUbicacion: esCasa ? 'casa' : 'local',
                    ubicacionDescripcion: esCasa ? 'Desde casa' : 'Local en arriendo',
                    arriendoMensual: arriendoVal,
                    recibosMensuales: recibosVal,
                    numTrabajadores: trabVal,
                    salarioTrabajador: salVal,
                    lotesMensualesEstimados: lotesVal,
                    modeloComercial: modeloVal
                });

                this.cerrarModalConfigGastos();
                this.toast(`Gastos fijos guardados. Cuota de nómina y operación lista para tus recetas.`);
            });
        }

        // Llenar valores actuales
        const esCasa = cfg.tipoUbicacion === 'casa' || cfg.arriendoMensual === 0;
        const radCasa = modal.querySelector('input[name="cfg-espacio"][value="casa"]');
        const radLocal = modal.querySelector('input[name="cfg-espacio"][value="local"]');
        modal.querySelectorAll('.cfg-radio-card').forEach(c => c.classList.remove('activo'));
        if (esCasa && radCasa) {
            radCasa.checked = true;
            radCasa.closest('.cfg-radio-card')?.classList.add('activo');
        } else if (radLocal) {
            radLocal.checked = true;
            radLocal.closest('.cfg-radio-card')?.classList.add('activo');
        }

        const wrapArriendo = modal.querySelector('#wrap-cfg-arriendo');
        const inpArriendo = modal.querySelector('#cfg-input-arriendo');
        if (inpArriendo) inpArriendo.value = cfg.arriendoMensual !== null ? cfg.arriendoMensual : (esCasa ? 0 : 1200000);
        if (wrapArriendo) {
            wrapArriendo.style.opacity = esCasa ? '0.45' : '1';
            wrapArriendo.style.pointerEvents = esCasa ? 'none' : 'auto';
        }

        const inpRecibos = modal.querySelector('#cfg-input-recibos');
        if (inpRecibos) inpRecibos.value = cfg.recibosMensuales !== null ? cfg.recibosMensuales : 180000;

        const inpTrab = modal.querySelector('#cfg-input-trabajadores');
        if (inpTrab) inpTrab.value = cfg.numTrabajadores !== undefined ? cfg.numTrabajadores : 1;

        const inpSalario = modal.querySelector('#cfg-input-salario');
        if (inpSalario) inpSalario.value = cfg.salarioTrabajador !== undefined ? cfg.salarioTrabajador : 1423500;

        const inpLotes = modal.querySelector('#cfg-input-lotes-mes');
        if (inpLotes) inpLotes.value = cfg.lotesMensualesEstimados || 100;

        const selModelo = modal.querySelector('#cfg-select-modelo');
        if (selModelo && cfg.modeloComercial) selModelo.value = cfg.modeloComercial;

        // Disparar recálculo inicial del preview
        const trabInit = Math.max(0, parseInt(inpTrab?.value) || 0);
        const salInit = Math.max(0, parseInt(inpSalario?.value) || 0);
        const lotesInit = Math.max(1, parseInt(inpLotes?.value) || 100);
        const arrInit = esCasa ? 0 : (parseInt(inpArriendo?.value) || 0);
        const recInit = parseInt(inpRecibos?.value) || 0;
        const nomInit = trabInit * salInit;
        const fijInit = arrInit + recInit + nomInit;

        const badgeNom = modal.querySelector('#cfg-badge-nomina');
        const dispMano = modal.querySelector('#cfg-disp-cuota-mano');
        const dispTotal = modal.querySelector('#cfg-disp-cuota-total');
        if (badgeNom) badgeNom.textContent = `${this.fmt(nomInit)} nómina`;
        if (dispMano) dispMano.textContent = `${this.fmt(Math.round(nomInit / lotesInit))} / lote`;
        if (dispTotal) dispTotal.textContent = `${this.fmt(Math.round(fijInit / lotesInit))} / lote`;

        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    cerrarModalConfigGastos() {
        const modal = document.getElementById('modal-config-gastos');
        if (modal) { modal.classList.remove('visible'); document.body.style.overflow = ''; }
    }

    async confirmarRestauracionDemo() {
        const ok = await this.confirmar({
            titulo: '¿Restaurar datos de demostración?',
            subtitulo: 'Esta acción reemplazará tus recetas e insumos actuales con los datos de ejemplo predeterminados.',
            badge: 'Restauración Demo',
            advertencia: 'Cualquier receta, insumo o ajuste que no hayas respaldado se reiniciará al catálogo de ejemplo.',
            btnConfirmarTexto: 'Sí, restaurar datos',
            btnCancelarTexto: 'Cancelar',
            tipo: 'alerta'
        });
        if (ok) await this.restaurarDatosDemo();
        return ok;
    }

    async restaurarDatosDemo() {
        if (this.tieneSesion) {
            try {
                const res = await fetch('../backend/api/demo.php', { method: 'POST' });
                if (res.ok) {
                    ['CLAVE_INSUMOS', 'CLAVE_PRODUCTOS', 'CLAVE_CONFIG_GASTOS'].forEach(k => localStorage.removeItem(this[k]));
                    this.toastDiferido('Datos de demostración restaurados en MySQL');
                    window.location.reload();
                    return;
                }
            } catch (_) {}
        }
        ['CLAVE_INSUMOS', 'CLAVE_PRODUCTOS', 'CLAVE_NEGOCIO', 'CLAVE_CONFIG_GASTOS'].forEach(k => localStorage.removeItem(this[k]));
        this.toastDiferido('Datos de demostración restaurados');
        window.location.reload();
    }

    async cerrarSesion() {
        try { await fetch('../backend/auth/logout.php', { method: 'POST' }); } catch (_) {}
        this.tieneSesion = false;
        this.usuario     = null;
        sessionStorage.clear();
        window.location.href = '../index.html';
    }

    /**
     * Portabilidad de Datos (Habeas Data Ley 1581 / GDPR):
     * Genera y descarga un archivo .json (costia-respaldo-[negocio]-[fecha].json)
     * con todos los insumos, productos y gastos fijos del usuario.
     */
    descargarCopiaSeguridadJSON() {
        try {
            const insumos = this.cargarInsumos();
            const productos = this.cargarProductos();
            const gastosFijos = this.obtenerConfigGastos();
            const negocio = this.obtenerNegocio() || 'negocio';
            const ahora = new Date();
            const fechaStr = ahora.toISOString().split('T')[0];
            const slug = String(negocio).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-') || 'negocio';
            const data = {
                aplicacion: 'Costia', version: '1.0', fecha_exportacion: ahora.toISOString(),
                negocio, gastos_fijos: gastosFijos,
                insumos: insumos.map(i => (typeof i.toJSON === 'function' ? i.toJSON() : i)),
                productos: productos.map(p => (typeof p.toJSON === 'function' ? p.toJSON() : p))
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `costia-respaldo-${slug}-${fechaStr}.json`;
            document.body.appendChild(a); a.click();
            setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 250);
            this.toast('Copia de seguridad descargada exitosamente.');
        } catch (e) {
            console.error('Error al generar copia de seguridad JSON:', e);
            this.toast('Error al descargar copia de seguridad.', 'error');
        }
    }

    /**
     * Derecho al Olvido (Habeas Data / GDPR):
     * Solicita confirmación y ejecuta la eliminación irreversible de la cuenta y datos del usuario.
     */
    async eliminarCuentaAsync() {
        const confirmar = await this.confirmar({
            badge: 'Derecho al Olvido (Habeas Data)',
            titulo: '¿Eliminar tu cuenta y recetas definitivamente?',
            subtitulo: 'Se borrarán de forma irreversible todos tus insumos, productos, recetas y gastos fijos de nuestros servidores.',
            advertencia: 'Esta acción no se puede deshacer conforme a la Ley 1581 de 2012 y GDPR.',
            btnConfirmarTexto: 'Sí, eliminar cuenta definitivamente',
            btnCancelarTexto: 'Cancelar', tipo: 'peligro'
        });
        if (!confirmar) return;
        try {
            const res = await fetch('../backend/api/eliminar-cuenta.php', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.status === 'success') {
                this.tieneSesion = false; this.usuario = null;
                ['CLAVE_INSUMOS', 'CLAVE_PRODUCTOS', 'CLAVE_NEGOCIO', 'CLAVE_CONFIG_GASTOS'].forEach(k => localStorage.removeItem(this[k]));
                sessionStorage.clear();
                this.toastDiferido(data.mensaje || 'Tu cuenta y recetas han sido eliminadas.');
                window.location.href = '../index.html';
            } else {
                this.toast(data.mensaje || 'No se pudo eliminar la cuenta.', 'error');
            }
        } catch (err) {
            this.toast('Error de conexión al eliminar la cuenta.', 'error');
        }
    }

    // ─── Métodos puente para cálculos y formateo ─────────────────

    fmt(n) { return UnidadConverter.formatearMoneda(n); }
    convertir(cantidad, desde, hacia) { return UnidadConverter.convertir(cantidad, desde, hacia); }

    calcularProducto(producto, insumos = null) {
        const listaInsumos = insumos || this.cargarInsumos();
        const prod = producto instanceof Producto ? producto : new Producto(producto);
        return {
            costoTotal: prod.calcularCostoTotal(listaInsumos),
            costoUnidad: prod.calcularCostoUnidad(listaInsumos),
            precioVenta: prod.calcularPrecioVenta(listaInsumos),
        };
    }

    detectarCambio(producto, insumos = null) {
        const listaInsumos = insumos || this.cargarInsumos();
        const prod = producto instanceof Producto ? producto : new Producto(producto);
        return prod.detectarCambioPrecio(listaInsumos);
    }

    _sellarInsumosSinAlertasPendientes(insumoIdsFiltro = null) {
        const insumos = this.cargarInsumos();
        const productos = this.cargarProductos();
        const idsPendientes = new Set();

        productos.forEach(p => {
            const c = typeof p.detectarCambioPrecio === 'function' ? p.detectarCambioPrecio(insumos) : null;
            if (c && (c.estado === 'sube' || c.estado === 'baja')) {
                (p.receta || []).forEach(r => idsPendientes.add(Number(r.insumoId)));
            }
        });

        const filtroSet = Array.isArray(insumoIdsFiltro)
            ? new Set(insumoIdsFiltro.map(Number))
            : null;

        let huboCambio = false;
        insumos.forEach(ins => {
            if (filtroSet && !filtroSet.has(Number(ins.id))) return;
            if (idsPendientes.has(Number(ins.id))) return;
            if (typeof ins.obtenerVariacion === 'function' && ins.obtenerVariacion() !== null) {
                ins.precioAnterior = ins.precio;
                huboCambio = true;
            }
        });

        if (huboCambio) {
            this.guardarInsumosLocal(insumos);
        }
    }

    sellarPrecios() {
        const insumos = this.cargarInsumos();
        const productos = this.cargarProductos();
        productos.forEach(p => { p.precioVentaAnterior = p.calcularPrecioVenta(insumos); });
        insumos.forEach(i => { i.precioAnterior = i.precio; });
        this.guardarProductosLocal(productos);
        this.guardarInsumosLocal(insumos);
        this.notificarActualizacion();
    }

    // ─── Notificaciones Toast ─────────────────────────────────────

    toast(mensaje, tipo = 'exito') {
        let contenedor = document.getElementById('toast-contenedor');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'toast-contenedor';
            contenedor.className = 'toast-container';
            contenedor.setAttribute('aria-live', 'polite');
            contenedor.setAttribute('aria-atomic', 'false');
            document.body.appendChild(contenedor);
        }
        const el = document.createElement('div');
        el.className = `toast toast--${tipo}`;
        el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
        const icono = tipo === 'error'
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
            : (tipo === 'info'
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>');
        el.innerHTML = `<span class="toast__icono" aria-hidden="true">${icono}</span><span>${mensaje}</span>`;
        contenedor.appendChild(el);
        setTimeout(() => {
            el.classList.add('toast--saliendo');
            setTimeout(() => el.remove(), 250);
        }, 3200);
    }

    toastDiferido(mensaje, tipo = 'exito') {
        sessionStorage.setItem(this.CLAVE_TOAST, JSON.stringify({ mensaje, tipo }));
    }

    confirmar({
        titulo = '¿Confirmar acción?',
        subtitulo = 'Esta acción no se puede deshacer.',
        badge = 'Atención',
        items = [],
        advertencia = '',
        btnConfirmarTexto = 'Confirmar',
        btnCancelarTexto = 'Cancelar',
        tipo = 'peligro'
    } = {}) {
        return new Promise((resolve) => {
            document.getElementById('costia-confirm-modal')?.remove();
            const backdrop = document.createElement('div');
            backdrop.id = 'costia-confirm-modal';
            backdrop.className = 'costia-confirm-backdrop';
            backdrop.setAttribute('role', 'alertdialog');
            backdrop.setAttribute('aria-modal', 'true');
            backdrop.setAttribute('aria-labelledby', 'costia-confirm-titulo');

            const listaHTML = items.length > 0 ? `<div class="costia-confirm-lista-wrap"><span class="costia-confirm-lista-label">Recetas que lo utilizan:</span><ul class="costia-confirm-lista">${items.map(it => `<li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${it}</span></li>`).join('')}</ul></div>` : '';
            const advertenciaHTML = advertencia ? `<div class="costia-confirm-aviso"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>${advertencia}</span></div>` : '';
            const iconoSVG = tipo === 'alerta'
                ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
                : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

            backdrop.innerHTML = `
                <div class="costia-confirm-card ${tipo === 'alerta' ? 'costia-confirm-card--alerta' : ''}">
                    <div class="costia-confirm-icono-wrap ${tipo === 'alerta' ? 'costia-confirm-icono-wrap--alerta' : ''}">${iconoSVG}</div>
                    <span class="costia-confirm-badge">${badge}</span>
                    <h2 id="costia-confirm-titulo" class="costia-confirm-titulo">${titulo}</h2>
                    <p class="costia-confirm-subtitulo">${subtitulo}</p>
                    ${listaHTML}${advertenciaHTML}
                    <div class="costia-confirm-acciones">
                        <button type="button" class="btn-confirm-cancelar" id="btn-conf-modal-cancelar">${btnCancelarTexto}</button>
                        <button type="button" class="btn-confirm-destructivo" id="btn-conf-modal-ok">${btnConfirmarTexto}</button>
                    </div>
                </div>`;

            document.body.appendChild(backdrop);
            requestAnimationFrame(() => { backdrop.classList.add('activo'); document.getElementById('btn-conf-modal-cancelar')?.focus(); });

            const cerrar = (resultado) => {
                backdrop.classList.remove('activo');
                setTimeout(() => { backdrop.remove(); resolve(resultado); }, 220);
            };

            document.getElementById('btn-conf-modal-ok')?.addEventListener('click', () => cerrar(true));
            document.getElementById('btn-conf-modal-cancelar')?.addEventListener('click', () => cerrar(false));
            backdrop.addEventListener('click', (e) => { if (e.target === backdrop) cerrar(false); });

            const manejarTeclado = (e) => {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', manejarTeclado);
                    cerrar(false);
                }
            };
            document.addEventListener('keydown', manejarTeclado);
        });
    }

    // ─── Identidad del Negocio en Header ───────────────────────────

    inicializarMenuNegocio(badgeEl) {
        const actualizarTexto = () => {
            const nombre = this.cargarNegocio();
            badgeEl.innerHTML = `<span class="app-header__negocio-texto">${StoreService.escapeHtml(nombre)}</span>`;
            badgeEl.setAttribute('title', 'Ir a Configuración del Negocio');
            badgeEl.style.cursor = 'pointer';
        };
        actualizarTexto();

        badgeEl.addEventListener('click', (e) => {
            e.preventDefault();
            const enPaginas = window.location.pathname.includes('/paginas/') || window.location.pathname.endsWith('.html');
            const destino = enPaginas ? 'configuracion.html' : 'paginas/configuracion.html';
            if (window.location.pathname.includes('configuracion.html')) {
                document.getElementById('seccion-identidad')?.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = destino;
            }
        });
    }
}

// Delegación global: abrir estación de configuración espaciosa
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#btn-header-config-gastos, #btn-config-gastos-asesor, [data-abrir-config-gastos]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    const enPaginas = window.location.pathname.includes('/paginas/') || window.location.pathname.endsWith('.html');
    const destino = enPaginas ? 'configuracion.html#seccion-gastos-fijos' : 'paginas/configuracion.html#seccion-gastos-fijos';
    if (window.location.pathname.includes('configuracion.html')) {
        document.getElementById('seccion-gastos-fijos')?.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.href = destino;
    }
});

// Instancia única (Singleton del Frontend)
window.Store = new StoreService();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar menú del header
    const badgeNegocio = document.querySelector('.app-header__negocio');
    if (badgeNegocio) {
        window.Store.inicializarMenuNegocio(badgeNegocio);
    }

    // 2. Verificar sesión con el servidor MySQL en segundo plano
    window.Store.verificarSesion();

    // 3. Toasts diferidos
    const pendiente = sessionStorage.getItem('costia_toast');
    if (pendiente) {
        sessionStorage.removeItem('costia_toast');
        try {
            const { mensaje, tipo } = JSON.parse(pendiente);
            setTimeout(() => window.Store.toast(mensaje, tipo), 120);
        } catch (_) {}
    }
});
