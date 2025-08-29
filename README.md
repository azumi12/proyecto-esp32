# Sistema ESP32 con Node.js, React y MySQL

## Descripción General

Este proyecto implementa un sistema completo de monitoreo IoT utilizando un microcontrolador ESP32 que se comunica con un backend desarrollado en Node.js, un frontend React moderno, y una base de datos MySQL gestionada a través de XAMPP. El sistema permite la recolección, almacenamiento y visualización en tiempo real de datos de sensores de temperatura, humedad y gas, con un sistema robusto de autenticación de usuarios y alertas automáticas.

La arquitectura del sistema está diseñada siguiendo las mejores prácticas de desarrollo moderno, implementando una separación clara entre el backend (API RESTful), el frontend (Single Page Application) y la base de datos (MySQL relacional). Esta configuración proporciona escalabilidad, mantenibilidad y una experiencia de usuario superior comparada con implementaciones monolíticas tradicionales.

## Arquitectura del Sistema

### Componentes Principales

El sistema está compuesto por cuatro componentes principales que trabajan de manera coordinada:

**1. ESP32 (Dispositivo IoT)**
- Microcontrolador con conectividad WiFi integrada
- Sensores DHT11 (temperatura y humedad) y MQ2 (gas)
- Firmware desarrollado en C++ usando Arduino IDE
- Comunicación HTTP/JSON con el backend Node.js
- Sistema de comandos por puerto serie para depuración

**2. Backend Node.js**
- Servidor API RESTful desarrollado con Express.js
- Sistema de autenticación JWT (JSON Web Tokens)
- Middleware de seguridad (CORS, Rate Limiting, Helmet)
- Conexión a base de datos MySQL usando mysql2
- Endpoints para autenticación, gestión de usuarios y datos de sensores

**3. Frontend React**
- Single Page Application (SPA) desarrollada con React 18
- Interfaz de usuario moderna usando Tailwind CSS y shadcn/ui
- Dashboard en tiempo real con gráficos interactivos (Recharts)
- Sistema de autenticación integrado con el backend
- Responsive design compatible con dispositivos móviles

**4. Base de Datos MySQL**
- Gestionada a través de XAMPP para facilidad de desarrollo
- Esquema optimizado con índices para consultas eficientes
- Tablas para usuarios, sesiones, logs y datos de sensores
- Configuración parametrizable del sistema

### Flujo de Datos

El flujo de información en el sistema sigue un patrón bien definido que garantiza la integridad y disponibilidad de los datos:

1. **Recolección**: El ESP32 lee los sensores cada 5 segundos (configurable)
2. **Transmisión**: Los datos se envían vía HTTP POST al endpoint `/api/sensors`
3. **Procesamiento**: El backend Node.js valida, procesa y almacena los datos
4. **Alertas**: Se evalúan automáticamente los umbrales configurados
5. **Visualización**: El frontend React consulta los datos vía API REST
6. **Tiempo Real**: La interfaz se actualiza automáticamente cada 10 segundos

## Características Principales

### Monitoreo en Tiempo Real
- Recolección continua de datos de temperatura, humedad y gas
- Visualización instantánea en dashboard web responsivo
- Gráficos históricos interactivos con múltiples series de datos
- Indicadores visuales del estado de conexión del dispositivo ESP32

### Sistema de Autenticación Robusto
- Autenticación basada en JWT con tokens de acceso y refresh
- Gestión de sesiones con expiración automática
- Roles de usuario (administrador y usuario estándar)
- Logging completo de intentos de acceso y actividades

### Alertas Inteligentes
- Configuración de umbrales personalizables por tipo de sensor
- Notificaciones visuales en tiempo real cuando se superan límites
- Sistema de alertas por niveles (warning, danger)
- Histórico de alertas para análisis posterior

### API RESTful Completa
- Endpoints documentados para todas las operaciones
- Validación de entrada usando esquemas Joi
- Manejo de errores estandarizado
- Rate limiting para prevenir abuso
- Middleware de seguridad integrado

### Interfaz de Usuario Moderna
- Diseño responsive que se adapta a cualquier dispositivo
- Componentes UI reutilizables basados en shadcn/ui
- Tema claro/oscuro automático según preferencias del sistema
- Navegación intuitiva y experiencia de usuario optimizada

