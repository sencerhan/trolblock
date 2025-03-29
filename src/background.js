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
    console.log('[Trolblock] Background received message:', message);
    
    if (message.action === "getBlockedAuthors") {
        storage.get(['blockedAuthors'], (result) => {
            console.log("[Trolblock] Sending blocked authors:", result.blockedAuthors);
            sendResponse({ blockedAuthors: result.blockedAuthors || [] });
        });
        return true; // Ensure the listener returns true to indicate async response
    } else if (message.action === "updateBlockedAuthors") {
        const blockedAuthors = message.blockedAuthors || [];
        console.log("[Trolblock] Updating blocked authors:", blockedAuthors);
        
        storage.set({ blockedAuthors }, () => {
            if (browser.runtime.lastError) {
                console.error('[Trolblock] Storage error:', browser.runtime.lastError);
                sendResponse({ success: false, error: browser.runtime.lastError });
            } else {
                console.log("[Trolblock] Blocked authors updated successfully");
                sendResponse({ success: true });
            }
        });
        return true;
    } else if (message.action === "refreshOptionsPage") {
        console.log("[Trolblock] Refreshing options page with:", message.blockedAuthors);
        // Relay the message to all tabs
        browser.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                browser.tabs.sendMessage(tab.id, message).catch(err => {
                    console.log("[Trolblock] Error sending to tab", tab.id, err);
                });
            });
        });
        return true;
    } else if (message.action === "reloadPopup") {
        browser.action.openPopup();
    }
});

browser.browserAction.onClicked.addListener(() => {
    browser.tabs.create({ url: browser.runtime.getURL("src/options/options.html") });
});