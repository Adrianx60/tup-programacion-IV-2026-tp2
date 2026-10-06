import { body, param, validationResult } from 'express-validator';

const validarResultados = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

const escalaNota = { min: 1, max: 10 };

export const validarCrearCalificacion = [
  body('alumno')
    .exists().withMessage('El nombre del alumno es obligatorio')
    .isString().withMessage('El alumno debe ser una cadena de texto')
    .trim()
    .notEmpty().withMessage('El nombre del alumno no puede estar vacío'),
  body('materia_id')
    .exists().withMessage('El ID de la materia es obligatorio')
    .isInt({ gt: 0 }).withMessage('El ID de la materia debe ser un entero válido'),
  body('nota1')
    .exists().withMessage('La nota 1 es obligatoria')
    .isFloat(escalaNota).withMessage('La nota 1 debe ser un número entre 1 y 10'),
  body('nota2')
    .exists().withMessage('La nota 2 es obligatoria')
    .isFloat(escalaNota).withMessage('La nota 2 debe ser un número entre 1 y 10'),
  body('nota3')
    .exists().withMessage('La nota 3 es obligatoria')
    .isFloat(escalaNota).withMessage('La nota 3 debe ser un número entre 1 y 10'),
  validarResultados
];

export const validarActualizarCalificacion = [
  param('id').isInt({ gt: 0 }).withMessage('El ID debe ser un entero mayor a cero'),
  body('alumno')
    .optional()
    .isString().withMessage('El alumno debe ser una cadena de texto')
    .trim()
    .notEmpty().withMessage('El nombre del alumno no puede estar vacío'),
  body('materia_id')
    .optional()
    .isInt({ gt: 0 }).withMessage('El ID de la materia debe ser un entero válido'),
  body('nota1')
    .optional()
    .isFloat(escalaNota).withMessage('La nota 1 debe ser un número entre 1 y 10'),
  body('nota2')
    .optional()
    .isFloat(escalaNota).withMessage('La nota 2 debe ser un número entre 1 y 10'),
  body('nota3')
    .optional()
    .isFloat(escalaNota).withMessage('La nota 3 debe ser un número entre 1 y 10'),
  validarResultados
];

export const validarId = [
  param('id').isInt({ gt: 0 }).withMessage('El ID debe ser un entero mayor a cero'),
  validarResultados
];

export const validarCrearMateria = [
  body('nombre')
    .exists().withMessage('El nombre de la materia es obligatorio')
    .isString().withMessage('El nombre debe ser una cadena de texto')
    .trim()
    .notEmpty().withMessage('El nombre de la materia no puede estar vacío'),
  validarResultados
];