## Requisitos del Sistema

### Hardware Necesario

Para implementar este sistema correctamente, se requiere el siguiente hardware específico:

**Microcontrolador ESP32**
- Cualquier variante del ESP32 (ESP32-WROOM-32, ESP32-DevKitC, etc.)
- Mínimo 4MB de memoria flash
- Conectividad WiFi 802.11 b/g/n
- Pines GPIO disponibles para conexión de sensores

**Sensores**
- DHT11 o DHT22 para medición de temperatura y humedad
- MQ2 para detección de gases combustibles
- Resistencias pull-up de 10kΩ (si no están integradas en los módulos)

**Componentes Adicionales**
- Protoboard o PCB para montaje
- Cables jumper macho-hembra
- Fuente de alimentación 5V (puede ser vía USB)
- LED indicador (opcional, el ESP32 tiene LED integrado)

### Software y Dependencias

**Entorno de Desarrollo**
- XAMPP 8.0 o superior (Apache, MySQL, PHP, phpMyAdmin)
- Node.js 16.0 o superior con npm/pnpm
- Arduino IDE 1.8.19 o superior con soporte ESP32
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

**Librerías Arduino**
- WiFi (incluida en el core ESP32)
- HTTPClient (incluida en el core ESP32)
- ArduinoJson 6.x para manejo de JSON
- DHT sensor library por Adafruit
- Adafruit Unified Sensor (dependencia de DHT)

**Dependencias Node.js**
- express: Framework web para Node.js
- mysql2: Cliente MySQL con soporte para promesas
- cors: Middleware para Cross-Origin Resource Sharing
- bcryptjs: Librería para hash de contraseñas
- jsonwebtoken: Implementación de JWT para Node.js
- dotenv: Gestión de variables de entorno
- helmet: Middleware de seguridad
- express-rate-limit: Limitación de velocidad de requests
- joi: Validación de esquemas de datos

**Dependencias React**
- react: Librería principal de React
- react-dom: Renderizado DOM para React
- react-router-dom: Enrutamiento para SPAs
- tailwindcss: Framework CSS utility-first
- shadcn/ui: Componentes UI pre-construidos
- recharts: Librería de gráficos para React
- lucide-react: Iconos SVG para React

## Estructura del Proyecto

La organización del proyecto sigue las mejores prácticas de desarrollo, separando claramente las responsabilidades de cada componente:

```
esp32_project/
├── backend/                    # Servidor Node.js
│   ├── config/
│   │   └── database.js        # Configuración de MySQL
│   ├── middleware/
│   │   └── auth.js            # Middleware de autenticación
│   ├── routes/
│   │   ├── auth.js            # Rutas de autenticación
│   │   ├── sensors.js         # Rutas de sensores
│   │   └── users.js           # Rutas de usuarios
│   ├── logs/                  # Archivos de log
│   ├── .env                   # Variables de entorno
│   ├── package.json           # Dependencias Node.js
│   └── server.js              # Servidor principal
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # Componentes shadcn/ui
│   │   │   ├── Dashboard.jsx  # Dashboard principal
│   │   │   └── Login.jsx      # Componente de login
│   │   ├── hooks/
│   │   │   └── useAuth.jsx    # Hook de autenticación
│   │   ├── App.jsx            # Componente principal
│   │   └── main.jsx           # Punto de entrada
│   ├── public/                # Archivos estáticos
│   ├── package.json           # Dependencias React
│   └── vite.config.js         # Configuración de Vite
├── database_mysql.sql          # Script de base de datos
├── esp32_sketch_updated.ino    # Código para ESP32
└── README.md                   # Esta documentación
```

### Descripción de Directorios

**Backend (`/backend`)**
El directorio del backend contiene toda la lógica del servidor Node.js, organizada en módulos específicos para facilitar el mantenimiento y la escalabilidad. La configuración de la base de datos se centraliza en el directorio `config`, mientras que los middlewares de autenticación y seguridad se encuentran en `middleware`. Las rutas de la API están organizadas por funcionalidad en el directorio `routes`.

**Frontend (`/frontend`)**
La aplicación React sigue la estructura estándar de Create React App, con componentes organizados por funcionalidad. Los componentes de UI reutilizables se encuentran en `components/ui`, mientras que los hooks personalizados están en `hooks`. La configuración de Vite permite un desarrollo rápido con hot reload.

