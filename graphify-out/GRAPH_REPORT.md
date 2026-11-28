# Graph Report - proyecto_costia  (2026-11-27)

## Corpus Check
- 78 files · ~115,716 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: .css 12, .example 1, (none) 1)

## Summary
- 788 nodes · 1399 edges · 64 communities (23 shown, 41 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `96d0ba16`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StoreService
- UnidadConverter
- OfertaController
- CrearProductoController
- Usuario
- Producto
- InsumosController
- ProductosWorkstationController
- Insumo
- manifest.json
- AsesorCostiaAgent
- OfertasCierreController
- Review Focus
- AsesorParser
- AsesorUI
- .getConnection
- AsesorFinanzas
- Documento de Diseño: Organización Estructural del Proyecto Costia
- Review Focus
- 4. Arquitectura de Contenido en 4 Actos (`index.html`)
- Product
- 3. Diseño por Bloque
- Reglas Globales Estrictas para el Subagente Flash (`impeccable detect` = 0 alertas)
- @playwright/test
- EquilibrioGlobalController
- sw.js
- VitrinaPublicaController
- README.md
- ThemeManager
- AppShell
- .ejecutarAccionChip
- DashboardWorkstationController
- AsesorFlujo
- RecetaItem
- package.json
- scripts
- audit-responsive-full.spec.js
- asesor-multiperfil.spec.js
- ux-transformation.spec.js
- playwright.config.js
- auth.spec.js
- ficha-tecnica.spec.js
- productos.spec.js
- responsive.spec.js
- 🎓 COSTIA — Guía de Estudio y Defensa de Proyecto
- models.js
- Producto
- Costia — Guía Completa de Estudio, Arquitectura, Librerías y Pitch con Datos Verificados
- Costia — Sistema de Costeo Gastronómico y Fijación de Precios de Venta
- 6. Pitch de Presentación con Datos Verificados

## God Nodes (most connected - your core abstractions)
1. `StoreService` - 54 edges
2. `CrearProductoController` - 52 edges
3. `AsesorCostiaAgent` - 52 edges
4. `OfertasCierreController` - 38 edges
5. `DashboardWorkstationController` - 35 edges
6. `VitrinaPublicaController` - 25 edges
7. `InsumosController` - 23 edges
8. `@playwright/test` - 21 edges
9. `AsesorParser` - 18 edges
10. `Producto` - 18 edges

## Surprising Connections (you probably didn't know these)
- `7. Preguntas Frecuentes del Jurado y Respuestas Modelo` --references--> `StoreService`  [INFERRED]
  docs/GUIA_ESTUDIO_Y_PITCH_COSTIA.md → assets/js/store.js
- `1. Ficha Técnica del Proyecto` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `5. *"¿La configuración del negocio (arriendo, nómina, delivery) también persiste en MySQL?"*` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `👤 Integrante B: "Arquitectura, Backend PHP, MySQL, Seguridad e IA"` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `Minuto 1:30 – 3:30 | Arquitectura MVC, Híbrida y Base de Datos (Integrante B)` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js

## Import Cycles
- None detected.

## Communities (64 total, 41 thin omitted)

### Community 1 - "UnidadConverter"
Cohesion: 0.15
Nodes (9): ItemReceta, UnidadConverter, 12. Mapa de Estudio Rápido para el Compañero, 1. Conversión Universal (`UnidadConverter` en `assets/js/models.js`), 2. Costo Real Unitario (con Merma, Empaque y Prorrateo de Gastos Fijos), 3. Markup vs. Margen Comercial sobre Venta, 4. Equivalencia Delivery e Impoconsumo, 7. Lógica Matemática, Tributaria y Gastronómica de Costeo (+1 more)

### Community 2 - "OfertaController"
Cohesion: 0.19
Nodes (3): {closure#1}(), {closure#2}(), OfertaController

### Community 4 - "Usuario"
Cohesion: 0.11
Nodes (6): Session, AuthController, Usuario, 6. Base de Datos Relacional y Modelo 3FN, 8. Seguridad, Privacidad y Asesor IA, Datos demo alineados:

### Community 9 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, scope, short_name (+2 more)

### Community 12 - "Review Focus"
Cohesion: 0.15
Nodes (11): formatoPesos(), inicializarMesaCosteo(), recalcular(), RECETAS_DEMO, Global Constraints, Rediseño Editorial de `index.html` ("Atelier Gastronómico") Implementation Plan, Review Focus, Task 1: Reestructurar el HTML semántico de `index.html` en 4 Actos Destilados (+3 more)

### Community 25 - ".getConnection"
Cohesion: 0.09
Nodes (7): Database, InsumoController, ProductoController, Patrones principales del código:, 🚀 Ejecución Rápida, Modo 1: Arrancar en 1 comando sin configurar Apache, Modo 2: Apache + MySQL (XAMPP / Laragon)

### Community 28 - "Documento de Diseño: Organización Estructural del Proyecto Costia"
Cohesion: 0.20
Nodes (9): 1. Intención y Propósito, 2. Objetivos y No-Objetivos, 3. Enfoques Considerados y Selección, 4. Estructura Resultante del Directorio, 5. Decisiones de Implementación Detalladas, Anti-Objetivos (Anti-Goals):, Documento de Diseño: Organización Estructural del Proyecto Costia, No-Objetivos (Non-Goals): (+1 more)

### Community 29 - "Review Focus"
Cohesion: 0.22
Nodes (8): Global Constraints, Plan de Implementación: Organización Estructural del Proyecto Costia, Review Focus, Task 1: Creación de directorios y reubicación de archivos, Task 2: Corrección de rutas de assets en presentación reubicada, Task 3: Creación de archivo `.gitignore`, Task 4: Actualización de documentación (`README.md` y guía), Task 5: Actualización del grafo de conocimiento con Graphify

### Community 30 - "4. Arquitectura de Contenido en 4 Actos (`index.html`)"
Cohesion: 0.12
Nodes (15): 1. Intención y Diagnóstico del Problema Actual, 2. Reglas de Oficio Estrictas (`impeccable:craft-floor` & `distill`), 3.1 Paleta Cromática (CSS Custom Properties en `presentacion.css`), 3.2 Tipografía, 3. Sistema Visual: Paleta, Tipografía y Tokens, 4. Arquitectura de Contenido en 4 Actos (`index.html`), 5. Gramática de Movimiento e Interacción (Emil Kowalski Style), Acto 1: Hero + Mesa de Costeo Interactiva Unificada (`#mesa-costeo`) (+7 more)

### Community 31 - "Product"
Cohesion: 0.15
Nodes (12): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+4 more)

### Community 32 - "3. Diseño por Bloque"
Cohesion: 0.22
Nodes (8): 1. Sistema de Tokens Globales (`assets/css/base.css`), 2. Reglas Anti-Slop (`impeccable detect` = 0 alertas), 3. Diseño por Bloque, Bloque 1: Base & Autenticación (`base.css`, `auth.css`, `login.html`, `registro.html`), Bloque 2: Shell Operativo & Catálogo (`app.css`, `productos.css`, `productos.html`), Bloque 3: Inventario de Insumos (`insumos.css`, `insumos.html`), Bloque 4: Taller de Recetas & Fichas Imprimibles (`crear-producto.css`, `crear-producto.html`, `ficha-tecnica.html`, `ficha-preview.html`), Especificación de Rediseño: Ecosistema Interno Costia ("Atelier Gastronómico & Consola de Precisión")

### Community 33 - "Reglas Globales Estrictas para el Subagente Flash (`impeccable detect` = 0 alertas)"
Cohesion: 0.25
Nodes (7): Plan de Implementación: Rediseño del Ecosistema Interno Costia, Reglas Globales Estrictas para el Subagente Flash (`impeccable detect` = 0 alertas), Task 1: Tokens Base y Vistas de Autenticación (`base.css`, `auth.css`, `login.html`, `registro.html`), Task 2: Shell Operativo y Catálogo de Productos (`app.css`, `productos.css`, `productos.html`), Task 3: Inventario de Insumos (`insumos.css`, `insumos.html`), Task 4: Taller de Recetas y Fichas Técnicas (`crear-producto.css`, `crear-producto.html`, `ficha-tecnica.html`, `ficha-preview.html`), Task 5: Verificación Senior (`impeccable detect` + `graphify`)

### Community 34 - "@playwright/test"
Cohesion: 0.12
Nodes (9): @playwright/test, { test, expect }, { test, expect }, { test, expect }, { test, expect }, { test, expect }, { test, expect }, { test, expect } (+1 more)

### Community 38 - "README.md"
Cohesion: 0.12
Nodes (3): ConfiguracionController, controladorCrear, FichaTecnicaControlador

### Community 45 - "package.json"
Cohesion: 0.15
Nodes (12): author, description, devDependencies, @playwright/test@^1.64.1, directories, doc, keywords, license (+4 more)

### Community 47 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, test, test:headed, test:report, test:ui

### Community 48 - "audit-responsive-full.spec.js"
Cohesion: 0.50
Nodes (3): APP_PAGES, { test, expect }, VIEWPORTS

### Community 51 - "playwright.config.js"
Cohesion: 0.28
Nodes (3): { defineConfig, devices }, fs, ARTIFACT_DIR

### Community 57 - "🎓 COSTIA — Guía de Estudio y Defensa de Proyecto"
Cohesion: 0.09
Nodes (23): 10. Banco de Preguntas Trampa del Docente y Respuestas Modelo, 11. Plan de Contingencia, 1. Ficha Técnica del Proyecto, 1. *"¿Por qué utilizaron PDO en lugar de MySQLi?"*, 2. *"¿Dónde está aplicada la Tercera Forma Normal (3FN)?"*, 2. El Problema que Resuelve (Justificación de Negocio), 3. *"¿Cómo garantizan transacciones atómicas al crear o actualizar recetas?"*, 3. Repartición de Roles para la Exposición (+15 more)

### Community 58 - "models.js"
Cohesion: 0.20
Nodes (3): ImageHelper, Insumo, 3. Librerías, APIs y Tecnologías Utilizadas (y para qué sirve cada una)

### Community 60 - "Costia — Guía Completa de Estudio, Arquitectura, Librerías y Pitch con Datos Verificados"
Cohesion: 0.18
Nodes (10): 1. ¿Qué es Costia y qué problema resuelve?, 2.1. Capas del Sistema, 2.2. Seguridad y Cumplimiento Legal Incorporados, 2. Arquitectura Técnica y Mapa del Proyecto, 4. Recorrido Rápido por los Módulos (Mapa de Estudio), 7. Preguntas Frecuentes del Jurado y Respuestas Modelo, 8. Cómo Ejecutar el Proyecto (Guía Rápida para tu Compañero), Costia — Guía Completa de Estudio, Arquitectura, Librerías y Pitch con Datos Verificados (+2 more)

### Community 61 - "Costia — Sistema de Costeo Gastronómico y Fijación de Precios de Venta"
Cohesion: 0.29
Nodes (7): 🏗 Arquitectura del Software, 🤖 Asesor Financiero IA (Híbrido: Ollama + Motor Determinista), Costia — Sistema de Costeo Gastronómico y Fijación de Precios de Venta, 📖 Mapa de Estudio Rápido (Para entender el código en 4 pasos), 🧪 Pruebas Automatizadas E2E (Playwright), 🛠 Requisitos del Entorno, 👤 Usuario de Prueba Preconfigurado

### Community 63 - "6. Pitch de Presentación con Datos Verificados"
Cohesion: 0.50
Nodes (4): 6.1. Cifras Verificadas Clave para Memorizar, 6.2. Elevator Pitch (60 segundos), 6.3. Guion de Presentación Completo (3 minutos + Demo en Vivo), 6. Pitch de Presentación con Datos Verificados

## Knowledge Gaps
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `StoreService` connect `StoreService` to `UnidadConverter`, `Usuario`, `README.md`, `.getConnection`, `models.js`, `Costia — Guía Completa de Estudio, Arquitectura, Librerías y Pitch con Datos Verificados`, `Costia — Sistema de Costeo Gastronómico y Fijación de Precios de Venta`, `🎓 COSTIA — Guía de Estudio y Defensa de Proyecto`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `StoreService` (e.g. with `12. Mapa de Estudio Rápido para el Compañero` and `1. Ficha Técnica del Proyecto`) actually correct?**
  _`StoreService` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Should `StoreService` be split into smaller, more focused modules?**
  _Cohesion score 0.13002114164904863 - nodes in this community are weakly interconnected._
- **Why does `AsesorCostiaAgent` connect `AsesorCostiaAgent` to `README.md`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `CrearProductoController` be split into smaller, more focused modules?**
  _Cohesion score 0.13800904977375567 - nodes in this community are weakly interconnected._
- **Why does `CrearProductoController` connect `CrearProductoController` to `README.md`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Should `Usuario` be split into smaller, more focused modules?**
  _Cohesion score 0.10685483870967742 - nodes in this community are weakly interconnected._