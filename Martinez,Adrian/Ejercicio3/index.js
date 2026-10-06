import express from 'express';
import dotenv from 'dotenv';
import pool from './src/db.js';
import { validarCalificacion, validarParametroId } from './src/validator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ==========================================
// RUTAS Y CONTROLADORES
// ==========================================

// 1. Obtener todas las materias
app.get('/api/materias', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM materias');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las materias.' });
    }
});

// 2. Obtener todas las calificaciones
app.get('/api/calificaciones', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.id, c.nombre_alumno, m.id AS materia_id, m.nombre AS materia, c.nota1, c.nota2, c.nota3 
            FROM calificaciones c
            JOIN materias m ON c.materia_id = m.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al obtener calificaciones.' });
    }
});

// 3. Crear una calificación (Aplica regla de unicidad y validaciones)
app.post('/api/calificaciones', validarCalificacion, async (req, res) => {
    try {
        const { nombre_alumno, materia_id, nota1, nota2, nota3 } = req.body;

        // Validar unicidad (evitar duplicados de alumno + materia)
        const [existing] = await pool.query(
            'SELECT id FROM calificaciones WHERE nombre_alumno = ? AND materia_id = ?',
            [nombre_alumno, materia_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Ya existe un registro de calificación para este alumno en esta materia.' });
        }

        const [result] = await pool.query(
            'INSERT INTO calificaciones (nombre_alumno, materia_id, nota1, nota2, nota3) VALUES (?, ?, ?, ?, ?)',
            [nombre_alumno, materia_id, nota1, nota2, nota3]
        );

        res.status(201).json({
            mensaje: 'Calificación creada exitosamente.',
            id: result.insertId,
            data: { nombre_alumno, materia_id, nota1, nota2, nota3 }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar la calificación.' });
    }
});

// 4. Modificar una calificación (Valida unicidad al actualizar)
app.put('/api/calificaciones/:id', validarParametroId, validarCalificacion, async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_alumno, materia_id, nota1, nota2, nota3 } = req.body;

        // Verificar existencia del registro
        const [current] = await pool.query('SELECT id FROM calificaciones WHERE id = ?', [id]);
        if (current.length === 0) {
            return res.status(404).json({ error: 'Registro de calificación no encontrado.' });
        }

        // Validar unicidad excluyendo el registro actual
        const [duplicate] = await pool.query(
            'SELECT id FROM calificaciones WHERE nombre_alumno = ? AND materia_id = ? AND id != ?',
            [nombre_alumno, materia_id, id]
        );

        if (duplicate.length > 0) {
            return res.status(409).json({ error: 'Ya existe otro registro con la misma combinación de alumno y materia.' });
        }

        await pool.query(
            'UPDATE calificaciones SET nombre_alumno = ?, materia_id = ?, nota1 = ?, nota2 = ?, nota3 = ? WHERE id = ?',
            [nombre_alumno, materia_id, nota1, nota2, nota3, id]
        );

        res.json({ mensaje: 'Calificación actualizada correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la calificación.' });
    }
});

// 5. Eliminar una calificación
app.delete('/api/calificaciones/:id', validarParametroId, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM calificaciones WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Calificación no encontrada.' });
        }

        res.json({ mensaje: 'Calificación eliminada correctamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la calificación.' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});