const { test, expect } = require('@playwright/test');

test.describe('Costia — Configuración de Gastos Fijos, Trabajadores y Salarios', () => {
  test('debe permitir configurar número de trabajadores, salarios y calcular en vivo la cuota para productos', async ({ page }) => {
    await page.goto('/paginas/dashboard.html');

    // Abrir modal de gastos fijos
    await page.evaluate(() => Store.abrirModalConfigGastos());
    const modal = page.locator('#modal-config-gastos');
    await expect(modal).toBeVisible();

    // Inputs de trabajadores y salarios
    const inputTrab = modal.locator('#cfg-input-trabajadores');
    const inputSal = modal.locator('#cfg-input-salario');
    const inputLotes = modal.locator('#cfg-input-lotes-mes');
    const inputArriendo = modal.locator('#cfg-input-arriendo');
    const inputRecibos = modal.locator('#cfg-input-recibos');

    await expect(inputTrab).toBeVisible();
    await expect(inputSal).toBeVisible();
    await expect(inputLotes).toBeVisible();

    // Asignar 2 trabajadores a $1.500.000 cada uno y 100 lotes al mes
    await inputArriendo.fill('1200000');
    await inputRecibos.fill('180000');
    await inputTrab.fill('2');
    await inputSal.fill('1500000');
    await inputLotes.fill('100');

    // Disparar evento input para recálculo
    await inputSal.dispatchEvent('input');

    // Verificar cálculo automático en vivo:
    // Nómina = 2 * 1.500.000 = $3.000.000
    // Mano de obra por lote = $3.000.000 / 100 = $30.000
    // Total Fijo = 1.200.000 + 180.000 + 3.000.000 = $4.380.000
    // Cuota Fija total por lote = $4.380.000 / 100 = $43.800
    const badgeNomina = modal.locator('#cfg-badge-nomina');
    await expect(badgeNomina).toContainText('$3.000.000');

    const dispMano = modal.locator('#cfg-disp-cuota-mano');
    await expect(dispMano).toContainText('$30.000');

    const dispTotal = modal.locator('#cfg-disp-cuota-total');
    await expect(dispTotal).toContainText('$43.800');

    // Guardar configuración
    await modal.locator('#btn-guardar-config-gastos').click();
    await expect(modal).toBeHidden();

    // Verificar en Crear Producto que se cargue la cuota calculada en el Paso 3
    await page.goto('/paginas/crear-producto.html');
    await page.locator('#despensa-grid .despensa-card').first().click();
    await page.locator('#btn-ir-paso-2').click();
    const fila = page.locator('#receta-cuerpo tr.receta-fila').first();
    await fila.locator('.fila-cantidad').fill('500');
    await page.locator('#btn-ir-paso-3').click();

    const btnCargarFijos = page.locator('#btn-cargar-gastos-fijos-form');
    await expect(btnCargarFijos).toBeVisible();
    await btnCargarFijos.click();

    const inputManoObra = page.locator('#costo-mano-obra');
    await expect(inputManoObra).toHaveValue('43800');
  });
});
