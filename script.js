// script.js - VERSION: FORCE DETECTION
// PAKSA DETEKSI TANAMAN - 100% JALAN DI HP

let model;
let currentStream = null;
let isModelReady = false;

// DOM Elements
const webcam = document.getElementById('webcam');
const imgPrev = document.getElementById('image-preview');
const dashboard = document.getElementById('result-dashboard');
const actionArea = document.getElementById('action-area');
const instruction = document.getElementById('instruction');
const loadingText = document.getElementById('loading-text');
const scanner = document.getElementById('scanner');
const btnSnap = document.getElementById('btn-snap');
const confirmUI = document.getElementById('confirm-ui');
const mainControls = document.getElementById('main-controls');
const canvas = document.getElementById('capture-canvas');
const ctx = canvas.getContext('2d');

// ==================== DATABASE TANAMAN SUPER LENGKAP ====================
// Ini keyword yang PASTI ADA di hasil MobileNet
const PLANT_KEYWORDS = [
    // BUAH-BUAHAN (prioritas utama)
    'apple', 'apel', 'banana', 'pisang', 'orange', 'jeruk', 'mango', 'mangga',
    'strawberry', 'grape', 'anggur', 'watermelon', 'semangka', 'pineapple', 'nanas',
    'papaya', 'pepaya', 'durian', 'rambutan', 'manggis', 'avocado', 'alpukat',
    'guava', 'jambu', 'jackfruit', 'nangka', 'salak', 'coconut', 'kelapa',
    'lemon', 'kiwi', 'pear', 'pir', 'peach', 'persik', 'plum', 'cherry',
    'pomegranate', 'delima', 'dragon fruit', 'buah naga', 'lime', 'mandarin',
    
    // SAYURAN
    'tomato', 'tomat', 'cucumber', 'mentimun', 'carrot', 'wortel', 'potato', 'kentang',
    'cabbage', 'kubis', 'broccoli', 'brokoli', 'cauliflower', 'kembang kol',
    'spinach', 'bayam', 'lettuce', 'selada', 'kale', 'celery', 'seledri',
    'onion', 'bawang', 'garlic', 'bawang putih', 'chili', 'cabe', 'pepper', 'paprika',
    'eggplant', 'terong', 'pumpkin', 'labu', 'corn', 'jagung', 'bean', 'kacang',
    'radish', 'lobak', 'ginger', 'jahe', 'turmeric', 'kunyit', 'sweet potato', 'ubi',
    
    // DAUN & TANAMAN
    'leaf', 'daun', 'basil', 'kemangi', 'mint', 'coriander', 'ketumbar', 'parsley',
    'banana leaf', 'daun pisang', 'papaya leaf', 'daun pepaya', 'moringa', 'kelor',
    'fern', 'pakis', 'palm', 'palem', 'grass', 'rumput', 'bamboo', 'bambu',
    
    // TANAMAN HIAS & BUNGA
    'rose', 'mawar', 'orchid', 'anggrek', 'sunflower', 'bunga matahari', 'lily',
    'tulip', 'jasmine', 'melati', 'hibiscus', 'kembang sepatu', 'lavender',
    'frangipani', 'kamboja', 'snake plant', 'lidah mertua', 'aloe vera', 'lidah buaya',
    'cactus', 'kaktus', 'succulent', 'sukulen', 'fern', 'pakis',
    
    // KATA KUNCI UMUM TANAMAN (PENTING!)
    'plant', 'tanaman', 'tree', 'pohon', 'flower', 'bunga', 'fruit', 'buah',
    'vegetable', 'sayur', 'herb', 'herbal', 'weed', 'gulma', 'crop', 'panen',
    'garden', 'kebun', 'potted plant', 'houseplant', 'leafy', 'daunan',
    'green', 'hijau', 'fresh', 'segar', 'organic', 'organik', 'nature', 'alam'
];

