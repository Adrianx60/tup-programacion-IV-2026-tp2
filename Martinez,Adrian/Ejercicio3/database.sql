CREATE DATABASE IF NOT EXISTS calificaciones_db;
USE calificaciones_db;

-- Tabla independiente para las materias
CREATE TABLE IF NOT EXISTS materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de calificaciones con relación a materias y restricción de unicidad
CREATE TABLE IF NOT EXISTS calificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumno_nombre VARCHAR(150) NOT NULL,
    materia_id INT NOT NULL,
    nota1 DECIMAL(4,2) NOT NULL,
    nota2 DECIMAL(4,2) NOT NULL,
    nota3 DECIMAL(4,2) NOT NULL,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    CONSTRAINT uc_alumno_materia UNIQUE (alumno_nombre, materia_id)
);

-- Datos de prueba iniciales
INSERT INTO materias (nombre) VALUES 
('Gestión de Desarrollo de Software'), 
('Programación I'), 
('Base de Datos');