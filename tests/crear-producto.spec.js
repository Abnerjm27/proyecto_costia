const { test, expect } = require('@playwright/test');

test.describe('Costia — Crear Receta y Fijación de Precios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/paginas/crear-producto.html');
  });

  test('debe cargar el formulario de nuevo producto con fila inicial', async ({ page }) => {
    await expect(page).toHaveTitle(/Crear producto/i);
    await expect(page.locator('#producto-nombre')).toBeVisible();

    // Debe existir al menos una fila de receta
    const filas = page.locator('#receta-cuerpo tr.receta-fila');
    await expect(filas).toHaveCount(1);

    // Debe mostrar botón para agregar más filas
    await expect(page.locator('#btn-agregar')).toBeVisible();
  });

  test('debe permitir alternar entre los modos de precio (Margen % y Multiplicador ×)', async ({ page }) => {
    const tabMargen = page.locator('#tab-margen');
    const tabMult = page.locator('#tab-multiplicador');
    const panelMargen = page.locator('#panel-margen');
    const panelMult = page.locator('#panel-multiplicador');

    // Por defecto inicia en Margen
    await expect(tabMargen).toHaveClass(/activo/);
    await expect(panelMargen).toBeVisible();

    // Cambiar a Multiplicador
    await tabMult.click();
    await expect(tabMult).toHaveClass(/activo/);
    await expect(panelMult).toBeVisible();

    // Volver a Margen
    await tabMargen.click();
    await expect(tabMargen).toHaveClass(/activo/);
    await expect(panelMargen).toBeVisible();
  });

  test('debe calcular costo de receta y precio de venta en tiempo real al seleccionar insumo y cantidad', async ({ page }) => {
    // Seleccionar primer insumo disponible en la primera fila
    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    const selectInsumo = fila.locator('.fila-insumo');

    // Elegir la primera opción real
    await selectInsumo.selectOption({ index: 1 });

    // Modificar cantidad
    const inputCantidad = fila.locator('.fila-cantidad');
    await inputCantidad.fill('500');

    // Verificar que el subtotal de la fila se actualiza
    const subtotal = fila.locator('.fila-subtotal');
    await expect(subtotal).not.toContainText('$0');

    // Verificar que el resumen sticky calcula el costo y precio de venta
    const resCosto = page.locator('#res-costo-ingredientes');
    const resPrecio = page.locator('#res-precio-venta');
    await expect(resCosto).not.toContainText('$0');
    await expect(resPrecio).not.toContainText('$0');
  });

  test('debe reflejar costos adicionales (merma, empaque y mano de obra) en el costo por unidad', async ({ page }) => {
    // Seleccionar un insumo
    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-insumo').selectOption({ index: 1 });
    await fila.locator('.fila-cantidad').fill('200');

    const costoBaseTxt = await page.locator('#costo-unidad').textContent();

    // Agregar empaque
    await page.locator('#costo-empaque').fill('800');
    await page.locator('#costo-empaque').dispatchEvent('input');

    const costoConEmpaqueTxt = await page.locator('#costo-unidad').textContent();
    expect(costoConEmpaqueTxt).not.toBe(costoBaseTxt);
  });

  test('debe validar y guardar un nuevo producto redirigiendo a la lista', async ({ page }) => {
    const nombreProducto = `Croissant Especial ${Date.now().toString().slice(-4)}`;
    await page.locator('#producto-nombre').fill(nombreProducto);
    await page.locator('#unidades-producidas').fill('6');

    // Asignar insumo
    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-insumo').selectOption({ index: 1 });
    await fila.locator('.fila-cantidad').fill('300');

    // Guardar producto
    await page.locator('.btn-guardar').click();

    // Debe redirigir a productos.html
    await expect(page).toHaveURL(/paginas\/productos\.html/, { timeout: 10000 });

    // El nuevo producto debe figurar en el grid
    await expect(page.locator('#productos-grid')).toContainText(nombreProducto, { timeout: 10000 });
  });

  test('debe calcular el desglose comercial con Impoconsumo (8%) y precio sugerido para Apps Delivery', async ({ page }) => {
    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-insumo').selectOption({ index: 1 });
    await fila.locator('.fila-cantidad').fill('400');

    const badgeImpoconsumo = page.locator('#res-badge-impoconsumo');
    const precioDelivery = page.locator('#res-precio-delivery');
    await expect(badgeImpoconsumo).toBeVisible();
    await expect(badgeImpoconsumo).toContainText('Impoconsumo');
    await expect(precioDelivery).toBeVisible();
    await expect(precioDelivery).not.toContainText('$0');
  });

  test('debe interpretar cuando el usuario dicta ingredientes en el chat asesor y añadirlos a la receta sin confundirlos con actualización de precios', async ({ page }) => {
    // Asegurar que el asesor agente esté inicializado
    await page.waitForFunction(() => !!window.asesorAgente);
    await page.evaluate(() => {
      window.asesorAgente.abrirChat();
    });

    const modalAsesor = page.locator('#modal-asesor-costia');
    await expect(modalAsesor).toBeVisible();

    // Escribir ingredientes en el chat
    const inputChat = page.locator('#input-chat-asesor');
    await inputChat.fill('500 gramos harina , 100 gramos azucar');
    await page.locator('#form-chat-asesor').dispatchEvent('submit');

    // Verificar respuesta del agente
    const mensajes = page.locator('#asesor-mensajes');
    await expect(mensajes).toContainText('Agregué a tu receta');
    await expect(mensajes).not.toContainText('actualizarle el precio a $500');

    // Verificar que los insumos quedaron añadidos a la tabla de receta
    const filas = page.locator('#receta-cuerpo tr.receta-fila');
    await expect(filas).toHaveCount(2);

    // Subtotal no debe ser 0
    const resCosto = page.locator('#res-costo-ingredientes');
    await expect(resCosto).not.toContainText('$0');
  });

  test('debe cumplir con el diseño Costia Terminal Pro y estándares de accesibilidad WCAG AAA en el Drawer del Asesor IA', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.waitForFunction(() => !!window.asesorAgente);
    await page.evaluate(() => {
      window.__consoleErrors = [];
      window.addEventListener('error', e => window.__consoleErrors.push(e.message));
      window.asesorAgente.abrirChat();
    });

    const modalAsesor = page.locator('#modal-asesor-costia');
    await expect(modalAsesor).toBeVisible();

    // Validar WCAG AAA: Botón de voz (micrófono) >= 44px
    const btnVoz = page.locator('#btn-voz-asesor');
    const vozBox = await btnVoz.boundingBox();
    expect(vozBox).not.toBeNull();
    expect(vozBox.width).toBeGreaterThanOrEqual(44);
    expect(vozBox.height).toBeGreaterThanOrEqual(44);

    // Validar WCAG AAA: Botón de enviar chat >= 44px
    const btnEnviar = page.locator('.asesor-chat-enviar');
    const enviarBox = await btnEnviar.boundingBox();
    expect(enviarBox).not.toBeNull();
    expect(enviarBox.width).toBeGreaterThanOrEqual(44);
    expect(enviarBox.height).toBeGreaterThanOrEqual(44);

    // Validar WCAG AAA: Botón cerrar >= 44px
    const btnCerrar = page.locator('#btn-cerrar-asesor');
    const cerrarBox = await btnCerrar.boundingBox();
    expect(cerrarBox).not.toBeNull();
    expect(cerrarBox.width).toBeGreaterThanOrEqual(44);
    expect(cerrarBox.height).toBeGreaterThanOrEqual(44);

    // Enviar un mensaje de prueba para verificar burbujas
    const inputChat = page.locator('#input-chat-asesor');
    await inputChat.fill('Hola Costia');
    await page.locator('#form-chat-asesor').dispatchEvent('submit');

    // Verificar que aparece la burbuja de usuario y de agente
    await expect(page.locator('.asesor-msg--usuario').first()).toBeVisible();
    await expect(page.locator('.asesor-msg--agente').first()).toBeVisible();

    // Verificar cero errores de consola
    const browserConsoleErrors = await page.evaluate(() => window.__consoleErrors || []);
    expect(consoleErrors).toHaveLength(0);
    expect(browserConsoleErrors).toHaveLength(0);
  });

  test('debe permitir calcular costos ocultos, merma, empaque y fijar márgenes de forma manual y autónoma sin depender de la IA', async ({ page }) => {
    // 1. Presets de merma (5%)
    const btnMerma = page.locator('.costos-preset-btn[data-campo="porcentaje-merma"][data-valor="5"]');
    await expect(btnMerma).toBeVisible();
    await btnMerma.click();
    await expect(page.locator('#porcentaje-merma')).toHaveValue('5');

    // 2. Presets de empaque ($800)
    const btnEmpaque = page.locator('.costos-preset-btn[data-campo="costo-empaque"][data-valor="800"]');
    await expect(btnEmpaque).toBeVisible();
    await btnEmpaque.click();
    await expect(page.locator('#costo-empaque')).toHaveValue('800');

    // 3. Botón para cargar cuota directa desde Gastos Fijos del negocio
    const btnFijos = page.locator('#btn-cargar-gastos-fijos-form');
    await expect(btnFijos).toBeVisible();
    await btnFijos.click();
    const valManoFijos = await page.inputValue('#costo-mano-obra');
    expect(parseFloat(valManoFijos)).toBeGreaterThan(0);

    // 4. Calculadora manual detallada de Mano de Obra y Costos Ocultos
    const btnToggleCalc = page.locator('#btn-toggle-calc-mano-obra');
    await expect(btnToggleCalc).toBeVisible();
    await btnToggleCalc.click();

    const boxCalc = page.locator('#calc-mano-obra-box');
    await expect(boxCalc).toBeVisible();

    // Seleccionar pill de 2 horas en la calculadora manual
    const pill2h = page.locator('.calc-pill[data-horas="2"]');
    await pill2h.click();

    // Aplicar cálculo al lote
    const btnAplicarCalc = page.locator('#btn-aplicar-calc-mano-obra');
    await btnAplicarCalc.click();
    const valManoAfter = await page.inputValue('#costo-mano-obra');
    expect(parseFloat(valManoAfter)).toBeGreaterThanOrEqual(13000);

    // 5. Presets de Margen % (50%)
    const btnMargen50 = page.locator('.costos-preset-btn[data-margen="50"]');
    await expect(btnMargen50).toBeVisible();
    await btnMargen50.click();
    await expect(page.locator('#input-margen')).toHaveValue('50');

    // 6. Presets de Multiplicador comercial (×2.5)
    await page.locator('#tab-multiplicador').click();
    const btnMult25 = page.locator('.costos-preset-btn[data-multiplicador="2.5"]');
    await expect(btnMult25).toBeVisible();
    await btnMult25.click();
    await expect(page.locator('#input-multiplicador')).toHaveValue('2.5');

    // 7. Verificar que el resumen en vivo se calculó correctamente sin requerir chat
    await expect(page.locator('#res-precio-venta')).not.toHaveText('$0');
  });
});