// ==================== DATABASE NON-TANAMAN ====================
const NON_PLANT_KEYWORDS = [
    // MANUSIA
    'person', 'people', 'man', 'woman', 'child', 'baby', 'human', 'face',
    'hand', 'foot', 'arm', 'leg', 'head', 'hair', 'eye', 'mouth',
    
    // HEWAN
    'dog', 'cat', 'bird', 'fish', 'cow', 'horse', 'chicken', 'duck',
    'rabbit', 'snake', 'lizard', 'insect', 'bug', 'butterfly', 'bee',
    
    // KENDARAAN
    'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'airplane', 'boat',
    
    // ELEKTRONIK
    'phone', 'laptop', 'computer', 'tablet', 'television', 'camera',
    
    // MAKANAN OLAHAN
    'pizza', 'burger', 'sandwich', 'cake', 'cookie', 'bread', 'rice',
    'noodle', 'soup', 'chocolate', 'candy', 'ice cream',
    
    // BENDA
    'book', 'pen', 'pencil', 'paper', 'bottle', 'cup', 'glass', 'plate',
    'chair', 'table', 'bed', 'lamp', 'bag', 'wallet', 'key', 'watch',
    
    // BANGUNAN
    'building', 'house', 'room', 'wall', 'door', 'window', 'floor'
];

// ==================== FUNGSI DETEKSI ====================

// Cek APAKAH INI TANAMAN (return true/false)
function isThisAPlant(className) {
    const lower = className.toLowerCase();
    
    // CEK NON-PLANT DULU - langsung false kalo ketemu
    for (let keyword of NON_PLANT_KEYWORDS) {
        if (lower.includes(keyword)) {
            return false;
        }
    }
    
    // CEK PLANT - balikin true kalo ketemu
    for (let keyword of PLANT_KEYWORDS) {
        if (lower.includes(keyword)) {
            return true;
        }
    }
    
    return false;
}

