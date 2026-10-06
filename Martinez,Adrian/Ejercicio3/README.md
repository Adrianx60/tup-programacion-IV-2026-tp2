# Ejercicio 3: API REST con ExpressJS y MySQL - Gestión de Calificaciones

## Fundamentación de Decisiones de Diseño

### 1. Modelo de Datos (Base de Datos MySQL)
* **Tabla `materias` (Independiente):** Modelada de forma independiente para normalizar la estructura de la carrera, evitando redundancia de texto y relacionando estrictamente las calificaciones mediante una clave foránea (`materia_id`).
* **Tabla `calificaciones`:** Almacena el nombre del alumno, la referencia a la materia cursada y tres notas numéricas asociadas.
* **Restricción de Unicidad (`UNIQUE`):** Se implementó una clave única compuesta (`CONSTRAINT uc_alumno_materia UNIQUE (nombre_alumno, materia_id)`) a nivel de base de datos para impedir de forma rigurosa que exista más de un registro para la misma combinación de alumno y materia, tanto al crear como al modificar información.

### 2. Diseño de la API REST y Validaciones
* **Recursos y Métodos HTTP:**
  * `GET /api/materias`: Consulta el catálogo de materias.
  * `GET /api/calificaciones`: Lista todas las calificaciones vinculadas con sus materias mediante un `JOIN`.
  * `POST /api/calificaciones`: Registra una nueva calificación validando la existencia de la materia y la regla de unicidad.
  * `PUT /api/calificaciones/:id`: Modifica un registro existente previniendo conflictos de unicidad.
  * `DELETE /api/calificaciones/:id`: Elimina un registro por su ID.
* **Escala de Notas:** Se estableció y documentó una escala numérica decimal comprendida entre **1.00 y 10.00**.
* **Validación con `express-validator`:** Se implementó validación exhaustiva de los parámetros de ruta, las consultas y el cuerpo (`body`) de las solicitudes para garantizar la integridad y rechazar peticiones inválidas antes de interactuar con la base de datos.