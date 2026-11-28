const { test, expect } = require('@playwright/test');

test.describe('Costia — Crear Receta con Despensa, Canasta y Fijación de Precios (4 Pasos)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/paginas/crear-producto.html');
  });

  test('debe cargar el Paso 1 con la despensa visual, foto opcional y canasta en 0', async ({ page }) => {
    await expect(page).toHaveTitle(/Crear producto/i);
    await expect(page.locator('#wizard-stepper')).toBeVisible();
    await expect(page.locator('#tab-paso-1')).toHaveClass(/activo/);
    await expect(page.locator('#paso-1-despensa')).toBeVisible();
    await expect(page.locator('#paso-2-insumos')).toBeHidden();
    await expect(page.locator('#paso-3-gastos')).toBeHidden();
    await expect(page.locator('#paso-4-modo')).toBeHidden();

    await expect(page.locator('#producto-nombre')).toBeVisible();
    await expect(page.locator('#producto-imagen-preview')).toBeVisible();

    const cards = page.locator('#despensa-grid .despensa-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);

    await expect(page.locator('#btn-canasta-flotante')).toBeVisible();
    await expect(page.locator('#canasta-contador')).toHaveText('0');
  });

  test('debe permitir elegir ingredientes en despensa, revisar/editar en la canasta y navegar los 4 pasos conservando datos', async ({ page }) => {
    await expect(page.locator('#resumen-producto')).toBeHidden();

    // Intentar avanzar sin elegir ingredientes debe mantener al usuario en Paso 1
    await page.locator('#btn-ir-paso-2').click();
    await expect(page.locator('#paso-1-despensa')).toBeVisible();
    await expect(page.locator('#paso-2-insumos')).toBeHidden();

    // Completar nombre y elegir 2 ingredientes en la despensa
    await page.locator('#producto-nombre').fill('Pan de Queso Artesanal');
    const cardHarina = page.locator('#despensa-grid .despensa-card').first();
    const cardMantequilla = page.locator('#despensa-grid .despensa-card').nth(2);

    await cardHarina.click();
    await expect(cardHarina).toHaveClass(/en-canasta/);
    await expect(page.locator('#canasta-contador')).toHaveText('1');

    await cardMantequilla.click();
    await expect(cardMantequilla).toHaveClass(/en-canasta/);
    await expect(page.locator('#canasta-contador')).toHaveText('2');

    // Abrir drawer de la canasta, revisar ítems y quitar el segundo
    await page.locator('#btn-canasta-flotante').click();
    const drawer = page.locator('#canasta-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('.canasta-item')).toHaveCount(2);

    await drawer.locator('.canasta-item__quitar').nth(1).click();
    await expect(drawer.locator('.canasta-item')).toHaveCount(1);
    await expect(page.locator('#canasta-contador')).toHaveText('1');

    // Continuar desde la canasta al Paso 2 (Cantidades)
    await page.locator('#btn-canasta-continuar').click();
    await expect(drawer).toBeHidden();
    await expect(page.locator('#paso-2-insumos')).toBeVisible();
    await expect(page.locator('#resumen-producto')).toBeHidden();

    await page.locator('#unidades-producidas').fill('10');
    const fila1 = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila1.locator('.fila-cantidad').fill('500');

    // Avanzar al Paso 3 (Gastos y Merma)
    await page.locator('#btn-ir-paso-3').click();
    await expect(page.locator('#paso-3-gastos')).toBeVisible();
    await expect(page.locator('#paso-2-insumos')).toBeHidden();
    await expect(page.locator('#resumen-producto')).toBeHidden();

    // Avanzar al Paso 4 (Modo de Precio y Resumen)
    await page.locator('#btn-ir-paso-4').click();
    await expect(page.locator('#paso-4-modo')).toBeVisible();
    await expect(page.locator('#paso-3-gastos')).toBeHidden();
    await expect(page.locator('#resumen-producto')).toBeVisible();

    // Devolverse al Paso 3, Paso 2 y Paso 1 conservando datos
    await page.locator('#btn-volver-paso-3').click();
    await expect(page.locator('#paso-3-gastos')).toBeVisible();

    await page.locator('#btn-volver-paso-2').click();
    await expect(page.locator('#paso-2-insumos')).toBeVisible();
    await expect(page.locator('#unidades-producidas')).toHaveValue('10');
    await expect(fila1.locator('.fila-cantidad')).toHaveValue('500');

    await page.locator('#btn-volver-paso-1').click();
    await expect(page.locator('#paso-1-despensa')).toBeVisible();
    await expect(page.locator('#producto-nombre')).toHaveValue('Pan de Queso Artesanal');
    await expect(page.locator('#canasta-contador')).toHaveText('1');

    // Añadir otro ingrediente y saltar directo al Paso 4
    await page.locator('#despensa-grid .despensa-card').nth(1).click();
    await expect(page.locator('#canasta-contador')).toHaveText('2');
    await page.locator('#tab-paso-4').click();
    await expect(page.locator('#paso-4-modo')).toBeVisible();
  });

  test('debe recomendar gastos proporcionales en Paso 3 y alertar si se ingresan gastos ilógicos (pan $300 vs gastos $4.000)', async ({ page }) => {
    await page.locator('#producto-nombre').fill('Pan sencillo');

    // Elegir Harina ($3.200/kg) en la despensa
    await page.locator('#buscar-despensa').fill('Harina');
    await page.locator('#despensa-grid .despensa-card').first().click();

    await page.locator('#btn-ir-paso-2').click();
    await page.locator('#unidades-producidas').fill('1');

    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-unidad-receta').selectOption('g');
    await fila.locator('.fila-cantidad').fill('93.75');

    await page.locator('#btn-ir-paso-3').click();
    await expect(page.locator('#card-recomendacion-gastos')).toBeVisible();
    await expect(page.locator('#gasto-ref-insumo-unidad')).toContainText('$300');
    await expect(page.locator('#rec-mano-obra-lote')).toContainText('$75');
    await expect(page.locator('#rec-empaque-unidad')).toContainText('$20');
    await expect(page.locator('#alerta-desproporcion-gastos')).toBeHidden();

    // Ingresar $4.000 de gastos sobre un pan de $300 en insumos debe disparar alerta
    await page.locator('#costo-mano-obra').fill('4000');
    await page.locator('#costo-mano-obra').dispatchEvent('input');
    await expect(page.locator('#alerta-desproporcion-gastos')).toBeVisible();

    // Corregir con un clic al gasto proporcional recomendado
    await page.locator('#btn-corregir-gasto-proporcional').click();
    await expect(page.locator('#costo-mano-obra')).toHaveValue('75');
    await expect(page.locator('#costo-empaque')).toHaveValue('20');
    await expect(page.locator('#porcentaje-merma')).toHaveValue('3');
    await expect(page.locator('#alerta-desproporcion-gastos')).toBeHidden();
  });

  test('debe recomendar Multiplicador × si no hay gastos en Paso 3 y Margen % si ya hay gastos proporcionales', async ({ page }) => {
    await page.locator('#producto-nombre').fill('Torta de chocolate');
    await page.locator('#despensa-grid .despensa-card').first().click();

    await page.locator('#btn-ir-paso-2').click();
    await page.locator('#unidades-producidas').fill('1');
    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('1000');

    // Paso 3 sin gastos adicionales -> Paso 4 debe recomendar Multiplicador ×
    await page.locator('#btn-ir-paso-3').click();
    await page.locator('#btn-ir-paso-4').click();
    await expect(page.locator('#card-recomendacion-modo')).toBeVisible();
    await expect(page.locator('#rec-modo-titulo')).toContainText(/Multiplicador/i);
    await expect(page.locator('#badge-rec-mult')).toBeVisible();

    await page.locator('#btn-aplicar-modo-recomendado').click();
    await expect(page.locator('#tab-multiplicador')).toHaveClass(/activo/);
    await expect(page.locator('#panel-multiplicador')).toBeVisible();

    // Volver al Paso 3, aplicar gastos proporcionales y volver al Paso 4 -> debe recomendar Margen %
    await page.locator('#btn-volver-paso-3').click();
    await page.locator('#btn-aplicar-gastos-recomendados').click();
    await page.locator('#btn-ir-paso-4').click();

    await expect(page.locator('#rec-modo-titulo')).toContainText(/Margen %/i);
    await expect(page.locator('#badge-rec-margen')).toBeVisible();

    await page.locator('#btn-aplicar-modo-recomendado').click();
    await expect(page.locator('#tab-margen')).toHaveClass(/activo/);
    await expect(page.locator('#panel-margen')).toBeVisible();
  });

  test('debe permitir alternar entre los modos de precio (Margen % y Multiplicador ×)', async ({ page }) => {
    await page.locator('#despensa-grid .despensa-card').first().click();
    await page.locator('#btn-ir-paso-2').click();

    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('500');
    await page.locator('#btn-ir-paso-3').click();
    await page.locator('#btn-ir-paso-4').click();

    const tabMargen = page.locator('#tab-margen');
    const tabMult = page.locator('#tab-multiplicador');
    const panelMargen = page.locator('#panel-margen');
    const panelMult = page.locator('#panel-multiplicador');

    await expect(tabMargen).toHaveClass(/activo/);
    await expect(panelMargen).toBeVisible();

    await tabMult.click();
    await expect(tabMult).toHaveClass(/activo/);
    await expect(panelMult).toBeVisible();

    await tabMargen.click();
    await expect(tabMargen).toHaveClass(/activo/);
    await expect(panelMargen).toBeVisible();
  });

  test('debe calcular costo de receta y precio de venta en tiempo real al seleccionar insumo y cantidad', async ({ page }) => {
    await page.locator('#despensa-grid .despensa-card').first().click();
    await page.locator('#btn-ir-paso-2').click();

    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('500');

    const subtotal = fila.locator('.fila-subtotal');
    await expect(subtotal).not.toContainText('$0');

    await page.locator('#btn-ir-paso-3').click();
    await page.locator('#btn-ir-paso-4').click();

    const resCosto = page.locator('#res-costo-ingredientes');
    const resPrecio = page.locator('#res-precio-venta');
    await expect(resCosto).toBeVisible();
    await expect(resCosto).not.toContainText('$0');
    await expect(resPrecio).not.toContainText('$0');
  });

  test('debe reflejar costos adicionales (merma, empaque y mano de obra) en el costo por unidad', async ({ page }) => {
    await page.locator('#despensa-grid .despensa-card').first().click();
    await page.locator('#btn-ir-paso-2').click();

    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('200');

    const costoBaseTxt = await page.locator('#costo-unidad').textContent();

    await page.locator('#btn-ir-paso-3').click();
    await page.locator('#costo-empaque').fill('800');
    await page.locator('#costo-empaque').dispatchEvent('input');

    const costoConEmpaqueTxt = await page.locator('#costo-unidad').textContent();
    expect(costoConEmpaqueTxt).not.toBe(costoBaseTxt);
  });

  test('debe validar y guardar un nuevo producto redirigiendo a la lista', async ({ page }) => {
    const nombreProducto = `Croissant Especial ${Date.now().toString().slice(-4)}`;
    await page.locator('#producto-nombre').fill(nombreProducto);
    await page.locator('#despensa-grid .despensa-card').first().click();

    await page.locator('#btn-ir-paso-2').click();
    await page.locator('#unidades-producidas').fill('6');
    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('300');

    await page.locator('#btn-ir-paso-3').click();
    await page.locator('#btn-ir-paso-4').click();

    await page.locator('.btn-guardar').click();

    await expect(page).toHaveURL(/paginas\/productos\.html/, { timeout: 10000 });
    await expect(page.locator('#productos-grid')).toContainText(nombreProducto, { timeout: 10000 });
  });

  test('debe calcular el desglose comercial con Impoconsumo (8%) y precio sugerido para Apps Delivery', async ({ page }) => {
    await page.locator('#despensa-grid .despensa-card').first().click();
    await page.locator('#btn-ir-paso-2').click();

    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('400');

    await page.locator('#btn-ir-paso-3').click();
    await page.locator('#btn-ir-paso-4').click();

    const badgeImpoconsumo = page.locator('#res-badge-impoconsumo');
    const precioDelivery = page.locator('#res-precio-delivery');
    await expect(badgeImpoconsumo).toBeVisible();
    await expect(badgeImpoconsumo).toContainText('Impoconsumo');
    await expect(precioDelivery).toBeVisible();
    await expect(precioDelivery).not.toContainText('$0');
  });

  test('debe permitir calcular costos ocultos, merma, empaque y fijar márgenes de forma manual y autónoma sin depender de la IA', async ({ page }) => {
    await page.locator('#despensa-grid .despensa-card').first().click();
    await page.locator('#btn-ir-paso-2').click();

    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('500');
    await page.locator('#btn-ir-paso-3').click();

    const btnMerma = page.locator('.costos-preset-btn[data-campo="porcentaje-merma"][data-valor="5"]');
    await expect(btnMerma).toBeVisible();
    await btnMerma.click();
    await expect(page.locator('#porcentaje-merma')).toHaveValue('5');

    const btnEmpaque = page.locator('.costos-preset-btn[data-campo="costo-empaque"][data-valor="800"]');
    await expect(btnEmpaque).toBeVisible();
    await btnEmpaque.click();
    await expect(page.locator('#costo-empaque')).toHaveValue('800');

    const btnFijos = page.locator('#btn-cargar-gastos-fijos-form');
    await expect(btnFijos).toBeVisible();
    await btnFijos.click();
    const valManoFijos = await page.inputValue('#costo-mano-obra');
    expect(parseFloat(valManoFijos)).toBeGreaterThan(0);

    const btnToggleCalc = page.locator('#btn-toggle-calc-mano-obra');
    await expect(btnToggleCalc).toBeVisible();
    await btnToggleCalc.click();

    const boxCalc = page.locator('#calc-mano-obra-box');
    await expect(boxCalc).toBeVisible();

    const pill2h = page.locator('.calc-pill[data-horas="2"]');
    await pill2h.click();

    const btnAplicarCalc = page.locator('#btn-aplicar-calc-mano-obra');
    await btnAplicarCalc.click();
    const valManoAfter = await page.inputValue('#costo-mano-obra');
    expect(parseFloat(valManoAfter)).toBeGreaterThanOrEqual(13000);

    await page.locator('#btn-ir-paso-4').click();

    const btnMargen50 = page.locator('.costos-preset-btn[data-margen="50"]');
    await expect(btnMargen50).toBeVisible();
    await btnMargen50.click();
    await expect(page.locator('#input-margen')).toHaveValue('50');

    await page.locator('#tab-multiplicador').click();
    const btnMult25 = page.locator('.costos-preset-btn[data-multiplicador="2.5"]');
    await expect(btnMult25).toBeVisible();
    await btnMult25.click();
    await expect(page.locator('#input-multiplicador')).toHaveValue('2.5');

    await expect(page.locator('#res-precio-venta')).not.toHaveText('$0');
  });

  test('en móvil compacto (360x640) los 4 pasos del wizard no deben provocar desbordamiento horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/paginas/crear-producto.html');

    const checkNoOverflow = async (paso) => {
      const diff = await page.evaluate(() => {
        return Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth;
      });
      expect(diff, `Desbordamiento detectado en Paso ${paso} a 360px`).toBeLessThanOrEqual(1.5);
    };

    await checkNoOverflow(1);

    await page.locator('#despensa-grid .despensa-card').first().click();
    await page.locator('#btn-ir-paso-2').click();
    await expect(page.locator('#paso-2-insumos')).toBeVisible();
    await checkNoOverflow(2);

    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('500');
    await page.locator('#btn-ir-paso-3').click();
    await expect(page.locator('#paso-3-gastos')).toBeVisible();
    await checkNoOverflow(3);

    await page.locator('#btn-ir-paso-4').click();
    await expect(page.locator('#paso-4-modo')).toBeVisible();
    await checkNoOverflow(4);
  });
});
