# Trollblock Uzantısı

Trollblock, Twitter/X ve Ekşi Sözlük'teki istenmeyen içerikleri engellemenize yardımcı olan bir tarayıcı uzantısıdır. Chrome, Edge ve Mozilla Firefox'ta çalışmaktadır. Kullanıcı adlarını veya içerik filtrelerini belirleyerek, bu platformlardaki rahatsız edici içerikleri kolayca gizleyebilirsiniz.

## Özellikler

- **Kullanıcı Engelleme**: Belirli kullanıcı adlarını girerek, bu kullanıcılardan gelen içerikleri gizleyebilirsiniz.
- **İçerik Filtresi**: Belirli kelimeleri veya ifadeleri kara listeye ekleyerek, bu kelimeleri içeren içerikleri engelleyebilirsiniz.
- **Bildirimler**: Engellenen içeriklerle ilgili bildirimler alabilirsiniz.
- **Animasyonlu Silme**: İçeriklerin silinmesi sırasında animasyonlu efektler kullanabilirsiniz.
- **Yedekleme ve Geri Yükleme**: Engellenen kullanıcılar ve içerik filtrelerini yedekleyebilir ve geri yükleyebilirsiniz.

## Kurulum ve Test

### Chrome için Kurulum
1. Bu repoyu bilgisayarınıza indirin.
2. Chrome tarayıcınızı açın.
3. Adres çubuğuna `chrome://extensions` yazın ve Enter'a basın.
4. Sağ üst köşedeki "Geliştirici modu" düğmesini açık konuma getirin.
5. "Paketlenmemiş öğe yükle" butonuna tıklayın.
6. İndirdiğiniz `trollblock` klasörünü seçin.

### Mozilla Firefox için Kurulum
1. Bu repoyu bilgisayarınıza indirin.
2. Firefox tarayıcınızı açın.
3. Adres çubuğuna `about:debugging#/runtime/this-firefox` yazın ve Enter'a basın.
4. "Geçici Eklenti Yükle" butonuna tıklayın.
5. `manifest.json` dosyasını seçin.

### Microsoft Edge için Kurulum
1. Bu repoyu bilgisayarınıza indirin.
2. Edge tarayıcınızı açın.
3. Adres çubuğuna `edge://extensions` yazın ve Enter'a basın.
4. Sağ alt köşedeki "Geliştirici modu" düğmesini açık konuma getirin.
5. "Paketlenmemiş öğe yükle" butonuna tıklayın.
6. İndirdiğiniz `trollblock` klasörünü seçin.

### Test Etme
1. Tarayıcınızda Twitter/X veya Ekşi Sözlük'ü açın.
2. Sağ üst köşedeki uzantılar simgesine tıklayın.
3. Trollblock uzantı simgesine tıklayarak ayarlar sayfasını açın.
4. Engellemek istediğiniz kullanıcı adlarını veya içerik filtrelerini girin:
   - Kullanıcı adlarını alt alta yazabilirsiniz.
   - İçerik filtrelerini alt alta veya virgülle ayırarak yazabilirsiniz.
5. "Kaydet" butonuna tıklayın.
6. Sayfayı yenileyin - artık engellediğiniz kullanıcıların gönderileri ve belirttiğiniz içerikler gizlenecektir.

### Hata Ayıklama
1. Uzantı çalışmazsa, tarayıcınızın uzantılar sayfasına gidin:
   - Chrome: `chrome://extensions`
   - Firefox: `about:debugging#/runtime/this-firefox`
   - Edge: `edge://extensions`
2. Trollblock uzantısının "Hata" bölümünü kontrol edin.
3. "background page" veya "console" linkine tıklayarak geliştirici konsolunu açın.
4. Hata mesajlarını kontrol edin.

## Nasıl Çalışır?

1. **Kullanıcı Engelleme**: Ayarlar sayfasında engellemek istediğiniz kullanıcı adlarını girin. Bu kullanıcıların gönderileri otomatik olarak gizlenecektir.
2. **İçerik Filtresi**: Kara listeye eklediğiniz kelimeleri içeren içerikler otomatik olarak gizlenecektir.
3. **Bildirimler ve Animasyonlar**: Engellenen içerikler için bildirimler ve animasyonlu silme efektleri etkinleştirilebilir.

## Katkıda Bulunma

İyileştirmeler ve hata düzeltmeleri için sorun bildirebilir veya çekme istekleri gönderebilirsiniz. Ayrıca projeyi forklayıp kendi ihtiyaçlarınıza göre geliştirebilirsiniz.

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.