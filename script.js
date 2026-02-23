let model;
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
        model = await mobilenet.load();
        console.log("AI Model Siap");
    } catch (e) {
        console.error("Gagal memuat model AI");
    }
})();

async function openCamera() {
    const constraints = {
        video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        webcam.srcObject = stream;
        
        webcam.setAttribute('playsinline', true); 
        
        webcam.style.display = "block";
        imgPrev.style.display = "none";
        btnSnap.style.display = "flex";
        confirmUI.style.display = "none";
        mainControls.style.display = "flex";
        dashboard.classList.remove('visible');
        instruction.innerHTML = "<p>Posisikan tanaman di dalam kotak, lalu tekan tombol kamera.</p>";
    } catch (e) {
        alert("Izin kamera ditolak. Pastikan situs menggunakan HTTPS.");
    }
}

function takePhoto() {
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);
    
    imgPrev.src = canvas.toDataURL('image/jpeg');
    imgPrev.style.display = "block";
    webcam.style.display = "none";
    
    btnSnap.style.display = "none";
    mainControls.style.display = "none"; 
    confirmUI.style.display = "flex";    
    instruction.innerHTML = "<p>Apakah gambar sudah jelas? Tekan <b>V</b> untuk diagnosa.</p>";
}


function cancelPhoto() {
    imgPrev.style.display = "none";
    webcam.style.display = "block";
    btnSnap.style.display = "flex";
    confirmUI.style.display = "none";
    mainControls.style.display = "flex";
    instruction.innerHTML = "<p>Silahkan upload atau gunakan kamera untuk scan tanaman anda.</p>";
}

function proceedAnalysis() {
    actionArea.style.display = "none"; 
    scanner.style.display = "block";
    loadingText.style.display = "block";
    
    if(webcam.srcObject) {
        webcam.srcObject.getTracks().forEach(track => track.stop());
    }
    
    setTimeout(() => { executeAI(imgPrev); }, 1000);
}

function handleUpload(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        imgPrev.src = e.target.result;
        imgPrev.style.display = "block";
        webcam.style.display = "none";
        btnSnap.style.display = "none";
        mainControls.style.display = "none";
        confirmUI.style.display = "flex";
        dashboard.classList.remove('visible');
        instruction.innerHTML = "<p>Gambar siap. Tekan <b>V</b> untuk diagnosa.</p>";
    };
    reader.readAsDataURL(file);
}

async function executeAI(source) {
    if (!source.complete) {
        await new Promise(r => source.onload = r);
    }

    const predictions = await model.classify(source);
    
    const plantKeys = [
        'leaf', 'plant', 'tree', 'flower', 'vegetable', 'fruit', 'grass', 'flora',
        'corn', 'maize', 'ear', 'grain', 'paddy', 'stem', 'organism', 'potted',
        'pineapple', 'banana', 'herb', 'shrub', 'produce'
    ];
    
    // Cek di 5 prediksi teratas
    const isPlant = predictions.slice(0, 5).find(p => 
        plantKeys.some(key => p.className.toLowerCase().includes(key))
    );

    loadingText.style.display = "none";
    scanner.style.display = "none";

    if (!isPlant) {
        actionArea.style.display = "block";
        mainControls.style.display = "flex";
        confirmUI.style.display = "none";
        instruction.innerHTML = `
        <div class="error-box-tua">
            <i class="fa-solid fa-triangle-exclamation"></i> 
            <b>OBJEK TIDAK DIKENALI</b>
            <small>AI mendeteksi ini sebagai: ${predictions[0].className}</small>
        </div>`;
        return;
    }

    dashboard.classList.add('visible');
    const name = isPlant.className.split(',')[0].toUpperCase();
    const score = Math.round(isPlant.probability * 100);
    
    document.getElementById('res-name').innerText = name;
    document.getElementById('res-percent').innerText = score + "%";
    
    const circle = document.getElementById('res-circle');
    circle.style.strokeDashoffset = 226 - (226 * score / 100);
    
    const isSick = ['brown', 'dry', 'dead', 'rot', 'mold', 'fungus', 'spot'].some(w => name.toLowerCase().includes(w));
    const statusEl = document.getElementById('res-status');
    const adviceEl = document.getElementById('res-advice');

    if (isSick || score < 40) {
        statusEl.innerText = "TIDAK SEHAT";
        statusEl.style.color = "var(--danger)";
        circle.style.stroke = "var(--danger)";
        adviceEl.innerText = "Terdeteksi gejala penyakit atau kerusakan jaringan.";
    } else {
        statusEl.innerText = "SEHAT";
        statusEl.style.color = "var(--success)";
        circle.style.stroke = "var(--success)";
        adviceEl.innerText = "Tanaman terlihat sehat. Teruskan perawatan rutin.";
    }
}

function resetAll() {
    dashboard.classList.remove('visible');
    actionArea.style.display = "block";
    mainControls.style.display = "flex";
    confirmUI.style.display = "none";
    imgPrev.style.display = "none";
    webcam.style.display = "none";
    btnSnap.style.display = "none";
    instruction.innerHTML = "<p>Silahkan upload atau gunakan kamera untuk scan tanaman anda.</p>";
}

