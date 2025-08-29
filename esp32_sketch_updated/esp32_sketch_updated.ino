#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "DHT.h"

const char* ssid = "DOCENTE_SENATI";          // Cambiar por tu SSID
const char* password = "12345678";   // Cambiar por tu contraseña WiFi

// --- Configuración del Servidor Node.js ---
const char* serverURL = "http://192.168.1.100:3001"; // Cambiar por la IP de tu servidor
const char* sensorsEndpoint = "/api/sensors";
const char* loginEndpoint = "/api/auth/login";

// --- Configuración DHT ---
#define DHTPIN 16       // Pin del DHT11
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// --- Configuración MQ2 ---
#define MQ2PIN 2        // Pin analógico del MQ2

// --- Configuración LED de estado ---
#define LED_PIN 2       // Pin del LED integrado

// --- Variables globales ---
String authToken = "";
String esp32_id = "ESP32_001";
unsigned long lastSensorRead = 0;
unsigned long sensorInterval = 5000; // 5 segundos
bool isAuthenticated = false;

// --- Credenciales para autenticación (opcional) ---
const char* userEmail = "la5989175@gmail.com";
const char* userPassword = "fernanfloo123";

void setup() {
  Serial.begin(115200);
  
  // Configurar LED
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  // Inicializar DHT
  dht.begin();
  
  // Conectar a WiFi
  connectToWiFi();
  
  // Intentar autenticación (opcional)
  // authenticateUser();
  
  Serial.println("✅ ESP32 iniciado correctamente");
  Serial.println("📡 Enviando datos cada " + String(sensorInterval/1000) + " segundos");
  Serial.println("🌐 Servidor: " + String(serverURL));
}

void loop() {
  // Verificar conexión WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi desconectado, reintentando...");
    connectToWiFi();
    return;
  }
  
  // Leer y enviar datos de sensores
  if (millis() - lastSensorRead >= sensorInterval) {
    readAndSendSensorData();
    lastSensorRead = millis();
  }
  
  // Manejar comandos por Serial
  handleSerialCommands();
  
  delay(100); // Pequeña pausa para no saturar el procesador
}

/**
 * Conectar a WiFi
 */
void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("🔄 Conectando a WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("✅ Conectado a WiFi");
    Serial.println("📍 IP: " + WiFi.localIP().toString());
    Serial.println("📶 RSSI: " + String(WiFi.RSSI()) + " dBm");
    digitalWrite(LED_PIN, HIGH); // Encender LED cuando esté conectado
  } else {
    Serial.println();
    Serial.println("❌ Error conectando a WiFi");
    digitalWrite(LED_PIN, LOW);
  }
}

/**
 * Autenticar usuario (opcional)
 */
void authenticateUser() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ No hay conexión WiFi para autenticación");
    return;
  }
  
  HTTPClient http;
  String url = String(serverURL) + String(loginEndpoint);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Crear JSON de login
  DynamicJsonDocument loginDoc(1024);
  loginDoc["correo"] = userEmail;
  loginDoc["contraseña"] = userPassword;
  
  String loginJson;
  serializeJson(loginDoc, loginJson);
  
  Serial.println("🔐 Intentando autenticación...");
  Serial.println("📤 URL: " + url);
  
  int httpResponseCode = http.POST(loginJson);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("📥 Respuesta HTTP: " + String(httpResponseCode));
    
    // Parsear respuesta
    DynamicJsonDocument responseDoc(2048);
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      if (responseDoc["success"] == true) {
        authToken = responseDoc["data"]["token"].as<String>();
        isAuthenticated = true;
        Serial.println("✅ Autenticación exitosa");
        Serial.println("🔑 Token obtenido");
      } else {
        Serial.println("❌ Error de autenticación: " + responseDoc["error"].as<String>());
      }
    } else {
      Serial.println("❌ Error parseando respuesta de autenticación");
    }
  } else {
    Serial.println("❌ Error HTTP en autenticación: " + String(httpResponseCode));
  }
  
  http.end();
}

/**
 * Leer sensores y enviar datos
 */
void readAndSendSensorData() {
  // Leer sensores
  float temperatura = dht.readTemperature();
  float humedad = dht.readHumidity();
  int mq2Valor = analogRead(MQ2PIN);
  
  // Verificar lecturas válidas
  if (isnan(temperatura) || isnan(humedad)) {
    Serial.println("❌ Error al leer DHT11");
    return;
  }
  
  // Mostrar valores en Serial
  Serial.println("📊 Datos de sensores:");
  Serial.println("   🌡️  Temperatura: " + String(temperatura) + "°C");
  Serial.println("   💧 Humedad: " + String(humedad) + "%");
  Serial.println("   💨 Gas: " + String(mq2Valor));
  
  // Enviar datos al servidor
  sendSensorData(temperatura, humedad, mq2Valor);
}

/**
 * Enviar datos de sensores al servidor Node.js
 */
