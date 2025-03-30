const storage = chrome.storage.sync;

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
    storage.get(['blockedAuthors', 'showNotifications', 'showAnimations'], (result) => {
        const defaults = {
            blockedAuthors: result.blockedAuthors || [],
            showNotifications: result.showNotifications !== false,
            showAnimations: result.showAnimations !== false
        };
        storage.set(defaults);
    });
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Trollblock] Background received message:', message);
    
    switch(message.action) {
        case "getBlockedAuthors":
            storage.get(['blockedAuthors'], (result) => {
                sendResponse({ blockedAuthors: result.blockedAuthors || [] });
            });
            return true;

        case "updateBlockedAuthors":
            handleUpdateBlockedAuthors(message, sendResponse);
            return true;

        case "refreshOptionsPage":
            handleRefreshOptionsPage(message);
            return true;

        case "updateSettings":
            handleUpdateSettings(message);
            return true;
    }
});

// Helper functions
function handleUpdateBlockedAuthors(message, sendResponse) {
    const blockedAuthors = message.blockedAuthors || [];
    storage.set({ blockedAuthors }, () => {
        if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError });
            return;
        }
        broadcastToTabs({ action: "updateBlockedAuthors", blockedAuthors });
        sendResponse({ success: true });
    });
}

function handleRefreshOptionsPage(message) {
    broadcastToTabs(message);
}

function handleUpdateSettings(message) {
    broadcastToTabs(message);
}

function broadcastToTabs(message) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, message).catch(console.error);
        });
    });
}

// Action click handler
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/options/options.html") });
});
