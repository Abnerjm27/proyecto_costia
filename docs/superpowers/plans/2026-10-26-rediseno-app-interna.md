# Plan de Implementación: Rediseño del Ecosistema Interno Costia

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar las 7 páginas internas (`paginas/*.html`) y las 6 hojas de estilo (`assets/css/base.css`, `auth.css`, `app.css`, `productos.css`, `insumos.css`, `crear-producto.css`) bajo el lenguaje visual *"Atelier Gastronómico & Consola de Precisión"*, eliminando las 118 alertas de `impeccable detect` (`overused-font`, `low-contrast`, `dark-glow`, `side-tab`, `border-accent-on-rounded`, `tiny-text`, `undersized-ui-text`, `pulsing-dot`, `bounce-easing`, `nested-cards`, `cramped-padding`) sin alterar ningún ID ni lógica JS/PHP.

**Architecture:** Actualización progresiva en 4 tareas modulares:
1. Tokens Base y Autenticación (`base.css`, `auth.css`, `login.html`, `registro.html`)
2. Shell Operativo y Catálogo de Productos (`app.css`, `productos.css`, `productos.html`)
3. Inventario de Insumos (`insumos.css`, `insumos.html`)
4. Taller de Recetas y Fichas Técnicas (`crear-producto.css`, `crear-producto.html`, `ficha-tecnica.html`, `ficha-preview.html`)

**Tech Stack:** HTML5 semántico, CSS3 nativo con Custom Properties, Google Fonts (`Literata`, `Source Sans 3`, `Azeret Mono`).

---

## Reglas Globales Estrictas para el Subagente Flash (`impeccable detect` = 0 alertas)

1. **Tipografía obligatoria en todos los HTML y CSS:**
   - En el `<head>` de los 7 archivos HTML de `paginas/`, reemplazar el `<link>` de Google Fonts de `Fraunces` + `Inter` por:
     ```html
     <link href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,500;0,7..72,600;0,7..72,700;1,7..72,400&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
     ```
   - Jamás escribir `'Fraunces'` ni `'Inter'` en ningún archivo CSS o `<style>` inline.
2. **Piso de tamaño de fuente (`>= 12px`):**
   - Ningún `font-size` en ningún archivo CSS o `<style>` puede ser menor a `12px` (`0.75rem`). Reemplazar todo `9px`, `9.5px`, `10px`, `10.5px`, `11px`, `11.5px` por `12px`.
3. **Contraste WCAG AA estricto (`>= 4.5:1`):**
   - Nunca usar texto `#ffffff` sobre `#0F9D6C`, `#10B981`, `#12b87e`, `#14b881` ni `#34D399`.
   - Todo botón o badge con texto blanco (`#ffffff` o `#F2F7F4`) debe usar fondo sólido o gradiente oscuro: `#0A6847` o `#071F17` (ej. `background: #0A6847;` o `background: linear-gradient(135deg, #071F17 0%, #0A6847 100%);`).
   - En superficies claras (`#FFFFFF`, `#F2F7F4`, `#E4EFEA`, `#FAFCFA`), el texto secundario nunca debe ser más claro que `#3D4F47` (reemplazar `#6C757D`, `#7d9189`, `#8c9e97`, `#94a8a0`, `#6b7f77`, `#5a6e66` por `#3D4F47`).
   - En superficies oscuras (`#071F17`, `#093526`, `#0B3D2E`), el texto claro debe ser `#F2F7F4`, `#E4EFEA` o `#A7F3D0` (nunca `rgba(..., 0.5)` de bajo contraste).
4. **Cero `side-tab` y `border-accent-on-rounded`:**
   - Eliminar todas las propiedades `border-left: 4px solid ...`, `border-left: 3px solid ...` y `border-top: 4px solid ...` en elementos con `border-radius`. Usar únicamente `border: 1px solid var(--linea)` (`rgba(7, 31, 23, 0.12)`).
