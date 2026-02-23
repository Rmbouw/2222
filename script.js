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

// --- LOAD AI (Instan tanpa delay) ---
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
        // Minta resolusi tinggi tapi tetap ideal buat diproses
        currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment", width: { ideal: 1080 }, height: { ideal: 1080 } } 
        });
        webcam.srcObject = currentStream;
        webcam.setAttribute('playsinline', true);
        webcam.style.display = "block";
        imgPrev.style.display = "none";
        btnSnap.style.display = "flex";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        dashboard.classList.remove('visible');
        instruction.innerHTML = "<p>Posisikan tanaman tepat di tengah kotak, lalu ambil foto.</p>";
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
    // Ukuran canvas standar AI
    canvas.width = 448; 
    canvas.height = 448;
    
    // LOGIKA CROP TENGAH (Penting biar objek gak gepeng di HP)
    const vW = webcam.videoWidth;
    const vH = webcam.videoHeight;
    const minSize = Math.min(vW, vH);
    const sx = (vW - minSize) / 2;
    const sy = (vH - minSize) / 2;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcam, sx, sy, minSize, minSize, 0, 0, 448, 448);
    
    imgPrev.src = canvas.toDataURL('image/jpeg', 0.9);
    imgPrev.style.display = "block";
    webcam.style.display = "none";
    btnSnap.style.display = "none";
    mainControls.style.display = "none";
    confirmUI.style.display = "flex"; 
    instruction.innerHTML = "<p>Pastikan objek terlihat jelas. Tekan <b>V</b> untuk analisa.</p>";
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
    loadingText.innerText = "Menganalisa Objek...";
    stopCamera();
    setTimeout(() => { executeAI(imgPrev); }, 400);
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
            instruction.innerHTML = "<p>Gambar dimuat. Tekan <b>V</b> untuk analisa.</p>";
        };
    };
    reader.readAsDataURL(file);
}

// --- LOGIKA DETEKSI SUPER DETAIL ---
async function executeAI(source) {
    if (!source.complete) {
        await new Promise(r => source.onload = r);
    }

    // Ambil 15 prediksi teratas (Lebih luas dari sebelumnya)
    const predictions = await model.classify(source, 15); 
    
    // Database Flora Super Lengkap (Keyword yang sering muncul di MobileNet)
    const floraKeywords = [
        'leaf', 'plant', 'tree', 'flower', 'flora', 'fruit', 'vegetable', 'nature', 'herb', 'shrub',
        'apple', 'banana', 'orange', 'lemon', 'pineapple', 'grape', 'strawberry', 'mango', 'pomegranate',
        'corn', 'maize', 'paddy', 'tomato', 'potato', 'chili', 'cactus', 'succulent', 'orchid', 'rose',
        'bonsai', 'moss', 'fern', 'palm', 'grass', 'bud', 'petal', 'stem', 'branch', 'vein', 'pot', 
        'garden', 'wood', 'forest', 'wild', 'vascular', 'buckeye', 'head', 'ear', 'pod'
    ];

    let bestMatch = null;

    // Deep Scan: Cari yang paling masuk akal sebagai flora
    for (let pred of predictions) {
        const label = pred.className.toLowerCase();
        if (floraKeywords.some(key => label.includes(key))) {
            bestMatch = pred;
            break; 
        }
    }

    loadingText.style.display = "none";
    scanner.style.display = "none";
    actionArea.style.display = "block";

    // JIKA GAGAL DETEKSI
    if (!bestMatch) {
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        let fallback = predictions[0].className.split(',')[0].toUpperCase();
        
        instruction.innerHTML = `
        <div class="error-box-tua" style="border: 2px solid #ff4444; background: rgba(255,0,0,0.1); padding: 15px; border-radius: 12px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
            <b style="color: #ff4444; font-size: 16px;">OBJEK TIDAK DIKENALI SEBAGAI FLORA</b><br>
            <span style="font-size: 13px; color: #eee;">Terdeteksi: <b style="color: #ffcc00;">${fallback}</b></span>
            <p style="font-size: 11px; margin-top: 8px; color: #bbb;">Tips: Dekatkan kamera ke daun atau buah agar detail urat daun/tekstur terlihat jelas.</p>
        </div>`;
        return;
    }

    // TAMPILKAN HASIL
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
    
    // Logika Analisa Kondisi (Sakit/Sehat)
    const labelLower = bestMatch.className.toLowerCase();
    const sickSigns = ['brown', 'dry', 'dead', 'rot', 'mold', 'fungus', 'spot', 'yellow', 'wither', 'rust', 'worm'];
    const isSick = sickSigns.some(w => labelLower.includes(w));
    
    const statusEl = document.getElementById('res-status');
    const adviceEl = document.getElementById('res-advice');

    if (isSick || score < 35) {
        statusEl.innerText = "KONDISI: PERLU PERHATIAN";
        statusEl.style.color = "#ff4444";
        circle.style.stroke = "#ff4444";
        adviceEl.innerText = "Terdeteksi adanya indikasi kerusakan jaringan, bercak, atau warna tidak normal.";
    } else {
        statusEl.innerText = "KONDISI: SEHAT";
        statusEl.style.color = "#00ff88";
        circle.style.stroke = "#00ff88";
        adviceEl.innerText = "Objek terlihat segar. Pertahankan kelembapan dan nutrisi tanaman.";
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