const express = require('express');
const Joi = require('joi');
const { executeQuery } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Esquemas de validación
const sensorDataSchema = Joi.object({
    temperatura: Joi.number().min(-50).max(100).required(),
    humedad: Joi.number().min(0).max(100).required(),
    gas: Joi.number().min(0).max(1023).required(),
    esp32_id: Joi.string().max(50).default('ESP32_001')
});

const querySchema = Joi.object({
    limit: Joi.number().integer().min(1).max(1000).default(50),
    esp32_id: Joi.string().max(50).optional(),
    desde: Joi.date().optional(),
    hasta: Joi.date().optional(),
    page: Joi.number().integer().min(1).default(1)
});

// POST /api/sensors - Recibir datos del ESP32
router.post('/', async (req, res) => {
    try {
        // Validar datos de entrada
        const { error, value } = sensorDataSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de sensores inválidos',
                details: error.details[0].message
            });
        }
        
        const { temperatura, humedad, gas, esp32_id } = value;
        const ip = req.ip || req.connection.remoteAddress;
        
        // Insertar datos en la base de datos
        const insertQuery = `
            INSERT INTO datos_sensores (temperatura, humedad, gas, esp32_id)
            VALUES (?, ?, ?, ?)
        `;
        
        const result = await executeQuery(insertQuery, [temperatura, humedad, gas, esp32_id]);
        
        // Verificar alertas
        const alertas = await checkAlerts(temperatura, humedad, gas);
        
        // Log de datos recibidos
        console.log(`📊 Datos recibidos del ${esp32_id} - Temp: ${temperatura}°C, Hum: ${humedad}%, Gas: ${gas} - IP: ${ip}`);
        
        if (alertas.length > 0) {
            console.log(`⚠️  Alertas detectadas:`, alertas.map(a => a.mensaje));
        }
        
        res.json({
            success: true,
            message: 'Datos de sensores recibidos exitosamente',
            data: {
                id: result.insertId,
                temperatura,
                humedad,
                gas,
                esp32_id,
                alertas,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error recibiendo datos de sensores:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/sensors - Obtener datos de sensores
router.get('/', optionalAuth, async (req, res) => {
    try {
        // Validar parámetros de consulta
        const { error, value } = querySchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Parámetros de consulta inválidos',
                details: error.details[0].message
            });
        }
        
        const { limit, esp32_id, desde, hasta, page } = value;
        const offset = (page - 1) * limit;
        
        // Construir consulta SQL
        let whereConditions = [];
        let queryParams = [];
        
        if (esp32_id) {
            whereConditions.push('esp32_id = ?');
            queryParams.push(esp32_id);
        }
        
        if (desde) {
            whereConditions.push('fecha_registro >= ?');
            queryParams.push(desde);
        }
        
        if (hasta) {
            whereConditions.push('fecha_registro <= ?');
            queryParams.push(hasta);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        // Consulta principal
        const dataQuery = `
            SELECT * FROM datos_sensores 
            ${whereClause}
            ORDER BY fecha_registro DESC 
            LIMIT ? OFFSET ?
        `;
        
        queryParams.push(limit, offset);
        const datos = await executeQuery(dataQuery, queryParams);
        
        // Consulta para contar total de registros
        const countQuery = `
            SELECT COUNT(*) as total FROM datos_sensores 
            ${whereClause}
        `;
        
        const countParams = queryParams.slice(0, -2); // Remover limit y offset
        const countResult = await executeQuery(countQuery, countParams);
        const total = countResult[0].total;
        
        // Obtener estadísticas
        const estadisticas = await getSensorStats(esp32_id);
        
        res.json({
            success: true,
            data: {
                datos,
                estadisticas,
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
        console.error('Error obteniendo datos de sensores:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/sensors/latest - Obtener últimos datos
router.get('/latest', async (req, res) => {
    try {
        const esp32_id = req.query.esp32_id;
        
        let query = `
            SELECT * FROM datos_sensores 
            ${esp32_id ? 'WHERE esp32_id = ?' : ''}
            ORDER BY fecha_registro DESC 
            LIMIT 1
        `;
        
        const params = esp32_id ? [esp32_id] : [];
        const result = await executeQuery(query, params);
        
        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No se encontraron datos de sensores'
            });
        }
        
        const latest = result[0];
        const alertas = await checkAlerts(latest.temperatura, latest.humedad, latest.gas);
        
        res.json({
            success: true,
            data: {
                ...latest,
                alertas
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo últimos datos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// GET /api/sensors/stats - Obtener estadísticas
router.get('/stats', async (req, res) => {
    try {
        const esp32_id = req.query.esp32_id;
        const periodo = req.query.periodo || '24h'; // 1h, 24h, 7d, 30d
        
        const estadisticas = await getSensorStats(esp32_id, periodo);
        
        res.json({
            success: true,
            data: estadisticas
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// DELETE /api/sensors/cleanup - Limpiar datos antiguos (requiere autenticación)
router.delete('/cleanup', optionalAuth, async (req, res) => {
    try {
        // Solo permitir si hay usuario autenticado (opcional)
        const dias = parseInt(req.query.dias) || 30;
        
        if (dias < 1) {
            return res.status(400).json({
                success: false,
                error: 'El número de días debe ser mayor a 0'
            });
        }
        
        const deleteQuery = `
            DELETE FROM datos_sensores 
            WHERE fecha_registro < DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        
        const result = await executeQuery(deleteQuery, [dias]);
        
        res.json({
            success: true,
            message: `Datos anteriores a ${dias} días eliminados`,
            data: {
                registrosEliminados: result.affectedRows
            }
        });
        
    } catch (error) {
        console.error('Error limpiando datos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// Función para verificar alertas
async function checkAlerts(temperatura, humedad, gas) {
    const alertas = [];
    
    try {
        // Obtener configuración de límites
        const configQuery = `
            SELECT clave, valor FROM configuracion 
            WHERE clave IN ('temperatura_max', 'humedad_max', 'gas_max')
        `;
        
        const configs = await executeQuery(configQuery);
        const limites = {};
        
        configs.forEach(config => {
            limites[config.clave] = parseFloat(config.valor);
        });
        
        // Verificar temperatura
        if (limites.temperatura_max && temperatura > limites.temperatura_max) {
            alertas.push({
                tipo: 'temperatura',
                nivel: 'warning',
                mensaje: `Temperatura alta: ${temperatura}°C (máx: ${limites.temperatura_max}°C)`,
                valor: temperatura,
                limite: limites.temperatura_max
            });
        }
        
        // Verificar humedad
        if (limites.humedad_max && humedad > limites.humedad_max) {
            alertas.push({
                tipo: 'humedad',
                nivel: 'warning',
                mensaje: `Humedad alta: ${humedad}% (máx: ${limites.humedad_max}%)`,
                valor: humedad,
                limite: limites.humedad_max
            });
        }
        
        // Verificar gas
        if (limites.gas_max && gas > limites.gas_max) {
            alertas.push({
                tipo: 'gas',
                nivel: 'danger',
                mensaje: `Nivel de gas alto: ${gas} (máx: ${limites.gas_max})`,
                valor: gas,
                limite: limites.gas_max
            });
        }
        
    } catch (error) {
        console.error('Error verificando alertas:', error);
    }
    
    return alertas;
}

// Función para obtener estadísticas de sensores
async function getSensorStats(esp32_id = null, periodo = '24h') {
    try {
        // Convertir periodo a intervalo SQL
        const intervalMap = {
            '1h': 'INTERVAL 1 HOUR',
            '24h': 'INTERVAL 24 HOUR',
            '7d': 'INTERVAL 7 DAY',
            '30d': 'INTERVAL 30 DAY'
        };
        
        const interval = intervalMap[periodo] || 'INTERVAL 24 HOUR';
        
        let whereClause = `WHERE fecha_registro >= DATE_SUB(NOW(), ${interval})`;
        let params = [];
        
        if (esp32_id) {
            whereClause += ' AND esp32_id = ?';
            params.push(esp32_id);
        }
        
        const statsQuery = `
            SELECT 
                COUNT(*) as total_registros,
                AVG(temperatura) as temp_promedio,
                MIN(temperatura) as temp_minima,
                MAX(temperatura) as temp_maxima,
                AVG(humedad) as hum_promedio,
                MIN(humedad) as hum_minima,
                MAX(humedad) as hum_maxima,
                AVG(gas) as gas_promedio,
                MIN(gas) as gas_minimo,
                MAX(gas) as gas_maximo,
                MAX(fecha_registro) as ultimo_registro,
                MIN(fecha_registro) as primer_registro
            FROM datos_sensores 
            ${whereClause}
        `;
        
        const result = await executeQuery(statsQuery, params);
        const stats = result[0];
        
        // Redondear valores decimales
        if (stats.temp_promedio) stats.temp_promedio = Math.round(stats.temp_promedio * 100) / 100;
        if (stats.hum_promedio) stats.hum_promedio = Math.round(stats.hum_promedio * 100) / 100;
        if (stats.gas_promedio) stats.gas_promedio = Math.round(stats.gas_promedio * 100) / 100;
        
        return {
            ...stats,
            periodo,
            esp32_id: esp32_id || 'todos'
        };
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return null;
    }
}

module.exports = router;

