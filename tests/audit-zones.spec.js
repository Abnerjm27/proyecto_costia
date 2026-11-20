import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = path.resolve(process.cwd(), 'test-results/visual');
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

test.describe('Auditoría Visual Integral por Zonas de Costia', () => {
    test.setTimeout(90000);

    test('Ejecutar recorrido visual, captura de cada zona y verificación de DOM', async ({ page }) => {
        await page.setViewportSize({ width: 1366, height: 850 });

        // Helper para comprobar que no existan emojis ni 'Costia Pro' visibles
        const assertCleanDOM = async (zonaName) => {
            const issues = await page.evaluate(() => {
                const results = [];
                const regexCostiaPro = /\bcostia\s*pro\b/i;
                const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/u;

                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
                let node;
                while ((node = walker.nextNode())) {
                    const parent = node.parentElement;
                    if (!parent) continue;
                    const style = window.getComputedStyle(parent);
                    if (style.display === 'none' || style.visibility === 'hidden') continue;

                    const val = node.nodeValue.trim();
                    if (!val) continue;

                    if (regexCostiaPro.test(val)) {
                        results.push(`[Costia Pro]: "${val}" en <${parent.tagName.toLowerCase()}>`);
                    }
                    if (emojiRegex.test(val)) {
                        results.push(`[Emoji]: "${val}" en <${parent.tagName.toLowerCase()}>`);
                    }
                }
                return results;
            });

            if (issues.length > 0) {
                console.warn(`Problemas visuales detectados en ${zonaName}:`, issues);
            }
            expect(issues).toEqual([]);
        };

        // 0. Sembrar datos iniciales en dashboard
        await page.goto('/paginas/dashboard.html');
        await page.waitForLoadState('networkidle');

        // 1. ZONA 1: DASHBOARD GENERAL & ESTACIÓN DE PRICING
        await assertCleanDOM('Zona 1: Dashboard');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_1_dashboard.png'), fullPage: false });

        // 2. ZONA 2: INSUMOS (LIBRO DE ÓRDENES & TABLA)
        await page.goto('/paginas/insumos.html');
        await page.waitForLoadState('networkidle');
        await assertCleanDOM('Zona 2: Insumos');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_2_insumos.png'), fullPage: false });

        // 3. ZONA 3: MODAL DE NUEVO INSUMO (GLASSMORPHISM)
        const btnNuevoInsumo = page.locator('#btn-nuevo-insumo');
        if (await btnNuevoInsumo.isVisible()) {
            await btnNuevoInsumo.click();
            await page.waitForTimeout(300);
            await assertCleanDOM('Zona 3: Modal Insumo');
            await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_3_modal_insumo.png'), fullPage: false });
            const btnCerrar = page.locator('#btn-cancelar-modal, .modal-close-btn, #btn-cerrar-modal-insumo').first();
            if (await btnCerrar.isVisible()) await btnCerrar.click();
            await page.waitForTimeout(200);
        }

        // 4. ZONA 4: PRODUCTOS & CATÁLOGO
        await page.goto('/paginas/productos.html');
        await page.waitForLoadState('networkidle');
        await assertCleanDOM('Zona 4: Productos');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_4_productos.png'), fullPage: false });

        // 5. ZONA 5: CREAR PRODUCTO (RECETA & MOTOR DE PRICING)
        await page.goto('/paginas/crear-producto.html');
        await page.waitForLoadState('networkidle');
        await assertCleanDOM('Zona 5: Crear Producto');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_5_crear_producto.png'), fullPage: false });

        // 6. ZONA 6: FICHAS TÉCNICAS (CATÁLOGO OFICIAL)
        await page.goto('/paginas/ficha-tecnica.html');
        await page.waitForLoadState('networkidle');
        await assertCleanDOM('Zona 6: Fichas Técnicas');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_6_ficha_tecnica.png'), fullPage: false });

        // 7. ZONA 7: HOJA FÍSICA IMPRIMIBLE DE FICHA TÉCNICA
        await page.goto('/paginas/ficha-preview.html?id=1');
        await page.waitForLoadState('networkidle');
        await assertCleanDOM('Zona 7: Ficha Preview Hoja');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_7_ficha_preview_hoja.png'), fullPage: false });

        // 8. ZONA 8: CONFIGURACIÓN INTEGRAL
        await page.goto('/paginas/configuracion.html');
        await page.waitForLoadState('networkidle');
        await assertCleanDOM('Zona 8: Configuración');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_8_configuracion.png'), fullPage: true });

        // 9. ZONA 9: MODAL ELEGANTE DE RESTAURAR DATOS (SIN POPUP NATIVO)
        const btnRestaurar = page.locator('#link-sidebar-restaurar-demo, #btn-restaurar-demo-config').first();
        if (await btnRestaurar.isVisible()) {
            await btnRestaurar.click();
            await page.waitForTimeout(300);
            await assertCleanDOM('Zona 9: Modal Confirmación');
            await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_9_modal_confirmacion.png'), fullPage: false });
            const btnCancel = page.locator('#btn-conf-modal-cancelar');
            if (await btnCancel.isVisible()) await btnCancel.click();
            await page.waitForTimeout(200);
        }

        // 10. ZONA 10: ASESOR IA (DRAWER ACTIVO)
        const btnAsesor = page.locator('#btn-fab-asesor, #link-sidebar-asesor').first();
        if (await btnAsesor.isVisible()) {
            await btnAsesor.click();
            await page.waitForTimeout(400);
            await assertCleanDOM('Zona 10: Asesor Drawer');
            await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit_zona_10_asesor_drawer.png'), fullPage: false });
        }
    });
});
