#include <WiFi.h>
#include <PubSubClient.h>


// WiFi
const char* WIFI_SSID     = "A55 de Caroline";
const char* WIFI_PASSWORD = "Caroline2019@";

// MQTT
const char* MQTT_SERVER = "broker.hivemq.com";     
const uint16_t MQTT_PORT = 1883;
const char* MQTT_USER   = "";     
const char* MQTT_PASS   = "";      

const char* MQTT_TOPIC = "esp32/wifi/rssi";

// Dispositivo
const char* DEVICE_ID = "esp32-01";

// Intervalo de publicação (ms)
const unsigned long PUBLISH_INTERVAL_MS = 1000UL; // 1s 



WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastPublish = 0;

void setupWiFi() {
  delay(10);
  Serial.print("[WiFi] Conectando a ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++tries % 40 == 0) {
      Serial.println();
      Serial.println("[WiFi] Tentando novamente...");
    }
  }
  Serial.println();
  Serial.print("[WiFi] Conectado. IP: ");
  Serial.println(WiFi.localIP());
}

bool mqttConnect() {
  if (client.connected()) return true;
  Serial.print("[MQTT] Conectando ao broker...");
  String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
  bool ok;
  if (strlen(MQTT_USER) == 0) {
    ok = client.connect(clientId.c_str());
  } else {
    ok = client.connect(clientId.c_str(), MQTT_USER, MQTT_PASS);
  }
  if (ok) {
    Serial.println(" ok!");
    return true;
  } else {
    Serial.print(" falha, rc=");
    Serial.println(client.state());
    return false;
  }
}

void setup() {
  Serial.begin(115200);
  delay(100);

  setupWiFi();

  client.setServer(MQTT_SERVER, MQTT_PORT);

  randomSeed(analogRead(0));
}

void loop() {
  // Mantém WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Perdido. Reconectando...");
    setupWiFi();
  }

  // Mantém MQTT
  if (!client.connected()) {
    mqttConnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL_MS) {
    lastPublish = now;
    long rssi = WiFi.RSSI(); // já retorna em dBm (valores negativos)
    // Cria payload JSON simples
    char payload[128];
    // ts em ms desde boot
    snprintf(payload, sizeof(payload),
             "{\"device\":\"%s\",\"rssi\":%ld,\"ts\":%lu}",
             DEVICE_ID, rssi, now);

    // Publica no tópico
    bool ok = client.publish(MQTT_TOPIC, payload);
    // Imprime no Serial
    Serial.print("[PUB] ");
    Serial.print(MQTT_TOPIC);
    Serial.print(" -> ");
    Serial.println(payload);
    if (!ok) {
      Serial.println("[PUB] Falha ao publicar.");
    }
  }
}
