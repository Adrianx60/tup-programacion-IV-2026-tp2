import express from 'express';
import pool, { verificarConexion } from './src/db.js';
import * as v from './src/validators.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ---------- Helpers ----------
const paginar = (req) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;
  return { page, limit, offset: (page - 1) * limit };
};

const SELECT_CALIF = `
  SELECT c.id, c.alumno_id, a.nombre AS alumno, c.materia_id, m.nombre AS materia,
         c.nota1, c.nota2, c.nota3
  FROM calificaciones c
  JOIN alumnos a ON a.id = c.alumno_id
  JOIN materias m ON m.id = c.materia_id`;

const formatear = (r) => ({
  id: r.id,
  alumno: { id: r.alumno_id, nombre: r.alumno },
  materia: { id: r.materia_id, nombre: r.materia },
  notas: [r.nota1, r.nota2, r.nota3],
  promedio: Number(((r.nota1 + r.nota2 + r.nota3) / 3).toFixed(2)),
});

const noEncontrado = (res, recurso, id) =>
  res.status(404).json({ error: `${recurso} con id ${id} no encontrado` });

// ================== ALUMNOS ==================
app.get('/alumnos', v.alumnosQuery, v.validar, async (req, res, next) => {
  try {
    const { page, limit, offset } = paginar(req);
    const like = `%${req.query.q || ''}%`;
    const [rows] = await pool.query(
      'SELECT id, nombre FROM alumnos WHERE nombre LIKE ? ORDER BY nombre LIMIT ? OFFSET ?',
      [like, limit, offset]
    );
    res.json({ page, limit, data: rows });
  } catch (e) { next(e); }
});

