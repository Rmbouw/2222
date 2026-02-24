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
const ctx = canvas.getContext('2d');

const PLANTS = [
    'apple', 'apel', 'banana', 'pisang', 'orange', 'jeruk', 'mango', 'mangga',
    'strawberry', 'stroberi', 'grape', 'anggur', 'watermelon', 'semangka',
    'pineapple', 'nanas', 'papaya', 'pepaya', 'durian', 'rambutan', 'manggis',
    'avocado', 'alpukat', 'guava', 'jambu', 'jackfruit', 'nangka', 'salak',
    'coconut', 'kelapa', 'lemon', 'kiwi', 'pear', 'pir', 'peach', 'persik',
    'plum', 'cherry', 'ceri', 'pomegranate', 'delima', 'dragon fruit', 'buah naga',
    'lime', 'jeruk nipis', 'grapefruit', 'mandarin', 'sunkist',
    
    // SAYUR-SAYURAN
    'tomato', 'tomat', 'cucumber', 'mentimun', 'carrot', 'wortel', 'potato', 'kentang',
    'cabbage', 'kubis', 'broccoli', 'brokoli', 'cauliflower', 'kembang kol',
    'spinach', 'bayam', 'lettuce', 'selada', 'kale', 'celery', 'seledri',
    'onion', 'bawang', 'garlic', 'bawang putih', 'chili', 'cabe', 'pepper', 'paprika',
    'eggplant', 'terong', 'pumpkin', 'labu', 'corn', 'jagung', 'bean', 'kacang',
    'radish', 'lobak', 'ginger', 'jahe', 'turmeric', 'kunyit',
    
    'leaf', 'daun', 'basil', 'kemangi', 'mint', 'coriander', 'ketumbar',
    'parsley', 'peterseli', 'spinach leaf', 'cabbage leaf', 'lettuce leaf',
    'banana leaf', 'daun pisang', 'papaya leaf', 'daun pepaya', 'moringa', 'kelor',
    
    'rose', 'mawar', 'orchid', 'anggrek', 'sunflower', 'bunga matahari',
    'lily', 'tulip', 'jasmine', 'melati', 'hibiscus', 'kembang sepatu',
    'lavender', 'frangipani', 'kamboja', 'snake plant', 'lidah mertua',
    'aloe vera', 'lidah buaya', 'cactus', 'kaktus', 'succulent', 'sukulen'
];

const NON_PLANTS = [
    'person', 'people', 'man', 'woman', 'child', 'baby', 'human', 'face',
    'hand', 'foot', 'arm', 'leg', 'head', 'hair', 'eye', 'mouth',
    
    'dog', 'cat', 'bird', 'fish', 'cow', 'horse', 'chicken', 'duck',
    'rabbit', 'snake', 'lizard', 'insect', 'bug', 'butterfly', 'bee',
    'ant', 'spider', 'rat', 'mouse', 'elephant', 'tiger', 'lion',
    
    'car', 'truck', 'bus', 'motorcycle', 'bicycle', 'airplane', 'boat',
    'train', 'vehicle', 'scooter', 'skateboard',
    
    'phone', 'laptop', 'computer', 'tablet', 'television', 'tv', 'camera',
    'monitor', 'keyboard', 'mouse', 'speaker', 'headphone', 'radio',
    
    'pizza', 'burger', 'sandwich', 'cake', 'cookie', 'bread', 'rice',
    'noodle', 'soup', 'salad', 'chocolate', 'candy', 'ice cream',
    'fries', 'chips', 'sausage', 'meat', 'egg', 'cheese',
    
    'book', 'pen', 'pencil', 'paper', 'bottle', 'cup', 'glass', 'plate',
    'bowl', 'fork', 'spoon', 'knife', 'chair', 'table', 'bed', 'lamp',
    'bag', 'wallet', 'key', 'watch', 'shoe', 'clothes', 'shirt',
    
    'building', 'house', 'room', 'wall', 'door', 'window', 'floor',
    'ceiling', 'roof', 'furniture', 'cabinet', 'shelf', 'drawer'
];


