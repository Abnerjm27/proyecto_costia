const { test, expect } = require('@playwright/test');

test.describe('Costia — Verificación de Responsividad y Shell Móvil', () => {
    
    test('en Escritorio (1280x800): la barra móvil está oculta, el sidebar visible sin botón cerrar, y el skip link fuera de pantalla', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/paginas/productos.html');

        // Barra móvil debe estar oculta
        const mobileBar = page.locator('.costia-mobile-bar');
        await expect(mobileBar).toBeHidden();

        // Botón cerrar sidebar debe estar oculto en escritorio
        const closeBtn = page.locator('#btn-sidebar-close');
        await expect(closeBtn).toBeHidden();

        // Sidebar debe estar visible
        const sidebar = page.locator('#terminal-sidebar');
        await expect(sidebar).toBeVisible();

        // Skip link no debe estar en la parte visible
        const skipLinkBox = await page.locator('.costia-skip-link').boundingBox();
        expect(skipLinkBox.y).toBeLessThan(0);

        // Sin scroll horizontal
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
    });

    test('en Móvil (375x667): la barra móvil está visible, el sidebar inicia cerrado y abre con el botón hamburguesa', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/paginas/productos.html');

        // Barra móvil debe ser visible
        const mobileBar = page.locator('.costia-mobile-bar');
        await expect(mobileBar).toBeVisible();

        // Botón toggle móvil debe ser visible
        const toggleBtn = page.locator('#btn-mobile-sidebar-toggle');
        await expect(toggleBtn).toBeVisible();

        // Al hacer clic en toggle, el sidebar se abre
        await toggleBtn.click();
        const sidebar = page.locator('#terminal-sidebar');
        await expect(sidebar).toHaveClass(/drawer-abierto/);

        // Backdrop debe activarse
        const backdrop = page.locator('#costia-drawer-backdrop');
        await expect(backdrop).toHaveClass(/activo/);

        // Botón cerrar debe ser visible y cerrar el drawer
        const closeBtn = page.locator('#btn-sidebar-close');
        await expect(closeBtn).toBeVisible();
        await closeBtn.click();
        await expect(sidebar).not.toHaveClass(/drawer-abierto/);

        // Sin scroll horizontal en móvil
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
    });

    test('en Tablet (768x1024): sin scroll horizontal y estructura fluida', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/paginas/productos.html');

        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
    });

    test('en Escritorio (PC): el sidebar permanece 100% fijo verticalmente al hacer scroll y no deja espacio blanco', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/paginas/crear-producto.html');

        // Posición inicial del sidebar
        const sb = page.locator('#terminal-sidebar');
        await expect(sb).toBeVisible();
        const initialBox = await sb.boundingBox();
        expect(initialBox.x).toBe(0);
        expect(initialBox.y).toBe(0);
        expect(initialBox.height).toBe(800);

        // Hacer scroll de 600px en la página
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(250);

        // El sidebar debe seguir en y: 0 y altura de 800px sin moverse ni dejar hueco
        const scrolledBox = await sb.boundingBox();
        expect(scrolledBox.x).toBe(0);
        expect(scrolledBox.y).toBe(0);
        expect(scrolledBox.height).toBe(800);

        // Sin scroll horizontal
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
    });
});
