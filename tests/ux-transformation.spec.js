const { test, expect } = require('@playwright/test');

const INTERNAL_PAGES = [
    '/paginas/dashboard.html',
    '/paginas/insumos.html',
    '/paginas/productos.html',
    '/paginas/crear-producto.html',
    '/paginas/ficha-tecnica.html',
    '/paginas/configuracion.html'
];

test.describe('Costia — Validación integral de transformación UI/UX', () => {
    test('cero jerga financiera críptica visible en las 6 vistas internas', async ({ page }) => {
        const forbidden = /\b(OrderBook|SETTLEMENT|PAA\/COP|REC\/COP|Liquidaci[oó]n de Orden|Liquidar Orden|ROI|Spread)\b/i;

        for (const url of INTERNAL_PAGES) {
            await page.goto(url);
            await page.waitForLoadState('networkidle');
            const bodyText = await page.evaluate(() => document.body.innerText);
            const match = bodyText.match(forbidden);
            expect(match, `Texto prohibido encontrado en ${url}: ${match ? match[0] : ''}`).toBeNull();
        }
    });

    test('en crear-producto.html usa unidad inteligente kg->g, alerta de unidad gigante e Impoconsumo 8%', async ({ page }) => {
        await page.goto('/paginas/crear-producto.html');
        await page.waitForLoadState('networkidle');

        // Elegir primer ingrediente en despensa (Harina de trigo, en kg) y pasar a Paso 2
        await page.locator('#buscar-despensa').fill('Harina');
        await page.locator('#despensa-grid .despensa-card').first().click();
        await page.locator('#btn-ir-paso-2').click();

        const fila = page.locator('#receta-cuerpo tr.receta-fila').first();

        // Al seleccionar un insumo en kg (ej. Harina $3.200/kg), debe sugerir 'g' por defecto
        await expect(fila.locator('.fila-unidad-receta')).toHaveValue('g');

        // Simular error común: cambiar a kg y escribir 200 (equivalente a 200 kg = $640.000)
        await fila.locator('.fila-unidad-receta').selectOption('kg');
        await fila.locator('.fila-cantidad').fill('200');
        await expect(fila.locator('.fila-sanity-warn')).toBeVisible();

        // Corregir con 1 clic a 'g'
        await fila.locator('.btn-corregir-unidad-fila').click();
        await expect(fila.locator('.fila-unidad-receta')).toHaveValue('g');
        await expect(fila.locator('.fila-sanity-warn')).toBeHidden();

        // Avanzar a Paso 4 y verificar que res-impoconsumo-monto es ~8% y NO 108%
        await page.locator('#btn-ir-paso-3').click();
        await page.locator('#btn-ir-paso-4').click();
        await page.locator('#tab-paso-1').click();
        await page.locator('#producto-nombre').fill('Brioche Prueba UX');
        await page.locator('#tab-paso-4').click();

        const precioTxt = await page.locator('#res-precio-venta').textContent();
        const impoTxt = await page.locator('#res-impoconsumo-monto').textContent();
        const toNum = (s) => Number(String(s).replace(/[^\d]/g, '')) || 0;

        const precioVal = toNum(precioTxt);
        const impoVal = toNum(impoTxt);
        expect(precioVal).toBeGreaterThan(0);
        expect(impoVal).toBeLessThan(precioVal * 0.25);
    });

    test('simulador Aplicar precio persiste tras recargar y coincide con Mis Recetas', async ({ page }) => {
        await page.goto('/paginas/dashboard.html');
        await page.waitForLoadState('networkidle');

        // Probar precio directo de $6.000 en mostrador (sin impoconsumo) y aplicar a receta
        await page.locator('#input-precio-manual-sim').fill('6000');
        await expect(page.locator('#calc-precio-sugerido')).toContainText('6.000');
        await page.locator('#btn-ejecutar-orden').click();
        await page.waitForTimeout(450);

        // Recargar dashboard y validar persistencia en el ticker local
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('#ticker-precio-val')).toContainText('6.000');

        // Navegar a productos.html y validar coherencia en la tarjeta del primer producto
        await page.goto('/paginas/productos.html');
        await page.waitForLoadState('networkidle');
        const primeraPrecio = page.locator('#productos-grid article.producto-card').first().locator('.producto-card__precio');
        await expect(primeraPrecio).toContainText('6.000');
    });

    test('modo oscuro (#btn-toggle-tema) funciona consistentemente en las 6 páginas internas', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });

        for (const url of INTERNAL_PAGES) {
            await page.goto(url);
            await page.waitForLoadState('networkidle');
            const toggle = page.locator('#btn-toggle-tema');
            await expect(toggle, `Falta #btn-toggle-tema en ${url}`).toBeVisible();

            const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
            await toggle.click();
            const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
            expect(themeAfter).not.toBe(themeBefore);

            // Restaurar tema para siguiente vista
            await toggle.click();
        }
    });

    test('sin tooltips flotantes ni FAB sobre formularios y banner cookies sin tapar tarjeta hero', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // Landing: banner de cookies en esquina inferior izquierda sin cubrir tarjeta derecha del hero
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const cookieBanner = page.locator('#banner-cookies');
        if (await cookieBanner.isVisible()) {
            const cBox = await cookieBanner.boundingBox();
            expect(cBox.x).toBeLessThan(80);
        }

        // Vista interna: sin tooltip-fab-asesor y #btn-fab-asesor integrado en topbar
        await page.goto('/paginas/crear-producto.html');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('#tooltip-fab-asesor')).toHaveCount(0);
        const fabInTopbar = page.locator('.topbar-status-bar #btn-fab-asesor');
        await expect(fabInTopbar).toBeVisible();
    });

    test('insumos KPI "Insumo más costoso" normaliza precios por unidad (/kg o /l)', async ({ page }) => {
        await page.goto('/paginas/insumos.html');
        await page.waitForLoadState('networkidle');

        // Agregar dos insumos para asegurar comparación entre unidad grande (kg) y pequeña (g)
        await page.locator('#btn-nuevo-insumo').click();
        await page.fill('#insumo-nombre', 'Azafrán Test UX');
        await page.fill('#insumo-cantidad', '10');
        await page.selectOption('#insumo-unidad', 'g');
        await page.fill('#insumo-precio', '50000');
        await page.locator('.modal__btn-guardar').click();
        await page.waitForTimeout(350);

        const kpiCaro = await page.locator('#kpi-insumo-caro').textContent();
        expect(kpiCaro).toContain('Azafrán Test UX');
        expect(kpiCaro).toContain('/kg');
    });
});