5. **Cero `dark-glow`, `pulsing-dot` y `bounce-easing`:**
   - Ningún `box-shadow` ni `text-shadow` puede tener color verde/esmeralda/rojo brillante (`rgba(15, 157, 108, ...)`, `rgba(16, 185, 129, ...)`, `rgba(77, 255, 168, ...)`). Todas las sombras deben usar tinta neutra oscura `rgba(7, 31, 23, 0.08)` a `rgba(7, 31, 23, 0.22)`.
   - Eliminar `cubic-bezier(0.34, 1.56, 0.64, 1)` y reemplazar por `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Eliminar animaciones infinitas (`infinite`) en puntos, ondas o tooltips (`fabRadarPulse`, `fabTooltipBounce`, `typingBounce`, `pulsoVoz`). Para `.asesor-fab-btn__pulso` usar `display: none;`.
6. **Cero `nested-cards` y `cramped-padding`:**
   - Evitar tarjetas con borde y fondo blanco dentro de otra tarjeta con borde. En `.producto-card__datos`, `.producto-receta`, `.producto-card__break-even` y `.asesor-ficha-final__comparacion > div`, usar `border: none; border-top: 1px solid var(--linea); border-radius: 0; background: transparent; padding: 12px 0 0;`.

---

### Task 1: Tokens Base y Vistas de Autenticación (`base.css`, `auth.css`, `login.html`, `registro.html`)

**Files:**
- Modify: `assets/css/base.css`
- Modify: `assets/css/auth.css`
- Modify: `paginas/login.html`
- Modify: `paginas/registro.html`

- [x] **Step 1: Actualizar `assets/css/base.css`**
  - Actualizar `:root` con:
    - `--verde-esmeralda: #0A6847;`
    - `--verde-esmeralda-claro: #0D7A54;`
    - `--verde-pino: #071F17;`
    - `--verde-pino-profundo: #051610;`
    - `--fondo-claro: #F2F7F4;`
    - `--papel-elevado: #E4EFEA;`
    - `--ambar: #8C470E;`
    - `--tinta: #10211B;`
    - `--texto-secundario: #3D4F47;`
    - `--superficie: #FFFFFF;`
    - `--linea: rgba(7, 31, 23, 0.12);`
    - `--linea-fuerte: rgba(7, 31, 23, 0.22);`
    - `--font-titulos: 'Literata', Georgia, serif;`
    - `--font-texto: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif;`
    - `--font-mono: 'Azeret Mono', monospace;`
    - `--transicion: 180ms cubic-bezier(0.16, 1, 0.3, 1);`
    - `--transicion-resorte: 220ms cubic-bezier(0.16, 1, 0.3, 1);`
  - En `.btn-primario, .boton_registro`, usar `background: #0A6847; color: #FFFFFF; border: 1px solid #071F17; box-shadow: 0 2px 6px rgba(7, 31, 23, 0.12);` y en `:hover` `background: #071F17;`.
  - En `.toast`, usar fondo `#071F17`, texto `#F2F7F4`, borde `1px solid rgba(255, 255, 255, 0.14)` y sombra neutra.

- [x] **Step 2: Actualizar `assets/css/auth.css`**
  - En `body`, usar `background-color: var(--fondo-claro);` con retícula sutil neutra.
  - En `.auth-card`, eliminar `border-top: 4px solid var(--verde-esmeralda);`, usar `background: #FFFFFF; border: 1px solid var(--linea); border-radius: 16px; padding: 36px; box-shadow: 0 12px 32px -8px rgba(7, 31, 23, 0.08);`.
  - En `.auth-btn`, usar `background: #0A6847; color: #FFFFFF;` y en `:hover` `background: #071F17;` con sombra `0 4px 12px rgba(7, 31, 23, 0.16)` (sin glow verde).
  - Asegurar que ningún `font-size` sea menor a `12px` (`.auth-seguridad` a `12px`).

