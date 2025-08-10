import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import qrcode from 'qrcode';
import { createClient } from '@supabase/supabase-js';

// IMPORT CORRETO DO WWEBJS (CJS EM AMBIENTE ESM)
import wwebjs from 'whatsapp-web.js';
const { Client, LocalAuth } = wwebjs;

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: ['https://hub.acasaresidencialsenior.com.br'], credentials: false }));

const PORT = process.env.PORT || 8080;
const HUB_TOKEN = process.env.HUB_TOKEN || '';
const SESSION_DIR = process.env.WHATSAPP_SESSION_DIR || './.wa-sessions';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

// Initialize Supabase with service role for admin access
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE) : null;

let ready = false;
let lastQrDataUrl = null;
let client = null;

// --- Auth por HUB_TOKEN (Bearer) ---
function authenticateHub(req, res, next) {
  // Permite pings internos do Render
  if (req.path === '/health') return next();

  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  
  // Se HUB_TOKEN não estiver setado, libera (modo DEV)
  if (!HUB_TOKEN) return next();
  
  if (token && token === HUB_TOKEN) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

// Rotas HTTP
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    whatsapp: ready 
  });
});

app.get('/status', authenticateHub, (req, res) => {
  res.json({ ready });
});

app.get('/qr', authenticateHub, async (req, res) => {
  if (!lastQrDataUrl && ready) return res.json({ message: 'already_ready' });
  res.json({ dataUrl: lastQrDataUrl });
});

app.post('/send', authenticateHub, async (req, res) => {
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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), whatsapp: ready });
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

  // Event: New message received
  client.on('message', async (message) => {
    try {
      // Skip group messages and status updates
      if (message.from.includes('@g.us') || message.from === 'status@broadcast') {
        return;
      }

      // Skip messages from ourselves
      if (message.fromMe) {
        return;
      }

      if (!supabase) {
        console.log('📨 Message received but Supabase not configured');
        return;
      }

      const fromNumber = message.from.replace('@c.us', '').replace(/\D/g, '');
      const messageBody = message.body || '';

      console.log('📨 New message received from:', `${fromNumber.slice(0, 4)}***${fromNumber.slice(-4)}`);

      // Process contact and lead (existing logic would continue here)
      await processIncomingMessage(fromNumber, messageBody, message);
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  client.initialize();
} else {
  console.log('⚠️  HUB_TOKEN not configured - WhatsApp client not initialized');
}

// Utility functions
const normalizePhone = (phone) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if needed (Brazil +55)
  if (cleaned.length === 11 && cleaned.startsWith('5521')) {
    return cleaned; // Already has country code
  }
  if (cleaned.length === 11) {
    return `55${cleaned}`; // Add Brazil code
  }
  if (cleaned.length === 10) {
    return `5521${cleaned}`; // Add Brazil + Rio code
  }
  
  return cleaned;
};

const logSafe = (message, data = null) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, don't log sensitive data
    console.log(message);
  } else {
    console.log(message, data);
  }
};

// WhatsApp Client Setup
const initWhatsApp = () => {
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      clientId: 'acasa-crm-bot',
      dataPath: SESSION_DIR
    }),
    puppeteer: {
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

  // Event: QR Code received
  whatsappClient.on('qr', async (qr) => {
    logSafe('🔄 QR Code received');
    
    try {
      // Generate QR code as data URL
      currentQR = await QRCode.toDataURL(qr, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      logSafe('✅ QR Code generated successfully');
    } catch (error) {
      console.error('❌ Error generating QR code:', error);
    }
  });

  // Event: Client ready
  whatsappClient.on('ready', async () => {
    whatsappReady = true;
    currentQR = null;
    
    try {
      clientInfo = {
        number: whatsappClient.info.wid.user,
        pushname: whatsappClient.info.pushname
      };
      
      logSafe('✅ WhatsApp client ready', { number: clientInfo.number });
    } catch (error) {
      console.error('❌ Error getting client info:', error);
    }
  });

  // Event: Client disconnected
  whatsappClient.on('disconnected', (reason) => {
    logSafe('🔌 WhatsApp disconnected:', reason);
    whatsappReady = false;
    clientInfo = null;
    currentQR = null;
  });

  // Event: Authentication failure
  whatsappClient.on('auth_failure', () => {
    console.error('❌ WhatsApp authentication failed');
    whatsappReady = false;
    currentQR = null;
  });

  // Event: New message received
  whatsappClient.on('message', async (message) => {
    try {
      // Skip group messages and status updates
      if (message.from.includes('@g.us') || message.from === 'status@broadcast') {
        return;
      }

      // Skip messages from ourselves
      if (message.fromMe) {
        return;
      }

      const fromNumber = normalizePhone(message.from.replace('@c.us', ''));
      const toNumber = normalizePhone(whatsappClient.info.wid.user);
      const messageBody = message.body || '';

      logSafe('📨 New message received', { 
        from: `${fromNumber.slice(0, 4)}***${fromNumber.slice(-4)}`,
        bodyLength: messageBody.length 
      });

      // Process contact and lead
      await processIncomingMessage(fromNumber, toNumber, messageBody, message);
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  // Initialize client
  whatsappClient.initialize();
};

// Process incoming WhatsApp message
const processIncomingMessage = async (fromNumber, toNumber, messageBody, originalMessage) => {
  try {
    // 1. Upsert contact
    let contact = null;
    
    // Try to find existing contact
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', fromNumber)
      .single();

    if (existingContact) {
      contact = existingContact;
    } else {
      // Create new contact
      const contactName = originalMessage.notifyName || 
                         originalMessage._data.notifyName || 
                         `Contato ${fromNumber.slice(-4)}`;
      
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert([{
          full_name: contactName,
          phone: fromNumber,
          lgpd_consent: false, // Will need to be confirmed later
          notes: 'Contato criado automaticamente via WhatsApp'
        }])
        .select()
        .single();
      
      if (contactError) throw contactError;
      contact = newContact;
    }

    // 2. Upsert lead
    let lead = null;
    
    // Check for existing active lead
    const { data: existingLead } = await supabase
      .from('leads')
      .select('*')
      .eq('contact_id', contact.id)
      .not('stage', 'in', '(Fechado,Perdido)')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingLead) {
      lead = existingLead;
    } else {
      // Create new lead
      const { data: newLead, error: leadError } = await supabase
        .from('leads')
        .insert([{
          contact_id: contact.id,
          stage: 'Novo',
          source: 'WhatsApp',
          elderly_name: '', // Will be filled later in conversation
          dependency_grade: 'I', // Default
        }])
        .select()
        .single();
      
      if (leadError) throw leadError;
      lead = newLead;
    }

    // 3. Insert WhatsApp message
    const { error: messageError } = await supabase
      .from('wa_messages')
      .insert([{
        lead_id: lead.id,
        wa_from: fromNumber,
        wa_to: toNumber,
        direction: 'inbound',
        body: messageBody,
        wa_msg_id: originalMessage.id._serialized
      }]);

    if (messageError) throw messageError;

    // 4. Create activity for follow-up
    await supabase
      .from('activities')
      .insert([{
        lead_id: lead.id,
        type: 'msg',
        title: 'Mensagem WhatsApp recebida',
        description: messageBody.length > 100 ? 
          `${messageBody.substring(0, 100)}...` : messageBody,
        done: false,
      }]);

    logSafe('✅ Message processed successfully', { leadId: lead.id });

  } catch (error) {
    console.error('❌ Error processing incoming message:', error);
  }
};

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    whatsapp: whatsappReady 
  });
});

