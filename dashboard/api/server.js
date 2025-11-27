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

// Garante conexão MQTT ao inicializar o módulo
ensureConnection();

// Rota para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Endpoint para obter dados mais recentes (polling HTTP)
app.get('/api/data', (req, res) => {
  try {
    // Garante que está conectado
    ensureConnection();
    
    const data = getLatestData();
    const status = getMqttStatus();
    
    res.json({
      success: true,
      data: data,
      mqtt: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no endpoint /api/data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      mqtt: getMqttStatus()
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  try {
    const status = getMqttStatus();
    res.json({
      status: 'ok',
      mqtt: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Server-Sent Events endpoint (streaming)
app.get('/api/stream', (req, res) => {
  // Configura headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Desabilita buffering no nginx
  
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  // Envia status inicial imediatamente
  try {
    ensureConnection();
    const initialStatus = getMqttStatus();
    const initialData = getLatestData();
    
    res.write(`data: ${JSON.stringify({ 
      type: 'status', 
      mqtt: initialStatus,
      data: initialData 
    })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      message: error.message 
    })}\n\n`);
  }

  // Envia dados periodicamente
  let lastSentData = null;
  let lastStatusCheck = null;
  const interval = setInterval(() => {
    try {
      ensureConnection();
      const data = getLatestData();
      const status = getMqttStatus();
      
      // Só envia se houver novos dados ou status mudou
      const hasNewData = data && (!lastSentData || data.receivedAt !== lastSentData.receivedAt);
      const statusChanged = !lastStatusCheck || status.lastCheck !== lastStatusCheck;
      
      if (hasNewData) {
        res.write(`data: ${JSON.stringify({ 
          type: 'data', 
          ...data, 
          mqtt: status 
        })}\n\n`);
        lastSentData = data;
        lastStatusCheck = status.lastCheck;
      } else if (statusChanged) {
        // Envia status mesmo sem novos dados
        res.write(`data: ${JSON.stringify({ 
          type: 'status', 
          mqtt: status 
        })}\n\n`);
        lastStatusCheck = status.lastCheck;
      }
    } catch (error) {
      console.error('Erro no SSE:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error.message 
      })}\n\n`);
    }
  }, 1000); // Atualiza a cada 1 segundo

  // Limpa recursos quando cliente desconecta
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });

  req.on('aborted', () => {
    clearInterval(interval);
    res.end();
  });
});

// Exporta para Vercel
module.exports = app;
