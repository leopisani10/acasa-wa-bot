import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { CommerceModule } from './modules/commerce.js';

// IMPORT CORRETO DO WWEBJS (CJS EM AMBIENTE ESM)
import wwebjs from 'whatsapp-web.js';
const { Client, LocalAuth } = wwebjs;

dotenv.config();

// --- Session + QR Management ---
const RAW_DIR = process.env.WHATSAPP_SESSION_DIR || '/data/wa-sessions';
const SESSION_DIR = path.resolve(RAW_DIR); // garante caminho absoluto
let ready = false;
let lastQr = null;
let lastQrDataUrl = null;
let lastQrAt = 0;
let connectionAttempts = 0;
let isConnecting = false;
let connectionStartTime = null;
const QR_TTL_MS = Number(process.env.QR_THROTTLE_MS || 25000); // 25s - mais rápido que timeout do WhatsApp
let connectionState = 'disconnected'; // disconnected, qr_ready, authenticating, connected
let lastStateChange = Date.now();
const CONNECTION_TIMEOUT_MS = 60000;

// Estado detalhado para debug
let detailedStatus = {
  qr_generated: false,
  qr_scanned: false,
  authenticating: false,
  session_restored: false,
  ready: false,
  last_error: null,
  connection_attempts: 0
};

// --- Auth por HUB_TOKEN (Bearer) ---
const HUB_TOKEN = process.env.HUB_TOKEN || '';

function auth(req, res, next) {
  // /health é público
  if (req.path === '/health') return next();

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  // Se HUB_TOKEN não estiver configurado, liberar (modo DEV)
  if (!HUB_TOKEN) return next();

  if (token === HUB_TOKEN) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

const app = express();
app.use(express.json());

// CORS para produção + Netlify preview
const allowedOrigins = [
  'https://hub.acasaresidencialsenior.com.br',
  'https://localhost:5173',
  /\.netlify\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      return callback(null, true);
    } else {
      console.warn('🚫 CORS blocked:', origin);
      return callback(new Error('CORS blocked: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
  credentials: false
}));

const PORT = process.env.PORT || 8080;
const WA_WEB_REMOTE_PATH = process.env.WA_WEB_REMOTE_PATH || 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html';
const HUB_URL = process.env.HUB_URL || 'http://localhost:5173';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

// Initialize Commerce Module
let commerceModule = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
  commerceModule = new CommerceModule(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}

// Initialize Supabase with service role for admin access
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE) : null;

// Ensure session directory exists
try {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  console.log(`📂 Session directory ready: ${SESSION_DIR}`);
} catch (error) {
  console.error('❌ Error creating session directory:', error);
}

let client = null;

// Funções utilitárias para comunicação com o Hub
async function sendQRToHub(qrDataUrl) {
  if (!HUB_URL || !HUB_TOKEN) {
    console.warn('HUB_URL ou HUB_TOKEN não configurados para enviar QR para o Hub.');
    return;
  }
  try {
    await fetch(`${HUB_URL}/api/qr-update`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${HUB_TOKEN}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ dataUrl: qrDataUrl })
    });
    console.log('📤 QR code enviado para o Hub com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao enviar QR para o Hub:', error);
  }
}

async function updateHubStatus(status) {
  if (!HUB_URL || !HUB_TOKEN) {
    console.warn('HUB_URL ou HUB_TOKEN não configurados para atualizar status do Hub.');
    return;
  }
  try {
    await fetch(`${HUB_URL}/api/bot-status`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${HUB_TOKEN}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ whatsapp: status })
    });
    console.log(`📤 Status do bot (${status}) enviado para o Hub com sucesso.`);
  } catch (error) {
    console.error('❌ Erro ao atualizar status do Hub:', error);
  }
}

// Rotas HTTP
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    whatsapp: ready 
  });
});

app.get('/status', auth, (req, res) => {
  res.json({ 
    ready,
    me: ready && client ? {
      number: client.info?.wid?.user || 'unknown',
      pushname: client.info?.pushname || 'ACASA Bot'
    } : undefined
  });
});

app.get('/qr', auth, async (req, res) => {
  if (ready) {
    return res.json({ message: 'already_ready', ready: true });
  }
  
  if (isConnecting) {
    const elapsedTime = Date.now() - (connectionStartTime || 0);
    return res.json({ 
      message: 'connecting', 
      ready: false, 
      elapsedTime,
      maxWaitTime: CONNECTION_TIMEOUT_MS
    });
  }
  
  if (!lastQrDataUrl) {
    return res.json({ message: 'qr_not_ready', ready: false });
  }
  
  res.json({ dataUrl: lastQrDataUrl, generatedAt: lastQrAt });
});

app.post('/send', auth, async (req, res) => {
  try {
    const { to, message } = req.body || {};
    if (!to || !message) return res.status(400).json({ error: 'to and message are required' });
    if (!ready || !client) return res.status(503).json({ error: 'WhatsApp not ready' });
    
    const normalizedTo = to.replace(/\D/g, '');
    const chatId = `${normalizedTo}@c.us`;
    await client.sendMessage(chatId, message);
    console.log(`📤 Message sent to ${normalizedTo}`);
    return res.json({ ok: true });
  } catch (e) {
    console.error('📤 Send error:', e);
    return res.status(500).json({ error: 'send_failed' });
  }
});

