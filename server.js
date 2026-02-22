const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.static('public'));

let admins = []; 

const client = new Client({ 
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] } 
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ Bot TaskTracker Aktif!'));

// Masukkan nomor WA kamu di sini (Tanpa tanda +)
let OWNER_NUMBER = '268508487274559@c.us'; 

client.on('message', async msg => {
    // 1. DEFINISIKAN DULU VARIABELNYA (Paling Atas!)
    const text = msg.body || "";
    const sender = msg.from;

    console.log(`---> Ada pesan masuk! Dari: ${sender} Isi: ${text}`);

    // 2. JURUS PAMUNGKAS (Jika nomor owner salah)
    if (text === '.iamowner') {
        OWNER_NUMBER = sender;
        console.log("✅ Owner diset otomatis ke: " + sender);
        return msg.reply("Siappp! Sekarang kamu adalah Owner bot ini.");
    }

    if (text === 'tes') {
        return msg.reply('Bot aktif dan merespon!');
    }

    // 3. Filter: Hanya respon pesan titik
    if (!text.startsWith('.')) return;

    // 4. Security: Cek Owner
    if (sender !== OWNER_NUMBER) {
        console.log(`❌ Akses Ditolak untuk: ${sender}`);
        return;
    }

    const args = text.split(' ');
    const command = args[0].toLowerCase();

    // --- LOGIC COMMAND ---
    if (command === '.tambah' && msg.hasMedia) {
        try {
            const rawData = text.replace('.tambah ', '');
            const [nama, jabatan, kontak] = rawData.split('|');
            const media = await msg.downloadMedia();
            
            admins.push({
                nama: nama ? nama.trim() : "Tanpa Nama",
                jabatan: jabatan ? jabatan.trim() : "Staf",
                kontak: kontak ? kontak.trim() : '#',
                foto: `data:${media.mimetype};base64,${media.data}`,
                status: 'active'
            });
            msg.reply(`✅ Admin *${nama}* ditambahkan!`);
        } catch (e) { msg.reply('❌ Gagal download foto.'); }
    }
    else if (command === '.edit') {
        const rawData = text.replace('.edit ', '');
        const [target, nNama, nJab, nKon] = rawData.split('|');
        let f = false;
        admins = admins.map(a => {
            if (a.nama.toLowerCase() === target.trim().toLowerCase()) {
                if (nNama) a.nama = nNama.trim();
                if (nJab) a.jabatan = nJab.trim();
                if (nKon) a.kontak = nKon.trim();
                f = true;
            }
            return a;
        });
        msg.reply(f ? `✅ Data diperbarui!` : `❌ Tidak ditemukan.`);
    }
    else if (command === '.delete') {
        const target = text.replace('.delete ', '').trim().toLowerCase();
        const oldLen = admins.length;
        admins = admins.filter(a => a.nama.toLowerCase() !== target);
        msg.reply(admins.length < oldLen ? `🗑️ Dihapus.` : `❌ Tidak ditemukan.`);
    }
    else if (command === '.active' || command === '.inactive') {
        const s = command.replace('.', '');
        const target = text.replace(command + ' ', '').trim().toLowerCase();
        let f = false;
        admins = admins.map(a => {
            if (a.nama.toLowerCase() === target) { a.status = s; f = true; }
            return a;
        });
        msg.reply(f ? `✅ Status updated!` : `❌ Gagal.`);
    }
    else if (command === '.reset') {
        admins = [];
        msg.reply('🗑️ Data dibersihkan.');
    }
    else {
        msg.reply("❌ Command salah.\n📌 .tambah, .edit, .delete, .active, .inactive, .reset");
    }
});

client.initialize();
app.get('/api/admins', (req, res) => res.json(admins));
app.listen(3000, () => console.log('🚀 http://localhost:3000/admin.html'));