const { test, expect } = require('@playwright/test');

test.describe('Costia — Ficha Técnica de Costeo y Catálogo', () => {
  test('debe cargar la ficha técnica del primer producto con su desglose oficial en modo directo', async ({ page }) => {
    // Cargar ficha técnica con id=1 (Pan artesanal)
    await page.goto('/paginas/ficha-tecnica.html?id=1');

    await expect(page).toHaveTitle(/Ficha Técnica/i);

    // Barra superior de previsualización
    await expect(page.locator('.barra-preview')).toBeVisible();
    await expect(page.locator('.btn-preview--imprimir')).toBeVisible();
    await expect(page.locator('.btn-preview--volver')).toBeVisible();

    // Hoja física imprimible
    const hoja = page.locator('.ficha-hoja');
    await expect(hoja).toBeVisible();

    // Título del producto
    await expect(page.locator('#ficha-prod-nombre')).toContainText(/Pan artesanal/i);

    // Tabla de ingredientes
    const filasIngredientes = page.locator('#ficha-tbody-ingredientes tr');
    await expect(filasIngredientes.first()).toBeVisible();

    // Métricas clave del pie de desglose
    await expect(page.locator('#ficha-desg-costo-total')).toBeVisible();
    await expect(page.locator('#ficha-desg-precio-final')).toBeVisible();
    await expect(page.locator('#ficha-precio-delivery-header')).toBeVisible();
    await expect(page.locator('#ficha-desg-precio-delivery')).toBeVisible();
  });

  test('debe permitir regresar al catálogo de productos desde la barra de preview con id', async ({ page }) => {
    await page.goto('/paginas/ficha-tecnica.html?id=1');

    const btnVolver = page.locator('.btn-preview--volver');
    await btnVolver.click();

    await expect(page).toHaveURL(/paginas\/productos\.html/);
  });

  test('el catálogo de fichas técnicas debe mostrar la barra lateral terminal y ocultar la hoja abajo', async ({ page }) => {
    await page.goto('/paginas/ficha-tecnica.html');

    // Sidebar terminal de navegación presente
    await expect(page.locator('#terminal-sidebar')).toBeVisible();

    // Enlace activo a Fichas de Impresión
    const linkActivo = page.locator('#subnav-productos a[href="ficha-tecnica.html"].activo');
    await expect(linkActivo).toBeVisible();

    // Catálogo organizado visible
    await expect(page.locator('#seccion-catalogo-fichas')).toBeVisible();

    // La hoja física inferior NO debe estorbar abajo
    const vistaHoja = page.locator('#vista-hoja-container');
    await expect(vistaHoja).toBeHidden();

    // Debe mostrar tarjetas de fichas técnicas organizadas
    const tarjetas = page.locator('#galeria-fichas-grid .ficha-card');
    await expect(tarjetas.first()).toBeVisible();

    // Comprobar buscador en vivo
    const inputBuscar = page.locator('#input-buscar-ficha');
    await expect(inputBuscar).toBeVisible();
    await inputBuscar.fill('Torta');

    // Solo debe verse la tarjeta filtrada
    await expect(page.locator('#galeria-fichas-grid .ficha-card')).toHaveCount(1);
    await expect(page.locator('#galeria-fichas-grid .ficha-card .ficha-card__titulo')).toContainText(/Torta/i);

    // Limpiar buscador
    await inputBuscar.fill('');
    await expect(page.locator('#galeria-fichas-grid .ficha-card').first()).toBeVisible();
  });

  test('al hacer clic en Ver Ficha Técnica en el catálogo debe abrir la vista de previsualización e impresión', async ({ page }) => {
    await page.goto('/paginas/ficha-tecnica.html');

    const primeraTarjeta = page.locator('#galeria-fichas-grid .ficha-card').first();
    const btnVerFicha = primeraTarjeta.locator('.btn-abrir-ficha');
    await expect(btnVerFicha).toBeVisible();

    await btnVerFicha.click();

    // Debe navegar a ficha-preview.html?id=X
    await expect(page).toHaveURL(/paginas\/ficha-preview\.html\?id=\d+/);
    await expect(page.locator('.barra-preview')).toBeVisible();
    await expect(page.locator('.ficha-hoja')).toBeVisible();
    await expect(page.locator('#ficha-prod-nombre')).toBeVisible();

    // El botón volver regresa al catálogo de fichas
    const btnVolverCatalogo = page.locator('.btn-preview--volver');
    await btnVolverCatalogo.click();
    await expect(page).toHaveURL(/paginas\/ficha-tecnica\.html/);
  });

  test('debe cargar la vista de Catálogo Consolidado en PDF con todos los productos al usar catalogo=pdf', async ({ page }) => {
    await page.goto('/paginas/ficha-tecnica.html?catalogo=pdf');

    // La barra de preview debe estar visible con botón de imprimir y volver
    await expect(page.locator('#vista-catalogo-pdf-container')).toBeVisible();
    await expect(page.locator('#btn-imprimir-catalogo-pdf')).toBeVisible();

    // La hoja maestra debe contener el encabezado de catálogo
    const hojaMaestra = page.locator('#catalogo-imprimible-completo');
    await expect(hojaMaestra).toBeVisible();
    await expect(hojaMaestra.locator('.ficha-marca__titulo')).toContainText(/Catálogo Oficial de Productos/i);

    // Debe contener la tabla de resumen ejecutivo con los productos
    const tablaResumen = hojaMaestra.locator('.catalogo-pdf-tabla-resumen');
    await expect(tablaResumen).toBeVisible();
    const cantFilas = await tablaResumen.locator('tbody tr').count();
    expect(cantFilas).toBeGreaterThanOrEqual(2);

    // Debe contener las fichas técnicas individuales de cada producto
    const fichasDetalladas = hojaMaestra.locator('.catalogo-pdf-card');
    const cantFichas = await fichasDetalladas.count();
    expect(cantFichas).toBeGreaterThanOrEqual(2);
    await expect(fichasDetalladas.first().locator('.catalogo-pdf-card__nombre')).toContainText(/Pan artesanal/i);
    await expect(fichasDetalladas.nth(1).locator('.catalogo-pdf-card__nombre')).toContainText(/Torta de chocolate/i);
  });
});
