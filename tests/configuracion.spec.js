import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Costia — Estación Integral de Configuración y Advertencias Bonitas', () => {

    test('debe cargar la página de configuración con espacios amplios para hacer cambios', async ({ page }) => {
        const artifactDir = path.resolve(process.cwd(), 'test-results/visual');
        fs.mkdirSync(artifactDir, { recursive: true });
        await page.setViewportSize({ width: 1440, height: 900 });

        await page.goto('/paginas/configuracion.html');
        await page.waitForLoadState('networkidle');

        // 1. Título principal y encabezado
        await expect(page.locator('.contenido__titulo')).toHaveText('Configuración del Negocio');
        await expect(page.locator('#btn-guardar-todo-config')).toBeVisible();

        // 2. Verificar que las 6 tarjetas de espacios de configuración están presentes
        await expect(page.locator('#cfg-negocio-nombre')).toBeVisible();
        await expect(page.locator('#cfg-radio-casa')).toBeVisible();
        await expect(page.locator('#cfg-input-arriendo')).toBeVisible();
        await expect(page.locator('#cfg-input-recibos')).toBeVisible();
        await expect(page.locator('#cfg-input-trabajadores')).toBeVisible();
        await expect(page.locator('#cfg-input-salario')).toBeVisible();
        await expect(page.locator('#cfg-input-lotes-mes')).toBeVisible();
        await expect(page.locator('#kpi-cfg-nomina-total')).toBeVisible();
        await expect(page.locator('#kpi-cfg-cuota-mano')).toBeVisible();
        await expect(page.locator('#kpi-cfg-cuota-total')).toBeVisible();

        // 3. Modificar trabajadores y verificar cálculo reactivo en vivo
        await page.fill('#cfg-input-trabajadores', '3');
        await page.fill('#cfg-input-salario', '1500000');
        await page.fill('#cfg-input-lotes-mes', '100');

        // Nómina: 3 * 1.500.000 = 4.500.000 COP
        await expect(page.locator('#kpi-cfg-nomina-total')).toContainText('$4.500.000');
        await expect(page.locator('#kpi-cfg-cuota-mano')).toContainText('$45.000 / lote');

        // 4. Guardar configuración completa
        await page.fill('#cfg-negocio-nombre', 'Mekatos Gourmet');
        await page.click('#btn-guardar-todo-config');
        await page.waitForTimeout(400);

        // 5. Verificar que el modal bonito de confirmación abre al pulsar Restaurar Datos Demo
        const btnRestaurar = page.locator('#btn-cfg-restaurar-demo');
        await btnRestaurar.click();

        const modalConfirm = page.locator('#costia-confirm-modal');
        await expect(modalConfirm).toBeVisible();
        await expect(modalConfirm.locator('#costia-confirm-titulo')).toHaveText('¿Restaurar datos de demostración?');
        await expect(modalConfirm.locator('.costia-confirm-badge')).toHaveText('Restauración Demo');

        // Cancelar modal
        await modalConfirm.locator('#btn-conf-modal-cancelar').click();
        await expect(modalConfirm).toBeHidden();

        // Capturar pantalla final de la estación de configuración
        await page.screenshot({ path: path.join(artifactDir, 'check_configuracion_full.png'), fullPage: true });
        await page.screenshot({ path: path.join(artifactDir, 'check_configuracion_page.png'), fullPage: false });
    });

    test('desde el sidebar de cualquier página debe abrir Mi Negocio (configuración) con 1 clic', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto('/paginas/dashboard.html');

        const linkConfig = page.locator('#link-sidebar-config-page');
        await expect(linkConfig).toBeVisible();
        await linkConfig.click();
        await page.waitForURL('**/configuracion.html');
        expect(page.url()).toContain('configuracion.html');

        // Verificar persistencia de comisión Delivery e Impoconsumo
        await page.fill('#cfg-input-delivery-pct', '20');
        await page.check('#cfg-check-impoconsumo');
        await page.click('#btn-guardar-todo-config');
        await page.waitForTimeout(300);
        await page.reload();
        await expect(page.locator('#cfg-input-delivery-pct')).toHaveValue('20');
        await expect(page.locator('#cfg-check-impoconsumo')).toBeChecked();
    });

});