if (HUB_TOKEN) {
  console.log('🔧 Initializing WhatsApp client with fixed web version...');
  console.log('📂 Session directory:', SESSION_DIR);
  console.log('🌐 WhatsApp Web version:', WA_WEB_REMOTE_PATH);
  
  client = new Client({
    authStrategy: new LocalAuth({ 
      dataPath: SESSION_DIR,
      clientId: 'acasa-bot' // pasta estável: /data/wa-sessions/Default/acasa-bot
    }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--disable-ipc-flooding-protection'
      ]
    },
    webVersionCache: {
      type: 'remote',
      remotePath: WA_WEB_REMOTE_PATH
    },
    takeoverOnConflict: false, // Changed to avoid conflicts
    takeoverTimeoutMs: CONNECTION_TIMEOUT_MS,
    qrMaxRetries: 5,
    authTimeoutMs: CONNECTION_TIMEOUT_MS,
    restartOnAuthFail: false // Manual restart control
  });

  client.on('qr', async (qr) => {
    const now = Date.now();
    const isNew = qr !== lastQr;
    const ttlOk = now - lastQrAt > QR_TTL_MS;

    if (!isNew && !ttlOk) return; // ignora spam

    lastQr = qr;
    lastQrAt = now;
    
    try {
      lastQrDataUrl = await qrcode.toDataURL(qr);
      ready = false;
      console.log('🔄 QR atualizado (debounced)', new Date().toLocaleTimeString('pt-BR'));
    } catch (error) {
      console.error('❌ QR generation error:', error);
    }
  });

  client.on('authenticated', () => {
    console.log('🔐 WhatsApp authenticated successfully');
  });

  client.on('ready', () => {
    ready = true;
    lastQr = null;
    lastQrDataUrl = null;
    lastQrAt = 0;
    console.log('✅ WhatsApp READY');
    
    // Initialize commerce module when WhatsApp is ready
    if (commerceModule) {
      commerceModule.initialize().catch(console.error);
    }
  });

  client.on('disconnected', (reason) => {
    ready = false;
    lastQrDataUrl = null;
    console.warn('🔌 WhatsApp disconnected:', reason, '- waiting for new QR...');
  });

  client.on('auth_failure', (message) => {
    ready = false;
    lastQrDataUrl = null;
    console.error('❌ WhatsApp authentication failed:', message);
    console.log('💡 Se o problema persistir, delete a pasta de sessão no Render:');
    console.log('💡 rm -rf /data/wa-sessions/* ou use o painel do Render');
  });

  client.on('change_state', (state) => {
    console.log('🔄 WhatsApp state changed:', state);
  });

  // Handle incoming messages
  client.on('message', async (message) => {
    try {
      // Skip messages from self and groups
      if (message.fromMe || message.from.includes('@g.us')) return;
      
      const from = message.from.replace('@c.us', '');
      const messageBody = message.body || '';
      
      console.log(`📨 Message from ${from}: ${messageBody}`);
      
      // Try commerce module first
      if (commerceModule) {
        const handled = await commerceModule.handleMessage(messageBody, from, client);
        if (handled) {
          console.log('🛍️ Commerce module handled the message');
          return;
        }
      }
      
      // Auto-reply for unhandled messages
      const autoReply = `
🤖 *ACASA Residencial Sênior - Atendimento Automático*

Olá! Recebi sua mensagem: "${messageBody}"

*🛍️ Para compras e serviços:*
Digite *catálogo* ou *produtos*

*🏠 Para informações sobre residência:*
Digite *informações* ou *serviços*

*📞 Atendimento humano:*
(21) 2543-2880 - Botafogo
(21) 2234-5670 - Tijuca

*🕐 Horário de atendimento:*
Segunda a Sexta: 8h às 18h

Como posso ajudá-lo?
      `.trim();

      await client.sendMessage(message.from, autoReply);
      
    } catch (error) {
      console.error('❌ Error handling message:', error);
    }
  });

  client.on('loading_screen', (percent, message) => {
    console.log('📱 WhatsApp loading:', percent + '%', message);
  });

  client.initialize();
} else {
  console.warn('⚠️  HUB_TOKEN not configured - WhatsApp client not initialized');
}

// Commerce API endpoints
app.get('/commerce/products', auth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('category');

    if (error) throw error;

    res.json({ products: products || [] });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/commerce/orders', auth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ orders: orders || [] });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/commerce/order/:orderId/status', auth, async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;

    const { error } = await supabase
      .from('orders')
      .update({ 
        status, 
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Cleanup carts every hour
if (commerceModule) {
  setInterval(() => {
    commerceModule.cleanupOldCarts();
  }, 60 * 60 * 1000); // 1 hour
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ACASA WA Bot listening on', PORT);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase: ${SUPABASE_URL ? 'configured' : 'not configured'}`);
  console.log(`🔑 HUB_TOKEN: ${HUB_TOKEN ? 'configured' : 'not configured'}`);
  console.log(`🏠 HUB_URL: ${HUB_URL ? 'configured' : 'not configured'}`);
  console.log(`📂 Session directory: ${SESSION_DIR}`);
  console.log(`⏱️  QR throttle: ${QR_TTL_MS}ms`);
  console.log(`🌐 WhatsApp Web version: ${WA_WEB_REMOTE_PATH}`);
  console.log(`✅ Ready to receive WhatsApp messages and API calls`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  if (client) {
    try {
      await client.destroy();
      console.log('✅ WhatsApp client destroyed');
    } catch (error) {
      console.error('❌ Error destroying WhatsApp client:', error);
    }
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  if (client) {
    try {
      await client.destroy();
      console.log('✅ WhatsApp client destroyed');
    } catch (error) {
      console.error('❌ Error destroying WhatsApp client:', error);
    }
  }
  process.exit(0);
});