const { test, expect } = require('@playwright/test');

test.describe('Costia — Asesor IA Omnipresente e Interactivo', () => {

  test('debe estar disponible en el Dashboard con botón flotante, drawer y chips interactivos ejecutables', async ({ page }) => {
    await page.goto('/paginas/dashboard.html');

    // Botón flotante FAB visible en Dashboard
    const btnFab = page.locator('#btn-fab-asesor');
    await expect(btnFab).toBeVisible();

    // Abrir asesor haciendo clic en el FAB
    await btnFab.click();

    const modal = page.locator('#modal-asesor-costia');
    await expect(modal).toHaveClass(/visible/);

    // Los chips deben ser botones interactivos ejecutables
    const chips = page.locator('#asesor-progreso-chips button.asesor-chip');
    await expect(chips.first()).toBeVisible();

    // El chip de Rentabilidad debe responder al clic
    const chipRentabilidad = page.locator('#asesor-progreso-chips button[data-chip-accion="dashboard_rentabilidad"]');
    await expect(chipRentabilidad).toBeVisible();
    await chipRentabilidad.click();

    // El asesor debe generar el análisis en vivo
    const mensajeAgente = page.locator('#asesor-mensajes .asesor-msg--agente').last();
    await expect(mensajeAgente).toContainText(/Rentabilidad en Vivo/i);

    // Debe mostrar sugerencias rápidas ejecutables
    const sugerencia = mensajeAgente.locator('.asesor-sugerencia-pill').first();
    await expect(sugerencia).toBeVisible();
  });

  test('el enlace de Asesor IA en el sidebar debe abrir el drawer directamente en la página actual', async ({ page }) => {
    await page.goto('/paginas/productos.html');

    // Enlace en sidebar
    const linkSidebar = page.locator('#link-sidebar-asesor');
    await expect(linkSidebar).toBeVisible();
    await linkSidebar.click();

    // El drawer debe abrirse en la misma página sin redirigir
    await expect(page).toHaveURL(/paginas\/productos\.html/);
    await expect(page.locator('#modal-asesor-costia')).toHaveClass(/visible/);

    // Chips contextuales de productos
    const chips = page.locator('#asesor-progreso-chips button.asesor-chip');
    await expect(chips.first()).toBeVisible();
  });

  test('los chips de Crear Producto (Ingredientes, Unidades, Espacio, Luz/Gas) deben ser botones accionables', async ({ page }) => {
    await page.goto('/paginas/crear-producto.html');

    const btnFab = page.locator('#btn-fab-asesor');
    await btnFab.click();

    // Verificar que los chips mostrados en la captura son botones con data-chip-accion
    const chipIngredientes = page.locator('#asesor-progreso-chips button[data-chip-accion="ingredientes"]');
    const chipUnidades = page.locator('#asesor-progreso-chips button[data-chip-accion="unidades"]');
    const chipEspacio = page.locator('#asesor-progreso-chips button[data-chip-accion="espacio"]');
    const chipServicios = page.locator('#asesor-progreso-chips button[data-chip-accion="servicios"]');

    await expect(chipIngredientes).toBeVisible();
    await expect(chipUnidades).toBeVisible();
    await expect(chipEspacio).toBeVisible();
    await expect(chipServicios).toBeVisible();

    // Al hacer clic en Unidades, el asesor debe preguntar por el rendimiento
    await chipUnidades.click();
    const ultimoMsg = page.locator('#asesor-mensajes .asesor-msg--agente').last();
    await expect(ultimoMsg).toContainText(/Rendimiento del Lote/i);

    // Al hacer clic en una sugerencia rápida, debe responder con el nuevo valor
    const pillUnidades = ultimoMsg.locator('button[data-sugerencia*="Rinde"]').first();
    await expect(pillUnidades).toBeVisible();
    await pillUnidades.click();
  });

  test('debe estar disponible en Fichas Técnicas con botón flotante y drawer activo', async ({ page }) => {
    await page.goto('/paginas/ficha-tecnica.html');

    const btnFab = page.locator('#btn-fab-asesor');
    await expect(btnFab).toBeVisible();
    await btnFab.click();

    await expect(page.locator('#modal-asesor-costia')).toHaveClass(/visible/);
  });
});
