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

// --- LOAD AI (Tanpa delay teks sampah) ---
(async () => {
    try {
        model = await mobilenet.load();
        isModelReady = true;
        loadingText.style.display = "none"; // Langsung ilangin loading pas siap
        console.log("AI Active & Ready");
    } catch (e) {
        console.error("Gagal load AI");
        loadingText.innerText = "Gagal memuat AI. Refresh halaman.";
    }
})();

async function openCamera() {
    stopCamera();
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        webcam.srcObject = currentStream;
        webcam.setAttribute('playsinline', true);
        webcam.style.display = "block";
        imgPrev.style.display = "none";
        btnSnap.style.display = "flex";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        dashboard.classList.remove('visible');
        instruction.innerHTML = "<p>Posisikan tanaman, lalu ambil foto.</p>";
    } catch (e) {
        alert("Kamera gagal dibuka. Gunakan HTTPS.");
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
}

function takePhoto() {
    canvas.width = 400;
    canvas.height = 400;
    
    const minDim = Math.min(webcam.videoWidth, webcam.videoHeight);
    const sx = (webcam.videoWidth - minDim) / 2;
    const sy = (webcam.videoHeight - minDim) / 2;

    canvas.getContext('2d').drawImage(webcam, sx, sy, minDim, minDim, 0, 0, 400, 400);
    
    imgPrev.src = canvas.toDataURL('image/jpeg', 0.8);
    imgPrev.style.display = "block";
    webcam.style.display = "none";
    btnSnap.style.display = "none";
    mainControls.style.display = "none";
    confirmUI.style.display = "flex"; 
    instruction.innerHTML = "<p>Sudah jelas? Tekan <b>V</b> untuk analisa.</p>";
}

function cancelPhoto() {
    imgPrev.style.display = "none";
    webcam.style.display = "block";
    btnSnap.style.display = "flex";
    confirmUI.style.display = "none";
    mainControls.style.display = "flex";
}

function proceedAnalysis() {
    if(!isModelReady) return alert("Tunggu AI siap!");
    
    actionArea.style.display = "none";
    scanner.style.display = "block";
    loadingText.style.display = "block";
    loadingText.innerText = "Menganalisa...";
    stopCamera();
    
    setTimeout(() => { executeAI(imgPrev); }, 300);
}

function handleUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
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
            instruction.innerHTML = "<p>Gambar berhasil dimuat. Tekan <b>V</b> untuk analisa.</p>";
        };
    };
    reader.readAsDataURL(file);
}

// --- LOGIKA ANALISA (FIX HP/TABLET SENSITIVITY) ---
async function executeAI(source) {
    if (!source.complete) {
        await new Promise(r => source.onload = r);
    }

    // Ambil lebih banyak prediksi untuk disaring
    const predictions = await model.classify(source, 10); 
    
    // Database diperluas biar gak gampang nolak di HP
    const floraDatabase = [
        'leaf', 'plant', 'tree', 'flower', 'flora', 'fruit', 'vegetable', 'nature', 'herb', 'shrub',
        'apple', 'banana', 'orange', 'lemon', 'pineapple', 'grape', 'strawberry', 'mango', 'pomegranate',
        'corn', 'maize', 'paddy', 'tomato', 'potato', 'chili', 'cactus', 'succulent', 'orchid', 'rose',
        'bonsai', 'moss', 'fern', 'palm', 'grass', 'bud', 'petal', 'stem', 'branch', 'vein', 'pot', 'garden'
    ];

    // CARI OBJEK FLORA TERBAIK DARI HASIL ANALISA (BUKAN CUMA URUTAN 1)
    let bestFloraMatch = null;
    
    for (let i = 0; i < 5; i++) {
        if (predictions[i]) {
            const currentLabel = predictions[i].className.toLowerCase();
            const isFlora = floraDatabase.some(key => currentLabel.includes(key));
            
            if (isFlora) {
                bestFloraMatch = predictions[i];
                break; // Ketemu yang paling mendekati tanaman, ambil ini!
            }
        }
    }

    loadingText.style.display = "none";
    scanner.style.display = "none";
    actionArea.style.display = "block";

    // JIKA GAK ADA FLORA SAMA SEKALI DALAM 5 HASIL TERATAS
    if (!bestFloraMatch) {
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        
        let detectedObject = predictions[0].className.split(',')[0].toUpperCase();
        
        instruction.innerHTML = `
        <div class="error-box-tua" style="border: 2px solid #ff4444; background: rgba(255,0,0,0.1); padding: 15px; border-radius: 12px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
            <b style="color: #ff4444; font-size: 16px;">BUKAN OBJEK FLORA!</b><br>
            <span style="font-size: 13px; color: #eee;">AI mendeteksi ini sebagai: <b style="color: #ffcc00;">${detectedObject}</b></span>
            <p style="font-size: 11px; margin-top: 8px; color: #bbb;">Analisa gagal. Pastikan kamera fokus pada Daun, Buah, atau Tanaman.</p>
        </div>`;
        return;
    }

    // JIKA LOLOS
    dashboard.classList.add('visible');
    confirmUI.style.display = "none";
    mainControls.style.display = "none";
    instruction.innerHTML = "";

    const name = bestFloraMatch.className.split(',')[0].toUpperCase();
    const score = Math.round(bestFloraMatch.probability * 100);
    
    document.getElementById('res-name').innerText = name;
    document.getElementById('res-percent').innerText = score + "%";
    
    const circle = document.getElementById('res-circle');
    circle.style.strokeDashoffset = 226 - (226 * score / 100);
    
    // Deteksi penyakit dengan fuzzy matching
    const labelLower = bestFloraMatch.className.toLowerCase();
    const isSick = ['brown', 'dry', 'dead', 'rot', 'mold', 'fungus', 'spot', 'yellow', 'wither', 'rust'].some(w => 
        labelLower.includes(w)
    );
    
    const statusEl = document.getElementById('res-status');
    const adviceEl = document.getElementById('res-advice');

    if (isSick || score < 30) {
        statusEl.innerText = "TIDAK SEHAT";
        statusEl.style.color = "#ff4444";
        circle.style.stroke = "#ff4444";
        adviceEl.innerText = "Objek terdeteksi mengalami kerusakan atau gambar kurang detail.";
    } else {
        statusEl.innerText = "SEHAT";
        statusEl.style.color = "#00ff88";
        circle.style.stroke = "#00ff88";
        adviceEl.innerText = "Flora terlihat segar dan normal.";
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
    instruction.innerHTML = "<p>Silahkan upload atau gunakan kamera untuk menganalisis tanaman anda.</p>";
}