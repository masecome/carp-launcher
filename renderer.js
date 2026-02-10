const { ipcRenderer } = require('electron');

// --- BUTON TANIMLAMALARI ---
document.getElementById('closeBtn').addEventListener('click', () => ipcRenderer.send('app:close'));
document.getElementById('minimizeBtn').addEventListener('click', () => ipcRenderer.send('app:minimize'));

document.getElementById('playBtn').addEventListener('click', () => ipcRenderer.send('game:start'));

// Discord Butonu (Sol Menüdeki)
const discordBtn = document.querySelector('.nav-btn i.fa-discord').parentElement;
discordBtn.addEventListener('click', () => {
    ipcRenderer.send('open-discord');
});

// Cache Temizle
const clearCacheBtn = document.getElementById('clearCacheBtn');
clearCacheBtn.addEventListener('click', () => {
    clearCacheBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TEMİZLENİYOR...';
    setTimeout(() => {
        ipcRenderer.send('app:clear-cache');
    }, 500); // Animasyon görünsün diye ufak gecikme
});

// Cache Temizlendi Yanıtı
ipcRenderer.on('cache-cleared', (event, success) => {
    if (success) {
        clearCacheBtn.innerHTML = '<i class="fas fa-check"></i> TEMİZLENDİ!';
        clearCacheBtn.style.borderColor = '#22c55e';
        clearCacheBtn.style.color = '#22c55e';
    } else {
        clearCacheBtn.innerHTML = '<i class="fas fa-times"></i> HATA / ZATEN TEMİZ';
    }
    // 2 saniye sonra eski haline dön
    setTimeout(() => {
        clearCacheBtn.innerHTML = '<i class="fas fa-broom"></i> CACHE TEMİZLE';
        clearCacheBtn.style = '';
    }, 2000);
});

// --- POP-UP (MODAL) SİSTEMİ ---
const overlay = document.getElementById('modalOverlay');
const keysModal = document.getElementById('keysModal');
const showcaseModal = document.getElementById('showcaseModal');
const closeButtons = document.querySelectorAll('.close-modal');
const allModals = document.querySelectorAll('.modal-box');

// Tüm pencereleri kapatan fonksiyon
function closeAllModals() {
    overlay.classList.remove('active');
    allModals.forEach(modal => {
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.7)';
    });
}

// Bir pencere açma fonksiyonu
function openModal(modalElement) {
    closeAllModals(); // Önce diğerlerini kapat
    
    overlay.classList.add('active');
    modalElement.style.display = 'block';
    
    // Animasyonun çalışması için mini gecikme
    setTimeout(() => {
        modalElement.style.opacity = '1';
        modalElement.style.transform = 'scale(1)';
    }, 10);
}

// Butonlara Tıklama
document.getElementById('openKeysBtn').addEventListener('click', () => openModal(keysModal));
document.getElementById('openShowcaseBtn').addEventListener('click', () => openModal(showcaseModal));

// Kapatma Tuşları
closeButtons.forEach(btn => btn.addEventListener('click', closeAllModals));
overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAllModals();
});

// --- CANLI SUNUCU DURUMU (GERÇEK ZAMANLI) ---

// Buraya tarayıcıda çalışan adresin AYNISINI yaz
const SERVER_URL = "http://127.0.0.1:30120/dynamic.json"; 

const statusDot = document.querySelector('.pulsing-dot');
const statusText = document.querySelector('.status-header span');
const playerCountText = document.querySelector('.player-count');

async function updateServerStatus() {
    try {
        // Direkt adrese istek atıyoruz (Artık engel yok!)
        const response = await fetch(SERVER_URL);
        
        if (!response.ok) throw new Error("Bağlantı Hatası");

        const data = await response.json();

        // Konsola yazdıralım ki çalıştığını gör (Ctrl+Shift+I ile bakabilirsin)
        console.log("Gelen Veri:", data);

        // SUNUCU AÇIKSA
        statusDot.style.background = "#22c55e"; 
        statusDot.style.boxShadow = "0 0 10px #22c55e";
        statusText.innerText = "SUNUCU AKTİF";
        statusText.style.color = "#22c55e";
        
        // dynamic.json içindeki verileri yazdırıyoruz
        // clients: Oyuncu sayısı, sv_maxclients: Kapasite
        playerCountText.innerHTML = `<i class="fas fa-users"></i> ${data.clients} / ${data.sv_maxclients}`;

    } catch (error) {
        // SUNUCU KAPALIYSA
        console.error("Hata:", error);
        
        statusDot.style.background = "#ef4444"; 
        statusDot.style.boxShadow = "0 0 10px #ef4444";
        statusText.innerText = "SUNUCU KAPALI";
        statusText.style.color = "#ef4444";
        
        playerCountText.innerHTML = `<i class="fas fa-users"></i> - / -`;
    }
}

// Başlat
updateServerStatus();
setInterval(updateServerStatus, 5000);

// Güncelleme Mesajlarını Al
ipcRenderer.on('update_message', (event, message) => {
    const statusBox = document.getElementById('updateStatus');
    statusBox.innerText = message;
    
    // Eğer indirme yapılıyorsa yazıyı yanıp söndür
    if(message.includes('İndiriliyor')) {
        statusBox.classList.add('pulsing-dot'); // Mevcut animasyonu kullandık
    }
});