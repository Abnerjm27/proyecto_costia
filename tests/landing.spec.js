const { test, expect } = require('@playwright/test');

test.describe('Costia — Landing Page & Simulador', () => {
  test('debe cargar la landing page con el título y elementos principales', async ({ page }) => {
    await page.goto('/');

    // Verificar título
    await expect(page).toHaveTitle(/Costia/i);

    // Verificar marca y navegación
    await expect(page.locator('.navbar .marca-nombre')).toContainText('Costia');
    await expect(page.locator('.nav-link-login')).toBeVisible();
    await expect(page.locator('.btn-atelier-primario').first()).toBeVisible();

    // Verificar titulares del Hero
    await expect(page.locator('.hero-titulo')).toContainText('El arte de producir merece');
  });

  test('debe navegar correctamente al catálogo y a login desde la landing', async ({ page }) => {
    await page.goto('/');

    // Probar enlace a catálogo demo
    const btnDemo = page.locator('a[href="paginas/productos.html"]').first();
    await expect(btnDemo).toBeVisible();

    // Probar enlace a login
    const linkLogin = page.locator('.nav-link-login');
    await linkLogin.click();
    await expect(page).toHaveURL(/paginas\/login\.html/);
  });

  test('debe interactuar con la Mesa de Costeo interactiva y alternar recetas', async ({ page }) => {
    await page.goto('/');

    const recetaNombre = page.locator('#mesa-receta-nombre');
    await expect(recetaNombre).toBeVisible();

    // Cambiar a Torta Cacao 70%
    const tabTorta = page.locator('button.hero-receta-tab[data-receta="torta"]');
    await tabTorta.click();
    await expect(tabTorta).toHaveClass(/activo/);
    await expect(recetaNombre).toContainText(/Torta/i);

    // Cambiar a Café & Alfajor
    const tabCafe = page.locator('button.hero-receta-tab[data-receta="cafe"]');
    await tabCafe.click();
    await expect(tabCafe).toHaveClass(/activo/);
    await expect(recetaNombre).toContainText(/Café|Alfajor/i);

    // Volver a Pan
    const tabPan = page.locator('button.hero-receta-tab[data-receta="pan"]');
    await tabPan.click();
    await expect(tabPan).toHaveClass(/activo/);
    await expect(recetaNombre).toContainText(/Pan/i);
  });

  test('debe responder a los controles de simulación (stepper, costo y margen)', async ({ page }) => {
    await page.goto('/');

    const inputUnidades = page.locator('#sim-unidades');
    const btnMas = page.locator('#btn-unidades-mas');
    const btnMenos = page.locator('#btn-unidades-menos');

    const valorInicial = parseInt(await inputUnidades.inputValue(), 10);

    // Aumentar unidades con el stepper
    await btnMas.click();
    expect(parseInt(await inputUnidades.inputValue(), 10)).toBe(valorInicial + 1);

    // Reducir unidades con el stepper
    await btnMenos.click();
    expect(parseInt(await inputUnidades.inputValue(), 10)).toBe(valorInicial);

    // Cambiar slider de margen
    const sliderMargen = page.locator('#sim-margen');
    await sliderMargen.fill('50');
    await sliderMargen.dispatchEvent('input');
    await expect(page.locator('#sim-margen-display')).toContainText('50%');
  });

  test('debe mostrar el aviso de cookies técnicas y permitir aceptarlo', async ({ page }) => {
    await page.goto('/');

    const banner = page.locator('#banner-cookies');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('cookies técnicas indispensables');

    const btnAceptar = page.locator('#btn-aceptar-cookies');
    await btnAceptar.click();
    await expect(banner).toBeHidden();
  });
});
