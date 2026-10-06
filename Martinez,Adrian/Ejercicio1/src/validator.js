const { body, param, validationResult } = require('express-validator');

// Middleware para verificar si hubo errores de validación
const validarResultados = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errores: errors.array() });
  }
  next();
};

// Reglas para crear o actualizar un rectángulo (solo lado1 y lado2)
const validarRectangulo = [
  body('lado1')
    .exists().withMessage('El lado1 es obligatorio')
    .isNumeric().withMessage('El lado1 debe ser un valor numérico')
    .custom((value) => value > 0).withMessage('El lado1 debe ser mayor a cero'),
  body('lado2')
    .exists().withMessage('El lado2 es obligatorio')
    .isNumeric().withMessage('El lado2 debe ser un valor numérico')
    .custom((value) => value > 0).withMessage('El lado2 debe ser mayor a cero'),
  validarResultados
];

// Regla para validar el ID en parámetros (ej: /rectangulos/:id)
const validarId = [
  param('id')
    .isInt({ gt: 0 }).withMessage('El ID debe ser un número entero mayor a cero'),
  validarResultados
];

module.exports = {
  validarRectangulo,
  validarId
};