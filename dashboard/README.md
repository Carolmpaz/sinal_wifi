# Monitor ESP32 - Dashboard RSSI/dBm

Dashboard web em tempo real para monitorar os valores de RSSI (dBm) de um ESP32 via MQTT.

## Características

- DBackend Node.js com Express e MQTT
- DComunicação em tempo real via Socket.IO
- DConexão MQTT automática ao broker HiveMQ
- DVisualização instantânea do valor de RSSI (dBm)
- DGráfico contínuo de tempo x dBm atualizado em tempo real
- DDesign clean com cores personalizadas (A91021 e 2D253F)
- DInterface responsiva
- DPronto para deploy na Vercel

## Pré-requisitos

- Node.js 18.x ou superior
- Conta na Vercel (gratuita)
- ESP32 configurado para publicar no tópico MQTT

## Instalação Local

1. Clone o repositório ou baixe os arquivos
2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm run dev
```

4. Acesse `http://localhost:3000` no navegador

## Configuração do ESP32

Certifique-se de que o ESP32 está publicando dados no formato JSON no tópico `esp32/wifi/rssi`:

```json
{"device":"esp32-01","rssi":-45,"ts":12345}
```

O código do ESP32 fornecido já está configurado corretamente para:
- **Broker MQTT**: broker.hivemq.com
- **Porta**: 1883
- **Tópico**: esp32/wifi/rssi

## Estrutura do Projeto

```
dash_pond/
├── api/
│   └── server.js          # Servidor Express + MQTT + Socket.IO
├── public/
│   └── index.html         # Frontend (HTML/CSS/JS)
├── package.json           # Dependências do projeto
├── vercel.json            # Configuração do deploy Vercel
├── .gitignore            # Arquivos ignorados pelo Git
└── README.md             # Este arquivo
```

