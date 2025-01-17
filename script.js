document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const camerasSelect = document.getElementById('camerasSelect');
    const resultText = document.getElementById('resultText');

    let currentStream = null;
    let scanActive = false;

    // Dapatkan daftar kamera
    async function getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            camerasSelect.innerHTML = '<option value="">Pilih Kamera</option>';
            videoDevices.forEach((camera, index) => {
                const option = document.createElement('option');
                option.value = camera.deviceId;
                option.text = camera.label || `Kamera ${index + 1}`;
                camerasSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error mendapatkan kamera:', error);
        }
    }

    // Mulai streaming video
    async function startCamera(deviceId) {
        stopCamera();

        const constraints = {
            video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
        };

        try {
            currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            video.srcObject = currentStream;
            video.play();
            scanActive = true;
            requestAnimationFrame(tick);
        } catch (error) {
            console.error('Error memulai kamera:', error);
        }
    }

    // Berhenti streaming video
    function stopCamera() {
        scanActive = false;
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
    }

    // Proses scanning QR
    function tick() {
        if (!scanActive) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
            });

            if (code) {
                resultText.textContent = code.data;
                stopCamera();
            }
        }

        if (scanActive) {
            requestAnimationFrame(tick);
        }
    }

    // Event Listeners
    startButton.addEventListener('click', () => {
        const selectedCamera = camerasSelect.value;
        startCamera(selectedCamera);
    });

    stopButton.addEventListener('click', stopCamera);
    camerasSelect.addEventListener('change', (e) => startCamera(e.target.value));

    // Inisialisasi
    getCameras();
});