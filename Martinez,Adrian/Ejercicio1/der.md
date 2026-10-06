# Fundamentación de Decisiones de Diseño

## 1. Modelo de Datos (MySQL)
- Se diseñó una única tabla llamada `rectangulos` con los campos: `id`, `lado1`, `lado2`, `perimetro` y `superficie`.
- Se utilizó el tipo de dato `DECIMAL(10,2)` para garantizar precisión numérica en los cálculos geométricos y evitar los problemas de redondeo típicos de los tipos de punto flotante (`FLOAT`/`DOUBLE`).
- Se almacena tanto el perímetro como la superficie de forma persistente para optimizar consultas futuras, evitando recalcularlos en cada lectura si la tabla fuera muy grande.

## 2. Decisiones de la API (ExpressJS)
- **Cálculo en el Servidor**: Tal como solicitaba la consigna, la API recibe exclusivamente `lado1` y `lado2` en los métodos `POST` y `PUT`. El perímetro y la superficie se computan estrictamente en el backend antes de realizar la sentencia SQL.
- **Validaciones**: Se implementó `express-validator` para validar los tipos de datos y asegurar que sean números estrictamente mayores a cero, respondiendo con códigos de estado HTTP claros (`400 Bad Request` ante datos erróneos y `404 Not Found` si un ID no existe).
- **Modularización**: Se separó la lógica de conexión (`db.js`) y las reglas de validación (`validators.js`) para mantener un código limpio y fácil de escalar.