- [x] **Step 3: Actualizar `paginas/login.html` y `paginas/registro.html`**
  - Cambiar el `<link>` de Google Fonts a `Azeret Mono`, `Literata` y `Source Sans 3`.
  - Reemplazar los emojis `🔒` en `.auth-seguridad` por un icono SVG inline de candado (`width="14" height="14"`).
  - Conservar intactos `#form-login`, `#form-registro`, `#negocio`, `#email`, `#password`, `#btn-toggle-pwd` y los scripts al final del `body`.

---

### Task 2: Shell Operativo y Catálogo de Productos (`app.css`, `productos.css`, `productos.html`)

**Files:**
- Modify: `assets/css/app.css`
- Modify: `assets/css/productos.css`
- Modify: `paginas/productos.html`

- [x] **Step 1: Refinar `assets/css/app.css`**
  - Eliminar todos los `font-size` menores a `12px` (subir `9px`, `9.5px`, `10px`, `10.5px`, `11px`, `11.5px` a `12px`).
  - Eliminar todos los glows cromáticos (`rgba(15, 157, 108, ...)`, `rgba(16, 185, 129, ...)`, `rgba(77, 255, 168, ...)`, `#34d399`, `#10b981`) en `box-shadow` y `text-shadow`.
  - En `.app-header`, usar `background: #071F17; border-bottom: 1px solid rgba(255, 255, 255, 0.1);` y eliminar `.app-header::before`.
  - En `.kpi-card`, usar `background: #FFFFFF; border: 1px solid var(--linea); border-radius: 14px; padding: 20px;`, eliminar `.kpi-card::after`, y estilizar `.kpi-card__valor` con `font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--verde-pino);`.
  - En `.bottom-nav__fab`, usar `background: #0A6847; color: #FFFFFF; box-shadow: 0 4px 12px rgba(7, 31, 23, 0.22);` (sin sombra verde ni resorte `cubic-bezier(0.34, 1.56, 0.64, 1)`).
  - En `.asesor-fab-btn`, usar `background: #071F17; color: #F2F7F4; border: 1px solid rgba(255, 255, 255, 0.18); box-shadow: 0 8px 24px rgba(7, 31, 23, 0.24);`, ocultar `.asesor-fab-btn__pulso { display: none; }`, quitar la animación infinita de `.asesor-fab-tooltip`, y quitar el `box-shadow` de `.asesor-fab-btn__status` y `.asesor-drawer__sub::before`.
  - En `.asesor-typing-dots span` y `.asesor-voz-onda`, quitar la animación `infinite` para evitar `pulsing-dot` / `bounce-easing`.
  - En `.asesor-ficha-final__comparacion > div`, usar `background: transparent; border: none; border-top: 1px solid var(--linea); border-radius: 0; padding: 12px 4px 0;` para evitar `nested-cards`.
  - Asegurar que todos los botones primarios dentro de modales y del asesor (`.btn-cfg-guardar`, `.asesor-btn-confirmar`, `.asesor-chat-enviar`, `.asesor-confirmar-insumo__btn-ok`) usen `background: #0A6847; color: #FFFFFF;`.

- [x] **Step 2: Refinar `assets/css/productos.css`**
  - En `.producto-card`, eliminar `border-left: 4px solid var(--verde-esmeralda)` (y los `:has()` con `border-left-color`). Usar `background: #FFFFFF; border: 1px solid var(--linea); border-radius: 16px; padding: 24px;`.
  - Evitar `nested-cards`: en `.producto-card__datos`, `.producto-receta` y `.producto-card__break-even`, usar `background: transparent; border: none; border-top: 1px solid var(--linea); border-radius: 0; padding: 14px 0 0;`.
  - Aplicar `font-family: var(--font-mono); font-variant-numeric: tabular-nums;` en `.producto-card__costo`, `.producto-card__ganancia`, `.producto-card__precio`, `.producto-card__modo`, `.rentabilidad__leyenda` y `.break-even__valor`.
  - Subir todos los `font-size: 11px` a `12px`.