void sendSensorData(float temperatura, float humedad, int gas) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ No hay conexión WiFi");
    return;
  }
  
  HTTPClient http;
  String url = String(serverURL) + String(sensorsEndpoint);
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Agregar token de autenticación si está disponible
  if (isAuthenticated && authToken.length() > 0) {
    http.addHeader("Authorization", "Bearer " + authToken);
  }
  
  // Crear JSON con datos de sensores
  DynamicJsonDocument sensorDoc(1024);
  sensorDoc["temperatura"] = temperatura;
  sensorDoc["humedad"] = humedad;
  sensorDoc["gas"] = gas;
  sensorDoc["esp32_id"] = esp32_id;
  
  String sensorJson;
  serializeJson(sensorDoc, sensorJson);
  
  Serial.println("📤 Enviando datos a: " + url);
  
  // Enviar datos
  int httpResponseCode = http.POST(sensorJson);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("📥 Respuesta HTTP: " + String(httpResponseCode));
    
    // Parsear respuesta
    DynamicJsonDocument responseDoc(2048);
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      if (responseDoc["success"] == true) {
        Serial.println("✅ Datos enviados exitosamente");
        
        // Verificar alertas
        if (responseDoc["data"]["alertas"].size() > 0) {
          Serial.println("⚠️  ALERTAS DETECTADAS:");
          for (JsonVariant alerta : responseDoc["data"]["alertas"].as<JsonArray>()) {
            Serial.println("   " + alerta["mensaje"].as<String>());
          }
        }
        
        // Parpadear LED para indicar envío exitoso
        blinkLED(2, 200);
      } else {
        Serial.println("❌ Error del servidor: " + responseDoc["error"].as<String>());
        blinkLED(5, 100);
      }
    } else {
      Serial.println("❌ Error parseando respuesta JSON");
      Serial.println("📄 Respuesta cruda: " + response);
      blinkLED(3, 150);
    }
  } else {
    Serial.println("❌ Error HTTP: " + String(httpResponseCode));
    
    // Mostrar detalles del error
    if (httpResponseCode == -1) {
      Serial.println("💡 Posible problema: Servidor no disponible");
    } else if (httpResponseCode == -11) {
      Serial.println("💡 Posible problema: Timeout de conexión");
    }
    
    // Parpadear LED para indicar error
    blinkLED(5, 100);
  }
  
  http.end();
}

/**
 * Parpadear LED
 */
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
  }
}

/**
 * Función para manejar comandos por Serial
 */
void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "status") {
      Serial.println("📊 Estado del ESP32:");
      Serial.println("   WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Conectado" : "Desconectado"));
      Serial.println("   IP: " + WiFi.localIP().toString());
      Serial.println("   RSSI: " + String(WiFi.RSSI()) + " dBm");
      Serial.println("   Autenticado: " + String(isAuthenticated ? "Sí" : "No"));
      Serial.println("   Servidor: " + String(serverURL));
      Serial.println("   ESP32 ID: " + esp32_id);
      Serial.println("   Intervalo: " + String(sensorInterval/1000) + "s");
      Serial.println("   Memoria libre: " + String(ESP.getFreeHeap()) + " bytes");
    } else if (command == "test") {
      Serial.println("🧪 Enviando datos de prueba...");
      readAndSendSensorData();
    } else if (command == "auth") {
      Serial.println("🔐 Reintentando autenticación...");
      authenticateUser();
    } else if (command == "wifi") {
      Serial.println("📶 Reintentando conexión WiFi...");
      connectToWiFi();
    } else if (command.startsWith("interval ")) {
      int newInterval = command.substring(9).toInt();
      if (newInterval >= 1000) {
        sensorInterval = newInterval;
        Serial.println("⏱️  Intervalo cambiado a " + String(newInterval/1000) + " segundos");
      } else {
        Serial.println("❌ Intervalo mínimo: 1000ms");
      }
    } else if (command.startsWith("server ")) {
      String newServer = command.substring(7);
      if (newServer.length() > 0) {
        serverURL = newServer.c_str();
        Serial.println("🌐 Servidor cambiado a: " + String(serverURL));
      } else {
        Serial.println("❌ URL de servidor inválida");
      }
    } else if (command == "help") {
      Serial.println("📋 Comandos disponibles:");
      Serial.println("   status     - Mostrar estado del sistema");
      Serial.println("   test       - Enviar datos de prueba");
      Serial.println("   auth       - Reintentar autenticación");
      Serial.println("   wifi       - Reconectar WiFi");
      Serial.println("   interval X - Cambiar intervalo (ms)");
      Serial.println("   server URL - Cambiar URL del servidor");
      Serial.println("   help       - Mostrar esta ayuda");
    } else if (command.length() > 0) {
      Serial.println("❓ Comando desconocido: " + command);
      Serial.println("💡 Escribe 'help' para ver comandos disponibles");
    }
  }
}

