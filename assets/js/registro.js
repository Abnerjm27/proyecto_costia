/**
 * registro.js
 * Manejo del registro de nuevos usuarios y comunicación con el backend
 */

document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('form-registro');
    const errorBanner = document.getElementById('auth-error-banner');
    if (!formRegistro) return;

    function mostrarErrorAuth(msg) {
        if (!errorBanner) return;
        errorBanner.textContent = msg;
        errorBanner.hidden = false;
    }

    function ocultarErrorAuth() {
        if (!errorBanner) return;
        errorBanner.textContent = '';
        errorBanner.hidden = true;
    }

    formRegistro.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', ocultarErrorAuth);
    });

    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarErrorAuth();

        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        btn.disabled = true;
        btn.textContent = 'Creando cuenta...';

        try {
            const res = await fetch('../backend/auth/registro.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok && data.status === 'success') {
                // Preservar respaldo temporal en sessionStorage por si el usuario costeo recetas en modo demo
                const insumosPrevios = localStorage.getItem('costia_insumos');
                const prodsPrevios   = localStorage.getItem('costia_productos');
                if (insumosPrevios || prodsPrevios) {
                    sessionStorage.setItem('costia_demo_backup_insumos', insumosPrevios || '[]');
                    sessionStorage.setItem('costia_demo_backup_prods', prodsPrevios || '[]');
                }
                localStorage.removeItem('costia_insumos');
                localStorage.removeItem('costia_productos');
                if (data.usuario && data.usuario.negocio && window.Store) {
                    Store.guardarNegocio(data.usuario.negocio);
                }
                if (window.Store) {
                    Store.toastDiferido(`¡Bienvenido a Costia, ${data.usuario.negocio}!`);
                }
                window.location.href = 'dashboard.html';
            } else {
                mostrarErrorAuth(data.mensaje || 'No se pudo completar el registro. Verifica tus datos e inténtalo de nuevo.');
            }
        } catch (err) {
            mostrarErrorAuth('No se pudo conectar con el servidor local. Asegúrate de tener XAMPP con Apache y MySQL encendidos.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Crear cuenta gratis';
        }
    });
});
