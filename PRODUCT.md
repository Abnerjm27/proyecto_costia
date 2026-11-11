# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML5, CSS3 (modular stylesheets in `assets/css/`), and Vanilla JavaScript (`assets/js/`) backed by a PHP 8 + MySQL REST API (`backend/`).

## Users

Emprendedores gastronómicos, panaderos artesanales, reposteros, cafeterías de especialidad y pequeños talleres de manufactura en Latinoamérica (principalmente Colombia, moneda COP) que elaboran sus propios productos a partir de materias primas y necesitan saber cuánto les cuesta realmente producir cada unidad y a qué precio venderla sin perder dinero.

## Product Purpose

Costia elimina el cálculo a ojo y las hojas de cálculo frágiles. Permite registrar insumos por unidad de compra (bulto, kilo, litro), armar recetas al gramo o mililitro, contemplar merma de cocción y empaque, repartir gastos fijos mensuales (arriendo, luz, gas, mano de obra) en cada unidad producida y fijar precios de venta rentables mediante porcentaje de margen bruto o multiplicador (mark-up), asistido por un Asesor Financiero con IA.

## Positioning

A diferencia de un ERP contable complejo o un Excel manual, Costia une conversión gastronómica universal de unidades (de bultos/arrobas a gramos/pizcas), reparto automático de arriendo y servicios por lote y un Asesor IA conversacional que actualiza precios de insumos en lenguaje natural y recalcula en cascada todas las recetas afectadas con alertas visuales de rentabilidad.

## Operating Context

- Se utiliza tanto en computador de escritorio como en móvil desde el obrador, cocina o mostrador.
- Funciona con persistencia híbrida: sincroniza con MySQL cuando hay sesión activa en servidor Apache/XAMPP y opera con `localStorage` en modo demostración sin fricción.
- Rutas principales conectadas desde `index.html`:
  - `paginas/registro.html` (creación de cuenta gratuita)
  - `paginas/login.html` (inicio de sesión)
  - `paginas/productos.html` (exploración del catálogo / demo en vivo)
  - `paginas/insumos.html` (inventario de materias primas)
  - `paginas/crear-producto.html` (constructor de recetas y costeo)

## Capabilities and Constraints

- Sin frameworks pesados de frontend ni pasos de compilación (debe correr directamente en Apache/XAMPP o navegador).
- Moneda principal: Pesos Colombianos (`$ XX.XXX` COP) con formato numérico tabular (`tabular-nums`).
- Las rutas hacia `paginas/login.html`, `paginas/registro.html` y `paginas/productos.html`, así como el logo `assets/img/costia-icon-green.png`, deben preservarse intactas.

## Brand Commitments

- Nombre: **Costia**
- Activo gráfico: `assets/img/costia-icon-green.png`
- Voz de marca: Clara, rigurosa pero cercana al artesano gastronómico; sin jerga contable intimidante ni promesas comerciales infladas.
- Identidad cromática anclada en verde pino profundo (`#082219` / `#0B3D2E`), verde esmeralda de precisión (`#0F9D6C`) y superficies cálidas de papel de obrador (`#FAF7F2`).

## Evidence on Hand

- Recetas reales de demostración con desglose de insumos, merma, costos fijos y precio sugerido (Pan artesanal de masa madre, Torta de cacao 70%, Galletas de avena y miel, Café / Repostería).
- Motor de cálculo real de margen bruto comercial: $\text{Precio} = \frac{\text{Costo Total Unitario}}{1 - \text{Margen\%}}$.
- Asesor IA conversacional funcional en el aplicativo.
- No fabricar testimonios falsos de clientes ni logotipos de empresas inexistentes.

## Product Principles

1. **Claridad contable al instante:** Cada cifra debe mostrar de dónde sale (materia prima + cuota de gastos fijos = costo real $\rightarrow$ precio sugerido y utilidad neta).
2. **Tactilidad sin fricción:** El visitante comprende el valor de Costia manipulando una receta viva en los primeros 5 segundos, no leyendo párrafos largos.
3. **Oficio artesanal, precisión financiera:** El diseño combina la calidez editorial de un cuaderno de obrador gastronómico con la exactitud tabular de un instrumento financiero.
4. **Destilación radical:** Cada sección, borde y animación debe ganarse su lugar; cero ruido decorativo.

## Accessibility & Inclusion

- Contraste mínimo WCAG AA (4.5:1 en texto de cuerpo, 3:1 en titulares grandes).
- Controles interactivos accesibles por teclado (`:focus-visible` nítido) y etiquetas ARIA apropiadas (`aria-live="polite"` en resultados dinámicos, `aria-expanded` en acordeón).
- Soporte completo para `prefers-reduced-motion: reduce`.
