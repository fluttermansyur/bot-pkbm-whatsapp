
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['PKBM Bot', 'Chrome', '110.0']
  });

  sock.ev.on('creds.update', saveCreds);

  if (!state.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode('6285183189421');
        console.log('╔══════════════════════════════════╗');
        console.log('║    KODE PAIRING WHATSAPP:       ║');
        console.log('║                                  ║');
        console.log(`║         ${code}              ║`);
        console.log('║                                  ║');
        console.log('╚══════════════════════════════════╝');
        console.log('Input kode (tanpa strip):', code.replace(/-/g, ''));
      } catch (e) {
        console.log('Error:', e.message);
      }
    }, 5000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'open') {
      console.log('✅ Bot Connected!');
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const reply = `Halo! Bot PKBM Kreatif Mandiri aktif ✅

Contoh perintah:
• Nilai Budi Matematika
• Absensi Ani Desember

Bot siap 24 jam! 🚀`;

    try {
      await sock.sendMessage(m.key.remoteJid, { text: reply });
    } catch (err) {
      console.log('Error:', err.message);
    }
  });
}

connectToWhatsApp();
