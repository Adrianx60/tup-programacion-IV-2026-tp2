import 'dotenv/config';
import express from 'express';
import pool from './src/db.js';
import { 
  validarCrearCalificacion, 
  validarActualizarCalificacion, 
  validarId, 
  validarCrearMateria 
} from './src/validators.js';

const app = express();
app.use(express.json());

// GESTIÓN DE MATERIAS

app.get('/materias', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM materias');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las materias', detalle: error.message });
  }
});

app.post('/materias', validarCrearMateria, async (req, res) => {
  const { nombre } = req.body;
  const nombreLimpio = nombre.trim();
  try {
    const [resultado] = await pool.query('INSERT INTO materias (nombre) VALUES (?)', [nombreLimpio]);
    res.status(201).json({
      mensaje: 'Materia creada exitosamente',
      id: resultado.insertId,
      nombre: nombreLimpio
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una materia con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear la materia', detalle: error.message });
  }
});

// GESTIÓN DE CALIFICACIONES

app.get('/calificaciones', async (req, res) => {
  const { materia_id, alumno } = req.query;
  try {
    let queryStr = `
      SELECT c.id, c.alumno_nombre AS alumno, m.id AS materia_id, m.nombre AS materia, c.nota1, c.nota2, c.nota3 
      FROM calificaciones c 
      JOIN materias m ON c.materia_id = m.id
    `;
    let queryParams = [];
    let conditions = [];

    if (materia_id) {
      conditions.push('c.materia_id = ?');
      queryParams.push(materia_id);
    }
    if (alumno) {
      conditions.push('c.alumno_nombre LIKE ?');
      queryParams.push(`%${alumno}%`);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    const [rows] = await pool.query(queryStr, queryParams);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las calificaciones', detalle: error.message });
  }
});

app.get('/calificaciones/:id', validarId, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.alumno_nombre AS alumno, m.id AS materia_id, m.nombre AS materia, c.nota1, c.nota2, c.nota3 
      FROM calificaciones c 
      JOIN materias m ON c.materia_id = m.id 
      WHERE c.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la calificación', detalle: error.message });
  }
});

app.post('/calificaciones', validarCrearCalificacion, async (req, res) => {
  const { alumno, materia_id, nota1, nota2, nota3 } = req.body;
  const alumnoLimpio = alumno.trim();

  try {
    const [materiaCheck] = await pool.query('SELECT * FROM materias WHERE id = ?', [materia_id]);
    if (materiaCheck.length === 0) {
      return res.status(400).json({ error: 'La materia especificada no existe' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO calificaciones (alumno_nombre, materia_id, nota1, nota2, nota3) VALUES (?, ?, ?, ?, ?)',
      [alumnoLimpio, materia_id, nota1, nota2, nota3]
    );

    res.status(201).json({
      mensaje: 'Calificación registrada exitosamente',
      id: resultado.insertId,
      alumno: alumnoLimpio,
      materia_id,
      nota1,
      nota2,
      nota3
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un registro de notas para este alumno en esta misma materia' });
    }
    res.status(500).json({ error: 'Error al registrar la calificación', detalle: error.message });
  }
});

app.put('/calificaciones/:id', validarActualizarCalificacion, async (req, res) => {
  const { id } = req.params;
  const { alumno, materia_id, nota1, nota2, nota3 } = req.body;

  try {
    const [existente] = await pool.query('SELECT * FROM calificaciones WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }

    const actual = existente[0];
    const nuevoAlumno = alumno !== undefined ? alumno.trim() : actual.alumno_nombre;
    const nuevaMateriaId = materia_id !== undefined ? materia_id : actual.materia_id;
    const nuevaNota1 = nota1 !== undefined ? nota1 : actual.nota1;
    const nuevaNota2 = nota2 !== undefined ? nota2 : actual.nota2;
    const nuevaNota3 = nota3 !== undefined ? nota3 : actual.nota3;

    if (materia_id !== undefined) {
      const [materiaCheck] = await pool.query('SELECT * FROM materias WHERE id = ?', [materia_id]);
      if (materiaCheck.length === 0) {
        return res.status(400).json({ error: 'La materia especificada no existe' });
      }
    }

    await pool.query(
      'UPDATE calificaciones SET alumno_nombre = ?, materia_id = ?, nota1 = ?, nota2 = ?, nota3 = ? WHERE id = ?',
      [nuevoAlumno, nuevaMateriaId, nuevaNota1, nuevaNota2, nuevaNota3, id]
    );

    res.json({
      mensaje: 'Calificación actualizada exitosamente',
      id: Number(id),
      alumno: nuevoAlumno,
      materia_id: nuevaMateriaId,
      nota1: nuevaNota1,
      nota2: nuevaNota2,
      nota3: nuevaNota3
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe otro registro para este alumno en la misma materia' });
    }
    res.status(500).json({ error: 'Error al actualizar la calificación', detalle: error.message });
  }
});

app.delete('/calificaciones/:id', validarId, async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await pool.query('DELETE FROM calificaciones WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Calificación no encontrada' });
    }
    res.json({ mensaje: 'Calificación eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la calificación', detalle: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Calificaciones corriendo en http://localhost:${PORT}`);
});