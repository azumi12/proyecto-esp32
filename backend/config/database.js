const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos MySQL (XAMPP)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'registros',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para obtener conexión
async function getConnection() {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
        throw error;
    }
}

// Función para ejecutar consultas
async function executeQuery(query, params = []) {
    let connection;
    try {
        connection = await getConnection();
        const [results] = await connection.execute(query, params);
        return results;
    } catch (error) {
        console.error('Error al ejecutar consulta:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

// Función para verificar conexión
async function testConnection() {
    try {
        const connection = await getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        console.log(`📊 Base de datos: ${dbConfig.database}`);
        console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a MySQL:', error.message);
        return false;
    }
}

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        // Verificar que todas las tablas existan
        const tables = ['usuarios', 'sesiones', 'login_logs', 'datos_sensores', 'configuracion'];
        
        for (const table of tables) {
            const checkQuery = `SHOW TABLES LIKE '${table}'`;
            const result = await executeQuery(checkQuery);
            
            if (result.length === 0) {
                console.log(`⚠️  Tabla '${table}' no encontrada. Por favor, ejecuta el script database_mysql.sql`);
                return false;
            } else {
                console.log(`✅ Tabla '${table}' verificada`);
            }
        }
        
        console.log('✅ Todas las tablas están presentes');
        return true;
    } catch (error) {
        console.error('❌ Error al verificar base de datos:', error);
        return false;
    }
}

// Función para obtener configuración del sistema
async function getSystemConfig(key) {
    try {
        const query = 'SELECT valor FROM configuracion WHERE clave = ?';
        const result = await executeQuery(query, [key]);
        return result.length > 0 ? result[0].valor : null;
    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        return null;
    }
}

// Función para establecer configuración del sistema
async function setSystemConfig(key, value, description = null) {
    try {
        const query = `
            INSERT INTO configuracion (clave, valor, descripcion) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            valor = VALUES(valor), 
            descripcion = COALESCE(VALUES(descripcion), descripcion)
        `;
        await executeQuery(query, [key, value, description]);
        return true;
    } catch (error) {
        console.error('Error estableciendo configuración:', error);
        return false;
    }
}

module.exports = {
    pool,
    getConnection,
    executeQuery,
    testConnection,
    initializeDatabase,
    getSystemConfig,
    setSystemConfig
};

