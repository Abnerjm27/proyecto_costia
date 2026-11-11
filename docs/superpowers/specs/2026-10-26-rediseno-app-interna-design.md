# Especificación de Rediseño: Ecosistema Interno Costia ("Atelier Gastronómico & Consola de Precisión")

**Fecha:** 2026-10-26
**Alcance:** `assets/css/base.css`, `assets/css/auth.css`, `assets/css/app.css`, `assets/css/productos.css`, `assets/css/insumos.css`, `assets/css/crear-producto.css`, y las 7 vistas en `paginas/` (`login.html`, `registro.html`, `productos.html`, `insumos.html`, `crear-producto.html`, `ficha-tecnica.html`, `ficha-preview.html`).
**Restricción Innegociable:** Preservar el **100% de los IDs, nombres de formularios, `onclick`/`oninput` inline y selectores de enganche JS** (`login.js`, `registro.js`, `productos.js`, `insumos.js`, `crear-producto.js`, `store.js`, `asesor-agente.js`).

---

## 1. Sistema de Tokens Globales (`assets/css/base.css`)

Se unifican las variables de `base.css` con las de la portada (`presentacion.css`), manteniendo compatibilidad hacia atrás con los nombres de variables existentes pero elevando su contraste y tipografía para pasar `impeccable detect` con **0 hallazgos**:

- **Tipografía (Google Fonts en las 7 páginas de `paginas/`):**
  - `--font-titulos: 'Literata', Georgia, serif`
  - `--font-texto: 'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif`
  - `--font-mono: 'Azeret Mono', monospace`
- **Paleta de Alto Contraste WCAG AA (`> 4.5:1` en botones primarios):**
  - `--verde-esmeralda: #0A6847` (reemplaza `#0F9D6C` para garantizar contraste `> 6.5:1` con texto `#FFFFFF`)
  - `--verde-esmeralda-claro: #0D7A54`
  - `--verde-pino: #071F17` (pino abisal editorial)
  - `--verde-pino-profundo: #051610`
  - `--fondo-claro: #F2F7F4` (papel salvia botánico)
  - `--papel-elevado: #E4EFEA`
  - `--ambar: #8C470E` (cobre tostado con contraste AA sobre claro)
  - `--tinta: #10211B`
  - `--texto-secundario: #3D4F47`
  - `--superficie: #FFFFFF`
  - `--linea: rgba(7, 31, 23, 0.12)`
  - `--linea-fuerte: rgba(7, 31, 23, 0.22)`
