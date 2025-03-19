// Engellenen yazarların listesini saklamak için değişken
let blockedAuthors = [];

// Engellenen yazarların yorumlarını kaldırma fonksiyonu
function removeBlockedComments() {
  let removedCount = 0;
  const commentElements = document.querySelectorAll('li[data-author]');
  
  commentElements.forEach(element => {
    const author = element.getAttribute('data-author');
    if (blockedAuthors.includes(author)) {
      element.style.display = 'none';
      removedCount++;
    }
  });
  
  return removedCount;
}

// Bildirim gösterme fonksiyonu
function showNotification(count) {
  const notification = document.createElement('div');
  notification.textContent = `${count} zırva temizlendi`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 16px;
    border-radius: 4px;
    z-index: 9999;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 2000);
}

// Engellenen yazarları yükle ve yorumları filtrele
function loadBlockedAuthorsAndFilter() {
  chrome.runtime.sendMessage({ action: "getBlockedAuthors" }, (response) => {
    if (response && response.blockedAuthors) {
      blockedAuthors = response.blockedAuthors;
      const removedCount = removeBlockedComments();
      if (removedCount > 0) {
        showNotification(removedCount);
      }
    }
  });
}

// İlk yükleme
loadBlockedAuthorsAndFilter();

// Dinamik olarak yüklenen yorumları işlemek için DOM değişikliklerini dinle
const observer = new MutationObserver(() => {
  const removedCount = removeBlockedComments();
  if (removedCount > 0) {
    showNotification(removedCount);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Popup'tan gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refreshBlockList") {
    loadBlockedAuthorsAndFilter();
    sendResponse({ success: true });
  }
});