# Documento de Diseño: Organización Estructural del Proyecto Costia

**Fecha:** 2026-10-26  
**Estado:** Propuesta para Aprobación  
**Autor:** Antigravity (Superpowers)  
**Alcance:** Enfoque 1 (Organización Estructural y Separación de Entregas)

---

## 1. Intención y Propósito
El proyecto Costia (sistema de costeo y fijación de precios en PHP y Vanilla JS) se encuentra en su fase de desarrollo universitario. Actualmente conviven en la raíz archivos de entrega académica, scripts de presentación, archivos binarios comprimidos y el script de base de datos junto al código fuente del aplicativo web.

El objetivo es organizar la estructura de carpetas de forma limpia y profesional, aislando el material de entregas/documentación y el script de base de datos, agregando un archivo `.gitignore` adecuado, y actualizando la documentación sin romper ninguna funcionalidad del aplicativo en Apache/XAMPP.

---

## 2. Objetivos y No-Objetivos

### Objetivos (Goals):
- Crear un directorio `database/` y reubicar `database.sql`.
- Crear un directorio `docs/` con subdirectorios dedicados:
  - `docs/entregas/` o `docs/academico/` para resguardar `presentacion_primer_avance.html`, `GUIA_PRESENTACION.md` y `primer_avance.zip`.
- Mantener en `assets/` los archivos `presentacion.css` y `presentacion.js` intactos, ya que la landing page `index.html` depende de ellos activamente para su simulador.
- Actualizar la referencia a la imagen en `presentacion_primer_avance.html` (`../../assets/img/costia-icon-green.png` o `../assets/...`) para que la presentación siga abriendo e ilustrándose correctamente desde su nueva ubicación.
- Crear un `.gitignore` integral para proyectos PHP/Web (ignorando `.zip`, `.vscode/`, `.idea/`, temporales del SO como `Thumbs.db` y `.DS_Store`, y logs).
- Actualizar `README.md` y `GUIA_PRESENTACION.md` reflejando la nueva ruta `database/database.sql` y el árbol de directorios actualizado.
- Ejecutar `graphify update .` al finalizar para mantener el grafo de conocimiento al día.

### No-Objetivos (Non-Goals):
- No modificar controladores ni modelos PHP en `backend/` ni alterar las APIs.
- No reestructurar los scripts de `assets/js/` ni cambiar su interacción con el DOM o `localStorage`/MySQL.
- No transformar la estructura de URLs a enrutador central `public/index.php` ni alterar la configuración de Apache.

### Anti-Objetivos (Anti-Goals):
- Romper enlaces en `index.html`, páginas de `paginas/` o endpoints de `backend/`.
- Mover archivos que `index.html` consume (`assets/css/presentacion.css`, `assets/js/presentacion.js`).

---

## 3. Enfoques Considerados y Selección

1. **Enfoque 1: Organización Estructural y Limpieza de Entregas (Seleccionado)**
   - *Ventajas:* Cero riesgo de regresión funcional. Separa entregas de código vivo. Añade buenas prácticas de Git y documentación clara.
   - *Desventajas:* Mantiene la estructura de código interno intacta (la refactorización de código se deja para fases posteriores).

2. **Enfoque 2: Organización Estructural + Refactorización MVC Backend/Frontend**
   - *Ventajas:* Estandariza la modularidad interna en JS y PHP.
   - *Desventajas:* Mayor riesgo de alterar rutas o variables en llamadas AJAX / Fetch existentes durante una etapa de entregas.

3. **Enfoque 3: Reestructuración a Enrutador Frontal Moderno (public/)**
   - *Ventajas:* Estándar de la industria en PHP moderno.
   - *Desventajas:* Requiere configuración de Apache / mod_rewrite que puede no ser compatible de forma directa en el entorno de evaluación del docente en XAMPP.

---

## 4. Estructura Resultante del Directorio

```
proyecto_costia/
├── .agents/                    # Reglas y flujos de trabajo de IA
├── .gitignore                  # Exclusiones de Git (zips, temporales, IDEs)
├── assets/                     # Recursos estáticos de la aplicación
│   ├── css/                    # Hojas de estilo (incluye presentacion.css para index.html)
│   ├── img/                    # Iconos e imágenes del sistema
│   └── js/                     # Scripts y controladores (incluye presentacion.js para index.html)
├── backend/                    # Lógica del servidor PHP
│   ├── api/                    # Endpoints REST (insumos, productos, demo, asesor)
│   ├── auth/                   # Endpoints de autenticación y sesión
│   ├── config/                 # Conexión Singleton PDO (Database.php)
│   ├── controllers/            # Controladores del backend
│   ├── models/                 # Modelos de dominio PHP
│   └── conexion.php            # Verificador de enlace con BD
├── database/                   # Scripts y esquemas relacionales
│   └── database.sql            # DDL/DML de MySQL con llaves foráneas y datos demo
├── docs/                       # Documentación del proyecto
│   ├── entregas/               # Material de entregas académicas y defensas
│   │   ├── GUIA_PRESENTACION.md
│   │   ├── presentacion_primer_avance.html
│   │   └── primer_avance.zip
│   └── superpowers/specs/      # Especificaciones y diseños de arquitectura
├── paginas/                    # Vistas HTML secundarias (insumos, productos, login, etc.)
├── index.html                  # Landing page y simulador principal
└── README.md                   # Documentación principal del repositorio
```

---

## 5. Decisiones de Implementación Detalladas
1. **Creación de directorios:** `database/` y `docs/entregas/`.
2. **Reubicación de archivos:**
   - `database.sql` → `database/database.sql`
   - `GUIA_PRESENTACION.md` → `docs/entregas/GUIA_PRESENTACION.md`
   - `presentacion_primer_avance.html` → `docs/entregas/presentacion_primer_avance.html`
   - `primer_avance.zip` → `docs/entregas/primer_avance.zip`
3. **Ajuste de enlaces en `docs/entregas/presentacion_primer_avance.html`:**
   - Reemplazar `src="assets/img/costia-icon-green.png"` por `src="../../assets/img/costia-icon-green.png"`.
4. **Creación de `.gitignore`:**
   - Incluir `.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`, `*.log`, y opcionalmente archivos zip temporales.
5. **Actualización de documentación:**
   - En `README.md`, actualizar las referencias a `database/database.sql` y el diagrama de estructura de directorios.
   - En `docs/entregas/GUIA_PRESENTACION.md`, actualizar menciones a `database/database.sql`.
6. **Mantenimiento de Graphify:**
   - Correr `graphify update .` para sincronizar el grafo de conocimiento.
