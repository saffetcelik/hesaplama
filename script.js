// Modern Single Page Hukuki Hesaplama Uygulaması
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Global state
let currentCourtType = 'asliye';
let currentCalculationType = 'tam-kabul';
let calculationData = {};

// Uygulama başlatma
function initializeApp() {
    setupCourtTabs();
    setupCalculationTypes();
    setupEventListeners();
    initTheme();
    setupModals();
    updateFormVisibility();
    generateFormFields();
    showToast('Uygulama başarıyla yüklendi!', 'success');
}

// Mahkeme türü sekmelerini ayarla
function setupCourtTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const courtType = this.getAttribute('data-court');

            // Tüm sekmeleri pasif yap
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Seçilen sekmeyi aktif yap
            this.classList.add('active');
            document.getElementById(`${courtType}-content`).classList.add('active');

            // Mevcut mahkeme türünü güncelle
            currentCourtType = courtType;

            // Form görünümünü güncelle
            updateFormVisibility();

            // Sonuçları temizle
            hideResults();

            showToast(`${this.querySelector('span').textContent} seçildi`, 'info');
        });
    });
}

// Hesaplama türü seçimi
function setupCalculationTypes() {
    const calcTypes = document.querySelectorAll('.calc-type');

    calcTypes.forEach(type => {
        type.addEventListener('click', function() {
            // Sadece aktif sekmedeki türleri kontrol et
            const activeTabContent = document.querySelector('.tab-content.active');
            const activeCalcTypes = activeTabContent.querySelectorAll('.calc-type');

            // Aktif sekmedeki tüm türleri pasif yap
            activeCalcTypes.forEach(t => t.classList.remove('active'));

            // Seçilen türü aktif yap
            this.classList.add('active');

            // Mevcut türü güncelle
            currentCalculationType = this.getAttribute('data-type');

            // Form alanlarını yeniden oluştur
            generateFormFields();

            // Sonuçları temizle
            hideResults();

            showToast(`${this.querySelector('h3').textContent} seçildi`, 'info');
        });
    });
}

// Form görünümünü güncelle
function updateFormVisibility() {
    const asliyeForm = document.getElementById('asliye-form');
    const isForm = document.getElementById('is-form');

    if (currentCourtType === 'asliye') {
        asliyeForm.style.display = 'block';
        isForm.style.display = 'none';
    } else if (currentCourtType === 'is') {
        asliyeForm.style.display = 'none';
        isForm.style.display = 'block';
    }
}

// Form alanlarını dinamik olarak oluştur
function generateFormFields() {
    if (currentCourtType === 'asliye') {
        generateAsliyeFormFields();
    }
    // İş mahkemesi formu statik olduğu için ayrı bir fonksiyon gerekmez
}

function generateAsliyeFormFields() {
    const checkboxContainer = document.getElementById('case-info-checkboxes');
    const inputContainer = document.getElementById('financial-inputs');

    // Checkbox alanlarını oluştur
    const checkboxes = getCheckboxesForType(currentCalculationType);
    checkboxContainer.innerHTML = checkboxes.map(checkbox => `
        <label class="checkbox">
            <input type="checkbox" id="${checkbox.id}" ${checkbox.checked ? 'checked' : ''}>
            <span class="checkbox-label">${checkbox.label}</span>
        </label>
    `).join('');

    // Input alanlarını oluştur
    const inputs = getInputsForType(currentCalculationType);
    inputContainer.innerHTML = inputs.map(input => `
        <div class="input-field ${input.type === 'money' ? 'money-field' : ''}">
            <label for="${input.id}" class="input-label">
                <i class="${input.icon}"></i>
                ${input.label}
            </label>
            <input
                type="text"
                id="${input.id}"
                class="input ${input.type === 'money' ? 'money-input' : ''}"
                placeholder="${input.placeholder}"
                value="${input.value || ''}"
            >
        </div>
    `).join('');

    // Para ile ölçülebilen dava checkbox'ı için event listener
    const monetaryCheckbox = document.getElementById(`${getPrefix()}-monetary-case`);
    if (monetaryCheckbox) {
        monetaryCheckbox.addEventListener('change', function() {
            toggleAmountFields(getPrefix(), this.checked);
        });
    }
}

// Hesaplama türüne göre prefix al
function getPrefix() {
    const prefixes = {
        'tam-kabul': 'tk',
        'kismen-kabul': 'kk',
        'davanin-reddi': 'dr'
    };
    return prefixes[currentCalculationType] || 'tk';
}

// Hesaplama türüne göre checkbox'ları al
function getCheckboxesForType(type) {
    const commonCheckboxes = [
        { id: `${getPrefix()}-multiple-plaintiffs`, label: 'Davacı birden fazla mı?', checked: false },
        { id: `${getPrefix()}-multiple-defendants`, label: 'Davalı birden fazla mı?', checked: false },
        { id: `${getPrefix()}-monetary-case`, label: 'Para ile ölçülebilen dava mı?', checked: true }
    ];
    
    if (type === 'tam-kabul') {
        return [
            ...commonCheckboxes,
            { id: `${getPrefix()}-has-plaintiff-attorney`, label: 'Davacı vekili var mı?', checked: false },
            { id: `${getPrefix()}-exempt-from-fee`, label: 'Davalı harçtan muaf mı?', checked: false }
        ];
    } else if (type === 'kismen-kabul') {
        return [
            ...commonCheckboxes,
            { id: `${getPrefix()}-has-plaintiff-attorney`, label: 'Davacı vekili var mı?', checked: false },
            { id: `${getPrefix()}-has-defendant-attorney`, label: 'Davalı vekili var mı?', checked: false },
            { id: `${getPrefix()}-exempt-from-fee`, label: 'Davalı harçtan muaf mı?', checked: false }
        ];
    } else {
        return [
            ...commonCheckboxes,
            { id: `${getPrefix()}-has-defendant-attorney`, label: 'Davalı vekili var mı?', checked: false }
        ];
    }
}

