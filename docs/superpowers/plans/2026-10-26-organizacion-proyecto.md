# Plan de Implementación: Organización Estructural del Proyecto Costia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar la estructura de archivos y carpetas del proyecto Costia, aislando material de entrega académica y base de datos, agregando `.gitignore` y actualizando documentación sin alterar la funcionalidad de la aplicación web.

**Architecture:** Separación limpia de capas de contenido: el código web activo permanece en raíz (`index.html`), `paginas/`, `assets/` y `backend/`; los recursos de persistencia van a `database/`; el material expositivo y binarios pesados van a `docs/entregas/`.

**Tech Stack:** PHP 8+, HTML5/CSS3/Vanilla JS, MySQL, PowerShell/Bash.

**Spec:** `docs/superpowers/specs/2026-10-26-organizacion-proyecto-design.md`

## Global Constraints
- No alterar rutas ni archivos dentro de `backend/` ni `paginas/`.
- No remover `assets/css/presentacion.css` ni `assets/js/presentacion.js` (son consumidos por `index.html`).
- Asegurar que `docs/entregas/presentacion_primer_avance.html` conserve enlaces válidos hacia `assets/`.
- Ejecutar `graphify update .` al terminar cambios de archivos.

## Review Focus
1. `index.html` debe seguir cargando sus estilos y scripts (`assets/css/presentacion.css`, `assets/js/presentacion.js`) sin errores 404.
2. `docs/entregas/presentacion_primer_avance.html` debe cargar el logo en `../../assets/img/costia-icon-green.png` sin romperse.
3. El archivo `database/database.sql` debe estar íntegro y legible.
4. El archivo `.gitignore` debe impedir el rastreo innecesario de zips y temporales.
5. `README.md` debe reflejar fielmente las nuevas rutas y comandos de importación.

---

### Task 1: Creación de directorios y reubicación de archivos

**Files:**
- Create: `database/`
- Create: `docs/entregas/`
- Move: `database.sql` -> `database/database.sql`
- Move: `GUIA_PRESENTACION.md` -> `docs/entregas/GUIA_PRESENTACION.md`
- Move: `presentacion_primer_avance.html` -> `docs/entregas/presentacion_primer_avance.html`
- Move: `primer_avance.zip` -> `docs/entregas/primer_avance.zip`

- [x] **Step 1: Crear directorios `database` y `docs/entregas`**
Crear los directorios necesarios mediante comandos del sistema.
Run: `New-Item -ItemType Directory -Path database, docs\entregas -Force`
Expected: Directorios creados exitosamente.

- [x] **Step 2: Mover archivos a sus nuevos destinos**
Mover `database.sql` a `database/`, y `GUIA_PRESENTACION.md`, `presentacion_primer_avance.html`, `primer_avance.zip` a `docs/entregas/`.
Run: 
```powershell
Move-Item -Path .\database.sql -Destination .\database\database.sql
Move-Item -Path .\GUIA_PRESENTACION.md -Destination .\docs\entregas\GUIA_PRESENTACION.md
Move-Item -Path .\presentacion_primer_avance.html -Destination .\docs\entregas\presentacion_primer_avance.html
Move-Item -Path .\primer_avance.zip -Destination .\docs\entregas\primer_avance.zip
```
Expected: Archivos reubicados sin errores.

- [x] **Step 3: Verificar que los archivos existen en su nuevo destino y no están en la raíz**
Run: `Test-Path .\database\database.sql, .\docs\entregas\GUIA_PRESENTACION.md, .\docs\entregas\presentacion_primer_avance.html, .\docs\entregas\primer_avance.zip`
Expected: Todos devuelven `True`.
Run: `Test-Path .\database.sql, .\GUIA_PRESENTACION.md, .\presentacion_primer_avance.html, .\primer_avance.zip`
Expected: Todos devuelven `False`.

---

### Task 2: Corrección de rutas de assets en presentación reubicada

**Files:**
- Modify: `docs/entregas/presentacion_primer_avance.html`

- [x] **Step 1: Ajustar ruta relativa del logo en `presentacion_primer_avance.html`**
Reemplazar `assets/img/costia-icon-green.png` por `../../assets/img/costia-icon-green.png` para compensar los dos niveles de profundidad (`docs/entregas/`).
Expected: El logo apunta a la ruta válida en `assets/img/`.

- [x] **Step 2: Verificar la sustitución en `presentacion_primer_avance.html`**
Run: `Select-String -Path .\docs\entregas\presentacion_primer_avance.html -Pattern "costia-icon-green"`
Expected: Muestra `../../assets/img/costia-icon-green.png`.

---

### Task 3: Creación de archivo `.gitignore`

**Files:**
- Create: `.gitignore`

- [x] **Step 1: Escribir archivo `.gitignore` con exclusiones estándar**
Crear `.gitignore` en la raíz con exclusiones de archivos binarios/comprimidos, IDEs, logs y temporales del sistema operativo:
```gitignore
# Archivos comprimidos y paquetes pesados
*.zip
*.tar.gz
*.rar

# Entornos y editores
.vscode/
.idea/
*.sublime-project
*.sublime-workspace

# Sistema operativo
Thumbs.db
Desktop.ini
.DS_Store

# Logs y temporales
*.log
*.tmp
```

- [x] **Step 2: Verificar que `.gitignore` existe en la raíz**
Run: `Test-Path .\.gitignore`
Expected: `True`

---

### Task 4: Actualización de documentación (`README.md` y guía)

**Files:**
- Modify: `README.md`
- Modify: `docs/entregas/GUIA_PRESENTACION.md`

- [x] **Step 1: Actualizar `README.md` con las nuevas rutas**
Actualizar en `README.md`:
1. La sección de importación de base de datos (`database/database.sql` en lugar de `database.sql`).
2. El comando CLI: `mysql -u root -p < database/database.sql`.
3. El árbol de arquitectura reflejando `database/`, `docs/`, `.gitignore`.

- [x] **Step 2: Actualizar `docs/entregas/GUIA_PRESENTACION.md`**
Actualizar menciones de `database.sql` hacia `database/database.sql`.

- [x] **Step 3: Verificar consistencia en los archivos modificados**
Run: `Select-String -Path .\README.md -Pattern "database/database.sql"`
Expected: Coincidencias encontradas.

---

### Task 5: Actualización del grafo de conocimiento con Graphify

**Files:**
- Update: `graphify-out/`

- [x] **Step 1: Ejecutar actualización de Graphify**
Run: `graphify update .`
Expected: Proceso completado exitosamente con código de salida 0.
