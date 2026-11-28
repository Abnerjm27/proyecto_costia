/**
 * ofertas-cierre.js — Controlador del panel de negocio para «Ofertas de Cierre»
 * Conecta las recetas costeadas en Costia con la vitrina pública (Portal de Contacto),
 * calculando el piso de costo unitario y validando la declaración sanitaria obligatoria.
 */

class OfertasCierreController {
    static CLAVE_OFERTAS = 'costia_ofertas_cierre';
    static CLAVE_PERFIL  = 'costia_vitrina_perfil';
    static CATEGORIAS_LABEL = {
        panaderia:  'Panadería',
        pasteleria: 'Pastelería',
        cafeteria:  'Cafetería',
        empacados:  'Empacados vigentes',
    };
    static FOTOS_SUGERIDAS = {
        pan:        '../assets/img/ofertas/pan-artesanal.png',
        croissant:  '../assets/img/ofertas/croissant.png',
        galleta:    '../assets/img/ofertas/galletas-avena.png',
        torta:      '../assets/img/ofertas/torta-chocolate.png',
        brownie:    '../assets/img/ofertas/torta-chocolate.png',
        panaderia:  '../assets/img/ofertas/pan-artesanal.png',
        pasteleria: '../assets/img/ofertas/torta-chocolate.png',
        cafeteria:  '../assets/img/ofertas/croissant.png',
        empacados:  '../assets/img/ofertas/galletas-avena.png',
    };

    constructor() {
        this.productos = [];
        this.insumos = [];
        this.ofertas = [];
        this.alergenosSeleccionados = new Set(['Gluten']);
        this.fotoPersonalizada = null;
        this.imagenActual = '../assets/img/ofertas/pan-artesanal.png';
        this.coordenadasLocal = null;
        this.timerInterval = null;
    }

    async iniciar() {
        this.cargarDatosCatalogo();
        this.poblarSelectorRecetas();
        this.cargarPerfilLocal();
        this.sincronizarChipsAlergenos();
        this.vincularEventos();

        if (typeof Store !== 'undefined' && typeof Store.verificarSesion === 'function') {
            await Store.verificarSesion();
            this.cargarDatosCatalogo();
            this.poblarSelectorRecetas();
        }

        await this.cargarOfertas();
        this.actualizarCalculoSugerido(true);
        this.renderizarTodo();

        this.timerInterval = setInterval(() => this.actualizarContadoresEnVivo(), 30000);
    }

    cargarDatosCatalogo() {
        this.insumos = typeof Store !== 'undefined' ? Store.cargarInsumos() : [];
        this.productos = typeof Store !== 'undefined' ? Store.cargarProductos() : [];
    }

    poblarSelectorRecetas() {
        const select = document.getElementById('oferta-receta');
        if (!select) return;

        if (!this.productos.length) {
            select.innerHTML = '<option value="">No hay recetas creadas aún</option>';
            return;
        }

        const valorPrevio = select.value;
        select.innerHTML = this.productos.map((prod) => {
            const nombreSeguro = Store.escapeHtml(prod.nombre);
            const precioReg = this.obtenerPrecioRegular(prod);
            return `<option value="${prod.id}">${nombreSeguro} (${Store.fmt(precioReg)})</option>`;
        }).join('');

        if (valorPrevio && this.productos.some((p) => String(p.id) === String(valorPrevio))) {
            select.value = valorPrevio;
        }
    }