// Hesaplama türüne göre input'ları al
function getInputsForType(type) {
    const commonInputs = [
        { id: `${getPrefix()}-dava-miktari`, label: 'Dava edilen miktar', icon: 'fas fa-lira-sign', type: 'money', placeholder: '0,00 TL' },
        { id: `${getPrefix()}-basvuru-harc`, label: 'Başvuru Harcı', icon: 'fas fa-file-invoice', type: 'money', placeholder: 'Lütfen yatırılan harcı giriniz' },
        { id: `${getPrefix()}-pesin-harc`, label: 'Peşin/Nisbi Harç', icon: 'fas fa-money-bill', type: 'money', placeholder: 'Lütfen yatırılan harcı giriniz' },
        { id: `${getPrefix()}-tamamlama-harci`, label: 'Tamamlama Harcı', icon: 'fas fa-plus-circle', type: 'money', placeholder: '0,00 TL' },
        { id: `${getPrefix()}-islah-harci`, label: 'Islah Harcı', icon: 'fas fa-edit', type: 'money', placeholder: '0,00 TL' },
        { id: `${getPrefix()}-kesif-harc`, label: 'Keşif Harcı', icon: 'fas fa-search', type: 'money', placeholder: '0,00 TL' },
        { id: `${getPrefix()}-bilirkisi`, label: 'Bilirkişi Ücretleri', icon: 'fas fa-user-tie', type: 'money', placeholder: '0,00 TL' },
        { id: `${getPrefix()}-tebligat`, label: 'Tebligat, Posta ve Sair Masraf', icon: 'fas fa-envelope', type: 'money', placeholder: '0,00 TL' }
    ];
    
    if (type === 'kismen-kabul') {
        return [
            { id: `${getPrefix()}-dava-miktari`, label: 'Dava edilen miktar', icon: 'fas fa-lira-sign', type: 'money', placeholder: '0,00 TL' },
            { id: `${getPrefix()}-kabul-miktari`, label: 'Kabul edilen miktar', icon: 'fas fa-check', type: 'money', placeholder: '0,00 TL' },
            ...commonInputs.slice(1)
        ];
    }
    
    return commonInputs;
}

// Event listener'ları ayarla
function setupEventListeners() {
    // Asliye mahkemesi butonları
    document.getElementById('clear-btn').addEventListener('click', clearForm);
    document.getElementById('calculate-btn').addEventListener('click', performCalculation);

    // İş mahkemesi butonları
    document.getElementById('clear-overtime-btn').addEventListener('click', clearOvertimeForm);
    document.getElementById('calculate-overtime-btn').addEventListener('click', calculateOvertime);

    // Kopyala butonu
    document.getElementById('copy-btn').addEventListener('click', copyResultToClipboard);

    // Yazdır butonu
    document.getElementById('print-btn').addEventListener('click', printResult);

    // Tema değiştirme
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Yardım butonu
    document.getElementById('help-btn').addEventListener('click', () => showModal('help-modal'));
}

// Tema işlevleri
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`${newTheme === 'dark' ? 'Koyu' : 'Açık'} tema aktif!`, 'info');
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Modal işlevleri
function setupModals() {
    // Modal kapatma butonları
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // Modal overlay'e tıklayınca kapatma
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // ESC tuşu ile kapatma
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                if (modal.style.display === 'block') {
                    hideModal(modal.id);
                }
            });
        }
    });
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Toast bildirimleri
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');

    if (!toast) {
        console.error('Toast element not found!');
        return;
    }

    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');

    if (!toastIcon) {
        console.error('Toast icon element not found!');
        return;
    }

    if (!toastMessage) {
        console.error('Toast message element not found!');
        return;
    }

    // İkon ve renk ayarla
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const colors = {
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        info: 'var(--info)'
    };

    toastIcon.className = icons[type] || icons.success;
    toast.style.background = colors[type] || colors.success;
    toastMessage.textContent = message;

    // Toast'ı göster
    toast.classList.add('show');

    // 3 saniye sonra gizle
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Form temizleme
function clearForm() {
    const prefix = getPrefix();

    // Checkbox'ları temizle (para ile ölçülebilen dava hariç)
    document.querySelectorAll(`input[id^="${prefix}-"]:not(#${prefix}-monetary-case)`).forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });

    hideResults();
    showToast('Form temizlendi', 'info');
}

// İş mahkemesi form temizleme
function clearOvertimeForm() {
    document.getElementById('overtime-amount').value = '';
    document.getElementById('discretionary-reduction').value = '30';
    document.getElementById('mahsup-amount').value = '';

    hideResults();
    showToast('Form temizlendi', 'info');
}

