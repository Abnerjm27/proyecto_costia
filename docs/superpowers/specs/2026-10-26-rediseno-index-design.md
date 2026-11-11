# Especificación de Diseño: Rediseño de `index.html` ("Atelier Gastronómico & Cuaderno de Costeo")

**Fecha:** 2026-10-26  
**Estado:** Aprobado en Brainstorming (Enfoque 1)  
**Skills Aplicadas:** `superpowers:brainstorming`, `impeccable` (`distill`, `craft-floor`, `animate`)  
**Referencias de Oficio:** Principios de micro-interacción y contención de Emil Kowalski + Editorial High-Craft UI.

---

## 1. Intención y Diagnóstico del Problema Actual

El archivo `index.html` actual sufre de dos problemas centrales:
1. **Sobrecarga cognitiva y redundancia:** Cuenta con 8 bloques apilados que repiten los mismos argumentos cuatro veces y presenta **dos calculadoras distintas compitiendo entre sí** (el *Ticket interactivo* en el Hero y el *Simulador en vivo* en la sección 4).
2. **Estética genérica de plantilla IA:** Uso sistemático de píldoras superiores (`.seccion-pill`) sobre cada título, texto con gradiente tricolor, un divisor de ola SVG (`.hero-ola`), tarjetas anidadas dentro de tarjetas y más de 20 emojis (`🍞`, `🍰`, `❌`, `✅`, `⚠️`, `✨`, `💸`) en lugar de iconografía vectorial y jerarquía tipográfica.

### La Tesis del Nuevo Diseño
Transformar `index.html` en un **"Cuaderno de Obrador & Consola de Precisión Gastronómica"**: una página de 4 actos claros, con aire generoso sobre papel cálido (`#FAF7F2`) en contraste con bloques de verde pino abisal (`#071F17`), donde el visitante interactúa desde el primer segundo con una **única Mesa de Costeo Viva** en el Hero que combina recetas reales, ajuste de lote, prorrateo de servicios y margen comercial en tiempo real.

---

## 2. Reglas de Oficio Estrictas (`impeccable:craft-floor` & `distill`)

### Prohibiciones Absolutas (Anti-Goals)
1. **Cero Emojis en la Interfaz:** Queda prohibido el uso de emojis (`🍞`, `🍰`, `🍪`, `📦`, `❌`, `✅`, `⚠️`, `💡`, `🔒`, `⚡`, `✨`, `🟢`, `🟡`). Todo icono debe ser un SVG inline con trazo consistente (`stroke="currentColor" stroke-width="1.75"`).
2. **Cero Píldoras sobre Títulos (Kicker/Eyebrow Ban):** No colocar etiquetas tipo `.seccion-pill` encima de los `h2`. Si se requiere contexto de sección, usar una numeración índice minimalista (`01 / ARQUITECTURA DE COSTEO`) integrada en la grilla divisoria, nunca una píldora flotante centrada sobre un título centrado.
3. **Cero Texto con Gradiente:** El énfasis en los titulares se logra mediante contraste tipográfico (cursivas en `Instrument Serif` o cambio de peso/color sólido), nunca con `-webkit-background-clip: text`.
4. **Cero Divisores de Ola SVG:** Eliminar `.hero-ola`. Las transiciones entre secciones se logran mediante cortes limpios arquitectónicos y bordes finos de `1px`.
5. **Cero Duplicación de Simuladores:** Unificar el Ticket del Hero y el Simulador en un único componente interactivo completo ubicado en el Hero (`#mesa-costeo`).

---

## 3. Sistema Visual: Paleta, Tipografía y Tokens

### 3.1 Paleta Cromática (CSS Custom Properties en `presentacion.css`)
- `--papel-obrador: #FAF7F2` (Fondo principal cálido, inspirado en papel de panadería/recetario)
- `--papel-elevado: #F2ECE1` (Superficie secundaria cálida para paneles y controles)
- `--superficie-blanca: #FFFFFF` (Ficha técnica activa)
- `--pino-abisal: #071F17` (Fondo oscuro profundo del Hero / Cierre)
- `--pino-medio: #0C3326` (Superficie elevada sobre fondo oscuro)
- `--tinta-principal: #10211B` (Texto principal sobre fondo claro, contraste > 13:1)
- `--tinta-secundaria: #4A5D55` (Texto secundario tintado en verde-piedra, nunca gris puro)
- `--esmeralda-accion: #0D9464` (Acento primario, botones e indicadores saludables)
- `--esmeralda-luz: #34D399` (Acento sobre fondos oscuros)
- `--cobre-costo: #B86B28` (Indicador de materia prima, corteza y alertas de ajuste)
- `--borde-fino: rgba(16, 33, 27, 0.11)` (Líneas de cuadrícula contable sobre claro)
- `--borde-fino-oscuro: rgba(240, 247, 244, 0.12)` (Líneas sobre pino abisal)

