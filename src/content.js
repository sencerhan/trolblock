let blockedAuthors = [];
let throttleTimer;

function showNotification(count) {
    const notification = document.createElement('div');
    notification.textContent = `${count} zırva temizlendi`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 16px;
        border-radius: 4px;
        z-index: 9999;
        opacity: 1;
        transition: opacity 0.5s;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

function removeBlockedComments() {
    const commentElements = document.querySelectorAll('li[data-author]');
    let removedCount = 0;
    
    for (const element of commentElements) {
        if (blockedAuthors.includes(element.getAttribute('data-author'))) {
            element.style.display = 'none';
            removedCount++;
        }
    }
    
    if (removedCount > 0) {
        showNotification(removedCount);
    }
}

// Engellenen yazarları yükle ve hemen başlat
chrome.runtime.sendMessage({ action: "getBlockedAuthors" }, response => {
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

// Popup'tan gelen güncelleme mesajlarını dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "refreshBlockList") {
        chrome.runtime.sendMessage({ action: "getBlockedAuthors" }, response => {
            if (response?.blockedAuthors) {
                blockedAuthors = response.blockedAuthors;
                removeBlockedComments();
            }
        });
        sendResponse({ success: true });
    }
});

// Popup'tan gelen güncelleme mesajlarını dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateBlockedAuthors") {
        blockedAuthors = message.blockedAuthors;
        removeBlockedComments();
        sendResponse({ success: true });
    }
});