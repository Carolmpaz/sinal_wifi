// Handler MQTT otimizado para Vercel serverless
const mqtt = require('mqtt');

const MQTT_CONFIG = {
  broker: 'mqtt://broker.hivemq.com',
  port: 1883,
  topic: 'esp32/wifi/rssi',
  clientId: 'vercel-client-' + Math.random().toString(16).substr(2, 8)
};

// Armazenamento global (por instância serverless)
let latestData = null;
let mqttStatus = { connected: false, lastCheck: null };
let mqttClient = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Função para criar nova conexão MQTT
function createMqttConnection() {
  // Fecha conexão anterior se existir
  if (mqttClient) {
    try {
      mqttClient.end(true);
    } catch (e) {
      console.log('Erro ao fechar conexão anterior:', e.message);
    }
  }

  const clientId = `${MQTT_CONFIG.clientId}-${Date.now()}-${Math.random().toString(16).substr(2, 8)}`;
  
  console.log('🔌 Criando nova conexão MQTT:', clientId);
  
  mqttClient = mqtt.connect(MQTT_CONFIG.broker, {
    clientId: clientId,
    clean: true,
    reconnectPeriod: 2000,
    connectTimeout: 5000,
    keepalive: 60
  });

  mqttClient.on('connect', () => {
    console.log('✅ Conectado ao broker MQTT:', MQTT_CONFIG.broker);
    mqttStatus.connected = true;
    mqttStatus.lastCheck = Date.now();
    connectionAttempts = 0;
    
    mqttClient.subscribe(MQTT_CONFIG.topic, { qos: 0 }, (err) => {
      if (err) {
        console.error('❌ Erro ao subscrever:', err);
        mqttStatus.connected = false;
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
        timestamp: new Date().toISOString(),
        receivedAt: Date.now()
      };
      console.log('📨 Dados recebidos:', data.rssi, 'dBm');
    } catch (error) {
      console.error('❌ Erro ao parsear mensagem:', error.message);
    }
  });

  mqttClient.on('error', (error) => {
    console.error('❌ Erro MQTT:', error.message);
    mqttStatus.connected = false;
    connectionAttempts++;
  });

  mqttClient.on('close', () => {
    console.log('🔌 Conexão MQTT fechada');
    mqttStatus.connected = false;
  });

  mqttClient.on('offline', () => {
    console.log('📴 Cliente MQTT offline');
    mqttStatus.connected = false;
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 Reconectando ao MQTT...');
    connectionAttempts++;
  });

  return mqttClient;
}

// Função para garantir conexão ativa
function ensureConnection() {
  // Se não há cliente ou cliente não está conectado
  if (!mqttClient || !mqttClient.connected) {
    // Verifica se não excedeu tentativas
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      createMqttConnection();
    } else {
      console.warn('⚠️ Máximo de tentativas de conexão atingido');
      mqttStatus.connected = false;
    }
  } else {
    // Verifica se conexão ainda está ativa (última checagem há mais de 30s)
    const now = Date.now();
    if (mqttStatus.lastCheck && (now - mqttStatus.lastCheck) > 30000) {
      mqttStatus.lastCheck = now;
      // Testa conexão enviando ping
      try {
        mqttClient._sendPacket({ cmd: 'pingreq' });
      } catch (e) {
        console.log('Conexão inativa, recriando...');
        createMqttConnection();
      }
    }
  }
  
  return mqttClient;
}

// Inicializa conexão imediatamente
try {
  createMqttConnection();
} catch (error) {
  console.error('Erro ao inicializar MQTT:', error.message);
}

// Exporta funções
module.exports = {
  getLatestData: () => latestData,
  getMqttStatus: () => ({
    connected: mqttStatus.connected,
    topic: MQTT_CONFIG.topic,
    broker: MQTT_CONFIG.broker,
    lastCheck: mqttStatus.lastCheck,
    attempts: connectionAttempts
  }),
  ensureConnection: ensureConnection
};
