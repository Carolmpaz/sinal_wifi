const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuração Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configurações MQTT
const MQTT_CONFIG = {
  broker: 'mqtt://broker.hivemq.com',
  port: 1883,
  topic: 'esp32/wifi/rssi',
  clientId: 'server-client-' + Math.random().toString(16).substr(2, 8)
};

let mqttClient = null;
let isMqttConnected = false;

// Função para conectar ao MQTT
function connectMQTT() {
  if (mqttClient && mqttClient.connected) {
    console.log('MQTT já está conectado');
    return;
  }

  console.log('Conectando ao broker MQTT...');
  
  mqttClient = mqtt.connect(MQTT_CONFIG.broker, {
    clientId: MQTT_CONFIG.clientId,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 4000
  });

  mqttClient.on('connect', () => {
    console.log('✅ Conectado ao broker MQTT:', MQTT_CONFIG.broker);
    isMqttConnected = true;
    
    // Notifica todos os clientes Socket.IO
    io.emit('mqtt-status', { connected: true });
    
    // Subscreve ao tópico
    mqttClient.subscribe(MQTT_CONFIG.topic, (err) => {
      if (err) {
        console.error('❌ Erro ao subscrever no tópico:', err);
      } else {
        console.log('✅ Inscrito no tópico:', MQTT_CONFIG.topic);
      }
    });
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 Mensagem recebida:', data);
      
      // Envia dados para todos os clientes conectados via Socket.IO
      io.emit('rssi-data', {
        ...data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao parsear mensagem MQTT:', error);
    }
  });

  mqttClient.on('error', (error) => {
    console.error('❌ Erro MQTT:', error);
    isMqttConnected = false;
    io.emit('mqtt-status', { connected: false, error: error.message });
  });

  mqttClient.on('close', () => {
    console.log('🔌 Conexão MQTT fechada');
    isMqttConnected = false;
    io.emit('mqtt-status', { connected: false });
  });

  mqttClient.on('offline', () => {
    console.log('📴 Cliente MQTT offline');
    isMqttConnected = false;
    io.emit('mqtt-status', { connected: false });
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 Reconectando ao MQTT...');
  });
}

// Socket.IO - conexão de clientes
io.on('connection', (socket) => {
  console.log('👤 Cliente conectado:', socket.id);
  
  // Envia status atual do MQTT
  socket.emit('mqtt-status', { connected: isMqttConnected });

  socket.on('disconnect', () => {
    console.log('👋 Cliente desconectado:', socket.id);
  });
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mqtt: {
      connected: isMqttConnected,
      broker: MQTT_CONFIG.broker,
      topic: MQTT_CONFIG.topic
    }
  });
});

// Rota para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicia conexão MQTT
connectMQTT();

// Porta do servidor (Vercel usa PORT ou 3000)
const PORT = process.env.PORT || 3000;

// Inicia servidor apenas se não estiver em ambiente serverless
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Aguardando dados do ESP32 no tópico: ${MQTT_CONFIG.topic}`);
  });
}

// Exporta para Vercel
module.exports = app;