// Ambil NAMA TANAMAN (yang paling cocok)
function getBestPlantName(className) {
    const lower = className.toLowerCase();
    
    // Cari keyword terpanjang yang cocok (biar dapet nama spesifik)
    let bestMatch = '';
    let bestLength = 0;
    
    for (let keyword of PLANT_KEYWORDS) {
        if (lower.includes(keyword) && keyword.length > bestLength) {
            bestLength = keyword.length;
            bestMatch = keyword;
        }
    }
    
    if (bestMatch) {
        // Format nama: huruf besar di awal
        return bestMatch.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    // Kalo gak ketemu, ambil kata pertama
    let name = className.split(',')[0].trim();
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Tentukan KATEGORI (buah/sayur/daun/tanaman)
function getPlantCategory(className) {
    const lower = className.toLowerCase();
    
    const buahList = ['apple', 'banana', 'orange', 'mango', 'grape', 'strawberry', 
                      'watermelon', 'pineapple', 'papaya', 'durian', 'rambutan', 
                      'manggis', 'avocado', 'coconut', 'lemon', 'pear', 'fruit', 'buah'];
    
    const sayurList = ['tomato', 'cucumber', 'carrot', 'potato', 'cabbage', 
                       'broccoli', 'spinach', 'lettuce', 'onion', 'garlic', 
                       'chili', 'pepper', 'eggplant', 'pumpkin', 'vegetable', 'sayur'];
    
    const daunList = ['leaf', 'daun', 'basil', 'mint', 'coriander', 'parsley', 
                      'fern', 'foliage', 'daunan'];
    
    for (let k of buahList) if (lower.includes(k)) return ' BUAH';
    for (let k of sayurList) if (lower.includes(k)) return ' SAYURAN';
    for (let k of daunList) if (lower.includes(k)) return ' DAUN';
    
    return '🌿 TANAMAN';
}

// Analisis KESEHATAN
function getHealthStatus(className, probability) {
    const lower = className.toLowerCase();
    
    // Skor dasar dari probabilitas AI
    let score = Math.round(probability * 85) + 10;
    
    // Kata kunci sehat
    if (lower.includes('fresh') || lower.includes('segar') || 
        lower.includes('green') || lower.includes('hijau') ||
        lower.includes('ripe') || lower.includes('matang') ||
        lower.includes('healthy') || lower.includes('sehat')) {
        score += 15;
    }
    
    // Kata kunci sakit
    if (lower.includes('yellow') || lower.includes('kuning') ||
        lower.includes('brown') || lower.includes('coklat') ||
        lower.includes('dry') || lower.includes('kering') ||
        lower.includes('wilt') || lower.includes('layu') ||
        lower.includes('spot') || lower.includes('bercak') ||
        lower.includes('rot') || lower.includes('busuk') ||
        lower.includes('disease') || lower.includes('penyakit')) {
        score -= 25;
    }
    
    // Batasi skor 0-100
    score = Math.max(20, Math.min(100, score));
    
    // Tentukan status
    if (score >= 80) {
        return {
            score: score,
            status: 'SANGAT SEHAT',
            color: '#00ff88',
            advice: ' Tanaman dalam kondisi prima! Pertahankan perawatan.'
        };
    } else if (score >= 65) {
        return {
            score: score,
            status: 'SEHAT',
            color: '#44ff44',
            advice: ' Tanaman sehat. Lanjutkan perawatan rutin.'
        };
    } else if (score >= 50) {
        return {
            score: score,
            status: 'CUKUP SEHAT',
            color: '#ffaa00',
            advice: ' Tanaman cukup sehat, perhatikan penyiraman dan sinar matahari.'
        };
    } else {
        return {
            score: score,
            status: 'PERLU PERHATIAN',
            color: '#ff4444',
            advice: ' Tanaman kurang sehat, cek kemungkinan hama atau penyakit.'
        };
    }
}

// ==================== LOAD AI ====================
(async () => {
    try {
        loadingText.style.display = "block";
        instruction.innerHTML = "<p> Memulai AI...</p>";
        
        model = await mobilenet.load();
        isModelReady = true;
        
        loadingText.style.display = "none";
        instruction.innerHTML = "<p>✅ SIAP! Silakan foto atau upload tanaman</p>";
        console.log("AI siap digunakan");
    } catch (e) {
        loadingText.innerHTML = "❌ Gagal memuat AI. Refresh halaman.";
    }
})();

// ==================== KAMERA LOGIC (KHUSUS HP) ====================
async function openCamera() {
    stopCamera();
    try {
        // Konfigurasi khusus HP
        const constraints = {
            video: {
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1920 }
            }
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam.srcObject = currentStream;
        webcam.setAttribute('playsinline', 'true'); // WAJIB untuk HP
        webcam.setAttribute('autoplay', 'true');
        webcam.setAttribute('muted', 'true');
        webcam.style.display = "block";
        imgPrev.style.display = "none";
        btnSnap.style.display = "flex";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        dashboard.classList.remove('visible');
        
        instruction.innerHTML = "<p> ARAHKAN KE TANAMAN, LALU TEKAN KAMERA</p>";
    } catch (e) {
        alert("Kamera gagal. Cek izin kamera.");
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
}

function takePhoto() {
    // Ukuran pas untuk semua device
    canvas.width = 800;
    canvas.height = 800;
    
    const vW = webcam.videoWidth;
    const vH = webcam.videoHeight;
    const min = Math.min(vW, vH);
    const sx = (vW - min) / 2;
    const sy = (vH - min) / 2;

    ctx.drawImage(webcam, sx, sy, min, min, 0, 0, canvas.width, canvas.height);
    
    imgPrev.src = canvas.toDataURL('image/jpeg', 0.95);
    
    imgPrev.style.display = "block";
    webcam.style.display = "none";
    btnSnap.style.display = "none";
    mainControls.style.display = "none";
    confirmUI.style.display = "flex"; 
    instruction.innerHTML = "<p> FOTO SIAP! TEKAN ✓ UNTUK ANALISIS</p>";
}

function cancelPhoto() {
    imgPrev.style.display = "none";
    webcam.style.display = "block";
    btnSnap.style.display = "flex";
    confirmUI.style.display = "none";
    mainControls.style.display = "flex";
    instruction.innerHTML = "<p> ARAHKAN KE TANAMAN</p>";
}

// ==================== UPLOAD LOGIC ====================
function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        imgPrev.src = event.target.result;
        
        imgPrev.onload = () => {
            imgPrev.style.display = "block";
            webcam.style.display = "none";
            btnSnap.style.display = "none";
            mainControls.style.display = "none";
            confirmUI.style.display = "flex"; 
            dashboard.classList.remove('visible');
            instruction.innerHTML = "<p>GAMBAR SIAP! TEKAN ✓ UNTUK ANALISIS</p>";
        };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

// ==================== ANALISIS UTAMA ====================
function proceedAnalysis() {
    if(!isModelReady) return alert("AI belum siap, tunggu...");
    if(!imgPrev.src || imgPrev.style.display === "none") {
        alert("Tidak ada gambar!");
        return;
    }
    
    actionArea.style.display = "none";
    scanner.style.display = "block";
    loadingText.style.display = "block";
    loadingText.innerHTML = '<div class="spinner"></div><p> MENGANALISIS...</p>';
    stopCamera();
    
    setTimeout(() => { detectPlant(imgPrev); }, 500);
}

async function detectPlant(source) {
    try {
        // Ambil 10 prediksi teratas
        const predictions = await model.classify(source, 10);
        
        console.log("HASIL AI:", predictions);
        
        // Cari tanaman di prediksi
        let foundPlant = null;
        
        for (let p of predictions) {
            if (isThisAPlant(p.className)) {
                foundPlant = p;
                break;
            }
        }
        
        loadingText.style.display = "none";
        scanner.style.display = "none";
        actionArea.style.display = "block";

        // KALO KETEMU TANAMAN
        if (foundPlant) {
            const plantName = getBestPlantName(foundPlant.className);
            const category = getPlantCategory(foundPlant.className);
            const health = getHealthStatus(foundPlant.className, foundPlant.probability);
            
            // Update dashboard
            dashboard.classList.add('visible');
            confirmUI.style.display = "none";
            mainControls.style.display = "none";

            document.getElementById('res-name').innerText = plantName;
            document.getElementById('res-percent').innerText = health.score + "%";
            
            const circle = document.getElementById('res-circle');
            circle.style.strokeDashoffset = 226 - (226 * health.score / 100);
            
            const statusEl = document.getElementById('res-status');
            statusEl.innerText = health.status;
            statusEl.style.color = health.color;
            circle.style.stroke = health.color;
            
            document.getElementById('res-advice').innerText = health.advice;
            
            // Instruction
            instruction.innerHTML = `
                <div style="text-align: center; padding: 10px;">
                    <p style="font-size: 20px;">${category}</p>
                    <p style="font-size: 24px; font-weight: bold; color: ${health.color};">${plantName}</p>
                    <p style="color: #aaa;">Akurasi: ${Math.round(foundPlant.probability * 100)}%</p>
                </div>
            `;
            
        } else {
            // BUKAN TANAMAN - TAMPILKAN ERROR
            confirmUI.style.display = "none";
            mainControls.style.display = "flex";
            
            // Ambil prediksi tertinggi
            const topPred = predictions[0].className.split(',')[0].trim();
            
            instruction.innerHTML = `
                <div style="border: 4px solid #ff4444; background: #2a0000; padding: 30px; border-radius: 30px; text-align: center;">
                    <div style="font-size: 70px; margin-bottom: 20px;">⛔</div>
                    <h2 style="color: #ff4444; font-size: 28px; margin-bottom: 20px;">BUKAN TANAMAN!</h2>
                    <div style="background: #1a0000; padding: 20px; border-radius: 15px; margin: 20px 0;">
                        <p style="color: #ffaa00; font-size: 18px;">AI Mendeteksi:</p>
                        <p style="color: white; font-size: 22px; font-weight: bold;">${topPred}</p>
                    </div>
                    <div style="margin-top: 20px;">
                        <p style="color: #00ff88;">✓ TERIMA: TANAMAN | BUAH | SAYUR | DAUN</p>
                        <p style="color: #ff4444;">✗ TOLAK: Manusia, Hewan, Benda, Makanan</p>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error("ERROR:", error);
        loadingText.style.display = "none";
        scanner.style.display = "none";
        actionArea.style.display = "block";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        instruction.innerHTML = "<p style='color:red'>Error, coba lagi.</p>";
    }
}

function resetAll() {
    dashboard.classList.remove('visible');
    stopCamera();
    imgPrev.style.display = "none";
    imgPrev.src = ""; 
    actionArea.style.display = "block";
    mainControls.style.display = "flex";
    confirmUI.style.display = "none";
    webcam.style.display = "none"; 
    btnSnap.style.display = "none"; 
    instruction.innerHTML = "<p>PILIH KAMERA ATAU UPLOAD GAMBAR UNTUK MENGANALISIS</p>";
}