### 3.2 Tipografía
Importar desde Google Fonts en `index.html`:
- **Display / Titulares (`--font-editorial`):** `'Instrument Serif', Georgia, serif` — aporta carácter editorial gastronómico y distinción inmediata frente a plantillas genéricas.
- **UI y Lectura (`--font-ui`):** `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif` — legibilidad nítida en controles y párrafos.
- **Datos Contables y Precios (`--font-mono`):** `'JetBrains Mono', monospace` con `font-variant-numeric: tabular-nums` obligatorio en cada precio, peso, porcentaje y fórmula.

---

## 4. Arquitectura de Contenido en 4 Actos (`index.html`)

### Navegación Superior (`.navbar`)
- Barra fija (`sticky top: 0`) con fondo translúcido (`rgba(7, 31, 23, 0.88)` + `backdrop-filter: blur(12px)`), borde inferior de `1px solid var(--borde-fino-oscuro)`.
- Izquierda: Logo `assets/img/costia-icon-green.png` + marca `Costia`.
- Centro: 3 enlaces de navegación interna (`#mesa-costeo` "Simulador", `#arquitectura` "Mecanismo", `#preguntas` "Preguntas").
- Derecha: Enlace limpio `Iniciar sesión` (`paginas/login.html`) + Botón primario `Comenzar gratis` (`paginas/registro.html`).

### Acto 1: Hero + Mesa de Costeo Interactiva Unificada (`#mesa-costeo`)
- **Fondo:** `--pino-abisal` (`#071F17`) con una cuadrícula arquitectónica sutil y limpia.
- **Columna Izquierda (Propuesta de Valor Editorial):**
  - `h1` en `Instrument Serif` (`clamp(2.6rem, 4.6vw, 4.2rem)`, `line-height: 1.06`, `letter-spacing: -0.02em`):
    `El arte de producir merece ` *`cuentas claras.`*
  - Párrafo conciso (`max-width: 46ch`): Costia convierte bultos y litros al gramo, distribuye tu arriendo y servicios en cada unidad producida y calcula el precio de venta exacto con su Asesor IA.
  - Par de botones:
    - Primario: `Empezar a costear gratis` $\rightarrow$ `paginas/registro.html`
    - Secundario: `Explorar catálogo demo` $\rightarrow$ `paginas/productos.html`
  - Fila inferior de 3 pilares técnicos separados por líneas verticales de `1px`:
    - `Conversión al gramo y merma`
    - `Prorrateo de arriendo y luz`
    - `Alertas de inflación con IA`
- **Columna Derecha (La Mesa de Costeo Viva — Componente Interactivo Único):**
  - Una tarjeta de oficio contable sobre `--papel-obrador` y `--superficie-blanca` que une el antiguo ticket y el simulador en un solo flujo táctil:
  - **Cabecera con Selector de Recetas (Tabs con indicador deslizante):**
    - 3 botones de receta: `Pan Masa Madre`, `Torta Cacao 70%`, `Café & Alfajor`.
    - Al alternar, actualiza ingredientes, costo base del lote, unidades por lote y margen recomendado.
  - **Cuerpo de la Ficha Técnica:**
    - Lista de 3 insumos de la receta activa con su gramaje y costo en `--font-mono`.
    - Control interactivo de **Costo del lote (`#sim-costo`)** y **Rendimiento del lote en unidades (`#sim-unidades`)** con botones `-` / `+` e input directo para que el usuario pueda tanto usar los presets de receta como alterar las cifras libremente.
    - Control deslizante (**Slider `#sim-margen`**) de **Margen Comercial Deseado (`20%` a `80%`)** con lectura porcentual en vivo.
    - Switch interactivo (`#sim-fijos`) para **Incluir cuota de arriendo y servicios (+18%)**.
  - **Barra de Composición de Precio (Visualización Proporcional en Vivo):**
    - Una barra horizontal segmentada en 3 tramos dinámicos (ancho calculado en % vía JS con transición suave):
      1. Tramo Materia Prima (`--cobre-costo`)
      2. Tramo Gastos Fijos (`#64748B`)
      3. Tramo Utilidad Neta (`--esmeralda-accion`)
  - **Pie de Resultado Financiero:**
    - Desglose en 3 columnas monoespaciadas: `Costo Unitario Real`, `Precio Sugerido`, `Ganancia por Lote`.
    - Diagnóstico en vivo del Asesor IA (`#sim-res-consejo`) con indicador de estado (punto vectorial verde/ámbar) y enlace directo `Guardar esta receta en mi cuenta →` (`paginas/registro.html`).

