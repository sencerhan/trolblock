// Polyfill: browser API'si yoksa chrome API'sini kullan
if (typeof browser === "undefined") {
    var browser = {
        ...chrome,
        runtime: {
            ...chrome.runtime,
            sendMessage: (message) => {
                return new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(message, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(response);
                        }
                    });
                });
            },
        },
        storage: {
            local: chrome.storage.local
        }
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const showNotificationsCheckbox = document.getElementById('showNotifications');
    const showAnimationsCheckbox = document.getElementById('showAnimations');
    const textarea = document.getElementById('blockedAuthors');
    const saveButton = document.getElementById('saveButton');

    // Ayarları yükle
    function loadSettings() {
        if (typeof browser.runtime.sendMessage !== "function") {
            console.error("browser.runtime.sendMessage is not defined.");
            return;
        }

        // Engellenen yazarları getBlockedAuthors mesajıyla al
        browser.runtime.sendMessage({ action: "getBlockedAuthors" })
            .then((response) => {
                if (response?.blockedAuthors) {
                    console.log("Engelli yazarlar alındı:", response.blockedAuthors); // Debug için log ekle
                    textarea.value = response.blockedAuthors.join('\n'); // Güncel listeyi textarea'ya yaz
                    console.log("Engelli yazarlar textarea'ya yazıldı:", response.blockedAuthors);
                } else {
                    console.log("Engelli yazarlar listesi boş.");
                }
            })
            .catch((error) => {
                console.error("Engelli yazarlar alınırken hata oluştu:", error);
            });

        // Diğer ayarları yükle
        browser.storage.local.get(['showNotifications', 'showAnimations'], (result) => {
            if (browser.runtime.lastError) {
                console.error('Storage error:', browser.runtime.lastError);
                return;
            }
            showNotificationsCheckbox.checked = result.showNotifications !== false;
            showAnimationsCheckbox.checked = result.showAnimations !== false;
        });
    }

    loadSettings(); // Sayfa yüklendiğinde ayarları yükle

    // Ayarları kaydet
    function saveSettings() {
        const settings = {
            showNotifications: showNotificationsCheckbox.checked,
            showAnimations: showAnimationsCheckbox.checked,
            blockedAuthors: textarea.value.split('\n').map(line => line.trim()).filter(line => line)
        };
        browser.storage.local.set(settings, () => {
            if (browser.runtime.lastError) {
                console.error('Storage error:', browser.runtime.lastError);
                return;
            }
            statusElement.textContent = "Ayarlar kaydedildi!";
            setTimeout(() => statusElement.textContent = "", 2000);
        });
    }

    [showNotificationsCheckbox, showAnimationsCheckbox].forEach(checkbox => {
        checkbox.addEventListener('change', saveSettings);
    });

    saveButton.addEventListener('click', saveSettings);

    // Yedekleme butonu
    document.getElementById('exportButton').addEventListener('click', function() {
        browser.storage.local.get('blockedAuthors', (result) => {
            if (browser.runtime.lastError) {
                console.error('Storage error:', browser.runtime.lastError);
                return;
            }
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

                    browser.storage.local.set({ blockedAuthors }, () => {
                        if (browser.runtime.lastError) {
                            console.error('Storage error:', browser.runtime.lastError);
                            return;
                        }
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

    // Dışarıdan gelen güncelleme mesajlarını dinle
    browser.runtime.onMessage.addListener((message) => {
        if (message.action === "refreshOptionsPage" && message.blockedAuthors) {
            // Textarea'yı güncelle
            textarea.value = message.blockedAuthors.join('\n');
            
            // İsteğe bağlı: Kullanıcıya bildirim göster
            statusElement.textContent = "Liste güncellendi!";
            setTimeout(() => statusElement.textContent = "", 2000);
        }
        return true;
    });
});
