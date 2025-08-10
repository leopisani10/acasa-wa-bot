# ACASA WhatsApp Bot

Bot de integração WhatsApp para o sistema CRM da ACASA Residencial Sênior.

## 🚀 Funcionalidades

- **Autenticação WhatsApp Web** com LocalAuth (sessão persistente)
- **API REST** para comunicação com o Hub ACASA
- **Auto-cadastro de leads** a partir de mensagens recebidas
- **Envio de mensagens** via API
- **QR Code** para pareamento inicial

## 📋 Pré-requisitos

- Node.js 20+
- Projeto Supabase configurado
- WhatsApp Business ou pessoal para autenticação

## ⚙️ Configuração

### 1. Clone e instale dependências

```bash
git clone <repository>
cd acasa-wa-bot
npm install
```

### 2. Configure variáveis de ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
PORT=8080
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE=sua_service_role_key
HUB_TOKEN=token_unico_e_seguro
HANDOFF_NUMBER=5521995138800
WHATSAPP_SESSION_DIR=./sessions
NODE_ENV=development
```

### 3. Execute a migração no Supabase

No SQL Editor do Supabase, execute a migração que cria as tabelas CRM.

### 4. Execute o bot

```bash
npm start
```

## 📱 Primeira Configuração

1. **Inicie o bot**: `npm start`
2. **Obtenha o QR Code**: `GET /qr` com Authorization header
3. **Escaneie com WhatsApp** no celular
4. **Aguarde status ready**: `GET /status`

## 🔌 API Endpoints

Todas as rotas exigem header `Authorization: Bearer ${HUB_TOKEN}`.

### GET /status
Retorna status de conexão do WhatsApp:
```json
{
  "ready": true,
  "me": {
    "number": "5521999999999",
    "pushname": "ACASA Bot"
  }
}
```

### GET /qr
Retorna QR code para autenticação (apenas quando desconectado):
```json
{
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

### POST /send
Envia mensagem WhatsApp:
```json
{
  "to": "5521999999999",
  "message": "Olá! Como posso ajudá-lo?"
}
```

## 🤖 Automações

### Mensagens Recebidas
1. **Normaliza telefone** (adiciona código do país/estado se necessário)
2. **Busca/cria contato** na tabela `contacts`
3. **Busca/cria lead ativo** na tabela `leads`
4. **Registra mensagem** na tabela `wa_messages`
5. **Cria atividade** de follow-up na tabela `activities`

### Auto-cadastro de Leads
- Primeiro contato → Lead criado automaticamente
- Stage inicial: "Novo"
- Source: "WhatsApp"
- Aguarda qualificação manual no CRM

## 🚀 Deploy no Render

### 1. Conecte o repositório no Render

### 2. Configure as variáveis de ambiente

No painel do Render, adicione todas as variáveis do `.env.example`.

### 3. Configure o build

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: `Node`

### 4. Deploy e monitore

- O primeiro deploy pode demorar alguns minutos
- Monitore logs para ver QR code ou status de conexão
- Use a URL do Render para fazer chamadas à API

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Testar endpoints
curl -H "Authorization: Bearer seu_token" http://localhost:8080/status
```

## 📊 Integração com Hub ACASA

### No frontend do Hub, configure:

```env
VITE_WHATSAPP_BOT_URL=https://seu-bot.render.com
VITE_WHATSAPP_BOT_TOKEN=seu_hub_token
```

### Use nas chamadas:

```javascript
const response = await fetch(`${botUrl}/send`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${botToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ to: phone, message: text })
});
```

## 🔒 Segurança

- **HUB_TOKEN**: Use um token forte e único
- **SERVICE_ROLE**: Mantenha a chave de serviço secreta
- **CORS**: Configurado apenas para requisições do Hub
- **Rate limiting**: Considere implementar em produção

## 📝 Logs e Monitoramento

- Logs estruturados com níveis
- Dados sensíveis ocultados em produção
- Health check endpoint para monitoring
- Graceful shutdown implementado

## 🛠️ Troubleshooting

### Bot não conecta
- Verifique se o Chrome/Chromium está instalado
- Confirme que não há outra sessão ativa
- Delete pasta `sessions` e tente novamente

### Erro de autenticação
- Verifique se o `HUB_TOKEN` está correto
- Confirme que o header Authorization está sendo enviado

### Mensagens não chegam
- Verifique logs do bot
- Confirme que o WhatsApp Web está ativo
- Teste com `GET /status` para ver se está conectado

## 📈 Próximas Funcionalidades (Etapa 2)

- [ ] Interface de chat no Hub ACASA
- [ ] Respostas automáticas inteligentes
- [ ] Templates de mensagem
- [ ] Webhooks para notificações
- [ ] Analytics de conversação
- [ ] Integração com IA para qualificação automática

---

**ACASA Residencial Sênior** | WhatsApp Business Integration