# Monitoramento de Sinal WiFi ESP32 - Dashboard em Tempo Real

## Descrição do Projeto

Este projeto consiste no desenvolvimento de um sistema completo de monitoramento de sinal WiFi (RSSI/dBm) utilizando um ESP32, comunicação MQTT e um dashboard web em tempo real. O sistema permite visualizar a intensidade do sinal WiFi do ESP32 através de um gráfico contínuo e atualizações em tempo real.

## Objetivo da Atividade

Desenvolver uma solução IoT completa que:
- Conecta um ESP32 a uma rede WiFi
- Monitora a intensidade do sinal (RSSI) em dBm
- Publica os dados via protocolo MQTT
- Exibe os dados em um dashboard web moderno e responsivo
- Apresenta gráfico em tempo real da evolução do sinal

## Tecnologias Utilizadas

### Hardware
- **ESP32**: Microcontrolador com WiFi integrado

### Software
- **Arduino IDE**: Para programação do ESP32
- **Node.js**: Runtime JavaScript para o backend
- **Express.js**: Framework web para Node.js
- **MQTT.js**: Cliente MQTT para Node.js
- **Socket.IO**: Biblioteca para comunicação em tempo real
- **Chart.js**: Biblioteca para criação de gráficos
- **HTML5/CSS3/JavaScript**: Frontend do dashboard

### Serviços
- **HiveMQ Public Broker**: Broker MQTT público (broker.hivemq.com)
- **Vercel**: Plataforma de deploy (configurado)

## Estrutura do Projeto

```
dash_pond/
├── README.md                      # Este arquivo
└── sinal_wifi/
    ├── codigo_esp.c++            # Código Arduino para ESP32
    └── dashboard/
        ├── api/
        │   └── server.js         # Servidor Node.js (Express + MQTT + Socket.IO)
        ├── public/
        │   └── index.html        # Frontend do dashboard
        ├── package.json          # Dependências do projeto
        ├── vercel.json           # Configuração para deploy Vercel
        └── README.md             # Documentação técnica do dashboard
```

## Funcionamento

### 1. Código ESP32 (`sinal_wifi/codigo_esp.c++`)

O ESP32 é programado para:
- Conectar-se à rede WiFi configurada
- Medir a intensidade do sinal RSSI a cada 1 segundo
- Publicar os dados no formato JSON para o broker MQTT
- Tópico MQTT: `esp32/wifi/rssi`
- Formato dos dados:
  ```json
  {
    "device": "esp32-01",
    "rssi": -45,
    "ts": 12345
  }
  ```

**Características principais:**
- Reconexão automática WiFi
- Reconexão automática MQTT
- Publicação periódica (1 segundo)
- Formato JSON estruturado

### 2. Backend (`dashboard/api/server.js`)

O servidor Node.js realiza:
- Conexão com o broker MQTT (HiveMQ)
- Subscrição ao tópico `esp32/wifi/rssi`
- Recebimento e processamento dos dados
- Distribuição dos dados via Socket.IO para clientes conectados
- Servir arquivos estáticos (HTML, CSS, JS)

**Tecnologias:**
- Express.js para rotas HTTP
- MQTT.js para comunicação MQTT
- Socket.IO para WebSockets em tempo real
- CORS habilitado para permitir requisições cross-origin

### 3. Frontend (`dashboard/public/index.html`)

O dashboard web apresenta:
- **Cards informativos**: Exibem RSSI atual, nome do dispositivo e última atualização
- **Gráfico em tempo real**: Gráfico de linha contínuo mostrando evolução do sinal
- **Status de conexão**: Indicador visual do status da conexão MQTT
- **Design moderno**: Interface clean com cores personalizadas (#A91021 e #2D253F)

**Características:**
- Atualização em tempo real via Socket.IO
- Gráfico limitado aos últimos 60 pontos para performance
- Interface responsiva (mobile-friendly)
- Animações suaves e feedback visual


## Como Executar

### Pré-requisitos
- Node.js 18.x ou superior
- Arduino IDE com suporte para ESP32
- Conta na Vercel (para deploy)

### Passo 1: Configurar ESP32

1. Abra o arquivo `sinal_wifi/codigo_esp.c++` no Arduino IDE
2. Configure suas credenciais WiFi:
   ```cpp
   const char* WIFI_SSID = "Sua_Rede_WiFi";
   const char* WIFI_PASSWORD = "Sua_Senha";
   ```
3. Instale as bibliotecas necessárias:
   - `WiFi.h` (inclusa no ESP32)
   - `PubSubClient.h` (instalar via Library Manager)
4. Compile e faça upload para o ESP32

### Passo 2: Executar Backend Localmente

1. Navegue até a pasta do dashboard:
   ```bash
   cd sinal_wifi/dashboard
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor:
   ```bash
   npm run dev
   ```

4. O servidor estará rodando em `http://localhost:3000`

### Passo 3: Acessar o Dashboard

1. Abra o navegador e acesse `http://localhost:3000`
2. O dashboard se conectará automaticamente ao MQTT
3. Quando o ESP32 começar a publicar dados, eles aparecerão no gráfico


## Funcionalidades Implementadas

- Conexão WiFi no ESP32  
- Medição contínua de RSSI  
- Publicação MQTT dos dados  
- Backend Node.js para receber dados MQTT  
- Comunicação em tempo real via Socket.IO  
- Dashboard web responsivo  
- Gráfico em tempo real (Chart.js)  
- Interface moderna e intuitiva  
- Status de conexão em tempo real  
- Configuração para deploy na Vercel  

## Dados Monitorados

O sistema monitora e exibe:
- **RSSI (dBm)**: Intensidade do sinal WiFi em decibéis miliwatts
- **Dispositivo**: Identificador do ESP32
- **Timestamp**: Hora da última atualização
- **Gráfico histórico**: Últimos 60 pontos de dados

## Vídeo Demo

**Link do vídeo demonstrativo**: [https://youtu.be/-xcDf1lrULQ?si=7Ic9Gk8doywPXMyP]

