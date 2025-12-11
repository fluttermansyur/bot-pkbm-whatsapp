const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['PKBM Kreatif Mandiri', 'Chrome', '110.0']
  });

  sock.ev.on('creds.update', saveCreds);

  // Request pairing code untuk nomor tertentu
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
        console.log('\nInput kode (tanpa strip):', code.replace(/-/g, ''));
      } catch (e) {
        console.log('Error get pairing code:', e.message);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'open') {
      console.log('✅ Bot PKBM Connected to WhatsApp!');
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 5000);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';

    console.log('Pesan dari:', from, '- Isi:', text);

    const reply = `Halo! Bot PKBM Kreatif Mandiri aktif ✅

Contoh perintah:
• Nilai Budi Matematika
• Absensi Ani Desember
• Rekap kelas 12 paket C pdf
• Tambah siswa: Nama Budi, NIS 12345, Kelas 12

Bot siap 24 jam! 🚀`;

    try {
      await sock.sendMessage(from, { text: reply });
      console.log('✅ Reply sent!');
    } catch (err) {
      console.log('Error sending message:', err.message);
    }
  });
}

connectToWhatsApp();
