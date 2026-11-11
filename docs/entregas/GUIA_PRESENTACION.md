# 🎓 COSTIA — Guía de Estudio y Defensa de Proyecto
> **Materia:** Desarrollo de Software (3° Semestre)  
> **Proyecto:** Sistema Web de Costeo Gastronómico y Gestión de Insumos (**Costia**)  
> **Autores:** Equipo de Desarrollo Costia  
> **Stack:** PHP 8.2 (POO / PDO) + MySQL (InnoDB) + JavaScript (ES6 Vanilla) + HTML5/CSS3  

---

## 📑 Tabla de Contenidos
1. [Ficha Técnica del Proyecto](#1-ficha-técnica-del-proyecto)
2. [El Problema que Resuelve (Justificación de Negocio)](#2-el-problema-que-resuelve-justificación-de-negocio)
3. [Repartición de Roles para la Exposición (2 Integrantes)](#3-repartición-de-roles-para-la-exposición)
4. [Guion de Exposición Minuto a Minuto (8 a 10 min)](#4-guion-de-exposición-minuto-a-minuto)
5. [Arquitectura Técnica y Patrones de Diseño](#5-arquitectura-técnica-y-patrones-de-diseño)
6. [Base de Datos Relacional y Modelo 3FN](#6-base-de-datos-relacional-y-modelo-3fn)
7. [Lógica Matemática y Gastronómica de Costeo](#7-lógica-matemática-y-gastronómica-de-costeo)
8. [Seguridad Implementada](#8-seguridad-implementada)
9. [Paso a Paso de la Demostración en Vivo (Live Demo)](#9-paso-a-paso-de-la-demostración-en-vivo)
10. [Banco de Preguntas Trampa del Docente y Respuestas Modelo](#10-banco-de-preguntas-trampa-del-docente-y-respuestas-modelo)
11. [Plan de Contingencia (¿Qué pasa si XAMPP falla?)](#11-plan-de-contingencia)

---

## 1. Ficha Técnica del Proyecto

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre del Sistema** | **Costia** |
| **Tipo de Aplicación** | Aplicación Web SPA-híbrida con Backend RESTful y Base de Datos Relacional |
| **Lenguaje Backend** | **PHP 8.2** orientado a objetos (clases, encapsulamiento, PDO) |
| **Base de Datos** | **MySQL 8.0 / MariaDB** con motor **InnoDB** (soporta claves foráneas y transacciones) |
| **Lenguaje Frontend** | **JavaScript ES6+ Vanilla** (sin frameworks pesados, usando Fetch API, POO y Web Storage) |
| **Estilos y Maquetación** | **CSS3 Moderno** (Variables CSS, Flexbox, CSS Grid, diseño responsivo móvil/escritorio) |
| **Seguridad** | Hashing de contraseñas con **BCRYPT** (`password_hash`), sentencias preparadas contra **Inyección SQL**, control de sesiones en servidor |
| **Arquitectura** | **MVC (Modelo - Vista - Controlador)** desacoplado con endpoints JSON REST |

---

## 2. El Problema que Resuelve (Justificación de Negocio)

En gastronomía (pastelerías, cafeterías, restaurantes, emprendimientos de comida):
1. **El 80% de los emprendimientos costea "al ojo" o con tablas de Excel desordenadas.**  
   Compran harina en sacos de 25 kg o 50 kg, pero en las recetas usan 250 gramos. El cálculo manual del costo exacto de cada gramo suele tener errores.
2. **Ignoran la MERMA:**  
   Al hornear una torta, la masa pierde agua por evaporación (merma). Al limpiar una fruta, se pierde la cáscara. Si el negocio no calcula el porcentaje de merma, está regalando producto y perdiendo dinero sin saberlo.
3. **No contemplan el EMPAQUE ni la MANO DE OBRA:**  
   Una torta no se entrega en la mano: lleva caja de cartón, base rígida, papel encerado y cinta. Ese costo debe sumarse automáticamente al costo de producción.
4. **Confunden "Markup" con "Margen Comercial":**  
   Creer que sumarle el 30% al costo es tener un margen de ganancia del 30% es el error contable más común en gastronomía. Costia permite elegir la fórmula exacta para evitar pérdidas.

---

## 3. Repartición de Roles para la Exposición

Para que la presentación fluya de manera profesional y equitativa:

### 👤 Integrante A: "Enfoque de Negocio, Frontend y Demostración en Vivo"
* **Se encarga de:**
  - Introducir el problema gastronómico real y el objetivo de Costia.
  - Mostrar la interfaz gráfica, experiencia de usuario (UX) y usabilidad.
  - Operar la demostración en vivo (crear insumos, simular receta en vivo, mostrar tarjeta sticky interactiva).
  - Explicar la matemática gastronómica (conversión de unidades, merma, empaque y margen).

### 👤 Integrante B: "Enfoque de Arquitectura Técnica, Backend, Base de Datos y Seguridad"
* **Se encarga de:**
  - Explicar la arquitectura de software: **MVC**, patrón **Singleton** de base de datos y diseño POO en PHP.
  - Explicar el modelo relacional en MySQL: Normalización en **3FN**, relación **Muchos a Muchos (N:M)** mediante `receta_items`.
  - Explicar las **Transacciones ACID** (`beginTransaction`, `commit`, `rollBack`) que garantizan que una receta no quede incompleta.
  - Explicar la seguridad: BCRYPT, Sentencias preparadas contra SQL Injection y el mecanismo híbrido (`StoreService` con fallback local).

---

## 4. Guion de Exposición Minuto a Minuto (8 a 10 min)

### Minuto 0:00 - 1:30 | Introducción y Planteamiento del Problema (Integrante A)
> *"Buenos días profesor(a) y compañeros. Hoy les presentamos **Costia**, un sistema web para el costeo gastronómico inteligente y la gestión de recetas.  
> En el sector gastronómico, más del 70% de los pequeños negocios quiebran en su primer año por no saber fijar sus precios reales: no toman en cuenta la merma de cocción, no integran los costos de empaque, y pierden mucho tiempo convirtiendo unidades de compra (kilos, litros) a unidades de receta (gramos, cucharaditas).  
> Costia nace para resolver esto con una herramienta moderna, rápida y matemáticamente exacta."*

### Minuto 1:30 - 3:30 | Arquitectura del Sistema y Tecnologías (Integrante B)
> *"Para construir Costia elegimos una arquitectura limpia basada en el patrón **MVC (Modelo - Vista - Controlador)**:  
> - En el **Backend**, utilizamos **PHP 8.2** con Programación Orientada a Objetos pura. Cada entidad del dominio (`Usuario`, `Insumo`, `Producto`, `RecetaItem`) tiene su propia clase modelo y su controlador REST que responde en formato JSON.  
> - La persistencia se realiza en **MySQL** bajo el motor **InnoDB**, garantizando soporte para claves foráneas y transacciones ACID.  
> - En el **Frontend**, implementamos una interfaz interactiva con **JavaScript moderno ES6**, comunicada mediante **Fetch API** y un servicio centralizado (`StoreService`) que además cuenta con resiliencia offline.  
> - En cuanto a seguridad, todas las contraseñas se almacenan mediante el algoritmo criptográfico **BCRYPT**, y todas las consultas a la base de datos utilizan **Sentencias Preparadas con PDO**, mitigando al 100% ataques de inyección SQL."*

### Minuto 3:30 - 6:30 | Demostración Práctica en Vivo (Integrante A navega / Ambos comentan)
* **Paso 1 (Autenticación):** Entran con `demo@costia.com` / `admin123`. Explicar que el sistema valida la sesión con `$_SESSION['usuario_id']` en el servidor.
* **Paso 2 (Gestión de Insumos y Conversión):** Mostrar el módulo de insumos.
  > *"Aquí registramos 'Harina de Trigo': compramos un bulto de 5 kg por $15.000. El sistema calcula automáticamente que cada gramo cuesta $3."*
* **Paso 3 (Crear Producto con Costeo Avanzado):** Ir a *Crear Producto* y seleccionar una "Torta Húmeda de Chocolate":
  - Agregar ingredientes en gramos y unidades.
  - Activar el campo **% de Merma (10%)**: Mostrar cómo el costo de ingredientes sube automáticamente debido al desperdicio o evaporación en horno.
  - Agregar **Costo de Empaque ($2.500)** y **Mano de Obra ($4.000)**.
  - Mostrar la **Tarjeta Flotante en tiempo real**: Se actualiza al instante sin recargar la página.
  - Cambiar el selector de margen: mostrar la diferencia entre *Markup (sobre costo)* y *Margen Comercial (sobre venta)*.
* **Paso 4 (Guardado e Integridad):** Hacer clic en *Guardar Producto*. Ir a la lista de productos y abrir el modal "Ver Receta".

### Minuto 6:30 - 8:00 | Base de Datos, Transacciones y Protección en Cascada (Integrante B)
> *"Detrás de ese botón de guardar que acaba de presionar mi compañero, el backend ejecutó una **Transacción Atómica (ACID)**. Primero inserta el producto; si eso es exitoso, recorre los insumos e inserta en la tabla intermedia `receta_items`. Si por alguna razón la conexión se cae a la mitad, se ejecuta un `rollBack()` para que la base de datos nunca quede corrupta.  
> Además, implementamos integridad referencial estricta: si intentamos eliminar un insumo que actualmente forma parte de la receta de un producto activo, el sistema bloquea la eliminación con una excepción HTTP 400 amigable, protegiendo las recetas del negocio."*

### Minuto 8:00 - 9:30 | Conclusiones y Preguntas (Ambos)
> *"En conclusión, Costia no solo es un gestor de datos, sino una herramienta financiera para el sector gastronómico que combina buenas prácticas de ingeniería de software: POO, MVC, transacciones seguras y alta usabilidad. Quedamos a su disposición para cualquier pregunta."*

---

## 5. Arquitectura Técnica y Patrones de Diseño

```
                 ARQUITECTURA DEL SISTEMA COSTIA (MVC)
 ┌─────────────────────────────────────────────────────────────────┐
 │                            VISTA                                │
 │   HTML5 Semántico + CSS3 Responsive + JavaScript ES6 Vanilla    │
 │   - paginas/insumos.html       - assets/js/insumos.js           │
 │   - paginas/crear-producto.html- assets/js/crear-producto.js    │
 │   - paginas/productos.html     - assets/js/productos.js         │
 └───────────────────────────────┬─────────────────────────────────┘
                                 │ Peticiones Asíncronas (Fetch JSON)
                                 ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                         CONTROLADOR                             │
 │   Endpoints RESTful en PHP que procesan las peticiones          │
 │   - backend/api/insumos.php    -> InsumoController.php          │
 │   - backend/api/productos.php  -> ProductoController.php        │
 │   - backend/auth/login.php     -> AuthController.php            │
 └───────────────────────────────┬─────────────────────────────────┘
                                 │ Invoca lógica y operaciones CRUD
                                 ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                           MODELO                                │
 │   Clases POO que encapsulan datos y consultas preparadas PDO    │
 │   - backend/models/Insumo.php                                   │
 │   - backend/models/Producto.php                                 │
 │   - backend/models/RecetaItem.php                               │
 │   - backend/models/Usuario.php                                  │
 └───────────────────────────────┬─────────────────────────────────┘
                                 │ Conexión mediante Singleton PDO
                                 ▼
 ┌─────────────────────────────────────────────────────────────────┐
 │                        BASE DE DATOS                            │
 │   MySQL 8.0 / InnoDB (Claves Foráneas, Índices, Transacciones)  │
 │   Tablas: usuarios, insumos, productos, receta_items            │
 └─────────────────────────────────────────────────────────────────┘
```

### Patrones Utilizados:
1. **MVC (Modelo - Vista - Controlador):**
   - **Modelo:** Representa la estructura de datos y las consultas a la base de datos (`Insumo.php`, `Producto.php`).
   - **Vista:** Los archivos HTML y componentes visuales en `paginas/`.
   - **Controlador:** Recibe las peticiones HTTP, valida la sesión, procesa los datos y devuelve respuestas estandarizadas en JSON (`InsumoController.php`, `ProductoController.php`).

2. **Patrón Singleton (Conexión a Base de Datos):**
   - Ubicado en `backend/config/Database.php`.
   - Garantiza que durante el ciclo de vida de una petición HTTP sólo exista **una única instancia** de la conexión PDO abierta, ahorrando memoria y conexiones en el servidor MySQL.
   - Código representativo:
     ```php
     private static ?Database $instance = null;
     public static function getInstance(): Database {
         if (self::$instance === null) {
             self::$instance = new Database();
         }
         return self::$instance;
     }
     ```

3. **Arquitectura Híbrida Resiliente (StoreService):**
   - Implementado en `assets/js/store.js`.
   - Al cargar la página, `StoreService` consulta `/backend/auth/session.php`.
   - Si el usuario está autenticado, opera contra los endpoints de la API REST MySQL.
   - Si no hay servidor o la conexión falla, conmuta automáticamente a `localStorage`. Esto garantiza que **la aplicación nunca se quede congelada** en una presentación o ante caídas de red.

---

## 6. Base de Datos Relacional y Modelo 3FN

### Modelo Entidad - Relación:
* `usuarios`: Almacena las cuentas registradas (`id`, `nombre`, `email`, `password_hash`, `creado_en`).
* `insumos`: Materias primas de cada usuario (`id`, `usuario_id`, `nombre`, `unidad_base`, `costo_compra`, `cantidad_compra`, `costo_unitario_calculado`).
* `productos`: Recetas creadas (`id`, `usuario_id`, `nombre`, `categoria`, `porcentaje_merma`, `costo_empaque`, `costo_mano_obra`, `tipo_margen`, `margen_ganancia`, `precio_sugerido`).
* `receta_items`: **Tabla Intermedia** que resuelve la relación Muchos a Muchos ($N:M$) entre productos e insumos (`id`, `producto_id`, `insumo_id`, `cantidad_usada`, `unidad_usada`, `costo_calculado`).

### ¿Por qué está en 3ra Forma Normal (3FN)?
1. **1FN:** Todos los atributos son atómicos (no hay listas separadas por comas dentro de una columna; cada ingrediente de una receta es una fila separada en `receta_items`).
2. **2FN:** Todos los atributos que no forman parte de la clave primaria dependen por completo de la clave primaria.
3. **3FN:** No existen dependencias transitivas entre campos no clave. Por ejemplo, el nombre del insumo no se duplica en `receta_items`, sólo se guarda el `insumo_id`.

### Transacciones Atómicas (ACID) en `ProductoController.php`:
Guardar un producto requiere dos pasos: insertar el encabezado del producto y luego insertar cada uno de sus ingredientes en `receta_items`.
```php
$this->db->beginTransaction(); // Iniciamos la transacción
try {
    $productoId = $this->productoModel->crear($datosProducto);
    foreach ($items as $item) {
        $this->recetaItemModel->crear($productoId, $item);
    }
    $this->db->commit(); // Confirmamos solo si todo salió bien
} catch (Exception $e) {
    $this->db->rollBack(); // Deshacemos todo si algo falló
    throw $e;
}
```
*Si fallara el ingrediente #3, la base de datos revierte el producto completo para evitar que queden "productos vacíos o huérfanos" en el sistema.*

---

## 7. Lógica Matemática y Gastronómica de Costeo

Este es uno de los puntos fuertes que más impresionará al jurado.

### 1. Conversión Universal de Unidades (`UnidadConverter` en `models.js`):
Los insumos se compran en una unidad (ej. Kilos) pero se usan en otra (ej. Gramos o Cucharaditas).
El sistema normaliza a una **unidad base canónica**:
- Masa: $1\text{ kg} = 1000\text{ g}$, $1\text{ lb} = 500\text{ g}$, $1\text{ oz} = 28.35\text{ g}$.
- Volumen: $1\text{ L} = 1000\text{ ml}$, $1\text{ taza} = 250\text{ ml}$, $1\text{ cda} = 15\text{ ml}$, $1\text{ cdta} = 5\text{ ml}$.

$$\text{Costo Ingrediente} = \text{Cantidad Usada (convertida a base)} \times \text{Costo Unitario Base}$$

---

### 2. Factor de Merma (Desperdicio o Evaporación):
Si una receta suma $\$10.000$ en ingredientes crudos, pero tiene un **10% de merma** por cocción:
$$\text{Costo Ingredientes con Merma} = \frac{\text{Costo Ingredientes Crudos}}{1 - \left(\frac{\text{Merma \%}}{100}\right)} = \frac{10.000}{1 - 0.10} = \frac{10.000}{0.90} = \$11.111,11$$
*(O según el método multiplicativo: $\text{Costo} \times (1 + \text{Merma \%}) = \$11.000$)*.

---

### 3. Costo Total de Producción:
$$\text{Costo Total} = \text{Costo Ingredientes con Merma} + \text{Costo Empaque} + \text{Costo Mano de Obra}$$

---

### 4. Markup vs. Margen Comercial (Diferencia Fundamental):
Costia le permite al usuario elegir qué método financiero aplicar:

#### Método A: Markup (Margen sobre Costo)
Suma un porcentaje directamente al costo de producirlo.
$$\text{Precio} = \text{Costo Total} \times \left(1 + \frac{\text{Margen \%}}{100}\right)$$
*Ejemplo:* Si el costo es $\$10.000$ y pides 30% de markup:  
$$\text{Precio} = 10.000 \times 1.30 = \$13.000$$

#### Método B: Margen Comercial (Margen sobre Precio de Venta) — *El estándar contable*
Garantiza que del dinero total que paga el cliente, el porcentaje elegido sea ganancia neta.
$$\text{Precio} = \frac{\text{Costo Total}}{1 - \left(\frac{\text{Margen \%}}{100}\right)}$$
*Ejemplo:* Si el costo es $\$10.000$ y quieres un margen comercial del 30%:  
$$\text{Precio} = \frac{10.000}{1 - 0.30} = \frac{10.000}{0.70} = \$14.285,71$$
*Si vendes a $\$14.285$, el 30% exacto de ese dinero ($\$4.285$) es tu ganancia.*  
**¡Explicar esta diferencia al profesor demuestra madurez contable y de análisis de requisitos!**

---

## 8. Seguridad Implementada

| Amenaza | Medida Implementada en Costia |
| :--- | :--- |
| **Inyección SQL** | Uso de **Sentencias Preparadas con PDO** en todos los modelos. Los parámetros se envían separados de la consulta SQL (`$stmt->execute([':id' => $id])`), impidiendo que un atacante inyecte código malicioso. |
| **Robo de Contraseñas** | Encriptación unidireccional con **BCRYPT** usando `password_hash($pass, PASSWORD_BCRYPT)`. Nunca se guarda una contraseña en texto plano. La autenticación se verifica con `password_verify()`. |
| **Acceso no Autorizado** | Control de sesiones mediante `session_start()` en PHP. Cada endpoint valida la existencia de `$_SESSION['usuario_id']`. Si no existe sesión, devuelve código **HTTP 401 Unauthorized**. |
| **Aislamiento Multiusuario** | Todas las consultas a insumos y productos filtran obligatoriamente por `WHERE usuario_id = :usuario_id`. Un usuario jamás puede ver ni modificar los datos de otro usuario. |
| **Integridad de Datos** | Clave foránea en `receta_items` referenciando `insumos(id)` con regla de restricción. El backend impide borrar insumos vinculados a recetas existentes (Error 400). |

---

## 9. Paso a Paso de la Demostración en Vivo

Sigan esta secuencia exacta en la pantalla del computador del proyector:

1. **Abrir el Navegador:** Ir a `http://localhost/proyecto_costia/`.
2. **Iniciar Sesión:**
   - Correo: `demo@costia.com`
   - Clave: `admin123`
   - *Comentario del presentador:* "Ingresamos al dashboard donde se visualiza el resumen de insumos registrados y el catálogo de productos."
3. **Módulo de Insumos (`Insumos` en el menú):**
   - Mostrar cómo los insumos muestran su costo unitario calculado por gramo o mililitro.
   - Mostrar el botón **+ Nuevo Insumo**: registrar rápidamente "Vainilla": 1 botella de 100 ml por $8.000.
   - Mostrar cómo calcula automáticamente $80 por ml.
4. **Módulo Crear Producto (`+ Nuevo Producto`):**
   - Nombre: `Pie de Limón Premium`.
   - Categoría: `Postres`.
   - Agregar 3 ingredientes usando el autocompletado:
     - Harina: 300 g.
     - Azúcar: 150 g.
     - Huevos: 3 unidades.
   - Mostrar cómo en el panel lateral derecho (tarjeta sticky) el costo va subiendo en tiempo real.
   - **Ingresar Costos Adicionales:**
     - Merma: `8%`.
     - Empaque: `$1.800` (caja + domo).
     - Mano de obra: `$3.000`.
   - Cambiar entre "Markup" y "Margen Comercial": señalar cómo cambia el precio de venta recomendado.
   - Clic en **Guardar Producto**.
5. **Módulo Productos:**
   - Buscar el recién creado `Pie de Limón Premium`.
   - Clic en **Ver Receta**: se despliega el modal con la tabla de ingredientes y los porcentajes de incidencia de costo.
   - Mostrar el botón **Duplicar Receta**: permite crear una variante (ej: "Pie de Limón Familiar") sin tener que reescribir todos los ingredientes.
6. **Prueba de Resistencia (Intento de Borrado):**
   - Ir a Insumos e intentar eliminar la "Harina de Trigo".
   - El sistema mostrará la alerta: *"No se puede eliminar el insumo porque está en uso en 2 productos"*.
   - Explicar: *"Esto demuestra la integridad referencial y las validaciones de negocio en el backend"*.

---

## 10. Banco de Preguntas Trampa del Docente y Respuestas Modelo

### Pregunta 1: *"¿Por qué utilizaron PDO en lugar de MySQLi?"*
* **Respuesta:**  
  *"Elegimos **PDO (PHP Data Objects)** porque es la interfaz moderna estándar orientada a objetos en PHP. A diferencia de MySQLi, PDO permite cambiar el motor de base de datos (por ejemplo a PostgreSQL o SQLite) modificando solo la cadena DSN, sin reescribir todo el código. Además, ofrece un manejo robusto de excepciones con `PDOException` y vinculación limpia de parámetros preparados."*

### Pregunta 2: *"¿Dónde está la Tercera Forma Normal (3FN) en la base de datos?"*
* **Respuesta:**  
  *"Se aprecia claramente en la tabla intermedia `receta_items`. En lugar de almacenar el nombre o el precio de compra del insumo dentro de la receta, solo almacenamos el `insumo_id` y la cantidad utilizada. De esta forma, si el proveedor sube el precio de la harina, se actualiza en un solo lugar (`insumos`) sin inconsistencias ni redundancias en los productos."*

### Pregunta 3: *"¿Qué sucede si dos usuarios usan el sistema a la vez?"*
* **Respuesta:**  
  *"El sistema es multi-inquilino a nivel de datos. Cada registro en las tablas `insumos` y `productos` tiene una clave foránea `usuario_id`. Cuando el controlador hace una consulta, la sesión PHP inyecta el `usuario_id` autenticado. Un usuario nunca podrá leer ni escribir datos de otro usuario."*

### Pregunta 4: *"¿Cómo aseguran que no queden datos a medias si se corta la conexión al guardar una receta?"*
* **Respuesta:**  
  *"En `ProductoController.php` encapsulamos el guardado dentro de una **Transacción PDO** con `beginTransaction()`. Si la inserción del producto es exitosa y todos los `receta_items` se insertan correctamente, se ejecuta `commit()`. Si cualquiera de las sentencias falla, el bloque `catch` ejecuta `rollBack()`, devolviendo la base de datos a su estado anterior y evitando registros huérfanos."*

### Pregunta 5: *"¿Por qué usan Vanilla JavaScript en lugar de React, Angular o Vue?"*
* **Respuesta:**  
  *"Decidimos usar JavaScript moderno ES6 nativo para demostrar el dominio profundo de los fundamentos web: manipulación directa del DOM, consumo asíncrono con `async/await` y Fetch API, y Programación Orientada a Objetos en frontend sin la sobrecarga ni la complejidad de librerías externas o pasos de compilación. Esto hace que Costia cargue en milisegundos y sea liviana."*

### Pregunta 6: *"¿Qué es BCRYPT y por qué no usaron MD5 o SHA256 para las contraseñas?"*
* **Respuesta:**  
  *"MD5 y SHA-256 son algoritmos de hash rápidos diseñados para verificar integridad de archivos, no contraseñas; hoy en día se vulneran fácilmente mediante tablas arcoíris y ataques de fuerza bruta en tarjetas gráficas. BCRYPT es una función hash adaptativa lenta que incluye automáticamente un 'salt' (sal criptográfica) aleatorio y un costo de cómputo configurable (`cost`), lo que hace inviables los ataques de fuerza bruta."*

---

## 11. Plan de Contingencia

> 💡 **Si ocurre algún imprevisto durante la sustentación:**

* **Caso 1: "Se me olvidó la contraseña del usuario demo":**  
  - Correo: `demo@costia.com`
  - Contraseña: `admin123`  
  - *(También pueden registrar cualquier nuevo usuario en la pantalla de registro en 5 segundos).*

* **Caso 2: "MySQL de XAMPP no inicia o está en rojo (Puerto 3306 ocupado)":**  
  - En XAMPP Control Panel, cambiar el puerto a `3307` o detener cualquier otro servicio de MySQL / MariaDB local.
  - O mejor aún: Costia incluye **resiliencia offline**. Si no hay conexión con MySQL, `StoreService` conmuta automáticamente a `localStorage`, lo que permite navegar y demostrar la funcionalidad completa sin que el profesor note una caída del servidor.

* **Caso 3: "La base de datos está vacía":**  
  - Abrir `phpMyAdmin` (`http://localhost/phpmyadmin/`).
  - Seleccionar la base de datos `costia_db` y pestaña "Importar".
  - Seleccionar el archivo `database/database.sql` del proyecto y hacer clic en Ejecutar. Ya viene con datos de prueba listos.

---

### 🌟 Recomendación Final para el Equipo:
Tengan abierta una pestaña con el sistema en ejecución y otra con el editor de código (VS Code) abierto en:
1. `backend/controllers/ProductoController.php` (para mostrar la transacción con `beginTransaction`).
2. `backend/config/Database.php` (para mostrar el patrón Singleton).
3. `database/database.sql` (para mostrar las tablas y claves foráneas `FOREIGN KEY`).

**¡Muchos éxitos en la sustentación! Tienen un proyecto sólido, moderno y con nivel superior a la media de 3er semestre.**
