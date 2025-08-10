import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import qrcode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

// IMPORT CORRETO DO WWEBJS (CJS EM AMBIENTE ESM)
import wwebjs from 'whatsapp-web.js';
const { Client, LocalAuth } = wwebjs;

dotenv.config();

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
app.use(cors({ origin: ['https://hub.acasaresidencialsenior.com.br'], credentials: false }));

const PORT = process.env.PORT || 8080;
const SESSION_DIR = process.env.WHATSAPP_SESSION_DIR || './.wa-sessions';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

// Initialize Supabase with service role for admin access
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE) : null;

let ready = false;
let lastQrDataUrl = null;
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
  res.json({ ready });
});

app.get('/qr', auth, async (req, res) => {
  if (!lastQrDataUrl && ready) return res.json({ message: 'already_ready' });
  res.json({ dataUrl: lastQrDataUrl });
});

app.post('/send', auth, async (req, res) => {
  try {
    const { to, message } = req.body || {};
    if (!to || !message) return res.status(400).json({ error: 'to and message are required' });
    if (!ready || !client) return res.status(503).json({ error: 'WhatsApp not ready' });
    
    const normalizedTo = to.replace(/\D/g, '');
    const chatId = `${normalizedTo}@c.us`;
    await client.sendMessage(chatId, message);
    return res.json({ ok: true });
  } catch (e) {
    console.error('send error', e);
    return res.status(500).json({ error: 'send_failed' });
  }
});

// Cliente WhatsApp
if (HUB_TOKEN) {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: SESSION_DIR }),
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
    }
  });

  client.on('qr', async (qr) => {
    try {
      lastQrDataUrl = await qrcode.toDataURL(qr);
      ready = false;
      console.log('🔄 QR atualizado');
    } catch (e) {
      console.error('❌ qr to dataurl error', e);
    }
  });

  client.on('ready', () => {
    ready = true;
    lastQrDataUrl = null;
    console.log('✅ WhatsApp READY');
  });

  client.on('disconnected', (reason) => {
    ready = false;
    console.warn('🔌 WhatsApp disconnected:', reason);
  });

  client.on('auth_failure', () => {
    console.error('❌ WhatsApp authentication failed');
    ready = false;
  });

  client.initialize();
} else {
  console.log('⚠️  HUB_TOKEN not configured - WhatsApp client not initialized');
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ACASA WA Bot listening on', PORT);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Supabase: ${SUPABASE_URL ? 'configured' : 'not configured'}`);
  console.log(`🔑 HUB_TOKEN: ${HUB_TOKEN ? 'configured' : 'not configured'}`);
  console.log(`📂 Session directory: ${SESSION_DIR}`);
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