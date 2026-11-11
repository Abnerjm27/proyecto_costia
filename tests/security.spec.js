const { test, expect } = require('@playwright/test');

test.describe('Costia — Verificación Automatizada de Seguridad (Cloudflare Audit Spec)', () => {

  test('SEC-001: GET /backend/api/demo.php debe ser rechazado con HTTP 405 (Mitigación CSRF Data Wipeout)', async ({ request }) => {
    const response = await request.get('/backend/api/demo.php');
    expect(response.status()).toBe(405);
    const json = await response.json();
    expect(json.status).toBe('error');
    expect(json.mensaje).toMatch(/Método no permitido/i);
  });

  test('SEC-001: GET /backend/api/eliminar-cuenta.php debe ser rechazado con HTTP 405 (Mitigación CSRF Deletion)', async ({ request }) => {
    const response = await request.get('/backend/api/eliminar-cuenta.php');
    expect(response.status()).toBe(405);
    const json = await response.json();
    expect(json.status).toBe('error');
    expect(json.mensaje).toMatch(/Método no permitido/i);
  });

  test('SEC-002: ProductoController debe rechazar insumos no pertenecientes al usuario con HTTP 403 (Mitigación BOLA/IDOR)', async ({ playwright }) => {
    const isolatedRequest = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8085' });
    try {
      // 1. Iniciar sesión con usuario demo en contexto aislado
      const loginRes = await isolatedRequest.post('/backend/auth/login.php', {
        form: {
          email: 'demo@costia.com',
          password: 'admin123'
        }
      });
      if (loginRes.status() === 500) {
        test.skip(true, 'Servicio de base de datos MySQL no disponible en el entorno local actual');
        return;
      }
      expect(loginRes.status()).toBe(200);

      // 2. Intentar crear un producto con un insumoId inexistente o ajeno (ej. 999999)
      const prodRes = await isolatedRequest.post('/backend/api/productos.php', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          nombre: 'Producto Malicioso Inyección Insumo',
          modo: 'margen',
          valorModo: 30,
          unidadesProducidas: 1,
          receta: [
            { insumoId: 999999, cantidad: 500, unidadReceta: 'g' }
          ]
        }
      });

      expect(prodRes.status()).toBe(403);
      const json = await prodRes.json();
      expect(json.status).toBe('error');
      expect(json.mensaje).toMatch(/no pertenecen a tu cuenta/i);
    } finally {
      await isolatedRequest.dispose();
    }
  });

  test('SEC-004 / Session: Las respuestas del backend deben emitir cabeceras de seguridad estrictas', async ({ request }) => {
    const res = await request.get('/backend/auth/session.php');
    const headers = res.headers();

    expect(headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('SEC-007: /backend/conexion.php no debe filtrar trazas internas o credenciales en error', async ({ request }) => {
    const res = await request.get('/backend/conexion.php');
    const text = await res.text();
    // No debe contener contraseñas o stack traces de PDO sin sanitizar
    expect(text).not.toMatch(/SQLSTATE|Stack trace|password|DB_PASS/i);
  });

});
