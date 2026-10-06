@base = http://localhost:3000

### ---------- ALUMNOS ----------
GET {{base}}/alumnos?q=an&page=1&limit=10

###
POST {{base}}/alumnos
Content-Type: application/json

{ "nombre": "María Fernández" }

### Inválido (nombre vacío) -> 400
POST {{base}}/alumnos
Content-Type: application/json

{ "nombre": "" }

###
PUT {{base}}/alumnos/1
Content-Type: application/json

{ "nombre": "Ana Pérez López" }

###
GET {{base}}/alumnos/1/calificaciones

### ---------- MATERIAS ----------
GET {{base}}/materias

###
POST {{base}}/materias
Content-Type: application/json

{ "nombre": "Sistemas Operativos" }

### Repetida -> 409
POST {{base}}/materias
Content-Type: application/json

{ "nombre": "Base de Datos" }

### ---------- CALIFICACIONES ----------
GET {{base}}/calificaciones?alumno_id=1

###
POST {{base}}/calificaciones
Content-Type: application/json

{ "alumno_id": 1, "materia_id": 1, "notas": [8, 7.5, 9] }

### Duplicado alumno+materia -> 409
POST {{base}}/calificaciones
Content-Type: application/json

{ "alumno_id": 1, "materia_id": 1, "notas": [6, 6, 6] }

### Solo 2 notas -> 400
POST {{base}}/calificaciones
Content-Type: application/json

{ "alumno_id": 1, "materia_id": 2, "notas": [8, 7] }

### Nota fuera de escala (0-10) -> 400
POST {{base}}/calificaciones
Content-Type: application/json

{ "alumno_id": 1, "materia_id": 2, "notas": [8, 11, 7] }

### Materia inexistente -> 404
POST {{base}}/calificaciones
Content-Type: application/json

{ "alumno_id": 1, "materia_id": 999, "notas": [8, 7, 7] }

###
PUT {{base}}/calificaciones/1
Content-Type: application/json

{ "alumno_id": 1, "materia_id": 1, "notas": [9, 9, 10] }

###
DELETE {{base}}/calificaciones/1
