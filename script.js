document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('file-name-display');
    const removeFileBtn = document.getElementById('remove-file');
    const formatBtns = document.querySelectorAll('.format-btn[data-format]');
    const convertBtn = document.getElementById('convert-btn');
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');
    const spinner = document.getElementById('spinner');
    const statusContainer = document.getElementById('status-container');
    const progressFill = document.getElementById('progress-fill');
    const statusText = document.getElementById('status-text');

    let selectedFile = null;
    let selectedFormat = null;

    // --- File Handling ---

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        // Validation
        const allowedExtensions = ['mp4', 'mov', 'mkv', 'mp3', 'ogg', 'wav'];
        const extension = file.name.split('.').pop().toLowerCase();

        if (!allowedExtensions.includes(extension)) {
            alert('Formato não suportado. Use MP4, MOV, MKV, MP3, OGG ou WAV.');
            return;
        }

        if (file.size > 4.5 * 1024 * 1024) {
            alert('Aviso: Arquivos acima de 4.5MB podem falhar devido aos limites da Vercel.');
        }

        selectedFile = file;
        fileNameDisplay.textContent = file.name;
        
        // Show file info, hide drop zone
        dropZone.style.display = 'none';
        fileInfo.style.display = 'flex';
        
        updateConvertButton();
    }

    removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFile = null;
        fileInput.value = '';
        dropZone.style.display = 'block';
        fileInfo.style.display = 'none';
        updateConvertButton();
    });

    // --- Format Selection ---

    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFormat = btn.getAttribute('data-format');
            updateConvertButton();
        });
    });

    function updateConvertButton() {
        if (selectedFile && selectedFormat) {
            convertBtn.disabled = false;
        } else {
            convertBtn.disabled = true;
        }
    }

    // --- Conversion Logic ---

    convertBtn.addEventListener('click', async () => {
        if (!selectedFile || !selectedFormat) return;

        // UI State: Loading
        convertBtn.disabled = true;
        btnText.textContent = 'CONVERTENDO...';
        btnIcon.style.display = 'none';
        spinner.style.display = 'block';
        statusContainer.style.display = 'block';
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 10;
                progressFill.style.width = `${Math.min(progress, 90)}%`;
                statusText.textContent = 'Processando mídia...';
            }
        }, 800);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('format', selectedFormat);

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro na conversão');
            }

            // Success
            clearInterval(interval);
            progressFill.style.width = '100%';
            statusText.textContent = 'Conversão concluída! Baixando...';
            
            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `converted.${selectedFormat}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            // Reset UI after delay
            setTimeout(() => {
                resetUI();
            }, 3000);

        } catch (error) {
            console.error(error);
            clearInterval(interval);
            alert('Falha na conversão: ' + error.message);
            resetUI();
        }
    });

    function resetUI() {
        convertBtn.disabled = false;
        btnText.textContent = 'CONVERTER AGORA';
        btnIcon.style.display = 'block';
        spinner.style.display = 'none';
        statusContainer.style.display = 'none';
        progressFill.style.width = '0%';
        updateConvertButton();
    }
});
