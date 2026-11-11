const { test, expect } = require('@playwright/test');

test.describe('Costia — Autenticación y Registro', () => {
  test('debe mostrar los elementos del formulario de inicio de sesión', async ({ page }) => {
    await page.goto('/paginas/login.html');

    await expect(page).toHaveTitle(/Iniciar sesión/i);
    await expect(page.locator('h1.auth-titulo')).toContainText('Bienvenido de vuelta');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Iniciar sesión');
  });

  test('debe permitir conmutar la visibilidad de la contraseña', async ({ page }) => {
    await page.goto('/paginas/login.html');

    const passwordInput = page.locator('#password');
    const toggleBtn = page.locator('#btn-toggle-pwd');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('debe permitir el acceso directo en Modo Demo', async ({ page }) => {
    await page.goto('/paginas/login.html');

    const linkDemo = page.locator('.auth-demo a');
    await expect(linkDemo).toContainText('Entrar directo al modo Demo');
    await linkDemo.click();

    await expect(page).toHaveURL(/paginas\/productos\.html/);
  });

  test('debe validar credenciales erróneas mostrando alerta', async ({ page }) => {
    await page.goto('/paginas/login.html');

    await page.locator('#email').fill('usuario_inexistente@costia.com');
    await page.locator('#password').fill('clave_incorrecta_123');

    const dialogPromise = page.waitForEvent('dialog');
    await page.locator('button[type="submit"]').click();

    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/incorrect|Error|no se pudo/i);
    await dialog.accept();
  });

  test('debe iniciar sesión con las credenciales demo preconfiguradas', async ({ page }) => {
    await page.goto('/paginas/login.html');

    await page.locator('#email').fill('demo@costia.com');
    await page.locator('#password').fill('admin123');
    await page.locator('button[type="submit"]').click();

    // Redirección exitosa a productos.html
    await expect(page).toHaveURL(/paginas\/productos\.html/, { timeout: 10000 });
  });

  test('debe cargar la pantalla de registro con sus dos casillas legales separadas (Términos y Privacidad)', async ({ page }) => {
    await page.goto('/paginas/registro.html');

    await expect(page).toHaveTitle(/Crear cuenta|Registro/i);
    await expect(page.locator('#negocio')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    
    // Verificación de las dos casillas independientes exigidas legalmente
    const chkTerminos = page.locator('#terminos');
    const chkPrivacidad = page.locator('#privacidad');
    await expect(chkTerminos).toBeVisible();
    await expect(chkPrivacidad).toBeVisible();
    await expect(chkTerminos).toHaveAttribute('required', '');
    await expect(chkPrivacidad).toHaveAttribute('required', '');

    await expect(page.locator('button[type="submit"]')).toContainText('Crear cuenta');
  });

  test('debe cargar la página de Términos y Condiciones con Derecho de Retracto (Ley 1480)', async ({ page }) => {
    await page.goto('/paginas/terminos.html');

    await expect(page).toHaveTitle(/Términos y Condiciones/i);
    await expect(page.locator('.terminos-titulo')).toContainText('Términos y Condiciones de Uso del Servicio');
    await expect(page.locator('text=Ley 1480 de 2011').first()).toBeVisible();
    await expect(page.locator('text=Derecho de Retracto').first()).toBeVisible();
    await expect(page.locator('text=cinco (5) días hábiles').first()).toBeVisible();
    await expect(page.locator('text=soporte@costia.com').first()).toBeVisible();
  });

  test('debe cargar la página de Política de Privacidad, Cookies y Tratamiento de Datos', async ({ page }) => {
    await page.goto('/paginas/privacidad.html');

    await expect(page).toHaveTitle(/Política de Privacidad/i);
    await expect(page.locator('.privacidad-titulo')).toContainText('Política de Privacidad, Cookies y Tratamiento de Datos');
    await expect(page.locator('text=Ley 1581 de 2012').first()).toBeVisible();
    await expect(page.locator('text=PHPSESSID')).toBeVisible();
    await expect(page.locator('text=localStorage').first()).toBeVisible();
  });
});
