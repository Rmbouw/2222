// script.js - Versi SUPER PINTAR
let model;
let currentStream = null;
let isModelReady = false;

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

const PLANT_DB = {
    fruits: [
        'apple', 'apel', 'banana', 'pisang', 'orange', 'jeruk', 'mango', 'mangga', 
        'strawberry', 'stroberi', 'grape', 'anggur', 'watermelon', 'semangka', 
        'pineapple', 'nanas', 'papaya', 'pepaya', 'durian', 'rambutan', 'manggis',
        'mangosteen', 'coconut', 'kelapa', 'avocado', 'alpukat', 'guava', 'jambu',
        'jackfruit', 'nangka', 'salak', 'snake fruit', 'dragon fruit', 'buah naga',
        'kiwi', 'lemon', 'lime', 'jeruk nipis', 'pomegranate', 'delima', 'pear', 'pir',
        'peach', 'persik', 'plum', 'cherry', 'ceri', 'blueberry', 'raspberry', 'blackberry',
        'melon', 'honeydew', 'fig', 'tin', 'date', 'kurma', 'longan', 'kelengkeng',
        'lychee', 'leci', 'soursop', 'sirsak', 'custard apple', 'srikaya'
    ],
    
    // Sayuran (Vegetables)
    vegetables: [
        'tomato', 'tomat', 'chili', 'cabe', 'pepper', 'paprika', 'eggplant', 'terong',
        'cucumber', 'mentimun', 'carrot', 'wortel', 'potato', 'kentang', 'cabbage', 'kubis',
        'spinach', 'bayam', 'lettuce', 'selada', 'broccoli', 'brokoli', 'cauliflower', 'kembang kol',
        'onion', 'bawang merah', 'garlic', 'bawang putih', 'ginger', 'jahe', 'turmeric', 'kunyit',
        'galangal', 'lengkuas', 'lemongrass', 'serai', 'kale', 'celery', 'seledri', 'radish', 'lobak',
        'pumpkin', 'labu', 'squash', 'zucchini', 'bean', 'kacang', 'pea', 'kapri', 'corn', 'jagung'
    ],
    
    // Daun-daunan (Leaves)
    leaves: [
        'leaf', 'daun', 'foliage', 'frond', 'palm leaf', 'daun kelapa', 'banana leaf', 'daun pisang',
        'moringa', 'kelor', 'basil', 'kemangi', 'mint', 'daun mint', 'coriander', 'ketumbar',
        'parsley', 'peterseli', 'curry leaf', 'daun kari', 'bay leaf', 'daun salam', 'lemongrass',
        'pandan', 'screwpine', 'tea leaf', 'daun teh', 'tobacco', 'tembakau', 'betel', 'sirih'
    ],
    
    // Tanaman Hias (Ornamental)
    ornamentals: [
        'rose', 'mawar', 'orchid', 'anggrek', 'lily', 'bunga lili', 'tulip', 'sunflower', 'bunga matahari',
        'jasmine', 'melati', 'hibiscus', 'kembang sepatu', 'lavender', 'frangipani', 'kamboja',
        'chrysanthemum', 'krisan', 'daisy', 'aster', 'marigold', 'gemitir', 'bougainvillea', 'bunga kertas',
        'hydrangea', 'carnation', 'anyelir', 'gardenia', 'kaca piring', 'magnolia', 'cherry blossom', 'sakura'
    ],
    
    // Pohon & Tanaman Besar (Trees)
    trees: [
        'tree', 'pohon', 'bamboo', 'bambu', 'palm', 'kelapa sawit', 'cactus', 'kaktus', 'succulent',
        'fern', 'pakis', 'moss', 'lumut', 'grass', 'rumput', 'banyan', 'beringin', 'mango tree', 'pohon mangga',
        'coconut tree', 'pohon kelapa', 'banana tree', 'pohon pisang', 'rubber tree', 'karet', 'teak', 'jati',
        'mahogany', 'mahoni', 'pine', 'pinus', 'oak', 'maple', 'birch'
    ]
};