// Get WhatsApp status
app.get('/status', authenticateHub, (req, res) => {
  res.json({
    ready: whatsappReady,
    me: clientInfo
  });
});

// Get current QR code
app.get('/qr', authenticateHub, (req, res) => {
  if (whatsappReady) {
    return res.status(400).json({ error: 'WhatsApp already connected' });
  }
  
  if (!currentQR) {
    return res.status(404).json({ error: 'No QR code available' });
  }
  
  res.json({ qr: currentQR });
});

// Send WhatsApp message
app.post('/send', authenticateHub, async (req, res) => {
  try {
    const { to, message } = req.body;
    
    if (!whatsappReady) {
      return res.status(503).json({ error: 'WhatsApp not ready' });
    }
    
    if (!to || !message) {
      return res.status(400).json({ error: 'Missing required fields: to, message' });
    }

    const normalizedTo = normalizePhone(to);
    const chatId = `${normalizedTo}@c.us`;
    
    // Send message via WhatsApp
    const sentMessage = await whatsappClient.sendMessage(chatId, message);
    
    // Find contact and lead for this number
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', normalizedTo)
      .single();

    if (contact) {
      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('contact_id', contact.id)
        .not('stage', 'in', '(Fechado,Perdido)')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lead) {
        // Save outbound message
        await supabase
          .from('wa_messages')
          .insert([{
            lead_id: lead.id,
            wa_from: normalizePhone(whatsappClient.info.wid.user),
            wa_to: normalizedTo,
            direction: 'outbound',
            body: message,
            wa_msg_id: sentMessage.id._serialized
          }]);

        // Create activity
        await supabase
          .from('activities')
          .insert([{
            lead_id: lead.id,
            type: 'msg',
            title: 'Mensagem WhatsApp enviada',
            description: message.length > 100 ? `${message.substring(0, 100)}...` : message,
            done: true,
          }]);
      }
    }
    
    logSafe('✅ Message sent successfully', { to: `${normalizedTo.slice(0, 4)}***${normalizedTo.slice(-4)}` });
    
    res.json({ 
      success: true, 
      messageId: sentMessage.id._serialized 
    });
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Webhook endpoint for Hub notifications (optional)
app.post('/webhook', authenticateHub, async (req, res) => {
  try {
    const { event, data } = req.body;
    
    logSafe('📨 Webhook received', { event });
    
    // Handle different webhook events from Hub
    switch (event) {
      case 'lead_stage_changed':
        // Could send automated messages based on stage
        break;
      case 'activity_created':
        // Could send reminders
        break;
      default:
        logSafe('🔔 Unknown webhook event:', event);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = () => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('ACASA WA Bot listening on', PORT);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log(`📂 Session directory: ${SESSION_DIR}`);
    console.log(`✅ Ready to receive WhatsApp messages and API calls`);
  });
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Shutting down gracefully...');
  
  if (whatsappClient) {
    try {
      await whatsappClient.destroy();
      console.log('✅ WhatsApp client destroyed');
    } catch (error) {
      console.error('❌ Error destroying WhatsApp client:', error);
    }
  }
  
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize everything
const main = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('units').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Supabase connection established');
    
    // Start WhatsApp client
    console.log('🔄 Initializing WhatsApp client...');
    initWhatsApp();
    
    // Start Express server
    startServer();
    
  } catch (error) {
    console.error('❌ Failed to initialize:', error);
    console.log('💡 Make sure the CRM tables exist in Supabase');
    process.exit(1);
  }
};

// Start the application
main();