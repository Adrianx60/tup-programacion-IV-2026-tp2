import { body, param, query, validationResult } from 'express-validator';
import pool from './db.js';

// Escala de notas documentada: 0 a 10, hasta 2 decimales
export const NOTA_MIN = 0;
export const NOTA_MAX = 10;

// ---------- Middleware que corta si hay errores de formato (400) ----------
export const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      error: 'Datos inválidos',
      detalles: errores.array().map((e) => ({
        campo: e.path,
        ubicacion: e.location,
        mensaje: e.msg,
      })),
    });
  }
  next();
};

// ---------- Reglas reutilizables ----------
export const idParam = param('id').isInt({ min: 1 }).withMessage('El id debe ser un entero positivo').toInt();

const nombreRule = (campo, etiqueta) =>
  body(campo)
    .exists({ values: 'falsy' }).withMessage(`${etiqueta} es obligatorio`).bail()
    .isString().withMessage(`${etiqueta} debe ser texto`).bail()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage(`${etiqueta} debe tener entre 2 y 100 caracteres`)
    .matches(/^[\p{L}\p{N}][\p{L}\p{N}\s.'-]*$/u)
    .withMessage(`${etiqueta} contiene caracteres no válidos`);

const paginacion = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser entero >= 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100').toInt(),
];

// ---------- Alumnos ----------
export const alumnoBody = [nombreRule('nombre', 'El nombre del alumno')];
export const alumnosQuery = [
  query('q').optional().isString().trim().isLength({ max: 100 }).withMessage('q admite hasta 100 caracteres'),
  ...paginacion,
];

// ---------- Materias ----------
export const materiaBody = [nombreRule('nombre', 'El nombre de la materia')];
export const materiasQuery = [
  query('q').optional().isString().trim().isLength({ max: 100 }).withMessage('q admite hasta 100 caracteres'),
  ...paginacion,
];

// ---------- Calificaciones ----------
export const calificacionBody = [
  body('alumno_id').isInt({ min: 1 }).withMessage('alumno_id debe ser un entero positivo').toInt(),
  body('materia_id').isInt({ min: 1 }).withMessage('materia_id debe ser un entero positivo').toInt(),
  body('notas')
    .isArray({ min: 3, max: 3 })
    .withMessage('Se deben informar exactamente 3 notas'),
  body('notas.*')
    .custom((n) => typeof n === 'number' && Number.isFinite(n))
    .withMessage('Cada nota debe ser un número')
    .bail()
    .custom((n) => n >= NOTA_MIN && n <= NOTA_MAX)
    .withMessage(`Cada nota debe estar entre ${NOTA_MIN} y ${NOTA_MAX}`)
    .bail()
    .custom((n) => Math.round(n * 100) / 100 === n)
    .withMessage('Cada nota admite hasta 2 decimales'),
];

export const calificacionesQuery = [
  query('alumno_id').optional().isInt({ min: 1 }).withMessage('alumno_id inválido').toInt(),
  query('materia_id').optional().isInt({ min: 1 }).withMessage('materia_id inválido').toInt(),
  ...paginacion,
];

// ---------- Reglas de negocio contra la BD (404 / 409) ----------
export const existeAlumno = async (req, res, next) => {
  try {
    const [r] = await pool.execute('SELECT id FROM alumnos WHERE id = ?', [req.body.alumno_id]);
    if (r.length === 0) return res.status(404).json({ error: `No existe el alumno con id ${req.body.alumno_id}` });
    next();
  } catch (e) { next(e); }
};

export const existeMateria = async (req, res, next) => {
  try {
    const [r] = await pool.execute('SELECT id FROM materias WHERE id = ?', [req.body.materia_id]);
    if (r.length === 0) return res.status(404).json({ error: `No existe la materia con id ${req.body.materia_id}` });
    next();
  } catch (e) { next(e); }
};

// Unicidad (alumno, materia). En PUT se excluye el propio registro.
export const sinDuplicado = async (req, res, next) => {
  try {
    const excluir = req.params.id || 0;
    const [r] = await pool.execute(
      'SELECT id FROM calificaciones WHERE alumno_id = ? AND materia_id = ? AND id <> ?',
      [req.body.alumno_id, req.body.materia_id, excluir]
    );
    if (r.length > 0) {
      return res.status(409).json({ error: 'Ya existe una calificación para ese alumno en esa materia', id_existente: r[0].id });
    }
    next();
  } catch (e) { next(e); }
};