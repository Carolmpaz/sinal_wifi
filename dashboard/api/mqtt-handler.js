// Handler separado para MQTT - armazena dados em memória global
const mqtt = require('mqtt');

const MQTT_CONFIG = {
  broker: 'mqtt://broker.hivemq.com',
  port: 1883,
  topic: 'esp32/wifi/rssi',
  clientId: 'server-client-' + Math.random().toString(16).substr(2, 8)
};

// Armazenamento global de dados (compartilhado entre requisições na mesma instância)
let latestData = null;
let mqttStatus = { connected: false };
let mqttClient = null;

function getMqttClient() {
  if (mqttClient && mqttClient.connected) {
    return mqttClient;
  }

  // Conecta ao MQTT
  mqttClient = mqtt.connect(MQTT_CONFIG.broker, {
    clientId: MQTT_CONFIG.clientId + '-' + Date.now(),
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 4000
  });

  mqttClient.on('connect', () => {
    console.log('✅ Conectado ao broker MQTT:', MQTT_CONFIG.broker);
    mqttStatus.connected = true;
    
    mqttClient.subscribe(MQTT_CONFIG.topic, (err) => {
      if (err) {
        console.error('❌ Erro ao subscrever:', err);
      } else {
        console.log('✅ Inscrito no tópico:', MQTT_CONFIG.topic);
      }
    });
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      latestData = {
        ...data,
        timestamp: new Date().toISOString()
      };
      console.log('📨 Dados recebidos:', latestData);
    } catch (error) {
      console.error('❌ Erro ao parsear:', error);
    }
  });

  mqttClient.on('error', (error) => {
    console.error('❌ Erro MQTT:', error);
    mqttStatus.connected = false;
  });

  mqttClient.on('close', () => {
    console.log('🔌 Conexão MQTT fechada');
    mqttStatus.connected = false;
  });

  mqttClient.on('offline', () => {
    console.log('📴 Cliente MQTT offline');
    mqttStatus.connected = false;
  });

  return mqttClient;
}

// Inicializa conexão
getMqttClient();

module.exports = {
  getLatestData: () => latestData,
  getMqttStatus: () => ({ ...mqttStatus, topic: MQTT_CONFIG.topic, broker: MQTT_CONFIG.broker }),
  ensureConnection: () => {
    const client = getMqttClient();
    if (!client.connected) {
      mqttStatus.connected = false;
    }
    return client;
  }
};

