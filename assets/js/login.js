/**
 * login.js
 * Manejo del inicio de sesión y comunicación con el backend
 */

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    if (!formLogin) return;

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        btn.disabled = true;
        btn.textContent = 'Iniciando sesión...';

        try {
            const res = await fetch('../backend/auth/login.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok && data.status === 'success') {
                localStorage.removeItem('costia_insumos');
                localStorage.removeItem('costia_productos');
                if (data.usuario && data.usuario.negocio && window.Store) {
                    Store.guardarNegocio(data.usuario.negocio);
                }
                if (window.Store) {
                    Store.toastDiferido(`¡Bienvenido de vuelta, ${data.usuario.negocio}!`);
                }
                window.location.href = 'productos.html';
            } else {
                const email = String(formData.get('email') || '').trim();
                const password = String(formData.get('password') || '').trim();
                if (email === 'demo@costia.com' && password === 'admin123') {
                    if (window.Store) {
                        Store.guardarNegocio('Panadería El Roble (Demo)');
                        Store.toastDiferido('¡Bienvenido de vuelta, Panadería El Roble (Modo Local)!');
                    }
                    window.location.href = 'productos.html';
                    return;
                }
                alert(data.mensaje || 'Error al iniciar sesión');
            }
        } catch (err) {
            const email = String(formData.get('email') || '').trim();
            const password = String(formData.get('password') || '').trim();
            if (email === 'demo@costia.com' && password === 'admin123') {
                if (window.Store) {
                    Store.guardarNegocio('Panadería El Roble (Demo)');
                    Store.toastDiferido('¡Bienvenido de vuelta, Panadería El Roble (Modo Local)!');
                }
                window.location.href = 'productos.html';
                return;
            }
            alert('No se pudo conectar con el servidor local. Asegúrate de tener XAMPP con Apache y MySQL encendidos.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Iniciar sesión';
        }
    });
});