**Base de Datos**
El archivo `database_mysql.sql` contiene todo el esquema de la base de datos, incluyendo la creación de tablas, índices, datos iniciales y configuraciones del sistema. Este script está diseñado para ejecutarse en phpMyAdmin o cualquier cliente MySQL.

## Instalación y Configuración

### Paso 1: Configuración de XAMPP

La instalación de XAMPP es el primer paso fundamental para establecer el entorno de desarrollo. XAMPP proporciona una solución integrada que incluye Apache, MySQL, PHP y phpMyAdmin, eliminando la complejidad de configurar cada servicio por separado.

**Descarga e Instalación**

Dirígete al sitio oficial de XAMPP en [https://www.apachefriends.org/](https://www.apachefriends.org/) y descarga la versión más reciente compatible con tu sistema operativo. Es importante seleccionar una versión que incluya PHP 7.4 o superior para garantizar la compatibilidad con las características modernas de desarrollo web.

Durante la instalación, asegúrate de seleccionar los componentes esenciales: Apache (servidor web), MySQL (base de datos), PHP (lenguaje de programación) y phpMyAdmin (interfaz de administración de base de datos). Estos componentes forman la base del stack LAMP/WAMP que soportará nuestro sistema.

**Configuración Inicial**

Una vez completada la instalación, abre el Panel de Control de XAMPP y inicia los servicios de Apache y MySQL. Verifica que ambos servicios muestren el estado "Running" en color verde. Si encuentras problemas de puertos ocupados, puedes modificar la configuración desde el panel de control para usar puertos alternativos.

Para verificar que la instalación fue exitosa, abre tu navegador web y navega a `http://localhost`. Deberías ver la página de bienvenida de XAMPP, lo que confirma que Apache está funcionando correctamente. Luego, accede a `http://localhost/phpmyadmin` para verificar que MySQL y phpMyAdmin están operativos.

### Paso 2: Configuración de la Base de Datos

La base de datos MySQL es el corazón del sistema de almacenamiento, diseñada para manejar eficientemente tanto los datos de sensores como la información de usuarios y sesiones.

**Creación de la Base de Datos**

Accede a phpMyAdmin a través de `http://localhost/phpmyadmin` e inicia sesión con las credenciales por defecto (usuario: `root`, contraseña: vacía). En el panel izquierdo, haz clic en "Nueva" para crear una nueva base de datos. Nombra la base de datos como `registros` y selecciona la codificación `utf8mb4_unicode_ci` para garantizar el soporte completo de caracteres Unicode.

**Importación del Esquema**

Una vez creada la base de datos, selecciónala y navega a la pestaña "Importar". Selecciona el archivo `database_mysql.sql` incluido en el proyecto y ejecuta la importación. Este script creará automáticamente todas las tablas necesarias con sus respectivos índices y relaciones.

El esquema incluye las siguientes tablas principales:

- `usuarios`: Almacena información de usuarios con roles y credenciales hasheadas
- `sesiones`: Gestiona tokens JWT y sesiones activas
- `login_logs`: Registra todos los intentos de autenticación para auditoría
- `datos_sensores`: Almacena las lecturas de los sensores ESP32
- `configuracion`: Parámetros configurables del sistema

**Verificación de la Estructura**

Después de la importación, verifica que todas las tablas se hayan creado correctamente. Revisa que existan los usuarios por defecto en la tabla `usuarios` y que las configuraciones iniciales estén presentes en la tabla `configuracion`. Estos datos son esenciales para el funcionamiento inicial del sistema.

### Paso 3: Configuración del Backend Node.js

El backend Node.js actúa como el núcleo de procesamiento del sistema, manejando la autenticación, validación de datos y comunicación con la base de datos.

**Instalación de Dependencias**

Navega al directorio `backend` del proyecto y ejecuta `npm install` para instalar todas las dependencias necesarias. Este proceso descargará e instalará automáticamente todas las librerías especificadas en el archivo `package.json`, incluyendo Express.js, MySQL2, JWT, y todas las dependencias de seguridad.

**Configuración de Variables de Entorno**

El archivo `.env` contiene todas las configuraciones sensibles del sistema. Revisa y ajusta las siguientes variables según tu entorno:

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
```

Es crucial cambiar el `JWT_SECRET` por una clave segura y única en entornos de producción. Esta clave se utiliza para firmar y verificar los tokens de autenticación, por lo que su seguridad es fundamental para la integridad del sistema.

**Inicio del Servidor**

Para iniciar el servidor en modo de desarrollo, ejecuta `npm run dev` desde el directorio backend. El servidor se iniciará en el puerto 3001 por defecto y mostrará mensajes de confirmación sobre la conexión a la base de datos y la disponibilidad de los endpoints.

El servidor incluye middleware de logging que registra todas las requests entrantes, facilitando la depuración y el monitoreo del sistema. También implementa rate limiting para prevenir ataques de fuerza bruta y abuso de la API.

### Paso 4: Configuración del Frontend React

La aplicación React proporciona una interfaz de usuario moderna y responsiva para interactuar con el sistema de monitoreo.

**Instalación y Configuración**

El frontend ya está preconfigurado con todas las dependencias necesarias. Navega al directorio `frontend` y ejecuta `pnpm install` para instalar las dependencias. El proyecto utiliza Vite como bundler para un desarrollo rápido con hot reload.

**Configuración de la API**

En el archivo `src/hooks/useAuth.jsx`, verifica que la URL base de la API apunte correctamente a tu servidor backend:

```javascript
const API_BASE = 'http://localhost:3001/api'
```

Si tu servidor backend está ejecutándose en una IP diferente o puerto distinto, ajusta esta configuración en consecuencia.

**Inicio del Servidor de Desarrollo**

Para iniciar el servidor de desarrollo de React, ejecuta `pnpm run dev --host` desde el directorio frontend. Esto iniciará el servidor en el puerto 5173 y habilitará el acceso desde otras máquinas en la red local, lo cual es útil para pruebas en dispositivos móviles.

La aplicación incluye un sistema de enrutamiento que maneja automáticamente la autenticación y redirección de usuarios. Los usuarios no autenticados son redirigidos automáticamente a la página de login, mientras que los usuarios autenticados acceden directamente al dashboard.

### Paso 5: Configuración del ESP32

La configuración del ESP32 requiere tanto la preparación del hardware como la programación del firmware.

**Preparación del Hardware**

Conecta los sensores al ESP32 siguiendo este esquema de conexiones:

| Componente | Pin ESP32 | Descripción |
|------------|-----------|-------------|
| DHT11 VCC  | 3.3V      | Alimentación positiva |
| DHT11 GND  | GND       | Tierra común |
| DHT11 DATA | GPIO 16   | Señal de datos digital |
| MQ2 VCC    | 3.3V      | Alimentación positiva |
| MQ2 GND    | GND       | Tierra común |
| MQ2 A0     | GPIO 2    | Señal analógica |

Asegúrate de que todas las conexiones estén firmes y que no haya cortocircuitos. El sensor DHT11 puede requerir una resistencia pull-up de 10kΩ entre el pin de datos y VCC, aunque muchos módulos comerciales ya la incluyen.

**Configuración del Arduino IDE**

Instala el Arduino IDE y configura el soporte para ESP32 agregando la URL del gestor de tarjetas: `https://dl.espressif.com/dl/package_esp32_index.json` en las preferencias. Luego, instala el paquete "ESP32 by Espressif Systems" desde el gestor de tarjetas.

Instala las librerías necesarias desde el gestor de librerías:
- ArduinoJson (versión 6.x)
- DHT sensor library (por Adafruit)
- Adafruit Unified Sensor

**Programación del Firmware**

Abre el archivo `esp32_sketch_updated.ino` en el Arduino IDE y modifica las siguientes configuraciones:

```cpp
// Configuración WiFi
const char* ssid = "TU_WIFI_SSID";
const char* password = "TU_WIFI_PASSWORD";

// Configuración del servidor
const char* serverURL = "http://192.168.1.100:3001";
```

Reemplaza `TU_WIFI_SSID` y `TU_WIFI_PASSWORD` con las credenciales de tu red WiFi. La URL del servidor debe apuntar a la dirección IP de la máquina donde está ejecutándose el backend Node.js.

Para obtener la dirección IP de tu máquina, ejecuta `ipconfig` en Windows o `ifconfig` en Linux/macOS y busca la dirección IPv4 de tu adaptador de red activo.

**Carga del Firmware**

Conecta el ESP32 a tu computadora vía USB, selecciona la placa correcta (ESP32 Dev Module) y el puerto correspondiente en el Arduino IDE. Compila y sube el sketch al ESP32. Una vez completada la carga, abre el monitor serie a 115200 baudios para ver los mensajes de depuración.

El firmware incluye un sistema de comandos por puerto serie que permite interactuar con el ESP32 para depuración y configuración. Comandos disponibles incluyen `status`, `test`, `auth`, `wifi`, y `help`.

## Uso del Sistema

### Acceso Web y Autenticación

Una vez que todos los componentes estén configurados y ejecutándose, puedes acceder al sistema a través del navegador web navegando a la dirección donde está ejecutándose el frontend React (típicamente `http://localhost:5173`).

El sistema incluye usuarios de demostración preconfigurados para facilitar las pruebas iniciales:

**Usuario Administrador**
- Correo: `admin@esp32.com`
- Contraseña: `admin123`
- Permisos: Acceso completo al sistema, gestión de usuarios

**Usuario Estándar**
- Correo: `usuario@esp32.com`
- Contraseña: `usuario123`
- Permisos: Acceso de solo lectura al dashboard

El sistema de autenticación utiliza JWT (JSON Web Tokens) para mantener las sesiones de usuario de forma segura. Los tokens tienen una duración configurable (1 hora por defecto) y se renuevan automáticamente mientras el usuario esté activo.

### Dashboard Principal

El dashboard principal proporciona una vista completa del estado del sistema y los datos de sensores en tiempo real. La interfaz está organizada en varias secciones principales:

**Indicador de Estado de Conexión**
En la parte superior del dashboard se muestra el estado de conexión del ESP32. Un indicador verde con el ícono de WiFi indica que el dispositivo está conectado y enviando datos regularmente. Si el dispositivo se desconecta o deja de enviar datos, el indicador cambia a rojo con un ícono de WiFi desconectado.

**Tarjetas de Sensores**
Tres tarjetas prominentes muestran los valores actuales de cada sensor:
- Temperatura: Mostrada en grados Celsius con el promedio de las últimas 24 horas
- Humedad: Mostrada en porcentaje con estadísticas históricas
- Gas: Valor numérico del sensor MQ2 con tendencias

Cada tarjeta incluye iconos intuitivos y cambia de color si los valores superan los umbrales configurados.

**Sistema de Alertas**
Las alertas aparecen automáticamente en la parte superior del dashboard cuando los sensores detectan valores fuera de los rangos normales. Las alertas se clasifican por nivel de severidad:
- Warning (Amarillo): Para valores elevados pero no críticos
- Danger (Rojo): Para valores que requieren atención inmediata

**Gráficos Históricos**
Un gráfico de líneas interactivo muestra la evolución temporal de los tres sensores. El gráfico utiliza diferentes colores para cada sensor y permite hacer zoom y desplazarse por los datos históricos. Los datos se actualizan automáticamente cada 10 segundos.

**Estadísticas del Sistema**
En la parte inferior se muestran estadísticas agregadas de las últimas 24 horas, incluyendo el número total de registros, valores máximos y mínimos, y promedios para cada sensor.

### Monitoreo del ESP32

El ESP32 envía datos automáticamente cada 5 segundos (configurable) al endpoint `/api/sensors` del backend. Cada transmisión incluye:

- Timestamp de la lectura
- Valor de temperatura en grados Celsius
- Valor de humedad en porcentaje
- Valor analógico del sensor de gas
- Identificador único del dispositivo ESP32

El sistema incluye mecanismos de recuperación automática en caso de pérdida de conectividad WiFi o errores de transmisión. El ESP32 intentará reconectarse automáticamente y continuará enviando datos una vez restablecida la conexión.

### Gestión de Usuarios (Solo Administradores)

Los usuarios con rol de administrador tienen acceso a funcionalidades adicionales de gestión del sistema:

**Creación de Usuarios**
Los administradores pueden crear nuevos usuarios especificando nombre, correo electrónico, contraseña y rol. El sistema valida automáticamente que los correos electrónicos sean únicos y que las contraseñas cumplan con los requisitos mínimos de seguridad.

**Modificación de Perfiles**
Los usuarios pueden modificar su propia información de perfil, incluyendo nombre y correo electrónico. Los administradores pueden modificar cualquier usuario y cambiar roles según sea necesario.

**Gestión de Sesiones**
El sistema mantiene un registro de todas las sesiones activas y permite a los administradores invalidar sesiones específicas si es necesario por razones de seguridad.

## API REST Endpoints

El backend Node.js expone una API RESTful completa que permite la integración con otros sistemas y el desarrollo de aplicaciones adicionales.

### Autenticación

**POST /api/auth/login**
Autentica un usuario y devuelve tokens de acceso.

Cuerpo de la petición:
```json
{
  "correo": "usuario@ejemplo.com",
  "contraseña": "password123"
}
```

Respuesta exitosa:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "nombre": "Usuario Ejemplo",
      "correo": "usuario@ejemplo.com",
      "rol": "usuario"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "1h"
  }
}
```

**POST /api/auth/register**
Registra un nuevo usuario en el sistema.

Cuerpo de la petición:
```json
{
  "nombre": "Nuevo Usuario",
  "correo": "nuevo@ejemplo.com",
  "contraseña": "password123",
  "rol": "usuario"
}
```

**POST /api/auth/logout**
Invalida la sesión actual del usuario.

Headers requeridos:
```
Authorization: Bearer <token>
```

**GET /api/auth/me**
Obtiene información del usuario autenticado.

### Datos de Sensores

**POST /api/sensors**
Endpoint utilizado por el ESP32 para enviar datos de sensores.

Cuerpo de la petición:
```json
{
  "temperatura": 25.5,
  "humedad": 60.0,
  "gas": 300,
  "esp32_id": "ESP32_001"
}
```

Respuesta exitosa:
```json
{
  "success": true,
  "message": "Datos de sensores recibidos exitosamente",
  "data": {
    "id": 12345,
    "temperatura": 25.5,
    "humedad": 60.0,
    "gas": 300,
    "esp32_id": "ESP32_001",
    "alertas": [],
    "timestamp": "2024-08-22T10:30:00.000Z"
  }
}
```

**GET /api/sensors**
Obtiene datos históricos de sensores con paginación.

Parámetros de consulta opcionales:
- `limit`: Número máximo de registros (1-1000, default: 50)
- `page`: Página de resultados (default: 1)
- `esp32_id`: Filtrar por ID específico del ESP32
- `desde`: Fecha de inicio (formato ISO 8601)
- `hasta`: Fecha de fin (formato ISO 8601)

**GET /api/sensors/latest**
Obtiene la última lectura de sensores.

**GET /api/sensors/stats**
Obtiene estadísticas agregadas de los sensores.

Parámetros opcionales:
- `esp32_id`: ID específico del ESP32
- `periodo`: Período de tiempo (1h, 24h, 7d, 30d)

### Gestión de Usuarios

**GET /api/users**
Obtiene lista de usuarios (solo administradores).

**GET /api/users/:id**
Obtiene información de un usuario específico.

**PUT /api/users/:id**
Actualiza información de un usuario.

**PUT /api/users/:id/password**
Cambia la contraseña de un usuario.

**DELETE /api/users/:id**
Desactiva un usuario (solo administradores).

## Seguridad y Mejores Prácticas

### Autenticación y Autorización

El sistema implementa múltiples capas de seguridad para proteger tanto los datos como el acceso al sistema:

**JSON Web Tokens (JWT)**
La autenticación se basa en JWT, que proporciona un mecanismo stateless y escalable para mantener sesiones de usuario. Los tokens incluyen información del usuario y tienen una expiración configurable. El sistema utiliza tanto tokens de acceso (corta duración) como tokens de refresh (larga duración) para balancear seguridad y usabilidad.

**Hash de Contraseñas**
Todas las contraseñas se almacenan usando bcrypt con un factor de costo configurable (12 rounds por defecto). Esto garantiza que incluso si la base de datos se ve comprometida, las contraseñas permanezcan seguras contra ataques de fuerza bruta.

**Validación de Entrada**
Todos los endpoints utilizan esquemas de validación Joi para verificar que los datos de entrada cumplan con los formatos esperados. Esto previene ataques de inyección y garantiza la integridad de los datos.

### Protección de la API

**Rate Limiting**
El sistema implementa limitación de velocidad para prevenir ataques de fuerza bruta y abuso de la API. Por defecto, se permiten 100 requests por ventana de 15 minutos por dirección IP.

**CORS (Cross-Origin Resource Sharing)**
La configuración de CORS está optimizada para permitir requests desde el frontend React mientras bloquea accesos no autorizados desde otros dominios.

**Helmet.js**
Se utiliza Helmet.js para establecer headers de seguridad HTTP que protegen contra vulnerabilidades comunes como XSS, clickjacking y otros ataques.

### Logging y Auditoría

**Registro de Actividades**
El sistema mantiene logs detallados de todas las actividades importantes:
- Intentos de login (exitosos y fallidos)
- Operaciones de usuarios (creación, modificación, eliminación)
- Acceso a datos de sensores
- Errores del sistema

**Rotación de Logs**
Los archivos de log se rotan automáticamente para prevenir que crezcan indefinidamente y afecten el rendimiento del sistema.

### Recomendaciones para Producción

**Variables de Entorno**
- Cambiar todas las claves secretas por valores únicos y seguros
- Utilizar contraseñas robustas para la base de datos
- Configurar CORS para dominios específicos en lugar de permitir todos

**Base de Datos**
- Implementar backups automáticos regulares
- Configurar replicación para alta disponibilidad
- Optimizar índices según patrones de uso reales

**Infraestructura**
- Utilizar HTTPS en lugar de HTTP
- Implementar un proxy reverso (nginx, Apache)
- Configurar firewalls apropiados
- Monitorear recursos del sistema

## Personalización y Extensión

### Configuración de Umbrales de Alertas

Los umbrales para las alertas se pueden modificar directamente en la base de datos a través de la tabla `configuracion`:

```sql
-- Cambiar temperatura máxima a 40°C
UPDATE configuracion SET valor = '40.0' WHERE clave = 'temperatura_max';

