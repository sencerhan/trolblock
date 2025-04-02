# Trollblock Uzantısı

Bu Chrome uzantısı, belirli kullanıcılardan gelen istenmeyen tweetleri ve ekşideki entryleri engellemenize yardımcı olur. toplu liste yükleyebilir ya da yedek olarak kaydedip troll listenizi başka kullanıcılarla paylaşabilirsinii. Şimdilik ekşide ve x'te işe yaramaktadır.

## Özellikler

- Kullanıcı adlarını girerek belirli kullanıcılardan gelen gönderileri engelleme
- Engellenen kullanıcılardan gelen gönderileri otomatik olarak gizleme
- Gönderiler gizlendiğinde bildirim gösterme


## Kurulum ve Test

### Geliştirici Modunda Kurulum
1. Bu repoyu bilgisayarınıza indirin
2. Chrome tarayıcınızı açın
3. Adres çubuğuna `chrome://extensions` yazın ve Enter'a basın
4. Sağ üst köşedeki "Geliştirici modu" düğmesini açık konuma getirin
5. "Paketlenmemiş öğe yükle" butonuna tıklayın
6. İndirdiğiniz `trollblock` klasörünü seçin

### Test Etme
1. Chrome'da herhangi bir web sitesini açın
2. Sağ üst köşedeki uzantılar simgesine tıklayın
3. Trollblock uzantı simgesine tıklayarak popup'ı açın
4. Engellemek istediğiniz kullanıcı adlarını virgülle ayırarak yazın
5. "Kaydet" butonuna tıklayın
6. Sayfayı yenileyin - artık engellediğiniz kullanıcıların gönderileri gizlenecektir

### Hata Ayıklama
1. Uzantı çalışmazsa, Chrome'da `chrome://extensions` sayfasına gidin
2. Trollblock uzantısının "Hata" bölümünü kontrol edin
3. "background page" linkine tıklayarak geliştirici konsolunu açın
4. Hata mesajlarını kontrol edin

## Nasıl Çalışır?

Uzantı, oluşturacağınız liste ile eşleşen gönderileri yok edecektir.

## Katkıda Bulunma

İyileştirmeler ve hata düzeltmeleri için sorun bildirmeye veya çekme istekleri göndermeye çekinmelisiniz çünkü uğraşamam forklayıp devam ediniz.

## Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.