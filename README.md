# Costia — Sistema de Costeo Gastronómico y Fijación de Precios de Venta

Aplicación web orientada a negocios gastronómicos, panaderías, pastelerías, cafeterías de especialidad y pequeños talleres de manufactura. Calcula el costo real por unidad a partir de recetas, merma técnica, empaque, mano de obra y prorrateo de gastos fijos mensuales, sugiriendo precios rentables para mostrador y plataformas de domicilio (Delivery), asistido por un Asesor Financiero con IA.

---

## 🛠 Requisitos del Entorno

* **PHP:** Versión **8.0 o superior** (8.2 recomendado) con extensión `pdo_mysql` habilitada.
* **Base de datos:** MySQL / MariaDB 10.4+ (opcional para pruebas rápidas gracias al respaldo en `localStorage`, obligatorio para persistencia multiusuario).
* **Servidor web (opcional):** Apache vía XAMPP, Laragon o WAMP, o el servidor embebido de PHP (`php -S`).
* **Node.js (opcional, solo para pruebas automatizadas):** Versión 18+ con Playwright.
* **Ollama (opcional, para IA generativa local):** Servidor local en `http://127.0.0.1:11434` con el modelo `qwen2.5:3b` (si no está instalado, el Asesor IA opera con su motor determinista integrado).

---

## 🚀 Ejecución Rápida

### Modo 1: Arrancar en 1 comando sin configurar Apache
Ideal para estudiar el proyecto o ejecutar la aplicación en segundos (funciona offline con `localStorage`, y sincroniza con MySQL si el servicio está encendido):

```bash
php -S 127.0.0.1:8085
```
Luego abre en tu navegador: `http://127.0.0.1:8085/index.html`

