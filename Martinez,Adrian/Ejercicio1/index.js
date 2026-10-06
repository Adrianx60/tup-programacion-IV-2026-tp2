const express = require('express');
const pool = require('./src/db');
const { validarRectangulo, validarId } = require('./src/validator');
require('dotenv').config();

const app = express();
app.use(express.json());

//OBTENER TODOS LOS RECTÁNGULOS (GET)
app.get('/rectangulos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM rectangulos');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los rectángulos', detalle: error.message });
  }
});

//OBTENER UN RECTÁNGULO POR ID (GET)
app.get('/rectangulos/:id', validarId, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM rectangulos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Rectángulo no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el rectángulo', detalle: error.message });
  }
});

//CREAR UN RECTÁNGULO (POST)
// El cliente solo envía lado1 y lado2. El servidor calcula perímetro y superficie.
app.post('/rectangulos', validarRectangulo, async (req, res) => {
  const { lado1, lado2 } = req.body;

  // Cálculo en el servidor
  const perimetro = 2 * (Number(lado1) + Number(lado2));
  const superficie = Number(lado1) * Number(lado2);

  try {
    const [resultado] = await pool.query(
      'INSERT INTO rectangulos (lado1, lado2, perimetro, superficie) VALUES (?, ?, ?, ?)',
      [lado1, lado2, perimetro, superficie]
    );

    res.status(201).json({
      mensaje: 'Rectángulo creado exitosamente',
      id: resultado.insertId,
      lado1,
      lado2,
      perimetro,
      superficie
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el rectángulo', detalle: error.message });
  }
});

//ACTUALIZAR UN RECTÁNGULO (PUT)
app.put('/rectangulos/:id', validarId, validarRectangulo, async (req, res) => {
  const { id } = req.params;
  const { lado1, lado2 } = req.body;

  // Recalcular en el servidor
  const perimetro = 2 * (Number(lado1) + Number(lado2));
  const superficie = Number(lado1) * Number(lado2);

  try {
    const [resultado] = await pool.query(
      'UPDATE rectangulos SET lado1 = ?, lado2 = ?, perimetro = ?, superficie = ? WHERE id = ?',
      [lado1, lado2, perimetro, superficie, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Rectángulo no encontrado' });
    }

    res.json({
      mensaje: 'Rectángulo actualizado exitosamente',
      id,
      lado1,
      lado2,
      perimetro,
      superficie
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el rectángulo', detalle: error.message });
  }
});

//ELIMINAR UN RECTÁNGULO (DELETE)
app.delete('/rectangulos/:id', validarId, async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await pool.query('DELETE FROM rectangulos WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Rectángulo no encontrado' });
    }

    res.json({ mensaje: 'Rectángulo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el rectángulo', detalle: error.message });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});