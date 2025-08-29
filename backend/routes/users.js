const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar rol de administrador
function requireAdmin(req, res, next) {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: 'Acceso denegado. Se requieren permisos de administrador.'
        });
    }
}

const router = express.Router();

// Esquemas de validación
const updateUserSchema = Joi.object({
    nombre: Joi.string().min(2).max(100).optional(),
    correo: Joi.string().email().optional(),
    rol: Joi.string().valid('admin', 'usuario').optional()
});

const changePasswordSchema = Joi.object({
    contraseñaActual: Joi.string().required(),
    nuevaContraseña: Joi.string().min(6).required()
});

// GET /api/users - Obtener lista de usuarios (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const offset = (page - 1) * limit;
        
        let whereClause = '';
        let params = [];
        
        if (search) {
            whereClause = 'WHERE nombre LIKE ? OR correo LIKE ?';
            params = [`%${search}%`, `%${search}%`];
        }
        
        // Consulta principal
        const usersQuery = `
            SELECT id, nombre, correo, rol, fecha_registro, activo
            FROM usuarios 
            ${whereClause}
            ORDER BY fecha_registro DESC 
            LIMIT ? OFFSET ?
        `;
        
        const queryParams = [...params, limit, offset];
        const users = await executeQuery(usersQuery, queryParams);
        
        // Contar total
        const countQuery = `
            SELECT COUNT(*) as total FROM usuarios ${whereClause}
        `;
        
        const countResult = await executeQuery(countQuery, params);
        const total = countResult[0].total;
        
        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/users/:id - Obtener usuario específico
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const requestingUser = req.user;
        
        // Solo admin puede ver otros usuarios, usuarios normales solo pueden verse a sí mismos
        if (requestingUser.rol !== 'admin' && requestingUser.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para ver este usuario'
            });
        }
        
        const userQuery = `
            SELECT id, nombre, correo, rol, fecha_registro, activo
            FROM usuarios 
            WHERE id = ?
        `;
        
        const users = await executeQuery(userQuery, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: {
                user: users[0]
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const requestingUser = req.user;
        
        // Validar entrada
        const { error, value } = updateUserSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: error.details[0].message
            });
        }
        
        // Solo admin puede actualizar otros usuarios o cambiar roles
        if (requestingUser.rol !== 'admin') {
            if (requestingUser.id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permisos para actualizar este usuario'
                });
            }
            
            // Usuarios normales no pueden cambiar su rol
            if (value.rol) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permisos para cambiar el rol'
                });
            }
        }
        
        // Verificar que el usuario existe
        const existingUserQuery = 'SELECT id FROM usuarios WHERE id = ?';
        const existingUsers = await executeQuery(existingUserQuery, [userId]);
        
        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        // Si se está cambiando el correo, verificar que no esté en uso
        if (value.correo) {
            const emailCheckQuery = 'SELECT id FROM usuarios WHERE correo = ? AND id != ?';
            const emailCheck = await executeQuery(emailCheckQuery, [value.correo, userId]);
            
            if (emailCheck.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'El correo electrónico ya está en uso'
                });
            }
        }
        
        // Construir consulta de actualización
        const updateFields = [];
        const updateParams = [];
        
        if (value.nombre) {
            updateFields.push('nombre = ?');
            updateParams.push(value.nombre);
        }
        
        if (value.correo) {
            updateFields.push('correo = ?');
            updateParams.push(value.correo);
        }
        
        if (value.rol) {
            updateFields.push('rol = ?');
            updateParams.push(value.rol);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar'
            });
        }
        
        const updateQuery = `
            UPDATE usuarios 
            SET ${updateFields.join(', ')} 
            WHERE id = ?
        `;
        
        updateParams.push(userId);
        await executeQuery(updateQuery, updateParams);
        
        // Obtener usuario actualizado
        const updatedUserQuery = `
            SELECT id, nombre, correo, rol, fecha_registro, activo
            FROM usuarios 
            WHERE id = ?
        `;
        
        const updatedUsers = await executeQuery(updatedUserQuery, [userId]);
        
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: {
                user: updatedUsers[0]
            }
        });
        
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// PUT /api/users/:id/password - Cambiar contraseña
router.put('/:id/password', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const requestingUser = req.user;
        
        // Validar entrada
        const { error, value } = changePasswordSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de entrada inválidos',
                details: error.details[0].message
            });
        }
        
        // Solo admin puede cambiar contraseñas de otros usuarios
        if (requestingUser.rol !== 'admin' && requestingUser.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para cambiar la contraseña de este usuario'
            });
        }
        
        const { contraseñaActual, nuevaContraseña } = value;
        
        // Obtener usuario actual
        const userQuery = 'SELECT contraseña FROM usuarios WHERE id = ?';
        const users = await executeQuery(userQuery, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        // Verificar contraseña actual (solo si no es admin cambiando la de otro usuario)
        if (requestingUser.id === userId) {
            const validPassword = await bcrypt.compare(contraseñaActual, users[0].contraseña);
            
            if (!validPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Contraseña actual incorrecta'
                });
            }
        }
        
        // Hash de la nueva contraseña
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(nuevaContraseña, saltRounds);
        
        // Actualizar contraseña
        const updateQuery = 'UPDATE usuarios SET contraseña = ? WHERE id = ?';
        await executeQuery(updateQuery, [hashedPassword, userId]);
        
        // Invalidar todas las sesiones del usuario
        const invalidateSessionsQuery = 'UPDATE sesiones SET activa = FALSE WHERE usuario_id = ?';
        await executeQuery(invalidateSessionsQuery, [userId]);
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// DELETE /api/users/:id - Desactivar usuario (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const requestingUser = req.user;
        
        // No permitir que el admin se desactive a sí mismo
        if (requestingUser.id === userId) {
            return res.status(400).json({
                success: false,
                error: 'No puedes desactivar tu propia cuenta'
            });
        }
        
        // Verificar que el usuario existe
        const userQuery = 'SELECT id, nombre FROM usuarios WHERE id = ?';
        const users = await executeQuery(userQuery, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        // Desactivar usuario
        const deactivateQuery = 'UPDATE usuarios SET activo = FALSE WHERE id = ?';
        await executeQuery(deactivateQuery, [userId]);
        
        // Invalidar todas las sesiones del usuario
        const invalidateSessionsQuery = 'UPDATE sesiones SET activa = FALSE WHERE usuario_id = ?';
        await executeQuery(invalidateSessionsQuery, [userId]);
        
        res.json({
            success: true,
            message: `Usuario ${users[0].nombre} desactivado exitosamente`
        });
        
    } catch (error) {
        console.error('Error desactivando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// PUT /api/users/:id/activate - Reactivar usuario (solo admin)
router.put('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Verificar que el usuario existe
        const userQuery = 'SELECT id, nombre FROM usuarios WHERE id = ?';
        const users = await executeQuery(userQuery, [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
        
        // Reactivar usuario
        const activateQuery = 'UPDATE usuarios SET activo = TRUE WHERE id = ?';
        await executeQuery(activateQuery, [userId]);
        
        res.json({
            success: true,
            message: `Usuario ${users[0].nombre} reactivado exitosamente`
        });
        
    } catch (error) {
        console.error('Error reactivando usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

module.exports = router;

