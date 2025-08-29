const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Clave secreta para JWT (en producción debería estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Middleware para verificar token JWT
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verificar si el token existe en la base de datos y está activo
        const sessionQuery = `
            SELECT s.*, u.id, u.nombre, u.correo, u.fecha_registro 
            FROM sesiones s 
            JOIN usuarios u ON s.usuario_id = u.id 
            WHERE s.token = ? AND s.activa = TRUE AND s.fecha_expiracion > NOW()
        `;
        
        const sessions = await executeQuery(sessionQuery, [token]);
        
        if (sessions.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }

        // Agregar información del usuario a la request
        req.user = {
            id: sessions[0].id,
            nombre: sessions[0].nombre,
            correo: sessions[0].correo,
            fecha_registro: sessions[0].fecha_registro
        };
        
        req.token = token;
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

/**
 * Generar token JWT
 */
const generateToken = (userId) => {
    const payload = {
        userId: userId,
        iat: Math.floor(Date.now() / 1000)
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Guardar sesión en la base de datos
 */
const saveSession = async (userId, token) => {
    try {
        // Calcular fecha de expiración (24 horas)
        const expirationDate = new Date();
        expirationDate.setHours(expirationDate.getHours() + 24);
        
        // Generar ID único para la sesión
        const sessionId = require('crypto').randomBytes(16).toString('hex');
        
        const query = `
            INSERT INTO sesiones (id, usuario_id, token, fecha_expiracion) 
            VALUES (?, ?, ?, ?)
        `;
        
        await executeQuery(query, [sessionId, userId, token, expirationDate]);
        return sessionId;
    } catch (error) {
        console.error('Error al guardar sesión:', error);
        throw error;
    }
};

/**
 * Invalidar sesión
 */
const invalidateSession = async (token) => {
    try {
        const query = 'UPDATE sesiones SET activa = FALSE WHERE token = ?';
        await executeQuery(query, [token]);
    } catch (error) {
        console.error('Error al invalidar sesión:', error);
        throw error;
    }
};

/**
 * Limpiar sesiones expiradas
 */
const cleanExpiredSessions = async () => {
    try {
        const query = 'DELETE FROM sesiones WHERE fecha_expiracion < NOW() OR activa = FALSE';
        const result = await executeQuery(query);
        console.log(`Sesiones expiradas limpiadas: ${result.affectedRows}`);
    } catch (error) {
        console.error('Error al limpiar sesiones expiradas:', error);
    }
};

/**
 * Middleware opcional para autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const sessionQuery = `
                SELECT s.*, u.id, u.nombre, u.correo, u.fecha_registro 
                FROM sesiones s 
                JOIN usuarios u ON s.usuario_id = u.id 
                WHERE s.token = ? AND s.activa = TRUE AND s.fecha_expiracion > NOW()
            `;
            
            const sessions = await executeQuery(sessionQuery, [token]);
            
            if (sessions.length > 0) {
                req.user = {
                    id: sessions[0].id,
                    nombre: sessions[0].nombre,
                    correo: sessions[0].correo,
                    fecha_registro: sessions[0].fecha_registro
                };
                req.token = token;
            }
        }
        
        next();
    } catch (error) {
        // En caso de error, continuar sin autenticación
        next();
    }
};

// Limpiar sesiones expiradas cada hora
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

module.exports = {
    authenticateToken,
    generateToken,
    saveSession,
    invalidateSession,
    cleanExpiredSessions,
    optionalAuth,
    JWT_SECRET
};

