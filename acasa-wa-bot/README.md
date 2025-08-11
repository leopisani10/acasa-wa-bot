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
git clone https://github.com/leopisani10/acasa-wa-bot.git
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

No SQL Editor do Supabase, execute a migração que cria as tabelas CRM:
- `units`
- `contacts` 
- `leads`
- `activities`
- `wa_messages`

### 4. Execute o bot

```bash
npm start
```

## 🛍️ Módulo Comercial

O bot agora inclui funcionalidades comerciais completas:

### Funcionalidades Implementadas

- **📋 Catálogo de Produtos**: Exibição automática de produtos e serviços
- **🛒 Carrinho de Compras**: Sistema de carrinho via WhatsApp
- **💳 Processamento de Pedidos**: Workflow completo de vendas
- **💰 Integração de Pagamento**: PIX, Cartão e Boleto
- **📦 Gestão de Estoque**: Controle básico de inventário
- **📊 Logs de Atividade**: Rastreamento de interações comerciais

### Comandos do Cliente

```
catálogo         - Ver produtos disponíveis
produtos         - Alias para catálogo
cardápio         - Ver opções de alimentação
preços          - Consultar tabela de preços
pedido [item] [qtd] - Adicionar ao carrinho
carrinho         - Ver itens no carrinho
finalizar        - Finalizar pedido
pagar [método]   - Processar pagamento
informações      - Info sobre serviços
emergência       - Contatos de emergência
```

### Exemplos de Uso

**Cliente:** `catálogo`
**Bot:** _Exibe lista completa de produtos com preços e descrições_

**Cliente:** `pedido fraldas 30`
**Bot:** _Adiciona 30 fraldas ao carrinho_

**Cliente:** `finalizar`
**Bot:** _Mostra resumo do pedido e opções de pagamento_

**Cliente:** `pagar pix`
**Bot:** _Gera instruções de pagamento PIX com 5% desconto_

### Configuração do Módulo

1. **Execute a migração do banco:**
```sql
-- No SQL Editor do Supabase, execute:
-- supabase/migrations/create_commerce_tables.sql
```

2. **Configure variáveis de pagamento** (opcional):
```env
# Para integração com gateway de pagamento
STRIPE_SECRET_KEY=sk_test_...
PAGSEGURO_TOKEN=...
```

3. **Teste o módulo:**
```bash
# Envie mensagem via API
curl -X POST https://seu-bot.onrender.com/send \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{"to":"5521999999999","message":"catálogo"}'
```

### Gestão via Dashboard

**Produtos:** Adicione produtos na tabela `products` via Supabase Dashboard
**Pedidos:** Monitore pedidos na tabela `orders`
**Analytics:** Acompanhe atividades na tabela `commerce_logs`

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

### POST /webhook
Recebe notificações do Hub ACASA:
```json
{
  "event": "lead_stage_changed",
  "data": { "leadId": "...", "newStage": "Visitou" }
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

1. Acesse [Render.com](https://render.com)
2. Clique em **"New" → "Web Service"**
3. Conecte ao repositório `leopisani10/acasa-wa-bot`

### 2. Configure o serviço

- **Name**: `acasa-whatsapp-bot`
- **Environment**: `Node`
- **Build Command**: `npm ci` (ou deixe vazio)
- **Start Command**: `npm start`
- **Root Directory**: `acasa-wa-bot`
- **Region**: `Virginia (US East)`

> 💡 **Importante**: O arquivo de entrada é `index.js` no diretório `acasa-wa-bot/`. 
> O Render detecta automaticamente Node 20 via `"engines": {"node": "20.x"}`.

### 3. Configure as variáveis de ambiente

No painel do Render, adicione:

```env
PORT=8080
WHATSAPP_SESSION_DIR=/data/sessions
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE=eyJ...sua_service_role_key
HUB_TOKEN=acasa_token_forte_e_unico_aqui
HANDOFF_NUMBER=5521995138800
NODE_ENV=production
```

### 4. Adicione disco persistente

- **Mount Path**: `/data`
- **Size**: `1 GB`
- **Name**: `acasa-whatsapp-sessions`

### 5. Deploy e monitore

- Clique em **"Create Web Service"**
- Monitore os logs para ver quando estiver pronto
- Use a URL gerada para conectar com o Hub

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento (auto-reload)
npm run dev

# Ou executar diretamente
node index.js

# Testar endpoints
curl -H "Authorization: Bearer seu_token" http://localhost:8080/status
```

## 📊 Integração com Hub ACASA

### Configure no frontend do Hub:

```env
VITE_WHATSAPP_BOT_URL=https://seu-bot.onrender.com
VITE_WHATSAPP_BOT_TOKEN=seu_hub_token
```

### Exemplo de uso no Hub:

```javascript
const sendWhatsApp = async (phone, message) => {
  const response = await fetch(`${botUrl}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${botToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to: phone, message })
  });
  return response.json();
};
```

## 🔒 Segurança

- **HUB_TOKEN**: Use um token forte e único
- **SERVICE_ROLE**: Mantenha a chave de serviço secreta
- **CORS**: Configurado para aceitar requisições
- **Rate limiting**: Considere implementar em produção
- **Logs**: Dados sensíveis mascarados em produção

## 📝 Logs e Monitoramento

- Logs estruturados com níveis
- Dados sensíveis ocultados em produção
- Health check endpoint (`/health`) para monitoring
- Graceful shutdown implementado

## 🛠️ Troubleshooting

### Bot não conecta
- Verifique se o Chrome/Chromium está instalado
- Confirme que não há outra sessão ativa
- Delete pasta `sessions` e tente novamente

### Erro PGRST205 (tabela não encontrada)
- Execute a migração CRM no Supabase
- Verifique se as tabelas estão no schema `public`
- Force refresh: `NOTIFY pgrst, 'reload schema';`

### Erro de autenticação (401)
- Verifique se o `HUB_TOKEN` está correto
- Confirme que o header Authorization está sendo enviado

### Mensagens não chegam
- Verifique logs do bot
- Confirme que o WhatsApp Web está ativo
- Teste com `GET /status` para ver se está conectado

## 🧪 Testes

```bash
# Health check
curl https://seu-bot.onrender.com/health

# Status (sem token - deve retornar 401)
curl https://seu-bot.onrender.com/status

# Status (com token)
curl -H "Authorization: Bearer seu_token" https://seu-bot.onrender.com/status

# QR Code (enquanto não pareado)
curl -H "Authorization: Bearer seu_token" https://seu-bot.onrender.com/qr

# Enviar mensagem
curl -X POST https://seu-bot.onrender.com/send \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{"to":"5521999999999","message":"Teste do bot"}'
```

## 📈 Próximas Funcionalidades (Etapa 2)

- [ ] Interface de chat no Hub ACASA
- [ ] Respostas automáticas inteligentes com OpenAI
- [ ] Templates de mensagem
- [ ] Webhooks bidirecionais
- [ ] Analytics de conversação
- [ ] Integração com IA para qualificação automática
- [ ] Suporte a mídia (imagens, documentos)

## 📞 Suporte

Para suporte técnico ou dúvidas sobre integração:
- Verifique os logs no Render
- Teste endpoints com curl
- Confirme configuração do Supabase

---

**ACASA Residencial Sênior** | WhatsApp Business Integration v1.0