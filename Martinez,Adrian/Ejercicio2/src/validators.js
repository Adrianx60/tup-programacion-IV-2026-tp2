import pkg from 'express-validator';
const { body, param, query, validationResult } = pkg;

const validarResultados = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

export const validarCrearTarea = [
  body('nombre')
    .exists().withMessage('El nombre de la tarea es obligatorio')
    .isString().withMessage('El nombre debe ser una cadena de texto')
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío'),
  body('completada')
    .optional()
    .isBoolean().withMessage('El estado completada debe ser un valor booleano (true o false)'),
  validarResultados
];

export const validarActualizarTarea = [
  param('id').isInt({ gt: 0 }).withMessage('El ID debe ser un entero mayor a cero'),
  body('nombre')
    .optional()
    .isString().withMessage('El nombre debe ser una cadena de texto')
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío'),
  body('completada')
    .optional()
    .isBoolean().withMessage('El estado completada debe ser un valor booleano'),
  validarResultados
];

export const validarId = [
  param('id').isInt({ gt: 0 }).withMessage('El ID debe ser un entero mayor a cero'),
  validarResultados
];

export const validarFiltroEstado = [
  query('estado')
    .optional()
    .custom((value) => {
      return ['true', 'false', '1', '0'].includes(value);
    }).withMessage('El filtro de estado debe ser un valor válido (true/false)'),
  validarResultados
];