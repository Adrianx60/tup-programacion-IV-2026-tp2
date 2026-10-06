import { body, param, validationResult } from 'express-validator';
import pool from './db.js'; // <- Como están en la misma carpeta src

const validarResultados = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
    next();
};

export const validarCalificacion = [
    body('nombre_alumno')
        .exists().withMessage('El nombre del alumno es obligatorio.')
        .isString().withMessage('El nombre debe ser una cadena de texto.')
        .trim()
        .notEmpty().withMessage('El nombre del alumno no puede estar vacío.')
        .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.'),
    
    body('materia_id')
        .exists().withMessage('El ID de la materia es obligatorio.')
        .isInt({ gt: 0 }).withMessage('El ID de la materia debe ser un entero positivo.')
        .custom(async (materia_id) => {
            const [rows] = await pool.query('SELECT id FROM materias WHERE id = ?', [materia_id]);
            if (rows.length === 0) {
                throw new Error('La materia especificada no existe en la base de datos.');
            }
        }),

    body(['nota1', 'nota2', 'nota3'])
        .exists().withMessage('Se deben informar exactamente tres notas.')
        .isFloat({ min: 1.0, max: 10.0 }).withMessage('Cada nota debe ser un número dentro de la escala válida (1.00 a 10.00).'),

    validarResultados
];

export const validarParametroId = [
    param('id').isInt({ gt: 0 }).withMessage('El ID proporcionado debe ser un número entero válido.'),
    validarResultados
];