document.addEventListener('DOMContentLoaded', function() {
  const textarea = document.getElementById('blockedAuthors');
  const saveButton = document.getElementById('saveButton');
  const statusElement = document.getElementById('status');
  
  // Kaydedilmiş engellenen yazarları yükle
  chrome.runtime.sendMessage({ action: "getBlockedAuthors" }, (response) => {
    if (response && response.blockedAuthors) {
      textarea.value = response.blockedAuthors.join(', ');
    }
  });
  
  // Buton tıklandığında engellenen yazarları kaydet
  saveButton.addEventListener('click', function() {
    const text = textarea.value.trim();
    let blockedAuthors = text ? text.split(',').map(author => author.trim()).filter(author => author !== '') : [];
    
    chrome.runtime.sendMessage({ action: "updateBlockedAuthors", blockedAuthors }, response => {
        if (response.success) {
            statusElement.textContent = "Başarıyla kaydedildi!";
            
            chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { 
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
      chrome.runtime.sendMessage({ action: "getBlockedAuthors" }, (response) => {
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
                      chrome.runtime.sendMessage(
                          { action: "updateBlockedAuthors", blockedAuthors: data.blockedAuthors },
                          response => {
                              if (response.success) {
                                  textarea.value = data.blockedAuthors.join(', ');
                                  statusElement.textContent = "Liste başarıyla yüklendi!";
                                  setTimeout(() => statusElement.textContent = "", 2000);
                              }
                          }
                      );
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
  chrome.storage.sync.get(['showNotifications', 'showAnimations'], (result) => {
      document.getElementById('showNotifications').checked = result.showNotifications !== false;
      document.getElementById('showAnimations').checked = result.showAnimations !== false;
  });

  // Ayarları kaydet
  ['showNotifications', 'showAnimations'].forEach(id => {
      document.getElementById(id).addEventListener('change', function(e) {
          chrome.storage.sync.set({ [id]: e.target.checked }, () => {
              // Aktif sekmeye ayarları bildir
              chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                  if (tabs[0]) {
                      chrome.tabs.sendMessage(tabs[0].id, { 
                          action: "updateSettings",
                          settings: { [id]: e.target.checked }
                      });
                  }
              });
          });
      });
  });
});