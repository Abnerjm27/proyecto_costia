const { test, expect } = require('@playwright/test');

test.describe('Costia — Interfaz sin chat Asesor IA', () => {

  test('no debe mostrarse el Asesor IA en ninguna vista tras su retiro', async ({ page }) => {
    for (const url of [
      '/paginas/insumos.html',
      '/paginas/crear-producto.html',
      '/paginas/dashboard.html',
      '/paginas/productos.html',
      '/paginas/equilibrio.html',
      '/paginas/ficha-tecnica.html',
      '/paginas/configuracion.html'
    ]) {
      await page.goto(url);
      await expect(page.locator('#btn-fab-asesor')).toHaveCount(0);
      await expect(page.locator('#link-sidebar-asesor')).toHaveCount(0);
      await expect(page.locator('#modal-asesor-costia')).toHaveCount(0);
    }
  });
});
