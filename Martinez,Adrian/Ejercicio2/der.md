# Fundamentación de Decisiones de Diseño - API de Gestión de Tareas

## 1. Modelo de Datos (MySQL)
- **Estructura de la Tabla**: Se diseñó una entidad `tareas` compuesta por tres atributos principales:
  - `id`: Clave primaria de tipo entero, configurada con `AUTO_INCREMENT` para garantizar la identificación unívoca y secuencial de cada registro de forma automática.
  - `nombre`: Cadena de texto (`VARCHAR(255)`) definida como `NOT NULL` para asegurar la obligatoriedad del contenido descriptivo de la tarea.
  - `completada`: Campo booleano (`BOOLEAN`) configurado con un valor por defecto en falso (`DEFAULT FALSE`), representando de manera eficiente el estado binario de cumplimiento de la tarea.
- **Restricción de Unicidad**: Se aplicó una restricción `UNIQUE` directamente sobre la columna `nombre` a nivel de base de datos. Esto garantiza por diseño que no puedan coexistir dos tareas con el mismo identificador textual, previniendo duplicidades e inconsistencias operativas.

## 2. Decisiones Arquitectónicas y de la API (ExpressJS & ES Modules)
- **Módulos de ES (`import` / `export`)**: Se adoptó estrictamente la configuración `"type": "module"` en el archivo `package.json`, estandarizando el código bajo el sistema de módulos de ECMAScript para mantener consistencia moderna en todo el proyecto.
- **Criterio de Comparación Consistente**: Para prevenir duplicados que difieran únicamente por espacios en blanco accidentales, se implementó una normalización del texto mediante el método `.trim()` provisto por `express-validator`. De este modo, cualquier denominación es saneada antes de su cotejo y almacenamiento.
- **Filtrado Dinámico por Estado**: Se incorporó soporte de *Query Parameters* en la ruta principal (`/tareas?estado=true` o `?estado=false`). Esto permite consultar de forma eficiente el subconjunto de tareas completadas o pendientes directamente optimizado a nivel de sentencia SQL (`WHERE completada = ?`).
- **Validaciones Robusta y Códigos HTTP Semánticos**: 
  - Mediante el uso de `express-validator`, se validan rigurosamente tipos de datos, presencia de campos obligatorios y formato de parámetros de ruta (`id` entero mayor a cero).
  - Se devuelven respuestas HTTP estandarizadas: `201 Created` para recursos creados con éxito, `400 Bad Request` ante fallas de validación o intentos de duplicidad (`ER_DUP_ENTRY`), `404 Not Found` cuando el recurso solicitado no existe, y `500 Internal Server Error` ante imprevistos en la conexión con la base de datos.