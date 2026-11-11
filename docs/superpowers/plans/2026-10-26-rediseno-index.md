# Rediseño Editorial de `index.html` ("Atelier Gastronómico") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar por completo `index.html`, `assets/css/presentacion.css` y `assets/js/presentacion.js` bajo el concepto "Atelier Gastronómico & Cuaderno de Costeo", eliminando la sobrecarga de 8 secciones y los clichés de plantilla IA, y unificando el Ticket del Hero y el Simulador en una única Mesa de Costeo interactiva con micro-interacciones al estilo Emil Kowalski.

**Architecture:** Destilación de 8 bloques redundantes a 4 actos editoriales con alto contraste entre superficie cálida de papel de obrador (`#FAF7F2`) y verde pino abisal (`#071F17`). Unificación del estado interactivo en `assets/js/presentacion.js` donde los presets de recetas alimentan directamente el motor de simulación en vivo, con visualización proporcional de costos y acordeón animado por CSS Grid (`0fr` -> `1fr`).

**Tech Stack:** HTML5 semántico, CSS3 Custom Properties + CSS Grid/Flexbox, Vanilla JavaScript (ES6+), Google Fonts (`Instrument Serif`, `Plus Jakarta Sans`, `JetBrains Mono`).

**Spec:** `docs/superpowers/specs/2026-10-26-rediseno-index-design.md`

## Global Constraints

- **Cero Emojis:** Prohibido incluir caracteres emoji (`🍞`, `🍰`, `🍪`, `📦`, `❌`, `✅`, `⚠️`, `💡`, `🔒`, `⚡`, `✨`, `🟢`, `🟡`) en `index.html` y `assets/js/presentacion.js`. Usar exclusivamente SVGs inline con `stroke="currentColor" stroke-width="1.75"`.
- **Cero Eyebrow Pills (`.seccion-pill`):** Prohibido colocar píldoras decorativas encima de los encabezados `h2`.
- **Cero Texto con Gradiente y Cero Olas SVG:** Prohibido usar `-webkit-background-clip: text` o divisores `.hero-ola`.
- **Tipografía Tabular Obligatoria:** Todo precio, peso, porcentaje o cifra debe usar `font-family: var(--font-mono)` y `font-variant-numeric: tabular-nums`.
- **Rutas Intactas:** Preservar todos los enlaces hacia `paginas/login.html`, `paginas/registro.html`, `paginas/productos.html` y el logo `assets/img/costia-icon-green.png`.
- **Sincronización Graphify:** Ejecutar `graphify update .` al concluir las modificaciones de código.

## Review Focus

1. **Sincronización Receta -> Simulador:** Al hacer clic en cualquiera de las 3 pestañas de receta (`Pan Masa Madre`, `Torta Cacao 70%`, `Café & Alfajor`), deben actualizarse tanto la tabla de 3 ingredientes como los inputs `#sim-costo`, `#sim-unidades`, `#sim-margen` y todos los cálculos de salida sin desfase.
2. **Suma Exacta de la Barra Proporcional:** Los 3 segmentos de la barra de composición (`#barra-seg-costo`, `#barra-seg-fijos`, `#barra-seg-utilidad`) deben sumar siempre `100%` del precio de venta, incluyendo cuando el switch `#sim-fijos` está desactivado (`0%` para fijos).
3. **Validación de Inputs Extremos en el Simulador:** Si el usuario escribe `0`, un número negativo o deja vacío `#sim-costo` o `#sim-unidades`, `recalcular()` no debe mostrar `NaN`, `Infinity` ni romper la barra proporcional.
4. **Apertura Fluida del Acordeón FAQ:** El acordeón debe abrir y cerrar usando `grid-template-rows: 0fr` a `1fr` en `.faq__panel` y actualizar `aria-expanded="true/false"` en el botón `.faq__pregunta`.
5. **Cumplimiento del Detector `impeccable`:** `impeccable detect --json index.html assets/css/presentacion.css` y la búsqueda por regex de emojis/pills deben pasar limpios.

---