// Kata-kata yang menandakan BUKAN tanaman (NON-PLANT)
const NON_PLANT_INDICATORS = [
    'car', 'mobil', 'motor', 'bike', 'sepeda', 'person', 'orang', 'human', 'manusia', 'animal', 'hewan',
    'dog', 'anjing', 'cat', 'kucing', 'bird', 'burung', 'fish', 'ikan', 'building', 'gedung', 'house',
    'rumah', 'chair', 'kursi', 'table', 'meja', 'phone', 'handphone', 'laptop', 'computer', 'komputer',
    'book', 'buku', 'pen', 'pulpen', 'bottle', 'botol', 'cup', 'gelas', 'plate', 'piring', 'food', 'makanan',
    'bread', 'roti', 'cake', 'kue', 'candy', 'permen', 'chocolate', 'coklat', 'shoe', 'sepatu', 'clothes', 'baju',
    'ball', 'bola', 'toy', 'mainan', 'television', 'tv', 'remote', 'key', 'kunci', 'wallet', 'dompet'
];

// Database penyakit tanaman (untuk analisis kesehatan)
const DISEASE_INDICATORS = {
    yellow: ['yellow', 'kuning', 'chlorosis', 'menguning'],
    brown: ['brown', 'coklat', 'necrosis', 'kering'],
    spot: ['spot', 'bercak', 'blight', 'hawar', 'anthracnose'],
    rot: ['rot', 'busuk', 'mold', 'jamur', 'mildew', 'embun'],
    wilt: ['wilt', 'layu', 'fusarium', 'bacterial wilt'],
    rust: ['rust', 'karat', 'puccinia'],
    mosaic: ['mosaic', 'mozaik', 'virus'],
    leaf_curl: ['curl', 'keriting', 'leaf curl']
};

// ==================== UTILITY FUNCTIONS ====================
function getAllPlants() {
    return [
        ...PLANT_DB.fruits,
        ...PLANT_DB.vegetables,
        ...PLANT_DB.leaves,
        ...PLANT_DB.ornamentals,
        ...PLANT_DB.trees
    ];
}

function getPlantCategory(className) {
    const lower = className.toLowerCase();
    
    if (PLANT_DB.fruits.some(f => lower.includes(f))) return 'buah';
    if (PLANT_DB.vegetables.some(v => lower.includes(v))) return 'sayuran';
    if (PLANT_DB.leaves.some(l => lower.includes(l))) return 'daun';
    if (PLANT_DB.ornamentals.some(o => lower.includes(o))) return 'tanaman hias';
    if (PLANT_DB.trees.some(t => lower.includes(t))) return 'pohon';
    
    // Deteksi berdasarkan kata kunci umum
    if (lower.includes('fruit') || lower.includes('buah')) return 'buah';
    if (lower.includes('vegetable') || lower.includes('sayur')) return 'sayuran';
    if (lower.includes('leaf') || lower.includes('daun')) return 'daun';
    if (lower.includes('flower') || lower.includes('bunga')) return 'bunga';
    
    return 'tanaman';
}

// Fungsi cek apakah ini tanaman dengan logika lebih pintar
function isPlant(className, probability) {
    const lower = className.toLowerCase();
    
    // PRIORITAS 1: Cek NON-PLANT (langsung tolak jika ketemu)
    for (let non of NON_PLANT_INDICATORS) {
        if (lower.includes(non)) {
            return false;
        }
    }
    
    // PRIORITAS 2: Cek PLANT di database
    const allPlants = getAllPlants();
    for (let plant of allPlants) {
        if (lower.includes(plant)) {
            return true;
        }
    }
    
    // PRIORITAS 3: Cek kata kunci umum tanaman
    const plantKeywords = ['plant', 'tanaman', 'tree', 'pohon', 'flower', 'bunga', 'fruit', 'buah', 
                          'leaf', 'daun', 'vegetable', 'sayur', 'herb', 'herbal', 'weed', 'gulma',
                          'crop', 'panen', 'garden', 'kebun', 'pot', 'potted', 'seed', 'biji'];
    
    for (let keyword of plantKeywords) {
        if (lower.includes(keyword)) {
            return true;
        }
    }
    
    // PRIORITAS 4: Jika probabilitas tinggi dan ada indikasi hijau/alam
    if (probability > 0.7) {
        const natureIndicators = ['green', 'hijau', 'nature', 'alam', 'outdoor', 'luar', 'garden', 'kebun'];
        for (let ind of natureIndicators) {
            if (lower.includes(ind)) {
                return true;
            }
        }
    }
    
    return false;
}

