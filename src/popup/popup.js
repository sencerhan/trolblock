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
    // Textarea içeriğini ayrıştır
    const text = textarea.value.trim();
    let blockedAuthors = text ? text.split(',').map(author => author.trim()).filter(author => author !== '') : [];
    
    // Depolamaya kaydet ve aktif sekmeye bildir
    chrome.runtime.sendMessage(
      { action: "updateBlockedAuthors", blockedAuthors: blockedAuthors },
      (response) => {
        if (response.success) {
          statusElement.textContent = "Başarıyla kaydedildi!";
          
          // Aktif sekmeye yeni listeyi doğrudan gönder
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "updateBlockedAuthors", blockedAuthors: blockedAuthors }
              );
            }
          });
          
          // Durum mesajını 2 saniye sonra temizle
          setTimeout(() => {
            statusElement.textContent = "";
          }, 2000);
        }
      }
    );
  });
});