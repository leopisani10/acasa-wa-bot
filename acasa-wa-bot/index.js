import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

// Estado detalhado para debug
let detailedStatus = {
  qr_generated: false,
  qr_scanned: false,
  authenticating: false,
  session_restored: false,
  ready: false,
  last_error: null,
  connection_attempts: 0
};</parameter>

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
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

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

// Cliente WhatsApp
if (HUB_TOKEN || process.env.NODE_ENV === 'development') {
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
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    },
    webVersionCache: {
      type: 'remote',
      remotePath: WA_WEB_REMOTE_PATH
    },
    takeoverOnConflict: true,
    takeoverTimeoutMs: 60000
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
    isConnecting = false;
    connectionAttempts = 0;
    connectionStartTime = null;
    lastQr = null;
    lastQrDataUrl = null;
    lastQrAt = 0;
    console.log('✅ WhatsApp READY - Fully connected and operational');
    console.log('📱 Phone status should show "Connected" now');
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

  client.on('loading_screen', (percent, message) => {
    console.log('📱 WhatsApp loading:', percent + '%', message);
  });

  // Add connection health check
  client.on('remote_session_saved', () => {
    console.log('💾 Remote session saved - connection stable');
  });
  
  // Monitor message events to verify real connectivity
  client.on('message', (message) => {
    console.log('📧 Message received - connection confirmed active');
  });
  
  // Add error handling for specific errors
  client.on('disconnected', (reason) => {
    console.log('🔌 Detailed disconnect reason:', reason);
    if (reason === 'UNPAIRED_PHONE') {
      console.log('📱 Phone unpaired - clearing session and requesting new QR');
      // Clear session on unpair
      try {
        const sessionPath = path.join(SESSION_DIR, 'Default', 'acasa-bot');
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log('🗑️ Session cleared due to unpair');
        }
      } catch (error) {
        console.error('❌ Error clearing session:', error);
      }
    }
  });

  client.initialize();
};

// Cliente WhatsApp
if (HUB_TOKEN || process.env.NODE_ENV === 'development') {
  initializeWhatsAppClient();
} else {
  console.warn('⚠️  HUB_TOKEN not configured - WhatsApp client not initialized');
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ACASA WA Bot listening on', PORT);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase: ${SUPABASE_URL ? 'configured' : 'not configured'}`);
  console.log(`🔑 HUB_TOKEN: ${HUB_TOKEN ? 'configured' : 'not configured'}`);
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