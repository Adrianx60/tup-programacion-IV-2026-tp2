import express from 'express';
import mysql from 'mysql2/promise';
import { body, param, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

//Configuración de la conexión a MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '18@Septiembre',
    database: 'db_rectangulos',
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

//Validaciones para el cuerpo (body) de las solicitudes POST y PUT
const validarRectanguloBody = [
    body('lado1')
        .exists().withMessage('El campo lado1 es obligatorio.')
        .isNumeric().withMessage('El campo lado1 debe ser un valor numérico.')
        .isFloat({ gt: 0 }).withMessage('El campo lado1 debe ser mayor que cero.'),
    body('lado2')
        .exists().withMessage('El campo lado2 es obligatorio.')
        .isNumeric().withMessage('El campo lado2 debe ser un valor numérico.')
        .isFloat({ gt: 0 }).withMessage('El campo lado2 debe ser mayor que cero.'),
    validarResultados
];

//Validaciones para los parámetros de ruta (:id)
const validarIdParam = [
    param('id')
        .isInt({ gt: 0 }).withMessage('El parámetro id debe ser un número entero mayor que cero.'),
    validarResultados
];

//Obtener todos los rectángulos
app.get('/rectangulos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rectangulos');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al listar rectángulos.' });
    }
});

//Obtener un rectángulo por ID
app.get('/rectangulos/:id', validarIdParam, async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM rectangulos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Rectángulo no encontrado.' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al buscar el rectángulo.' });
    }
});

//Crear un rectángulo
app.post('/rectangulos', validarRectanguloBody, async (req, res) => {
    const { lado1, lado2 } = req.body;

    // Cálculo en el servidor (requisito obligatorio)
    const perimetro = 2 * (Number(lado1) + Number(lado2));
    const superficie = Number(lado1) * Number(lado2);

    try {
        const [result] = await pool.query(
            'INSERT INTO rectangulos (lado1, lado2, perimetro, superficie) VALUES (?, ?, ?, ?)',
            [lado1, lado2, perimetro, superficie]
        );
        res.status(201).json({
            id: result.insertId,
            lado1,
            lado2,
            perimetro,
            superficie,
            mensaje: 'Rectángulo creado exitosamente.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al crear el rectángulo.' });
    }
});

//Modificar un rectángulo existente
app.put('/rectangulos/:id', validarIdParam, validarRectanguloBody, async (req, res) => {
    const { id } = req.params;
    const { lado1, lado2 } = req.body;

    //Recálculo en el servidor
    const perimetro = 2 * (Number(lado1) + Number(lado2));
    const superficie = Number(lado1) * Number(lado2);

    try {
        const [result] = await pool.query(
            'UPDATE rectangulos SET lado1 = ?, lado2 = ?, perimetro = ?, superficie = ? WHERE id = ?',
            [lado1, lado2, perimetro, superficie, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Rectángulo no encontrado para actualizar.' });
        }

        res.json({
            id,
            lado1,
            lado2,
            perimetro,
            superficie,
            mensaje: 'Rectángulo actualizado exitosamente.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al actualizar el rectángulo.' });
    }
});

//Eliminar un rectángulo
app.delete('/rectangulos/:id', validarIdParam, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM rectangulos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Rectángulo no encontrado para eliminar.' });
        }
        res.json({ mensaje: 'Rectángulo eliminado exitosamente.' });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor al eliminar el rectángulo.' });
    }
});

//Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});