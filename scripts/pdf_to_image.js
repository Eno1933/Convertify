// Convertofy - PDF to Image Converter

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const pdfPreview = document.getElementById('pdfPreview');
    const pdfPreviewBody = document.getElementById('pdfPreviewBody');
    const pdfFileName = document.getElementById('pdfFileName');
    const pdfPageCount = document.getElementById('pdfPageCount');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const previewBtn = document.getElementById('previewBtn');
    const pageSelection = document.getElementById('pageSelection');
    const pageRangeContainer = document.getElementById('pageRangeContainer');
    const pageFromInput = document.getElementById('pageFrom');
    const pageToInput = document.getElementById('pageTo');
    const pageCustomInput = document.getElementById('pageCustom');
    const pageRangeInfo = document.getElementById('pageRangeInfo');
    const outputFormatPng = document.getElementById('formatPng');
    const outputFormatJpg = document.getElementById('formatJpg');
    const imageQualitySelect = document.getElementById('imageQuality');
    const dpiSetting = document.getElementById('dpiSetting');
    const zipFilesCheckbox = document.getElementById('zipFiles');
    const addPageNumbersCheckbox = document.getElementById('addPageNumbers');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const convertFromPreviewBtn = document.getElementById('convertFromPreview');
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    
    // Variables
    let pdfDoc = null;
    let pdfFile = null;
    let selectedPages = new Set();
    let totalPages = 0;
    
    // Konfigurasi pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    
    // Event listener untuk area upload
    dropArea.addEventListener('click', (e) => {
        if (e.target === dropArea || e.target.classList.contains('upload-text') || 
            e.target.classList.contains('upload-icon') || e.target.closest('.upload-icon')) {
            fileInput.click();
        }
    });
    
    // Drag & drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight area saat drag over
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('dragover');
        dropArea.style.borderColor = 'var(--primary)';
        dropArea.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
        dropArea.style.borderColor = '';
        dropArea.style.backgroundColor = '';
    }
    
    // Tangani drop file
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }
    
    // Tangani pemilihan file dari input
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFile(this.files[0]);
        }
        this.value = '';
    });
    
    // Fungsi untuk menangani file PDF
    async function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            showNotification('Silakan pilih file PDF yang valid', 'error');
            return;
        }
        
        // Cek ukuran file (maks 50MB)
        if (file.size > 50 * 1024 * 1024) {
            showNotification('Ukuran file maksimal 50MB', 'error');
            return;
        }
        
        pdfFile = file;
        pdfFileName.textContent = truncateText(file.name, 30);
        
        // Tampilkan progress
        progressContainer.classList.remove('d-none');
        progressBar.style.width = '30%';
        progressPercent.textContent = '30%';
        progressText.textContent = 'Membaca file PDF...';
        
        try {
            // Load PDF
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            totalPages = pdfDoc.numPages;
            
            // Update UI
            pdfPageCount.textContent = `${totalPages} halaman`;
            
            // Reset pilihan halaman
            selectedPages.clear();
            for (let i = 1; i <= totalPages; i++) {
                selectedPages.add(i);
            }
            
            // Update input range
            pageFromInput.value = 1;
            pageFromInput.max = totalPages;
            pageToInput.value = totalPages;
            pageToInput.max = totalPages;
            pageCustomInput.value = `1-${totalPages}`;
            
            // Render preview halaman
            await renderPagePreviews();
            
            // Update buttons
            convertBtn.disabled = false;
            previewBtn.disabled = false;
            clearBtn.disabled = false;
            
            // Sembunyikan progress
            progressContainer.classList.add('d-none');
            
            // Tampilkan preview
            pdfPreview.classList.remove('d-none');
            
            showNotification('File PDF berhasil dimuat', 'success');
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            progressContainer.classList.add('d-none');
            showNotification('Gagal memuat file PDF. Pastikan file tidak rusak.', 'error');
        }
    }
    
    // Render preview halaman PDF
    async function renderPagePreviews() {
        if (!pdfPreviewBody || !pdfDoc) return;
        
        pdfPreviewBody.innerHTML = '';
        
        // Render maksimal 12 halaman untuk preview
        const maxPreviewPages = Math.min(totalPages, 12);
        
        for (let i = 1; i <= maxPreviewPages; i++) {
            const page = await pdfDoc.getPage(i);
            
            // Setup canvas untuk render
            const viewport = page.getViewport({ scale: 0.2 }); // Scale kecil untuk preview
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render halaman ke canvas
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Buat elemen preview
            const pagePreview = document.createElement('div');
            pagePreview.className = 'pdf-page-preview';
            pagePreview.setAttribute('data-page', i);
            
            // Buat canvas untuk thumbnail
            const thumbnailCanvas = document.createElement('canvas');
            const thumbnailCtx = thumbnailCanvas.getContext('2d');
            thumbnailCanvas.className = 'page-preview-canvas';
            thumbnailCanvas.width = 150;
            thumbnailCanvas.height = 200;
            
            // Skala gambar untuk thumbnail
            thumbnailCtx.fillStyle = 'white';
            thumbnailCtx.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
            
            const scale = Math.min(
                thumbnailCanvas.width / canvas.width,
                thumbnailCanvas.height / canvas.height
            );
            
            const x = (thumbnailCanvas.width - canvas.width * scale) / 2;
            const y = (thumbnailCanvas.height - canvas.height * scale) / 2;
            
            thumbnailCtx.drawImage(canvas, x, y, canvas.width * scale, canvas.height * scale);
            
            // Tambahkan border untuk thumbnail
            thumbnailCtx.strokeStyle = '#e0e0e0';
            thumbnailCtx.lineWidth = 1;
            thumbnailCtx.strokeRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
            
            pagePreview.innerHTML = `
                <img src="${thumbnailCanvas.toDataURL()}" alt="Halaman ${i}" class="page-preview-canvas">
                <div class="page-info">
                    <span class="page-number">Halaman ${i}</span>
                    <div class="page-select ${selectedPages.has(i) ? 'checked' : ''}" data-page="${i}"></div>
                </div>
            `;
            
            pdfPreviewBody.appendChild(pagePreview);
        }
        
        // Tambahkan info jika ada lebih banyak halaman
        if (totalPages > maxPreviewPages) {
            const morePages = document.createElement('div');
            morePages.className = 'pdf-page-preview text-center';
            morePages.innerHTML = `
                <div class="d-flex align-items-center justify-content-center h-100">
                    <div>
                        <i class="bi bi-three-dots" style="font-size: 2rem; color: var(--gray);"></i>
                        <p class="small mt-2">+${totalPages - maxPreviewPages} halaman lainnya</p>
                    </div>
                </div>
            `;
            pdfPreviewBody.appendChild(morePages);
        }
        
        // Tambahkan event listener untuk pemilihan halaman
        attachPageSelectListeners();
    }
    
    // Fungsi untuk melampirkan event listener pemilihan halaman
    function attachPageSelectListeners() {
        const pageSelects = document.querySelectorAll('.page-select');
        
        pageSelects.forEach(select => {
            select.addEventListener('click', function(e) {
                e.stopPropagation();
                const pageNum = parseInt(this.getAttribute('data-page'));
                const pagePreview = this.closest('.pdf-page-preview');
                
                if (selectedPages.has(pageNum)) {
                    selectedPages.delete(pageNum);
                    this.classList.remove('checked');
                    pagePreview.classList.remove('selected');
                } else {
                    selectedPages.add(pageNum);
                    this.classList.add('checked');
                    pagePreview.classList.add('selected');
                }
                
                updatePageRangeInputs();
            });
        });
        
        // Event untuk klik pada preview halaman
        const pagePreviews = document.querySelectorAll('.pdf-page-preview');
        pagePreviews.forEach(preview => {
            preview.addEventListener('click', function(e) {
                if (!e.target.closest('.page-select')) {
                    const pageNum = parseInt(this.getAttribute('data-page'));
                    const pageSelect = this.querySelector('.page-select');
                    
                    if (pageSelect) {
                        if (selectedPages.has(pageNum)) {
                            selectedPages.delete(pageNum);
                            pageSelect.classList.remove('checked');
                            this.classList.remove('selected');
                        } else {
                            selectedPages.add(pageNum);
                            pageSelect.classList.add('checked');
                            this.classList.add('selected');
                        }
                        
                        updatePageRangeInputs();
                    }
                }
            });
        });
    }
    
    // Update input range berdasarkan halaman yang dipilih
    function updatePageRangeInputs() {
        if (selectedPages.size === 0) return;
        
        const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);
        const minPage = Math.min(...pagesArray);
        const maxPage = Math.max(...pagesArray);
        
        // Update range inputs
        pageFromInput.value = minPage;
        pageToInput.value = maxPage;
        
        // Buat string untuk custom input
        let customString = '';
        let start = pagesArray[0];
        let prev = pagesArray[0];
        
        for (let i = 1; i <= pagesArray.length; i++) {
            if (i === pagesArray.length || pagesArray[i] !== prev + 1) {
                if (customString) customString += ',';
                if (start === prev) {
                    customString += start;
                } else {
                    customString += `${start}-${prev}`;
                }
                if (i < pagesArray.length) {
                    start = pagesArray[i];
                }
            }
            if (i < pagesArray.length) {
                prev = pagesArray[i];
            }
        }
        
        pageCustomInput.value = customString;
    }
    
    // Event listener untuk perubahan pilihan halaman
    pageSelection.addEventListener('change', function() {
        const value = this.value;
        
        if (value === 'all') {
            pageRangeContainer.style.display = 'none';
            // Pilih semua halaman
            selectedPages.clear();
            for (let i = 1; i <= totalPages; i++) {
                selectedPages.add(i);
            }
            updatePreviewSelection();
        } else if (value === 'range') {
            pageRangeContainer.style.display = 'block';
            pageCustomInput.style.display = 'none';
            pageRangeInfo.textContent = 'Masukkan rentang halaman yang ingin dikonversi';
            
            // Update selection berdasarkan range
            updateSelectionFromRange();
        } else if (value === 'custom') {
            pageRangeContainer.style.display = 'block';
            pageCustomInput.style.display = 'block';
            pageRangeInfo.textContent = 'Masukkan halaman yang ingin dikonversi. Gunakan koma untuk memisahkan halaman atau tanda hubung untuk rentang.';
            
            // Update selection berdasarkan custom input
            updateSelectionFromCustom();
        }
    });
    
    // Update selection dari input range
    function updateSelectionFromRange() {
        const from = parseInt(pageFromInput.value) || 1;
        const to = parseInt(pageToInput.value) || totalPages;
        
        selectedPages.clear();
        for (let i = from; i <= Math.min(to, totalPages); i++) {
            selectedPages.add(i);
        }
        
        updatePreviewSelection();
    }
    
    // Update selection dari input custom
    function updateSelectionFromCustom() {
        const input = pageCustomInput.value.trim();
        if (!input) return;
        
        selectedPages.clear();
        
        // Parse input seperti "1,3,5-7,10"
        const parts = input.split(',');
        
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(num => parseInt(num.trim()));
                if (!isNaN(start) && !isNaN(end)) {
                    const realStart = Math.max(1, Math.min(start, totalPages));
                    const realEnd = Math.max(1, Math.min(end, totalPages));
                    for (let i = realStart; i <= realEnd; i++) {
                        selectedPages.add(i);
                    }
                }
            } else {
                const pageNum = parseInt(trimmed);
                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                    selectedPages.add(pageNum);
                }
            }
        }
        
        updatePreviewSelection();
    }
    
    // Update preview selection di UI
    function updatePreviewSelection() {
        const pagePreviews = document.querySelectorAll('.pdf-page-preview');
        pagePreviews.forEach(preview => {
            const pageNum = parseInt(preview.getAttribute('data-page'));
            const pageSelect = preview.querySelector('.page-select');
            
            if (pageNum && pageSelect) {
                if (selectedPages.has(pageNum)) {
                    pageSelect.classList.add('checked');
                    preview.classList.add('selected');
                } else {
                    pageSelect.classList.remove('checked');
                    preview.classList.remove('selected');
                }
            }
        });
    }
    
    // Event listener untuk input range
    pageFromInput.addEventListener('change', function() {
        let value = parseInt(this.value) || 1;
        if (value < 1) value = 1;
        if (value > totalPages) value = totalPages;
        this.value = value;
        
        if (pageSelection.value === 'range') {
            updateSelectionFromRange();
        }
    });
    
    pageToInput.addEventListener('change', function() {
        let value = parseInt(this.value) || totalPages;
        if (value < 1) value = 1;
        if (value > totalPages) value = totalPages;
        this.value = value;
        
        if (pageSelection.value === 'range') {
            updateSelectionFromRange();
        }
    });
    
    pageCustomInput.addEventListener('change', function() {
        if (pageSelection.value === 'custom') {
            updateSelectionFromCustom();
        }
    });
    
    // Event listener untuk tombol clear
    clearBtn.addEventListener('click', function() {
        if (!pdfFile) return;
        
        if (confirm('Apakah Anda yakin ingin menghapus file PDF?')) {
            pdfFile = null;
            pdfDoc = null;
            selectedPages.clear();
            totalPages = 0;
            
            pdfPreview.classList.add('d-none');
            pdfPreviewBody.innerHTML = '';
            convertBtn.disabled = true;
            previewBtn.disabled = true;
            clearBtn.disabled = true;
            
            showNotification('File PDF telah dihapus', 'info');
        }
    });
    
    // Event listener untuk tombol preview
    previewBtn.addEventListener('click', async function() {
        if (!pdfDoc || selectedPages.size === 0) {
            showNotification('Silakan upload file PDF terlebih dahulu', 'warning');
            return;
        }
        
        // Tampilkan preview modal
        await showPreview();
        previewModal.show();
    });
    
    // Event listener untuk tombol convert dari preview
    convertFromPreviewBtn.addEventListener('click', function() {
        previewModal.hide();
        convertToImages();
    });
    
    // Event listener untuk tombol convert
    convertBtn.addEventListener('click', convertToImages);
    
    // Fungsi untuk menampilkan preview konversi
    async function showPreview() {
        if (!pdfDoc) return;
        
        const previewImagesContainer = document.getElementById('previewImages');
        previewImagesContainer.innerHTML = '';
        
        // Ambil format output
        const format = outputFormatPng.checked ? 'png' : 'jpg';
        const quality = parseFloat(imageQualitySelect.value);
        const dpi = parseInt(dpiSetting.value);
        const scale = dpi / 96; // Skala berdasarkan DPI
        
        // Ambil halaman yang dipilih (maks 6 untuk preview)
        const pagesToPreview = Array.from(selectedPages)
            .sort((a, b) => a - b)
            .slice(0, 6);
        
        for (const pageNum of pagesToPreview) {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale * 0.3 }); // Scale kecil untuk preview
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render halaman
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                // Tambahkan nomor halaman jika diaktifkan
                if (addPageNumbersCheckbox.checked) {
                    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    context.font = '14px Arial';
                    context.textAlign = 'center';
                    context.fillText(`Halaman ${pageNum}`, canvas.width / 2, 20);
                }
                
                // Buat elemen preview
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-image-item';
                previewItem.innerHTML = `
                    <img src="${canvas.toDataURL(`image/${format}`, quality)}" alt="Halaman ${pageNum}" class="preview-image">
                    <div class="preview-image-info">Halaman ${pageNum}</div>
                `;
                
                previewImagesContainer.appendChild(previewItem);
            } catch (error) {
                console.error(`Error rendering page ${pageNum}:`, error);
            }
        }
        
        // Jika ada lebih banyak halaman, tambahkan placeholder
        if (selectedPages.size > pagesToPreview.length) {
            const moreItem = document.createElement('div');
            moreItem.className = 'preview-image-item text-center';
            moreItem.innerHTML = `
                <div class="d-flex align-items-center justify-content-center h-100">
                    <div>
                        <i class="bi bi-images" style="font-size: 2rem; color: var(--gray);"></i>
                        <p class="small mt-2">+${selectedPages.size - pagesToPreview.length} halaman lainnya</p>
                    </div>
                </div>
            `;
            previewImagesContainer.appendChild(moreItem);
        }
    }
    
    // Fungsi untuk mengonversi PDF ke gambar
    async function convertToImages() {
        if (!pdfDoc || selectedPages.size === 0) {
            showNotification('Silakan pilih file PDF dan halaman yang ingin dikonversi', 'warning');
            return;
        }
        
        // Tampilkan progress
        progressContainer.classList.remove('d-none');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        progressText.textContent = 'Menyiapkan konversi...';
        convertBtn.disabled = true;
        previewBtn.disabled = true;
        clearBtn.disabled = true;
        
        try {
            // Ambil pengaturan
            const format = outputFormatPng.checked ? 'png' : 'jpg';
            const quality = parseFloat(imageQualitySelect.value);
            const dpi = parseInt(dpiSetting.value);
            const scale = dpi / 96; // Skala berdasarkan DPI
            const zipEnabled = zipFilesCheckbox.checked;
            const addPageNumbers = addPageNumbersCheckbox.checked;
            
            // Urutkan halaman yang dipilih
            const pagesToConvert = Array.from(selectedPages).sort((a, b) => a - b);
            const totalToConvert = pagesToConvert.length;
            
            // Buat ZIP jika diaktifkan
            let zip = null;
            if (zipEnabled && typeof JSZip !== 'undefined') {
                zip = new JSZip();
            }
            
            // Konversi setiap halaman
            for (let i = 0; i < pagesToConvert.length; i++) {
                const pageNum = pagesToConvert[i];
                
                // Update progress
                const progress = Math.round(((i + 1) / totalToConvert) * 100);
                progressBar.style.width = `${progress}%`;
                progressPercent.textContent = `${progress}%`;
                progressText.textContent = `Mengonversi halaman ${pageNum} dari ${totalPages}...`;
                
                // Render halaman
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                // Render halaman ke canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                // Tambahkan nomor halaman jika diaktifkan
                if (addPageNumbers) {
                    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    context.font = '20px Arial';
                    context.textAlign = 'center';
                    context.fillText(`Halaman ${pageNum}`, canvas.width / 2, 30);
                }
                
                // Dapatkan data URL
                const imageData = canvas.toDataURL(`image/${format}`, quality);
                
                // Ekstrak data base64
                const base64Data = imageData.split(',')[1];
                
                // Buat nama file
                const fileName = `${pdfFile.name.replace('.pdf', '')}_page${pageNum}.${format}`;
                
                if (zipEnabled && zip) {
                    // Tambahkan ke ZIP
                    zip.file(fileName, base64Data, { base64: true });
                } else {
                    // Download individual
                    const blob = dataURLToBlob(imageData);
                    saveAs(blob, fileName);
                }
            }
            
            // Final progress
            progressBar.style.width = '100%';
            progressPercent.textContent = '100%';
            
            if (zipEnabled && zip) {
                progressText.textContent = 'Membuat file ZIP...';
                
                // Generate ZIP dan download
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                const zipFileName = `${pdfFile.name.replace('.pdf', '')}_converted.zip`;
                
                saveAs(zipBlob, zipFileName);
                progressText.textContent = 'Konversi selesai! File ZIP telah diunduh.';
            } else {
                progressText.textContent = 'Konversi selesai! Gambar telah diunduh.';
            }
            
            // Reset setelah beberapa saat
            setTimeout(() => {
                progressContainer.classList.add('d-none');
                convertBtn.disabled = false;
                previewBtn.disabled = false;
                clearBtn.disabled = false;
                
                showNotification('Konversi berhasil!', 'success');
            }, 2000);
            
        } catch (error) {
            console.error('Error during conversion:', error);
            progressText.textContent = 'Terjadi kesalahan saat konversi.';
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
            convertBtn.disabled = false;
            previewBtn.disabled = false;
            clearBtn.disabled = false;
            
            setTimeout(() => {
                progressContainer.classList.add('d-none');
            }, 3000);
            
            showNotification('Terjadi kesalahan saat mengonversi PDF. Silakan coba lagi.', 'error');
        }
    }
    
    // Fungsi untuk mengonversi data URL ke Blob
    function dataURLToBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        
        return new Blob([u8arr], { type: mime });
    }
    
    // Fungsi untuk menampilkan notifikasi
    function showNotification(message, type = 'info') {
        // Hapus notifikasi sebelumnya jika ada
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Buat elemen notifikasi
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Ikon berdasarkan tipe
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'x-circle';
        if (type === 'warning') icon = 'exclamation-circle';
        
        notification.innerHTML = `
            <i class="bi bi-${icon}"></i>
            <span>${message}</span>
        `;
        
        // Tambahkan ke body
        document.body.appendChild(notification);
        
        // Tampilkan notifikasi
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hapus notifikasi setelah 3 detik
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }
    
    // Fungsi utilitas: potong teks
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // Update year in footer
    const currentYear = new Date().getFullYear();
    const yearElements = document.querySelectorAll('footer p');
    yearElements.forEach(element => {
        if (element.textContent.includes('2023')) {
            element.textContent = element.textContent.replace('2023', currentYear);
        }
    });
    
    // Tambahkan tombol pilihan halaman
    function addPageSelectionControls() {
        const pageSelectionControls = document.createElement('div');
        pageSelectionControls.className = 'page-selection-controls';
        pageSelectionControls.innerHTML = `
            <div class="selection-actions">
                <button class="btn btn-sm btn-outline-primary" id="selectAllBtn">
                    <i class="bi bi-check-all me-1"></i> Pilih Semua
                </button>
                <button class="btn btn-sm btn-outline-primary" id="deselectAllBtn">
                    <i class="bi bi-x-circle me-1"></i> Batalkan Semua
                </button>
                <button class="btn btn-sm btn-outline-primary" id="selectEvenBtn">
                    <i class="bi bi-2-circle me-1"></i> Halaman Genap
                </button>
                <button class="btn btn-sm btn-outline-primary" id="selectOddBtn">
                    <i class="bi bi-1-circle me-1"></i> Halaman Ganjil
                </button>
            </div>
            <div class="selected-pages-info mt-2">
                <i class="bi bi-check-circle me-1"></i>
                <span id="selectedPagesCount">${selectedPages.size}</span> dari ${totalPages} halaman dipilih
            </div>
        `;
        
        // Sisipkan setelah preview
        pdfPreviewBody.parentNode.insertBefore(pageSelectionControls, pdfPreviewBody.nextSibling);
        
        // Tambahkan event listener
        document.getElementById('selectAllBtn')?.addEventListener('click', () => {
            selectedPages.clear();
            for (let i = 1; i <= totalPages; i++) {
                selectedPages.add(i);
            }
            updatePreviewSelection();
            updateSelectedPagesCount();
        });
        
        document.getElementById('deselectAllBtn')?.addEventListener('click', () => {
            selectedPages.clear();
            updatePreviewSelection();
            updateSelectedPagesCount();
        });
        
        document.getElementById('selectEvenBtn')?.addEventListener('click', () => {
            selectedPages.clear();
            for (let i = 2; i <= totalPages; i += 2) {
                selectedPages.add(i);
            }
            updatePreviewSelection();
            updateSelectedPagesCount();
        });
        
        document.getElementById('selectOddBtn')?.addEventListener('click', () => {
            selectedPages.clear();
            for (let i = 1; i <= totalPages; i += 2) {
                selectedPages.add(i);
            }
            updatePreviewSelection();
            updateSelectedPagesCount();
        });
    }
    
    // Fungsi untuk memperbarui jumlah halaman yang dipilih
    function updateSelectedPagesCount() {
        const countElement = document.getElementById('selectedPagesCount');
        if (countElement) {
            countElement.textContent = selectedPages.size;
        }
    }
    
    // Panggil fungsi setelah preview dirender
    setTimeout(() => {
        if (pdfPreviewBody.children.length > 0) {
            addPageSelectionControls();
        }
    }, 1000);
});