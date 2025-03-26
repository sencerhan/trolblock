// Uzantı yüklendiğinde varsayılan değerleri başlat
chrome.runtime.onInstalled.addListener(() => {
    // Önce mevcut listeyi kontrol et
    chrome.storage.sync.get(['blockedAuthors'], (result) => {
        if (!result.blockedAuthors) {
            // Sadece liste boşsa yeni boş liste oluştur
            chrome.storage.sync.set({ blockedAuthors: [] });
        }
    });
});

// Popup veya content scriptlerden gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getBlockedAuthors") {
        chrome.storage.sync.get(['blockedAuthors'], (result) => {
            sendResponse({ blockedAuthors: result.blockedAuthors || [] });
        });
        return true;
    } else if (message.action === "updateBlockedAuthors") {
        const blockedAuthors = message.blockedAuthors || [];
        chrome.storage.sync.set({ blockedAuthors }, () => {
            if (chrome.runtime.lastError) {
                console.error('Storage error:', chrome.runtime.lastError);
                sendResponse({ success: false, error: chrome.runtime.lastError });
            } else {
                sendResponse({ success: true });
            }
        });
        return true;
    }
});