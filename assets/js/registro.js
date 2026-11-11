/**
 * registro.js
 * Manejo del registro de nuevos usuarios y comunicación con el backend
 */

document.addEventListener('DOMContentLoaded', () => {
    const formRegistro = document.getElementById('form-registro');
    if (!formRegistro) return;

    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

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
                window.location.href = 'productos.html';
            } else {
                alert(data.mensaje || 'Error al registrar usuario');
            }
        } catch (err) {
            alert('No se pudo conectar con el servidor local. Asegúrate de tener XAMPP con Apache y MySQL encendidos.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Crear cuenta gratis';
        }
    });
});
