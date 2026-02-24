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

// --- LOAD AI (Tanpa delay, langsung sikat) ---
(async () => {
    try {
        model = await mobilenet.load();
        isModelReady = true;
        loadingText.style.display = "none";
        console.log("AI Ready");
    } catch (e) {
        loadingText.innerText = "Gagal memuat AI.";
    }
})();

async function openCamera() {
    stopCamera();
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } } 
        });
        webcam.srcObject = currentStream;
        webcam.setAttribute('playsinline', true);
        webcam.style.display = "block";
        imgPrev.style.display = "none";
        btnSnap.style.display = "flex";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        dashboard.classList.remove('visible');
        instruction.innerHTML = "<p>Posisikan objek di tengah layar.</p>";
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
    // Gunakan ukuran 300px agar memori HP gak berat dan gambar PASTI muncul
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Ambil ukuran asli video
    const vW = webcam.videoWidth;
    const vH = webcam.videoHeight;
    const min = Math.min(vW, vH);
    const sx = (vW - min) / 2;
    const sy = (vH - min) / 2;

    // Gambar ke canvas
    ctx.drawImage(webcam, sx, sy, min, min, 0, 0, 300, 300);
    
    // Konversi ke Base64 (Gambar Preview)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    imgPrev.src = dataUrl;
    
    // Update UI
    imgPrev.style.display = "block";
    webcam.style.display = "none";
    btnSnap.style.display = "none";
    mainControls.style.display = "none";
    confirmUI.style.display = "flex"; 
    instruction.innerHTML = "<p>Gambar tertangkap! Tekan <b>V</b> untuk analisa.</p>";
}

function proceedAnalysis() {
    if(!isModelReady) return alert("AI Belum Siap!");
    
    actionArea.style.display = "none";
    scanner.style.display = "block";
    loadingText.style.display = "block";
    loadingText.innerText = "Menganalisa Flora...";
    stopCamera();
    
    // Jalankan eksekusi
    setTimeout(() => { executeAI(imgPrev); }, 500);
}

async function executeAI(source) {
    // Ambil 15 prediksi agar pencarian flora lebih luas
    const predictions = await model.classify(source, 15); 
    
    // Keyword flora super luas
    const floraDB = [
        'leaf', 'plant', 'tree', 'flower', 'flora', 'fruit', 'vegetable', 'nature', 'herb', 'shrub',
        'apple', 'banana', 'orange', 'lemon', 'pineapple', 'grape', 'strawberry', 'mango', 'pomegranate',
        'corn', 'maize', 'paddy', 'tomato', 'potato', 'chili', 'cactus', 'succulent', 'orchid', 'rose',
        'bonsai', 'moss', 'fern', 'palm', 'grass', 'bud', 'petal', 'stem', 'branch', 'vein', 'pot', 'garden',
        'produce', 'buckeye', 'custard apple', 'guava', 'jackfruit', 'organism'
    ];

    // Hunter: Cari yang paling mendekati flora
    let bestMatch = null;
    for (let p of predictions) {
        if (floraDB.some(key => p.className.toLowerCase().includes(key))) {
            bestMatch = p;
            break;
        }
    }

    loadingText.style.display = "none";
    scanner.style.display = "none";
    actionArea.style.display = "block";

    // Jika tidak ada flora sama sekali
    if (!bestMatch) {
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        let topFail = predictions[0].className.split(',')[0].toUpperCase();
        
        instruction.innerHTML = `
        <div style="border: 2px solid #ff4444; background: rgba(255,0,0,0.1); padding: 15px; border-radius: 12px; text-align: center;">
            <b style="color: #ff4444;">⚠️ BUKAN FLORA</b><br>
            <span style="font-size: 13px; color: #eee;">AI mendeteksi: <b style="color: #ffcc00;">${topFail}</b></span>
            <p style="font-size: 11px; margin-top: 8px; color: #bbb;">Mohon foto Daun, Buah, atau Tanaman lebih dekat.</p>
        </div>`;
        return;
    }

    // Tampilkan Hasil
    dashboard.classList.add('visible');
    confirmUI.style.display = "none";
    mainControls.style.display = "none";
    instruction.innerHTML = "";

    const name = bestMatch.className.split(',')[0].toUpperCase();
    const score = Math.round(bestMatch.probability * 100);
    
    document.getElementById('res-name').innerText = name;
    document.getElementById('res-percent').innerText = score + "%";
    
    const circle = document.getElementById('res-circle');
    circle.style.strokeDashoffset = 226 - (226 * score / 100);
    
    // Status kesehatan
    const label = bestMatch.className.toLowerCase();
    const sick = ['yellow', 'brown', 'dry', 'dead', 'spot', 'rot', 'rust', 'mold'].some(s => label.includes(s));

    const statusEl = document.getElementById('res-status');
    if (sick || score < 30) {
        statusEl.innerText = "KONDISI BURUK";
        statusEl.style.color = "#ff4444";
        circle.style.stroke = "#ff4444";
    } else {
        statusEl.innerText = "KONDISI SEHAT";
        statusEl.style.color = "#00ff88";
        circle.style.stroke = "#00ff88";
    }
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
            instruction.innerHTML = "<p>Gambar dimuat! Tekan <b>V</b> untuk analisa.</p>";
        };
    };
    reader.readAsDataURL(file);
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
    instruction.innerHTML = "<p>Silakan upload atau gunakan kamera.</p>";
}