### Task 1: Reestructurar el HTML semántico de `index.html` en 4 Actos Destilados

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces DOM IDs consumed by `assets/js/presentacion.js`:
  - `.hero-receta-tab[data-receta]` (`"pan"`, `"torta"`, `"cafe"`)
  - `#mesa-receta-nombre`, `#mesa-receta-tipo`, `#mesa-insumos-lista`
  - `#sim-costo`, `#sim-unidades`, `#btn-unidades-menos`, `#btn-unidades-mas`, `#sim-margen`, `#sim-margen-display`, `#sim-fijos`
  - `#barra-seg-costo`, `#barra-seg-fijos`, `#barra-seg-utilidad`, `#leyenda-pct-costo`, `#leyenda-pct-fijos`, `#leyenda-pct-utilidad`
  - `#sim-res-costo`, `#sim-res-fijos`, `#sim-res-precio`, `#sim-res-ganancia`, `#sim-res-lote`, `#sim-estado-badge`, `#sim-res-consejo`
  - `.faq__item`, `.faq__pregunta`, `.faq__panel`, `.faq__respuesta`

- [x] **Step 1: Verificar presencia actual de anti-patrones en `index.html` (Test inicial que debe evidenciar lo que vamos a eliminar)**

Run:
```powershell
Select-String -Path .\index.html -Pattern "seccion-pill|hero-ola|hero__gradiente-texto"
```
Expected: Muestra coincidencias en el `index.html` antiguo que serán eliminadas.

- [x] **Step 2: Reescribir `index.html` con la estructura editorial de 4 actos y la Mesa de Costeo Unificada**

Reemplazar el contenido completo de `index.html` con el documento semántico de 4 actos siguiendo la especificación `docs/superpowers/specs/2026-10-26-rediseno-index-design.md`:
1. `<head>`:
   - Cargar Google Fonts: `Instrument+Serif:ital@0;1`, `Plus+Jakarta+Sans:wght@400;500;600;700`, `JetBrains+Mono:wght@400;500;600`.
   - Enlazar `assets/css/base.css?v=11` y `assets/css/presentacion.css?v=11`.
2. **Header `.navbar`**:
   - Marca con `assets/img/costia-icon-green.png` + `<span>Costia</span>`.
   - `.nav-links`: `#mesa-costeo` ("Mesa de costeo"), `#arquitectura` ("Mecanismo"), `#como-funciona` ("Proceso"), `#faq` ("Preguntas").
   - `.acciones`: `<a href="paginas/login.html" class="nav-link-login">Iniciar sesión</a>` y `<a href="paginas/registro.html" class="btn-atelier-primario">Comenzar gratis</a>`.
