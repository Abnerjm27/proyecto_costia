/**
 * login.js
 * Manejo del inicio de sesión y comunicación con el backend
 */

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const errorBanner = document.getElementById('auth-error-banner');
    if (!formLogin) return;

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

    formLogin.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', ocultarErrorAuth);
    });

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarErrorAuth();

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
                window.location.href = 'dashboard.html';
            } else {
                const email = String(formData.get('email') || '').trim();
                const password = String(formData.get('password') || '').trim();
                if (email === 'demo@costia.com' && password === 'admin123') {
                    if (window.Store) {
                        Store.guardarNegocio('Panadería El Roble (Demo)');
                        Store.toastDiferido('¡Bienvenido de vuelta, Panadería El Roble (Modo Local)!');
                    }
                    window.location.href = 'dashboard.html';
                    return;
                }
                mostrarErrorAuth(data.mensaje || 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.');
            }
        } catch (err) {
            const email = String(formData.get('email') || '').trim();
            const password = String(formData.get('password') || '').trim();
            if (email === 'demo@costia.com' && password === 'admin123') {
                if (window.Store) {
                    Store.guardarNegocio('Panadería El Roble (Demo)');
                    Store.toastDiferido('¡Bienvenido de vuelta, Panadería El Roble (Modo Local)!');
                }
                window.location.href = 'dashboard.html';
                return;
            }
            mostrarErrorAuth('No se pudo conectar con el servidor local. Asegúrate de tener XAMPP con Apache y MySQL encendidos.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Iniciar sesión';
        }
    });
});
