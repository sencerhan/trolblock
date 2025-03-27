// Uzantı yüklendiğinde varsayılan değerleri başlat
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(['blockedAuthors', 'showNotifications', 'showAnimations'], (result) => {
        const defaults = {
            blockedAuthors: result.blockedAuthors || [],
            showNotifications: result.showNotifications !== false,
            showAnimations: result.showAnimations !== false
        };
        chrome.storage.sync.set(defaults);
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