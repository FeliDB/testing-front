import { test, expect } from '@playwright/test';

// Mock del backend para las pruebas
test.beforeEach(async ({ page }) => {
  // Interceptar llamadas al backend y mockear respuestas
  await page.route('**/zone', async (route) => {
    const method = route.request().method();
    
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            idZone: 1,
            name: 'Zona Centro',
            radius: 500,
            location: { lat: -34.6037, lng: -58.3816 }
          },
          {
            idZone: 2,
            name: 'Zona Norte',
            radius: 750,
            location: { lat: -34.5837, lng: -58.3716 }
          }
        ])
      });
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          idZone: 3,
          name: 'Nueva Zona',
          radius: 600,
          location: { lat: -34.6137, lng: -58.3916 }
        })
      });
    }
  });

  await page.route('**/zone/*', async (route) => {
    const method = route.request().method();
    
    if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Zone deleted' })
      });
    }
  });
});

test.describe('Zone CRUD - Play & Record Tests', () => {
  
  test('debería mostrar la página principal correctamente', async ({ page }) => {
    await page.goto('/');
    
    // Verificar título
    await expect(page.locator('h1')).toContainText('Gestión de Zonas');
    
    // Verificar botones principales
    await expect(page.locator('button:has-text("Agregar Zona")')).toBeVisible();
    await expect(page.locator('button:has-text("Eliminar Zona")')).toBeVisible();
    
    // Tomar screenshot de la página principal
    await page.screenshot({ path: 'tests/screenshots/home-page.png' });
  });

  test('debería crear una nueva zona exitosamente', async ({ page }) => {
    await page.goto('/');
    
    // Navegar a formulario de agregar
    await page.click('button:has-text("Agregar Zona")');
    
    // Llenar formulario
    await page.fill('input[name="name"]', 'Zona Test Playwright');
    await page.fill('input[name="radius"]', '800');
    await page.fill('input[name="lat"]', '-34.6137');
    await page.fill('input[name="lng"]', '-58.3916');
    
    // Enviar formulario
    await page.click('button[type="submit"]');
    
    // Verificar mensaje de éxito
    await expect(page.locator('.notification.success')).toContainText('Zona agregada exitosamente');
    
    // Verificar que volvió a la página principal
    await expect(page.locator('h1')).toContainText('Gestión de Zonas');
    
    await page.screenshot({ path: 'tests/screenshots/zone-created-success.png' });
  });

  test('debería eliminar una zona con confirmación', async ({ page }) => {
    await page.goto('/');
    
    // Navegar a eliminar zonas
    await page.click('button:has-text("Eliminar Zona")');
    
    // Esperar a que carguen las zonas
    await page.waitForSelector('.zone-item');
    
    // Configurar el diálogo de confirmación
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('¿Estás seguro de eliminar esta zona?');
      await dialog.accept();
    });
    
    // Click en eliminar primera zona
    await page.locator('.zone-item').first().locator('button:has-text("Eliminar")').click();
    
    // Verificar mensaje de éxito
    await expect(page.locator('.notification.success')).toContainText('Zona eliminada exitosamente');
    
    await page.screenshot({ path: 'tests/screenshots/zone-deleted-success.png' });
  });

  test('flujo completo de usuario - agregar y eliminar zona', async ({ page }) => {
    await page.goto('/');
    
    // 1. Agregar nueva zona
    await page.click('button:has-text("Agregar Zona")');
    await page.fill('input[name="name"]', 'Zona Flujo Completo');
    await page.fill('input[name="radius"]', '1000');
    await page.fill('input[name="lat"]', '-34.6237');
    await page.fill('input[name="lng"]', '-58.4016');
    await page.click('button[type="submit"]');
    
    // Verificar éxito
    await expect(page.locator('.notification.success')).toContainText('Zona agregada exitosamente');
    
    // 2. Ir a eliminar zonas
    await page.click('button:has-text("Eliminar Zona")');
    await page.waitForSelector('.zone-item');
    
    // 3. Eliminar zona
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.locator('.zone-item').first().locator('button:has-text("Eliminar")').click();
    
    // Verificar eliminación exitosa
    await expect(page.locator('.notification.success')).toContainText('Zona eliminada exitosamente');
    
    await page.screenshot({ path: 'tests/screenshots/complete-flow.png' });
  });
});