3. **Acto 1 (`section.hero-atelier#mesa-costeo`)**:
   - `.hero-atelier__grid`:
     - **Columna Izquierda (`.hero-atelier__copy`)**:
       - Etiqueta técnica sobria `.hero-kicker`: `<span class="kicker-dot"></span> SISTEMA DE COSTEO Y FIJACIÓN DE PRECIOS`
       - `<h1>El arte de producir merece <em>cuentas claras.</em></h1>`
       - `<p class="hero-lead">Convierte bultos y litros al gramo, integra tu arriendo y servicios en cada unidad producida y define precios rentables con el respaldo de nuestro Asesor Financiero IA.</p>`
       - `.hero-cta-group`:
         - `<a href="paginas/registro.html" class="btn-atelier-primario btn-lg"><span>Empezar a costear gratis</span> [SVG flecha derecha]</a>`
         - `<a href="paginas/productos.html" class="btn-atelier-secundario btn-lg"><span>Explorar catálogo demo</span></a>`
       - `.hero-pilares`: 3 ítems con valor en `--font-mono` y descripción concisa:
         - `01 / Al gramo` — Conversión exacta de bultos, litros y merma de cocción.
         - `02 / Costo real` — Prorrateo automático de arriendo, luz, agua y gas.
         - `03 / Asesor IA` — Ajuste en cascada cuando sube cualquier materia prima.
     - **Columna Derecha (`.mesa-costeo` — La Ficha Interactiva Unificada)**:
       - Cabecera `.mesa-costeo__top`:
         - Indicador `FICHA TÉCNICA INTERACTIVA` en `--font-mono` + `.hero-recetas-tabs` (`role="tablist"`) con 3 botones `.hero-receta-tab`:
           - `data-receta="pan"` (activo): `Pan Masa Madre`
           - `data-receta="torta"`: `Torta Cacao 70%`
           - `data-receta="cafe"`: `Café & Alfajor`
       - Subcabecera `.mesa-costeo__meta`:
         - `<strong id="mesa-receta-nombre">Pan de Masa Madre (Hogaza 750 g)</strong>`
         - `<span id="mesa-receta-tipo">Panadería artesanal · Horneado diario</span>`
       - Bloque de ingredientes `.mesa-insumos`:
         - Cabecera tabular `<span>MATERIA PRIMA DEL LOTE</span><span>COSTO</span>`
         - `<ul class="mesa-insumos__lista" id="mesa-insumos-lista" aria-live="polite">` con las 3 líneas iniciales del Pan Masa Madre.
       - Bloque de controles vivos `.mesa-controles`:
         - Fila de 2 columnas (`.mesa-controles__row`):
           1. Campo `#sim-costo` (`type="number"`, `value="54500"`, `min="500"`, `step="500"`) con prefijo `$` y etiqueta `Costo ingredientes lote (COP)`.
           2. Campo `#sim-unidades` (`type="number"`, `value="10"`, `min="1"`, `step="1"`) acompañado de botones `#btn-unidades-menos` (`-`) y `#btn-unidades-mas` (`+`) con etiqueta `Unidades que rinde el lote`.
         - Control de Margen `.mesa-slider-box`:
           - `<label for="sim-margen"><span>Margen bruto comercial deseado</span><output id="sim-margen-display" for="sim-margen">60%</output></label>`
           - `<input type="range" id="sim-margen" class="mesa-slider" min="20" max="80" value="60" step="1">`
         - Toggle de gastos fijos `.mesa-toggle`:
           - `<input type="checkbox" id="sim-fijos" checked>`
           - `<span class="mesa-toggle__track" aria-hidden="true"><span class="mesa-toggle__thumb"></span></span>`
           - Texto: `Prorratear arriendo y servicios del obrador (+18% s/costo directo)`
       - Barra de composición del precio `.mesa-composicion`:
         - Cabecera: `<span>ESTRUCTURA DE CADA UNIDAD VENDIDA</span>`
         - Barra `.mesa-barra`:
           - `<div class="mesa-barra__seg seg-costo" id="barra-seg-costo" style="width: 34%"></div>`
           - `<div class="mesa-barra__seg seg-fijos" id="barra-seg-fijos" style="width: 6%"></div>`
           - `<div class="mesa-barra__seg seg-utilidad" id="barra-seg-utilidad" style="width: 60%"></div>`
         - Leyenda `.mesa-leyenda`:
           - `<span><i class="dot-costo"></i> Insumos <strong id="leyenda-pct-costo">34%</strong></span>`
           - `<span><i class="dot-fijos"></i> Servicios/Local <strong id="leyenda-pct-fijos">6%</strong></span>`
           - `<span><i class="dot-utilidad"></i> Utilidad neta <strong id="leyenda-pct-utilidad">60%</strong></span>`
       - Panel de resultados `.mesa-resultados` (`aria-live="polite"`):
         - 3 celdas numéricas principales:
           - `Costo unitario real`: `<strong id="sim-res-costo">$ 6.431</strong>` (con subdetalle: `Incluye <span id="sim-res-fijos">$ 981</span> de fijos`)
           - `Precio sugerido de venta`: `<strong id="sim-res-precio" class="precio-destacado">$ 16.078</strong>`
           - `Utilidad neta del lote`: `<strong id="sim-res-lote">$ 96.465</strong>` (con subdetalle: `<span id="sim-res-ganancia">$ 9.647</span> libres / ud`)
         - Diagnóstico IA `.mesa-ia-box`:
           - `<span class="mesa-ia-badge" id="sim-estado-badge">Margen saludable</span>`
           - `<p id="sim-res-consejo">Rango óptimo para panadería artesanal. Cubre mermas, absorbe servicios y protege tu utilidad neta.</p>`
         - Pie de ficha `.mesa-footer-cta`:
           - `<a href="paginas/registro.html" class="mesa-link-guardar">Guardar y desglosar esta receta en Costia →</a>`