// Ekstrak nama tanaman dengan format yang rapi
function extractPlantName(className) {
    const lower = className.toLowerCase();
    const allPlants = getAllPlants();
    
    // Cari kecocokan terbaik di database
    let bestMatch = null;
    let bestMatchLength = 0;
    
    for (let plant of allPlants) {
        if (lower.includes(plant)) {
            if (plant.length > bestMatchLength) {
                bestMatchLength = plant.length;
                bestMatch = plant;
            }
        }
    }
    
    if (bestMatch) {
        // Format nama: huruf besar di awal setiap kata
        return bestMatch.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    // Jika tidak ketemu di database, ambil kata pertama dan bersihkan
    let cleanName = className.split(',')[0].trim();
    // Hapus angka dan karakter khusus
    cleanName = cleanName.replace(/[0-9]/g, '').trim();
    // Format huruf besar
    return cleanName.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

// Analisis kesehatan tanaman berdasarkan nama dan probabilitas
function analyzeHealth(className, probability) {
    const lower = className.toLowerCase();
    let healthScore = probability * 100;
    let diseases = [];
    let advice = [];
    
    // Deteksi penyakit berdasarkan kata kunci
    for (let [disease, keywords] of Object.entries(DISEASE_INDICATORS)) {
        for (let keyword of keywords) {
            if (lower.includes(keyword)) {
                diseases.push(disease);
                healthScore -= 25; // Kurangi skor jika ada penyakit
                break;
            }
        }
    }
    
    // Analisis berdasarkan kategori
    const category = getPlantCategory(className);
    
    // Berikan saran berdasarkan kondisi
    if (diseases.length > 0) {
        if (diseases.includes('yellow')) {
            advice.push('Daun menguning - mungkin kekurangan nitrogen atau overwatering');
        }
        if (diseases.includes('brown')) {
            advice.push('Daun coklat/kering - mungkin kekurangan air atau terbakar sinar matahari');
        }
        if (diseases.includes('spot')) {
            advice.push('Terdapat bercak - kemungkinan infeksi jamur atau bakteri');
        }
        if (diseases.includes('rot')) {
            advice.push('Pembusukan terdeteksi - periksa kelembaban dan drainase');
        }
        if (diseases.includes('wilt')) {
            advice.push('Tanaman layu - bisa karena kekurangan air atau serangan akar');
        }
        if (diseases.includes('rust')) {
            advice.push('Karat pada daun - infeksi jamur, perlu fungisida');
        }
    }
    
    // Batasi skor antara 0-100
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));
    
    return {
        score: healthScore,
        diseases: diseases,
        advice: advice,
        category: category
    };
}

// ==================== LOAD AI ====================
(async () => {
    try {
        loadingText.style.display = "block";
        instruction.innerHTML = "<p>Memuat AI Pintar PlantScan...</p>";
        model = await mobilenet.load();
        isModelReady = true;
        loadingText.style.display = "none";
        instruction.innerHTML = "<p>AI siap! Silakan upload foto tanaman.</p>";
        console.log("AI Ready with Smart Detection");
    } catch (e) {
        loadingText.innerHTML = "Gagal memuat AI.";
        console.error(e);
    }
})();

// ==================== KAMERA LOGIC ====================
async function openCamera() {
    stopCamera();
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: "environment", 
                width: { ideal: 1280 }, 
                height: { ideal: 1280 } 
            } 
        });
        webcam.srcObject = currentStream;
        webcam.setAttribute('playsinline', true);
        webcam.style.display = "block";
        imgPrev.style.display = "none";
        btnSnap.style.display = "flex";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        dashboard.classList.remove('visible');
        instruction.innerHTML = "<p>Posisikan tanaman di tengah layar, pastikan pencahayaan cukup.</p>";
    } catch (e) {
        alert("Kamera gagal dibuka. Gunakan HTTPS atau izinkan akses kamera.");
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
}