- **Curva de Movimiento (Emil Kowalski):**
  - `--transicion: 180ms cubic-bezier(0.16, 1, 0.3, 1)`
  - `--transicion-resorte: 220ms cubic-bezier(0.16, 1, 0.3, 1)` (elimina el `bounce-easing` `cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Sombras Neutras de Elevación (Cero `dark-glow`):**
  - Eliminar sombras verdes cromáticas (`rgba(15, 157, 108, 0.42)` / `rgba(16, 185, 129, 0.4)`) y usar sombras neutras de tinta pino (`rgba(7, 31, 23, 0.08)` a `rgba(7, 31, 23, 0.18)`).

---

## 2. Reglas Anti-Slop (`impeccable detect` = 0 alertas)

1. **Cero `overused-font`:** Reemplazar todas las cargas de `Fraunces` e `Inter` en los `<head>` de las 7 páginas de `paginas/` y en cualquier regla CSS por `Literata`, `Source Sans 3` y `Azeret Mono`.
2. **Cero `side-tab` y `border-accent-on-rounded`:**
   - Eliminar todos los `border-left: 4px solid ...` y `border-top: 4px solid ...` en `.auth-card`, `.producto-card`, `.tabla__fila` móvil, `.modal__caja`, `.form-seccion` y `.modal-config-card`.
   - Usar bordes completos de `1px solid var(--linea)` (`rgba(7, 31, 23, 0.12)`) y cabeceras o indicadores internos limpios.
3. **Cero `low-contrast`:**
   - Ningún botón o badge con texto `#ffffff` puede tener fondo `#0F9D6C`, `#10B981`, `#12b87e` o `#14b881`. Todos los fondos con texto blanco deben usar `#0A6847` o `#071F17` (o gradientes entre `#071F17` y `#0A6847`).
   - En elementos con fondo claro (`#F2F7F4`, `#E4EFEA`, `#FFFFFF`), el texto nunca debe ser más claro que `#3D4F47` (para texto normal) o `#4A5D54`.
4. **Cero `tiny-text` y `undersized-ui-text`:**
   - Ningún selector en `base.css`, `auth.css`, `app.css`, `productos.css`, `insumos.css`, `crear-producto.css`, `ficha-tecnica.html` ni `ficha-preview.html` puede tener `font-size` menor a `12px` (`0.75rem`). Cualquier `9px`, `9.5px`, `10px`, `10.5px`, `11px` o `11.5px` se sube a `12px`.
5. **Cero `pulsing-dot` y `bounce-easing`:**
   - Eliminar animaciones infinitas en puntos o bordes pulsantes (`fabRadarPulse`, `fabTooltipBounce`, `typingBounce`, `pulsoVoz` infinitos o `box-shadow` con glow verde en `.asesor-drawer__sub::before` y `.asesor-fab-btn__status`).
   - En `.asesor-fab-btn__pulso`, dejar `display: none`.
6. **Cero `nested-cards` y `cramped-padding`:**
   - En `.asesor-ficha-final__comparacion > div` y sub-bloques dentro de tarjetas, usar divisores `border-top: 1px solid var(--linea)` y fondo transparente en lugar de cajas con borde y sombra dentro de otra tarjeta con borde.
7. **Cero Emojis Decorativos en HTML:**
   - En `login.html` y `registro.html`: reemplazar `🔒` por un icono SVG inline de candado.
   - En `productos.html`, `insumos.html`, `crear-producto.html`: reemplazar `<span>⚙️</span>` en `#btn-header-config-gastos` y `#btn-config-gastos-asesor` por un SVG técnico de ajustes (`sliders`).
   - En `ficha-tecnica.html` y `ficha-preview.html`: reemplazar `🥣`, `📊`, `⚖️` por numeración técnica limpia o iconos SVG sobrios.

---

## 3. Diseño por Bloque

### Bloque 1: Base & Autenticación (`base.css`, `auth.css`, `login.html`, `registro.html`)
- Fondo de página en papel salvia `#F2F7F4` con retícula técnica sutil.
- `.auth-card` con borde `1px solid var(--linea)`, radio `16px`, sombra neutra suave y cabecera editorial en `Literata`.

### Bloque 2: Shell Operativo & Catálogo (`app.css`, `productos.css`, `productos.html`)
- `.app-header`: barra superior en pino abisal `#071F17` con borde inferior `1px solid rgba(255,255,255,0.08)`, sin halos radiales.
- `.bottom-nav`: barra inferior limpia y sobria con altura controlada, botón central `.bottom-nav__fab` en `#0A6847` sin halos neón.
- `.kpi-card` y `.producto-card`: superficies blancas `#FFFFFF` con borde `1px solid var(--linea)`, cifras en `Azeret Mono` (`tabular-nums`), barras de rentabilidad en cobre (`#8C470E`) vs esmeralda (`#0A6847`).

### Bloque 3: Inventario de Insumos (`insumos.css`, `insumos.html`)
- `.tabla-wrap` con cabecera en `#071F17`, celdas numéricas en `Azeret Mono`, badges de unidad en `#E4EFEA` con texto `#071F17` (`> 10:1` de contraste).
- Vista móvil de tarjetas sin `border-left: 4px`, usando divisor superior limpio.

### Bloque 4: Taller de Recetas & Fichas Imprimibles (`crear-producto.css`, `crear-producto.html`, `ficha-tecnica.html`, `ficha-preview.html`)
- Eliminar de `crear-producto.css` las líneas duplicadas del Drawer del Asesor IA (que ya viven en `app.css`).
- `.resumen-card`: recibo financiero sticky en `#071F17` con tipografía monoespaciada `Azeret Mono` para cada línea de costo y el precio final de venta, sin `text-shadow` neón.
- `ficha-tecnica.html` y `ficha-preview.html`: documentos técnicos de obrador con `Literata` + `Source Sans 3` + `Azeret Mono`, piso tipográfico de `12px`, alto contraste y reglas `@media print` intactas.