4. **Acto 2 (`section.seccion-arquitectura#arquitectura`)**:
   - Encabezado editorial de 2 columnas (`.arquitectura-header`):
     - Índice técnico `01 / RIGOR CONTABLE`
     - `<h2>Por qué las cuentas de servilleta se comen tu ganancia sin que lo notes.</h2>`
     - `<p>La mayoría de los negocios gastronómicos fijan precios multiplicando solo la harina y el azúcar, olvidando la merma de horneado, el empaque, el gas y las subidas silenciosas de sus proveedores.</p>`
   - Grilla `.arquitectura-grid` de 3 paneles con bordes finos compartidos (`1px solid var(--borde-fino)`):
     - **Panel 1 (`.arq-panel`)**: Conversión universal al gramo y factor de merma. Incluye bloque de demostración `.arq-demo-tabla` mostrando `Harina Trigo (Bulto 50 kg: $95.000)` $\rightarrow$ `Uso en receta: 500 g ($950)` $\rightarrow$ `Ajuste merma horneado (6%): $1.011`.
     - **Panel 2 (`.arq-panel`)**: Arriendo, energía y mano de obra integrados por unidad. Incluye comparativa `.arq-demo-comparativa` mostrando la diferencia entre *Costo aparente ($5.450)* y *Costo real absorbiendo local y servicios ($6.431)*.
     - **Panel 3 (`.arq-panel arq-panel--ancho`)**: Asesor Financiero IA con actualización en cascada. Incluye interfaz `.arq-demo-ia` limpia (sin emojis) con el comando `"El bloque de mantequilla de 2.5 kg subió a $68.000"` y la respuesta técnica del agente mostrando las 3 recetas recalculadas automáticamente.
5. **Acto 3 (`section.seccion-operativa`)**:
   - `.operativa-grid` (2 columnas asimétricas):
     - **Columna Izquierda (`#como-funciona`)**:
       - Índice `02 / FLUJO DE TRABAJO`
       - `<h2>De la factura del proveedor al precio en vitrina.</h2>`
       - Lista `.pasos-atelier` con 3 ítems (`01`, `02`, `03`) y enlace `<a href="paginas/productos.html" class="link-editorial">Probar el catálogo interactivo sin registrarse →</a>`.
     - **Columna Derecha (`#faq`)**:
       - Índice `03 / DUDAS FRECUENTES`
       - `<h2>Preguntas esenciales</h2>`
       - `.faq-lista` con 5 `.faq__item` (el primero `.activo` con `aria-expanded="true"`), cada uno con `<button class="faq__pregunta">`, un SVG `+` (`.faq__icono-svg`) y `<div class="faq__panel"><div class="faq__respuesta">...</div></div>`.
6. **Acto 4 (`section.cierre-editorial` + `footer.footer`)**:
   - Bloque de cierre en verde pino abisal con título en `Instrument Serif`, botones a `paginas/registro.html` y `paginas/productos.html`, y el pie de página limpio.

- [x] **Step 3: Verificar que `index.html` no contiene emojis ni clases prohibidas y que todos los IDs existen**

Run:
```powershell
Select-String -Path .\index.html -Pattern "seccion-pill|hero-ola|hero__gradiente-texto|[🍞🍰🍪📦❌✅⚠️💡🔒⚡✨🟢🟡]"
Select-String -Path .\index.html -Pattern "id=""(mesa-insumos-lista|sim-costo|sim-unidades|sim-margen|sim-fijos|barra-seg-costo|sim-res-precio)"""
```
Expected: La primera búsqueda no devuelve ninguna coincidencia; la segunda devuelve las 7 líneas con los IDs requeridos.

---

### Task 2: Reescribir `assets/css/presentacion.css` con el Sistema Visual "Atelier Gastronómico" y Micro-interacciones

**Files:**
- Modify: `assets/css/presentacion.css`

**Interfaces:**
- Consumes: Clases y estructura DOM creadas en `index.html` (Task 1) y variables base de `assets/css/base.css`.
- Produces: Estilos completos de la landing page, layout responsivo y transiciones CSS Grid/Flexbox.

- [x] **Step 1: Escribir la hoja de estilos completa `assets/css/presentacion.css`**

