const { test, expect } = require('@playwright/test');

test.describe('Costia — Gestión de Insumos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/paginas/insumos.html');
  });

  test('debe mostrar la lista de insumos y los KPIs iniciales', async ({ page }) => {
    await expect(page).toHaveTitle(/Insumos/i);
    await expect(page.locator('.contenido__titulo')).toContainText('Insumos');

    // Verificar que existan tarjetas KPI
    const totalKPI = page.locator('#kpi-insumos-total');
    await expect(totalKPI).toBeVisible();
    const count = parseInt(await totalKPI.textContent() || '0', 10);
    expect(count).toBeGreaterThan(0);

    // Verificar que se muestren filas de insumos
    const filas = page.locator('#insumos-cuerpo tr.tabla__fila');
    await expect(filas.first()).toBeVisible();
  });

  test('debe filtrar insumos mediante el buscador en tiempo real', async ({ page }) => {
    const buscador = page.locator('#buscar-insumo');
    await buscador.fill('Harina');

    // Comprobar que sólo coincidan filas con Harina
    const filas = page.locator('#insumos-cuerpo tr.tabla__fila');
    await expect(filas).toHaveCount(1);
    await expect(filas.first().locator('.tabla__nombre-texto')).toContainText('Harina');

    // Limpiar buscador y verificar restauración
    await buscador.fill('');
    const filasRestauradas = page.locator('#insumos-cuerpo tr.tabla__fila');
    const totalFilas = await filasRestauradas.count();
    expect(totalFilas).toBeGreaterThan(1);
  });

  test('debe filtrar por categorías de unidad (Masa, Volumen, Todos)', async ({ page }) => {
    // Filtrar por Masa
    const pillMasa = page.locator('.filtro-pill[data-filtro="masa"]');
    await pillMasa.click();
    await expect(pillMasa).toHaveClass(/activo/);

    const unidadesMasa = await page.locator('#insumos-cuerpo .tabla__unidad').allTextContents();
    for (const u of unidadesMasa) {
      expect(['kg', 'g', 'arroba', 'tonelada', 'pizca']).toContain(u.trim());
    }

    // Volver a Todos
    const pillTodos = page.locator('.filtro-pill[data-filtro="todos"]');
    await pillTodos.click();
    await expect(pillTodos).toHaveClass(/activo/);
  });

  test('debe abrir modal, calcular costo unitario y crear un nuevo insumo', async ({ page }) => {
    const btnNuevo = page.locator('a[href="#modal-insumo"]');
    await btnNuevo.click();

    const modal = page.locator('#modal-insumo');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#insumo-imagen-preview')).toBeVisible();
    await expect(modal.locator('#insumo-imagen-input')).toBeAttached();

    // Rellenar datos del nuevo insumo
    const nombreAleatorio = `Esencia Vainilla ${Date.now().toString().slice(-4)}`;
    await page.locator('#insumo-nombre').fill(nombreAleatorio);
    await page.locator('#insumo-unidad').selectOption('ml');
    await page.locator('#insumo-cantidad').fill('250');
    await page.locator('#insumo-precio').fill('15000');

    // Verificar cálculo dinámico de costo unitario
    const previewCosto = page.locator('#preview-precio-txt');
    await expect(previewCosto).not.toContainText('$0');

    // Guardar insumo
    await page.locator('.modal__btn-guardar').click();

    // Comprobar que aparece en la tabla
    const filaNueva = page.locator('#insumos-cuerpo', { hasText: nombreAleatorio });
    await expect(filaNueva).toBeVisible();
  });

  test('debe mostrar el modal elegante de advertencia con recetas afectadas al intentar eliminar un insumo en uso', async ({ page }) => {
    const filaHarina = page.locator('#insumos-cuerpo tr.tabla__fila', { hasText: 'Harina de trigo' });
    await expect(filaHarina).toBeVisible();

    // Clic en Eliminar
    await filaHarina.locator('.tabla__btn--eliminar').click();

    // Debe desplegar el modal elegante (no alert ni confirm nativo)
    const modalAlerta = page.locator('#costia-confirm-modal');
    await expect(modalAlerta).toBeVisible();
    await expect(modalAlerta.locator('.costia-confirm-titulo')).toContainText('Harina de trigo');
    await expect(modalAlerta.locator('.costia-confirm-badge')).toContainText('Materia prima en uso');

    // Debe listar productos dependientes (ej: Pan artesanal)
    const listaAfectados = modalAlerta.locator('.costia-confirm-lista li');
    await expect(listaAfectados.first()).toBeVisible();

    // Si se hace clic en cancelar / conservar insumo
    await modalAlerta.locator('#btn-conf-modal-cancelar').click();
    await expect(modalAlerta).not.toBeVisible();
    await expect(filaHarina).toBeVisible();
  });

  test('debe funcionar el Historial de Alzas mediante filtro y ancla #alzas', async ({ page }) => {
    // 0. El demo arranca estable sin alzas falsas; generamos un alza real editando Harina de trigo
    const filaHarinaInicial = page.locator('#insumos-cuerpo tr.tabla__fila', { hasText: 'Harina de trigo' });
    await filaHarinaInicial.locator('.tabla__btn--editar').click();
    await expect(page.locator('#modal-insumo')).toBeVisible();
    await page.locator('#insumo-precio').fill('3800');
    await page.locator('.modal__btn-guardar').click();
    await expect(filaHarinaInicial.locator('.insumo-var--sube')).toBeVisible();

    // 1. Filtrar por Historial de Alzas
    const pillAlzas = page.locator('#btn-filtro-alzas');
    await pillAlzas.click();
    await expect(pillAlzas).toHaveClass(/activo/);

    // Debe mostrar banner informativo de auditoría de alzas
    await expect(page.locator('#alzas-banner-info')).toBeVisible();

    // Debe mostrar la fila de Harina de trigo con su chip de alza
    const filaHarina = page.locator('#insumos-cuerpo tr.tabla__fila', { hasText: 'Harina de trigo' });
    await expect(filaHarina).toBeVisible();
    await expect(filaHarina.locator('.insumo-var--sube')).toBeVisible();

    // 2. Navegar directamente con hash #alzas desde la URL
    await page.goto('/paginas/insumos.html#alzas');
    await expect(pillAlzas).toHaveClass(/activo/);
    await expect(page.locator('#alzas-banner-info')).toBeVisible();
    await expect(filaHarina).toBeVisible();

    // 3. Volver a Todos
    const pillTodos = page.locator('.filtro-pill[data-filtro="todos"]');
    await pillTodos.click();
    await expect(page.locator('#alzas-banner-info')).not.toBeVisible();
  });
});
