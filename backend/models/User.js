const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/database');

class User {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.correo = data.correo;
        this.contraseña = data.contraseña;
        this.fecha_registro = data.fecha_registro;
    }

    // Crear nuevo usuario
    static async create(userData) {
        try {
            const { nombre, correo, contraseña } = userData;
            
            // Verificar si el correo ya existe
            const existingUser = await User.findByEmail(correo);
            if (existingUser) {
                throw new Error('El correo ya está registrado');
            }

            // Hash de la contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(contraseña, saltRounds);

            // Insertar usuario en la base de datos
            const query = `
                INSERT INTO usuarios (nombre, correo, contraseña) 
                VALUES (?, ?, ?)
            `;
            const result = await executeQuery(query, [nombre, correo, hashedPassword]);

            // Obtener el usuario creado
            const newUser = await User.findById(result.insertId);
            return newUser;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    }

    // Buscar usuario por ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM usuarios WHERE id = ?';
            const results = await executeQuery(query, [id]);
            
            if (results.length === 0) {
                return null;
            }

            return new User(results[0]);
        } catch (error) {
            console.error('Error al buscar usuario por ID:', error);
            throw error;
        }
    }

    // Buscar usuario por email
    static async findByEmail(correo) {
        try {
            const query = 'SELECT * FROM usuarios WHERE correo = ?';
            const results = await executeQuery(query, [correo]);
            
            if (results.length === 0) {
                return null;
            }

            return new User(results[0]);
        } catch (error) {
            console.error('Error al buscar usuario por email:', error);
            throw error;
        }
    }

    // Verificar contraseña
    async verifyPassword(contraseña) {
        try {
            return await bcrypt.compare(contraseña, this.contraseña);
        } catch (error) {
            console.error('Error al verificar contraseña:', error);
            return false;
        }
    }

    // Actualizar último acceso
    async updateLastAccess() {
        try {
            const query = `
                UPDATE usuarios 
                SET ultimo_acceso = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            await executeQuery(query, [this.id]);
        } catch (error) {
            console.error('Error al actualizar último acceso:', error);
        }
    }

    // Obtener todos los usuarios (para administración)
    static async getAll() {
        try {
            const query = `
                SELECT id, nombre, correo, fecha_registro 
                FROM usuarios 
                ORDER BY fecha_registro DESC
            `;
            const results = await executeQuery(query);
            return results.map(userData => new User(userData));
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    }

    // Eliminar usuario
    static async deleteById(id) {
        try {
            const query = 'DELETE FROM usuarios WHERE id = ?';
            const result = await executeQuery(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            throw error;
        }
    }

    // Validar datos de usuario
    static validateUserData(userData) {
        const errors = [];
        const { nombre, correo, contraseña } = userData;

        // Validar nombre
        if (!nombre || nombre.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }
        if (nombre && nombre.length > 100) {
            errors.push('El nombre no puede tener más de 100 caracteres');
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!correo || !emailRegex.test(correo)) {
            errors.push('Debe proporcionar un correo válido');
        }
        if (correo && correo.length > 150) {
            errors.push('El correo no puede tener más de 150 caracteres');
        }

        // Validar contraseña
        if (!contraseña || contraseña.length < 6) {
            errors.push('La contraseña debe tener al menos 6 caracteres');
        }
        if (contraseña && contraseña.length > 100) {
            errors.push('La contraseña no puede tener más de 100 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Convertir a objeto JSON (sin contraseña)
    toJSON() {
        return {
            id: this.id,
            nombre: this.nombre,
            correo: this.correo,
            fecha_registro: this.fecha_registro
        };
    }
}

module.exports = User;

