// Add module support check
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
    var browser = chrome;
}

const storage = browser.storage.local;

// Extension installation
browser.runtime.onInstalled.addListener(() => {
    storage.get(['blockedAuthors', 'showNotifications', 'showAnimations']).then(result => {
        const defaults = {
            blockedAuthors: result.blockedAuthors || [],
            showNotifications: result.showNotifications !== false,
            showAnimations: result.showAnimations !== false
        };
        storage.set(defaults);
    });
});

// Message handling
browser.runtime.onMessage.addListener(async (message) => {
    console.log('[Trollblock] Background received message:', message);
    
    switch(message.action) {
        case "getBlockedAuthors":
            return storage.get(['blockedAuthors']).then(result => ({
                blockedAuthors: result.blockedAuthors || []
            }));

        case "updateBlockedAuthors":
            return handleUpdateBlockedAuthors(message);

        case "updateBlockedKeywords":
            await storage.set({ blockedKeywords: message.blockedKeywords || [] });
            await broadcastToTabs({ action: "updateBlockedKeywords", blockedKeywords: message.blockedKeywords });
            return Promise.resolve();

        case "refreshOptionsPage":
            handleRefreshOptionsPage(message);
            return Promise.resolve();

        case "updateSettings":
            handleUpdateSettings(message);
            return Promise.resolve();
    }
});

// Helper functions
async function handleUpdateBlockedAuthors(message) {
    const blockedAuthors = message.blockedAuthors || [];
    try {
        await storage.set({ blockedAuthors });
        await broadcastToTabs({ action: "updateBlockedAuthors", blockedAuthors });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}

async function handleRefreshOptionsPage(message) {
    await broadcastToTabs(message);
}

async function handleUpdateSettings(message) {
    await broadcastToTabs(message);
}

async function broadcastToTabs(message) {
    const tabs = await browser.tabs.query({});
    return Promise.all(tabs.map(tab => 
        browser.tabs.sendMessage(tab.id, message).catch(console.error)
    ));
}

// Action click handler - update to use new API
browser.action.onClicked.addListener(() => {
    browser.tabs.create({ url: browser.runtime.getURL("src/options/options.html") });
});
