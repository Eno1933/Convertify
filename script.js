// Convertify - Elegant PNG/JPG to PDF Converter

document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const imagePreview = document.getElementById('imagePreview');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const pdfNameInput = document.getElementById('pdfName');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    const fileList = document.getElementById('fileList');
    const fileCount = document.querySelector('.file-count');
    const conversionCount = document.getElementById('conversionCount');
    const backToTopBtn = document.querySelector('.back-to-top');
    const navbar = document.querySelector('.navbar');
    const uploadLabel = document.querySelector('.upload-label');
    
    // Statistik
    let conversions = localStorage.getItem('convertify_conversions') || 0;
    conversionCount.textContent = conversions;
    
    // Array untuk menyimpan gambar
    let images = [];
    
    // Event listener untuk navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Back to top button visibility
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    // Smooth scroll untuk anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
    });
    
    // Event listener untuk area upload (FIXED: Tidak perlu dua kali klik)
    dropArea.addEventListener('click', (e) => {
        // Mencegah event bubbling ke label
        if (e.target === dropArea || e.target.classList.contains('upload-text') || 
            e.target.classList.contains('upload-icon') || e.target.closest('.upload-icon')) {
            fileInput.click();
        }
    });
    
    // Event listener untuk label upload (FIXED)
    if (uploadLabel) {
        uploadLabel.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
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
        handleFiles(files);
    }
    
    // Tangani pemilihan file dari input
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files);
        }
        // Reset input untuk memungkinkan upload file yang sama lagi
        this.value = '';
    });
    
    // Fungsi untuk menangani file yang dipilih
    function handleFiles(files) {
        if (!files || !files.length) return;
        
        // Filter hanya file gambar
        const imageFiles = Array.from(files).filter(file => {
            const fileType = file.type.toLowerCase();
            const fileName = file.name.toLowerCase();
            return fileType === 'image/png' || 
                   fileType === 'image/jpeg' || 
                   fileType === 'image/jpg' ||
                   fileName.endsWith('.png') ||
                   fileName.endsWith('.jpg') ||
                   fileName.endsWith('.jpeg');
        });
        
        if (imageFiles.length === 0) {
            showNotification('Silakan pilih file gambar (PNG atau JPG)', 'error');
            return;
        }
        
        // Batasi jumlah file
        if (images.length + imageFiles.length > 20) {
            showNotification('Maksimal 20 file dapat diunggah sekaligus', 'warning');
            return;
        }
        
        // Hitung total file yang akan diproses
        let filesProcessed = 0;
        const totalFiles = imageFiles.length;
        
        // Tambahkan gambar ke array
        imageFiles.forEach(file => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                images.push({
                    id: imageId,
                    file: file,
                    url: e.target.result,
                    name: file.name,
                    size: formatFileSize(file.size)
                });
                
                filesProcessed++;
                
                // Update preview hanya setelah semua file diproses
                if (filesProcessed === totalFiles) {
                    updatePreview();
                    updateButtons();
                    showNotification(`${totalFiles} file berhasil diunggah`, 'success');
                }
            };
            
            reader.onerror = function() {
                filesProcessed++;
                showNotification(`Gagal membaca file: ${file.name}`, 'error');
                
                if (filesProcessed === totalFiles) {
                    if (images.length > 0) {
                        updatePreview();
                        updateButtons();
                    }
                }
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // Fungsi untuk memperbarui pratinjau gambar
    function updatePreview() {
        if (!imagePreview) return;
        
        imagePreview.innerHTML = '';
        
        if (images.length === 0) {
            fileList.classList.add('d-none');
            return;
        }
        
        fileList.classList.remove('d-none');
        fileCount.textContent = `${images.length} file`;
        
        images.forEach((image, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.setAttribute('data-id', image.id);
            
            fileItem.innerHTML = `
                <div class="position-relative">
                    <img src="${image.url}" alt="${image.name}" class="file-preview">
                    <div class="file-order">${index + 1}</div>
                </div>
                <div class="file-info">
                    <div class="file-name" title="${image.name}">${truncateText(image.name, 15)}</div>
                    <div class="file-size text-muted small">${image.size}</div>
                </div>
                <div class="file-remove" data-id="${image.id}" title="Hapus file">
                    <i class="bi bi-x-circle"></i>
                </div>
            `;
            
            imagePreview.appendChild(fileItem);
        });
        
        // Tambahkan event listener untuk tombol hapus (FIXED)
        attachRemoveListeners();
    }
    
    // Fungsi untuk menambahkan event listener pada tombol hapus
    function attachRemoveListeners() {
        const removeButtons = document.querySelectorAll('.file-remove');
        
        removeButtons.forEach(button => {
            // Hapus event listener yang lama jika ada
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Tambahkan event listener baru
            newButton.addEventListener('click', handleRemoveClick);
        });
    }
    
    // Fungsi untuk menangani klik tombol hapus
    function handleRemoveClick(e) {
        e.stopPropagation();
        const id = this.getAttribute('data-id');
        if (id) {
            removeFile(id);
        }
    }
    
    // Fungsi untuk menghapus file
    function removeFile(id) {
        // Cari index gambar yang akan dihapus
        const index = images.findIndex(image => image.id === id);
        
        if (index !== -1) {
            const imageName = images[index].name;
            images.splice(index, 1);
            updatePreview();
            updateButtons();
            showNotification(`"${truncateText(imageName, 20)}" telah dihapus`, 'info');
        }
    }
    
    // Fungsi untuk memperbarui status tombol
    function updateButtons() {
        if (images.length > 0) {
            convertBtn.disabled = false;
            clearBtn.disabled = false;
        } else {
            convertBtn.disabled = true;
            clearBtn.disabled = true;
        }
    }
    
    // Event listener untuk tombol clear
    clearBtn.addEventListener('click', function() {
        if (images.length === 0) return;
        
        if (confirm(`Apakah Anda yakin ingin menghapus ${images.length} file?`)) {
            images = [];
            updatePreview();
            updateButtons();
            progressContainer.classList.add('d-none');
            showNotification('Semua file telah dihapus', 'info');
        }
    });
    
    // Event listener untuk tombol convert
    convertBtn.addEventListener('click', convertToPDF);
    
    // Fungsi untuk mengonversi gambar ke PDF
    async function convertToPDF() {
        if (images.length === 0) {
            showNotification('Silakan pilih gambar terlebih dahulu', 'warning');
            return;
        }
        
        // Tampilkan progress bar
        progressContainer.classList.remove('d-none');
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        progressText.textContent = 'Menyiapkan file untuk konversi...';
        convertBtn.disabled = true;
        clearBtn.disabled = true;
        
        try {
            // Inisialisasi jsPDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Konversi setiap gambar
            for (let i = 0; i < images.length; i++) {
                // Update progress
                const progress = Math.round(((i + 1) / images.length) * 100);
                progressBar.style.width = `${progress}%`;
                progressPercent.textContent = `${progress}%`;
                progressText.textContent = `Mengonversi gambar ${i + 1} dari ${images.length}...`;
                
                // Tambah halaman baru kecuali untuk halaman pertama
                if (i > 0) {
                    pdf.addPage();
                }
                
                // Dapatkan dimensi gambar
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = images[i].url;
                });
                
                // Hitung dimensi untuk halaman PDF (A4: 210x297 mm)
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                
                // Hitung skala untuk menyesuaikan gambar dengan halaman
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                let width = pageWidth - 20; // Margin kiri dan kanan
                let height = (imgHeight * width) / imgWidth;
                
                // Jika gambar terlalu tinggi, sesuaikan dengan tinggi halaman
                if (height > pageHeight - 20) {
                    height = pageHeight - 20; // Margin atas dan bawah
                    width = (imgWidth * height) / imgHeight;
                }
                
                // Hitung posisi tengah
                const x = (pageWidth - width) / 2;
                const y = (pageHeight - height) / 2;
                
                // Tambahkan gambar ke PDF
                pdf.addImage(images[i].url, 'JPEG', x, y, width, height);
                
                // Tambahkan nomor halaman
                pdf.setFontSize(10);
                pdf.text(`Halaman ${i + 1} dari ${images.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
            
            // Update progress ke 100%
            progressBar.style.width = '100%';
            progressPercent.textContent = '100%';
            progressText.textContent = 'Konversi selesai! Mengunduh file...';
            
            // Simpan PDF dengan nama yang ditentukan pengguna
            const pdfFileName = pdfNameInput.value.trim() || 'convertify-document';
            pdf.save(`${pdfFileName}.pdf`);
            
            // Update statistik konversi
            conversions++;
            conversionCount.textContent = conversions;
            localStorage.setItem('convertify_conversions', conversions);
            
            // Reset progress setelah beberapa saat
            setTimeout(() => {
                progressContainer.classList.add('d-none');
                convertBtn.disabled = false;
                clearBtn.disabled = false;
                
                // Tampilkan pesan sukses
                showNotification('Konversi berhasil! File PDF telah diunduh.', 'success');
            }, 1500);
            
        } catch (error) {
            console.error('Error during conversion:', error);
            progressText.textContent = 'Terjadi kesalahan saat konversi.';
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
            convertBtn.disabled = false;
            clearBtn.disabled = false;
            
            setTimeout(() => {
                progressContainer.classList.add('d-none');
            }, 3000);
            
            showNotification('Terjadi kesalahan saat mengonversi gambar. Silakan coba lagi.', 'error');
        }
    }
    
    // Event delegation untuk tombol hapus (backup method)
    document.addEventListener('click', function(e) {
        if (e.target.closest('.file-remove')) {
            const removeBtn = e.target.closest('.file-remove');
            const id = removeBtn.getAttribute('data-id');
            if (id) {
                removeFile(id);
            }
        }
    });
    
    // Event listener untuk back to top button
    backToTopBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
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
    
    // Fungsi utilitas: format ukuran file
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    // Fungsi utilitas: potong teks
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    // Tambahkan style untuk notifikasi jika belum ada
    if (!document.querySelector('#notification-styles')) {
        const notificationStyle = document.createElement('style');
        notificationStyle.id = 'notification-styles';
        notificationStyle.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 0.8rem;
                z-index: 9999;
                transform: translateX(150%);
                transition: transform 0.3s ease;
                max-width: 350px;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification i {
                font-size: 1.2rem;
            }
            
            .notification-success {
                border-left: 4px solid #2ecc71;
                color: #27ae60;
            }
            
            .notification-error {
                border-left: 4px solid #e74c3c;
                color: #c0392b;
            }
            
            .notification-warning {
                border-left: 4px solid #f39c12;
                color: #d35400;
            }
            
            .notification-info {
                border-left: 4px solid #3498db;
                color: #2980b9;
            }
        `;
        document.head.appendChild(notificationStyle);
    }
    
    // Inisialisasi tooltips Bootstrap jika ada
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    if (tooltipTriggerList.length > 0 && typeof bootstrap !== 'undefined') {
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});