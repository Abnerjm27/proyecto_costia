/**
 * equilibrio.js — Controlador de la vista Punto de Equilibrio Global (todos los productos)
 */
class EquilibrioGlobalController {
    constructor() {
        this.busquedaActual = '';
    }

    iniciar() {
        this.vincularEventos();
        this.renderizar();

        if (typeof Store !== 'undefined' && typeof Store.alActualizar === 'function') {
            Store.alActualizar(() => this.renderizar());
        }
    }

    cargarMix() {
        try {
            const raw = localStorage.getItem('costia_mix_equilibrio');
            return raw ? JSON.parse(raw) : {};
        } catch (_) {
            return {};
        }
    }

    guardarMix(mix) {
        try {
            localStorage.setItem('costia_mix_equilibrio', JSON.stringify(mix || {}));
        } catch (_) {}
    }

    obtenerFijos() {
        const cfg = (typeof Store !== 'undefined' && typeof Store.cargarConfigGastos === 'function'
            ? Store.cargarConfigGastos()
            : null) || (typeof Store !== 'undefined' && typeof Store.obtenerConfigGastos === 'function'
            ? Store.obtenerConfigGastos()
            : {}) || {};
        return (Number(cfg.arriendoMensual) || 0) + (Number(cfg.recibosMensuales) || 0);
    }

    formatearMiles(valor) {
        const num = Math.max(0, Math.round(Number(valor) || 0));
        return num.toLocaleString('es-CO');
    }

    parsearMiles(texto) {
        const digitos = String(texto || '').replace(/\D/g, '');
        return digitos ? parseInt(digitos, 10) : 0;
    }

    vincularEventos() {
        const inputBuscar = document.getElementById('buscar-equilibrio-producto');
        inputBuscar?.addEventListener('input', (e) => {
            this.busquedaActual = (e.target.value || '').trim().toLowerCase();
            this.filtrarFilas();
        });

        const tbody = document.getElementById('be-global-tbody');
        tbody?.addEventListener('input', (e) => {
            const inp = e.target.closest('.be-mix-input');
            if (!inp) return;
            const id = Number(inp.dataset.id);
            const raw = inp.value;
            const pos = inp.selectionStart ?? raw.length;
            const digitosDerecha = raw.slice(pos).replace(/\D/g, '').length;
            const digitos = raw.replace(/\D/g, '');
            const val = digitos ? parseInt(digitos, 10) : 0;

            if (digitos === '') {
                inp.value = '';
            } else {
                const formateado = this.formatearMiles(val);
                inp.value = formateado;
                let nuevaPos = formateado.length;
                let cont = 0;
                for (let i = formateado.length - 1; i >= 0; i--) {
                    if (cont === digitosDerecha) {
                        nuevaPos = i + 1;
                        break;
                    }
                    if (/\d/.test(formateado[i])) cont++;
                    if (i === 0) nuevaPos = 0;
                }
                try { inp.setSelectionRange(nuevaPos, nuevaPos); } catch (_) {}
            }

            const mix = this.cargarMix();
            mix[id] = val;
            this.guardarMix(mix);
            this.actualizarCalculoEnVivo(Store.cargarProductos(), Store.cargarInsumos(), mix);
        });

        tbody?.addEventListener('focusout', (e) => {
            const inp = e.target.closest('.be-mix-input');
            if (!inp) return;
            if (!inp.value.replace(/\D/g, '')) {
                inp.value = '0';
            }
        });

        tbody?.addEventListener('click', (e) => {
            const stepBtn = e.target.closest('.be-mix-step');
            if (!stepBtn) return;
            const id = Number(stepBtn.dataset.id);
            const delta = Number(stepBtn.dataset.step) || 0;
            const inp = tbody.querySelector(`.be-mix-input[data-id="${id}"]`);
            if (!inp) return;
            const nuevo = Math.max(0, this.parsearMiles(inp.value) + delta);
            inp.value = this.formatearMiles(nuevo);
            const mix = this.cargarMix();
            mix[id] = nuevo;
            this.guardarMix(mix);
            this.actualizarCalculoEnVivo(Store.cargarProductos(), Store.cargarInsumos(), mix);
        });

        document.getElementById('btn-reset-mix-equilibrio')?.addEventListener('click', () => {
            try { localStorage.removeItem('costia_mix_equilibrio'); } catch (_) {}
            this.renderizar();
            if (typeof Store !== 'undefined' && typeof Store.toast === 'function') {
                Store.toast('Estimación de ventas restablecida a partes iguales', 'info');
            }
        });
    }

    filtrarFilas() {
        const q = this.busquedaActual;
        document.querySelectorAll('#be-global-tbody tr[data-nombre]').forEach((tr) => {
            const nombre = tr.dataset.nombre || '';
            tr.style.display = (!q || nombre.includes(q)) ? '' : 'none';
        });
    }

