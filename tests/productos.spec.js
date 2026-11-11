const { test, expect } = require('@playwright/test');

test.describe('Costia — Catálogo de Productos y Precios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/paginas/productos.html');
  });

  test('debe cargar la vista de productos con sus KPIs y tarjetas', async ({ page }) => {
    await expect(page).toHaveTitle(/Mis productos/i);
    await expect(page.locator('.contenido__titulo')).toContainText('Mis productos');

    // Verificar KPIs de productos
    const kpiTotal = page.locator('#kpi-prod-total');
    await expect(kpiTotal).toBeVisible();
    await expect(kpiTotal).toContainText(/activo/i);

    // Verificar tarjetas de productos en el grid
    const cards = page.locator('#productos-grid article.producto-card');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('debe permitir buscar productos por nombre', async ({ page }) => {
    const buscador = page.locator('#buscar-producto');
    await buscador.fill('Pan artesanal');

    const cards = page.locator('#productos-grid article.producto-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator('.producto-card__nombre')).toContainText('Pan artesanal');

    // Restaurar
    await buscador.fill('');
    const allCards = page.locator('#productos-grid article.producto-card');
    expect(await allCards.count()).toBeGreaterThan(1);
  });

  test('debe filtrar productos por modo de fijación de precio (Margen vs Multiplicador)', async ({ page }) => {
    // Filtrar por Margen %
    const pillMargen = page.locator('.filtro-pill[data-filtro="margen"]');
    await pillMargen.click();
    await expect(pillMargen).toHaveClass(/activo/);

    const badgesMargen = page.locator('#productos-grid .producto-card__modo');
    const textMargen = await badgesMargen.allTextContents();
    for (const t of textMargen) {
      expect(t).toMatch(/Margen/i);
    }

    // Filtrar por Multiplicador ×
    const pillMult = page.locator('.filtro-pill[data-filtro="multiplicador"]');
    await pillMult.click();
    await expect(pillMult).toHaveClass(/activo/);

    const badgesMult = page.locator('#productos-grid .producto-card__modo');
    const textMult = await badgesMult.allTextContents();
    for (const t of textMult) {
      expect(t).toMatch(/×/);
    }
  });

  test('debe tener enlace activo hacia la creación de nuevo producto', async ({ page }) => {
    const btnNuevo = page.locator('a[href="crear-producto.html"]').first();
    await expect(btnNuevo).toBeVisible();
    await btnNuevo.click();
    await expect(page).toHaveURL(/paginas\/crear-producto\.html/);
  });

  test('cada tarjeta de producto debe contener desglose de costos y enlace a ficha técnica', async ({ page }) => {
    const primeraCard = page.locator('#productos-grid article.producto-card').first();
    await expect(primeraCard.locator('.producto-card__costo')).toBeVisible();
    await expect(primeraCard.locator('.producto-card__precio')).toBeVisible();
    await expect(primeraCard.locator('.btn-ficha')).toBeVisible();
  });

  test('debe tener visible el botón para exportar catálogo en PDF', async ({ page }) => {
    const btnExportar = page.locator('#btn-exportar-backup');
    await expect(btnExportar).toBeVisible();
    await expect(btnExportar).toContainText('Exportar catálogo (PDF)');
  });
});
