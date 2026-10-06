# Diagrama de Entidad-Relación (DER) - Gestión de Calificaciones

A continuación se describe la estructura del modelo relacional implementado en la base de datos MySQL para la API de calificaciones.

## 1. Diagrama Conceptual / Estructural (Texto)

```text
+-----------------------+       1:N       +---------------------------+
|       MATERIAS        | <-------------- |      CALIFICACIONES       |
+-----------------------+                 +---------------------------+
| PK  id (INT)          |                 | PK  id (INT)              |
|     nombre (VARCHAR)  |                 |     nombre_alumno (VARCHAR)|
+-----------------------+                 | FK  materia_id (INT)      |
                                          |     nota1 (DECIMAL)       |
                                          |     nota2 (DECIMAL)       |
                                          |     nota3 (DECIMAL)       |
                                          +---------------------------+
                                          * Restricción Única (Unique):
                                            (nombre_alumno, materia_id)