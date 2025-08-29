-- Script SQL para crear la base de datos y tablas para el sistema ESP32 con Node.js
-- Para usar con XAMPP/phpMyAdmin

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS registros CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar la base de datos
USE registros;

-- Crear la tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'usuario') DEFAULT 'usuario',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_correo (correo),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de sesiones para JWT
CREATE TABLE IF NOT EXISTS sesiones (
    id VARCHAR(255) PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    refresh_token VARCHAR(500) NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_token (token),
    INDEX idx_refresh_token (refresh_token),
    INDEX idx_expiracion (fecha_expiracion),
    INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de logs de login
CREATE TABLE IF NOT EXISTS login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    correo VARCHAR(150),
    exitoso BOOLEAN,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mensaje VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_correo (correo),
    INDEX idx_fecha (fecha),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_exitoso (exitoso)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla para datos de sensores del ESP32
CREATE TABLE IF NOT EXISTS datos_sensores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperatura DECIMAL(5,2) NOT NULL,
    humedad DECIMAL(5,2) NOT NULL,
    gas INT NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    esp32_id VARCHAR(50) DEFAULT 'ESP32_001',
    INDEX idx_fecha (fecha_registro),
    INDEX idx_esp32_id (esp32_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario administrador por defecto
-- La contraseña es: admin123 (se hasheará en el backend Node.js)
INSERT IGNORE INTO usuarios (nombre, correo, contraseña, rol) VALUES 
('Administrador', 'admin@esp32.com', '$2b$10$rOzJqKqQQjQQjQQjQQjQQOeKqKqQQjQQjQQjQQjQQjQQjQQjQQjQQu', 'admin'),
('Usuario Demo', 'usuario@esp32.com', '$2b$10$rOzJqKqQQjQQjQQjQQjQQOeKqKqQQjQQjQQjQQjQQjQQjQQjQQjQQu', 'usuario');

-- Insertar configuraciones por defecto
INSERT IGNORE INTO configuracion (clave, valor, descripcion) VALUES 
('sistema_nombre', 'Sistema ESP32 Login', 'Nombre del sistema'),
('max_intentos_login', '5', 'Máximo número de intentos de login fallidos'),
('tiempo_bloqueo', '300', 'Tiempo de bloqueo en segundos tras intentos fallidos'),
('intervalo_sensores', '5000', 'Intervalo de envío de datos de sensores en milisegundos'),
('temperatura_max', '35.0', 'Temperatura máxima permitida'),
('humedad_max', '80.0', 'Humedad máxima permitida'),
('gas_max', '500', 'Nivel máximo de gas permitido'),
('jwt_secret', 'esp32_jwt_secret_key_2024', 'Clave secreta para JWT'),
('session_timeout', '3600', 'Tiempo de expiración de sesión en segundos'),
('cors_origin', '*', 'Origen permitido para CORS'),
('server_port', '3001', 'Puerto del servidor Node.js');

-- Mostrar las estructuras de las tablas
DESCRIBE usuarios;
DESCRIBE sesiones;
DESCRIBE login_logs;
DESCRIBE datos_sensores;
DESCRIBE configuracion;

-- Mostrar datos insertados
SELECT * FROM usuarios;
SELECT * FROM configuracion;