    actualizarCalculoEnVivo(productos, insumos, mix) {
        const fijos = this.obtenerFijos();
        const multi = typeof AsesorFinanzas !== 'undefined' && typeof AsesorFinanzas.calcularPuntoEquilibrioMultiproducto === 'function'
            ? AsesorFinanzas.calcularPuntoEquilibrioMultiproducto(productos, insumos, fijos, mix)
            : null;

        if (!multi || !multi.tieneFijos || multi.sinProductos) return;

        const setTxt = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };
        setTxt('be-global-fijos-val', `${Store.fmt(fijos)} / mes`);
        setTxt('be-global-margen', `Margen promedio: ${multi.margenPonderadoPct.toFixed(1)}%`);
        setTxt('be-global-venta-mes', Store.fmt(multi.ventaMensualMeta));
        setTxt('be-global-venta-dia', `~${Store.fmt(multi.ventaDiariaMeta)} al día`);
        setTxt('be-global-uds-mes', `${multi.unidadesTotalesMes} uds / mes`);
        setTxt('be-global-uds-dia', `~${multi.unidadesTotalesDia} uds al día`);

        const resumenEl = document.getElementById('be-global-resumen-vivo');
        if (resumenEl) {
            resumenEl.innerHTML = `Con esta mezcla, vendiendo <strong>${multi.unidadesTotalesMes} productos al mes</strong> (~<strong>${multi.unidadesTotalesDia} al día</strong>) cubres el 100% de tus gastos fijos. A partir de ahí, todo es ganancia libre.`;
        }

        multi.detalle.forEach((d) => {
            const row = document.querySelector(`#be-global-tbody tr[data-id="${d.id}"]`);
            if (!row) return;
            const pctEl = row.querySelector('.be-mix-pct');
            const mesEl = row.querySelector('.be-meta-mes');
            const diaEl = row.querySelector('.be-meta-dia');
            if (pctEl) pctEl.textContent = `${d.participacionPct}%`;
            if (mesEl) mesEl.innerHTML = `<strong>${d.unidadesMes} uds</strong>`;
            if (diaEl) diaEl.textContent = `${d.unidadesDia} uds`;
        });
    }

    renderizar() {
        if (typeof Store === 'undefined') return;
        const productos = Store.cargarProductos();
        const insumos = Store.cargarInsumos();
        const fijos = this.obtenerFijos();
        const mix = this.cargarMix();

        const emptyBox = document.getElementById('be-global-empty');
        const contBox = document.getElementById('be-global-contenido');
        const tbody = document.getElementById('be-global-tbody');
        if (!emptyBox || !contBox || !tbody) return;

        if (fijos <= 0) {
            emptyBox.hidden = false;
            contBox.hidden = true;
            emptyBox.innerHTML = `Aún no tienes gastos fijos mensuales configurados (arriendo y servicios). <a href="configuracion.html">Configúralos en Mi Negocio</a> para calcular el punto de equilibrio global.`;
            return;
        }

        const multi = typeof AsesorFinanzas !== 'undefined' && typeof AsesorFinanzas.calcularPuntoEquilibrioMultiproducto === 'function'
            ? AsesorFinanzas.calcularPuntoEquilibrioMultiproducto(productos, insumos, fijos, mix)
            : null;

        if (!multi || multi.sinProductos) {
            emptyBox.hidden = false;
            contBox.hidden = true;
            emptyBox.innerHTML = `Necesitas al menos un producto con ganancia neta positiva para calcular el punto de equilibrio combinado. <a href="crear-producto.html">Crea una receta</a>.`;
            return;
        }

        emptyBox.hidden = true;
        contBox.hidden = false;

        tbody.innerHTML = multi.detalle.map((d) => {
            const pesoVal = mix[d.id] !== undefined ? mix[d.id] : 30;
            const pesoFmt = this.formatearMiles(pesoVal);
            return `
                <tr data-id="${d.id}" data-nombre="${Store.escapeHtml(d.nombre.toLowerCase())}">
                    <td><strong>${Store.escapeHtml(d.nombre)}</strong></td>
                    <td class="num tabular-nums">${Store.fmt(d.precioVenta)}</td>
                    <td class="num tabular-nums be-ganancia-pos">+${Store.fmt(d.gananciaUnitaria)}</td>
                    <td class="num">
                        <div class="be-mix-cell">
                            <button type="button" class="be-mix-step" data-id="${d.id}" data-step="-1" aria-label="Disminuir ventas estimadas de ${Store.escapeHtml(d.nombre)}">−</button>
                            <input type="text" inputmode="numeric" class="be-mix-input tabular-nums" data-id="${d.id}" value="${pesoFmt}" aria-label="Ventas estimadas al mes de ${Store.escapeHtml(d.nombre)}">
                            <button type="button" class="be-mix-step" data-id="${d.id}" data-step="1" aria-label="Aumentar ventas estimadas de ${Store.escapeHtml(d.nombre)}">+</button>
                            <span class="be-mix-pct tabular-nums">${d.participacionPct}%</span>
                        </div>
                    </td>
                    <td class="num tabular-nums be-meta-mes"><strong>${d.unidadesMes} uds</strong></td>
                    <td class="num tabular-nums be-meta-dia">${d.unidadesDia} uds</td>
                </tr>
            `;
        }).join('');

        this.filtrarFilas();
        this.actualizarCalculoEnVivo(productos, insumos, mix);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.equilibrioController = new EquilibrioGlobalController();
    window.equilibrioController.iniciar();
});
