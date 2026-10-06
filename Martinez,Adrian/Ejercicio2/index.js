import express from 'express';
import pool from './src/db.js';
import { validarCrearTarea, validarActualizarTarea, validarId, validarFiltroEstado } from './src/validators.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

//OBTENER TODAS LAS TAREAS O FILTRAR POR ESTADO (GET /tareas)
app.get('/tareas', validarFiltroEstado, async (req, res) => {
  const { estado } = req.query;
  try {
    let queryStr = 'SELECT * FROM tareas';
    let queryParams = [];

    if (estado !== undefined) {
      const esCompletada = estado === 'true' || estado === '1' ? 1 : 0;
      queryStr += ' WHERE completada = ?';
      queryParams.push(esCompletada);
    }

    const [rows] = await pool.query(queryStr, queryParams);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las tareas', detalle: error.message });
  }
});

// OBTENER UNA TAREA POR ID (GET /tareas/:id)
app.get('/tareas/:id', validarId, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM tareas WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la tarea', detalle: error.message });
  }
});

//CREAR UNA TAREA (POST /tareas)
app.post('/tareas', validarCrearTarea, async (req, res) => {
  const { nombre, completada = false } = req.body;
  const nombreLimpio = nombre.trim();

  try {
    const [resultado] = await pool.query(
      'INSERT INTO tareas (nombre, completada) VALUES (?, ?)',
      [nombreLimpio, completada]
    );

    res.status(201).json({
      mensaje: 'Tarea creada exitosamente',
      id: resultado.insertId,
      nombre: nombreLimpio,
      completada
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una tarea con ese mismo nombre' });
    }
    res.status(500).json({ error: 'Error al crear la tarea', detalle: error.message });
  }
});

//ACTUALIZAR UNA TAREA (PUT /tareas/:id)
app.put('/tareas/:id', validarActualizarTarea, async (req, res) => {
  const { id } = req.params;
  const { nombre, completada } = req.body;

  try {
    const [existente] = await pool.query('SELECT * FROM tareas WHERE id = ?', [id]);
    if (existente.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const tareaActual = existente[0];
    const nuevoNombre = nombre !== undefined ? nombre.trim() : tareaActual.nombre;
    const nuevoEstado = completada !== undefined ? completada : tareaActual.completada;

    await pool.query(
      'UPDATE tareas SET nombre = ?, completada = ? WHERE id = ?',
      [nuevoNombre, nuevoEstado, id]
    );

    res.json({
      mensaje: 'Tarea actualizada exitosamente',
      id: Number(id),
      nombre: nuevoNombre,
      completada: nuevoEstado
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe otra tarea con ese mismo nombre' });
    }
    res.status(500).json({ error: 'Error al actualizar la tarea', detalle: error.message });
  }
});

//ELIMINAR UNA TAREA (DELETE /tareas/:id)
app.delete('/tareas/:id', validarId, async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await pool.query('DELETE FROM tareas WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    res.json({ mensaje: 'Tarea eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea', detalle: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Tareas corriendo en http://localhost:${PORT}`);
});