-- Cambiar humedad máxima a 85%
UPDATE configuracion SET valor = '85.0' WHERE clave = 'humedad_max';

-- Cambiar nivel máximo de gas a 600
UPDATE configuracion SET valor = '600' WHERE clave = 'gas_max';
```

### Adición de Nuevos Sensores

Para agregar nuevos tipos de sensores al sistema:

1. **Modificar el ESP32**: Agregar código para leer el nuevo sensor
2. **Actualizar la Base de Datos**: Agregar columnas a la tabla `datos_sensores`
3. **Modificar el Backend**: Actualizar esquemas de validación y endpoints
4. **Actualizar el Frontend**: Agregar visualización para el nuevo sensor

### Personalización de la Interfaz

El frontend React utiliza Tailwind CSS, lo que facilita la personalización de estilos:

**Cambio de Colores**
Modifica las variables CSS en `src/App.css` para cambiar la paleta de colores del sistema.

**Componentes Adicionales**
Agrega nuevos componentes en el directorio `src/components/` siguiendo la estructura existente.

**Gráficos Personalizados**
Utiliza la librería Recharts para crear visualizaciones adicionales de los datos.

## Solución de Problemas

### Problemas Comunes del ESP32

**Error de Conexión WiFi**
- Verificar SSID y contraseña
- Asegurar que la red sea de 2.4GHz (el ESP32 no soporta 5GHz)
- Comprobar la intensidad de la señal WiFi
- Reiniciar el router si es necesario

**Sensores No Funcionan**
- Verificar conexiones físicas
- Comprobar alimentación de los sensores (3.3V)
- Probar con sensores conocidos como funcionales
- Revisar el código de inicialización de sensores

**Error HTTP al Enviar Datos**
- Verificar que el servidor backend esté ejecutándose
- Comprobar la dirección IP y puerto del servidor
- Revisar configuración de firewall
- Verificar conectividad de red entre ESP32 y servidor

### Problemas del Backend Node.js

**Error de Conexión a MySQL**
- Verificar que MySQL esté ejecutándose en XAMPP
- Comprobar credenciales en el archivo `.env`
- Asegurar que la base de datos `registros` exista
- Verificar que las tablas estén creadas correctamente

**Errores de Autenticación**
- Verificar que el JWT_SECRET esté configurado
- Comprobar que los usuarios existan en la base de datos
- Revisar logs de intentos de login
- Verificar configuración de CORS

**Problemas de Rendimiento**
- Monitorear uso de CPU y memoria
- Optimizar consultas de base de datos
- Implementar caché si es necesario
- Revisar configuración de rate limiting

### Problemas del Frontend React

**Error de Conexión a la API**
- Verificar que el backend esté ejecutándose
- Comprobar la URL de la API en `useAuth.jsx`
- Revisar configuración de CORS en el backend
- Verificar conectividad de red

**Problemas de Renderizado**
- Comprobar errores en la consola del navegador
- Verificar que todas las dependencias estén instaladas
- Revisar compatibilidad del navegador
- Limpiar caché del navegador

**Datos No Se Actualizan**
- Verificar que el ESP32 esté enviando datos
- Comprobar que el backend esté recibiendo y procesando datos
- Revisar intervalos de actualización en el frontend
- Verificar estado de autenticación del usuario

## Mantenimiento y Monitoreo

### Tareas de Mantenimiento Regulares

**Limpieza de Datos Antiguos**
Para mantener el rendimiento óptimo, es recomendable limpiar datos antiguos periódicamente:

```sql
-- Eliminar datos de sensores anteriores a 30 días
DELETE FROM datos_sensores WHERE fecha_registro < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Limpiar logs de login antiguos
DELETE FROM login_logs WHERE fecha < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Eliminar sesiones expiradas
DELETE FROM sesiones WHERE fecha_expiracion < NOW() OR activa = FALSE;
```

**Backup de la Base de Datos**
Implementar backups regulares usando mysqldump:

```bash
# Backup completo
mysqldump -u root -p registros > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup solo de datos (sin estructura)
mysqldump -u root -p --no-create-info registros > data_backup_$(date +%Y%m%d_%H%M%S).sql
```

**Monitoreo de Logs**
Revisar regularmente los logs del sistema para identificar:
- Patrones de uso anómalos
- Intentos de acceso no autorizados
- Errores recurrentes del sistema
- Problemas de conectividad del ESP32

### Métricas de Rendimiento

**Indicadores Clave**
- Tiempo de respuesta de la API (< 200ms para operaciones normales)
- Disponibilidad del sistema (objetivo: 99.9%)
- Frecuencia de datos del ESP32 (cada 5 segundos)
- Uso de memoria y CPU del servidor

**Alertas Automáticas**
Configurar alertas para:
- Pérdida de conectividad del ESP32 por más de 1 minuto
- Errores de base de datos
- Uso excesivo de recursos del servidor
- Intentos de login fallidos repetidos

### Escalabilidad

**Múltiples Dispositivos ESP32**
Para soportar múltiples dispositivos ESP32:

1. Asignar IDs únicos a cada dispositivo
2. Modificar la base de datos para indexar por `esp32_id`
3. Actualizar el frontend para filtrar por dispositivo
4. Implementar gestión de dispositivos en el backend

**Balanceador de Carga**
Para entornos de alta disponibilidad:
- Implementar múltiples instancias del backend
- Utilizar nginx o HAProxy como balanceador
- Configurar sesiones compartidas (Redis)
- Implementar health checks

## Conclusión

Este sistema ESP32 con Node.js, React y MySQL representa una solución completa y moderna para el monitoreo IoT. La arquitectura modular permite fácil mantenimiento y extensión, mientras que las tecnologías utilizadas garantizan escalabilidad y rendimiento.

La separación clara entre frontend, backend y base de datos facilita el desarrollo colaborativo y permite actualizaciones independientes de cada componente. El sistema de autenticación robusto y las medidas de seguridad implementadas lo hacen adecuado tanto para entornos de desarrollo como de producción.

Las características de tiempo real, alertas automáticas y visualización interactiva proporcionan una experiencia de usuario superior comparada con sistemas de monitoreo tradicionales. La documentación completa y los ejemplos incluidos facilitan la implementación y personalización según necesidades específicas.

Este proyecto sirve como base sólida para sistemas IoT más complejos y puede extenderse fácilmente para incluir funcionalidades adicionales como notificaciones push, integración con servicios en la nube, o análisis avanzado de datos mediante machine learning.


