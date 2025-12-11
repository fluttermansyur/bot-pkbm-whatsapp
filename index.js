const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome')
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    
    console.log('Connection status:', connection);
    
    if (connection === 'connecting' && !sock.authState.creds.registered) {
      console.log('Requesting pairing code...');
      
      try {
        const code = await sock.requestPairingCode('6285183189421');
        
        console.log('\n╔══════════════════════════════════╗');
        console.log('║    KODE PAIRING WHATSAPP:       ║');
        console.log('║                                  ║');
        console.log(`║         ${code}              ║`);
        console.log('║                                  ║');
        console.log('╚══════════════════════════════════╝\n');
        console.log('Input kode (tanpa strip):', code.replace(/-/g, ''));
        
      } catch (e) {
        console.log('Error requesting code:', e.message);
      }
    }
    
    if (connection === 'open') {
      console.log('✅ Bot Connected!');
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      if (shouldReconnect) {
        console.log('Reconnecting in 5s...');
        setTimeout(connectToWhatsApp, 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const reply = `Halo! Bot PKBM Kreatif Mandiri aktif ✅

Bot siap 24 jam! 🚀`;

    try {
      await sock.sendMessage(m.key.remoteJid, { text: reply });
      console.log('✅ Message sent!');
    } catch (err) {
      console.log('Error:', err.message);
    }
  });
}

console.log('Starting bot...');
connectToWhatsApp();
