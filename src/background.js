// Uzantı yüklendiğinde varsayılan değerleri başlat
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ blockedAuthors: [] });
});

// Popup veya content scriptlerden gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getBlockedAuthors") {
    chrome.storage.local.get(['blockedAuthors'], (result) => {
      sendResponse({ blockedAuthors: result.blockedAuthors || [] });
    });
    return true;
  } else if (message.action === "updateBlockedAuthors") {
    chrome.storage.local.set({ blockedAuthors: message.blockedAuthors }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});