### Modo 2: Apache + MySQL (XAMPP / Laragon)
1. Copia `.env.example` a `.env` si necesitas ajustar credenciales locales (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`). Por defecto usa `127.0.0.1:3306`, usuario `root`, sin contraseña y base `costia_db`.
2. Inicia **Apache** y **MySQL** en XAMPP/Laragon.
3. Importa [`database/database.sql`](database/database.sql) desde `http://localhost/phpmyadmin` o por consola:
   ```bash
   mysql -u root -p < database/database.sql
   ```
   *(Nota: `Database::getConnection()` también crea automáticamente la base `costia_db` y actualiza columnas si no existen).*

---

## 👤 Usuario de Prueba Preconfigurado

* **Correo:** `demo@costia.com`
* **Contraseña:** `admin123`

*(También puedes crear cuentas nuevas desde `paginas/registro.html`; el sistema siembra automáticamente los 10 insumos y 7 recetas de demostración al registrarse).*

---

## 🤖 Asesor Financiero IA (Híbrido: Ollama + Motor Determinista)

El panel del Asesor IA (accesible desde la barra superior o el menú lateral) interpreta comandos en lenguaje cotidiano (*"harina subió a 4500 el kilo"*, *"torta de zanahoria con 300g de harina..."*, *"¿cuál es mi receta menos rentable?"*):

* **Con Ollama activo:** `backend/api/asesor.php` consulta `http://127.0.0.1:11434` (modelo recomendado: `qwen2.5:3b`) protegido con filtros CORS estrictos (`localhost` / `127.0.0.1`) y guardrails contra *prompt injection*.
  ```bash
  ollama pull qwen2.5:3b
  ```
* **Sin Ollama:** Conmuta transparentemente al analizador modular del frontend (`assets/js/asesor/`) sin bloquear ninguna función.

---

## 🧪 Pruebas Automatizadas E2E (Playwright)

El proyecto incluye pruebas automatizadas de flujo completo, seguridad OWASP, modo oscuro, cálculos financieros y diseño responsive:

```bash
npm install
npx playwright install chromium
npm test
```

> **Portabilidad PHP en Playwright:** `playwright.config.js` usa `process.env.PHP_BIN` si está definida; de lo contrario detecta `C:\xampp\php\php.exe` en Windows o usa `php` del `PATH`. Puedes forzar la ruta así:
> ```bash
> PHP_BIN=/usr/bin/php npm test
> ```

---

## 🏗 Arquitectura del Software

El proyecto implementa **POO (Programación Orientada a Objetos)** y **MVC desacoplado** sobre frontend Vanilla ES6+ y API REST PHP 8 + PDO:

```
proyecto_costia/
├── .env.example                    # Plantilla de variables de entorno (BD y PHP_BIN)
├── .gitignore                      # Exclusiones de Git y artefactos temporales
├── index.html                      # Landing page editorial con simulador en vivo
├── manifest.json                   # Manifiesto PWA instalable
├── sw.js                           # Service Worker PWA (Network-First con caché v3)
├── playwright.config.js            # Configuración E2E portable
├── assets/
│   ├── css/
│   │   ├── base.css                # Tokens Atelier Cálido, tipografía, botones, Asesor IA
│   │   ├── terminal-theme.css      # Variables de tema claro/oscuro y barra móvil
│   │   ├── app-shell.css           # Layout lateral, topbar y viewport responsivo
│   │   ├── app.css                 # Componentes compartidos, modales y confirmaciones
│   │   ├── presentacion.css        # Estilos de landing page y mesa de costeo
│   │   ├── auth.css                # Login y registro
│   │   ├── productos.css           # Dashboard Inicio, Ledger Bar, Simulador y Catálogo
│   │   ├── insumos.css             # Inventario de materias primas y variaciones
│   │   ├── crear-producto.css      # Wizard de 3 pasos y panel de liquidación
│   │   ├── ficha-tecnica.css       # Catálogo PDF imprimible (@media print)
│   │   └── configuracion.css       # Estación Mi Negocio y prorrateo de nómina
│   ├── img/                        # Logotipos e iconografía SVG
│   └── js/
│       ├── models.js               # Entidades JS + UnidadConverter + motor de cálculo
│       ├── store.js                # StoreService híbrido (API REST MySQL <-> localStorage)
│       ├── theme.js                # Gestor de tema claro/oscuro persistente
│       ├── app-shell.js            # Navegación lateral, badges de alerta y shell
│       ├── dashboard.js            # Simulador Mostrador vs Delivery, estrés e Impoconsumo
│       ├── insumos.js              # CRUD de insumos, historial y cascada de precios
│       ├── productos.js            # Catálogo, filtros, duplicación y alertas
│       ├── crear-producto.js       # Wizard 3 pasos, merma y alertas de unidad
│       ├── ficha-tecnica.js        # Generador de ficha técnica individual y catálogo PDF
│       ├── configuracion.js        # Gastos fijos, nómina, respaldo JSON y cuenta
│       ├── login.js / registro.js  # Autenticación y aceptación legal Habeas Data
│       ├── presentacion.js         # Simulador interactivo de index.html
│       ├── asesor-agente.js        # Orquestador del Asesor Financiero IA
│       └── asesor/                 # Módulos: parser, finanzas, comandos, flujo y UI
├── backend/
│   ├── conexion.php                # Diagnóstico rápido de conexión MySQL
│   ├── config/
│   │   ├── Database.php            # Singleton PDO con auto-migración de esquema
│   │   └── Session.php             # Sesión segura (HttpOnly, SameSite=Lax) + headers
│   ├── models/                     # Usuario, Insumo, Producto, RecetaItem
│   ├── controllers/                # AuthController (rate-limit, BCRYPT), InsumoController, ProductoController
│   ├── api/
│   │   ├── insumos.php             # REST GET/POST/DELETE para insumos
│   │   ├── productos.php           # REST GET/POST/PATCH/DELETE (ACID) para productos
│   │   ├── configuracion.php       # REST GET/POST/PUT para identidad y gastos fijos del negocio
│   │   ├── demo.php                # Restauración transaccional de catálogo demo
│   │   ├── eliminar-cuenta.php     # Derecho al Olvido (borrado en cascada Habeas Data)
│   │   └── asesor.php              # Puente seguro hacia Ollama local + guardrails
│   └── auth/                       # login.php, registro.php, session.php, logout.php
├── database/
│   └── database.sql                # DDL/DML 3FN completo (10 insumos, 7 recetas, usuario demo)
├── docs/
│   ├── entregas/GUIA_PRESENTACION.md # Guía actualizada de estudio y sustentación
│   └── superpowers/                # Especificaciones y planes de diseño
├── paginas/
│   ├── dashboard.html              # Inicio: resumen del negocio y simulador en vivo
│   ├── insumos.html                # Inventario de materias primas
│   ├── productos.html              # Mis Recetas y precios
│   ├── crear-producto.html         # Nueva Receta (Wizard 3 pasos)
│   ├── ficha-tecnica.html          # Catálogo e impresión de Fichas Técnicas PDF
│   ├── ficha-preview.html          # Vista individual imprimible directa
│   ├── configuracion.html          # Mi Negocio: identidad, arriendo, nómina, respaldo
│   ├── login.html / registro.html  # Acceso y registro de cuenta
│   └── terminos.html / privacidad.html # Ley 1480 (Retracto) y Ley 1581 (Habeas Data)
└── tests/                          # Suite Playwright E2E (17 archivos .spec.js)
```

---

## 📖 Mapa de Estudio Rápido (Para entender el código en 4 pasos)

Si vas a estudiar o sustentar el proyecto, sigue este orden:

1. **Modelo de datos y dominio:**
   * [`database/database.sql`](database/database.sql) → 4 tablas en 3FN (`usuarios` incluye `config_gastos` y campos de Habeas Data, `insumos`, `productos`, `receta_items`).
   * [`backend/models/`](backend/models/) + [`assets/js/models.js`](assets/js/models.js) → Conversor universal `UnidadConverter` y fórmulas de costo real/margen.
2. **Backend MVC, seguridad y sincronización híbrida:**
   * [`backend/config/Database.php`](backend/config/Database.php) + [`backend/config/Session.php`](backend/config/Session.php) → Singleton PDO y cookies blindadas.
   * [`backend/controllers/AuthController.php`](backend/controllers/AuthController.php) y [`ProductoController.php`](backend/controllers/ProductoController.php) → BCRYPT, rate limit anti-fuerza bruta y transacciones ACID.
   * [`assets/js/store.js`](assets/js/store.js) → Cómo `StoreService` sincroniza insumos, productos y configuración de negocio con MySQL o cae transparentemente a `localStorage`.
3. **Flujos de negocio del frontend:**
   * [`assets/js/dashboard.js`](assets/js/dashboard.js) → Simulador Mostrador vs Delivery (25%), prueba de estrés e Impoconsumo (8%).
   * [`assets/js/crear-producto.js`](assets/js/crear-producto.js) → Wizard de 3 pasos, alerta de unidad desproporcionada y prorrateo.
   * [`assets/js/configuracion.js`](assets/js/configuracion.js) + [`assets/js/ficha-tecnica.js`](assets/js/ficha-tecnica.js) → Prorrateo de nómina, exportación JSON y PDF imprimible.
4. **Asesor Financiero IA:**
   * [`assets/js/asesor-agente.js`](assets/js/asesor-agente.js) + [`assets/js/asesor/`](assets/js/asesor/) + [`backend/api/asesor.php`](backend/api/asesor.php).

Para el guion detallado de exposición y respuestas a preguntas del docente, consulta [`docs/entregas/GUIA_PRESENTACION.md`](docs/entregas/GUIA_PRESENTACION.md).
