let model;
let currentStream = null;
let isModelReady = false; // Penjaga status model

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

(async () => {
    try {
        loadingText.innerText = "Memuat Kecerdasan Buatan...";
        model = await mobilenet.load();
        isModelReady = true;
        loadingText.innerText = "AI Siap Digunakan";
        console.log("AI Ready");
        setTimeout(() => { loadingText.style.display = "none"; }, 2000);
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
    // Optimasi: Resize langsung ke 400px agar deteksi di HP kilat
    canvas.width = 400;
    canvas.height = 400;
    
    // Ambil bagian tengah kamera (Square Crop) agar objek tidak gepeng
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
    
    // Langsung eksekusi tanpa nunggu refresh
    setTimeout(() => { executeAI(imgPrev); }, 300);
}

function handleUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        imgPrev.src = event.target.result;
        imgPrev.onload = () => { // Pastikan gambar kelar dimuat sebelum ganti UI
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

async function executeAI(source) {
    if (!source.complete) {
        await new Promise(r => source.onload = r);
    }

    // TopK 15 agar lebih detail mendeteksi banyak jenis varietas
    const predictions = await model.classify(source, 15); 
    
    const plantKeys = [
        'leaf', 'plant', 'tree', 'flower', 'flora', 'stem', 'root', 'potted', 'grass', 'herb', 'shrub', 'nature', 'garden',
        'fruit', 'apple', 'banana', 'orange', 'lemon', 'pineapple', 'grape', 'strawberry', 'mango', 
        'pomegranate', 'durian', 'guava', 'fig', 'pear', 'apricot', 'jackfruit', 'coconut', 'papaya', 
        'watermelon', 'melon', 'cherry', 'berry', 'plum', 'citrus', 'lime', 'avocado',
        'vegetable', 'corn', 'maize', 'paddy', 'grain', 'bean', 'pepper', 'chili', 'tomato', 'potato',
        'cabbage', 'broccoli', 'cucumber', 'pumpkin', 'eggplant', 'carrot', 'onion', 'garlic', 'spinach',
        'fern', 'palm', 'cactus', 'succulent', 'orchid', 'rose', 'daisy', 'sunflower', 'tulip', 'lily',
        'croton', 'aglaonema', 'monstera', 'calathea', 'bonsai', 'moss', 'conifer', 'pine', 'bamboo',
        'organism', 'ear of corn', 'buckeye', 'head of cabbage', 'hip', 'buckeye', 'custard apple'
    ];
    
    const isPlant = predictions.find(p => 
        plantKeys.some(key => p.className.toLowerCase().includes(key))
    );

    loadingText.style.display = "none";
    scanner.style.display = "none";
    actionArea.style.display = "block";

    if (!isPlant) {
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        instruction.innerHTML = `
        <div class="error-box-tua">
            <b>OBJEK TIDAK DIKENALI SEBAGAI FLORA</b>
            <small>AI Mendeteksi: ${predictions[0].className}</small>
        </div>`;
        return;
    }

    dashboard.classList.add('visible');
    confirmUI.style.display = "none";
    mainControls.style.display = "none";
    instruction.innerHTML = "";

    const name = isPlant.className.split(',')[0].toUpperCase();
    const score = Math.round(isPlant.probability * 100);
    
    document.getElementById('res-name').innerText = name;
    document.getElementById('res-percent').innerText = score + "%";
    
    const circle = document.getElementById('res-circle');
    circle.style.strokeDashoffset = 226 - (226 * score / 100);
    
    const isSick = ['brown', 'dry', 'dead', 'rot', 'mold', 'fungus', 'spot', 'yellow', 'wither', 'rust'].some(w => 
        name.toLowerCase().includes(w)
    );
    
    const statusEl = document.getElementById('res-status');
    const adviceEl = document.getElementById('res-advice');

    if (isSick || score < 30) {
        statusEl.innerText = "TIDAK SEHAT";
        statusEl.style.color = "var(--danger)";
        circle.style.stroke = "var(--danger)";
        adviceEl.innerText = "Terdeteksi indikasi tidak sehat. Periksa nutrisi, air, atau hama.";
    } else {
        statusEl.innerText = "SEHAT";
        statusEl.style.color = "var(--success)";
        circle.style.stroke = "var(--success)";
        adviceEl.innerText = "Objek terlihat segar dan dalam kondisi normal.";
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