### Acto 2: Los 3 Mecanismos de Precisión (`#arquitectura`)
- **Fondo:** `--papel-obrador` (`#FAF7F2`).
- **Encabezado:** Alineado a la izquierda en estructura editorial de 2 columnas (título grande en `Instrument Serif` a la izquierda: *"Por qué las cuentas de servilleta se comen tu ganancia"*; subtítulo explicativo a la derecha).
- **Cuadrícula Técnica de 3 Módulos (Bordes compartidos de `1px solid var(--borde-fino)`, sin sombras flotantes genéricas):**
  1. **Módulo 01 — Conversión Universal y Merma:**
     - Explica cómo compras por bulto/arroba/litro y recetarios en gramos/mililitros/pizcas se concilian automáticamente, incluyendo el factor de merma por horneado o cocción.
     - Incluye una demostración visual tipo fórmula contable (`Bulto 50 kg ($95.000) → 350 g en receta + 8% merma = $718 exactos`).
  2. **Módulo 02 — Arriendo y Servicios Integrados:**
     - Explica cómo los recibos de luz, gas, agua y arriendo dejan de ser un gasto invisible a fin de mes y se asignan por unidad.
     - Incluye comparativa visual clara: *Costo aparente (solo harina y huevos: $2.900)* vs *Costo real con local y servicios ($3.425)*.
  3. **Módulo 03 — Asesor Financiero IA en Cascada:**
     - Muestra el flujo real del Asesor Costia: envías un mensaje natural (*"El azúcar subió a $18.000 y la mantequilla a $24.000"*) y el motor identifica al instante qué productos del catálogo perdieron margen y sugiere el nuevo precio.

### Acto 3: Flujo en 3 Pasos + Preguntas Frecuentes (`#como-funciona` y `#faq`)
- **Fondo:** `--papel-obrador` con separación superior de `1px solid var(--borde-fino)`.
- **Disposición en 2 columnas asimétricas (`1fr 1.15fr`):**
  - **Columna Izquierda (`#como-funciona`):**
    - Título: *"De la factura de compra al precio en vitrina."*
    - Lista vertical numerada en `--font-mono` (`01`, `02`, `03`) conectada por una línea guía de `1px`:
      - `01. Registra tus materias primas`
      - `02. Arma la receta y define el lote`
      - `03. Protege tu margen con alertas en vivo`
    - Enlace de acción hacia `paginas/productos.html` ("Explorar el entorno de demostración →").
  - **Columna Derecha (`#faq`):**
    - Título: *"Preguntas frecuentes"*
    - 5 ítems de acordeón separados únicamente por líneas horizontales de `1px solid var(--borde-fino)`.
    - Animación de apertura mediante CSS Grid (`grid-template-rows: 0fr` $\rightarrow$ `1fr`) + rotación de `45deg` del icono SVG `+`.

### Acto 4: Cierre Editorial y Footer
- **Bloque CTA Final + Footer Integrado en `--pino-abisal` (`#071F17`):**
  - Encabezado en `Instrument Serif`: *"Conoce el valor exacto de tu trabajo hoy mismo."*
  - Botones hacia `paginas/registro.html` (`Crear cuenta gratuita`) y `paginas/productos.html` (`Abrir Demo sin registro`).
  - Notas de confianza sobrias en texto limpio (sin emojis de candados ni rayos).
  - Pie de página con enlaces de navegación y créditos de Costia.

---

## 5. Gramática de Movimiento e Interacción (Emil Kowalski Style)

1. **Curvas de Física Natural:**
   - `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` para entradas, cambios de pestaña, barras proporcionales y acordeones.
   - `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)` para transiciones de color/borde.
2. **Duraciones Cortas y Responsivas:**
   - Controles y botones: `150ms`.
   - Cambio de receta en la Mesa de Costeo: transición de opacidad y desplazamiento vertical sutil de `4px` en `180ms`.
   - Barra proporcional de composición de precio (`Costo` / `Fijos` / `Utilidad`): transición de `width` en `260ms var(--ease-out)`.
   - Acordeón FAQ: transición de `grid-template-rows` en `240ms var(--ease-out)`.
3. **Accesibilidad (`prefers-reduced-motion: reduce`):**
   - Mantiene cambios de estado y color instantáneos eliminando desplazamientos espaciales.
