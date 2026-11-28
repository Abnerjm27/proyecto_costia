/**
 * vitrina.js — Controlador público de la Vitrina de «Ofertas de Cierre»
 * Portal de Contacto (Art. 53, Ley 1480 de 2011):
 * - Nunca solicita ni expone costos unitarios ni datos privados de recetas.
 * - Filtra en tiempo real ofertas expiradas, agotadas, retiradas o reportadas.
 * - Habilita reporte sanitario con baja preventiva inmediata.
 */

class VitrinaPublicaController {
    static CLAVE_OFERTAS = 'costia_ofertas_cierre';
    static RADIO_MAX_KM  = 15;
    static CATEGORIAS_LABEL = {
        panaderia:  'Panadería',
        pasteleria: 'Pastelería',
        cafeteria:  'Cafetería',
        empacados:  'Empacados vigentes',
    };
    static FOTOS_FALLBACK = {
        panaderia:  '../assets/img/ofertas/pan-artesanal.png',
        pasteleria: '../assets/img/ofertas/torta-chocolate.png',
        cafeteria:  '../assets/img/ofertas/croissant.png',
        empacados:  '../assets/img/ofertas/galletas-avena.png',
    };

    constructor() {
        this.ofertas = [];
        this.categoriaActual = 'todas';
        this.paisActual = 'todos';
        this.departamentoActual = 'todos';
        this.municipioActual = 'todos';
        this.busquedaActual = '';
        this.ordenCercaDeMi = false;
        this.ubicacionUsuario = null;
        this.ultimoFoco = null;
        this.timerInterval = null;
    }

    async iniciar() {
        this.vincularEventos();
        await this.cargarOfertasPublicas();
        this.renderizarGrid();
        this.timerInterval = setInterval(() => this.actualizarContadores(), 30000);
    }

    crearDemosIniciales() {
        const ahora = Date.now();
        return [
            {
                id:                   1001,
                negocio_nombre:       'Panadería El Roble',
                producto_nombre:      'Pan artesanal',
                categoria:            'panaderia',
                precio_regular:       1200,
                precio_oferta:        700,
                unidades_disponibles: 8,
                horario_recogida:     'Hoy 18:00 - 20:00',
                pais:                 'Colombia',
                departamento:         'Bogotá D.C.',
                municipio:            'Bogotá',
                direccion_recogida:   'Cra 15 # 82-40, Chapinero',
                contacto_publico:     '310 555 0192',
                alergenos:            'Gluten, Lácteos',
                nota_frescura:        'Horneado esta mañana · Corteza firme, 100% apto para consumo.',
                imagen_url:           '../assets/img/ofertas/pan-artesanal.png',
                latitud:              4.6682,
                longitud:             -74.0544,
                expira_ts:            ahora + 3 * 3600 * 1000,
                estado:               'activa',
            },
            {
                id:                   1002,
                negocio_nombre:       'Panadería El Roble',
                producto_nombre:      'Croissant de mantequilla',
                categoria:            'panaderia',
                precio_regular:       2400,
                precio_oferta:        1400,
                unidades_disponibles: 5,
                horario_recogida:     'Hoy 18:30 - 20:30',
                pais:                 'Colombia',
                departamento:         'Bogotá D.C.',
                municipio:            'Bogotá',
                direccion_recogida:   'Cra 15 # 82-40, Chapinero',
                contacto_publico:     '310 555 0192',
                alergenos:            'Gluten, Lácteos, Huevo',
                nota_frescura:        'Lote de media tarde · Excedente de vitrina en perfecto estado.',
                imagen_url:           '../assets/img/ofertas/croissant.png',
                latitud:              4.6682,
                longitud:             -74.0544,
                expira_ts:            ahora + 4 * 3600 * 1000,
                estado:               'activa',
            },
            {
                id:                   1003,
                negocio_nombre:       'Café & Obrador La Miga',
                producto_nombre:      'Galletas de avena',
                categoria:            'pasteleria',
                precio_regular:       1000,
                precio_oferta:        600,
                unidades_disponibles: 12,
                horario_recogida:     'Hoy 17:30 - 19:30',
                pais:                 'Colombia',
                departamento:         'Bogotá D.C.',
                municipio:            'Bogotá',
                direccion_recogida:   'Cl 45 # 19-22, Teusaquillo',
                contacto_publico:     '315 555 0418',
                alergenos:            'Gluten, Huevo',
                nota_frescura:        'Empacadas hoy en bolsa sellada · Excedente de cierre.',
                imagen_url:           '../assets/img/ofertas/galletas-avena.png',
                latitud:              4.6331,
                longitud:             -74.0728,
                expira_ts:            ahora + 2 * 3600 * 1000,
                estado:               'activa',
            },
        ];
    }

