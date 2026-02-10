const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const DiscordRPC = require('discord-rpc');
const axios = require('axios');
const { autoUpdater } = require('electron-updater');

let mainWindow;

// --- DİSCORD RPC AYARLARI ---
// Buraya Discord Developer Portal'dan aldığın Client ID gelecek.
// Şimdilik örnek bir ID koyuyorum, kendi ID'ni alırsan logolu gözükür.
const clientId = '1442304896672989186'; 
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 720,
        frame: false,
        resizable: false,
        icon: path.join(__dirname, 'mylogo.png'), // Varsa ikonun
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    mainWindow.loadFile('index.html');
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });
}

app.whenReady().then(() => {
    createWindow();

    // Discord'a Bağlan
    rpc.login({ clientId }).catch(console.error);
});

// Discord Hazır Olduğunda
rpc.on('ready', () => {
    rpc.setActivity({
        details: 'Rol Yapıyor', // Alt başlık
        state: 'CARP Launcher', // Ana Durum
        startTimestamp: new Date(),
        largeImageKey: 'logo', // Developer Portal'a yüklediğin resim adı
        largeImageText: 'CARP',
        buttons: [
            { label: 'Discorda Katıl', url: 'https://discord.gg/caroleplay' },
            { label: 'Sunucuya Bağlan', url: 'fivem://connect/cfx.re/join/e9pexa' }
        ]
    });
    console.log("Discord RPC Aktif!");
});

// --- BUTON İŞLEVLERİ ---

// Kapat ve Küçült
ipcMain.on('app:close', () => app.quit());
ipcMain.on('app:minimize', () => mainWindow.minimize());

// Discord Linkini Aç
ipcMain.on('open-discord', () => {
    shell.openExternal('https://discord.gg/caroleplay');
});

// Oyunu Başlat
ipcMain.on('game:start', () => {
    // BURAYA SUNUCU IP ADRESİNİ YAZMAYI UNUTMA!
    shell.openExternal('fivem://connect/cfx.re/join/e9pexa');
});

// Cache Temizleme (Gerçek İşlem)
ipcMain.on('app:clear-cache', (event) => {
    // FiveM Cache Yolu (Genellikle LocalAppData içindedir)
    const localAppData = process.env.LOCALAPPDATA;
    const cachePaths = [
        path.join(localAppData, 'FiveM', 'FiveM.app', 'data', 'cache'),
        path.join(localAppData, 'FiveM', 'FiveM.app', 'data', 'server-cache'),
        path.join(localAppData, 'FiveM', 'FiveM.app', 'data', 'server-cache-priv')
    ];

    let deletedCount = 0;

    cachePaths.forEach(p => {
        if (fs.existsSync(p)) {
            try {
                fs.rmSync(p, { recursive: true, force: true });
                deletedCount++;
            } catch (err) {
                console.error(`Silinemedi: ${p}`, err);
            }
        }
    });

    // İşlem bitince renderer'a haber ver
    event.reply('cache-cleared', deletedCount > 0);
});


// --- SUNUCU DURUMUNU SORGULA (DIRECT IP - HTTP) ---
ipcMain.handle('get-server-status', async (event, ip, port) => {
    // Tarayıcıdaki linkin aynısını oluşturuyoruz: http://127.0.0.1:30120/dynamic.json
    const url = `http://${ip}:${port}/dynamic.json`; 
    
    console.log(`Sunucuya bağlanılıyor: ${url}`); // Terminalde bu yazıyı takip et

    try {
        const response = await axios.get(url, { 
            timeout: 3000, // 3 saniye içinde cevap gelmezse pes et
            headers: { 
                'User-Agent': 'Mozilla/5.0' // Bazı sunucular tarayıcı gibi görünmeyeni reddeder, önlem aldık.
            } 
        });

        const data = response.data;

        // Ekran görüntündeki JSON verisini işliyoruz
        if (data && data.clients !== undefined) {
            return {
                online: true,
                players: data.clients,
                maxPlayers: parseInt(data.sv_maxclients) // String ("8") gelirse sayıya çevir
            };
        } else {
            console.log("Veri formatı hatalı:", data);
            return { online: false };
        }

    } catch (error) {
        console.error("Bağlantı Hatası:", error.message);
        return { online: false };
    }
});

// --- OTOMATİK GÜNCELLEME İŞLEMLERİ ---

// Güncelleme bulundu
autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_message', 'Yeni güncelleme bulundu, indiriliyor...');
});

// Güncelleme iniyor (Yüzde bilgisi istersen burayı geliştirebiliriz)
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "İndiriliyor: " + Math.round(progressObj.percent) + '%';
    mainWindow.webContents.send('update_message', log_message);
});

// Güncelleme bitti
autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_message', 'Güncelleme hazır. Yeniden başlatılıyor...');
    // 3 saniye sonra kapat ve yükle
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 3000);
});