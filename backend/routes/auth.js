const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Esquemas de validación
const loginSchema = Joi.object({
    correo: Joi.string().email().required(),
    contraseña: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
    nombre: Joi.string().min(2).max(100).required(),
    correo: Joi.string().email().required(),
    contraseña: Joi.string().min(6).required(),
    rol: Joi.string().valid('admin', 'usuario').default('usuario')
});

// Función para generar tokens JWT
function generateTokens(user) {
    const payload = {
        id: user.id,
        correo: user.correo,
        nombre: user.nombre,
        rol: user.rol
    };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
    
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
    
    return { accessToken, refreshToken };
}

// Función para registrar intento de login
async function logLoginAttempt(correo, exitoso, ip, userAgent, mensaje, usuarioId = null) {
    try {
        const query = `
            INSERT INTO login_logs (usuario_id, correo, exitoso, ip_address, user_agent, mensaje)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await executeQuery(query, [usuarioId, correo, exitoso, ip, userAgent, mensaje]);
    } catch (error) {
        console.error('Error registrando intento de login:', error);
    }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        // Validar entrada
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: error.details[0].message
            });
        }
        
        const { correo, contraseña } = value;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || '';
        
        // Buscar usuario
        const userQuery = 'SELECT * FROM usuarios WHERE correo = ? AND activo = TRUE';
        const users = await executeQuery(userQuery, [correo]);
        
        if (users.length === 0) {
            await logLoginAttempt(correo, false, ip, userAgent, 'Usuario no encontrado');
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        
        const user = users[0];
        
        // Verificar contraseña
        const validPassword = await bcrypt.compare(contraseña, user.contraseña);
        
        if (!validPassword) {
            await logLoginAttempt(correo, false, ip, userAgent, 'Contraseña incorrecta', user.id);
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }
        
        // Generar tokens
        const { accessToken, refreshToken } = generateTokens(user);
        
        // Guardar sesión en la base de datos
        const sessionId = jwt.sign({ userId: user.id, timestamp: Date.now() }, process.env.JWT_SECRET);
        const expirationDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        
        const sessionQuery = `
            INSERT INTO sesiones (id, usuario_id, token, refresh_token, fecha_expiracion, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await executeQuery(sessionQuery, [
            sessionId, user.id, accessToken, refreshToken, expirationDate, ip, userAgent
        ]);
        
        // Registrar login exitoso
        await logLoginAttempt(correo, true, ip, userAgent, 'Login exitoso', user.id);
        
        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    correo: user.correo,
                    rol: user.rol
                },
                token: accessToken,
                refreshToken: refreshToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        // Validar entrada
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: error.details[0].message
            });
        }
        
        const { nombre, correo, contraseña, rol } = value;
        
        // Verificar si el usuario ya existe
        const existingUserQuery = 'SELECT id FROM usuarios WHERE correo = ?';
        const existingUsers = await executeQuery(existingUserQuery, [correo]);
        
        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'El correo electrónico ya está registrado'
            });
        }
        
        // Hash de la contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
        
        // Insertar nuevo usuario
        const insertQuery = `
            INSERT INTO usuarios (nombre, correo, contraseña, rol)
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await executeQuery(insertQuery, [nombre, correo, hashedPassword, rol]);
        
        // Obtener el usuario creado
        const newUser = {
            id: result.insertId,
            nombre,
            correo,
            rol
        };
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: newUser
            }
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token requerido'
            });
        }
        
        // Verificar refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Buscar sesión activa
        const sessionQuery = `
            SELECT s.*, u.nombre, u.correo, u.rol 
            FROM sesiones s 
            JOIN usuarios u ON s.usuario_id = u.id 
            WHERE s.refresh_token = ? AND s.activa = TRUE AND s.fecha_expiracion > NOW()
        `;
        
        const sessions = await executeQuery(sessionQuery, [refreshToken]);
        
        if (sessions.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token inválido o expirado'
            });
        }
        
        const session = sessions[0];
        const user = {
            id: session.usuario_id,
            nombre: session.nombre,
            correo: session.correo,
            rol: session.rol
        };
        
        // Generar nuevos tokens
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
        
        // Actualizar sesión
        const updateQuery = `
            UPDATE sesiones 
            SET token = ?, refresh_token = ?, fecha_expiracion = DATE_ADD(NOW(), INTERVAL 1 HOUR)
            WHERE id = ?
        `;
        
        await executeQuery(updateQuery, [accessToken, newRefreshToken, session.id]);
        
        res.json({
            success: true,
            message: 'Token renovado exitosamente',
            data: {
                token: accessToken,
                refreshToken: newRefreshToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '1h'
            }
        });
        
    } catch (error) {
        console.error('Error renovando token:', error);
        res.status(401).json({
            success: false,
            error: 'Token inválido'
        });
    }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const token = req.token;
        
        // Desactivar sesión
        const updateQuery = 'UPDATE sesiones SET activa = FALSE WHERE token = ?';
        await executeQuery(updateQuery, [token]);
        
        res.json({
            success: true,
            message: 'Logout exitoso'
        });
        
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = req.user;
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    correo: user.correo,
                    rol: user.rol
                }
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;