function takePhoto() {
    canvas.width = 640;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    const vW = webcam.videoWidth;
    const vH = webcam.videoHeight;
    const min = Math.min(vW, vH);
    const sx = (vW - min) / 2;
    const sy = (vH - min) / 2;

    ctx.drawImage(webcam, sx, sy, min, min, 0, 0, 640, 640);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    imgPrev.src = dataUrl;
    
    imgPrev.style.display = "block";
    webcam.style.display = "none";
    btnSnap.style.display = "none";
    mainControls.style.display = "none";
    confirmUI.style.display = "flex"; 
    instruction.innerHTML = "<p>Foto diambil! Tekan ✓ untuk analisis, atau ✗ untuk ulang.</p>";
}

function cancelPhoto() {
    imgPrev.style.display = "none";
    webcam.style.display = "block";
    btnSnap.style.display = "flex";
    confirmUI.style.display = "none";
    mainControls.style.display = "flex";
    instruction.innerHTML = "<p>Posisikan tanaman di tengah layar.</p>";
}

// ==================== UPLOAD LOGIC ====================
function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
        alert('Harap upload file gambar!');
        return;
    }

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
            instruction.innerHTML = "<p>Gambar siap! Tekan ✓ untuk analisis.</p>";
        };
    };
    reader.readAsDataURL(file);
    
    // Reset input file agar bisa upload file yang sama lagi
    e.target.value = '';
}

// ==================== ANALISIS UTAMA (PINTAR) ====================
function proceedAnalysis() {
    if(!isModelReady) return alert("AI belum siap, tunggu sebentar...");
    if(!imgPrev.src || imgPrev.style.display === "none") {
        alert("Tidak ada gambar untuk dianalisis!");
        return;
    }
    
    actionArea.style.display = "none";
    scanner.style.display = "block";
    loadingText.style.display = "block";
    loadingText.innerHTML = '<div class="spinner"></div><p>Menganalisis tanaman dengan AI Pintar...</p>';
    stopCamera();
    
    setTimeout(() => { executeSmartAI(imgPrev); }, 500);
}