function isPlant(className) {
    const lower = className.toLowerCase();
    
    for (let item of NON_PLANTS) {
        if (lower.includes(item)) {
            return false;
        }
    }
    
    for (let plant of PLANTS) {
        if (lower.includes(plant)) {
            return true;
        }
    }
    
    return false;
}

function getPlantName(className) {
    const lower = className.toLowerCase();
    
    for (let plant of PLANTS) {
        if (lower.includes(plant)) {
            return plant.charAt(0).toUpperCase() + plant.slice(1);
        }
    }
    
    let name = className.split(',')[0].trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
}


function getCategory(className) {
    const lower = className.toLowerCase();
    

    const buahKeywords = ['apple', 'banana', 'orange', 'mango', 'grape', 'strawberry', 
                          'watermelon', 'pineapple', 'papaya', 'durian', 'rambutan', 'manggis'];
    for (let keyword of buahKeywords) {
        if (lower.includes(keyword)) return ' BUAH';
    }
   
    const sayurKeywords = ['tomato', 'cucumber', 'carrot', 'potato', 'cabbage', 
                          'broccoli', 'spinach', 'lettuce', 'onion', 'garlic'];
    for (let keyword of sayurKeywords) {
        if (lower.includes(keyword)) return ' SAYURAN';
    }
  
    if (lower.includes('leaf') || lower.includes('daun')) return ' DAUN';
    
    return ' TANAMAN';
}

function analyzeHealth(className) {
    const lower = className.toLowerCase();
    let score = 75; 
    

    if (lower.includes('fresh') || lower.includes('segar') || 
        lower.includes('green') || lower.includes('hijau') ||
        lower.includes('ripe') || lower.includes('matang') ||
        lower.includes('healthy')) {
        score += 15;
    }
    
    if (lower.includes('yellow') || lower.includes('kuning') ||
        lower.includes('brown') || lower.includes('coklat') ||
        lower.includes('dry') || lower.includes('kering') ||
        lower.includes('wilt') || lower.includes('layu') ||
        lower.includes('spot') || lower.includes('bercak') ||
        lower.includes('rot') || lower.includes('busuk')) {
        score -= 25;
    }
    
    score = Math.max(30, Math.min(100, Math.round(score)));
    
    let status, color, advice;
    
    if (score >= 85) {
        status = 'SANGAT SEHAT';
        color = '#00ff88';
        advice = 'Tanaman dalam kondisi sangat baik. Pertahankan perawatan.';
    } else if (score >= 70) {
        status = 'SEHAT';
        color = '#44ff44';
        advice = 'Tanaman sehat. Lanjutkan perawatan rutin.';
    } else if (score >= 55) {
        status = 'CUKUP SEHAT';
        color = '#ffaa00';
        advice = 'Tanaman cukup sehat, perhatikan penyiraman.';
    } else {
        status = 'PERLU PERHATIAN';
        color = '#ff4444';
        advice = 'Tanaman kurang sehat, cek kemungkinan hama/penyakit.';
    }
    
    return { score, status, color, advice };
}

(async () => {
    try {
        loadingText.style.display = "block";
        instruction.innerHTML = "<p>Memuat AI...</p>";
        
        model = await mobilenet.load();
        isModelReady = true;
        
        loadingText.style.display = "none";
        instruction.innerHTML = "<p>✅AI siap! Silakan foto atau upload tanaman.</p>";
        console.log("AI Ready");
    } catch (e) {
        loadingText.innerHTML = "❌Gagal memuat AI. Refresh halaman.";
    }
})();