// Fazla mesai hesaplama
function calculateOvertime() {
    try {
        const overtimeAmountStr = document.getElementById('overtime-amount').value;
        const reductionRate = parseInt(document.getElementById('discretionary-reduction').value);
        const mahsupAmountStr = document.getElementById('mahsup-amount').value;

        if (!overtimeAmountStr || overtimeAmountStr.trim() === '') {
            showToast('Lütfen fazla mesai tutarını girin!', 'error');
            return;
        }

        const overtimeAmount = parseAmount(overtimeAmountStr);

        if (overtimeAmount <= 0) {
            showToast('Fazla mesai tutarı 0\'dan büyük olmalıdır!', 'error');
            return;
        }

        // Mahsup tutarını al (boşsa 0)
        const mahsupAmount = mahsupAmountStr && mahsupAmountStr.trim() !== '' ? parseAmount(mahsupAmountStr) : 0;

        // Girilen tutar = Brüt tutar
        const grossAmount = overtimeAmount;

        // Takdiri indirim brüt tutardan hesaplanır
        const discountAmount = grossAmount * (reductionRate / 100);
        const afterDiscountAmount = grossAmount - discountAmount;

        // Mahsup düşülmüş brüt tutar
        const finalGrossAmount = afterDiscountAmount - mahsupAmount;

        if (finalGrossAmount < 0) {
            showToast('Mahsup tutarı, indirimli brüt tutardan büyük olamaz!', 'error');
            return;
        }

        // Net ücreti hesapla (0.71491 katsayısı ile)
        const netAmount = finalGrossAmount * 0.71491;

        // Sonucu formatla ve göster
        const result = formatOvertimeResult(overtimeAmount, reductionRate, grossAmount, discountAmount, afterDiscountAmount, mahsupAmount, finalGrossAmount, netAmount);
        showResults(result, true); // Modern görünüm için true
        showToast('Fazla mesai hesaplaması tamamlandı!', 'success');

    } catch (error) {
        console.error('Fazla mesai hesaplama hatası:', error);
        showToast('Hesaplama sırasında bir hata oluştu.', 'error');
    }
}

// Fazla mesai sonucunu formatla
function formatOvertimeResult(originalAmount, reductionRate, grossAmount, discountAmount, afterDiscountAmount, mahsupAmount, finalGrossAmount, netAmount) {
    return `
        <div class="modern-result">
            <div class="result-header">
                <div class="result-title">
                    <i class="fas fa-clock"></i>
                    <h3>Fazla Mesai Ücreti Hesaplama Sonucu</h3>
                </div>
                <div class="result-badge">
                    <i class="fas fa-briefcase"></i>
                    İş Mahkemesi
                </div>
            </div>

            <div class="result-input-summary">
                <div class="input-card">
                    <div class="input-label">Brüt Fazla Mesai Tutarı</div>
                    <div class="input-value">${formatCurrency(originalAmount)} TL</div>
                </div>
            </div>

            <div class="calculation-steps">
                <h4><i class="fas fa-calculator"></i> Hesaplama Adımları</h4>
                <div class="steps-grid">
                    <div class="step-card">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <div class="step-title">Takdiri İndirim</div>
                            <div class="step-formula">${formatCurrency(grossAmount)} × %${reductionRate}</div>
                            <div class="step-result">-${formatCurrency(discountAmount)} TL</div>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <div class="step-title">İndirimli Brüt</div>
                            <div class="step-formula">${formatCurrency(grossAmount)} - ${formatCurrency(discountAmount)}</div>
                            <div class="step-result">${formatCurrency(afterDiscountAmount)} TL</div>
                        </div>
                    </div>

                    ${mahsupAmount > 0 ? `
                    <div class="step-card">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <div class="step-title">Mahsup</div>
                            <div class="step-formula">${formatCurrency(afterDiscountAmount)} - ${formatCurrency(mahsupAmount)}</div>
                            <div class="step-result">${formatCurrency(finalGrossAmount)} TL</div>
                        </div>
                    </div>

                    <div class="step-card">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <div class="step-title">Net Ücret</div>
                            <div class="step-formula">${formatCurrency(finalGrossAmount)} × 0.71491</div>
                            <div class="step-result">${formatCurrency(netAmount)} TL</div>
                        </div>
                    </div>
                    ` : `
                    <div class="step-card">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <div class="step-title">Net Ücret</div>
                            <div class="step-formula">${formatCurrency(finalGrossAmount)} × 0.71491</div>
                            <div class="step-result">${formatCurrency(netAmount)} TL</div>
                        </div>
                    </div>
                    `}
                </div>
            </div>

            <div class="result-summary">
                <div class="summary-card gross">
                    <div class="summary-icon">
                        <i class="fas fa-money-bill-wave"></i>
                    </div>
                    <div class="summary-content">
                        <div class="summary-label">${mahsupAmount > 0 ? 'Final Brüt Tutar (Mahsup Sonrası)' : 'Brüt Fazla Mesai Ücreti'}</div>
                        <div class="summary-amount">${formatCurrency(finalGrossAmount)} TL</div>
                    </div>
                </div>

                <div class="summary-card net">
                    <div class="summary-icon">
                        <i class="fas fa-hand-holding-usd"></i>
                    </div>
                    <div class="summary-content">
                        <div class="summary-label">Net Fazla Mesai Ücreti</div>
                        <div class="summary-amount">${formatCurrency(netAmount)} TL</div>
                    </div>
                </div>
            </div>

            <div class="result-footer">
                <div class="footer-note">
                    <i class="fas fa-info-circle"></i>
                    Bu hesaplama İş Mahkemesi uygulamaları dikkate alınarak yapılmıştır.
                </div>
            </div>
        </div>
    `;
}