    cargarPerfilLocal() {
        let perfil = {
            pais:         'Colombia',
            departamento: 'Bogotá D.C.',
            municipio:    'Bogotá',
            direccion:    'Cra 15 # 82-40, Chapinero',
            contacto:     '310 555 0192',
            horario:      'Hoy 18:00 - 20:00',
        };
        try {
            const raw = localStorage.getItem(OfertasCierreController.CLAVE_PERFIL);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    perfil = { ...perfil, ...parsed };
                }
            }
        } catch (_) {}

        const paisEl = document.getElementById('oferta-pais');
        const dirEl  = document.getElementById('oferta-direccion');
        const conEl  = document.getElementById('oferta-contacto');
        const horEl  = document.getElementById('oferta-horario');
        this.poblarSelectoresZona(perfil.pais, perfil.departamento, perfil.municipio);
        if (paisEl && !paisEl.value && perfil.pais) paisEl.value = perfil.pais;
        if (dirEl && !dirEl.value) dirEl.value = perfil.direccion;
        if (conEl && !conEl.value) conEl.value = perfil.contacto;
        if (horEl && !horEl.value) horEl.value = perfil.horario;
        if (typeof perfil.latitud === 'number' && typeof perfil.longitud === 'number') {
            this.coordenadasLocal = { latitud: perfil.latitud, longitud: perfil.longitud };
            this.actualizarEstadoGps(`GPS guardado (${perfil.latitud.toFixed(4)}, ${perfil.longitud.toFixed(4)})`);
        }
    }

    actualizarEstadoGps(texto) {
        const el = document.getElementById('oferta-gps-estado');
        if (el) el.textContent = texto;
    }

    fijarUbicacionLocal() {
        if (!navigator.geolocation) {
            this.actualizarEstadoGps('Tu navegador no soporta GPS; se usará la dirección escrita.');
            return;
        }
        this.actualizarEstadoGps('Obteniendo ubicación...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const latitud  = Math.round(pos.coords.latitude * 1e7) / 1e7;
                const longitud = Math.round(pos.coords.longitude * 1e7) / 1e7;
                this.coordenadasLocal = { latitud, longitud };
                this.actualizarEstadoGps(`GPS fijado (${latitud.toFixed(4)}, ${longitud.toFixed(4)})`);
                if (typeof Store !== 'undefined') {
                    Store.toast('Ubicación GPS del local fijada para «Cerca de mí».', 'exito');
                }
            },
            () => {
                this.actualizarEstadoGps('Sin permiso GPS; se usará tu dirección en Google Maps.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }

    guardarPerfilLocal(pais, departamento, municipio, direccion, contacto, horario) {
        try {
            localStorage.setItem(
                OfertasCierreController.CLAVE_PERFIL,
                JSON.stringify({
                    pais,
                    departamento,
                    municipio,
                    direccion,
                    contacto,
                    horario,
                    latitud:  this.coordenadasLocal?.latitud ?? null,
                    longitud: this.coordenadasLocal?.longitud ?? null,
                })
            );
        } catch (_) {}
    }

    obtenerProductoSeleccionado() {
        const select = document.getElementById('oferta-receta');
        if (!select) return null;
        const id = Number(select.value);
        return this.productos.find((p) => Number(p.id) === id) || null;
    }

    obtenerCostoUnitario(producto) {
        if (!producto) return 0;
        if (typeof producto.calcularCostoUnidad === 'function') {
            return Math.max(0, producto.calcularCostoUnidad(this.insumos));
        }
        return 0;
    }

    obtenerPrecioRegular(producto) {
        if (!producto) return 0;
        if (typeof producto.calcularPrecioVenta === 'function') {
            return Math.max(0, producto.calcularPrecioVenta(this.insumos));
        }
        return 0;
    }

    obtenerPrecioRegularConfirmado(producto) {
        const inputReg = document.getElementById('oferta-precio-regular');
        const val = inputReg ? Number(inputReg.value) : 0;
        if (!isNaN(val) && val > 0) return val;
        return this.obtenerPrecioRegular(producto);
    }

    calcularPrecioSugerido(producto, precioRegularOverride = null) {
        const costoUnidad = this.obtenerCostoUnitario(producto);
        const precioRegular = precioRegularOverride !== null ? precioRegularOverride : this.obtenerPrecioRegular(producto);
        if (precioRegular <= 0) return 0;

        const topeDescuento15 = Math.floor(precioRegular * 0.85);
        const pisoRentable = Math.ceil((costoUnidad * 1.15) / 100) * 100;
        const descuentoObjetivo = Math.round((precioRegular * 0.6) / 100) * 100;
        let sugerido = Math.max(pisoRentable, descuentoObjetivo);

        if (sugerido > topeDescuento15) {
            const paso50 = Math.floor(topeDescuento15 / 50) * 50;
            sugerido = paso50 >= 100 ? paso50 : topeDescuento15;
        }
        return Math.max(50, Math.min(topeDescuento15, sugerido));
    }

    actualizarCalculoSugerido(rellenarInput = false) {
        const prod = this.obtenerProductoSeleccionado();
        const elReg = document.getElementById('calc-precio-regular');
        const elCos = document.getElementById('calc-costo-unidad');
        const elSug = document.getElementById('calc-precio-sugerido');
        const inputRegular = document.getElementById('oferta-precio-regular');
        const inputPrecio = document.getElementById('oferta-precio');

        if (!prod) {
            if (elReg) elReg.textContent = '$0';
            if (elCos) elCos.textContent = '$0';
            if (elSug) elSug.textContent = '$0';
            return;
        }

        const precioReceta = this.obtenerPrecioRegular(prod);
        if (rellenarInput && inputRegular) {
            inputRegular.value = String(Math.round(precioReceta));
        }

        const precioRegular = this.obtenerPrecioRegularConfirmado(prod);
        const costoUnidad   = this.obtenerCostoUnitario(prod);
        const sugerido      = this.calcularPrecioSugerido(prod, precioRegular);

        if (elReg) elReg.textContent = Store.fmt(precioRegular);
        if (elCos) elCos.textContent = Store.fmt(costoUnidad);
        if (elSug) elSug.textContent = Store.fmt(sugerido);

        if (rellenarInput && inputPrecio) {
            inputPrecio.value = String(Math.round(sugerido));
        }

        // Autoseleccionar categoría amigable según nombre del producto
        const catSelect = document.getElementById('oferta-categoria');
        if (catSelect && rellenarInput) {
            const n = prod.nombre.toLowerCase();
            if (n.includes('torta') || n.includes('brownie') || n.includes('galleta')) {
                catSelect.value = 'pasteleria';
            } else if (n.includes('caf') || n.includes('capuchino') || n.includes('latte')) {
                catSelect.value = 'cafeteria';
            } else {
                catSelect.value = 'panaderia';
            }
        }

        if (!this.fotoPersonalizada) {
            if (prod.imagen) {
                this.actualizarPreviewFoto(prod.imagen, false);
            } else {
                const cat = catSelect ? catSelect.value : 'panaderia';
                this.actualizarPreviewFoto(this.obtenerFotoSugerida(prod.nombre, cat), false);
            }
        }

        this.evaluarFeedbackPrecio();
    }

    obtenerFotoSugerida(nombre, categoria) {
        const n = String(nombre || '').toLowerCase();
        if (n.includes('croissant')) return OfertasCierreController.FOTOS_SUGERIDAS.croissant;
        if (n.includes('galleta')) return OfertasCierreController.FOTOS_SUGERIDAS.galleta;
        if (n.includes('torta') || n.includes('brownie')) return OfertasCierreController.FOTOS_SUGERIDAS.torta;
        if (n.includes('pan')) return OfertasCierreController.FOTOS_SUGERIDAS.pan;
        return OfertasCierreController.FOTOS_SUGERIDAS[categoria] || '../assets/img/ofertas/pan-artesanal.png';
    }

    actualizarPreviewFoto(src, esPersonalizada) {
        const preview = document.getElementById('oferta-foto-preview');
        const estado  = document.getElementById('oferta-foto-estado');
        this.imagenActual = src;

        if (estado) {
            estado.textContent = esPersonalizada
                ? 'Fotografía propia optimizada para vitrina'
                : 'Foto editorial sugerida automáticamente';
        }

        if (!preview) return;
        if (preview.getAttribute('src') === src) return;

        preview.classList.add('is-updating');
        setTimeout(() => {
            preview.src = src;
            preview.classList.remove('is-updating');
        }, 120);
    }

    procesarArchivoFoto(file) {
        if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
            this.mostrarErrorFormulario('Selecciona una imagen JPG, PNG o WebP válida.');
            return;
        }
        this.mostrarErrorFormulario('');

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const maxW = 760;
                const scale = img.width > maxW ? maxW / img.width : 1;
                const w = Math.max(1, Math.round(img.width * scale));
                const h = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    this.fotoPersonalizada = dataUrl;
                    this.actualizarPreviewFoto(dataUrl, true);
                }
            };
            img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
    }

    evaluarFeedbackPrecio() {
        const prod = this.obtenerProductoSeleccionado();
        const feedback = document.getElementById('calc-feedback');
        const inputPrecio = document.getElementById('oferta-precio');
        if (!prod || !feedback || !inputPrecio) return;

        const precioRegular = this.obtenerPrecioRegularConfirmado(prod);
        const costoUnidad   = this.obtenerCostoUnitario(prod);
        const precioOferta  = Number(inputPrecio.value) || 0;

        feedback.className = 'calculo-feedback';

        if (precioRegular <= 0) {
            feedback.classList.add('calculo-feedback--error');
            feedback.textContent = 'Ingresa tu precio real vigente en mostrador.';
            return;
        }

        if (precioOferta <= 0) {
            feedback.classList.add('calculo-feedback--error');
            feedback.textContent = 'Ingresa un precio de cierre mayor a $0.';
            return;
        }

        if (precioOferta >= precioRegular) {
            feedback.classList.add('calculo-feedback--error');
            feedback.textContent = `El precio de cierre debe ser menor al precio de mostrador (${Store.fmt(precioRegular)}) para ser una oferta real.`;
            return;
        }

        const maximoPermitido = Math.round(precioRegular * 0.85 * 100) / 100;
        if (precioOferta > maximoPermitido) {
            feedback.classList.add('calculo-feedback--error');
            feedback.textContent = `Para evitar descuentos simulados (Art. 30 Ley 1480), la oferta requiere al menos 15% de descuento real (máximo ${Store.fmt(Math.floor(precioRegular * 0.85))}).`;
            return;
        }

        const ahorroPct = Math.round(((precioRegular - precioOferta) / precioRegular) * 100);

        if (precioOferta < costoUnidad) {
            const perdida = costoUnidad - precioOferta;
            feedback.classList.add('calculo-feedback--warn');
            feedback.textContent = `Por debajo de tu costo unitario (${Store.fmt(costoUnidad)}). Recuperas parte del insumo, pero asumes ${Store.fmt(perdida)}/u bajo el costo (${ahorroPct}% desc.).`;
            return;
        }

        const margenRec = precioOferta - costoUnidad;
        feedback.classList.add('calculo-feedback--ok');
        feedback.textContent = `Cubres el costo unitario y recuperas +${Store.fmt(margenRec)}/u sobre el piso de insumos (${ahorroPct}% de descuento para el comprador).`;
    }

    sincronizarChipsAlergenos() {
        document.querySelectorAll('#alergenos-group .alergeno-chip').forEach((chip) => {
            const nombre = chip.dataset.alergeno || '';
            const activo = this.alergenosSeleccionados.has(nombre);
            chip.classList.toggle('activo', activo);
            chip.setAttribute('aria-pressed', activo ? 'true' : 'false');
        });
    }

    actualizarEtiquetaDivision(pais) {
        const lbl = document.getElementById('label-oferta-departamento');
        if (!lbl || !window.CatalogoGeo) return;
        lbl.textContent = CatalogoGeo.etiquetaDivision(pais);
    }

    poblarSelectoresZona(paisInit, depInit, munInit) {
        if (!window.CatalogoGeo) return;
        const paisEl = document.getElementById('oferta-pais');
        const depEl  = document.getElementById('oferta-departamento');
        if (!paisEl || !depEl) return;

        const paises = CatalogoGeo.obtenerPaises();
        const pais = (paisInit && paises.includes(paisInit))
            ? paisInit
            : (paises.includes(paisEl.value) ? paisEl.value : (paises.includes('Colombia') ? 'Colombia' : (paises[0] || 'Otro')));

        paisEl.innerHTML = paises
            .map((p) => `<option value="${Store.escapeHtml(p)}">${Store.escapeHtml(p)}</option>`)
            .join('');
        paisEl.value = pais;
        this.actualizarEtiquetaDivision(pais);

        const deps = CatalogoGeo.obtenerDepartamentos(pais);
        const listaDeps = deps.length ? deps : ['General'];
        const dep = (depInit && listaDeps.includes(depInit))
            ? depInit
            : (pais === 'Colombia' && listaDeps.includes('Bogotá D.C.') ? 'Bogotá D.C.' : listaDeps[0]);

        depEl.innerHTML = listaDeps
            .map((d) => `<option value="${Store.escapeHtml(d)}">${Store.escapeHtml(d)}</option>`)
            .join('');
        depEl.value = dep;

        this.poblarMunicipiosSelect(pais, dep, munInit);
    }

    poblarMunicipiosSelect(pais, dep, munInit) {
        if (!window.CatalogoGeo) return;
        const munEl = document.getElementById('oferta-municipio');
        if (!munEl) return;

        const muns = CatalogoGeo.obtenerMunicipios(pais, dep);
        const listaMuns = muns.length ? muns : ['Otra ciudad'];
        const mun = (munInit && listaMuns.includes(munInit))
            ? munInit
            : (dep === 'Bogotá D.C.' && listaMuns.includes('Bogotá') ? 'Bogotá' : listaMuns[0]);

        munEl.innerHTML = listaMuns
            .map((m) => `<option value="${Store.escapeHtml(m)}">${Store.escapeHtml(m)}</option>`)
            .join('');
        munEl.value = mun;
    }

    vincularEventos() {
        document.getElementById('oferta-pais')?.addEventListener('change', (e) => {
            this.poblarSelectoresZona(e.target.value, null, null);
        });

        document.getElementById('oferta-departamento')?.addEventListener('change', (e) => {
            const pais = document.getElementById('oferta-pais')?.value || 'Colombia';
            this.poblarMunicipiosSelect(pais, e.target.value, null);
        });

        document.getElementById('oferta-receta')?.addEventListener('change', () => {
            this.actualizarCalculoSugerido(true);
        });

        document.getElementById('oferta-categoria')?.addEventListener('change', (e) => {
            if (!this.fotoPersonalizada) {
                const prod = this.obtenerProductoSeleccionado();
                this.actualizarPreviewFoto(this.obtenerFotoSugerida(prod?.nombre, e.target.value), false);
            }
        });

        const fotoInput = document.getElementById('oferta-foto-input');
        const uploadZone = document.getElementById('oferta-upload-zone');
        const fotoFrame = document.getElementById('oferta-foto-frame');

        document.getElementById('btn-cambiar-foto')?.addEventListener('click', () => fotoInput?.click());
        fotoFrame?.addEventListener('click', () => fotoInput?.click());
        fotoFrame?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fotoInput?.click();
            }
        });

        document.getElementById('btn-foto-sugerida')?.addEventListener('click', () => {
            this.fotoPersonalizada = null;
            if (fotoInput) fotoInput.value = '';
            const prod = this.obtenerProductoSeleccionado();
            const cat = document.getElementById('oferta-categoria')?.value || 'panaderia';
            this.actualizarPreviewFoto(this.obtenerFotoSugerida(prod?.nombre, cat), false);
        });

        fotoInput?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) this.procesarArchivoFoto(file);
        });

        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        uploadZone?.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            const file = e.dataTransfer?.files?.[0];
            if (file) this.procesarArchivoFoto(file);
        });

        document.getElementById('oferta-precio-regular')?.addEventListener('input', () => {
            this.actualizarCalculoSugerido(false);
        });

        document.getElementById('oferta-precio')?.addEventListener('input', () => {
            this.evaluarFeedbackPrecio();
        });

        document.getElementById('btn-ubicar-local')?.addEventListener('click', () => {
            this.fijarUbicacionLocal();
        });

        document.getElementById('btn-usar-sugerido')?.addEventListener('click', () => {
            const prod = this.obtenerProductoSeleccionado();
            if (!prod) return;
            const precioRegular = this.obtenerPrecioRegularConfirmado(prod);
            const sugerido = this.calcularPrecioSugerido(prod, precioRegular);
            const inputPrecio = document.getElementById('oferta-precio');
            if (inputPrecio) {
                inputPrecio.value = String(Math.round(sugerido));
                this.evaluarFeedbackPrecio();
            }
        });

        document.getElementById('alergenos-group')?.addEventListener('click', (e) => {
            const chip = e.target.closest('.alergeno-chip');
            if (!chip) return;
            const nombre = chip.dataset.alergeno;
            if (!nombre) return;
            if (this.alergenosSeleccionados.has(nombre)) {
                this.alergenosSeleccionados.delete(nombre);
            } else {
                this.alergenosSeleccionados.add(nombre);
            }
            this.sincronizarChipsAlergenos();
        });

        document.getElementById('form-publicar-oferta')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.publicarOferta();
        });

        document.getElementById('mis-ofertas-lista')?.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-oferta-accion]');
            if (!btn) return;
            const accion = btn.dataset.ofertaAccion;
            const id = Number(btn.dataset.id);
            if (!id) return;

            if (accion === 'descontar') {
                this.descontarUnidad(id);
            } else if (accion === 'retirar') {
                this.retirarOferta(id);
            }
        });
    }

    mostrarErrorFormulario(msg) {
        const box = document.getElementById('oferta-form-error');
        if (!box) return;
        if (!msg) {
            box.hidden = true;
            box.textContent = '';
        } else {
            box.hidden = false;
            box.textContent = msg;
        }
    }

    leerLocalOfertas() {
        try {
            const raw = localStorage.getItem(OfertasCierreController.CLAVE_OFERTAS);
            const arr = raw ? JSON.parse(raw) : [];
            return Array.isArray(arr) ? arr : [];
        } catch (_) {
            return [];
        }
    }

    guardarLocalOfertas(lista) {
        try {
            localStorage.setItem(OfertasCierreController.CLAVE_OFERTAS, JSON.stringify(lista));
        } catch (_) {}
    }

    async cargarOfertas() {
        if (typeof Store !== 'undefined' && Store.tieneSesion) {
            try {
                const res = await fetch('../backend/api/ofertas.php', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'success' && Array.isArray(data.ofertas)) {
                        this.ofertas = data.ofertas;
                        this.guardarLocalOfertas(this.ofertas);
                        return;
                    }
                }
            } catch (_) {}
        }

        this.ofertas = this.leerLocalOfertas();
    }

    async publicarOferta() {
        this.mostrarErrorFormulario('');

        const prod = this.obtenerProductoSeleccionado();
        if (!prod) {
            this.mostrarErrorFormulario('Crea o selecciona primero una receta en Costia para publicar un excedente.');
            return;
        }

        const declaracion = document.getElementById('oferta-declaracion')?.checked === true;
        if (!declaracion) {
            this.mostrarErrorFormulario('Debes marcar la declaración sanitaria obligatoria certificando que el alimento es 100% inocuo.');
            document.getElementById('oferta-declaracion')?.focus();
            return;
        }

        const categoria   = document.getElementById('oferta-categoria')?.value || 'panaderia';
        const unidades    = parseInt(document.getElementById('oferta-unidades')?.value || '0', 10);
        const precioOferta = Number(document.getElementById('oferta-precio')?.value || 0);
        const ttlHoras    = parseInt(document.getElementById('oferta-ttl')?.value || '4', 10);
        const horario     = (document.getElementById('oferta-horario')?.value || '').trim();
        const contacto    = (document.getElementById('oferta-contacto')?.value || '').trim();
        const pais        = (document.getElementById('oferta-pais')?.value || 'Colombia').trim();
        const departamento = (document.getElementById('oferta-departamento')?.value || '').trim();
        const municipio   = (document.getElementById('oferta-municipio')?.value || '').trim();
        const direccion   = (document.getElementById('oferta-direccion')?.value || '').trim();
        const nota        = (document.getElementById('oferta-nota-frescura')?.value || '').trim();

        const precioRegular = Math.round(this.obtenerPrecioRegularConfirmado(prod) * 100) / 100;
        const costoUnitario = Math.round(this.obtenerCostoUnitario(prod) * 100) / 100;

        if (isNaN(unidades) || unidades < 1 || unidades > 50) {
            this.mostrarErrorFormulario('Las unidades disponibles deben estar entre 1 y 50.');
            return;
        }

        if (isNaN(precioRegular) || precioRegular <= 0) {
            this.mostrarErrorFormulario('Ingresa un precio real en mostrador mayor a $0.');
            return;
        }

        if (isNaN(precioOferta) || precioOferta <= 0 || precioOferta >= precioRegular) {
            this.mostrarErrorFormulario(`El precio de cierre debe ser mayor a $0 y menor al precio regular (${Store.fmt(precioRegular)}).`);
            return;
        }

        if (precioOferta > Math.round(precioRegular * 0.85 * 100) / 100) {
            this.mostrarErrorFormulario('Para evitar descuentos engañosos (Art. 30, Ley 1480), el precio de cierre debe tener al menos 15% de descuento real sobre el precio en mostrador.');
            return;
        }

        if (!horario || !contacto || !departamento || !municipio || !direccion) {
            this.mostrarErrorFormulario('Completa departamento, municipio, dirección física, horario de recogida y teléfono/WhatsApp público.');
            return;
        }

        const negocioNombre = typeof Store !== 'undefined' ? Store.cargarNegocio() : 'Mi Negocio';
        const alergenosStr = Array.from(this.alergenosSeleccionados).join(', ');
        this.guardarPerfilLocal(pais, departamento, municipio, direccion, contacto, horario);

        const payload = {
            accion:                'crear',
            producto_id:           prod.id,
            negocio_nombre:        negocioNombre,
            producto_nombre:       prod.nombre,
            categoria,
            precio_regular:        precioRegular,
            costo_unitario:        costoUnitario,
            precio_oferta:         precioOferta,
            unidades_disponibles:  unidades,
            horario_recogida:      horario,
            pais,
            departamento,
            municipio,
            direccion_recogida:    direccion,
            contacto_publico:      contacto,
            alergenos:             alergenosStr,
            nota_frescura:         nota || 'Excedente del día · 100% apto para consumo.',
            imagen_url:            this.imagenActual,
            latitud:               this.coordenadasLocal?.latitud ?? null,
            longitud:              this.coordenadasLocal?.longitud ?? null,
            declaracion_sanitaria: true,
            ttl_horas:             ttlHoras,
        };

        if (typeof Store !== 'undefined' && Store.tieneSesion) {
            try {
                const res = await fetch('../backend/api/ofertas.php', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify(payload),
                });
                const data = await res.json();
                if (!res.ok || data.status !== 'success') {
                    this.mostrarErrorFormulario(data.mensaje || 'No se pudo publicar la oferta.');
                    return;
                }
                if (data.oferta) {
                    this.ofertas.unshift(data.oferta);
                    this.guardarLocalOfertas(this.ofertas);
                } else {
                    await this.cargarOfertas();
                }
            } catch (_) {
                this.mostrarErrorFormulario('Error de conexión con el servidor al publicar.');
                return;
            }
        } else {
            const ahora = Date.now();
            const expiraTs = ahora + ttlHoras * 3600 * 1000;
            const nuevaOferta = {
                id:                   ahora,
                producto_id:          prod.id,
                negocio_nombre:       negocioNombre,
                producto_nombre:      prod.nombre,
                categoria,
                precio_regular:       precioRegular,
                costo_unitario:       costoUnitario,
                precio_oferta:        precioOferta,
                unidades_disponibles: unidades,
                horario_recogida:     horario,
                pais,
                departamento,
                municipio,
                direccion_recogida:   direccion,
                contacto_publico:     contacto,
                alergenos:            alergenosStr,
                nota_frescura:        payload.nota_frescura,
                imagen_url:           this.imagenActual,
                latitud:              this.coordenadasLocal?.latitud ?? null,
                longitud:             this.coordenadasLocal?.longitud ?? null,
                expira_ts:            expiraTs,
                estado:               'activa',
                created_at:           new Date(ahora).toISOString(),
            };
            this.ofertas.unshift(nuevaOferta);
            this.guardarLocalOfertas(this.ofertas);
        }

        const chk = document.getElementById('oferta-declaracion');
        if (chk) chk.checked = false;

        this.renderizarTodo(true);
        if (typeof Store !== 'undefined') {
            Store.toast('Oferta de cierre publicada en la vitrina.', 'exito');
        }
    }

    async descontarUnidad(id) {
        const idx = this.ofertas.findIndex((o) => Number(o.id) === id);
        if (idx === -1) return;

        if (typeof Store !== 'undefined' && Store.tieneSesion) {
            try {
                const res = await fetch('../backend/api/ofertas.php', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ accion: 'descontar_unidad', id }),
                });
                const data = await res.json();
                if (!res.ok || data.status !== 'success') {
                    Store.toast(data.mensaje || 'No se pudo actualizar el stock.', 'error');
                    return;
                }
                this.ofertas[idx].unidades_disponibles = data.unidades_disponibles;
                this.ofertas[idx].estado = data.estado;
            } catch (_) {
                Store.toast('Error de conexión al descontar unidad.', 'error');
                return;
            }
        } else {
            const actual = Math.max(0, Number(this.ofertas[idx].unidades_disponibles) - 1);
            this.ofertas[idx].unidades_disponibles = actual;
            if (actual === 0) {
                this.ofertas[idx].estado = 'agotada';
            }
        }

        this.guardarLocalOfertas(this.ofertas);
        this.renderizarTodo(true);
        if (typeof Store !== 'undefined') {
            Store.toast('Unidad descontada de la vitrina.', 'info');
        }
    }

    async retirarOferta(id) {
        const idx = this.ofertas.findIndex((o) => Number(o.id) === id);
        if (idx === -1) return;

        if (typeof Store !== 'undefined' && Store.tieneSesion) {
            try {
                const res = await fetch('../backend/api/ofertas.php', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ accion: 'retirar', id }),
                });
                const data = await res.json();
                if (!res.ok || data.status !== 'success') {
                    Store.toast(data.mensaje || 'No se pudo retirar la oferta.', 'error');
                    return;
                }
            } catch (_) {
                Store.toast('Error de conexión al retirar oferta.', 'error');
                return;
            }
        }

        this.ofertas[idx].estado = 'retirada';
        this.guardarLocalOfertas(this.ofertas);
        this.renderizarTodo();
        if (typeof Store !== 'undefined') {
            Store.toast('Oferta retirada de la vitrina pública.', 'info');
        }
    }

    obtenerEstadoEfectivo(oferta) {
        if (oferta.estado !== 'activa') return oferta.estado;
        if (Number(oferta.unidades_disponibles) <= 0) return 'agotada';
        const expTs = Number(oferta.expira_ts || 0);
        if (expTs > 0 && expTs <= Date.now()) return 'expirada';
        return 'activa';
    }

    formatearRestante(oferta) {
        const expTs = Number(oferta.expira_ts || 0);
        const diffMs = Math.max(0, expTs - Date.now());
        if (diffMs <= 0) return 'Expirada';
        const mins = Math.ceil(diffMs / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
    }

    _animarKpi(el) {
        if (!el) return;
        el.classList.remove('kpi-bump');
        void el.offsetWidth;
        el.classList.add('kpi-bump');
    }

    renderizarKPIs(animar = false) {
        const activas = this.ofertas.filter((o) => this.obtenerEstadoEfectivo(o) === 'activa');
        const unidadesTot = activas.reduce((acc, o) => acc + Number(o.unidades_disponibles || 0), 0);
        const capitalRec = activas.reduce(
            (acc, o) => acc + Number(o.precio_oferta || 0) * Number(o.unidades_disponibles || 0),
            0
        );

        const elAct = document.getElementById('kpi-ofertas-activas');
        const elCap = document.getElementById('kpi-capital-recuperable');
        const elUni = document.getElementById('kpi-unidades-vitrina');

        if (elAct) elAct.textContent = `${activas.length} ${activas.length === 1 ? 'activa' : 'activas'}`;
        if (elCap) elCap.textContent = Store.fmt(capitalRec);
        if (elUni) elUni.textContent = `${unidadesTot} ${unidadesTot === 1 ? 'unidad' : 'unidades'}`;

        if (animar) {
            this._animarKpi(elAct);
            this._animarKpi(elCap);
            this._animarKpi(elUni);
        }
    }

    renderizarListaOfertas() {
        const cont = document.getElementById('mis-ofertas-lista');
        if (!cont) return;

        if (!this.ofertas.length) {
            cont.innerHTML = `
                <div class="oferta-empty-state">
                    <h3>Aún no has publicado excedentes hoy</h3>
                    <p>Elige una receta a la izquierda para calcular su precio mínimo de cierre y mostrarla en la vitrina pública.</p>
                </div>
            `;
            return;
        }

        cont.innerHTML = this.ofertas.map((oferta) => {
            const estado = this.obtenerEstadoEfectivo(oferta);
            const esActiva = estado === 'activa';
            const catLabel = OfertasCierreController.CATEGORIAS_LABEL[oferta.categoria] || 'Excedente';
            const recuperacionTotal = Number(oferta.precio_oferta || 0) * Number(oferta.unidades_disponibles || 0);
            const restante = esActiva ? this.formatearRestante(oferta) : estado.toUpperCase();
            const thumbSrc = oferta.imagen_url || this.obtenerFotoSugerida(oferta.producto_nombre, oferta.categoria);

            const badgeClass = estado === 'activa'
                ? 'estado-pill--activa'
                : (estado === 'reportada' ? 'estado-pill--reportada' : (estado === 'agotada' ? 'estado-pill--agotada' : 'estado-pill--retirada'));

            const etiquetaEstado = estado === 'activa'
                ? 'Activa'
                : (estado === 'agotada' ? 'Agotada' : (estado === 'reportada' ? 'En revisión' : (estado === 'expirada' ? 'Expirada' : 'Retirada')));

            return `
                <article class="mi-oferta-card${esActiva ? '' : ' mi-oferta-card--inactiva'}" data-oferta-id="${oferta.id}">
                    <div class="mi-oferta-top">
                        <div class="mi-oferta-identidad">
                            <img class="mi-oferta-thumb" src="${Store.escapeHtml(thumbSrc)}" alt="${Store.escapeHtml(oferta.producto_nombre)}" loading="lazy">
                            <div>
                                <h3 class="mi-oferta-titulo">${Store.escapeHtml(oferta.producto_nombre)}</h3>
                                <p class="mi-oferta-meta">${Store.escapeHtml(catLabel)} · ${Store.escapeHtml(oferta.horario_recogida)}</p>
                            </div>
                        </div>
                        <span class="estado-pill ${badgeClass}">${etiquetaEstado}</span>
                    </div>

                    <div class="mi-oferta-metricas">
                        <div class="mi-oferta-metrica">
                            <span>Precio cierre</span>
                            <strong>${Store.fmt(oferta.precio_oferta)}</strong>
                        </div>
                        <div class="mi-oferta-metrica">
                            <span>Disponibles</span>
                            <strong>${Number(oferta.unidades_disponibles)} u.</strong>
                        </div>
                        <div class="mi-oferta-metrica">
                            <span>Vigencia</span>
                            <strong class="js-oferta-timer" data-expira-ts="${Number(oferta.expira_ts || 0)}">${Store.escapeHtml(restante)}</strong>
                        </div>
                    </div>

                    <div class="mi-oferta-acciones">
                        <span class="mi-oferta-meta">Recuperación restante: <strong class="tabular-nums">${Store.fmt(recuperacionTotal)}</strong></span>
                        ${esActiva ? `
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <button type="button" class="btn-oferta-accion" data-oferta-accion="descontar" data-id="${oferta.id}">
                                    −1 vendida
                                </button>
                                <button type="button" class="btn-oferta-accion btn-oferta-accion--peligro" data-oferta-accion="retirar" data-id="${oferta.id}">
                                    Retirar
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </article>
            `;
        }).join('');
    }

    actualizarContadoresEnVivo() {
        let requiereReRender = false;
        this.ofertas.forEach((o) => {
            if (o.estado === 'activa' && Number(o.expira_ts || 0) <= Date.now()) {
                requiereReRender = true;
            }
        });
        if (requiereReRender) {
            this.renderizarTodo();
            return;
        }

        document.querySelectorAll('.js-oferta-timer').forEach((el) => {
            const ts = Number(el.dataset.expiraTs || 0);
            if (!ts) return;
            const diff = Math.max(0, ts - Date.now());
            const mins = Math.ceil(diff / 60000);
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            el.textContent = diff <= 0 ? 'Expirada' : (h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`);
        });
    }

    renderizarTodo(animarKpi = false) {
        this.renderizarKPIs(animarKpi);
        this.renderizarListaOfertas();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const ctrl = new OfertasCierreController();
    ctrl.iniciar();
    window.ofertasCierreCtrl = ctrl;
});