async function openCamera() {
    stopCamera();
    try {
   
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        
        const constraints = {
            video: {
                facingMode: "environment",
                width: isMobile ? { ideal: 1920 } : { ideal: 1280 },
                height: isMobile ? { ideal: 1920 } : { ideal: 1280 }
            }
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam.srcObject = currentStream;
        webcam.setAttribute('playsinline', 'true');
        webcam.style.display = "block";
        imgPrev.style.display = "none";
        btnSnap.style.display = "flex";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        dashboard.classList.remove('visible');
        
        instruction.innerHTML = "<p>Arahkan ke tanaman, lalu tekan kamera</p>";
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
    canvas.width = 640;
    canvas.height = 640;
    
    const vW = webcam.videoWidth;
    const vH = webcam.videoHeight;
    const min = Math.min(vW, vH);
    const sx = (vW - min) / 2;
    const sy = (vH - min) / 2;

    ctx.drawImage(webcam, sx, sy, min, min, 0, 0, canvas.width, canvas.height);
    
    imgPrev.src = canvas.toDataURL('image/jpeg', 0.9);
    
    imgPrev.style.display = "block";
    webcam.style.display = "none";
    btnSnap.style.display = "none";
    mainControls.style.display = "none";
    confirmUI.style.display = "flex"; 
    instruction.innerHTML = "<p> Foto siap! Tekan ✓ untuk analisis</p>";
}

function cancelPhoto() {
    imgPrev.style.display = "none";
    webcam.style.display = "block";
    btnSnap.style.display = "flex";
    confirmUI.style.display = "none";
    mainControls.style.display = "flex";
    instruction.innerHTML = "<p>📸 Arahkan ke tanaman</p>";
}

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
            instruction.innerHTML = "<p> Gambar siap! Tekan ✓ untuk analisis</p>";
        };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function proceedAnalysis() {
    if(!isModelReady) return alert("AI belum siap, tunggu...");
    if(!imgPrev.src || imgPrev.style.display === "none") {
        alert("Tidak ada gambar!");
        return;
    }
    
    actionArea.style.display = "none";
    scanner.style.display = "block";
    loadingText.style.display = "block";
    loadingText.innerHTML = '<div class="spinner"></div><p> Menganalisis...</p>';
    stopCamera();
    
    setTimeout(() => { analyzeImage(imgPrev); }, 500);
}

async function analyzeImage(source) {
    try {
        const predictions = await model.classify(source, 10);
        
        console.log("Hasil AI:", predictions);
        
        let plantPrediction = null;
        let nonPlantDetected = false;
        
        for (let p of predictions) {
            if (isPlant(p.className)) {
                plantPrediction = p;
                break;
            }
        }
        
        loadingText.style.display = "none";
        scanner.style.display = "none";
        actionArea.style.display = "block";

        if (plantPrediction) {
            const plantName = getPlantName(plantPrediction.className);
            const category = getCategory(plantPrediction.className);
            const health = analyzeHealth(plantPrediction.className);
            
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
  
            instruction.innerHTML = `
                <div style="text-align: center">
                    <p style="font-size: 24px; margin: 5px 0">${category}</p>
                    <p style="font-size: 20px; color: ${health.color}">${plantName}</p>
                    <p>Akurasi: ${Math.round(plantPrediction.probability * 100)}%</p>
                </div>
            `;
            
        } else {
            confirmUI.style.display = "none";
            mainControls.style.display = "flex";
            
            const topPrediction = predictions[0].className.split(',')[0].trim();
            
            instruction.innerHTML = `
                <div style="border: 3px solid #ff4444; background: #2a0000; padding: 25px; border-radius: 20px; text-align: center;">
                    <div style="font-size: 60px; margin-bottom: 10px;">⛔</div>
                    <h2 style="color: #ff4444; margin-bottom: 15px;">BUKAN TANAMAN!</h2>
                    <div style="background: #1a0000; padding: 15px; border-radius: 12px; margin: 15px 0;">
                        <p style="color: #ffaa00;">AI Mendeteksi:</p>
                        <p style="color: white; font-size: 18px; font-weight: bold;">${topPrediction}</p>
                    </div>
                    <p style="color: #aaa; margin-top: 15px;">Hanya menerima foto:<br> TANAMAN |  BUAH |  SAYURAN |  DAUN</p>
                </div>
            `;
        }

    } catch (error) {
        console.error("Error:", error);
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
    instruction.innerHTML = "<p>Pilih kamera atau upload gambar untuk menganalisis</p>";
}