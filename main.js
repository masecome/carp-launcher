const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const DiscordRPC = require('discord-rpc');
const axios = require('axios');
const { autoUpdater } = require('electron-updater');

let mainWindow;
const clientId = '1442304896672989186'; 
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 720,
        frame: false,
        resizable: false,
        icon: path.join(__dirname, 'mylogo.png'), 
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

    rpc.login({ clientId }).catch(console.error);
});

rpc.on('ready', () => {
    rpc.setActivity({
        details: 'Rol Yapıyor', 
        state: 'CARP Launcher', 
        startTimestamp: new Date(),
        largeImageKey: 'logo', 
        largeImageText: 'CARP',
        buttons: [
            { label: 'Discorda Katıl', url: 'https://discord.gg/caroleplay' },
            { label: 'Sunucuya Bağlan', url: 'fivem://connect/cfx.re/join/e9pexa' }
        ]
    });
    console.log("Discord RPC Aktif!");
});

ipcMain.on('app:close', () => app.quit());
ipcMain.on('app:minimize', () => mainWindow.minimize());

ipcMain.on('open-discord', () => {
    shell.openExternal('https://discord.gg/caroleplay');
});

ipcMain.on('game:start', () => {
    shell.openExternal('fivem://connect/cfx.re/join/e9pexa');
});

ipcMain.on('app:clear-cache', (event) => {
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

    event.reply('cache-cleared', deletedCount > 0);
});


ipcMain.handle('get-server-status', async (event, ip, port) => {
    const url = `http://${ip}:${port}/dynamic.json`; 
    
    console.log(`Sunucuya bağlanılıyor: ${url}`); 

    try {
        const response = await axios.get(url, { 
            timeout: 3000, 
            headers: { 
                'User-Agent': 'Mozilla/5.0' 
            } 
        });

        const data = response.data;

        if (data && data.clients !== undefined) {
            return {
                online: true,
                players: data.clients,
                maxPlayers: parseInt(data.sv_maxclients) 
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


autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_message', 'Yeni güncelleme bulundu, indiriliyor...');
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "İndiriliyor: " + Math.round(progressObj.percent) + '%';
    mainWindow.webContents.send('update_message', log_message);
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_message', 'Güncelleme hazır. Yeniden başlatılıyor...');
    setTimeout(() => {
        autoUpdater.quitAndInstall();
    }, 3000);

});
