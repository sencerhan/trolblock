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
    let blockedAuthors = [];
    
    if (text) {
      blockedAuthors = text.split(',')
        .map(author => author.trim())
        .filter(author => author !== '');
    }
    
    // Depolamaya kaydet
    chrome.runtime.sendMessage(
      { action: "updateBlockedAuthors", blockedAuthors: blockedAuthors },
      (response) => {
        if (response.success) {
          statusElement.textContent = "Başarıyla kaydedildi!";
          
          // Aktif sekmeye engel listesini yenilemesi için bildir
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(
                tabs[0].id,
                { action: "refreshBlockList" }
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