Reemplazar `assets/css/presentacion.css` implementando:
1. Variables en `:root`:
   ```css
   :root {
       --papel-obrador: #FAF7F2;
       --papel-elevado: #F2ECE1;
       --superficie-blanca: #FFFFFF;
       --pino-abisal: #071F17;
       --pino-medio: #0C3326;
       --tinta-principal: #10211B;
       --tinta-secundaria: #4A5D55;
       --esmeralda-accion: #0D9464;
       --esmeralda-luz: #34D399;
       --cobre-costo: #B86B28;
       --gris-fijos: #475569;
       --borde-fino: rgba(16, 33, 27, 0.11);
       --borde-fino-fuerte: rgba(16, 33, 27, 0.20);
       --borde-fino-oscuro: rgba(240, 247, 244, 0.12);
       --font-editorial: 'Instrument Serif', Georgia, serif;
       --font-ui: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
       --font-mono: 'JetBrains Mono', monospace;
       --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
   }
   ```
2. Reglas de tipografía y contraste:
   - `body` con `background-color: var(--papel-obrador); color: var(--tinta-principal); font-family: var(--font-ui);`.
   - Números tabulares (`font-variant-numeric: tabular-nums`) aplicados a `.mesa-insumos__lista`, `.mesa-resultados`, `.sim-input`, `.arq-demo-tabla`, `.arq-demo-comparativa`, `.pasos-atelier__num`.
3. Diseño de `.hero-atelier` y `.mesa-costeo`:
   - Fondo `--pino-abisal` con retícula arquitectónica sutil (`linear-gradient` de `1px` al `3%` de opacidad).
   - `.mesa-costeo` como una hoja técnica elevada en `--superficie-blanca` y `--papel-obrador` con bordes nítidos, controles táctiles de unidad (`-` / `+`), slider estilizado, switch físico `.mesa-toggle`, y barra de composición `.mesa-barra` con `transition: width 260ms var(--ease-out)` en sus 3 segmentos.
4. Diseño de `.seccion-arquitectura` (Bordes compartidos tipo hoja contable `1px solid var(--borde-fino)`).
5. Diseño de `.seccion-operativa` y acordeón `.faq__panel` con animación pura tipo Emil Kowalski:
   ```css
   .faq__panel {
       display: grid;
       grid-template-rows: 0fr;
       opacity: 0;
       transition: grid-template-rows 240ms var(--ease-out), opacity 180ms var(--ease-out);
   }
   .faq__item.activo .faq__panel {
       grid-template-rows: 1fr;
       opacity: 1;
   }
   .faq__panel > .faq__respuesta {
       overflow: hidden;
   }
   .faq__icono-svg {
       transition: transform 220ms var(--ease-out);
   }
   .faq__item.activo .faq__icono-svg {
       transform: rotate(45deg);
   }
   ```
6. Diseño responsivo (`@media (max-width: 980px)` y `@media (max-width: 640px)`) y soporte de `@media (prefers-reduced-motion: reduce)`.

- [x] **Step 2: Verificar que `assets/css/presentacion.css` no tenga propiedades prohibidas (`background-clip: text` o sombras duras `4px 4px 0`)**

Run:
```powershell
Select-String -Path .\assets\css\presentacion.css -Pattern "background-clip:\s*text|4px 4px 0|hero-ola|seccion-pill"
```
Expected: 0 coincidencias.

---

### Task 3: Actualizar `assets/js/presentacion.js` con el Motor Unificado de la Mesa de Costeo

**Files:**
- Modify: `assets/js/presentacion.js`

**Interfaces:**
- Consumes: IDs y clases de `index.html` definidos en Task 1.
- Produces: Interactividad completa sin errores de consola y sin emojis.

- [x] **Step 1: Reescribir `assets/js/presentacion.js` unificando las recetas demo con los controles del simulador**

