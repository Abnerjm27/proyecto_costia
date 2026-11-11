/**
 * CONFIGURACION.JS — Controlador de la Estación de Configuración Integral Costia
 * Administra identidad, gastos fijos, nómina de empleados y políticas de pricing.
 */

class ConfiguracionController {
    constructor() {
        this.init();
    }

    init() {
        this.cargarDatos();
        this.enlazarEventos();
        this.recalcularEnVivo();
    }

    cargarDatos() {
        const store = window.Store;
        if (!store) return;

        // 1. Identidad
        const nombreNegocio = store.cargarNegocio ? store.cargarNegocio() : 'Mi Negocio';
        const inputNombre = document.getElementById('cfg-negocio-nombre');
        if (inputNombre) inputNombre.value = nombreNegocio;

        // 2. Gastos Fijos y Nómina
        const cfg = typeof store.obtenerConfigGastos === 'function' ? store.obtenerConfigGastos() : {};

        const esCasa = cfg.tipoUbicacion === 'casa' || cfg.arriendoMensual === 0;
        const radCasa = document.getElementById('cfg-radio-casa');
        const radLocal = document.getElementById('cfg-radio-local');
        if (esCasa && radCasa) {
            radCasa.checked = true;
            this.actualizarModoEspacio(true);
        } else if (radLocal) {
            radLocal.checked = true;
            this.actualizarModoEspacio(false);
        }

        const inpArriendo = document.getElementById('cfg-input-arriendo');
        if (inpArriendo) inpArriendo.value = cfg.arriendoMensual !== null ? cfg.arriendoMensual : (esCasa ? 0 : 1200000);

        const inpRecibos = document.getElementById('cfg-input-recibos');
        if (inpRecibos) inpRecibos.value = cfg.recibosMensuales !== null ? cfg.recibosMensuales : 180000;

        const inpTrab = document.getElementById('cfg-input-trabajadores');
        if (inpTrab) inpTrab.value = cfg.numTrabajadores !== undefined ? cfg.numTrabajadores : 1;

        const inpSalario = document.getElementById('cfg-input-salario');
        if (inpSalario) inpSalario.value = cfg.salarioTrabajador !== undefined ? cfg.salarioTrabajador : 1423500;

        const inpLotes = document.getElementById('cfg-input-lotes-mes');
        if (inpLotes) inpLotes.value = cfg.lotesMensualesEstimados || 100;

        const selCategoria = document.getElementById('cfg-select-categoria');
        if (selCategoria && cfg.categoriaNegocio) selCategoria.value = cfg.categoriaNegocio;

        const selMargen = document.getElementById('cfg-select-margen-default');
        if (selMargen && cfg.margenDefault) selMargen.value = cfg.margenDefault;

        const selMulti = document.getElementById('cfg-select-multi-default');
        if (selMulti && cfg.modeloComercial) selMulti.value = cfg.modeloComercial;
    }

    actualizarModoEspacio(esCasa) {
        const wrapArriendo = document.getElementById('wrap-cfg-arriendo-field');
        const inpArriendo = document.getElementById('cfg-input-arriendo');
        const cardCasa = document.getElementById('card-radio-casa');
        const cardLocal = document.getElementById('card-radio-local');

        if (cardCasa && cardLocal) {
            cardCasa.classList.toggle('active', esCasa);
            cardLocal.classList.toggle('active', !esCasa);
        }

        if (wrapArriendo) {
            wrapArriendo.style.opacity = esCasa ? '0.45' : '1';
            wrapArriendo.style.pointerEvents = esCasa ? 'none' : 'auto';
        }
        if (esCasa && inpArriendo) {
            inpArriendo.value = 0;
        } else if (!esCasa && inpArriendo && Number(inpArriendo.value) === 0) {
            inpArriendo.value = 1200000;
        }
        this.recalcularEnVivo();
    }

    recalcularEnVivo() {
        const store = window.Store;
        const fmt = store && store.fmt ? store.fmt.bind(store) : (v => `$${v.toLocaleString('es-CO')}`);

        const radCasa = document.getElementById('cfg-radio-casa');
        const esCasa = radCasa ? radCasa.checked : false;

        const arriendo = esCasa ? 0 : Math.max(0, parseInt(document.getElementById('cfg-input-arriendo')?.value, 10) || 0);
        const recibos = Math.max(0, parseInt(document.getElementById('cfg-input-recibos')?.value, 10) || 0);
        const trab = Math.max(0, parseInt(document.getElementById('cfg-input-trabajadores')?.value, 10) || 0);
        const sal = Math.max(0, parseInt(document.getElementById('cfg-input-salario')?.value, 10) || 0);
        const lotes = Math.max(1, parseInt(document.getElementById('cfg-input-lotes-mes')?.value, 10) || 100);

        const nominaTotal = trab * sal;
        const fijosTotal = arriendo + recibos + nominaTotal;
        const cuotaMano = Math.round(nominaTotal / lotes);
        const cuotaTotal = Math.round(fijosTotal / lotes);

        const kpiNomina = document.getElementById('kpi-cfg-nomina-total');
        const kpiMano = document.getElementById('kpi-cfg-cuota-mano');
        const kpiTotal = document.getElementById('kpi-cfg-cuota-total');
        const kpiFijosMes = document.getElementById('kpi-cfg-fijos-mes');

        if (kpiNomina) kpiNomina.textContent = fmt(nominaTotal);
        if (kpiMano) kpiMano.textContent = `${fmt(cuotaMano)} / lote`;
        if (kpiTotal) kpiTotal.textContent = `${fmt(cuotaTotal)} / lote`;
        if (kpiFijosMes) kpiFijosMes.textContent = fmt(fijosTotal);
    }

