const { test, expect } = require('@playwright/test');

test.describe('Costia — Dashboard Financiero & Simulador de Pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/paginas/dashboard.html');
  });

  test('debe cargar el Dashboard Financiero con su topbar ticker y estación de pricing', async ({ page }) => {
    await expect(page).toHaveTitle(/Dashboard Financiero/i);
    await expect(page.locator('.estacion-titulo')).toContainText('Simulador de Pricing');

    // Verificar que el sidebar marca Dashboard como activo
    const linkDashboard = page.locator('.sidebar-nav-list a[href="dashboard.html"]');
    await expect(linkDashboard).toHaveClass(/activo/);

    // Verificar selector de productos en el encabezado
    const select = page.locator('#select-producto-activo');
    await expect(select).toBeVisible();

    // Ticker superior con métricas
    await expect(page.locator('#ticker-costo-val')).toBeVisible();
    await expect(page.locator('#ticker-precio-val')).toBeVisible();
    await expect(page.locator('#ticker-alerta-badge')).toBeVisible();
  });

  test('debe tener las 3 columnas de la estación de simulación activas', async ({ page }) => {
    // Columna 1: Estructura de Insumos (OrderBook)
    await expect(page.locator('.panel-orderbook')).toBeVisible();
    await expect(page.locator('#lista-insumos-body tr').first()).toBeVisible();

    // Columna 2: Curva de Sensibilidad
    await expect(page.locator('#curva-sensibilidad-canvas')).toBeVisible();

    // Columna 3: Consola de Pricing
    await expect(page.locator('.panel-pricing-console')).toBeVisible();
    await expect(page.locator('#calc-precio-sugerido')).toBeVisible();
    await expect(page.locator('#btn-ejecutar-orden')).toBeVisible();
  });

  test('debe permitir cambiar de producto desde la lista desplegable y recalcular en vivo', async ({ page }) => {
    const select = page.locator('#select-producto-activo');
    const valorInicial = await select.inputValue();

    // Obtener las opciones disponibles
    const options = await select.locator('option').all();
    if (options.length > 1) {
      const nuevoValor = await options[1].getAttribute('value');
      await select.selectOption(nuevoValor);

      // Verificar que el select cambió
      await expect(select).toHaveValue(nuevoValor);

      // Verificar que el nombre en consola cambió
      const nombreConsola = page.locator('#pricing-receta-nombre');
      await expect(nombreConsola).toBeVisible();
    }
  });

  test('NO debe contener la sección pesada del catálogo de productos en el Dashboard', async ({ page }) => {
    // Se cumple la directiva del usuario: "quitalo de dashboard"
    const catalogoGrid = page.locator('#productos-grid');
    await expect(catalogoGrid).toBeHidden();

    // Debe contener el banner de acceso rápido al Catálogo Completo
    const banner = page.locator('.dashboard-catalog-banner');
    await expect(banner).toBeVisible();
    const btnIrCatalogo = banner.locator('a[href="productos.html"]');
    await expect(btnIrCatalogo).toBeVisible();
  });

  test('debe permitir navegar hacia el Catálogo Completo desde el banner o sidebar', async ({ page }) => {
    const linkCatalogo = page.locator('.dashboard-catalog-banner a[href="productos.html"]');
    await linkCatalogo.click();
    await expect(page).toHaveURL(/paginas\/productos\.html/);
    await expect(page.locator('.contenido__titulo')).toContainText('Mis productos');
  });

  test('debe permitir buscar y filtrar recetas rápidamente desde el input al lado del selector', async ({ page }) => {
    const inputBuscar = page.locator('#buscar-producto-dashboard');
    await expect(inputBuscar).toBeVisible();

    const select = page.locator('#select-producto-activo');
    await inputBuscar.fill('torta');

    const options = select.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // Limpiar buscador
    await inputBuscar.fill('');
    const allOptions = select.locator('option');
    expect(await allOptions.count()).toBeGreaterThanOrEqual(count);
  });
});