Implementar en `assets/js/presentacion.js`:
1. Diccionario `RECETAS_DEMO` con datos reales y sincronizados:
   - `pan`:
     - `nombre`: `'Pan de Masa Madre (Hogaza 750 g)'`
     - `tipo`: `'Panadería artesanal · Lote de 10 hogazas'`
     - `costoLote`: `54500`
     - `unidades`: `10`
     - `margen`: `60`
     - `incluirFijos`: `true`
     - `lineas`:
       - `{ desc: 'Harina de fuerza + centeno · 5.0 kg', costo: '$ 28.500' }`
       - `{ desc: 'Mantequilla de vaca + sal marina · 600 g', costo: '$ 17.200' }`
       - `{ desc: 'Empaque papel kraft + etiqueta · 10 ud', costo: '$ 8.800' }`
   - `torta`:
     - `nombre`: `'Torta Húmeda de Cacao 70% (12 porciones)'`
     - `tipo`: `'Repostería de autor · Molde 22 cm'`
     - `costoLote`: `46800`
     - `unidades`: `12`
     - `margen`: `65`
     - `incluirFijos`: `true`
     - `lineas`:
       - `{ desc: 'Cacao 70% origen + cobertura · 450 g', costo: '$ 22.400' }`
       - `{ desc: 'Huevos de campo, harina y azúcar · lote', costo: '$ 15.600' }`
       - `{ desc: 'Caja pastelera + bases doradas · 12 ud', costo: '$ 8.800' }`
   - `cafe`:
     - `nombre`: `'Combo Café Filtrado & Alfajor de Almendra'`
     - `tipo`: `'Cafetería de especialidad · Lote de 20 combos'`
     - `costoLote`: `64000`
     - `unidades`: `20`
     - `margen`: `58`
     - `incluirFijos`: `true`
     - `lineas`:
       - `{ desc: 'Café de especialidad en grano · 400 g', costo: '$ 29.000' }`
       - `{ desc: 'Harina de almendra + arequipe · lote', costo: '$ 23.000' }`
       - `{ desc: 'Vasos doble pared + servilletas · 20 ud', costo: '$ 12.000' }`
2. Función `recalcular()`:
   - Valida de forma segura `costoLote = Math.max(100, parseFloat(inputCosto.value) || 0)` y `unidades = Math.max(1, Math.round(parseFloat(inputUnidades.value) || 1))`.
   - Calcula `costoDirectoUd = costoLote / unidades`, `costoFijoUd = incluirFijos ? Math.round(costoDirectoUd * 0.18) : 0`, `costoTotalUd = costoDirectoUd + costoFijoUd`.
   - Calcula `precioSugerido = costoTotalUd / (1 - (margenPct / 100))`, `gananciaUd = Math.max(0, precioSugerido - costoTotalUd)`, `gananciaLote = gananciaUd * unidades`.
   - Calcula porcentajes exactos que suman 100% para `#barra-seg-costo`, `#barra-seg-fijos`, `#barra-seg-utilidad` y sus etiquetas `#leyenda-pct-costo`, `#leyenda-pct-fijos`, `#leyenda-pct-utilidad`.
   - Actualiza `#sim-estado-badge` y `#sim-res-consejo` con textos claros sin emojis y clases semánticas (`.estado-optimo`, `.estado-ajustado`, `.estado-alto`).
3. Eventos en pestañas `.hero-receta-tab`, inputs `#sim-costo`, `#sim-unidades`, `#sim-margen`, `#sim-fijos` y botones `#btn-unidades-menos` / `#btn-unidades-mas`.
4. Acordeón FAQ accesible y scroll suave.

- [x] **Step 2: Verificar sintaxis de `assets/js/presentacion.js` y ausencia de emojis**

Run:
```powershell
node --check .\assets\js\presentacion.js
Select-String -Path .\assets\js\presentacion.js -Pattern "[🍞🍰🍪📦❌✅⚠️💡🔒⚡✨🟢🟡🌟]"
```
Expected: `node --check` termina con código 0 sin salida; `Select-String` devuelve 0 coincidencias.

---

### Task 4: Verificación con Detector `impeccable` y Sincronización `graphify`

**Files:**
- Verify: `index.html`, `assets/css/presentacion.css`, `assets/js/presentacion.js`
- Update: `graphify-out/`

- [x] **Step 1: Ejecutar el detector mecánico de `impeccable`**

Run:
```powershell
& "C:\Users\abner\.gemini\config\skills\impeccable\scripts\impeccable.cmd" detect --json index.html assets/css/presentacion.css
```
Expected: Salida JSON revisada sin alertas críticas de anti-patrones. Si reporta algún detalle corregible, ajustarlo en `presentacion.css` o `index.html`.

- [x] **Step 2: Actualizar el grafo de conocimiento con `graphify update .`**

Run:
```powershell
graphify update .
```
Expected: Grafo actualizado con código de salida 0.
