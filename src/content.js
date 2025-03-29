// Polyfill: browser API'si yoksa chrome API'sini kullan
if (typeof browser === "undefined") {
    var browser = chrome;
}

let blockedAuthors = [];
let throttleTimer;
let activeNotification = null;
let removedTotalCount = 0;
let notificationTimeout = null;

let settings = {
    showNotifications: true,
    showAnimations: true
};

// Ayarları yükle
function loadSettings() {
    return browser.storage.local.get(['showNotifications', 'showAnimations']).then((result) => {
        settings.showNotifications = result.showNotifications !== false;
        settings.showAnimations = result.showAnimations !== false;
    });
}

function showNotification(count) {
    if (!settings.showNotifications) return; // Bildirimler devre dışıysa çık

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
        <img src="${browser.runtime.getURL(
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
        notification.remove();
        activeNotification = null;
    }, 4000); // 4 saniye sonra kaybolacak
}

async function removeWithAnimation(element) {
    if (!settings.showAnimations) {
        // Animasyon devre dışıysa, doğrudan sil
        element.remove();
        return;
    }

    // Overlay oluştur
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f4f1ea;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    // Gif ekle
    const gif = document.createElement("img");
    gif.src = browser.runtime.getURL("gif/boom.gif");
    gif.style.cssText = `
        width: 100%;
        height: auto;
        object-fit: contain;
    `;
    overlay.appendChild(gif);

    // Element'i relative yap ve overlay'i ekle
    element.style.position = "relative";
    element.appendChild(overlay);

    // 2 saniye bekle ve element'i sil
    await new Promise((resolve) => setTimeout(resolve, 1500));
    element.remove();
    showNotification(1);
}

function removeBlockedComments() {
    const commentElements = document.querySelectorAll("li[data-author]");
    let removedCount = 0;

    for (const element of commentElements) {
        if (blockedAuthors.includes(element.getAttribute("data-author"))) {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            if (isVisible) {
                removeWithAnimation(element);
                removedTotalCount++;
                removedCount++;
            }
        }
    }
}
//add event listener scroll
window.addEventListener('scroll', removeBlockedComments);
function addBlockButtons() {
    document.querySelectorAll(".favorite-links").forEach((favLink) => {
        // Sadece li içerisindeki favorite-links için işlem yap
        if (!favLink.closest("li")) return;

        // Eğer buton zaten eklenmişse tekrar ekleme
        if (favLink.nextElementSibling?.classList.contains("trolblock-button"))
            return;

        const blockButton = document.createElement("a");
        blockButton.className = "trolblock-button";
        blockButton.style.cssText =
            "cursor:pointer;margin-left:5px;display:inline-flex;align-items:center; margin-top: 1px;";
        blockButton.innerHTML = `
                    <img src="${browser.runtime.getURL(
            "icons/icon16.png"
        )}" style="width:16px;height:16px;margin-right:3px;">
                    <span style="color:#666;font-size:12px;" title="Zırrrva">Derdini S...</span>
            `;

        blockButton.addEventListener("click", (e) => {
            e.preventDefault();
            const entry = favLink.closest("li[data-author]");
            if (entry) {
                const author = entry.getAttribute("data-author");
                if (author) {
                    browser.runtime.sendMessage(
                        { action: "getBlockedAuthors" },
                        (response) => {
                            const currentList = response.blockedAuthors || [];
                            if (!currentList.includes(author)) {
                                const newList = [...currentList, author];
                                browser.runtime.sendMessage(
                                    {
                                        action: "updateBlockedAuthors",
                                        blockedAuthors: newList,
                                    },
                                    () => {
                                        blockedAuthors = newList;
                                        //trigger new mutation observer
                                        document.body.appendChild(document.createElement("div"));
                                    }
                                );
                            }
                        }
                    );
                }
            }
        });

        favLink.insertAdjacentElement("afterend", blockButton);
    });
}

// Sayfa yüklendiğinde ve DOM değişikliklerinde butonları ekle
const observeContent = new MutationObserver(() => {
    clearTimeout(throttleTimer);
    throttleTimer = setTimeout(() => {
        addBlockButtons();
        removeBlockedComments();
    }, 250);
});

// İlk yükleme
loadSettings().then(() => {
    browser.runtime.sendMessage({ action: "getBlockedAuthors" }).then((response) => {
        if (response?.blockedAuthors) {
            blockedAuthors = response.blockedAuthors;
            addBlockButtons();
            removeBlockedComments();

            observeContent.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }
    });
});

// Engellenen yazarları yükle ve hemen başlat
browser.runtime.sendMessage({ action: "getBlockedAuthors" }).then((response) => {
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
browser.runtime.onMessage.addListener((message) => {
    if (message.action === "updateBlockedAuthors") {
        blockedAuthors = message.blockedAuthors || [];
        removeBlockedComments();
    }
    if (message.action === "refreshBlockList") {
        browser.runtime.sendMessage({ action: "getBlockedAuthors" }).then((response) => {
            if (response?.blockedAuthors) {
                blockedAuthors = response.blockedAuthors;
                removeBlockedComments();
            }
        });
    }
    if (message.action === "updateSettings") {
        Object.assign(settings, message.settings);
    }
    return true;
});
