const { test, expect } = require('@playwright/test');

const VIEWPORTS = [
  { name: 'Móvil Compacto (360x640)', width: 360, height: 640 },
  { name: 'iPhone SE (375x667)', width: 375, height: 667 },
  { name: 'iPhone 14 (390x844)', width: 390, height: 844 },
  { name: 'Tablet Vertical (768x1024)', width: 768, height: 1024 },
  { name: 'Laptop HD (1280x800)', width: 1280, height: 800 },
  { name: 'Desktop Full HD (1920x1080)', width: 1920, height: 1080 }
];

const APP_PAGES = [
  { name: 'Landing Page', path: '/index.html', hasShell: false },
  { name: 'Dashboard', path: '/paginas/dashboard.html', hasShell: true },
  { name: 'Catálogo de Productos', path: '/paginas/productos.html', hasShell: true },
  { name: 'Inventario de Insumos', path: '/paginas/insumos.html', hasShell: true },
  { name: 'Terminal Crear Receta', path: '/paginas/crear-producto.html', hasShell: true },
  { name: 'Fichas Técnicas', path: '/paginas/ficha-tecnica.html', hasShell: true },
  { name: 'Configuración y Gastos', path: '/paginas/configuracion.html', hasShell: true },
  { name: 'Iniciar Sesión', path: '/paginas/login.html', hasShell: false },
  { name: 'Registro Legal', path: '/paginas/registro.html', hasShell: false }
];

test.describe('Costia — Auditoría Exhaustiva de Diseño Responsive (Matriz Multi-Dispositivo)', () => {

  for (const pageInfo of APP_PAGES) {
    test.describe(`Página: ${pageInfo.name}`, () => {

      for (const vp of VIEWPORTS) {
        test(`en ${vp.name} no debe presentar scroll horizontal ni desbordamiento`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(pageInfo.path, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(200);

          // 1. Verificación de Cero Scroll Horizontal (Overflow-X)
          const overflow = await page.evaluate(() => {
            const docW = document.documentElement.scrollWidth;
            const bodyW = document.body ? document.body.scrollWidth : 0;
            const maxW = Math.max(docW, bodyW);
            const diff = maxW - window.innerWidth;

            const offenders = [];
            if (diff > 1.5) {
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const r = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                if (r.right > window.innerWidth + 1) {
                  offenders.push({
                    tag: el.tagName.toLowerCase(),
                    id: el.id,
                    className: String(el.className || '').slice(0, 50),
                    right: Math.round(r.right),
                    width: Math.round(r.width)
                  });
                }
              }
            }

            return {
              hasOverflow: diff > 1.5,
              diff,
              innerWidth: window.innerWidth,
              maxW,
              offenders: offenders.sort((a, b) => b.right - a.right).slice(0, 5)
            };
          });

          if (overflow.hasOverflow) {
            console.log(`[OFENSORES ${pageInfo.name} @ ${vp.name}]:`, JSON.stringify(overflow.offenders));
          }

          expect(overflow.hasOverflow, `Desborde detectado en ${pageInfo.name} a ${vp.name}: ancho ${overflow.maxW}px vs ventana ${overflow.innerWidth}px (+${overflow.diff}px)`).toBe(false);

          // 2. Verificación de Shell Móvil vs Desktop
          if (pageInfo.hasShell) {
            const mobileBar = page.locator('.costia-mobile-bar');
            const sidebar = page.locator('#terminal-sidebar');

            if (vp.width <= 768) {
              await expect(mobileBar, `La barra móvil debe ser visible en ${vp.name}`).toBeVisible();
              // El sidebar no debe estar ocupando espacio fijo bloqueando el contenido
              await expect(sidebar).not.toHaveClass(/drawer-abierto/);
            } else {
              await expect(mobileBar, `La barra móvil debe estar oculta en ${vp.name}`).toBeHidden();
              await expect(sidebar, `El sidebar fijo debe ser visible en ${vp.name}`).toBeVisible();
            }
          }
        });
      }

    });
  }

});
