// Polyfill: browser API'si yoksa chrome API'sini kullan
if (typeof browser === "undefined") {
    var browser = chrome;
}

const storage = navigator.userAgent.includes('Firefox') ? browser.storage.local : browser.storage.sync;

// Uzantı yüklendiğinde varsayılan değerleri başlat
browser.runtime.onInstalled.addListener(() => {
    storage.get(['blockedAuthors', 'showNotifications', 'showAnimations'], (result) => {
        const defaults = {
            blockedAuthors: result.blockedAuthors || [],
            showNotifications: result.showNotifications !== false,
            showAnimations: result.showAnimations !== false
        };
        storage.set(defaults);
    });
});

// Popup veya content scriptlerden gelen mesajları dinle
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getBlockedAuthors") {
        storage.get(['blockedAuthors'], (result) => {
            console.log("Engelli yazarlar gönderiliyor:", result.blockedAuthors); // Debug için log ekle
            sendResponse({ blockedAuthors: result.blockedAuthors || [] });
        });
        return true; // Ensure the listener returns true to indicate async response
    } else if (message.action === "updateBlockedAuthors") {
        const blockedAuthors = message.blockedAuthors || [];
        storage.set({ blockedAuthors }, () => {
            if (browser.runtime.lastError) {
                console.error('Storage error:', browser.runtime.lastError);
                sendResponse({ success: false, error: browser.runtime.lastError });
            } else {
                sendResponse({ success: true });
            }
        });
        return true;
    } else if (message.action === "reloadPopup") {
        browser.action.openPopup();
    }
});

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({ url: browser.runtime.getURL("src/options/options.html") });
});