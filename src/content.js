let blockedAuthors = [];
let throttleTimer;
let activeNotification = null;
let removedTotalCount = 0;
let notificationTimeout = null;

function showNotification(count) {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }

  if (activeNotification) {
    activeNotification.remove();
    activeNotification = null;
  }

  const notification = document.createElement("div");
  notification.className = "trolblock-notification";
  notification.innerHTML = `
        <img src="${chrome.runtime.getURL(
          "icons/icon128.png"
        )}" style="width:48px;height:48px;margin-right:16px;">
        <span style="font-size:16px;">${count} zırva temizlendi</span>
    `;
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 20px;
        border-radius: 8px;
        z-index: 99999;
        opacity: 1;
        transition: opacity 0.5s;
        display: flex;
        align-items: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        min-width: 250px;
        min-height: 50px;
    `;

  document.body.appendChild(notification);
  activeNotification = notification;

  setTimeout(() => {
    document.querySelectorAll(".trolblock-notification").forEach(el => el.remove());
  }, 4000); // 4 saniye sonra kaybolacak
}

function removeBlockedComments() {
  const commentElements = document.querySelectorAll("li[data-author]");
  let removedCount = 0;

  for (const element of commentElements) {
    if (blockedAuthors.includes(element.getAttribute("data-author"))) {
      element.remove();
      removedTotalCount++;
      removedCount++;
    }
  }
  if(removedCount > 0) {
    showNotification(removedTotalCount);
    removedTotalCount = 0;
  }
}

// Engellenen yazarları yükle ve hemen başlat
chrome.runtime.sendMessage({ action: "getBlockedAuthors" }, (response) => {
  if (response?.blockedAuthors) {
    blockedAuthors = response.blockedAuthors;
    removeBlockedComments();

    // Sadece gerekli container'ı izle
    new MutationObserver(() => {
      clearTimeout(throttleTimer);
      throttleTimer = setTimeout(removeBlockedComments, 250);
    }).observe(document.body, { childList: true, subtree: true });
  }
});

// Mesaj dinleyicileri
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBlockedAuthors") {
    blockedAuthors = message.blockedAuthors || [];
    removeBlockedComments();
  }
  if (message.action === "refreshBlockList") {
    chrome.runtime.sendMessage({ action: "getBlockedAuthors" }, (response) => {
      if (response?.blockedAuthors) {
        blockedAuthors = response.blockedAuthors;
        removeBlockedComments();
      }
    });
  }
  sendResponse({ success: true });
  return true;
});
