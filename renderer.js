const { ipcRenderer } = require('electron');

document.getElementById('closeBtn').addEventListener('click', () => ipcRenderer.send('app:close'));
document.getElementById('minimizeBtn').addEventListener('click', () => ipcRenderer.send('app:minimize'));

document.getElementById('playBtn').addEventListener('click', () => ipcRenderer.send('game:start'));

const discordBtn = document.querySelector('.nav-btn i.fa-discord').parentElement;
discordBtn.addEventListener('click', () => {
    ipcRenderer.send('open-discord');
});

const clearCacheBtn = document.getElementById('clearCacheBtn');
clearCacheBtn.addEventListener('click', () => {
    clearCacheBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TEMİZLENİYOR...';
    setTimeout(() => {
        ipcRenderer.send('app:clear-cache');
    }, 500); 
});

ipcRenderer.on('cache-cleared', (event, success) => {
    if (success) {
        clearCacheBtn.innerHTML = '<i class="fas fa-check"></i> TEMİZLENDİ!';
        clearCacheBtn.style.borderColor = '#22c55e';
        clearCacheBtn.style.color = '#22c55e';
    } else {
        clearCacheBtn.innerHTML = '<i class="fas fa-times"></i> HATA / ZATEN TEMİZ';
    }
    setTimeout(() => {
        clearCacheBtn.innerHTML = '<i class="fas fa-broom"></i> CACHE TEMİZLE';
        clearCacheBtn.style = '';
    }, 2000);
});

const overlay = document.getElementById('modalOverlay');
const keysModal = document.getElementById('keysModal');
const showcaseModal = document.getElementById('showcaseModal');
const closeButtons = document.querySelectorAll('.close-modal');
const allModals = document.querySelectorAll('.modal-box');

function closeAllModals() {
    overlay.classList.remove('active');
    allModals.forEach(modal => {
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.7)';
    });
}

function openModal(modalElement) {
    closeAllModals(); 
    
    overlay.classList.add('active');
    modalElement.style.display = 'block';
    
    setTimeout(() => {
        modalElement.style.opacity = '1';
        modalElement.style.transform = 'scale(1)';
    }, 10);
}

document.getElementById('openKeysBtn').addEventListener('click', () => openModal(keysModal));
document.getElementById('openShowcaseBtn').addEventListener('click', () => openModal(showcaseModal));

closeButtons.forEach(btn => btn.addEventListener('click', closeAllModals));
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAllModals();
});

const SERVER_URL = "http://127.0.0.1:30120/dynamic.json"; 

const statusDot = document.querySelector('.pulsing-dot');
const statusText = document.querySelector('.status-header span');
const playerCountText = document.querySelector('.player-count');

async function updateServerStatus() {
    try {
        const response = await fetch(SERVER_URL);
        
        if (!response.ok) throw new Error("Bağlantı Hatası");

        const data = await response.json();

        console.log("Gelen Veri:", data);

        statusDot.style.background = "#22c55e"; 
        statusDot.style.boxShadow = "0 0 10px #22c55e";
        statusText.innerText = "SUNUCU AKTİF";
        statusText.style.color = "#22c55e";
        
        playerCountText.innerHTML = `<i class="fas fa-users"></i> ${data.clients} / ${data.sv_maxclients}`;

    } catch (error) {
        console.error("Hata:", error);
        
        statusDot.style.background = "#ef4444"; 
        statusDot.style.boxShadow = "0 0 10px #ef4444";
        statusText.innerText = "SUNUCU KAPALI";
        statusText.style.color = "#ef4444";
        
        playerCountText.innerHTML = `<i class="fas fa-users"></i> - / -`;
    }
}

updateServerStatus();
setInterval(updateServerStatus, 5000);

ipcRenderer.on('update_message', (event, message) => {
    const statusBox = document.getElementById('updateStatus');
    statusBox.innerText = message;
    
    if(message.includes('İndiriliyor')) {
        statusBox.classList.add('pulsing-dot');
    }

});