// Sonuçları gizle
function hideResults() {
    document.getElementById('results-section').style.display = 'none';
}

// Sonuçları göster
function showResults(content, isModern = false) {
    const resultsSection = document.getElementById('results-section');
    const resultsContent = document.getElementById('results-content');

    if (isModern) {
        resultsContent.innerHTML = content;
    } else {
        resultsContent.textContent = content;
    }

    resultsSection.style.display = 'block';

    // Sonuç alanına scroll
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Hesaplama gerçekleştir
function performCalculation() {
    try {
        let result = '';

        if (currentCourtType === 'asliye') {
            if (currentCalculationType === 'tam-kabul') {
                result = calculateFullAccept();
            } else if (currentCalculationType === 'kismen-kabul') {
                result = calculatePartialAccept();
            } else if (currentCalculationType === 'davanin-reddi') {
                result = calculateRejection();
            }
        } else if (currentCourtType === 'is') {
            if (currentCalculationType === 'fazla-mesai') {
                calculateOvertime();
                return; // calculateOvertime kendi sonucunu gösterir
            }
        }

        if (result) {
            showResults(result);
            showToast('Hesaplama tamamlandı!', 'success');
        } else {
            showToast('Hesaplama yapılamadı. Lütfen gerekli alanları doldurun.', 'error');
        }
    } catch (error) {
        console.error('Hesaplama hatası:', error);
        showToast('Hesaplama sırasında bir hata oluştu.', 'error');
    }
}

// Sonucu panoya kopyala
function copyResultToClipboard() {
    const resultContent = document.getElementById('results-content').textContent;
    
    if (!resultContent.trim()) {
        showToast('Kopyalanacak sonuç bulunamadı!', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(resultContent).then(() => {
        showToast('Sonuç panoya kopyalandı!', 'success');
    }).catch(() => {
        showToast('Kopyalama başarısız!', 'error');
    });
}

// Yazdırma işlevi
function printResult() {
    const resultContent = document.getElementById('results-content').textContent;
    if (!resultContent.trim()) {
        showToast('Yazdırılacak sonuç bulunamadı!', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Hukuki Hesaplama Sonucu</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
                .content { white-space: pre-wrap; font-size: 12pt; }
                .footer { margin-top: 30px; font-size: 10pt; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <h1>Hukuki Hesaplama Sonucu</h1>
            <div class="content">${resultContent}</div>
            <div class="footer">
                <p>Bu belge Hukuki Hesaplama Programı tarafından oluşturulmuştur.</p>
                <p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
    
    showToast('Yazdırma penceresi açıldı!', 'success');
}

// Para ile ölçülebilen dava alanlarını aktif/pasif yap
function toggleAmountFields(prefix, isEnabled) {
    const amountField = document.getElementById(`${prefix}-dava-miktari`);
    if (amountField) {
        amountField.disabled = !isEnabled;
        if (!isEnabled) {
            amountField.value = '';
        }
    }
}

// Hesaplama fonksiyonları
function calculateFullAccept() {
    try {
        const formData = getFormData();

        if (!formData || !formData.checkboxes || !formData.entries) {
            throw new Error('Form data is invalid or missing');
        }

        let resultParts = [];

        const caseAmount = parseAmount(formData.entries['dava-miktari'] || '0');
        const partyText = getPartyText(formData.checkboxes['multiple-plaintiffs'], formData.checkboxes['multiple-defendants']);

        const { feeParts, totalPaidFees } = getFeeParts(formData);

        if (formData.checkboxes['exempt-from-fee']) {
            resultParts.push("-Davalı taraf harçtan muaf olduğundan bu hususta karar verilmesine yer olmadığına,");
        } else {
            if (formData.checkboxes['monetary-case']) {
                const totalFee = caseAmount * 68.31 / 1000;
                const requiredFee = Math.max(totalFee, 615.40); // Minimum 615.40 TL
                const remainingFee = requiredFee - totalPaidFees;

                if (remainingFee > 0) {
                    if (totalPaidFees === 0) {
                        // Hiç harç yatırılmamışsa
                        resultParts.push(
                            `-Harçlar Kanunu uyarınca alınması gereken toplam ` +
                            `${formatCurrency(requiredFee)}TL karar ve ilam harcının ` +
                            `${partyText.defendantText} alınarak hazineye gelir kaydına,`
                        );
                    } else {
                        // Kısmi harç yatırılmışsa
                        resultParts.push(
                            `-Harçlar Kanunu uyarınca dava değeri üzerinden alınması gereken toplam ` +
                            `${formatCurrency(requiredFee)}TL harçtan daha önce ödenen toplam ${formatCurrency(totalPaidFees)}TL ` +
                            `harç düşüldükten sonra eksik kalan ${formatCurrency(remainingFee)}TL harcın ` +
                            `${partyText.defendantText} alınarak hazineye gelir kaydına,`
                        );
                    }
                } else if (remainingFee === 0) {
                    // Harç tam yeterli
                    resultParts.push("-Alınan harç yeterli olmakla başkaca harç alınmasına yer olmadığına,");
                } else if (remainingFee < 0) {
                    // Harç fazla yatırılmış - iade gerekiyor
                    const refundAmount = Math.abs(remainingFee);
                    resultParts.push(
                        `-Harçlar Kanunu uyarınca dava değeri üzerinden alınması gereken toplam ` +
                        `${formatCurrency(requiredFee)}TL harcın mahsubu ile fazladan alınan ` +
                        `${formatCurrency(refundAmount)}TL'nin yatıran tarafa iadesine,`
                    );
                }

                // Sadece harç yatırılmışsa ve fazla harç yoksa harç iadesi maddesi ekle
                if (totalPaidFees > 0 && remainingFee >= 0) {
                    resultParts.push(createFeeRefundText(feeParts, totalPaidFees, partyText));
                }
            } else {
                // Para ile ölçülmeyen davalar için
                const maktuHarc = 615.40;
                const remainingFee = maktuHarc - totalPaidFees;

                if (remainingFee > 0) {
                    if (totalPaidFees === 0) {
                        // Hiç harç yatırılmamışsa
                        resultParts.push(
                            `-Harçlar Kanunu uyarınca alınması gereken toplam ` +
                            `${formatCurrency(maktuHarc)}TL karar ve ilam harcının ` +
                            `${partyText.defendantText} alınarak hazineye gelir kaydına,`
                        );
                    } else {
                        // Kısmi harç yatırılmışsa
                        resultParts.push(
                            `-Harçlar Kanunu uyarınca alınması gereken toplam ` +
                            `${formatCurrency(maktuHarc)}TL harçtan daha önce ödenen toplam ${formatCurrency(totalPaidFees)}TL ` +
                            `harç düşüldükten sonra eksik kalan ${formatCurrency(remainingFee)}TL harcın ` +
                            `${partyText.defendantText} alınarak hazineye gelir kaydına,`
                        );
                    }
                } else if (totalPaidFees === maktuHarc) {
                    resultParts.push("-Alınan harç yeterli olmakla başkaca harç alınmasına yer olmadığına,");
                }

                // Sadece harç yatırılmışsa harç iadesi maddesi ekle
                if (totalPaidFees > 0) {
                    resultParts.push(createFeeRefundText(feeParts, totalPaidFees, partyText));
                }
            }

            var expenseItems = {
                'kesif-harc': 'keşif harcı',
                'basvuru-harc': 'başvuru harcı',
                'bilirkisi': 'bilirkişi ücreti',
                'tebligat': 'tebligat ve posta gideri'
            };
        }

        const { expenseList, totalExpenses } = getExpenseList(formData, expenseItems);

        if (expenseList.length > 0) {
            resultParts.push(
                `-${partyText.plaintiffPrefix} tarafından yapılan ${expenseList.join(', ')} olmak üzere toplam ` +
                `${formatCurrency(totalExpenses)}TL yargılama giderinin ${partyText.defendantText} alınarak ` +
                `${partyText.plaintiffText} verilmesine,`
            );
        }

        if (formData.checkboxes['has-plaintiff-attorney']) {
            const attorneyFee = calculateAttorneyFee(caseAmount);
            resultParts.push(
                `-${partyText.plaintiffPrefix} kendisini vekil ile temsil ettirdiğinden karar tarihi itibariyle ` +
                `yürürlükte bulunan Avukatlık Asgari Ücret Tarifesi uyarınca hesaplanan ` +
                `${formatCurrency(attorneyFee)}TL vekalet ücretinin ${partyText.defendantText} alınarak ` +
                `${partyText.plaintiffText} verilmesine,`
            );
        }

        resultParts.push(getCommonText());

        return resultParts.join('\n');
    } catch (error) {
        throw new Error(`Tam kabul hesaplaması hatası: ${error.message}`);
    }
}

function calculatePartialAccept() {
    try {
        const formData = getFormData();
        let resultParts = [];

        const caseAmount = parseAmount(formData.entries['dava-miktari'] || '0');
        const acceptedAmount = parseAmount(formData.entries['kabul-miktari'] || '0');

        if (acceptedAmount > caseAmount) {
            throw new Error('Kabul edilen miktar, dava edilen miktardan büyük olamaz!');
        }

        const rejectedAmount = caseAmount - acceptedAmount;
        const acceptanceRatio = caseAmount > 0 ? acceptedAmount / caseAmount : 0;
        const partyText = getPartyText(formData.checkboxes['multiple-plaintiffs'], formData.checkboxes['multiple-defendants']);

        const { feeParts, totalPaidFees } = getFeeParts(formData);

        if (formData.checkboxes['exempt-from-fee']) {
            resultParts.push("-Davalı taraf harçtan muaf olduğundan bu hususta karar verilmesine yer olmadığına,");
        } else {
            if (formData.checkboxes['monetary-case']) {
                const totalFee = acceptedAmount * 68.31 / 1000;
                const requiredFee = Math.max(totalFee, 615.40); // Minimum 615.40 TL
                const remainingFee = requiredFee - totalPaidFees;

                if (remainingFee > 0) {
                    if (totalPaidFees === 0) {
                        // Hiç harç yatırılmamışsa
                        resultParts.push(
                            `-Harçlar Kanunu uyarınca alınması gereken toplam ` +
                            `${formatCurrency(requiredFee)}TL karar ve ilam harcının ` +
                            `${partyText.defendantText} alınarak hazineye gelir kaydına,`
                        );
                    } else {
                        // Kısmi harç yatırılmışsa
                        resultParts.push(
                            `-Harçlar Kanunu uyarınca dava değeri üzerinden alınması gereken toplam ` +
                            `${formatCurrency(requiredFee)}TL harçtan daha önce ödenen toplam ${formatCurrency(totalPaidFees)}TL ` +
                            `harç düşüldükten sonra eksik kalan ${formatCurrency(remainingFee)}TL harcın ` +
                            `${partyText.defendantText} alınarak hazineye gelir kaydına,`
                        );
                    }
                } else if (remainingFee === 0) {
                    // Harç tam yeterli
                    resultParts.push("-Alınan harç yeterli olmakla başkaca harç alınmasına yer olmadığına,");
                } else if (remainingFee < 0) {
                    // Harç fazla yatırılmış - iade gerekiyor
                    const refundAmount = Math.abs(remainingFee);
                    resultParts.push(
                        `-Harçlar Kanunu uyarınca dava değeri üzerinden alınması gereken toplam ` +
                        `${formatCurrency(requiredFee)}TL harcın mahsubu ile fazladan alınan ` +
                        `${formatCurrency(refundAmount)}TL'nin yatıran tarafa iadesine,`
                    );
                }
            } else {
                // Para ile ölçülmeyen davalar için
                const maktuHarc = 615.40;
                const remainingFee = maktuHarc - totalPaidFees;

                if (remainingFee > 0) {
                    if (totalPaidFees === 0) {
                        // Hiç harç yatırılmamışsa
                        resultParts.push(
                            `-Harçlar Kanunu uyarınca alınması gereken toplam ` +
                            `${formatCurrency(maktuHarc)}TL karar ve ilam harcının ` +
                            `${partyText.defendantText} alınarak hazineye gelir kaydına,`
                        );
                    } else {
                        // Kısmi harç yatırılmışsa
                        resultParts.push(
                            `-Harçlar Kanunu uyarınca alınması gereken toplam ` +
                            `${formatCurrency(maktuHarc)}TL harçtan daha önce ödenen toplam ${formatCurrency(totalPaidFees)}TL ` +
                            `harç düşüldükten sonra eksik kalan ${formatCurrency(remainingFee)}TL harcın ` +
                            `${partyText.defendantText} alınarak hazineye gelir kaydına,`
                        );
                    }
                } else if (totalPaidFees === maktuHarc) {
                    resultParts.push("-Alınan harç yeterli olmakla başkaca harç alınmasına yer olmadığına,");
                }
            }

            // Harç paylaşımı (sadece harç yatırılmışsa ve fazla harç yoksa)
            if (totalPaidFees > 0) {
                // Para ile ölçülebilen davalar için fazla harç kontrolü
                if (formData.checkboxes['monetary-case']) {
                    const totalFee = acceptedAmount * 68.31 / 1000;
                    const requiredFee = Math.max(totalFee, 615.40);
                    const remainingFee = requiredFee - totalPaidFees;

                    if (remainingFee >= 0) {
                        // Fazla harç yoksa normal paylaşım
                        resultParts.push(createFeeShareText(feeParts, totalPaidFees, acceptanceRatio, partyText));
                    }
                } else {
                    // Para ile ölçülemeyen davalar için normal paylaşım
                    resultParts.push(createFeeShareText(feeParts, totalPaidFees, acceptanceRatio, partyText));
                }
            }
        }

        const expenseItems = {
            'kesif-harc': 'keşif harcı',
            'basvuru-harc': 'başvuru harcı',
            'bilirkisi': 'bilirkişi ücreti',
            'tebligat': 'tebligat ve posta gideri'
        };

        const { expenseList, totalExpenses } = getExpenseList(formData, expenseItems);

        if (expenseList.length > 0) {
            const defendantExpenses = totalExpenses * acceptanceRatio;
            const plaintiffExpenses = totalExpenses - defendantExpenses;

            resultParts.push(
                `-${partyText.plaintiffPrefix} tarafından yapılan; ${expenseList.join(', ')} olmak üzere toplam ` +
                `${formatCurrency(totalExpenses)}TL yargılama giderinin kabul/ret oranı dikkate alınarak ` +
                `${formatCurrency(defendantExpenses)}TL'nin ${partyText.defendantText} alınarak ` +
                `${partyText.plaintiffText} verilmesine, bakiye yargılama gideri olan ` +
                `${formatCurrency(plaintiffExpenses)}TL'nin ${partyText.plaintiffPrefix} üzerinde bırakılmasına,`
            );
        }

        if (formData.checkboxes['has-plaintiff-attorney']) {
            const plaintiffAttorneyFee = calculateAttorneyFee(acceptedAmount);
            resultParts.push(
                `- ${partyText.plaintiffPrefix} kendisini vekil ile temsil ettirdiğinden karar tarihi itibariyle ` +
                `yürürlükte bulunan Avukatlık Asgari Ücret Tarifesi uyarınca hesaplanan ` +
                `${formatCurrency(plaintiffAttorneyFee)}TL vekalet ücretinin ${partyText.defendantText} ` +
                `alınarak ${partyText.plaintiffText} verilmesine,`
            );
        }

        if (formData.checkboxes['has-defendant-attorney']) {
            const defendantAttorneyFee = calculateAttorneyFee(rejectedAmount);
            resultParts.push(
                `- ${partyText.defendantPrefix} kendisini vekil ile temsil ettirdiğinden karar tarihi itibariyle ` +
                `yürürlükte bulunan Avukatlık Asgari Ücret Tarifesi uyarınca hesaplanan ` +
                `${formatCurrency(defendantAttorneyFee)}TL vekalet ücretinin ${partyText.plaintiffFrom} ` +
                `alınarak ${partyText.defendantText.replace('dan', 'ya')} verilmesine,`
            );
        }

        resultParts.push(getCommonText());

        return resultParts.join('\n');
    } catch (error) {
        throw new Error(`Kısmen kabul hesaplaması hatası: ${error.message}`);
    }
}

function calculateRejection() {
    try {
        const formData = getFormData();
        let resultParts = [];

        const partyText = getPartyText(formData.checkboxes['multiple-plaintiffs'], formData.checkboxes['multiple-defendants']);

        const maktuHarc = 615.40;
        const { feeParts, totalPaidFees } = getFeeParts(formData);

        if (totalPaidFees === maktuHarc) {
            resultParts.push("-Alınan harç yeterli olmakla başkaca harç alınmasına yer olmadığına,");
        } else {
            const remainingFee = maktuHarc - totalPaidFees;

            if (remainingFee > 0) {
                if (totalPaidFees === 0) {
                    // Hiç harç yatırılmamışsa
                    resultParts.push(
                        `-Harçlar Kanunu uyarınca alınması gereken toplam ` +
                        `${formatCurrency(maktuHarc)}TL karar ve ilam harcının ` +
                        `${partyText.plaintiffPrefix.toLowerCase()}dan alınarak hazineye gelir kaydına,`
                    );
                } else {
                    // Kısmi harç yatırılmışsa
                    resultParts.push(
                        `-Harçlar Kanunu uyarınca alınması gereken toplam ` +
                        `${formatCurrency(maktuHarc)}TL harçtan daha önce ödenen toplam ${formatCurrency(totalPaidFees)}TL ` +
                        `harç düşüldükten sonra eksik kalan ${formatCurrency(remainingFee)}TL harcın ` +
                        `${partyText.plaintiffPrefix.toLowerCase()}dan alınarak hazineye gelir kaydına,`
                    );
                }
            } else if (remainingFee < 0) {
                const refundAmount = Math.abs(remainingFee);
                resultParts.push(
                    `-Harçlar Kanunu uyarınca dava değeri üzerinden alınması gereken toplam ` +
                    `${formatCurrency(maktuHarc)}TL harcın mahsubu ile fazladan alınan ` +
                    `${formatCurrency(refundAmount)}TL'nin yatıran tarafa iadesine,`
                );
            }
        }

        // Masraf hesaplaması
        const expenseItems = {
            'kesif-harc': 'keşif harcı',
            'basvuru-harc': 'başvuru harcı',
            'bilirkisi': 'bilirkişi ücreti',
            'tebligat': 'tebligat ve posta gideri'
        };

        const { expenseList, totalExpenses } = getExpenseList(formData, expenseItems);

        if (expenseList.length > 0) {
            resultParts.push(
                `-${partyText.plaintiffPrefix} tarafından yapılan yargılama giderinin kendi üzerine bırakılmasına,`
            );
        }

        if (formData.checkboxes['has-defendant-attorney']) {
            const caseAmount = parseAmount(formData.entries['dava-miktari'] || '0');
            const attorneyFee = calculateAttorneyFee(caseAmount);

            resultParts.push(
                `- ${partyText.defendantPrefix} kendisini vekil ile temsil ettirdiğinden karar tarihi itibariyle ` +
                `yürürlükte bulunan Avukatlık Asgari Ücret Tarifesi uyarınca hesaplanan ` +
                `${formatCurrency(attorneyFee)}TL vekalet ücretinin ${partyText.plaintiffPrefix.toLowerCase()}dan alınarak ` +
                `${partyText.defendantText} verilmesine,`
            );
        }

        resultParts.push(getCommonText());

        return resultParts.join('\n');
    } catch (error) {
        throw new Error(`Davanın reddi hesaplaması hatası: ${error.message}`);
    }
}

// Yardımcı fonksiyonlar
function getFormData() {
    const prefix = getPrefix();
    const checkboxes = {};
    const entries = {};

    // Checkbox'ları topla
    document.querySelectorAll(`input[type="checkbox"][id^="${prefix}-"]`).forEach(checkbox => {
        const name = checkbox.id.replace(`${prefix}-`, '');
        checkboxes[name] = checkbox.checked;
    });

    // Metin kutularını topla
    document.querySelectorAll(`input[type="text"][id^="${prefix}-"]`).forEach(input => {
        const name = input.id.replace(`${prefix}-`, '');
        entries[name] = input.value;
    });

    return { checkboxes, entries };
}

function formatCurrency(amount) {
    try {
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch {
        return "0,00";
    }
}

function parseAmount(text) {
    if (!text) return 0;
    try {
        return parseFloat(text.replace(/\./g, '').replace(',', '.'));
    } catch {
        throw new Error(`Geçersiz sayı formatı: ${text}`);
    }
}

function getPartyText(multiplePlaintiffs, multipleDefendants) {
    return {
        plaintiffPrefix: multiplePlaintiffs ? "Davacılar" : "Davacı",
        plaintiffText: multiplePlaintiffs ? "davacılara" : "davacıya",
        plaintiffFrom: multiplePlaintiffs ? "davacılardan" : "davacıdan",
        defendantPrefix: multipleDefendants ? "Davalılar" : "Davalı",
        defendantText: multipleDefendants ? "davalılardan" : "davalıdan"
    };
}

function getFeeParts(formData) {
    if (!formData || !formData.entries) {
        throw new Error('Form data entries is undefined');
    }

    const paidFees = parseAmount(formData.entries['pesin-harc'] || '0');
    const feeParts = [`${formatCurrency(paidFees)}TL peşin harcı`];
    let totalPaidFees = paidFees;

    // Harç türü isimleri düzeltildi
    const feeTypeNames = {
        'tamamlama-harci': 'tamamlama harcı',
        'islah-harci': 'ıslah harcı'
    };

    for (const feeType of ['tamamlama-harci', 'islah-harci']) {
        if (formData.entries[feeType]) {
            const feeAmount = parseAmount(formData.entries[feeType]);
            if (feeAmount > 0) {
                totalPaidFees += feeAmount;
                feeParts.push(`${formatCurrency(feeAmount)}TL ${feeTypeNames[feeType]}`);
            }
        }
    }

    return { feeParts, totalPaidFees };
}

// Harç iadesi metni oluştur
function createFeeRefundText(feeParts, totalPaidFees, partyText) {
    if (feeParts.length === 1) {
        // Tek harç türü varsa "olmak üzere toplam" kısmını çıkar
        return `-${partyText.plaintiffPrefix} tarafından yatırılan ${feeParts[0]}ın ${partyText.defendantText} alınarak ${partyText.plaintiffText} verilmesine,`;
    } else {
        // Birden fazla harç türü varsa toplam göster
        return `-${partyText.plaintiffPrefix} tarafından yatırılan ${feeParts.join(', ')} olmak üzere toplam ` +
               `${formatCurrency(totalPaidFees)}TL'nin ${partyText.defendantText} alınarak ${partyText.plaintiffText} verilmesine,`;
    }
}

// Kısmi kabul için harç paylaşım metni oluştur
function createFeeShareText(feeParts, totalPaidFees, acceptanceRatio, partyText) {
    const plaintiffFeeShare = totalPaidFees * acceptanceRatio;
    const defendantFeeShare = totalPaidFees - plaintiffFeeShare;

    if (feeParts.length === 1) {
        // Tek harç türü varsa "olmak üzere toplam" kısmını çıkar
        return `-${partyText.plaintiffPrefix} tarafından yatırılan ${feeParts[0]}ın kabul/ret oranı dikkate alınarak ` +
               `${formatCurrency(defendantFeeShare)}TL'nin ${partyText.defendantText} alınarak ` +
               `${partyText.plaintiffText} verilmesine, bakiye ${formatCurrency(plaintiffFeeShare)}TL'nin ` +
               `${partyText.plaintiffPrefix} üzerinde bırakılmasına,`;
    } else {
        // Birden fazla harç türü varsa toplam göster
        return `-${partyText.plaintiffPrefix} tarafından yatırılan ${feeParts.join(', ')} olmak üzere toplam ` +
               `${formatCurrency(totalPaidFees)}TL'nin kabul/ret oranı dikkate alınarak ` +
               `${formatCurrency(defendantFeeShare)}TL'nin ${partyText.defendantText} alınarak ` +
               `${partyText.plaintiffText} verilmesine, bakiye ${formatCurrency(plaintiffFeeShare)}TL'nin ` +
               `${partyText.plaintiffPrefix} üzerinde bırakılmasına,`;
    }
}

function getExpenseList(formData, expenseItems) {
    let totalExpenses = 0;
    const expenseList = [];

    for (const [entryName, displayName] of Object.entries(expenseItems)) {
        if (formData.entries[entryName]) {
            const amount = parseAmount(formData.entries[entryName]);
            if (amount > 0) {
                totalExpenses += amount;
                expenseList.push(`${formatCurrency(amount)}TL ${displayName}`);
            }
        }
    }

    return { expenseList, totalExpenses };
}

function calculateAttorneyFee(amount) {
    const MAKTU_UCRET = 30000.00;  // 2024 yılı maktu vekalet ücreti

    if (!amount || amount <= 0) {
        return MAKTU_UCRET;
    }

    if (amount <= MAKTU_UCRET) {
        return amount;
    }

    const feeBrackets = [
        [400000, 0.16],
        [400000, 0.15],
        [800000, 0.14],
        [1200000, 0.11],
        [1600000, 0.08],
        [2000000, 0.05],
        [2400000, 0.03],
        [2800000, 0.02]
    ];

    let fee = 0;
    let remaining = amount;

    for (const [bracketAmount, rate] of feeBrackets) {
        if (remaining <= 0) {
            break;
        }

        const calcAmount = Math.min(bracketAmount, remaining);
        fee += calcAmount * rate;
        remaining -= calcAmount;
    }

    if (remaining > 0) {
        fee += remaining * 0.01;
    }

    return Math.max(fee, MAKTU_UCRET);
}

function getCommonText() {
    return "-Kalan gider avansının karar kesinleştiğinde ve talep halinde, yatıran taraf dosyaya banka IBAN numarası bildirdiği takdirde bu hesaba, kaleme müracaat etmesi halinde mahkemeler veznesinden, aksi halde masrafı avanstan karşılanmak üzere resen PTT yoluyla konutta ödemeli olarak iadesine,";
}
