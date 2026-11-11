import { test } from '@playwright/test';
import path from 'path';

test('Capturar pantallas completas de validación visual', async ({ page }) => {
    test.setTimeout(45000);
    const artifactDir = 'C:/Users/abner/.gemini/antigravity/brain/17c7b45b-a242-4611-9dd8-c079375806d4';

    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Dashboard en Modo Claro
    await page.goto('/paginas/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(artifactDir, 'check_dashboard.png'), fullPage: false });
    const orderbookEl = page.locator('.panel-orderbook');
    const pricingConsoleEl = page.locator('.panel-pricing-console');
    if (await orderbookEl.isVisible()) {
        await orderbookEl.screenshot({ path: path.join(artifactDir, 'check_dashboard_light_orderbook.png') });
    }
    if (await pricingConsoleEl.isVisible()) {
        await pricingConsoleEl.screenshot({ path: path.join(artifactDir, 'check_pricing_console_light.png') });
    }

    // 1b. Dashboard en Modo Oscuro
    await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-mode');
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactDir, 'check_dashboard_dark.png'), fullPage: false });
    if (await orderbookEl.isVisible()) {
        await orderbookEl.screenshot({ path: path.join(artifactDir, 'check_dashboard_dark_orderbook.png') });
    }
    if (await pricingConsoleEl.isVisible()) {
        await pricingConsoleEl.screenshot({ path: path.join(artifactDir, 'check_pricing_console_dark.png') });
    }
    // Restaurar a claro
    await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-mode');
    });
    await page.waitForTimeout(300);

    // 2. Crear Producto (verificar que no hay espacio blanco gigante a la izquierda)
    await page.goto('/paginas/crear-producto.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(artifactDir, 'check_crear_producto.png'), fullPage: false });

    // 3. Asesor modal abierto en crear producto para verificar chips (sin ○)
    const btnAsesor = page.locator('#btn-abrir-asesor-global, #link-sidebar-asesor, #btn-asesor-flotante').first();
    if (await btnAsesor.isVisible()) {
        await btnAsesor.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(artifactDir, 'check_asesor_chips.png'), fullPage: false });
        const btnCerrarAsesor = page.locator('#btn-cerrar-asesor-costia');
        if (await btnCerrarAsesor.isVisible()) await btnCerrarAsesor.click();
    }

    // 4. Insumos
    await page.goto('/paginas/insumos.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(artifactDir, 'check_insumos.png'), fullPage: false });

    // 5. Productos
    await page.goto('/paginas/productos.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(artifactDir, 'check_productos.png'), fullPage: false });

    // 6. Ficha técnica
    await page.goto('/paginas/ficha-tecnica.html');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(artifactDir, 'check_ficha_tecnica.png'), fullPage: false });

    // 7. Submenú Configuración unificado y Modal elegante de confirmación de restauración
    const cfgToggle = page.locator('#sidebar-config-toggle');
    if (await cfgToggle.isVisible()) {
        await cfgToggle.click();
        await page.waitForTimeout(300);
        await page.locator('#terminal-sidebar').screenshot({ path: path.join(artifactDir, 'check_sidebar_config_subnav.png') });
        const btnDemo = page.locator('#link-sidebar-restaurar-demo');
        if (await btnDemo.isVisible()) {
            await btnDemo.click();
            await page.waitForTimeout(400);
            await page.screenshot({ path: path.join(artifactDir, 'check_confirm_modal.png'), fullPage: false });
            const btnCancelar = page.locator('#btn-conf-modal-cancelar');
            if (await btnCancelar.isVisible()) await btnCancelar.click();
        }
    }
});
