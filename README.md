# Hukuki Hesaplama Programı - Modern Web Uygulaması

Modern, responsive ve kullanıcı dostu hukuki hesaplama web uygulaması. GitHub Pages üzerinde yayınlanmaya hazır.

## 🚀 Özellikler

### ⚡ Modern Tasarım
- **Responsive Design**: Tüm cihazlarda mükemmel görünüm
- **Dark/Light Theme**: Kullanıcı tercihine göre tema değiştirme
- **Modern UI/UX**: Inter font ailesi ve modern tasarım dili
- **Smooth Animations**: Akıcı geçişler ve animasyonlar

### 📊 Hesaplama Türleri
1. **Tam Kabul**: Davanın tamamen kabul edildiği durumlar
2. **Kısmen Kabul/Ret**: Davanın kısmen kabul edildiği durumlar  
3. **Davanın Reddi**: Davanın tamamen reddedildiği durumlar

### 🛠️ İşlevler
- **Otomatik Hesaplama**: Girilen verilere göre otomatik hesaplama
- **Sonuç Kopyalama**: Hesaplama sonucunu panoya kopyalama
- **Yazdırma**: Sonuçları yazdırma özelliği
- **Form Temizleme**: Hızlı form temizleme
- **Yardım Sistemi**: Kullanım kılavuzu modal'ı

### 💾 Veri Yönetimi
- **LocalStorage**: Tema tercihi kaydetme
- **Form Validation**: Girdi doğrulama
- **Error Handling**: Hata yönetimi

## 🌐 Canlı Demo

[GitHub Pages'de Görüntüle](https://saffetcelik.github.io/hesaplama)

## 📱 Ekran Görüntüleri

### Desktop Görünüm
![Desktop](screenshots/desktop.png)

### Mobile Görünüm
![Mobile](screenshots/mobile.png)

### Dark Theme
![Dark Theme](screenshots/dark-theme.png)

## 🚀 Kurulum ve Kullanım

### GitHub Pages ile Yayınlama

1. **Repository'yi Clone Edin**
   ```bash
   git clone https://github.com/saffetcelik/hesaplama.git
   cd hesaplama
   ```

2. **GitHub Pages'i Etkinleştirin**
   - Repository Settings > Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Save

3. **Canlı Yayında!**
   - Siteniz `https://saffetcelik.github.io/hesaplama` adresinde yayında

### Yerel Geliştirme

```bash
# Repository'yi klonlayın
git clone https://github.com/saffetcelik/hesaplama.git

# Dizine gidin
cd hesaplama

# Basit HTTP server başlatın
python -m http.server 8000
# veya
npx serve .

# Tarayıcıda açın
open http://localhost:8000
```

## 📁 Proje Yapısı

```
hesaplama/
├── index.html          # Ana HTML dosyası
├── styles.css          # Modern CSS stilleri
├── script.js           # JavaScript işlevleri
├── key.png             # Logo dosyası
├── README.md           # Bu dosya
└── .github/workflows/  # GitHub Actions
```

## 🎨 Teknolojiler

- **HTML5**: Semantic markup
- **CSS3**: Modern CSS özellikleri
  - CSS Grid & Flexbox
  - CSS Custom Properties (Variables)
  - CSS Animations & Transitions
- **JavaScript ES6+**: Modern JavaScript
  - Async/Await
  - LocalStorage API
  - Clipboard API
- **Font Awesome**: İkonlar
- **Google Fonts**: Inter font ailesi

## 🔧 Özelleştirme

### Tema Renkleri
CSS değişkenlerini düzenleyerek renkleri özelleştirebilirsiniz:

```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  /* Diğer renkler... */
}
```

### Yeni Hesaplama Türü Ekleme
1. HTML'de yeni tab ekleyin
2. CSS'de stil tanımları yapın
3. JavaScript'te hesaplama fonksiyonu ekleyin

## 📊 Browser Desteği

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

**Saffet Çelik**
- GitHub: [@saffetcelik](https://github.com/saffetcelik)
- Email: saffetcelik@icloud.com

## 🙏 Teşekkürler

- Font Awesome ikonları için
- Google Fonts için
- Açık kaynak topluluğu için

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!

---

🚀 **Canlı Demo**: [https://saffetcelik.github.io/hesaplama](https://saffetcelik.github.io/hesaplama)


 
.\deploy-actions.ps1 -SetupWorkflow
.\deploy-actions.ps1