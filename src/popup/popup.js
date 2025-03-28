// Polyfill: browser API'si yoksa chrome API'sini kullan
if (typeof browser === "undefined") {
    var browser = chrome;
}

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('blockedAuthors');
    const saveButton = document.getElementById('saveButton');
    const statusElement = document.getElementById('status');

    // Kaydedilmiş engellenen yazarları yükle
    function loadBlockedAuthors() {
        browser.storage.local.get('blockedAuthors').then((result) => {
            if (result.blockedAuthors) {
                textarea.value = result.blockedAuthors.join('\n');
            }
        });
    }

    loadBlockedAuthors();

    // Buton tıklandığında engellenen yazarları kaydet
    saveButton.addEventListener('click', function() {
        const text = textarea.value.trim();
        const blockedAuthors = text ? text.split('\n').map(author => author.trim()).filter(author => author !== '') : [];

        browser.storage.local.set({ blockedAuthors }).then(() => {
            statusElement.textContent = "Başarıyla kaydedildi!";
            setTimeout(() => statusElement.textContent = "", 2000);
        });
    });

    // Yedekleme butonu
    document.getElementById('exportButton').addEventListener('click', function() {
        browser.storage.local.get('blockedAuthors').then((result) => {
            if (result.blockedAuthors) {
                const blob = new Blob([result.blockedAuthors.join('\n')], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'trolblock-backup.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    });

    // Geri yükleme butonu
    document.getElementById('importButton').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });

    // Dosya seçildiğinde
    document.getElementById('importInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    const blockedAuthors = content.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);

                    browser.storage.local.set({ blockedAuthors }).then(() => {
                        textarea.value = blockedAuthors.join('\n');
                        statusElement.textContent = "Liste başarıyla yüklendi!";
                        setTimeout(() => statusElement.textContent = "", 2000);
                    });
                } catch (error) {
                    console.error('Import error:', error);
                    statusElement.textContent = "Liste yüklenirken hata oluştu!";
                    setTimeout(() => statusElement.textContent = "", 2000);
                }
            };
            reader.readAsText(file);

            // Dosya seçimi tamamlandıktan sonra input'u sıfırla
            e.target.value = '';
        }
    });

    // Ayarları yükle
    browser.storage.local.get(['showNotifications', 'showAnimations']).then((result) => {
        document.getElementById('showNotifications').checked = result.showNotifications !== false;
        document.getElementById('showAnimations').checked = result.showAnimations !== false;
    });

    // Ayarları kaydet
    ['showNotifications', 'showAnimations'].forEach(id => {
        document.getElementById(id).addEventListener('change', function() {
            browser.storage.local.set({ [id]: this.checked });
        });
    });
});