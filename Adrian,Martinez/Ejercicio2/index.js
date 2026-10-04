import express from 'express';
import mysql from 'mysql2/promise';
import { body, param, query, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

//Configuración de la conexión a MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '18@Septiembre',
    database: 'db_tareas',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//Middleware para verificar los resultados de express-validator
const validarResultados = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
    next();
};

//Validaciones para el cuerpo (body) en POST y PUT
const validarTareaBody = [
    body('nombre')
        .exists().withMessage('El campo nombre es obligatorio.')
        .isString().withMessage('El nombre debe ser una cadena de texto.')
        .trim()
        .notEmpty().withMessage('El nombre no puede estar vacío.'),
    body('completada')
        .exists().withMessage('El campo completada es obligatorio.')
        .isBoolean().withMessage('El campo completada debe ser un valor booleano (true o false).'),
    validarResultados
];

//Validaciones para parámetros de ruta (:id)
const validarIdParam = [
    param('id')
        .isInt({ gt: 0 }).withMessage('El parámetro id debe ser un número entero mayor que cero.'),
    validarResultados
];

//Validaciones para consultas de filtrado por estado (?completada=true/false)
const validarFiltroQuery = [
    query('completada')
        .optional()
        .isBoolean().withMessage('El filtro completada debe ser un valor booleano válido (true o false).'),
    validarResultados
];

//Obtener todas las tareas o filtrar por estado (?completada=true/false)
app.get('/tareas', validarFiltroQuery, async (req, res) => {
    const { completada } = req.query;
    try {
        let queryStr = 'SELECT * FROM tareas';
        let queryParams = [];

        if (completada !== undefined) {
            const esCompletada = completada === 'true' ? 1 : 0;
            queryStr += ' WHERE completada = ?';
            queryParams.push(esCompletada);
        }

        const [rows] = await pool.query(queryStr, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al listar las tareas.' });
    }
});

//Obtener una tarea por ID
app.get('/tareas/:id', validarIdParam, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM tareas WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada.' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al buscar la tarea.' });
    }
});

//Crear una tarea (con validación estricta de unicidad por nombre normalizado)
app.post('/tareas', validarTareaBody, async (req, res) => {
    let { nombre, completada } = req.body;
    nombre = nombre.trim(); // Aplicar criterio de normalización

    try {
        const [existentes] = await pool.query(
            'SELECT * FROM tareas WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))',
            [nombre]
        );

        if (existentes.length > 0) {
            return res.status(400).json({ error: 'Ya existe una tarea con el mismo nombre.' });
        }

        const [result] = await pool.query(
            'INSERT INTO tareas (nombre, completada) VALUES (?, ?)',
            [nombre, completada]
        );

        res.status(201).json({
            id: result.insertId,
            nombre,
            completada,
            mensaje: 'Tarea creada exitosamente.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al crear la tarea.' });
    }
});

app.put('/tareas/:id', validarIdParam, validarTareaBody, async (req, res) => {
    const { id } = req.params;
    let { nombre, completada } = req.body;
    nombre = nombre.trim();

    try {
        const [tareaActual] = await pool.query('SELECT * FROM tareas WHERE id = ?', [id]);
        if (tareaActual.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada para actualizar.' });
        }

        const [duplicados] = await pool.query(
            'SELECT * FROM tareas WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?)) AND id != ?',
            [nombre, id]
        );

        if (duplicados.length > 0) {
            return res.status(400).json({ error: 'Ya existe otra tarea con el mismo nombre.' });
        }

        await pool.query(
            'UPDATE tareas SET nombre = ?, completada = ? WHERE id = ?',
            [nombre, completada, id]
        );

        res.json({
            id: Number(id),
            nombre,
            completada,
            mensaje: 'Tarea actualizada exitosamente.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al actualizar la tarea.' });
    }
});

//Eliminar una tarea
app.delete('/tareas/:id', validarIdParam, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM tareas WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada para eliminar.' });
        }
        res.json({ mensaje: 'Tarea eliminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al eliminar la tarea.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de tareas corriendo en el puerto ${PORT}`);
});