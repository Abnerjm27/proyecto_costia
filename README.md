# Costia — Sistema de Costeo y Fijación de Precios de Venta

Aplicación web orientada a negocios de manufactura, gastronomía y panadería que elaboran sus propios productos. Permite calcular el costo real de producción por unidad a partir de recetas e insumos, sugiriendo precios de venta mediante márgenes de ganancia en porcentaje o multiplicadores de costo según el tipo de negocio.

---

## 🛠 Requisitos del Entorno

* **Servidor web:** Apache (vía XAMPP, WAMP o Laragon).
* **PHP:** Versión 8.0 o superior con extensión `pdo_mysql` habilitada.
* **Base de datos:** MySQL / MariaDB 10.4+.
* **Navegador web:** Chrome, Edge, Firefox u Opera actualizado.

---

## 🗄️ Configuración de la Base de Datos (MySQL)

El proyecto incluye el script completo con la estructura relacional y datos de demostración en el archivo [`database/database.sql`](database/database.sql).

### Opción A: Desde phpMyAdmin (XAMPP)
1. Inicia **Apache** y **MySQL** desde el panel de control de XAMPP.
2. Abre tu navegador e ingresa a `http://localhost/phpmyadmin`.
3. Haz clic en la pestaña superior **Importar**.
4. Haz clic en **Seleccionar archivo** y elige el archivo `database.sql` ubicado en la carpeta `database/` de este proyecto.
5. Presiona el botón **Importar** al final de la página. Se creará automáticamente la base de datos `costia_db` con las tablas:
   * `usuarios`
   * `insumos`
   * `productos`
   * `receta_items`

### Opción B: Desde la Consola de MySQL (CMD / PowerShell)
```bash
# Navegar a la carpeta bin de MySQL en XAMPP o tenerlo en el PATH:
C:\xampp\mysql\bin\mysql.exe -u root -p < database/database.sql
```

---

## 👤 Usuario de Prueba Preconfigurado

Si deseas iniciar sesión directamente sin registrarte, puedes usar:
* **Correo:** `demo@costia.com`
* **Contraseña:** `admin123`

*(O también puedes crear una cuenta nueva desde la página de Registro; el sistema automáticamente inicializará insumos y recetas de ejemplo en tu cuenta).*

---

## 🏗 Arquitectura del Software

El sistema sigue los principios de **Programación Orientada a Objetos (POO)** y **Modelo-Vista-Controlador (MVC)**:

```
proyecto_costia/
├── .agents/                  # Reglas y flujos de trabajo de IA
├── .gitignore                # Exclusiones de Git (zips, temporales, IDEs)
├── assets/
│   ├── css/                  # Hojas de estilo modularizadas (incluye presentacion.css)
│   ├── img/                  # Iconos SVG e imágenes de interfaz
│   └── js/
│       ├── models.js         # Clases de dominio: Insumo, Producto, ItemReceta, UnidadConverter
│       ├── store.js          # Servicio central de sincronización híbrida (MySQL + LocalStorage)
│       ├── insumos.js        # Controlador de la vista Insumos
│       ├── productos.js      # Controlador de la vista Productos y KPIs
│       ├── crear-producto.js # Controlador del formulario de recetas y cotización
│       ├── presentacion.js   # Lógica del simulador interactivo de la landing
│       └── asesor/           # Módulo del Asesor Inteligente Costia
├── backend/
│   ├── api/
│   │   ├── insumos.php       # Endpoint REST (GET, POST, DELETE) para insumos
│   │   ├── productos.php     # Endpoint REST (GET, POST, DELETE, PATCH) para recetas
│   │   ├── demo.php          # Endpoint para restaurar datos iniciales en MySQL
│   │   └── asesor.php        # Endpoint del asistente de IA
│   ├── auth/
│   │   ├── login.php         # Endpoint para autenticar usuario
│   │   ├── registro.php      # Endpoint para registrar nuevo usuario
│   │   ├── session.php       # Verificación de sesión activa PHP
│   │   └── logout.php        # Cierre y destrucción de sesión segura
│   ├── config/
│   │   └── Database.php      # Conexión PDO Singleton a MySQL con soporte de entorno
│   ├── controllers/
│   │   ├── AuthController.php      # Lógica de sesiones y hashing BCRYPT
│   │   ├── InsumoController.php    # CRUD e integridad relacional de insumos
│   │   └── ProductoController.php  # CRUD y transacciones ACID para recetas
│   ├── models/
│   │   ├── Usuario.php       # Entidad Usuario
│   │   ├── Insumo.php        # Entidad Insumo
│   │   ├── Producto.php      # Entidad Producto
│   │   └── RecetaItem.php    # Entidad Ingrediente de Receta
│   └── conexion.php          # Verificador de enlace con la base de datos
├── database/
│   └── database.sql          # Script DDL/DML de MySQL con llaves foráneas y datos demo
├── docs/
│   ├── entregas/             # Material de sustentación y paquetes de avance académico
│   │   ├── GUIA_PRESENTACION.md
│   │   ├── presentacion_primer_avance.html
│   │   └── primer_avance.zip
│   └── superpowers/          # Especificaciones de diseño y planes de ejecución
├── paginas/
│   ├── insumos.html          # Vista de inventario de materias primas
│   ├── productos.html        # Vista de tarjetas de productos y KPIs
│   ├── crear-producto.html   # Vista de armado de recetas y fijación de precios
│   ├── ficha-tecnica.html    # Vista imprimible y detallada de ficha técnica
│   ├── ficha-preview.html    # Previsualización rápida de ficha técnica
│   ├── login.html            # Vista de inicio de sesión
│   └── registro.html         # Vista de creación de cuenta
└── index.html                # Landing page de presentación del sistema
```

---

## ⚡ Características Principales

1. **Persistencia Híbrida Inteligente:** Los datos se sincronizan directamente con MySQL cuando el usuario ha iniciado sesión. Si el servidor se apaga o se prueba sin base de datos, funciona de manera transparente con `localStorage`.
2. **Costeo Gastronómico Integral:** Permite contemplar no solo ingredientes crudos, sino también:
   * **% de Merma / Desperdicio en cocción/horneado** (ajusta el costo real de materias primas).
   * **Costo de Empaque por unidad** (cajas, bolsas, etiquetas, etc.).
   * **Mano de obra y gastos fijos repartidos por lote** (arriendo y servicios distribuidos de forma justa).
3. **Márgenes Comerciales Flexibles:** Permite alternar entre **Mark-up (Margen sobre el Costo: Costo + %)** y **Margen Bruto Comercial (Margen sobre el Precio de Venta: Ganancia = % del Precio final)** con fórmulas financieras rigurosas.
4. **Integridad Relacional Protegida:** Al intentar eliminar un insumo, el sistema verifica si está en uso en algún producto activo y solicita confirmación con el listado de recetas afectadas.
5. **Conversión Universal de Medidas:** Convierte automáticamente entre unidades de masa (`kg`, `g`, `pizca`, `arroba`, `tonelada`) y volumen (`l`, `ml`, `taza`, `cucharada`, `cucharadita`).
6. **Alertas de Rentabilidad:** Detecta variaciones en los costos de materias primas y avisa visualmente cuánto sube o baja el precio de venta recomendado.
7. **Clonación de Recetas:** Permite duplicar productos existentes con un solo clic para crear variantes rápidamente.