- [x] **Step 3: Actualizar `paginas/productos.html`**
  - Cambiar el `<link>` de Google Fonts a `Azeret Mono`, `Literata` y `Source Sans 3`.
  - Reemplazar `<span>⚙️</span>` en `#btn-header-config-gastos` y `#btn-config-gastos-asesor` por un SVG inline limpio (`width="14" height="14"`).
  - Conservar todos los IDs (`#kpi-productos`, `#kpi-margen-promedio`, `#kpi-insumos`, `#buscador-productos`, `#ordenar-productos`, `#grid-productos`, `#modal-asesor-costia`, etc.).

---

### Task 3: Inventario de Insumos (`insumos.css`, `insumos.html`)

**Files:**
- Modify: `assets/css/insumos.css`
- Modify: `paginas/insumos.html`

- [x] **Step 1: Refinar `assets/css/insumos.css`**
  - En `.tabla thead`, usar `background: #071F17;` con `th` en `font-size: 12px; color: #E4EFEA;`.
  - En `.tabla__precio`, `.tabla__unidad` y `.modal__calculo-valor`, aplicar `font-family: var(--font-mono); font-variant-numeric: tabular-nums;`.
  - En vista móvil (`.tabla tbody tr.tabla__fila`), eliminar `border-left: 4px solid var(--verde-esmeralda);` y usar `border: 1px solid var(--linea); border-radius: 14px;`.
  - En `.modal__caja`, eliminar `border-top: 4px solid var(--verde-esmeralda);` y usar `border: 1px solid var(--linea); border-radius: 16px;`.
  - En `.modal__btn-guardar`, usar `background: #0A6847; color: #FFFFFF; box-shadow: 0 2px 6px rgba(7, 31, 23, 0.14);` y en `:hover` `background: #071F17;`.
  - Subir cualquier `font-size` de `10px` o `11px` a `12px`.

- [x] **Step 2: Actualizar `paginas/insumos.html`**
  - Cambiar el `<link>` de Google Fonts a `Azeret Mono`, `Literata` y `Source Sans 3`.
  - Reemplazar `<span>⚙️</span>` en `#btn-header-config-gastos` y `#btn-config-gastos-asesor` por el mismo icono SVG inline de ajustes.
  - Conservar todos los IDs (`#kpi-total-insumos`, `#kpi-insumo-mayor`, `#kpi-unidades-activas`, `#buscador-insumos`, `#filtros-unidad-insumos`, `#tbody-insumos`, `#modal-insumo`, `#form-insumo`, etc.).

---

### Task 4: Taller de Recetas y Fichas Técnicas (`crear-producto.css`, `crear-producto.html`, `ficha-tecnica.html`, `ficha-preview.html`)

**Files:**
- Modify: `assets/css/crear-producto.css`
- Modify: `paginas/crear-producto.html`
- Modify: `paginas/ficha-tecnica.html`
- Modify: `paginas/ficha-preview.html`

- [x] **Step 1: Refinar y desduplicar `assets/css/crear-producto.css`**
  - Eliminar las líneas duplicadas del Drawer del Asesor IA al final de `crear-producto.css` (desde `.asesor-modal-backdrop` hasta `.asesor-confirmar-insumo__btn-cancel`), ya que `crear-producto.html` carga `app.css` donde ya están definidas.
  - En `.form-seccion`, eliminar `border-left: 4px solid var(--verde-esmeralda);` y usar `background: #FFFFFF; border: 1px solid var(--linea); border-radius: 16px; padding: 28px;`.
  - Evitar `nested-cards`: en `.asesor-card-trigger`, `.receta-footer`, `.slider-grupo`, `.preguntas-ajuste` y `.multiplicador-resultado`, usar `border: none; border-top: 1px solid var(--linea); border-radius: 0; background: transparent; padding: 16px 0;`.
  - En `.resumen-card`, estilizar como recibo financiero en pino abisal (`background: #071F17; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 16px;`), eliminar `.resumen-card::before`, usar `font-family: var(--font-mono); font-variant-numeric: tabular-nums;` en `.resumen-item__valor` y `.resumen-precio__valor`, eliminar `text-shadow` en `.resumen-precio__valor` (usar color `#6EE7B7`), y en `.resumen-card .btn-guardar` usar `background: #0A6847; color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: none;` (en `:hover` `background: #0D7A54;`).
  - Subir todos los `font-size` menores a `12px` (`9.5px`, `10.5px`, `11px`, `11.5px`) a `12px`.

