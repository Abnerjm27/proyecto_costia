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

  test('SEC-008: /backend/api/configuracion.php debe rechazar peticiones sin sesión (401) y métodos no permitidos (405)', async ({ playwright }) => {
    const anonRequest = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8085' });
    try {
      const getRes = await anonRequest.get('/backend/api/configuracion.php');
      expect(getRes.status()).toBe(401);
      const getJson = await getRes.json();
      expect(getJson.status).toBe('error');

      const delRes = await anonRequest.delete('/backend/api/configuracion.php');
      expect(delRes.status()).toBe(405);
      const delJson = await delRes.json();
      expect(delJson.status).toBe('error');
    } finally {
      await anonRequest.dispose();
    }
  });

  test('SEC-009: /backend/api/configuracion.php debe persistir y recuperar negocio y config_gastos en MySQL', async ({ playwright }) => {
    const isolatedRequest = await playwright.request.newContext({ baseURL: 'http://127.0.0.1:8085' });
    let authenticated = false;
    try {
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
      authenticated = true;

      const saveRes = await isolatedRequest.post('/backend/api/configuracion.php', {
        headers: { 'Content-Type': 'application/json' },
        data: {
          negocio: 'Panadería Test Sync',
          config_gastos: {
            arriendoMensual: 1500000,
            recibosMensuales: 220000,
            numTrabajadores: 2,
            salarioTrabajador: 1423500,
            lotesMensualesEstimados: 80
          }
        }
      });
      expect(saveRes.status()).toBe(200);
      const saveJson = await saveRes.json();
      expect(saveJson.status).toBe('success');
      expect(saveJson.negocio).toBe('Panadería Test Sync');

      const readRes = await isolatedRequest.get('/backend/api/configuracion.php');
      expect(readRes.status()).toBe(200);
      const readJson = await readRes.json();
      expect(readJson.status).toBe('success');
      expect(readJson.negocio).toBe('Panadería Test Sync');
      expect(readJson.config_gastos).toBeTruthy();
      expect(readJson.config_gastos.arriendoMensual).toBe(1500000);
      expect(readJson.config_gastos.lotesMensualesEstimados).toBe(80);
    } finally {
      if (authenticated) {
        await isolatedRequest.post('/backend/api/configuracion.php', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            negocio: 'Panadería El Roble',
            config_gastos: {
              arriendoMensual: 1200000,
              recibosMensuales: 180000,
              numTrabajadores: 1,
              salarioTrabajador: 1423500,
              lotesMensualesEstimados: 100
            }
          }
        });
      }
      await isolatedRequest.dispose();
    }
  });

});