    resolverImagenPublica(rawUrl, nombre, categoria) {
        const valor = String(rawUrl || '').trim();
        if (/^\.\.\/assets\/img\/ofertas\/[a-zA-Z0-9._-]+\.(png|jpe?g|webp)$/.test(valor)) {
            return valor;
        }
        if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(valor)) {
            return valor;
        }
        const n = String(nombre || '').toLowerCase();
        if (n.includes('croissant')) return '../assets/img/ofertas/croissant.png';
        if (n.includes('galleta')) return '../assets/img/ofertas/galletas-avena.png';
        if (n.includes('torta') || n.includes('brownie')) return '../assets/img/ofertas/torta-chocolate.png';
        if (n.includes('pan')) return '../assets/img/ofertas/pan-artesanal.png';
        return VitrinaPublicaController.FOTOS_FALLBACK[categoria] || '../assets/img/ofertas/pan-artesanal.png';
    }

    sanitizarPublica(raw) {
        // Garantiza que nunca se conserve ni renderice costo_unitario ni usuario_id
        const nombre    = String(raw.producto_nombre || 'Excedente del día');
        const categoria = String(raw.categoria || 'panaderia');
        return {
            id:                   Number(raw.id),
            negocio_nombre:       String(raw.negocio_nombre || 'Comercio verificado'),
            producto_nombre:      nombre,
            categoria,
            precio_regular:       Number(raw.precio_regular || 0),
            precio_oferta:        Number(raw.precio_oferta || 0),
            unidades_disponibles: Number(raw.unidades_disponibles || 0),
            horario_recogida:     String(raw.horario_recogida || ''),
            pais:                 String(raw.pais || 'Colombia').trim() || 'Colombia',
            departamento:         String(raw.departamento || 'Bogotá D.C.').trim() || 'Bogotá D.C.',
            municipio:            String(raw.municipio || 'Bogotá').trim() || 'Bogotá',
            direccion_recogida:   String(raw.direccion_recogida || ''),
            contacto_publico:     String(raw.contacto_publico || ''),
            alergenos:            String(raw.alergenos || ''),
            nota_frescura:        String(raw.nota_frescura || ''),
            imagen_url:           this.resolverImagenPublica(raw.imagen_url, nombre, categoria),
            latitud:              raw.latitud !== null && raw.latitud !== undefined && raw.latitud !== '' && isFinite(Number(raw.latitud)) ? Number(raw.latitud) : null,
            longitud:             raw.longitud !== null && raw.longitud !== undefined && raw.longitud !== '' && isFinite(Number(raw.longitud)) ? Number(raw.longitud) : null,
            expira_ts:            Number(raw.expira_ts || 0),
            estado:               String(raw.estado || 'activa'),
        };
    }

    calcularDistanciaKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const toRad = (g) => (g * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    formatearDistancia(km) {
        if (km === null || km === undefined || !isFinite(km)) return '';
        if (km < 1) {
            return `A ${Math.max(10, Math.round(km * 1000))} m`;
        }
        return `A ${km.toFixed(1).replace('.', ',')} km`;
    }

    construirQueryMapa(oferta) {
        if (oferta.latitud !== null && oferta.longitud !== null) {
            return `${oferta.latitud},${oferta.longitud}`;
        }
        return `${oferta.negocio_nombre} ${oferta.direccion_recogida} ${oferta.municipio} ${oferta.departamento} ${oferta.pais}`.trim();
    }

    construirUrlMaps(oferta) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.construirQueryMapa(oferta))}`;
    }

    construirUrlEmbedMapa(oferta) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(this.construirQueryMapa(oferta))}&z=16&output=embed`;
    }

    alternarCercaDeMi() {
        const btn = document.getElementById('btn-cerca-de-mi');
        if (this.ordenCercaDeMi) {
            this.ordenCercaDeMi = false;
            if (btn) {
                btn.classList.remove('activo');
                btn.setAttribute('aria-pressed', 'false');
            }
            this.renderizarGrid();
            return;
        }

        if (!navigator.geolocation) {
            if (typeof Store !== 'undefined') {
                Store.toast('Tu navegador no soporta geolocalización para «Cerca de mí».', 'info');
            }
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.ubicacionUsuario = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                this.ordenCercaDeMi = true;
                if (btn) {
                    btn.classList.add('activo');
                    btn.setAttribute('aria-pressed', 'true');
                }
                this.renderizarGrid();
            },
            () => {
                if (typeof Store !== 'undefined') {
                    Store.toast('Activa el permiso de ubicación en tu navegador para ordenar por cercanía.', 'info');
                }
            },
            { enableHighAccuracy: false, timeout: 8000 }
        );
    }

    leerLocalRaw() {
        return localStorage.getItem(VitrinaPublicaController.CLAVE_OFERTAS);
    }

    leerLocalLista() {
        try {
            const raw = this.leerLocalRaw();
            if (!raw) return [];
            const arr = JSON.parse(raw);
            return Array.isArray(arr) ? arr.map((item) => this.sanitizarPublica(item)) : [];
        } catch (_) {
            return [];
        }
    }

    async cargarOfertasPublicas() {
        let remotas = [];
        try {
            const res = await fetch('../backend/api/ofertas.php?public=1', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && Array.isArray(data.ofertas)) {
                    remotas = data.ofertas.map((item) => this.sanitizarPublica(item));
                }
            }
        } catch (_) {}

        const rawLocal = this.leerLocalRaw();
        const locales  = this.leerLocalLista();

        if (remotas.length > 0 && locales.length > 0) {
            const porId = new Map();
            locales.forEach((o) => porId.set(o.id, o));
            remotas.forEach((o) => porId.set(o.id, o));
            this.ofertas = Array.from(porId.values());
            return;
        }

        if (remotas.length > 0) {
            this.ofertas = remotas;
            return;
        }

        if (rawLocal !== null) {
            this.ofertas = locales;
            return;
        }

        // Primera visita sin ofertas previas: sembrar ejemplos demo para vitrina comprensible
        const demos = this.crearDemosIniciales();
        this.ofertas = demos;
        try {
            localStorage.setItem(VitrinaPublicaController.CLAVE_OFERTAS, JSON.stringify(demos));
        } catch (_) {}
    }

    poblarSelectoresZona() {
        const selPais = document.getElementById('vitrina-pais');
        const selDep  = document.getElementById('vitrina-departamento');
        const selMun  = document.getElementById('vitrina-municipio');
        const lblDep  = document.getElementById('label-vitrina-departamento');
        if (!selPais || !selDep || !selMun) return;

        const ahora = Date.now();
        const activas = this.ofertas.filter((o) =>
            o.estado === 'activa' &&
            o.unidades_disponibles > 0 &&
            !(o.expira_ts > 0 && o.expira_ts <= ahora)
        );
        const collator = new Intl.Collator('es', { sensitivity: 'base' });
        const geo = window.CatalogoGeo;

        const paisesCatalogo = geo ? geo.obtenerPaises() : [];
        const paises = Array.from(new Set([
            ...paisesCatalogo,
            ...activas.map((o) => o.pais).filter(Boolean)
        ])).sort((a, b) => {
            if (a === 'Otro') return 1;
            if (b === 'Otro') return -1;
            return collator.compare(a, b);
        });
        if (this.paisActual !== 'todos' && !paises.includes(this.paisActual)) {
            this.paisActual = 'todos';
        }
        selPais.innerHTML = `<option value="todos">Todos los países</option>` +
            paises.map((p) => `<option value="${Store.escapeHtml(p)}">${Store.escapeHtml(p)}</option>`).join('');
        selPais.value = this.paisActual;

        const etiqDep = geo ? geo.etiquetaDivision(this.paisActual) : 'Departamento / Estado';
        if (lblDep) {
            lblDep.textContent = etiqDep;
        }
        const todosDepTxt = etiqDep === 'Estado'
            ? 'Todos los estados'
            : (etiqDep === 'Provincia'
                ? 'Todas las provincias'
                : (etiqDep === 'Región' ? 'Todas las regiones' : 'Todos los departamentos'));

        const porPais = this.paisActual === 'todos'
            ? activas
            : activas.filter((o) => o.pais === this.paisActual);

        const depsCatalogo = geo ? geo.obtenerDepartamentos(this.paisActual) : [];
        const deps = Array.from(new Set([
            ...depsCatalogo,
            ...porPais.map((o) => o.departamento).filter(Boolean)
        ])).sort(collator.compare);
        if (this.departamentoActual !== 'todos' && !deps.includes(this.departamentoActual)) {
            this.departamentoActual = 'todos';
        }
        selDep.innerHTML = `<option value="todos">${Store.escapeHtml(todosDepTxt)}</option>` +
            deps.map((d) => `<option value="${Store.escapeHtml(d)}">${Store.escapeHtml(d)}</option>`).join('');
        selDep.value = this.departamentoActual;

        const porDep = this.departamentoActual === 'todos'
            ? porPais
            : porPais.filter((o) => o.departamento === this.departamentoActual);

        const munsCatalogo = (geo && this.departamentoActual !== 'todos')
            ? geo.obtenerMunicipios(this.paisActual, this.departamentoActual)
            : [];
        const muns = Array.from(new Set([
            ...munsCatalogo,
            ...porDep.map((o) => o.municipio).filter(Boolean)
        ])).sort(collator.compare);
        if (this.municipioActual !== 'todos' && !muns.includes(this.municipioActual)) {
            this.municipioActual = 'todos';
        }
        selMun.innerHTML = `<option value="todos">Todos los municipios</option>` +
            muns.map((m) => `<option value="${Store.escapeHtml(m)}">${Store.escapeHtml(m)}</option>`).join('');
        selMun.value = this.municipioActual;
    }

    obtenerOfertasVigentes() {
        const ahora = Date.now();
        const filtradas = this.ofertas.filter((o) => {
            if (o.estado !== 'activa') return false;
            if (o.unidades_disponibles <= 0) return false;
            if (o.expira_ts > 0 && o.expira_ts <= ahora) return false;

            if (this.categoriaActual !== 'todas' && o.categoria !== this.categoriaActual) {
                return false;
            }
            if (this.paisActual !== 'todos' && o.pais !== this.paisActual) {
                return false;
            }
            if (this.departamentoActual !== 'todos' && o.departamento !== this.departamentoActual) {
                return false;
            }
            if (this.municipioActual !== 'todos' && o.municipio !== this.municipioActual) {
                return false;
            }

            if (this.busquedaActual) {
                const texto = `${o.producto_nombre} ${o.negocio_nombre} ${o.direccion_recogida} ${o.municipio} ${o.departamento} ${o.pais}`.toLowerCase();
                if (!texto.includes(this.busquedaActual)) return false;
            }

            return true;
        });

        if (this.ordenCercaDeMi && this.ubicacionUsuario) {
            return filtradas
                .map((o) => {
                    const distKm = (o.latitud !== null && o.longitud !== null)
                        ? this.calcularDistanciaKm(this.ubicacionUsuario.lat, this.ubicacionUsuario.lng, o.latitud, o.longitud)
                        : null;
                    return { ...o, _distanciaKm: distKm };
                })
                .filter((o) => o._distanciaKm !== null && o._distanciaKm <= VitrinaPublicaController.RADIO_MAX_KM)
                .sort((a, b) => a._distanciaKm - b._distanciaKm);
        }

        return filtradas;
    }

    formatearRestante(expTs) {
        const diff = Math.max(0, Number(expTs || 0) - Date.now());
        if (diff <= 0) return 'Expirada';
        const mins = Math.ceil(diff / 60000);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
    }

    renderizarGrid() {
        const grid = document.getElementById('vitrina-grid');
        if (!grid) return;

        this.poblarSelectoresZona();
        const vigentes = this.obtenerOfertasVigentes();
        if (!vigentes.length) {
            if (this.ordenCercaDeMi) {
                grid.innerHTML = `
                    <div class="oferta-empty-state" style="grid-column: 1 / -1;">
                        <h3>No hay ofertas de cierre a menos de ${VitrinaPublicaController.RADIO_MAX_KM} km de tu ubicación</h3>
                        <p>Para que puedas llegar antes del cierre sin cruzar a otro municipio o país lejano, solo mostramos excedentes cercanos.</p>
                        <button type="button" class="btn-secundario" id="btn-ver-todas-zonas">Ver todas las zonas</button>
                    </div>
                `;
            } else {
                const partesZona = [];
                if (this.municipioActual !== 'todos') partesZona.push(this.municipioActual);
                if (this.departamentoActual !== 'todos') partesZona.push(this.departamentoActual);
                if (this.paisActual !== 'todos' && this.municipioActual === 'todos') partesZona.push(this.paisActual);
                const tituloVacio = partesZona.length
                    ? `No hay ofertas de cierre activas en ${partesZona.join(', ')}`
                    : 'No hay ofertas de cierre activas con ese filtro';
                grid.innerHTML = `
                    <div class="oferta-empty-state" style="grid-column: 1 / -1;">
                        <h3>${Store.escapeHtml(tituloVacio)}</h3>
                        <p>Las ofertas aparecen cuando los negocios publican excedentes del día en tu país, departamento y municipio.</p>
                        <button type="button" class="btn-secundario" id="btn-ver-todas-zonas">Ver todas las zonas</button>
                    </div>
                `;
            }
            return;
        }

        grid.innerHTML = vigentes.map((oferta, index) => {
            const catLabel = VitrinaPublicaController.CATEGORIAS_LABEL[oferta.categoria] || 'Excedente';
            const ahorroPct = oferta.precio_regular > 0
                ? Math.max(1, Math.round(((oferta.precio_regular - oferta.precio_oferta) / oferta.precio_regular) * 100))
                : 0;
            const alergenos = oferta.alergenos
                ? oferta.alergenos.split(',').map((a) => a.trim()).filter(Boolean)
                : [];
            const alergenosHtml = alergenos.length
                ? `<div class="vitrina-alergenos-lista">${alergenos.map((a) => `<span class="vitrina-alergeno-tag">${Store.escapeHtml(a)}</span>`).join('')}</div>`
                : `<div class="vitrina-alergenos-lista"><span class="vitrina-alergeno-tag">Sin alérgenos marcados</span></div>`;
            const imgSrc = this.resolverImagenPublica(oferta.imagen_url, oferta.producto_nombre, oferta.categoria);
            const distTexto = (this.ordenCercaDeMi && oferta._distanciaKm !== null && oferta._distanciaKm !== undefined)
                ? this.formatearDistancia(oferta._distanciaKm)
                : '';
            const distHtml = distTexto
                ? `<span class="vitrina-distancia-pill">${Store.escapeHtml(distTexto)}</span>`
                : '';
            const mapsUrl = this.construirUrlMaps(oferta);

            return `
                <article class="vitrina-card" style="--card-index:${index}" data-oferta-id="${oferta.id}" data-categoria="${Store.escapeHtml(oferta.categoria)}">
                    <div class="vitrina-card__media">
                        <img class="vitrina-card__img" src="${Store.escapeHtml(imgSrc)}" alt="${Store.escapeHtml(oferta.producto_nombre)}" loading="lazy" decoding="async">
                        <span class="vitrina-ahorro-float">-${ahorroPct}% ahorro</span>
                    </div>

                    <div class="vitrina-card__body">
                        <div class="vitrina-card__head">
                            <span class="vitrina-cat-pill">${Store.escapeHtml(catLabel)}</span>
                            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                                ${distHtml}
                                <span class="vitrina-unidades-pill">${oferta.unidades_disponibles} disp.</span>
                            </div>
                        </div>

                        <div>
                            <h2 class="vitrina-card__producto">${Store.escapeHtml(oferta.producto_nombre)}</h2>
                            <p class="vitrina-card__negocio">${Store.escapeHtml(oferta.negocio_nombre)}</p>
                        </div>

                        <div class="vitrina-precios-box">
                            <div>
                                <strong class="vitrina-precio-oferta">${Store.fmt(oferta.precio_oferta)}</strong>
                                <span class="vitrina-precio-regular" title="Precio regular en local declarado por el comercio">${Store.fmt(oferta.precio_regular)}</span>
                                <span class="vitrina-card__nota" style="display:block; font-size:0.74rem; margin-top:2px;">Precio regular en local declarado por el comercio</span>
                            </div>
                        </div>

                        <div class="vitrina-card__detalles">
                            <div class="vitrina-detalle-linea">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>Recoger: <strong>${Store.escapeHtml(oferta.horario_recogida)}</strong> · Expira en <span class="vitrina-countdown js-vitrina-timer" data-expira-ts="${oferta.expira_ts}">${this.formatearRestante(oferta.expira_ts)}</span></span>
                            </div>
                            <div class="vitrina-detalle-linea">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                <span>
                                    ${Store.escapeHtml(oferta.direccion_recogida)} · <strong>${Store.escapeHtml(oferta.municipio)}</strong>, ${Store.escapeHtml(oferta.departamento)} (${Store.escapeHtml(oferta.pais)})
                                    <a href="${Store.escapeHtml(mapsUrl)}" class="vitrina-maps-link" target="_blank" rel="noopener">Ver en Maps →</a>
                                </span>
                            </div>
                        </div>

                        ${alergenosHtml}

                        <p class="vitrina-card__nota">${Store.escapeHtml(oferta.nota_frescura)}</p>

                        <div class="vitrina-card__footer">
                            <button type="button" class="btn-primario vitrina-btn-recoger" data-vitrina-accion="recoger" data-id="${oferta.id}">
                                Ver cómo recoger
                            </button>
                            <button type="button" class="vitrina-btn-reportar" data-vitrina-accion="reportar" data-id="${oferta.id}" title="Reportar irregularidad sanitaria" aria-label="Reportar ${Store.escapeHtml(oferta.producto_nombre)}">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                                <span>Reportar</span>
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    vincularEventos() {
        document.getElementById('vitrina-buscar')?.addEventListener('input', (e) => {
            this.busquedaActual = e.target.value.trim().toLowerCase();
            this.renderizarGrid();
        });

        document.getElementById('vitrina-filtros')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.filtro-pill');
            if (!btn) return;
            if (btn.id === 'btn-cerca-de-mi') {
                this.alternarCercaDeMi();
                return;
            }
            document.querySelectorAll('#vitrina-filtros .filtro-pill:not(#btn-cerca-de-mi)').forEach((b) => b.classList.remove('activo'));
            btn.classList.add('activo');
            this.categoriaActual = btn.dataset.cat || 'todas';
            this.renderizarGrid();
        });

        document.getElementById('vitrina-pais')?.addEventListener('change', (e) => {
            this.paisActual = e.target.value || 'todos';
            this.departamentoActual = 'todos';
            this.municipioActual = 'todos';
            this.renderizarGrid();
        });

        document.getElementById('vitrina-departamento')?.addEventListener('change', (e) => {
            this.departamentoActual = e.target.value || 'todos';
            this.municipioActual = 'todos';
            this.renderizarGrid();
        });

        document.getElementById('vitrina-municipio')?.addEventListener('change', (e) => {
            this.municipioActual = e.target.value || 'todos';
            this.renderizarGrid();
        });

        document.getElementById('vitrina-grid')?.addEventListener('click', (e) => {
            const btnTodas = e.target.closest('#btn-ver-todas-zonas');
            if (btnTodas) {
                this.ordenCercaDeMi = false;
                this.paisActual = 'todos';
                this.departamentoActual = 'todos';
                this.municipioActual = 'todos';
                this.categoriaActual = 'todas';
                const btnCerca = document.getElementById('btn-cerca-de-mi');
                if (btnCerca) {
                    btnCerca.classList.remove('activo');
                    btnCerca.setAttribute('aria-pressed', 'false');
                }
                document.querySelectorAll('#vitrina-filtros .filtro-pill:not(#btn-cerca-de-mi)').forEach((b) => {
                    b.classList.toggle('activo', b.dataset.cat === 'todas');
                });
                this.renderizarGrid();
                return;
            }

            const btn = e.target.closest('[data-vitrina-accion]');
            if (!btn) return;
            const id = Number(btn.dataset.id);
            const oferta = this.ofertas.find((o) => o.id === id);
            if (!oferta) return;

            this.ultimoFoco = btn;
            if (btn.dataset.vitrinaAccion === 'recoger') {
                this.abrirModalRecogida(oferta);
            } else if (btn.dataset.vitrinaAccion === 'reportar') {
                this.abrirModalReporte(oferta);
            }
        });

        // Modales: cierre
        document.getElementById('btn-cerrar-recogida')?.addEventListener('click', () => this.cerrarModales());
        document.getElementById('btn-listo-recogida')?.addEventListener('click', () => this.cerrarModales());
        document.getElementById('btn-cerrar-reporte')?.addEventListener('click', () => this.cerrarModales());
        document.getElementById('btn-cancelar-reporte')?.addEventListener('click', () => this.cerrarModales());

        document.querySelectorAll('.oferta-modal-backdrop').forEach((backdrop) => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) this.cerrarModales();
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.cerrarModales();
        });

        document.getElementById('form-reportar-oferta')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.enviarReporteSanitario();
        });
    }

    abrirModalRecogida(oferta) {
        const modal = document.getElementById('modal-recogida');
        if (!modal) return;

        document.getElementById('modal-recogida-titulo').textContent = oferta.producto_nombre;
        document.getElementById('modal-recogida-negocio').textContent = oferta.negocio_nombre;

        const imgEl = document.getElementById('modal-recogida-img');
        if (imgEl) {
            imgEl.src = this.resolverImagenPublica(oferta.imagen_url, oferta.producto_nombre, oferta.categoria);
            imgEl.alt = oferta.producto_nombre;
        }

        const detalles = document.getElementById('modal-recogida-detalles');
        detalles.innerHTML = `
            <div><strong>Precio de cierre en tienda:</strong> <span class="tabular-nums">${Store.fmt(oferta.precio_oferta)}</span> <span style="text-decoration:line-through; opacity:0.7;">${Store.fmt(oferta.precio_regular)}</span> <span style="font-size:0.8rem; opacity:0.8;">(precio regular declarado por el comercio)</span></div>
            <div><strong>Unidades disponibles ahora:</strong> <span class="tabular-nums">${oferta.unidades_disponibles}</span></div>
            <div><strong>Ubicación:</strong> ${Store.escapeHtml(oferta.municipio)}, ${Store.escapeHtml(oferta.departamento)} · ${Store.escapeHtml(oferta.pais)}</div>
            <div><strong>Dirección física:</strong> ${Store.escapeHtml(oferta.direccion_recogida)}</div>
            <div><strong>Horario de recogida:</strong> ${Store.escapeHtml(oferta.horario_recogida)}</div>
            <div><strong>Teléfono / WhatsApp:</strong> ${Store.escapeHtml(oferta.contacto_publico)}</div>
            <div><strong>Alérgenos:</strong> ${Store.escapeHtml(oferta.alergenos || 'Ninguno declarado')}</div>
            <div><strong>Estado del alimento:</strong> ${Store.escapeHtml(oferta.nota_frescura)}</div>
        `;

        const soloDigitos = oferta.contacto_publico.replace(/[^\d]/g, '');
        const btnMaps = document.getElementById('modal-recogida-maps-btn');
        if (btnMaps) {
            btnMaps.href = this.construirUrlMaps(oferta);
        }

        const iframeMapa = document.getElementById('modal-recogida-mapa');
        if (iframeMapa) {
            iframeMapa.src = this.construirUrlEmbedMapa(oferta);
        }

        const btnContacto = document.getElementById('modal-recogida-contacto-btn');
        if (btnContacto) {
            if (soloDigitos.length >= 7) {
                const prefijo = soloDigitos.length === 10 ? `57${soloDigitos}` : soloDigitos;
                const texto = encodeURIComponent(`Hola, vi su oferta de cierre "${oferta.producto_nombre}" en Costia. ¿Aún tienen unidades disponibles?`);
                btnContacto.href = `https://wa.me/${prefijo}?text=${texto}`;
            } else {
                btnContacto.href = `tel:${encodeURIComponent(oferta.contacto_publico)}`;
            }
        }

        modal.hidden = false;
        modal.classList.add('activo');
        document.getElementById('btn-cerrar-recogida')?.focus();
    }

    abrirModalReporte(oferta) {
        const modal = document.getElementById('modal-reporte');
        if (!modal) return;

        document.getElementById('reporte-oferta-id').value = String(oferta.id);
        document.getElementById('modal-reporte-sub').textContent = `Reportando: ${oferta.producto_nombre} · ${oferta.negocio_nombre}`;
        document.getElementById('reporte-detalle').value = '';

        modal.hidden = false;
        modal.classList.add('activo');
        document.getElementById('reporte-motivo')?.focus();
    }

    cerrarModales() {
        document.querySelectorAll('.oferta-modal-backdrop').forEach((m) => {
            m.classList.remove('activo');
            m.hidden = true;
        });
        if (this.ultimoFoco && typeof this.ultimoFoco.focus === 'function') {
            this.ultimoFoco.focus();
            this.ultimoFoco = null;
        }
    }

    async enviarReporteSanitario() {
        const id = Number(document.getElementById('reporte-oferta-id')?.value || 0);
        const motivoBase = document.getElementById('reporte-motivo')?.value || 'Incumplimiento sanitario';
        const detalle = (document.getElementById('reporte-detalle')?.value || '').trim();
        const motivoCompleto = detalle ? `${motivoBase}: ${detalle}` : motivoBase;

        if (!id) return;

        // Intentar persistir reporte en servidor si existe la oferta en MySQL
        try {
            await fetch('../backend/api/ofertas.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ accion: 'reportar', id, motivo: motivoCompleto }),
            });
        } catch (_) {}

        // Baja preventiva inmediata en memoria y localStorage
        let actualizadoLocal = false;
        const listaLocal = this.leerLocalLista();
        const idxLocal = listaLocal.findIndex((o) => o.id === id);
        if (idxLocal !== -1) {
            listaLocal[idxLocal].estado = 'reportada';
            listaLocal[idxLocal].motivo_reporte = motivoCompleto;
            actualizadoLocal = true;
        }
        if (actualizadoLocal) {
            try {
                localStorage.setItem(VitrinaPublicaController.CLAVE_OFERTAS, JSON.stringify(listaLocal));
            } catch (_) {}
        }

        const idxMem = this.ofertas.findIndex((o) => o.id === id);
        if (idxMem !== -1) {
            this.ofertas[idxMem].estado = 'reportada';
        }

        this.cerrarModales();
        this.renderizarGrid();
        if (typeof Store !== 'undefined') {
            Store.toast('Publicación ocultada preventivamente para revisión sanitaria.', 'info');
        }
    }

    actualizarContadores() {
        let requiereReRender = false;
        const ahora = Date.now();
        this.ofertas.forEach((o) => {
            if (o.estado === 'activa' && o.expira_ts > 0 && o.expira_ts <= ahora) {
                requiereReRender = true;
            }
        });
        if (requiereReRender) {
            this.renderizarGrid();
            return;
        }

        document.querySelectorAll('.js-vitrina-timer').forEach((el) => {
            const ts = Number(el.dataset.expiraTs || 0);
            if (!ts) return;
            el.textContent = this.formatearRestante(ts);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const vitrina = new VitrinaPublicaController();
    vitrina.iniciar();
    window.vitrinaCtrl = vitrina;
});