- [x] **Step 2: Actualizar `paginas/crear-producto.html`**
  - Cambiar el `<link>` de Google Fonts a `Azeret Mono`, `Literata` y `Source Sans 3`.
  - Reemplazar `<span>⚙️</span>` en `#btn-header-config-gastos` y `#btn-config-gastos-asesor` por SVG inline.
  - En los estilos inline de `crear-producto.html`, cambiar `color:#6C757D` y `color:#5a6e66` y `color:#4E5D56` por `color:#3D4F47`, y en `#res-ganancia-unidad` usar `color:#6EE7B7; font-weight:600;` (ya que está sobre el fondo oscuro `#071F17` de `.resumen-card`).

- [x] **Step 3: Actualizar `paginas/ficha-tecnica.html` y `paginas/ficha-preview.html`**
  - Cambiar el `<link>` de Google Fonts a `Azeret Mono`, `Literata` y `Source Sans 3`.
  - En el `<style>` interno de ambos archivos:
    - Reemplazar `'Inter'` por `'Source Sans 3'` y `'Fraunces'` por `'Literata'`.
    - Aplicar `font-family: 'Azeret Mono', monospace; font-variant-numeric: tabular-nums;` en `.col-num`, `.ficha-kpi-precio-caja strong`, `.fila-desglose strong` y `.ficha-badge-codigo`.
    - Cambiar `--pino: #071F17;` y `--esmeralda: #0A6847;`.
    - En `.btn-preview--imprimir`, cambiar `background: #10B981; color: #ffffff; box-shadow: ...` por `background: #0A6847; color: #ffffff; box-shadow: none;` (para eliminar `low-contrast` y `dark-glow`).
    - En `.ficha-notas`, cambiar `border-left: 3px solid var(--esmeralda); border-radius: 0 6px 6px 0;` por `border: 1px solid var(--gris-borde); border-radius: 6px;` (evitando `side-tab`).
    - Evitar `nested-cards`: en `.ficha-hoja`, usar contenedor de documento sin anidar tarjetas con sombra; en `.ficha-specs`, `.card-financiera` y `.caja-break-even`, usar `border-radius: 0; border: none; border-top: 1px solid var(--gris-borde); background: transparent; padding: 14px 0;`.
    - Subir todos los `font-size` de `10.5px`, `11px` y `11.5px` a `12px`.
    - Reemplazar los emojis `🥣`, `📊` y `⚖️` por numeración técnica limpia (`01.`, `02.`) o icono SVG.
    - Conservar intacto el script de `ficha-tecnica.html` y todos sus IDs (`#ficha-imprimible`, `#ficha-negocio-nombre`, `#ficha-codigo`, `#ficha-fecha`, `#ficha-prod-nombre`, `#ficha-precio-venta`, `#ficha-tbody-ingredientes`, etc.).

---

### Task 5: Verificación Senior (`impeccable detect` + `graphify`)

- [x] **Step 1: Ejecutar `impeccable detect` en todas las vistas y hojas de estilo**
  - Run: `& "C:\Users\abner\.gemini\config\skills\impeccable\scripts\impeccable.cmd" detect --json paginas assets/css/base.css assets/css/auth.css assets/css/app.css assets/css/productos.css assets/css/insumos.css assets/css/crear-producto.css`
  - Expected: `[]` (0 hallazgos, exit code 0).
- [x] **Step 2: Actualizar grafo del proyecto**
  - Run: `graphify update .`
