CREATE DATABASE IF NOT EXISTS db_calificaciones;
USE db_calificaciones;

-- Tabla independiente para las materias
CREATE TABLE IF NOT EXISTS materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- Tabla de calificaciones vinculando alumno y materia
CREATE TABLE IF NOT EXISTS calificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_alumno VARCHAR(100) NOT NULL,
    materia_id INT NOT NULL,
    nota1 DECIMAL(4,2) NOT NULL,
    nota2 DECIMAL(4,2) NOT NULL,
    nota3 DECIMAL(4,2) NOT NULL,
    CONSTRAINT fk_materia FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    CONSTRAINT uc_alumno_materia UNIQUE (nombre_alumno, materia_id)
);

-- Datos iniciales de prueba para materias
INSERT INTO materias (nombre) VALUES ('Matemática I'), ('Programación I'), ('Base de Datos') 
ON DUPLICATE KEY UPDATE nombre=nombre;