app.get('/alumnos/:id', v.idParam, v.validar, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre FROM alumnos WHERE id = ?', [req.params.id]);
    if (!rows.length) return noEncontrado(res, 'Alumno', req.params.id);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// Calificaciones de un alumno (sub-recurso)
app.get('/alumnos/:id/calificaciones', v.idParam, v.validar, async (req, res, next) => {
  try {
    const [al] = await pool.execute('SELECT id FROM alumnos WHERE id = ?', [req.params.id]);
    if (!al.length) return noEncontrado(res, 'Alumno', req.params.id);
    const [rows] = await pool.execute(`${SELECT_CALIF} WHERE c.alumno_id = ? ORDER BY m.nombre`, [req.params.id]);
    res.json(rows.map(formatear));
  } catch (e) { next(e); }
});

app.post('/alumnos', v.alumnoBody, v.validar, async (req, res, next) => {
  try {
    const [r] = await pool.execute('INSERT INTO alumnos (nombre) VALUES (?)', [req.body.nombre]);
    res.status(201).location(`/alumnos/${r.insertId}`).json({ id: r.insertId, nombre: req.body.nombre });
  } catch (e) { next(e); }
});

app.put('/alumnos/:id', v.idParam, v.alumnoBody, v.validar, async (req, res, next) => {
  try {
    const [r] = await pool.execute('UPDATE alumnos SET nombre = ? WHERE id = ?', [req.body.nombre, req.params.id]);
    if (!r.affectedRows) return noEncontrado(res, 'Alumno', req.params.id);
    res.json({ id: req.params.id, nombre: req.body.nombre });
  } catch (e) { next(e); }
});

app.delete('/alumnos/:id', v.idParam, v.validar, async (req, res, next) => {
  try {
    const [r] = await pool.execute('DELETE FROM alumnos WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return noEncontrado(res, 'Alumno', req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

// ================== MATERIAS ==================
app.get('/materias', v.materiasQuery, v.validar, async (req, res, next) => {
  try {
    const { page, limit, offset } = paginar(req);
    const like = `%${req.query.q || ''}%`;
    const [rows] = await pool.query(
      'SELECT id, nombre FROM materias WHERE nombre LIKE ? ORDER BY nombre LIMIT ? OFFSET ?',
      [like, limit, offset]
    );
    res.json({ page, limit, data: rows });
  } catch (e) { next(e); }
});

app.get('/materias/:id', v.idParam, v.validar, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, nombre FROM materias WHERE id = ?', [req.params.id]);
    if (!rows.length) return noEncontrado(res, 'Materia', req.params.id);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

app.post('/materias', v.materiaBody, v.validar, async (req, res, next) => {
  try {
    const [r] = await pool.execute('INSERT INTO materias (nombre) VALUES (?)', [req.body.nombre]);
    res.status(201).location(`/materias/${r.insertId}`).json({ id: r.insertId, nombre: req.body.nombre });
  } catch (e) { next(e); } // nombre repetido -> 409 en el manejador global
});

app.put('/materias/:id', v.idParam, v.materiaBody, v.validar, async (req, res, next) => {
  try {
    const [r] = await pool.execute('UPDATE materias SET nombre = ? WHERE id = ?', [req.body.nombre, req.params.id]);
    if (!r.affectedRows) return noEncontrado(res, 'Materia', req.params.id);
    res.json({ id: req.params.id, nombre: req.body.nombre });
  } catch (e) { next(e); }
});

app.delete('/materias/:id', v.idParam, v.validar, async (req, res, next) => {
  try {
    const [r] = await pool.execute('DELETE FROM materias WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return noEncontrado(res, 'Materia', req.params.id);
    res.status(204).end();
  } catch (e) { next(e); } // con calificaciones asociadas -> 409
});

// ================== CALIFICACIONES ==================
app.get('/calificaciones', v.calificacionesQuery, v.validar, async (req, res, next) => {
  try {
    const { page, limit, offset } = paginar(req);
    const filtros = [];
    const params = [];
    if (req.query.alumno_id) { filtros.push('c.alumno_id = ?'); params.push(req.query.alumno_id); }
    if (req.query.materia_id) { filtros.push('c.materia_id = ?'); params.push(req.query.materia_id); }
    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `${SELECT_CALIF} ${where} ORDER BY a.nombre, m.nombre LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    res.json({ page, limit, data: rows.map(formatear) });
  } catch (e) { next(e); }
});

app.get('/calificaciones/:id', v.idParam, v.validar, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`${SELECT_CALIF} WHERE c.id = ?`, [req.params.id]);
    if (!rows.length) return noEncontrado(res, 'Calificación', req.params.id);
    res.json(formatear(rows[0]));
  } catch (e) { next(e); }
});

app.post(
  '/calificaciones',
  v.calificacionBody, v.validar, v.existeAlumno, v.existeMateria, v.sinDuplicado,
  async (req, res, next) => {
    try {
      const { alumno_id, materia_id, notas } = req.body;
      const [r] = await pool.execute(
        'INSERT INTO calificaciones (alumno_id, materia_id, nota1, nota2, nota3) VALUES (?, ?, ?, ?, ?)',
        [alumno_id, materia_id, ...notas]
      );
      const [rows] = await pool.execute(`${SELECT_CALIF} WHERE c.id = ?`, [r.insertId]);
      res.status(201).location(`/calificaciones/${r.insertId}`).json(formatear(rows[0]));
    } catch (e) { next(e); }
  }
);

app.put(
  '/calificaciones/:id',
  v.idParam, v.calificacionBody, v.validar, v.existeAlumno, v.existeMateria, v.sinDuplicado,
  async (req, res, next) => {
    try {
      const { alumno_id, materia_id, notas } = req.body;
      const [r] = await pool.execute(
        'UPDATE calificaciones SET alumno_id = ?, materia_id = ?, nota1 = ?, nota2 = ?, nota3 = ? WHERE id = ?',
        [alumno_id, materia_id, ...notas, req.params.id]
      );
      if (!r.affectedRows) return noEncontrado(res, 'Calificación', req.params.id);
      const [rows] = await pool.execute(`${SELECT_CALIF} WHERE c.id = ?`, [req.params.id]);
      res.json(formatear(rows[0]));
    } catch (e) { next(e); }
  }
);

app.delete('/calificaciones/:id', v.idParam, v.validar, async (req, res, next) => {
  try {
    const [r] = await pool.execute('DELETE FROM calificaciones WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return noEncontrado(res, 'Calificación', req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

// ================== Manejo de errores ==================
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON malformado' });
  // Red de seguridad ante condiciones de carrera: la BD también garantiza la integridad
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Registro duplicado' });
  if (err.code === 'ER_ROW_IS_REFERENCED_2')
    return res.status(409).json({ error: 'No se puede eliminar: tiene calificaciones asociadas' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

await verificarConexion();
app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));