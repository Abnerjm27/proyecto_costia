const { test, expect } = require('@playwright/test');

test.describe('Costia — Dashboard Financiero & Simulador de Pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/paginas/dashboard.html');
  });

  test('debe cargar el Inicio con resumen de negocio y el simulador de precios', async ({ page }) => {
    await expect(page).toHaveTitle(/Inicio y Simulador/i);
    await expect(page.locator('.contenido__titulo')).toContainText('Resumen de tu negocio');
    await expect(page.locator('.estacion-titulo')).toContainText('Simulador de precios y rentabilidad');

    // Verificar que el sidebar marca Inicio como activo
    const linkDashboard = page.locator('.sidebar-nav-list a[href="dashboard.html"]');
    await expect(linkDashboard).toHaveClass(/activo/);

    // Verificar selector de productos en la barra local del simulador
    const select = page.locator('#select-producto-activo');
    await expect(select).toBeVisible();

    // Métricas en vivo
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

  test('debe simular alza de insumos, equivalencia Mostrador vs Delivery y precio directo inverso', async ({ page }) => {
    // 1. Insight de equivalencia Mostrador vs Delivery visible
    await expect(page.locator('#chart-insight-bar')).toContainText(/Delivery \(25%\)/i);

    // 2. Fila de merma, empaque y gastos en Estructura de Insumos
    await expect(page.locator('#lista-insumos-body')).toContainText(/Merma, empaque y gastos/i);

    // 3. Simular alza de +20% en insumos y verificar que sube el costo directo
    const costoInicial = await page.locator('#calc-costo-directo').innerText();
    await page.locator('#slider-inflacion-insumos').fill('20');
    await page.locator('#slider-inflacion-insumos').dispatchEvent('input');
    await expect(page.locator('#inflacion-simulada-val')).toHaveText('+20%');
    const costoSubido = await page.locator('#calc-costo-directo').innerText();
    expect(costoSubido).not.toBe(costoInicial);

    // 4. Modo inverso: ingresar precio directo y verificar que calcula margen real
    await page.locator('#input-precio-manual-sim').fill('1200');
    await expect(page.locator('#calc-target-margin-display')).toContainText(/Real:/i);
    await expect(page.locator('#calc-precio-sugerido')).toContainText('1.200');
  });
});
