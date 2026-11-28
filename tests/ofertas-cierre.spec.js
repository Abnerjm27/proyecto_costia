const { test, expect } = require('@playwright/test');

test.describe('Costia — Ofertas de Cierre y Vitrina Pública', () => {
  test('navegación integrada en landing y barra lateral interna', async ({ page }) => {
    await page.goto('/index.html');
    const linkVitrina = page.locator('.nav-links a[href="paginas/vitrina.html"]');
    await expect(linkVitrina).toBeVisible();
    await expect(linkVitrina).toContainText('Ofertas de cierre');

    await page.goto('/paginas/dashboard.html');
    const linkSidebar = page.locator('#terminal-sidebar a[href="ofertas-cierre.html"]');
    await expect(linkSidebar).toBeVisible();
    await expect(linkSidebar).toContainText('Ofertas Cierre');
  });

  test('flujo negocio: calcula piso de costo, bloquea sin declaración sanitaria, publica, descuenta y retira', async ({ page }) => {
    await page.goto('/paginas/ofertas-cierre.html');
    await expect(page.locator('#calc-precio-regular')).not.toHaveText('$0', { timeout: 10000 });

    // Verificar cálculo de costo mínimo, precio regular y precio sugerido
    await expect(page.locator('#calc-precio-regular')).not.toHaveText('$0');
    await expect(page.locator('#calc-costo-unidad')).not.toHaveText('$0');
    await expect(page.locator('#calc-precio-sugerido')).not.toHaveText('$0');

    // Verificar fotografía sugerida cargada y cambio suave al cambiar receta
    const fotoPreview = page.locator('#oferta-foto-preview');
    await expect(fotoPreview).toBeVisible();
    await expect(fotoPreview).toHaveAttribute('src', /pan-artesanal\.png/);
    const nwInicial = await fotoPreview.evaluate((el) => el.complete && el.naturalWidth > 0);
    expect(nwInicial).toBe(true);

    // Seleccionar Torta de chocolate (índice 1) y aplicar precio sugerido
    await page.locator('#oferta-receta').selectOption({ index: 1 });
    await expect(fotoPreview).toHaveAttribute('src', /torta-chocolate\.png/);
    await page.locator('#btn-usar-sugerido').click();
    await expect(page.locator('#calc-feedback')).toHaveClass(/calculo-feedback--ok/);

    // Verificar alerta cuando el precio queda por debajo del costo unitario
    await page.locator('#oferta-precio').fill('100');
    await expect(page.locator('#calc-feedback')).toHaveClass(/calculo-feedback--warn/);

    // Verificar campo de precio real en mostrador y bloqueo si el descuento es < 15%
    const inputRegular = page.locator('#oferta-precio-regular');
    await expect(inputRegular).toBeVisible();
    const regularActual = Number(await inputRegular.inputValue());
    expect(regularActual).toBeGreaterThan(0);

    await page.locator('#oferta-precio').fill(String(Math.round(regularActual * 0.95)));
    await expect(page.locator('#calc-feedback')).toHaveClass(/calculo-feedback--error/);
    await page.locator('#oferta-declaracion').check();
    await page.locator('#btn-publicar-oferta').click();
    const formErr = page.locator('#oferta-form-error');
    await expect(formErr).toBeVisible();
    await expect(formErr).toContainText(/15% de descuento real/i);

    // Volver al sugerido y desmarcar para probar bloqueo de declaración sanitaria
    await page.locator('#oferta-declaracion').uncheck();
    await page.locator('#btn-usar-sugerido').click();
    await page.locator('#oferta-unidades').fill('4');

    // Intentar publicar SIN aceptar declaración sanitaria
    await page.locator('#btn-publicar-oferta').click();
    await expect(formErr).toBeVisible();
    await expect(formErr).toContainText(/declaración sanitaria/i);

    // Marcar declaración sanitaria y publicar
    await page.locator('#oferta-declaracion').check();
    await page.locator('#btn-publicar-oferta').click();
    await expect(formErr).toBeHidden();

    // Debe aparecer en la lista de ofertas publicadas y actualizar KPIs
    const primeraOferta = page.locator('#mis-ofertas-lista article.mi-oferta-card').first();
    await expect(primeraOferta).toBeVisible();
    await expect(primeraOferta).toContainText('4 u.');
    await expect(page.locator('#kpi-ofertas-activas')).toContainText('1 activa');
    await expect(page.locator('#kpi-unidades-vitrina')).toContainText('4 unidades');

    // Descontar 1 unidad vendida
    await primeraOferta.locator('button[data-oferta-accion="descontar"]').click();
    await expect(primeraOferta).toContainText('3 u.');
    await expect(page.locator('#kpi-unidades-vitrina')).toContainText('3 unidades');

    // Retirar oferta manualmente
    await primeraOferta.locator('button[data-oferta-accion="retirar"]').click();
    await expect(primeraOferta).toContainText('Retirada');
    await expect(page.locator('#kpi-ofertas-activas')).toContainText('0 activas');
  });

  test('modo oscuro alterna correctamente en ofertas-cierre.html', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/paginas/ofertas-cierre.html');

    const toggle = page.locator('#btn-toggle-tema');
    await expect(toggle).toBeVisible({ timeout: 10000 });
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
    await toggle.click();
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
    expect(after).not.toBe(before);
    await toggle.click();
  });

  test('flujo comprador en vitrina pública: sin login, portal de contacto, filtros, privacidad y reporte inmediato', async ({ page }) => {
    await page.goto('/paginas/vitrina.html');

    // Aviso legal de Portal de Contacto visible
    const banner = page.locator('.vitrina-escudo-banner');
    await expect(banner).toBeVisible({ timeout: 10000 });
    await expect(banner).toContainText('Portal de Contacto (Art. 53, Ley 1480 de 2011)');
    await expect(banner).toContainText('100% inocuos');

    // Verificar ofertas iniciales visibles con foto limpia (solo imagen + 1 badge de ahorro)
    const cards = page.locator('#vitrina-grid article.vitrina-card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    const totalInicial = await cards.count();
    expect(totalInicial).toBeGreaterThanOrEqual(3);

    const primeraImg = cards.first().locator('img.vitrina-card__img');
    await expect(primeraImg).toBeVisible();
    const imgCargada = await primeraImg.evaluate((el) => el.complete && el.naturalWidth > 0);
    expect(imgCargada).toBe(true);
    await expect(cards.first().locator('.vitrina-card__media > *')).toHaveCount(2);
    await expect(cards.first().locator('.vitrina-card__media .vitrina-ahorro-float')).toBeVisible();

    // Verificar privacidad estricta: ningún costo unitario expuesto en el DOM ni en el estado público
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toMatch(/costo unitario|costo_unitario/i);
    const hasCostoPrivado = await page.evaluate(() => {
      return (window.vitrinaCtrl?.ofertas || []).some((o) => Object.prototype.hasOwnProperty.call(o, 'costo_unitario'));
    });
    expect(hasCostoPrivado).toBe(false);

    // Filtrar por categoría Pastelería
    await page.locator('#vitrina-filtros button[data-cat="pasteleria"]').click();
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Galletas de avena');

    // Volver a Todas
    await page.locator('#vitrina-filtros button[data-cat="todas"]').click();
    await expect(cards).toHaveCount(totalInicial);

    // Abrir modal "Ver cómo recoger" y verificar aviso de derechos del consumidor
    const primeraCard = cards.first();
    await expect(primeraCard).toContainText('Precio regular en local declarado por el comercio');
    const tituloPrimera = (await primeraCard.locator('.vitrina-card__producto').textContent()).trim();
    await primeraCard.locator('button[data-vitrina-accion="recoger"]').click();

    const modalRecogida = page.locator('#modal-recogida');
    await expect(modalRecogida).toBeVisible();
    await expect(modalRecogida).toContainText(tituloPrimera);
    await expect(modalRecogida).toContainText('precio regular declarado por el comercio');
    await expect(modalRecogida).toContainText('Derechos y verificación presencial');
    const modalImg = modalRecogida.locator('#modal-recogida-img');
    await expect(modalImg).toBeVisible();
    await expect.poll(async () => modalImg.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    await page.locator('#btn-listo-recogida').click();
    await expect(modalRecogida).toBeHidden();

    // Reportar publicación por descuento falso / precio inflado y verificar ocultación preventiva inmediata
    await primeraCard.locator('button[data-vitrina-accion="reportar"]').click();
    const modalReporte = page.locator('#modal-reporte');
    await expect(modalReporte).toBeVisible();
    await page.locator('#reporte-motivo').selectOption('Precio regular inflado o descuento falso');
    await page.locator('#btn-confirmar-reporte').click();

    await expect(modalReporte).toBeHidden();
    await expect(cards).toHaveCount(totalInicial - 1);
  });

  test('cerca de mí (Haversine), fijar GPS en negocio y enlaces/mapa de Google Maps', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 4.6335, longitude: -74.0725 }); // Teusaquillo

    // 1. Verificar botón "Fijar GPS del local" en panel negocio
    await page.goto('/paginas/ofertas-cierre.html');
    await expect(page.locator('#btn-ubicar-local')).toBeVisible({ timeout: 10000 });
    await page.locator('#btn-ubicar-local').click();
    await expect(page.locator('#oferta-gps-estado')).toContainText('4.6335');

    // 2. En vitrina pública, activar "Cerca de mí" y validar orden por distancia + Google Maps
    await page.goto('/paginas/vitrina.html');
    const cards = page.locator('#vitrina-grid article.vitrina-card');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });

    const btnCerca = page.locator('#btn-cerca-de-mi');
    await expect(btnCerca).toBeVisible();
    await btnCerca.click();
    await expect(btnCerca).toHaveClass(/activo/);

    // Galletas de avena (Teusaquillo: 4.6331, -74.0728) debe quedar primera con distancia en metros
    const primeraOrdenada = cards.first();
    await expect(primeraOrdenada).toContainText('Galletas de avena');
    await expect(primeraOrdenada.locator('.vitrina-distancia-pill')).toContainText(/A \d+ m/);

    // Enlace "Ver en Maps ->" en tarjeta
    const linkMapsCard = primeraOrdenada.locator('.vitrina-maps-link');
    await expect(linkMapsCard).toBeVisible();
    await expect(linkMapsCard).toHaveAttribute('href', /google\.com\/maps\/search/);

    // Modal "Ver cómo recoger" muestra botón "Cómo llegar en Maps" e iframe de mapa
    await primeraOrdenada.locator('button[data-vitrina-accion="recoger"]').click();
    const modalRecogida = page.locator('#modal-recogida');
    await expect(modalRecogida).toBeVisible();
    await expect(modalRecogida.locator('#modal-recogida-maps-btn')).toHaveAttribute('href', /google\.com\/maps\/search/);
    await expect(modalRecogida.locator('#modal-recogida-mapa')).toBeVisible();
    await expect(modalRecogida.locator('#modal-recogida-mapa')).toHaveAttribute('src', /maps\.google\.com\/maps/);
  });

  test('filtra por país, departamento y municipio y oculta ofertas fuera de radio (15 km) en otro país o municipio lejano', async ({ page, context }) => {
    // 1. Sembrar vitrina en Bogotá y publicar una oferta adicional en Antioquia / Medellín
    await page.goto('/paginas/vitrina.html');
    await expect(page.locator('#vitrina-grid article.vitrina-card')).toHaveCount(3, { timeout: 10000 });

    await page.goto('/paginas/ofertas-cierre.html');
    await expect(page.locator('#oferta-receta')).toBeVisible({ timeout: 10000 });

    // Verificar cascada real por país (México: 32 estados -> Jalisco -> Guadalajara / Zapopan)
    await page.locator('#oferta-pais').selectOption('México');
    await expect(page.locator('#label-oferta-departamento')).toHaveText('Estado');
    await expect(page.locator('#oferta-departamento option')).toHaveCount(32);
    await expect(page.locator('#oferta-departamento')).toContainText('Jalisco');
    await expect(page.locator('#oferta-departamento')).toContainText('Nuevo León');
    await expect(page.locator('#oferta-departamento')).toContainText('Ciudad de México');
    await page.locator('#oferta-departamento').selectOption('Jalisco');
    await expect(page.locator('#oferta-municipio')).toContainText('Guadalajara');
    await expect(page.locator('#oferta-municipio')).toContainText('Zapopan');

    // Cambiar a Colombia (33 divisiones oficiales: 32 departamentos + Bogotá D.C.) y publicar en Antioquia / Medellín
    await page.locator('#oferta-receta').selectOption({ index: 1 }); // Torta de chocolate
    await page.locator('#oferta-pais').selectOption('Colombia');
    await expect(page.locator('#label-oferta-departamento')).toHaveText('Departamento');
    await expect(page.locator('#oferta-departamento option')).toHaveCount(33);
    await page.locator('#oferta-departamento').selectOption('Antioquia');
    await page.locator('#oferta-municipio').selectOption('Medellín');
    await page.locator('#oferta-declaracion').check();
    await page.locator('#btn-publicar-oferta').click();
    await expect(page.locator('#mis-ofertas-lista article.mi-oferta-card')).toHaveCount(4);

    // 2. Verificar vitrina con municipios reales sin oferta (Envigado) y filtrar por Antioquia / Medellín
    await page.goto('/paginas/vitrina.html');
    const cards = page.locator('#vitrina-grid article.vitrina-card');
    await expect(cards).toHaveCount(4, { timeout: 10000 });

    await page.locator('#vitrina-pais').selectOption('Colombia');
    await expect(page.locator('#label-vitrina-departamento')).toHaveText('Departamento');
    await page.locator('#vitrina-departamento').selectOption('Antioquia');
    await expect(page.locator('#vitrina-municipio')).toContainText('Envigado');
    await page.locator('#vitrina-municipio').selectOption('Envigado');
    await expect(cards).toHaveCount(0);
    await expect(page.locator('#vitrina-grid')).toContainText('No hay ofertas de cierre activas en Envigado, Antioquia');
    await page.locator('#btn-ver-todas-zonas').click();
    await expect(cards).toHaveCount(4);

    await page.locator('#vitrina-departamento').selectOption('Antioquia');
    await page.locator('#vitrina-municipio').selectOption('Medellín');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Torta de chocolate');
    await expect(cards.first()).toContainText('Medellín');

    // Cambiar a Bogotá D.C. / Bogotá
    await page.locator('#vitrina-departamento').selectOption('Bogotá D.C.');
    await expect(cards).toHaveCount(3);

    // 3. Simular usuario en otro país (Ciudad de México) y activar "Cerca de mí"
    await page.locator('#vitrina-departamento').selectOption('todos');
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 19.4326, longitude: -99.1332 });

    await page.locator('#btn-cerca-de-mi').click();
    await expect(cards).toHaveCount(0);
    await expect(page.locator('#vitrina-grid')).toContainText('a menos de 15 km de tu ubicación');

    // Pulsar "Ver todas las zonas" restaura la vitrina
    await page.locator('#btn-ver-todas-zonas').click();
    await expect(cards).toHaveCount(4);
  });
});
