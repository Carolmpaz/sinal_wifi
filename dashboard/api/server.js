const express = require('express');
const cors = require('cors');
const path = require('path');
const { getLatestData, getMqttStatus, ensureConnection } = require('./mqtt-handler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Garante conexão MQTT ao inicializar
ensureConnection();

// Rota para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Endpoint para obter dados mais recentes (polling)
app.get('/api/data', (req, res) => {
  ensureConnection(); // Garante que está conectado
  const data = getLatestData();
  const status = getMqttStatus();
  
  res.json({
    success: true,
    data: data,
    mqtt: status,
    timestamp: new Date().toISOString()
  });
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  const status = getMqttStatus();
  res.json({
    status: 'ok',
    mqtt: status,
    timestamp: new Date().toISOString()
  });
});

// Server-Sent Events endpoint (melhor que polling puro)
app.get('/api/stream', (req, res) => {
  // Configura headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  // Envia status inicial
  const initialStatus = getMqttStatus();
  res.write(`data: ${JSON.stringify({ type: 'status', mqtt: initialStatus })}\n\n`);

  // Envia dados a cada segundo
  const interval = setInterval(() => {
    ensureConnection();
    const data = getLatestData();
    const status = getMqttStatus();
    
    if (data) {
      res.write(`data: ${JSON.stringify({ type: 'data', ...data, mqtt: status })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'status', mqtt: status })}\n\n`);
    }
  }, 1000);

  // Limpa intervalo quando cliente desconecta
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Exporta para Vercel
module.exports = app;