async function executeSmartAI(source) {
    try {
        // Ambil 30 prediksi teratas untuk akurasi maksimal
        const predictions = await model.classify(source, 30);
        
        console.log("All Predictions:", predictions); // Untuk debugging
        
        // Filter hanya prediksi tanaman
        const plantPredictions = predictions.filter(p => isPlant(p.className, p.probability));
        
        loadingText.style.display = "none";
        scanner.style.display = "none";
        actionArea.style.display = "block";

        // Jika tidak ada tanaman terdeteksi
        if (plantPredictions.length === 0) {
            confirmUI.style.display = "none";
            mainControls.style.display = "flex";
            
            // Ambil 3 prediksi tertinggi untuk ditampilkan
            const top3 = predictions.slice(0, 3).map(p => 
                p.className.split(',')[0].trim()
            ).join(', ');
            
            instruction.innerHTML = `
            <div style="border: 2px solid #ff4444; background: rgba(255,68,68,0.2); padding: 25px; border-radius: 20px; text-align: center;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 50px; color: #ff4444; margin-bottom: 15px;"></i>
                <br>
                <b style="color: #ff4444; font-size: 20px;">BUKAN TANAMAN!</b><br><br>
                <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px;">
                    <span style="font-size: 14px; color: #ddd;">AI Mendeteksi:</span><br>
                    <span style="font-size: 16px; color: #ffaa00; font-weight: bold;">${top3}</span>
                </div><br>
                <small style="color: #ddd;">Harap foto tanaman, buah, atau daun dengan jelas.<br>
                Pastikan objek utama adalah tanaman dan pencahayaan cukup.</small>
            </div>`;
            return;
        }

        // Ambil prediksi tanaman terbaik (dengan probabilitas tertinggi)
        const bestPlant = plantPredictions.reduce((best, current) => 
            (current.probability > best.probability) ? current : best
        , plantPredictions[0]);

        // Analisis kesehatan
        const healthAnalysis = analyzeHealth(bestPlant.className, bestPlant.probability);
        
        // Ekstrak nama tanaman
        const plantName = extractPlantName(bestPlant.className);
        const category = healthAnalysis.category;
        
        // Tampilkan Dashboard
        dashboard.classList.add('visible');
        confirmUI.style.display = "none";
        mainControls.style.display = "none";

        // Update UI
        document.getElementById('res-name').innerText = plantName;
        document.getElementById('res-percent').innerText = healthAnalysis.score + "%";
        
        const circle = document.getElementById('res-circle');
        circle.style.strokeDashoffset = 226 - (226 * healthAnalysis.score / 100);
        
        // Tentukan status dan warna berdasarkan skor kesehatan
        const statusEl = document.getElementById('res-status');
        const adviceEl = document.getElementById('res-advice');
        
        if (healthAnalysis.score >= 80) {
            statusEl.innerText = "SEHAT";
            statusEl.style.color = "#00ff88";
            circle.style.stroke = "#00ff88";
            adviceEl.innerText = "Tanaman dalam kondisi sangat baik! Teruskan perawatan yang sudah dilakukan.";
        } 
        else if (healthAnalysis.score >= 60) {
            statusEl.innerText = "CUKUP SEHAT";
            statusEl.style.color = "#ffaa00";
            circle.style.stroke = "#ffaa00";
            
            if (healthAnalysis.advice.length > 0) {
                adviceEl.innerText = healthAnalysis.advice[0];
            } else {
                adviceEl.innerText = "Tanaman cukup sehat, namun bisa ditingkatkan perawatannya.";
            }
        }
        else if (healthAnalysis.score >= 40) {
            statusEl.innerText = "KURANG SEHAT";
            statusEl.style.color = "#ff884d";
            circle.style.stroke = "#ff884d";
            
            if (healthAnalysis.advice.length > 0) {
                adviceEl.innerText = healthAnalysis.advice[0];
            } else {
                adviceEl.innerText = "Tanaman membutuhkan perhatian lebih. Periksa kondisi tanah dan lingkungan.";
            }
        }
        else {
            statusEl.innerText = "KRITIS";
            statusEl.style.color = "#ff4444";
            circle.style.stroke = "#ff4444";
            
            if (healthAnalysis.advice.length > 0) {
                adviceEl.innerText = healthAnalysis.advice[0] + " Segera lakukan tindakan penyelamatan!";
            } else {
                adviceEl.innerText = "Tanaman dalam kondisi kritis! Periksa kemungkinan penyakit serius atau kekurangan nutrisi.";
            }
        }
        
        // Tampilkan detail di instruction
        let categoryIcon = "🌱";
        if (category === 'buah') categoryIcon = "🍎";
        else if (category === 'sayuran') categoryIcon = "🥕";
        else if (category === 'daun') categoryIcon = "🍃";
        else if (category === 'bunga') categoryIcon = "🌸";
        else if (category === 'pohon') categoryIcon = "🌳";
        
        let diseaseInfo = "";
        if (healthAnalysis.diseases.length > 0) {
            diseaseInfo = `<br><small style="color: #ff884d;">⚠️ Terdeteksi: ${healthAnalysis.diseases.join(', ')}</small>`;
        }
        
        instruction.innerHTML = `
            <p>
                ${categoryIcon} <b>${category.toUpperCase()}</b> terdeteksi<br>
                Nama: ${plantName}<br>
                Kepercayaan: ${Math.round(bestPlant.probability * 100)}%
                ${diseaseInfo}
            </p>
        `;

    } catch (error) {
        console.error("Error in AI execution:", error);
        loadingText.style.display = "none";
        scanner.style.display = "none";
        actionArea.style.display = "block";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        
        instruction.innerHTML = `
        <div style="border: 2px solid #ff4444; background: rgba(255,68,68,0.2); padding: 20px; border-radius: 15px;">
            <b style="color: #ff4444;">Terjadi Kesalahan</b><br>
            <small>Silakan coba lagi atau upload gambar lain</small>
        </div>`;
    }
}

// ==================== RESET ====================
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
    instruction.innerHTML = "<p>Pilih kamera atau upload gambar tanaman.</p>";
}

window.addEventListener('load', () => {
    console.log("PlantScan AI Super Siap!");
});

if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    console.log("Mode HP terdeteksi - optimasi kamera");
}