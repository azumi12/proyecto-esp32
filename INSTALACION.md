# Guía de Instalación - Sistema ESP32 IoT

## Introducción

Esta guía te llevará paso a paso a través del proceso completo de instalación y configuración del Sistema ESP32 con Node.js, React y MySQL. El proceso está diseñado para ser seguido secuencialmente, y cada paso incluye verificaciones para asegurar que todo funcione correctamente antes de continuar.

**Tiempo estimado de instalación:** 45-60 minutos  
**Nivel de dificultad:** Intermedio  
**Sistemas operativos soportados:** Windows 10/11, macOS, Ubuntu/Debian

## Prerrequisitos

Antes de comenzar, asegúrate de tener:

- Computadora con al menos 4GB de RAM y 2GB de espacio libre
- Conexión a internet estable
- Permisos de administrador en tu sistema
- ESP32 y sensores (DHT11, MQ2)
- Cables y protoboard para conexiones

## Paso 1: Instalación de XAMPP

### 1.1 Descarga de XAMPP

1. Ve al sitio oficial: [https://www.apachefriends.org/](https://www.apachefriends.org/)
2. Descarga la versión más reciente para tu sistema operativo
3. Asegúrate de descargar una versión que incluya PHP 7.4 o superior

### 1.2 Instalación

**En Windows:**
1. Ejecuta el instalador como administrador
2. Selecciona los componentes: Apache, MySQL, PHP, phpMyAdmin
3. Elige la carpeta de instalación (recomendado: `C:\xampp`)
4. Completa la instalación siguiendo el asistente

**En macOS:**
1. Monta el archivo DMG descargado
2. Arrastra XAMPP a la carpeta Applications
3. Abre Terminal y ejecuta: `sudo /Applications/XAMPP/xamppfiles/xampp start`

**En Linux (Ubuntu/Debian):**
```bash
# Hacer ejecutable el instalador
chmod +x xampp-linux-x64-8.2.12-0-installer.run

# Ejecutar instalador
sudo ./xampp-linux-x64-8.2.12-0-installer.run

# Iniciar servicios
sudo /opt/lampp/lampp start
```

### 1.3 Verificación de XAMPP

1. Abre el Panel de Control de XAMPP
2. Inicia los servicios Apache y MySQL
3. Verifica que ambos muestren estado "Running" (verde)
4. Abre tu navegador y ve a `http://localhost`
5. Deberías ver la página de bienvenida de XAMPP

**Solución de problemas comunes:**
- **Puerto 80 ocupado:** Cambia Apache al puerto 8080 en la configuración
- **Puerto 3306 ocupado:** Cambia MySQL al puerto 3307
- **Permisos en Linux:** Ejecuta con `sudo` si es necesario

### 1.4 Configuración de phpMyAdmin

1. Ve a `http://localhost/phpmyadmin`
2. Inicia sesión con:
   - Usuario: `root`
   - Contraseña: (dejar vacío)
3. Si aparece un error de configuración, sigue las instrucciones en pantalla

## Paso 2: Configuración de la Base de Datos

### 2.1 Creación de la Base de Datos

1. En phpMyAdmin, haz clic en "Nueva" en el panel izquierdo
2. Nombre de la base de datos: `registros`
3. Cotejamiento: `utf8mb4_unicode_ci`
4. Haz clic en "Crear"

### 2.2 Importación del Esquema

1. Selecciona la base de datos `registros` recién creada
2. Ve a la pestaña "Importar"
3. Haz clic en "Seleccionar archivo"
4. Busca y selecciona el archivo `database_mysql.sql` del proyecto
5. Haz clic en "Continuar" para importar

### 2.3 Verificación de la Importación

Después de la importación exitosa, verifica que se hayan creado las siguientes tablas:

- `usuarios` (con 2 usuarios por defecto)
- `sesiones` (vacía inicialmente)
- `login_logs` (vacía inicialmente)
- `datos_sensores` (vacía inicialmente)
- `configuracion` (con configuraciones por defecto)

**Verificación de usuarios por defecto:**
```sql
SELECT * FROM usuarios;
```

Deberías ver dos usuarios:
- admin@esp32.com (rol: admin)
- usuario@esp32.com (rol: usuario)

## Paso 3: Instalación de Node.js

### 3.1 Descarga e Instalación

1. Ve a [https://nodejs.org/](https://nodejs.org/)
2. Descarga la versión LTS (Long Term Support)
3. Ejecuta el instalador y sigue las instrucciones
4. Asegúrate de marcar "Add to PATH" durante la instalación

### 3.2 Verificación de la Instalación

Abre una terminal/cmd y ejecuta:

```bash
node --version
npm --version
```

Deberías ver las versiones instaladas (Node.js 16+ y npm 8+).

### 3.3 Instalación de pnpm (Opcional pero Recomendado)

```bash
npm install -g pnpm
pnpm --version
```

## Paso 4: Configuración del Backend Node.js

### 4.1 Navegación al Directorio

```bash
cd ruta/al/proyecto/esp32_project/backend
```

### 4.2 Instalación de Dependencias

```bash
npm install
```

Este comando instalará todas las dependencias listadas en `package.json`:
- express
- mysql2
- cors
- bcryptjs
- jsonwebtoken
- dotenv
- helmet
- express-rate-limit
- joi

### 4.3 Configuración de Variables de Entorno

Revisa el archivo `.env` y ajusta las configuraciones según tu entorno:

```env
# Configuración del servidor
PORT=3001
NODE_ENV=development

# Configuración de la base de datos MySQL (XAMPP)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=registros
DB_PORT=3306

# Configuración JWT
JWT_SECRET=esp32_jwt_secret_key_2024_super_secure
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Configuración de seguridad
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Importante:** En producción, cambia `JWT_SECRET` por una clave única y segura.

### 4.4 Prueba del Backend

```bash
npm start
```

Deberías ver mensajes similares a:
```
🚀 Iniciando servidor ESP32 Backend...
📊 Verificando conexión a la base de datos...
✅ Conexión a MySQL establecida correctamente
🌐 Servidor ejecutándose en puerto 3001
📋 Endpoints disponibles:
   POST /api/auth/login
   POST /api/auth/register
   GET  /api/sensors
   POST /api/sensors
   ...
```

### 4.5 Verificación de Endpoints

Abre otra terminal y prueba la API:

```bash
# Probar endpoint de salud
curl http://localhost:3001/api/health

# Probar login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@esp32.com","contraseña":"admin123"}'
```

## Paso 5: Configuración del Frontend React

### 5.1 Navegación al Directorio

```bash
cd ruta/al/proyecto/esp32_project/frontend
```

### 5.2 Instalación de Dependencias

```bash
pnpm install
# o si prefieres npm:
npm install
```

### 5.3 Configuración de la API

Verifica que el archivo `src/hooks/useAuth.jsx` tenga la URL correcta:

```javascript
const API_BASE = 'http://localhost:3001/api'
```

Si tu backend está en una IP diferente, cámbiala aquí.

### 5.4 Inicio del Servidor de Desarrollo

```bash
pnpm run dev --host
# o con npm:
npm run dev -- --host
```

Deberías ver:
```
  VITE v6.3.5  ready in 604 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### 5.5 Verificación del Frontend

1. Abre tu navegador y ve a `http://localhost:5173`
2. Deberías ver la página de login del sistema
3. Prueba iniciar sesión con:
   - Correo: `admin@esp32.com`
   - Contraseña: `admin123`
4. Deberías acceder al dashboard principal

## Paso 6: Configuración del Arduino IDE

### 6.1 Instalación del Arduino IDE

1. Descarga desde [https://www.arduino.cc/en/software](https://www.arduino.cc/en/software)
2. Instala siguiendo las instrucciones para tu sistema operativo

### 6.2 Configuración del Soporte ESP32

1. Abre Arduino IDE
2. Ve a `Archivo > Preferencias`
3. En "Gestor de URLs Adicionales de Tarjetas", agrega:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Ve a `Herramientas > Placa > Gestor de tarjetas`
5. Busca "ESP32" e instala "ESP32 by Espressif Systems"

### 6.3 Instalación de Librerías

Ve a `Herramientas > Administrar librerías` e instala:

1. **ArduinoJson** (versión 6.x)
   - Busca "ArduinoJson"
   - Instala la versión de Benoit Blanchon

2. **DHT sensor library**
   - Busca "DHT sensor library"
   - Instala la de Adafruit

3. **Adafruit Unified Sensor**
   - Se instala automáticamente como dependencia de DHT
   - Si no, búscala e instálala manualmente

### 6.4 Configuración de la Placa

1. Ve a `Herramientas > Placa`
2. Selecciona `ESP32 Arduino > ESP32 Dev Module`
3. Configura los parámetros:
   - Upload Speed: 921600
   - CPU Frequency: 240MHz
   - Flash Frequency: 80MHz
   - Flash Mode: QIO
   - Flash Size: 4MB
   - Partition Scheme: Default 4MB

## Paso 7: Configuración del Hardware ESP32

### 7.1 Esquema de Conexiones

Conecta los componentes según este esquema:

| Componente | Pin ESP32 | Cable | Descripción |
|------------|-----------|-------|-------------|
| DHT11 VCC  | 3.3V      | Rojo  | Alimentación positiva |
| DHT11 GND  | GND       | Negro | Tierra común |
| DHT11 DATA | GPIO 16   | Amarillo | Señal de datos |
| MQ2 VCC    | 3.3V      | Rojo  | Alimentación positiva |
| MQ2 GND    | GND       | Negro | Tierra común |
| MQ2 A0     | GPIO 2    | Verde | Señal analógica |

### 7.2 Verificación de Conexiones

Antes de programar, verifica:

1. **Alimentación:** Todos los VCC conectados a 3.3V
2. **Tierra:** Todas las tierras conectadas a GND común
3. **Señales:** Pines de datos conectados correctamente
4. **Continuidad:** Usa un multímetro para verificar conexiones
5. **Cortocircuitos:** Asegúrate de que no hay conexiones no deseadas

### 7.3 Prueba de Sensores

Antes de cargar el código principal, prueba cada sensor individualmente:

**Código de prueba DHT11:**
```cpp
#include "DHT.h"
#define DHTPIN 16
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (isnan(h) || isnan(t)) {
    Serial.println("Error leyendo DHT11");
  } else {
    Serial.print("Humedad: ");
    Serial.print(h);
    Serial.print("% Temperatura: ");
    Serial.print(t);
    Serial.println("°C");
  }
  delay(2000);
}
```

## Paso 8: Programación del ESP32

### 8.1 Configuración del Código

1. Abre el archivo `esp32_sketch_updated.ino` en Arduino IDE
2. Modifica las siguientes líneas con tu configuración:

```cpp
// --- Configuración WiFi ---
const char* ssid = "TU_WIFI_SSID";          // Cambiar por tu SSID
const char* password = "TU_WIFI_PASSWORD";   // Cambiar por tu contraseña

// --- Configuración del Servidor ---
const char* serverURL = "http://192.168.1.100:3001"; // IP de tu servidor
```

### 8.2 Obtención de la IP del Servidor

**En Windows:**
```cmd
ipconfig
```
Busca la "Dirección IPv4" de tu adaptador de red activo.

**En macOS/Linux:**
```bash
ifconfig
# o
ip addr show
```
Busca la dirección inet de tu interfaz de red activa.

### 8.3 Carga del Código

1. Conecta el ESP32 a tu computadora vía USB
2. Selecciona el puerto correcto en `Herramientas > Puerto`
3. Haz clic en el botón "Subir" (flecha hacia la derecha)
4. Espera a que se complete la carga

### 8.4 Monitoreo del ESP32

1. Abre el Monitor Serie (`Herramientas > Monitor Serie`)
2. Configura la velocidad a 115200 baudios
3. Deberías ver mensajes de conexión WiFi y envío de datos

**Salida esperada:**
```
🔄 Conectando a WiFi....
✅ Conectado a WiFi
📍 IP: 192.168.1.150
📶 RSSI: -45 dBm
✅ ESP32 iniciado correctamente
📡 Enviando datos cada 5 segundos
🌐 Servidor: http://192.168.1.100:3001
📊 Datos de sensores:
   🌡️  Temperatura: 24.5°C
   💧 Humedad: 58%
   💨 Gas: 245
📤 Enviando datos a: http://192.168.1.100:3001/api/sensors
📥 Respuesta HTTP: 200
✅ Datos enviados exitosamente
```

## Paso 9: Verificación del Sistema Completo

### 9.1 Verificación de Flujo de Datos

1. **ESP32 → Backend:** Verifica en el monitor serie que los datos se envían correctamente
2. **Backend → Base de Datos:** Revisa en phpMyAdmin que los datos aparecen en `datos_sensores`
3. **Frontend → Backend:** Verifica en el dashboard que los datos se muestran en tiempo real

### 9.2 Prueba de Funcionalidades

**Autenticación:**
- [ ] Login con credenciales correctas
- [ ] Rechazo de credenciales incorrectas
- [ ] Logout funcional
- [ ] Redirección automática según estado de autenticación

**Dashboard:**
- [ ] Visualización de datos en tiempo real
- [ ] Gráficos históricos funcionando
- [ ] Indicador de estado de conexión ESP32
- [ ] Actualización automática cada 10 segundos

**Alertas:**
- [ ] Alertas aparecen cuando se superan umbrales
- [ ] Diferentes niveles de alerta (warning, danger)
- [ ] Alertas se muestran tanto en ESP32 como en dashboard

### 9.3 Pruebas de Estrés

**Conectividad:**
1. Desconecta el WiFi del ESP32 y verifica recuperación automática
2. Reinicia el backend y verifica que el ESP32 se reconecta
3. Cierra y abre el navegador para probar persistencia de sesión

**Datos:**
1. Cubre el sensor DHT11 con tu mano para cambiar temperatura/humedad
2. Acerca una fuente de gas al MQ2 (con precaución)
3. Verifica que los cambios se reflejen en el dashboard

## Paso 10: Configuración Avanzada (Opcional)

### 10.1 Configuración de Producción

**Backend:**
```env
NODE_ENV=production
JWT_SECRET=tu_clave_super_secreta_unica_de_64_caracteres_minimo
DB_PASSWORD=contraseña_segura_mysql
```

**Frontend:**
```javascript
// En producción, cambiar a la IP/dominio real
const API_BASE = 'https://tu-dominio.com/api'
```

### 10.2 Configuración de Múltiples ESP32

Para usar múltiples dispositivos ESP32:

1. Cambia el `esp32_id` en cada dispositivo:
```cpp
String esp32_id = "ESP32_COCINA";    // Para el de la cocina
String esp32_id = "ESP32_SALON";     // Para el del salón
```

2. El sistema automáticamente diferenciará los dispositivos

### 10.3 Configuración de Alertas por Email (Avanzado)

Agrega nodemailer al backend para envío de emails:

```bash
cd backend
npm install nodemailer
```

## Solución de Problemas Comunes

### Problema: ESP32 no se conecta a WiFi

**Síntomas:**
- Monitor serie muestra "Conectando a WiFi....." indefinidamente
- LED del ESP32 no se enciende

**Soluciones:**
1. Verifica SSID y contraseña (case-sensitive)
2. Asegúrate de usar red 2.4GHz (no 5GHz)
3. Acerca el ESP32 al router
4. Reinicia el router
5. Prueba con un hotspot móvil

### Problema: Backend no se conecta a MySQL

**Síntomas:**
- Error "ECONNREFUSED" al iniciar backend
- Mensaje "Error al conectar a la base de datos"

**Soluciones:**
1. Verifica que MySQL esté ejecutándose en XAMPP
2. Comprueba credenciales en `.env`
3. Asegúrate de que la base de datos `registros` exista
4. Verifica que el puerto 3306 no esté bloqueado

### Problema: Frontend no carga datos

**Síntomas:**
- Dashboard muestra "No hay datos disponibles"
- Indicador de ESP32 desconectado

**Soluciones:**
1. Verifica que el backend esté ejecutándose
2. Comprueba la URL de la API en `useAuth.jsx`
3. Revisa la consola del navegador para errores
4. Verifica que el ESP32 esté enviando datos

### Problema: Sensores devuelven valores incorrectos

**Síntomas:**
- Temperatura/humedad muestran NaN
- Valores de gas siempre en 0 o 1023

**Soluciones:**
1. Verifica conexiones físicas
2. Comprueba alimentación de sensores (3.3V)
3. Prueba con sensores conocidos como funcionales
4. Revisa el código de inicialización

## Comandos de Depuración

### ESP32 (Monitor Serie)

```
status    - Mostrar estado del sistema
test      - Enviar datos de prueba
auth      - Reintentar autenticación
wifi      - Reconectar WiFi
interval X - Cambiar intervalo de envío (ms)
server URL - Cambiar URL del servidor
help      - Mostrar ayuda
```

### Backend (Terminal)

```bash
# Ver logs en tiempo real
tail -f logs/system.log

# Probar conexión a base de datos
npm run test-db

# Verificar endpoints
curl http://localhost:3001/api/health
```

### Base de Datos (phpMyAdmin)

```sql
-- Ver últimos datos de sensores
SELECT * FROM datos_sensores ORDER BY fecha_registro DESC LIMIT 10;

-- Ver usuarios activos
SELECT u.*, s.* FROM usuarios u 
JOIN sesiones s ON u.id = s.usuario_id 
WHERE s.activa = TRUE;

-- Ver logs de login
SELECT * FROM login_logs ORDER BY fecha DESC LIMIT 20;
```

## Mantenimiento Regular

### Tareas Diarias
- [ ] Verificar que todos los servicios estén ejecutándose
- [ ] Revisar logs de errores
- [ ] Comprobar conectividad del ESP32

### Tareas Semanales
- [ ] Limpiar logs antiguos
- [ ] Verificar espacio en disco
- [ ] Backup de la base de datos

### Tareas Mensuales
- [ ] Actualizar dependencias de Node.js
- [ ] Limpiar datos antiguos de sensores
- [ ] Revisar configuraciones de seguridad

## Próximos Pasos

Una vez que tengas el sistema funcionando correctamente, puedes considerar:

1. **Agregar más sensores** (pH, presión, luz, etc.)
2. **Implementar notificaciones push** para alertas críticas
3. **Crear una app móvil** usando React Native
4. **Integrar con servicios en la nube** (AWS IoT, Google Cloud IoT)
5. **Implementar machine learning** para predicción de tendencias
6. **Agregar control remoto** de actuadores (relés, servos)

## Soporte y Recursos

- **Documentación completa:** `README.md`
- **Código fuente:** Todos los archivos incluidos en el proyecto
- **Comunidad ESP32:** [https://esp32.com/](https://esp32.com/)
- **Documentación Node.js:** [https://nodejs.org/docs/](https://nodejs.org/docs/)
- **Documentación React:** [https://react.dev/](https://react.dev/)

---

**¡Felicidades!** Has completado la instalación del Sistema ESP32 IoT. El sistema ahora debería estar funcionando completamente y listo para monitorear tus sensores en tiempo real.

Si encuentras algún problema no cubierto en esta guía, revisa los logs del sistema y utiliza los comandos de depuración proporcionados para identificar la causa del problema.

