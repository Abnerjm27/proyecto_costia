# Graph Report - proyecto_costia  (2026-11-20)

## Corpus Check
- 70 files · ~89,130 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 11, .example 1, (none) 1)

## Summary
- 617 nodes · 971 edges · 53 communities (18 shown, 35 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `88471b59`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- StoreService
- Producto
- InsumoController
- CrearProductoController
- Usuario
- Producto
- InsumosController
- ProductosWorkstationController
- Insumo
- manifest.json
- AsesorCostiaAgent
- security.spec.js
- Review Focus
- AsesorParser
- AsesorUI
- 🎓 COSTIA — Guía de Estudio y Defensa de Proyecto
- AsesorFinanzas
- Documento de Diseño: Organización Estructural del Proyecto Costia
- Review Focus
- 4. Arquitectura de Contenido en 4 Actos (`index.html`)
- Product
- 3. Diseño por Bloque
- Reglas Globales Estrictas para el Subagente Flash (`impeccable detect` = 0 alertas)
- @playwright/test
- FichaTecnicaControlador
- sw.js
- ThemeManager
- AppShell
- .ejecutarAccionChip
- DashboardWorkstationController
- AsesorFlujo
- RecetaItem
- package.json
- README.md
- scripts
- audit-responsive-full.spec.js
- asesor-multiperfil.spec.js
- ux-transformation.spec.js
- playwright.config.js
- crear-producto.spec.js
- dashboard.spec.js

## God Nodes (most connected - your core abstractions)
1. `AsesorCostiaAgent` - 52 edges
2. `StoreService` - 50 edges
3. `CrearProductoController` - 30 edges
4. `DashboardWorkstationController` - 23 edges
5. `InsumosController` - 22 edges
6. `@playwright/test` - 20 edges
7. `AsesorParser` - 18 edges
8. `Producto` - 17 edges
9. `🎓 COSTIA — Guía de Estudio y Defensa de Proyecto` - 14 edges
10. `Usuario` - 14 edges

## Surprising Connections (you probably didn't know these)
- `1. Ficha Técnica del Proyecto` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `5. *"¿La configuración del negocio (arriendo, nómina, delivery) también persiste en MySQL?"*` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `👤 Integrante B: "Arquitectura, Backend PHP, MySQL, Seguridad e IA"` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `Minuto 1:30 – 3:30 | Arquitectura MVC, Híbrida y Base de Datos (Integrante B)` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `12. Mapa de Estudio Rápido para el Compañero` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js

## Import Cycles
- None detected.

## Communities (53 total, 35 thin omitted)

### Community 1 - "Producto"
Cohesion: 0.09
Nodes (11): Insumo, ItemReceta, Producto, UnidadConverter, 12. Mapa de Estudio Rápido para el Compañero, 1. Conversión Universal (`UnidadConverter` en `assets/js/models.js`), 2. Costo Real Unitario (con Merma, Empaque y Prorrateo de Gastos Fijos), 3. Markup vs. Margen Comercial sobre Venta (+3 more)

### Community 2 - "InsumoController"
Cohesion: 0.07
Nodes (13): Database, InsumoController, ProductoController, Patrones principales del código:, 🏗 Arquitectura del Software, 🤖 Asesor Financiero IA (Híbrido: Ollama + Motor Determinista), Costia — Sistema de Costeo Gastronómico y Fijación de Precios de Venta, 🚀 Ejecución Rápida (+5 more)

### Community 4 - "Usuario"
Cohesion: 0.12
Nodes (5): AuthController, Usuario, 6. Base de Datos Relacional y Modelo 3FN, 8. Seguridad, Privacidad y Asesor IA, Datos demo alineados:

### Community 9 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, scope, short_name (+2 more)

### Community 12 - "Review Focus"
Cohesion: 0.15
Nodes (11): formatoPesos(), inicializarMesaCosteo(), recalcular(), RECETAS_DEMO, Global Constraints, Rediseño Editorial de `index.html` ("Atelier Gastronómico") Implementation Plan, Review Focus, Task 1: Reestructurar el HTML semántico de `index.html` en 4 Actos Destilados (+3 more)

### Community 25 - "🎓 COSTIA — Guía de Estudio y Defensa de Proyecto"
Cohesion: 0.09
Nodes (23): 10. Banco de Preguntas Trampa del Docente y Respuestas Modelo, 11. Plan de Contingencia, 1. Ficha Técnica del Proyecto, 1. *"¿Por qué utilizaron PDO en lugar de MySQLi?"*, 2. *"¿Dónde está aplicada la Tercera Forma Normal (3FN)?"*, 2. El Problema que Resuelve (Justificación de Negocio), 3. *"¿Cómo garantizan transacciones atómicas al crear o actualizar recetas?"*, 3. Repartición de Roles para la Exposición (+15 more)

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

### Community 45 - "package.json"
Cohesion: 0.15
Nodes (12): author, description, devDependencies, @playwright/test@^1.64.1, directories, doc, keywords, license (+4 more)

### Community 46 - "README.md"
Cohesion: 0.12
Nodes (3): ConfiguracionController, controladorCrear, Session

### Community 47 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, test, test:headed, test:report, test:ui

### Community 48 - "audit-responsive-full.spec.js"
Cohesion: 0.50
Nodes (3): APP_PAGES, { test, expect }, VIEWPORTS

### Community 51 - "playwright.config.js"
Cohesion: 0.28
Nodes (3): { defineConfig, devices }, fs, ARTIFACT_DIR

## Knowledge Gaps
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AsesorCostiaAgent` connect `AsesorCostiaAgent` to `README.md`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `StoreService` (e.g. with `12. Mapa de Estudio Rápido para el Compañero` and `1. Ficha Técnica del Proyecto`) actually correct?**
  _`StoreService` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `StoreService` be split into smaller, more focused modules?**
  _Cohesion score 0.1207897793263647 - nodes in this community are weakly interconnected._
- **Why does `StoreService` connect `StoreService` to `Producto`, `InsumoController`, `Usuario`, `README.md`, `🎓 COSTIA — Guía de Estudio y Defensa de Proyecto`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `Producto` be split into smaller, more focused modules?**
  _Cohesion score 0.08901515151515152 - nodes in this community are weakly interconnected._
- **Why does `CrearProductoController` connect `CrearProductoController` to `README.md`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `InsumoController` be split into smaller, more focused modules?**
  _Cohesion score 0.07258064516129033 - nodes in this community are weakly interconnected._