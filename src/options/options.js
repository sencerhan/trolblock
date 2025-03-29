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
        const blockedAuthors = textarea.value.split('\n').map(line => line.trim()).filter(line => line);
        
        const settings = {
            showNotifications: showNotificationsCheckbox.checked,
            showAnimations: showAnimationsCheckbox.checked,
            blockedAuthors: blockedAuthors
        };
        
        // Ayarları storage'a kaydet
        browser.storage.local.set(settings, () => {
            if (browser.runtime.lastError) {
                console.error('Storage error:', browser.runtime.lastError);
                statusElement.textContent = "Ayarlar kaydedilirken hata oluştu!";
                return;
            }
            
            // Ayarların kaydedildiğini bildir
            statusElement.textContent = "Ayarlar kaydedildi!";
            
            // Tüm aktif tablara değişiklikleri bildir
            browser.runtime.sendMessage({
                action: "updateBlockedAuthors",
                blockedAuthors: blockedAuthors
            }).then(() => {
                console.log("Blocked authors updated in background script");
                
                // Ayarları aktif tablara gönder
                browser.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        // Tüm tablara ayarların güncellendiğini bildir
                        browser.tabs.sendMessage(tab.id, {
                            action: "updateSettings", 
                            settings: {
                                showNotifications: settings.showNotifications,
                                showAnimations: settings.showAnimations
                            }
                        }).catch(err => {
                            console.log("Error sending settings to tab", tab.id, err);
                        });
                        
                        // Engellenen yazarlar listesini güncelle
                        browser.tabs.sendMessage(tab.id, {
                            action: "updateBlockedAuthors",
                            blockedAuthors: blockedAuthors
                        }).catch(err => {
                            console.log("Error sending blocked authors to tab", tab.id, err);
                        });
                    });
                });
            }).catch(error => {
                console.error("Error updating blocked authors:", error);
            });
            
            // 2 saniye sonra durum mesajını temizle
            setTimeout(() => statusElement.textContent = "", 2000);
        });
    }

    [showNotificationsCheckbox, showAnimationsCheckbox].forEach(checkbox => {
        checkbox.addEventListener('change', saveSettings);
    });

    saveButton.addEventListener('click', saveSettings);

    // Yedekleme butonu
    document.getElementById('exportButton').addEventListener('click', function() {
        // Önce mevcut değişiklikleri kaydet, sonra yedekle
        const currentBlockedAuthors = textarea.value.split('\n').map(line => line.trim()).filter(line => line);
        
        // Önce storage'ı güncelle
        browser.storage.local.set({ blockedAuthors: currentBlockedAuthors }, () => {
            if (browser.runtime.lastError) {
                console.error('Storage error:', browser.runtime.lastError);
                statusElement.textContent = "Yedekleme başarısız: Storage hatası";
                setTimeout(() => statusElement.textContent = "", 2000);
                return;
            }
            
            // Sonra yedekle
            const blob = new Blob([currentBlockedAuthors.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'trolblock-backup.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Bildirim göster
            statusElement.textContent = "Güncel liste yedeklendi!";
            setTimeout(() => statusElement.textContent = "", 2000);
            
            // Diğer sekmelere güncellemeyi bildir
            browser.runtime.sendMessage({
                action: "updateBlockedAuthors",
                blockedAuthors: currentBlockedAuthors
            }).catch(error => {
                console.error("Error updating other tabs:", error);
            });
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
