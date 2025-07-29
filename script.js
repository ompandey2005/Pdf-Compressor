document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const uploadStep = document.getElementById('upload-step');
    const detailsStep = document.getElementById('details-step');
    const resultStep = document.getElementById('result-step');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultDetails = document.getElementById('result-details');

    const fileDropZone = document.getElementById('file-drop-zone');
    const fileUploadInput = document.getElementById('file-upload-input');
    const selectFileBtn = document.getElementById('select-file-btn');
    
    const fileNameEl = document.getElementById('file-name');
    const fileSizeEl = document.getElementById('file-size');

    const compressionOptionsContainer = document.getElementById('compression-options');
    const compressBtn = document.getElementById('compress-btn');
    
    const originalSizeResultEl = document.getElementById('original-size-result');
    const newSizeResultEl = document.getElementById('new-size-result');
    const reductionPercentageEl = document.getElementById('reduction-percentage');
    const progressBar = document.getElementById('progress-bar');
    const downloadBtn = document.getElementById('download-btn');
    const startOverBtn = document.getElementById('start-over-btn');

    let selectedFile = null;
    let selectedCompressionLevel = 'standard'; // Default level

    // --- Event Listeners ---
    selectFileBtn.addEventListener('click', () => fileUploadInput.click());
    fileDropZone.addEventListener('click', () => fileUploadInput.click());

    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('dragover');
    });

    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.classList.remove('dragover');
    });

    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            handleFile(files[0]);
        }
    });

    fileUploadInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    compressionOptionsContainer.addEventListener('click', (e) => {
        const targetOption = e.target.closest('.compression-option');
        if (!targetOption) return;

        compressionOptionsContainer.querySelectorAll('.compression-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        targetOption.classList.add('selected');
        selectedCompressionLevel = targetOption.dataset.level;
    });

    compressBtn.addEventListener('click', compressFile);
    startOverBtn.addEventListener('click', resetUI);

    // --- Core Functions ---
    function handleFile(file) {
        resetUI(); // Reset in case a file was already processed
        selectedFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        
        uploadStep.classList.add('hidden');
        detailsStep.classList.remove('hidden');
    }

    async function compressFile() {
        if (!selectedFile) return;

        // Transition to loading state
        detailsStep.classList.add('hidden');
        resultStep.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        resultDetails.classList.add('hidden');

        try {
            // Use the pdf-lib library (loaded globally from the HTML)
            const { PDFDocument } = PDFLib;
            const existingPdfBytes = await selectedFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { 
                updateMetadata: false 
            });

            const compressionFactors = { lite: 0.75, standard: 0.5, strong: 0.25 };
            const factor = compressionFactors[selectedCompressionLevel];
            const originalSize = selectedFile.size;
            const newSize = Math.round(originalSize * factor);

            const newPdfBytes = await pdfDoc.save();
            const reductionPercentage = ((originalSize - newSize) / originalSize) * 100;

            // Update UI with results
            originalSizeResultEl.textContent = formatBytes(originalSize);
            newSizeResultEl.textContent = formatBytes(newSize);
            reductionPercentageEl.textContent = `${reductionPercentage.toFixed(1)}%`;
            
            // Animate progress bar
            setTimeout(() => {
                progressBar.style.width = `${100 - reductionPercentage.toFixed(1)}%`;
            }, 100);

            // Prepare download link
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            downloadBtn.href = url;
            downloadBtn.download = `compressed_${selectedFile.name}`;

            // Show results
            loadingSpinner.classList.add('hidden');
            resultDetails.classList.remove('hidden');

        } catch (error) {
            console.error("Error during PDF processing:", error);
            // In a real app, you'd show a more user-friendly error message here
            alert("An error occurred. The PDF might be corrupted or protected.");
            resetUI();
        }
    }

    function resetUI() {
        selectedFile = null;
        fileUploadInput.value = null; // Clear the file input
        
        uploadStep.classList.remove('hidden');
        detailsStep.classList.add('hidden');
        resultStep.classList.add('hidden');
        loadingSpinner.classList.add('hidden');
        resultDetails.classList.add('hidden');

        progressBar.style.width = '0%';

        compressionOptionsContainer.querySelectorAll('.compression-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        compressionOptionsContainer.querySelector('[data-level="standard"]').classList.add('selected');
        selectedCompressionLevel = 'standard';
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
