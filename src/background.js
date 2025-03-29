// Import the browser polyfill for service worker
importScripts('/browser-polyfill.js');

// Uzantı yüklendiğinde varsayılan değerleri başlat
browser.runtime.onInstalled.addListener(() => {
    browser.storage.sync.get(['blockedAuthors', 'showNotifications', 'showAnimations']).then((result) => {
        const defaults = {
            blockedAuthors: result.blockedAuthors || [],
            showNotifications: result.showNotifications !== false,
            showAnimations: result.showAnimations !== false
        };
        browser.storage.sync.set(defaults);
    });
});

// Popup veya content scriptlerden gelen mesajları dinle
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getBlockedAuthors") {
        browser.storage.sync.get(['blockedAuthors']).then((result) => {
            sendResponse({ blockedAuthors: result.blockedAuthors || [] });
        });
        return true;
    } else if (message.action === "updateBlockedAuthors") {
        const blockedAuthors = message.blockedAuthors || [];
        browser.storage.sync.set({ blockedAuthors }).then(() => {
            sendResponse({ success: true });
        }).catch((error) => {
            console.error('Storage error:', error);
            sendResponse({ success: false, error: error });
        });
        return true;
    }
});