    enlazarEventos() {
        // Radios de espacio
        document.getElementById('cfg-radio-casa')?.addEventListener('change', () => this.actualizarModoEspacio(true));
        document.getElementById('cfg-radio-local')?.addEventListener('change', () => this.actualizarModoEspacio(false));

        // Inputs reactivos
        const ids = ['cfg-input-arriendo', 'cfg-input-recibos', 'cfg-input-trabajadores', 'cfg-input-salario', 'cfg-input-lotes-mes'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.recalcularEnVivo());
                el.addEventListener('change', () => this.recalcularEnVivo());
            }
        });

        // Guardar cambios
        const btnGuardar = document.getElementById('btn-guardar-todo-config');
        btnGuardar?.addEventListener('click', () => this.guardarConfiguracion());

        // Descargar copia de seguridad JSON
        document.getElementById('btn-cfg-descargar-json')?.addEventListener('click', () => {
            if (window.Store && typeof window.Store.descargarCopiaSeguridadJSON === 'function') {
                window.Store.descargarCopiaSeguridadJSON();
            }
        });

        // Restaurar demo con advertencia bonita
        document.getElementById('btn-cfg-restaurar-demo')?.addEventListener('click', async () => {
            if (window.Store && typeof window.Store.confirmarRestauracionDemo === 'function') {
                await window.Store.confirmarRestauracionDemo();
            }
        });

        // Cerrar sesión
        document.getElementById('btn-cfg-cerrar-sesion')?.addEventListener('click', async () => {
            if (window.Store && typeof window.Store.confirmar === 'function') {
                const salir = await window.Store.confirmar({
                    titulo: '¿Deseas cerrar sesión?',
                    subtitulo: 'Regresarás a la pantalla de inicio de sesión de Costia.',
                    badge: 'Sesión',
                    btnConfirmarTexto: 'Cerrar sesión',
                    btnCancelarTexto: 'Permanecer aquí',
                    tipo: 'alerta'
                });
                if (salir && typeof window.Store.cerrarSesion === 'function') {
                    window.Store.cerrarSesion();
                }
            }
        });
    }

    guardarConfiguracion() {
        const store = window.Store;
        if (!store) return;

        const inputNombre = document.getElementById('cfg-negocio-nombre');
        const nuevoNombre = inputNombre?.value.trim() || 'Mi Negocio';
        store.guardarNegocio(nuevoNombre);

        const radCasa = document.getElementById('cfg-radio-casa');
        const esCasa = radCasa ? radCasa.checked : false;

        const arriendo = esCasa ? 0 : Math.max(0, parseInt(document.getElementById('cfg-input-arriendo')?.value, 10) || 0);
        const recibos = Math.max(0, parseInt(document.getElementById('cfg-input-recibos')?.value, 10) || 0);
        const trab = Math.max(0, parseInt(document.getElementById('cfg-input-trabajadores')?.value, 10) || 0);
        const sal = Math.max(0, parseInt(document.getElementById('cfg-input-salario')?.value, 10) || 0);
        const lotes = Math.max(1, parseInt(document.getElementById('cfg-input-lotes-mes')?.value, 10) || 100);

        const categoria = document.getElementById('cfg-select-categoria')?.value || 'panaderia';
        const margenDef = document.getElementById('cfg-select-margen-default')?.value || '40';
        const multiDef = document.getElementById('cfg-select-multi-default')?.value || '2.5';

        const payload = {
            tipoUbicacion: esCasa ? 'casa' : 'local',
            ubicacionDescripcion: esCasa ? 'Desde casa' : 'Local en arriendo',
            arriendoMensual: arriendo,
            recibosMensuales: recibos,
            numTrabajadores: trab,
            salarioTrabajador: sal,
            lotesMensualesEstimados: lotes,
            categoriaNegocio: categoria,
            margenDefault: margenDef,
            modeloComercial: multiDef
        };

        if (typeof store.guardarConfigGastos === 'function') {
            store.guardarConfigGastos(payload);
        }

        store.toast(`Configuración guardada para "${nuevoNombre}". Cuotas y gastos actualizados.`);
        this.recalcularEnVivo();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.configuracionCtrl = new ConfiguracionController();
});
