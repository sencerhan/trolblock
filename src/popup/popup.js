document.addEventListener('DOMContentLoaded', function() {
  const textarea = document.getElementById('blockedAuthors');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');
  
  // Kaydedilmiş engellenen yazarları yükle
  browser.runtime.sendMessage({ action: "getBlockedAuthors" }).then((response) => {
    if (response && response.blockedAuthors) {
      textarea.value = response.blockedAuthors.join(', ');
    }
  });
  
  // Buton tıklandığında engellenen yazarları kaydet
  saveButton.addEventListener('click', function() {
    const text = textarea.value.trim();
    let blockedAuthors = text ? text.split(',').map(author => author.trim()).filter(author => author !== '') : [];
    
    browser.runtime.sendMessage({ action: "updateBlockedAuthors", blockedAuthors }).then(response => {
        if (response.success) {
            statusElement.textContent = "Başarıyla kaydedildi!";
            
            browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                if (tabs[0]) {
                    browser.tabs.sendMessage(tabs[0].id, { 
                        action: "updateBlockedAuthors",
                        blockedAuthors
                    });
                }
            });
            
            setTimeout(() => statusElement.textContent = "", 2000);
        }
    });
  });

  // Yedekleme butonu
  document.getElementById('exportButton').addEventListener('click', function() {
      browser.runtime.sendMessage({ action: "getBlockedAuthors" }).then((response) => {
          if (response && response.blockedAuthors) {
              const blob = new Blob([JSON.stringify({ blockedAuthors: response.blockedAuthors })], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'trolblock-backup.json';
              a.click();
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
                  const data = JSON.parse(e.target.result);
                  if (data.blockedAuthors && Array.isArray(data.blockedAuthors)) {
                      browser.runtime.sendMessage(
                          { action: "updateBlockedAuthors", blockedAuthors: data.blockedAuthors }
                      ).then(response => {
                          if (response.success) {
                              textarea.value = data.blockedAuthors.join(', ');
                              statusElement.textContent = "Liste başarıyla yüklendi!";
                              setTimeout(() => statusElement.textContent = "", 2000);
                          }
                      });
                  }
              } catch (error) {
                  statusElement.textContent = "Geçersiz yedek dosyası!";
                  setTimeout(() => statusElement.textContent = "", 2000);
              }
          };
          reader.readAsText(file);
      }
  });

  // Ayarları yükle
  browser.storage.sync.get(['showNotifications', 'showAnimations']).then((result) => {
      document.getElementById('showNotifications').checked = result.showNotifications !== false;
      document.getElementById('showAnimations').checked = result.showAnimations !== false;
  });

  // Ayarları kaydet
  ['showNotifications', 'showAnimations'].forEach(id => {
      document.getElementById(id).addEventListener('change', function(e) {
          browser.storage.sync.set({ [id]: e.target.checked }).then(() => {
              // Aktif sekmeye ayarları bildir
              browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
                  if (tabs[0]) {
                      browser.tabs.sendMessage(tabs[0].id, { 
                          action: "updateSettings",
                          settings: { [id]: e.target.checked }
                      });
                  }
              });
          });
      });
  });
});