# 🎓 COSTIA — Guía de Estudio y Defensa de Proyecto
> **Materia:** Desarrollo de Software (3° Semestre)  
> **Proyecto:** Sistema Web de Costeo Gastronómico y Gestión de Insumos (**Costia**)  
> **Autores:** Equipo de Desarrollo Costia  
> **Stack:** PHP 8.2 (POO / PDO) + MySQL (InnoDB 3FN) + JavaScript (ES6 Vanilla) + HTML5/CSS3 (**Atelier Cálido** + PWA)

---

## 📑 Tabla de Contenidos
1. [Ficha Técnica del Proyecto](#1-ficha-técnica-del-proyecto)
2. [El Problema que Resuelve (Justificación de Negocio)](#2-el-problema-que-resuelve-justificación-de-negocio)
3. [Repartición de Roles para la Exposición (2 Integrantes)](#3-repartición-de-roles-para-la-exposición)
4. [Guion de Exposición Minuto a Minuto (8 a 10 min)](#4-guion-de-exposición-minuto-a-minuto)
5. [Arquitectura Técnica y Patrones de Diseño](#5-arquitectura-técnica-y-patrones-de-diseño)
6. [Base de Datos Relacional y Modelo 3FN](#6-base-de-datos-relacional-y-modelo-3fn)
7. [Lógica Matemática, Tributaria y Gastronómica de Costeo](#7-lógica-matemática-tributaria-y-gastronómica-de-costeo)
8. [Seguridad, Privacidad y Asesor IA](#8-seguridad-privacidad-y-asesor-ia)
9. [Paso a Paso de la Demostración en Vivo (Live Demo)](#9-paso-a-paso-de-la-demostración-en-vivo)
10. [Banco de Preguntas Trampa del Docente y Respuestas Modelo](#10-banco-de-preguntas-trampa-del-docente-y-respuestas-modelo)
11. [Plan de Contingencia](#11-plan-de-contingencia)
12. [Mapa de Estudio Rápido para el Compañero (Orden de Lectura del Código)](#12-mapa-de-estudio-rápido-para-el-compañero)

---

## 1. Ficha Técnica del Proyecto

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre del Sistema** | **Costia** |
| **Identidad Visual** | **Atelier Cálido** (*Cuaderno de Obrador Gastronómico*: pergamino `#F6F2EA`, marfil `#FDFBF7`, tinta pino `#0D241C`, verde salvia `#0F6A4A` y cobre `#A35018`, con modo oscuro cálido `#0A1410`/`#11201A`) |
| **Lenguaje Backend** | **PHP 8.2** orientado a objetos (clases, encapsulamiento, PDO) + API REST JSON |
| **Base de Datos** | **MySQL 8.0 / MariaDB** con motor **InnoDB** (claves foráneas y transacciones ACID) |
| **Frontend** | **JavaScript ES6+ Vanilla** (POO, Fetch API, `StoreService` híbrido, PWA vía `sw.js`) |
| **Estilos y Maquetación** | **CSS3 Modular** (Variables CSS, Grid/Flexbox, Ledger Bars, `@media print`, WCAG AA claro/oscuro, sin desbordamiento desde `360px`) |
| **Asesor IA** | Integración local con **Ollama (`qwen2.5:3b`)** + motor determinista modular offline en JavaScript (`assets/js/asesor/`) |
| **Calidad Verificada** | **Playwright E2E** (17 suites automatizadas: cálculo, UX, seguridad, responsive, modo oscuro y CRUD) |

---

## 2. El Problema que Resuelve (Justificación de Negocio)

En negocios gastronómicos (panaderías, pastelerías, cafeterías, talleres de cocina):
1. **Costeo "al ojo" y unidades mezcladas:** Compran harina por bulto o kilo (`$3.200/kg`), pero las recetas usan gramos (`500 g`) o pizcas. El error de unidad destruye los márgenes. Costia sugiere unidades inteligentes (`kg` → `g`, `l` → `ml`) y lanza una alerta visual interactiva si alguien digita cantidades desproporcionadas (por ejemplo `200 kg` en vez de `200 g`).
2. **Olvidan la merma, empaque, nómina y arriendo:** En horneado o cocción la masa pierde peso (**merma**); cada producto lleva caja o bolsa (**empaque**), tiempo de equipo (**mano de obra**) y cuota de local/servicios (**gastos fijos** prorrateados por lotes mensuales).
3. **Confusión entre Markup vs. Margen Comercial:** Sumar 40% al costo no da 40% de ganancia sobre la venta real. Costia modela ambos y muestra la diferencia en vivo.
4. **Pérdida silenciosa en Apps de Delivery e Impoconsumo:** Vender al mismo precio en mostrador que en plataformas que cobran ~25% de comisión hace que el negocio trabaje a pérdida. El Simulador de Inicio compara **Mostrador (0%) vs. Delivery (25%)** e integra **Impoconsumo (8%)** cuando aplica al régimen del negocio.

---

## 3. Repartición de Roles para la Exposición

### 👤 Integrante A: "Negocio, Frontend, UX y Demostración en Vivo"
* Introduce el problema gastronómico real y el diseño **Atelier Cálido**.
* Conduce la demo en vivo:
  1. Mesa de costeo en la landing (`index.html`).
  2. **Inicio (`dashboard.html`):** Simulador Mostrador vs. Delivery, estrés por alza de insumos y precio directo inverso.
  3. **Insumos (`insumos.html`) y Nueva Receta (`crear-producto.html`):** Wizard de 3 pasos, alerta de unidad gigante y prorrateo de gastos.
  4. **Fichas PDF (`ficha-tecnica.html`) y Mi Negocio (`configuracion.html`):** Impresión estandarizada y cálculo de nómina por lote.

### 👤 Integrante B: "Arquitectura, Backend PHP, MySQL, Seguridad e IA"
* Explica el patrón **MVC desacoplado**, el **Singleton PDO** (`Database.php`) con auto-migración de columnas y la sincronización híbrida (`StoreService`).
* Explica el esquema relacional en **3FN**, la relación $N:M$ en `receta_items` y las **Transacciones ACID** en `ProductoController.php` y `demo.php`.
* Detalla las capas de **seguridad y privacidad** (BCRYPT, PDO preparado, cookies `HttpOnly`/`SameSite=Lax`, rate limiting en login, anti-IDOR, Habeas Data Ley 1581 y Ley 1480) y la arquitectura del **Asesor IA** con guardrails contra *prompt injection*.

---

## 4. Guion de Exposición Minuto a Minuto (8 a 10 min)

### Minuto 0:00 – 1:30 | Problema y Enfoque Visual (Integrante A)
> *"Hoy presentamos **Costia**, una plataforma diseñada bajo un lenguaje visual cálido de obrador artesanal ('Atelier Cálido') combinada con precisión financiera. En gastronomía, vender mucho no sirve si no sabes cuánto cuesta cada unidad considerando merma, empaque, arriendo, nómina y comisiones de domicilio."*

### Minuto 1:30 – 3:30 | Arquitectura MVC, Híbrida y Base de Datos (Integrante B)
> *"Costia usa **MVC desacoplado**: un frontend ligero en Vanilla JS ES6+ con diseño modular y PWA (`sw.js`), comunicado vía Fetch API con una API REST en **PHP 8.2**. La persistencia usa **MySQL InnoDB** en **3ra Forma Normal** con conexión **Singleton PDO** (`Database.php`). Si el servidor o la base de datos no están disponibles, `StoreService` conmuta de forma transparente a `localStorage` para garantizar continuidad operativa."*

### Minuto 3:30 – 6:30 | Demo Completa en Vivo (Integrante A)
1. **Inicio (`dashboard.html`):** Elegir `Pan artesanal`, mostrar el Ledger Bar de KPIs, probar el slider de alza de insumos y alternar entre **Mostrador (0%)** y **Delivery (25%)** para ver el precio equivalente que protege el margen.
2. **Insumos (`insumos.html`) y Nueva Receta (`crear-producto.html`):**
   - Mostrar la tabla de 10 insumos con variaciones históricas (`+6.7% Alza`).
   - Entrar al **Wizard de 3 pasos**, agregar Harina (ver que sugiere `g`), simular el error `200 kg` para activar la alerta y corregir en 1 clic, avanzar al Paso 2 (cuota proporcional de gastos fijos) y Paso 3 (liquidación final e Impoconsumo 8%).
3. **Mi Negocio (`configuracion.html`) y Fichas Técnicas (`ficha-tecnica.html`):**
   - Ajustar número de operarios o lotes al mes en Mi Negocio mostrando el recálculo instantáneo guardado en MySQL (`configuracion.php`), descargar respaldo JSON o abrir una ficha técnica lista para imprimir/PDF.
4. **Asesor IA:** Abrir el drawer superior (`Asesor IA`) y pedirle *"Harina de trigo subió a 3800"* o consultar qué receta recalcular.

### Minuto 6:30 – 8:30 | Transacciones ACID, Seguridad y Guardrails IA (Integrante B)
> *"Al guardar una receta o restaurar el catálogo demo, el backend ejecuta transacciones ACID (`beginTransaction`, `commit`, `rollBack`). Cada endpoint valida sesión PHP con cookies `HttpOnly`, verifica propiedad por `usuario_id` (anti-IDOR), aplica rate limiting contra fuerza bruta en login, cumple Ley 1581 de Habeas Data (exportación JSON y eliminación en cascada en `eliminar-cuenta.php`), y blinda el Asesor IA en `asesor.php` contra prompt injection y CORS no autorizados."*

### Minuto 8:30 – 9:30 | Calidad Automatizada y Cierre (Ambos)
> *"Todo el flujo está respaldado por una batería de pruebas E2E con **Playwright** que valida cálculos, seguridad, responsividad móvil sin desbordamiento horizontal y accesibilidad WCAG AA claro/oscuro."*

---

## 5. Arquitectura Técnica y Patrones de Diseño

```
                   ARQUITECTURA DEL SISTEMA COSTIA
 ┌───────────────────────────────────────────────────────────────────┐
 │                         CAPA DE VISTA / UI                        │
 │   HTML5 Semántico + CSS3 Modular Atelier Cálido + PWA (sw.js)     │
 │   - index.html (Landing + mesa interactiva)                       │
 │   - paginas/dashboard.html   (Simulador Mostrador vs Delivery)    │
 │   - paginas/insumos.html     (Materias primas y variaciones)      │
 │   - paginas/productos.html   (Catálogo y duplicación)             │
 │   - paginas/crear-producto.html (Wizard 3 pasos + liquidación)    │
 │   - paginas/ficha-tecnica.html  (Fichas imprimibles / PDF)        │
 │   - paginas/configuracion.html  (Mi Negocio + respaldo/olvido)    │
 └───────────────────────────────┬───────────────────────────────────┘
                                 │ Controladores JS POO + Fetch JSON
                                 ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │                    SERVICIO HÍBRIDO (StoreService)                │
 │   assets/js/store.js + models.js + theme.js + asesor/*            │
 │   - Con sesión MySQL: sincroniza insumos, productos y config      │
 │   - Sin sesión / offline: opera sobre localStorage transparente   │
 └───────────────────────────────┬───────────────────────────────────┘
                                 │ REST API JSON (/backend/api/*)
                                 ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │                 CAPA CONTROLADOR Y SEGURIDAD (PHP 8)              │
 │   - backend/config/Session.php     (HttpOnly, SameSite, Headers)  │
 │   - backend/controllers/AuthController.php                        │
 │   - backend/controllers/InsumoController.php                      │
 │   - backend/controllers/ProductoController.php                    │
 │   - backend/api/configuracion.php | demo.php | eliminar-cuenta.php│
 │   - backend/api/asesor.php (Puente Ollama + Guardrails)           │
 └───────────────────────────────┬───────────────────────────────────┘
                                 │ Modelos PDO + Singleton Database
                                 ▼
 ┌───────────────────────────────────────────────────────────────────┐
 │                       BASE DE DATOS (MySQL)                       │
 │   InnoDB 3FN: usuarios (incluye config_gastos y Habeas Data),     │
 │   insumos, productos, receta_items                                │
 └───────────────────────────────────────────────────────────────────┘
```

### Patrones principales del código:
1. **MVC Desacoplado:** Vistas HTML/CSS + JS de vista hablan vía JSON con controladores PHP sin mezclar HTML dentro del backend.
2. **Singleton (`backend/config/Database.php`):** `Database::getConnection()` mantiene una sola instancia `PDO` por petición y ejecuta `asegurarEsquema()` para crear/migrar tablas automáticamente.
3. **Estrategia Híbrida (`assets/js/store.js`):** `StoreService` centraliza el estado y sincroniza con `/backend/api/insumos.php`, `/backend/api/productos.php` y `/backend/api/configuracion.php` cuando hay sesión activa.
4. **Arquitectura Modular del Asesor (`assets/js/asesor/`):** Dividido por responsabilidad única (`asesor-parser.js`, `asesor-finanzas.js`, `asesor-comandos.js`, `asesor-flujo.js`, `asesor-ui.js` y `asesor-agente.js`).

---

## 6. Base de Datos Relacional y Modelo 3FN

Definida en [`database/database.sql`](../../database/database.sql) y auto-verificada en [`Database.php`](../../backend/config/Database.php):

* **`usuarios`**: `id`, `negocio`, `config_gastos` (JSON con arriendo, recibos, nómina, lotes mensuales, comisión delivery e Impoconsumo), `email`, `password` (BCRYPT), `acepto_terminos`, `acepto_privacidad`, `ip_registro`, `fecha_aceptacion`, `created_at`.
* **`insumos`**: `id`, `usuario_id` (FK a `usuarios`), `nombre`, `unidad`, `precio`, `created_at`, `updated_at`.
* **`productos`**: `id`, `usuario_id` (FK a `usuarios`), `nombre`, `modo` (`margen` o `multiplicador`), `valor_modo`, `tipo_margen` (`costo` o `venta`), `unidades_producidas`, `costo_empaque`, `porcentaje_merma`, `costo_mano_obra`, `precio_venta_anterior`, `costo_snapshot`, `created_at`, `updated_at`.
* **`receta_items`**: **Tabla intermedia $N:M$** con `id`, `producto_id` (`ON DELETE CASCADE`), `insumo_id` (`ON DELETE RESTRICT` para proteger integridad), `cantidad` (`DECIMAL(12,4)`), `unidad_receta`.

### Datos demo alineados:
Tanto `database/database.sql`, como `backend/api/demo.php`, `AuthController::sembrarDatosIniciales()` y `StoreService` offline comparten exactamente los mismos **10 insumos** y **7 recetas iniciales** (Pan artesanal, Torta de chocolate, Galletas de avena, Croissant de mantequilla, Pan de queso campesino, Capuchino artesanal 12 oz y Brownie de chocolate).

---

## 7. Lógica Matemática, Tributaria y Gastronómica de Costeo

### 1. Conversión Universal (`UnidadConverter` en `assets/js/models.js`)
Normaliza unidades de compra a porción mínima de receta:
* Masa: `kg`, `g`, `lb`, `oz`, `arroba`, `ton`, `pizca`.
* Volumen: `l`, `ml`, `taza`, `cda`, `cdta`.

### 2. Costo Real Unitario (con Merma, Empaque y Prorrateo de Gastos Fijos)
$$\text{Costo Insumos con Merma} = \text{Costo Ingredientes Crudos} \times \left(1 + \frac{\text{Merma \%}}{100}\right)$$
$$\text{Cuota Fijos / Lote} = \frac{\text{Arriendo} + \text{Servicios} + (\text{Operarios} \times \text{Salario})}{\text{Lotes Estimados al Mes}}$$
$$\text{Costo Unitario Real} = \frac{\text{Costo Insumos con Merma} + \text{Mano de Obra Directa / Cuota Fijos}}{\text{Unidades Producidas}} + \text{Empaque / ud}$$

### 3. Markup vs. Margen Comercial sobre Venta
* **Markup (sobre costo):** $\text{Precio} = \text{Costo Unitario} \times \text{Multiplicador}$ (o $\text{Costo} \times (1 + m)$).
* **Margen Bruto Comercial (sobre precio de venta):**
$$\text{Precio Mostrador} = \frac{\text{Costo Unitario}}{1 - \left(\frac{\text{Margen \%}}{100}\right)}$$

### 4. Equivalencia Delivery e Impoconsumo
* **Comisión Delivery (ej. $25\%$):** Ajusta el precio para conservar exactamente la misma ganancia neta tras descontar la comisión de la app:
$$\text{Precio Delivery} = \frac{\text{Costo Unitario}}{1 - \text{Margen} - \text{Comisión App}}$$
* **Impoconsumo ($8\%$ sobre precio base):** Si el negocio declara Impoconsumo en **Mi Negocio** o en el simulador, se adiciona sobre el precio de venta neto antes de mostrar el PVP final.

---

## 8. Seguridad, Privacidad y Asesor IA

| Vector / Norma | Implementación Real en el Código |
| :--- | :--- |
| **Inyección SQL** | Sentencias preparadas PDO (`PDO::ATTR_EMULATE_PREPARES => false`) en todos los modelos y controladores. |
| **Contraseñas** | Hash adaptativo `PASSWORD_BCRYPT` y verificación con `password_verify()` (`Usuario.php`, `AuthController.php`). |
| **Fuerza bruta (Login)** | Rate limiting por IP en archivo temporal con ventana de bloqueo (`verificarRateLimit()` en `AuthController.php`). |
| **XSS** | `StoreService.escapeHtml()` en renders dinámicos del DOM y sanitización en servidor. |
| **IDOR / BOLA** | Validación estricta de propiedad de cuenta por `usuario_id` en insumos, recetas y productos (`ProductoController.php`, prueba `SEC-002`). |
| **CSRF destructivo & Cookies** | Métodos `POST` exclusivos para mutaciones destructivas (`demo.php`, `eliminar-cuenta.php`), `GET` rechazado con HTTP `405`. Cookies `HttpOnly`, `SameSite=Lax` y cabeceras `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` en `Session.php`. |
| **Habeas Data & Consumidor** | Políticas dedicadas ([`privacidad.html`](../../paginas/privacidad.html), [`terminos.html`](../../paginas/terminos.html)), registro de aceptación e IP al registrarse, **exportación JSON** en `store.js` y **Derecho al Olvido** en cascada en [`eliminar-cuenta.php`](../../backend/api/eliminar-cuenta.php). |
| **Guardrails Asesor IA** | [`backend/api/asesor.php`](../../backend/api/asesor.php) valida origen CORS local y filtra intentos de *prompt injection*, *jailbreak* o comandos fuera de dominio mediante `esSolicitudNoSoportada()`. |

---

## 9. Paso a Paso de la Demostración en Vivo

1. **Arranque:** Tener MySQL iniciado en XAMPP (o servidor embebido `php -S 127.0.0.1:8085`). Entrar a `/index.html`.
2. **Landing (`index.html`):** Jugar 10 segundos con las recetas y el slider de la **Ficha Técnica Interactiva**. Clic en **Iniciar sesión**.
3. **Login (`paginas/login.html`):** Usar `demo@costia.com` / `admin123`.
4. **Inicio / Simulador (`paginas/dashboard.html`):** Cambiar de `Pan artesanal` a `Torta de chocolate`, alternar **Mostrador (0%)** vs **Delivery (25%)**, activar **Impoconsumo (8%)**, mover el slider de alza de insumos y clicar **Aplicar precio a receta**.
5. **Insumos (`paginas/insumos.html`):** Mostrar la tabla de costos, filtrar por unidad y abrir `+ Nuevo insumo` o editar un precio para explicar el impacto en recetas.
6. **Nueva Receta (`paginas/crear-producto.html`):** Probar el Wizard de 3 pasos, activar la alerta de cantidad gigante (`200 kg` -> clic en corregir a `g`), pasar a gastos proporcionales y guardar.
7. **Mi Negocio (`paginas/configuracion.html`):** Cambiar número de trabajadores (ej. `3` operarios), mostrar el recálculo instantáneo de nómina por lote y pulsar **Guardar todos los cambios** (se guarda en MySQL vía `configuracion.php`).
8. **Fichas Técnicas (`paginas/ficha-tecnica.html`):** Abrir una ficha individual y previsualizar su versión de impresión / PDF.
9. **Asesor IA:** Abrir el chat del Asesor en la barra superior y escribir `"sube el azúcar a 3500 el kilo"` para ver la detección y recalculo en vivo.

---

## 10. Banco de Preguntas Trampa del Docente y Respuestas Modelo

### 1. *"¿Por qué utilizaron PDO en lugar de MySQLi?"*
PDO ofrece una interfaz orientada a objetos unificada, soporte real de sentencias preparadas nativas (`ATTR_EMULATE_PREPARES => false`), manejo limpio de excepciones (`PDOException`) y portabilidad entre motores cambiando únicamente el DSN.

### 2. *"¿Dónde está aplicada la Tercera Forma Normal (3FN)?"*
En la descomposición de `receta_items`: los productos no guardan listas de ingredientes ni repiten nombres o precios de insumos. Sólo referencian `producto_id` e `insumo_id` como claves foráneas. Un cambio en el precio de un insumo actualiza el cálculo en todas las recetas sin redundancia.

### 3. *"¿Cómo garantizan transacciones atómicas al crear o actualizar recetas?"*
`ProductoController.php` envuelve la inserción/edición en `$db->beginTransaction()`, luego guarda todos los `receta_items` y solo ejecuta `$db->commit()` si todo fue exitoso; ante cualquier excepción ejecuta `$db->rollBack()`.

### 4. *"¿Cómo evitan que un usuario borre datos de otro mediante peticiones HTTP manipuladas?"*
Primero, todas las consultas de lectura, edición y borrado filtran por `$usuarioId` leído directamente de `$_SESSION['usuario_id']` (nunca del JSON enviado por el cliente). Segundo, al crear recetas verificamos que cada `insumoId` pertenezca al mismo usuario (mitigación IDOR/BOLA, validada en `tests/security.spec.js`).

### 5. *"¿La configuración del negocio (arriendo, nómina, delivery) también persiste en MySQL?"*
Sí. Se almacena en la columna `config_gastos` y `negocio` de la tabla `usuarios` mediante el endpoint `backend/api/configuracion.php`, sincronizado bidireccionalmente desde `StoreService`.

### 6. *"¿Qué pasa si Ollama no está encendido durante una demostración?"*
El frontend consulta `/backend/api/asesor.php?ping=1`; si Ollama no responde, `asesor-agente.js` utiliza automáticamente el analizador léxico/financiero local (`asesor-parser.js`, `asesor-finanzas.js`, `asesor-comandos.js`) sin interrumpir la experiencia.

---

## 11. Plan de Contingencia

* **Credenciales demo:** `demo@costia.com` / `admin123` (o crear usuario nuevo desde `registro.html`).
* **Sin XAMPP / Apache configurado:** Ejecutar `php -S 127.0.0.1:8085` en la raíz del proyecto.
* **Puerto 3306 de MySQL ocupado o MySQL caído:** Costia conmuta automáticamente a `localStorage` con los mismos 10 insumos y 7 recetas demo precargados.
* **Base de datos desincronizada:** Reimportar `database/database.sql` o iniciar sesión y pulsar **Restaurar Datos de Demostración** en `Mi Negocio` (`configuracion.html`).

---

## 12. Mapa de Estudio Rápido para el Compañero

Lee estos archivos en orden para dominar todo el proyecto en ~30 minutos:

1. **Capa de Datos (5 min):**
   - `database/database.sql` — Tablas, llaves foráneas `ON DELETE CASCADE/RESTRICT` y semilla demo.
   - `backend/config/Database.php` — Patrón Singleton PDO y migración automática `asegurarEsquema()`.
2. **Backend y Seguridad (10 min):**
   - `backend/config/Session.php` — Sesión segura y cabeceras HTTP.
   - `backend/controllers/AuthController.php` — Registro con siembra inicial, login BCRYPT y rate limiting.
   - `backend/controllers/InsumoController.php` y `ProductoController.php` — Validación multi-inquilino y transacciones ACID.
   - `backend/api/configuracion.php` y `eliminar-cuenta.php` — Persistencia de configuración y Derecho al Olvido.
3. **Motor Matemático y Sincronización Frontend (10 min):**
   - `assets/js/models.js` — Clases `Insumo`, `Producto`, `ItemReceta` y `UnidadConverter`.
   - `assets/js/store.js` — `StoreService` (cómo habla con `/backend/api/*` y hace fallback a `localStorage`).
   - `assets/js/dashboard.js` y `assets/js/crear-producto.js` — Lógica del Simulador y del Wizard de 3 pasos.
4. **Asesor IA y Pruebas E2E (5 min):**
   - `assets/js/asesor-agente.js` + `backend/api/asesor.php` — Flujo conversacional y guardrails.
   - `tests/security.spec.js` y `tests/ux-transformation.spec.js` — Cómo se prueban seguridad y flujos automáticamente.
