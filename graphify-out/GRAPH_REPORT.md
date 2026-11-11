# Graph Report - proyecto_costia  (2026-11-10)

## Corpus Check
- 83 files · ~389,620 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: .css 12, (none) 1)

## Summary
- 639 nodes · 947 edges · 47 communities (16 shown, 31 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

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
- Review Focus
- AsesorParser
- AsesorUI
- 🎓 COSTIA — Guía de Estudio y Defensa de Proyecto
- Costia — Sistema de Costeo y Fijación de Precios de Venta
- AsesorFinanzas
- Documento de Diseño: Organización Estructural del Proyecto Costia
- Review Focus
- 4. Arquitectura de Contenido en 4 Actos (`index.html`)
- Product
- 3. Diseño por Bloque
- Reglas Globales Estrictas para el Subagente Flash (`impeccable detect` = 0 alertas)
- package.json
- FichaTecnicaControlador
- sw.js
- CostiaProTerminal
- ThemeManager
- AppShell
- .ejecutarAccionChip
- DashboardWorkstationController
- AsesorFlujo
- package.json
- ConfiguracionController
- ref_playwright

## God Nodes (most connected - your core abstractions)
1. `AsesorCostiaAgent` - 52 edges
2. `StoreService` - 45 edges
3. `InsumosController` - 22 edges
4. `ProductosWorkstationController` - 22 edges
5. `CrearProductoController` - 21 edges
6. `@playwright/test` - 20 edges
7. `AsesorParser` - 18 edges
8. `Producto` - 17 edges
9. `DashboardWorkstationController` - 15 edges
10. `CostiaProTerminal` - 15 edges

## Surprising Connections (you probably didn't know these)
- `👤 Integrante B: "Enfoque de Arquitectura Técnica, Backend, Base de Datos y Seguridad"` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `Patrones Utilizados:` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `1. Conversión Universal de Unidades (`UnidadConverter` en `models.js`):` --references--> `UnidadConverter`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/models.js
- `11. Plan de Contingencia` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js
- `Minuto 1:30 - 3:30 | Arquitectura del Sistema y Tecnologías (Integrante B)` --references--> `StoreService`  [INFERRED]
  docs/entregas/GUIA_PRESENTACION.md → assets/js/store.js

## Import Cycles
- None detected.

## Communities (47 total, 31 thin omitted)

### Community 1 - "Producto"
Cohesion: 0.09
Nodes (11): Insumo, ItemReceta, Producto, UnidadConverter, 1. Conversión Universal de Unidades (`UnidadConverter` en `models.js`):, 2. Factor de Merma (Desperdicio o Evaporación):, 3. Costo Total de Producción:, 4. Markup vs. Margen Comercial (Diferencia Fundamental): (+3 more)

### Community 2 - "InsumoController"
Cohesion: 0.10
Nodes (3): Database, InsumoController, ProductoController

### Community 4 - "Usuario"
Cohesion: 0.13
Nodes (3): Session, AuthController, Usuario

### Community 9 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, name, orientation, scope, short_name (+2 more)

### Community 12 - "Review Focus"
Cohesion: 0.15
Nodes (11): formatoPesos(), inicializarMesaCosteo(), recalcular(), RECETAS_DEMO, Global Constraints, Rediseño Editorial de `index.html` ("Atelier Gastronómico") Implementation Plan, Review Focus, Task 1: Reestructurar el HTML semántico de `index.html` en 4 Actos Destilados (+3 more)

### Community 25 - "🎓 COSTIA — Guía de Estudio y Defensa de Proyecto"
Cohesion: 0.05
Nodes (31): RecetaItem, 10. Banco de Preguntas Trampa del Docente y Respuestas Modelo, 11. Plan de Contingencia, 1. Ficha Técnica del Proyecto, 2. El Problema que Resuelve (Justificación de Negocio), 3. Repartición de Roles para la Exposición, 4. Guion de Exposición Minuto a Minuto (8 a 10 min), 5. Arquitectura Técnica y Patrones de Diseño (+23 more)

### Community 26 - "Costia — Sistema de Costeo y Fijación de Precios de Venta"
Cohesion: 0.22
Nodes (8): 🏗 Arquitectura del Software, ⚡ Características Principales, 🗄️ Configuración de la Base de Datos (MySQL), Costia — Sistema de Costeo y Fijación de Precios de Venta, Opción A: Desde phpMyAdmin (XAMPP), Opción B: Desde la Consola de MySQL (CMD / PowerShell), 🛠 Requisitos del Entorno, 👤 Usuario de Prueba Preconfigurado

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

### Community 34 - "package.json"
Cohesion: 0.05
Nodes (20): { defineConfig, devices }, @playwright/test, PAGES, PAGES, VIEWPORTS, { test, expect }, { test, expect }, APP_PAGES (+12 more)

### Community 45 - "package.json"
Cohesion: 0.11
Nodes (17): author, description, devDependencies, @playwright/test, directories, doc, keywords, license (+9 more)

### Community 47 - "ref_playwright"
Cohesion: 0.08
Nodes (12): { chromium }, { chromium }, { chromium }, { chromium }, { chromium }, { chromium }, { chromium }, { chromium } (+4 more)

## Knowledge Gaps
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Minuto 1:30 - 3:30 | Arquitectura del Sistema y Tecnologías (Integrante B)` connect `🎓 COSTIA — Guía de Estudio y Defensa de Proyecto` to `StoreService`, `Usuario`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `StoreService` (e.g. with `11. Plan de Contingencia` and `👤 Integrante B: "Enfoque de Arquitectura Técnica, Backend, Base de Datos y Seguridad"`) actually correct?**
  _`StoreService` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `StoreService` be split into smaller, more focused modules?**
  _Cohesion score 0.11962833914053426 - nodes in this community are weakly interconnected._
- **Why does `🎓 COSTIA — Guía de Estudio y Defensa de Proyecto` connect `🎓 COSTIA — Guía de Estudio y Defensa de Proyecto` to `Producto`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Should `Producto` be split into smaller, more focused modules?**
  _Cohesion score 0.0907258064516129 - nodes in this community are weakly interconnected._
- **Why does `StoreService` connect `StoreService` to `🎓 COSTIA — Guía de Estudio y Defensa de Proyecto`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `InsumoController` be split into smaller, more focused modules?**
  _Cohesion score 0.09782608695652174 - nodes in this community are weakly interconnected._