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
    database: 'db_calificaciones',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware para verificar errores de express-validator
const validarResultados = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errores: errors.array() });
    }
    next();
};

//Validaciones para Materia
const validarMateriaBody = [
    body('nombre')
        .exists().withMessage('El nombre de la materia es obligatorio.')
        .isString().withMessage('El nombre debe ser texto.')
        .trim()
        .notEmpty().withMessage('El nombre de la materia no puede estar vacío.'),
    validarResultados
];

//Validaciones para Calificaciones
const validarCalificacionBody = [
    body('alumno_nombre')
        .exists().withMessage('El nombre del alumno es obligatorio.')
        .isString().withMessage('El nombre del alumno debe ser texto.')
        .trim()
        .notEmpty().withMessage('El nombre del alumno no puede estar vacío.'),
    body('materia_id')
        .exists().withMessage('El ID de la materia es obligatorio.')
        .isInt({ gt: 0 }).withMessage('El ID de la materia debe ser un entero positivo.'),
    body('nota1')
        .exists().withMessage('La nota 1 es obligatoria.')
        .isNumeric().withMessage('La nota 1 debe ser numérica.')
        .isFloat({ min: 1, max: 10 }).withMessage('La nota 1 debe estar dentro de la escala válida (1 a 10).'),
    body('nota2')
        .exists().withMessage('La nota 2 es obligatoria.')
        .isNumeric().withMessage('La nota 2 debe ser numérica.')
        .isFloat({ min: 1, max: 10 }).withMessage('La nota 2 debe estar dentro de la escala válida (1 a 10).'),
    body('nota3')
        .exists().withMessage('La nota 3 es obligatoria.')
        .isNumeric().withMessage('La nota 3 debe ser numérica.')
        .isFloat({ min: 1, max: 10 }).withMessage('La nota 3 debe estar dentro de la escala válida (1 a 10).'),
    validarResultados
];

const validarIdParam = [
    param('id')
        .isInt({ gt: 0 }).withMessage('El parámetro id debe ser un número entero mayor que cero.'),
    validarResultados
];

const validarFiltroQuery = [
    query('materia_id')
        .optional()
        .isInt({ gt: 0 }).withMessage('El filtro materia_id debe ser un entero positivo.'),
    validarResultados
];

app.get('/materias', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM materias');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar las materias.' });
    }
});

app.post('/materias', validarMateriaBody, async (req, res) => {
    let { nombre } = req.body;
    nombre = nombre.trim();
    try {
        const [result] = await pool.query('INSERT INTO materias (nombre) VALUES (?)', [nombre]);
        res.status(201).json({ id: result.insertId, nombre, mensaje: 'Materia creada exitosamente.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Ya existe una materia registrada con ese nombre.' });
        }
        res.status(500).json({ error: 'Error al crear la materia.' });
    }
});

app.get('/calificaciones', validarFiltroQuery, async (req, res) => {
    const { materia_id } = req.query;
    try {
        let queryStr = 'SELECT c.*, m.nombre as materia_nombre FROM calificaciones c JOIN materias m ON c.materia_id = m.id';
        let queryParams = [];

        if (materia_id) {
            queryStr += ' WHERE c.materia_id = ?';
            queryParams.push(materia_id);
        }

        const [rows] = await pool.query(queryStr, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar las calificaciones.' });
    }
});

app.get('/calificaciones/:id', validarIdParam, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT c.*, m.nombre as materia_nombre FROM calificaciones c JOIN materias m ON c.materia_id = m.id WHERE c.id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Registro de calificaciones no encontrado.' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar el registro.' });
    }
});

app.post('/calificaciones', validarCalificacionBody, async (req, res) => {
    let { alumno_nombre, materia_id, nota1, nota2, nota3 } = req.body;
    alumno_nombre = alumno_nombre.trim();

    try {
        // 1. Verificar que la materia exista en la tabla independiente
        const [materiaCheck] = await pool.query('SELECT * FROM materias WHERE id = ?', [materia_id]);
        if (materiaCheck.length === 0) {
            return res.status(404).json({ error: 'La materia informada no existe en el sistema.' });
        }

        //Validar regla de unicidad (Combinación única de alumno y materia)
        const [duplicados] = await pool.query(
            'SELECT * FROM calificaciones WHERE LOWER(TRIM(alumno_nombre)) = LOWER(TRIM(?)) AND materia_id = ?',
            [alumno_nombre, materia_id]
        );
        if (duplicados.length > 0) {
            return res.status(400).json({ error: 'Ya existe un registro de calificaciones para este alumno en la materia especificada.' });
        }

        //Cálculo de promedio en el servidor
        const promedio = (Number(nota1) + Number(nota2) + Number(nota3)) / 3;

        const [result] = await pool.query(
            'INSERT INTO calificaciones (alumno_nombre, materia_id, nota1, nota2, nota3, promedio) VALUES (?, ?, ?, ?, ?, ?)',
            [alumno_nombre, materia_id, nota1, nota2, nota3, promedio]
        );

        res.status(201).json({
            id: result.insertId,
            alumno_nombre,
            materia_id,
            nota1,
            nota2,
            nota3,
            promedio: Number(promedio.toFixed(2)),
            mensaje: 'Calificaciones registradas exitosamente.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrar las calificaciones.' });
    }
});

app.put('/calificaciones/:id', validarIdParam, validarCalificacionBody, async (req, res) => {
    const { id } = req.params;
    let { alumno_nombre, materia_id, nota1, nota2, nota3 } = req.body;
    alumno_nombre = alumno_nombre.trim();

    try {
        const [regActual] = await pool.query('SELECT * FROM calificaciones WHERE id = ?', [id]);
        if (regActual.length === 0) {
            return res.status(404).json({ error: 'Registro de calificaciones no encontrado para actualizar.' });
        }

        const [materiaCheck] = await pool.query('SELECT * FROM materias WHERE id = ?', [materia_id]);
        if (materiaCheck.length === 0) {
            return res.status(404).json({ error: 'La materia informada no existe.' });
        }

        //Validar unicidad excluyendo el ID actual
        const [duplicados] = await pool.query(
            'SELECT * FROM calificaciones WHERE LOWER(TRIM(alumno_nombre)) = LOWER(TRIM(?)) AND materia_id = ? AND id != ?',
            [alumno_nombre, materia_id, id]
        );
        if (duplicados.length > 0) {
            return res.status(400).json({ error: 'Ya existe otro registro para este alumno en la misma materia.' });
        }

        const promedio = (Number(nota1) + Number(nota2) + Number(nota3)) / 3;

        await pool.query(
            'UPDATE calificaciones SET alumno_nombre = ?, materia_id = ?, nota1 = ?, nota2 = ?, nota3 = ?, promedio = ? WHERE id = ?',
            [alumno_nombre, materia_id, nota1, nota2, nota3, promedio, id]
        );

        res.json({
            id: Number(id),
            alumno_nombre,
            materia_id,
            nota1,
            nota2,
            nota3,
            promedio: Number(promedio.toFixed(2)),
            mensaje: 'Calificaciones actualizadas exitosamente.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar las calificaciones.' });
    }
});

app.delete('/calificaciones/:id', validarIdParam, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM calificaciones WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Registro no encontrado para eliminar.' });
        }
        res.json({ mensaje: 'Calificación eliminada exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el registro.' });
    }
});

//Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de calificaciones corriendo en el puerto ${PORT}`);
});