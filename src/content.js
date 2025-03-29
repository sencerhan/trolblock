// Polyfill: browser API'si yoksa chrome API'sini kullan
if (typeof browser === "undefined") {
  var browser = {
    ...chrome,
    runtime: {
      ...chrome.runtime,
      sendMessage: (message) => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
      },
    },
  };
}

let blockedAuthors = [];
let throttleTimer;
let activeNotification = null;
let removedTotalCount = 0;
let notificationTimeout = null;

let settings = {
  showNotifications: true,
  showAnimations: true,
};

// Ayarları yükle
function loadSettings() {
  browser.storage.local.get(
    ["showNotifications", "showAnimations"],
    (result) => {
      if (browser.runtime.lastError) {
        console.error("Storage error:", browser.runtime.lastError);
        return;
      }
      settings.showNotifications = result.showNotifications !== false;
      settings.showAnimations = result.showAnimations !== false;
    }
  );
}

function showNotification(count) {
  if (!settings.showNotifications) return;

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

  const img = document.createElement("img");
  img.src = browser.runtime.getURL("icons/icon128.png");
  img.style.cssText = "width:48px;height:48px;margin-right:16px;";

  const text = document.createElement("span");
  text.style.cssText = "font-size:16px;";
  text.textContent = `${count} zırva temizlendi`;

  notification.appendChild(img);
  notification.appendChild(text);

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

function removeWithAnimation(element) {
  if (!settings.showAnimations) {
    element.remove();
    showNotification(1);
    return;
  }

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

  const gif = document.createElement("img");
  gif.src = browser.runtime.getURL("gif/boom.gif");
  gif.style.cssText = `
        width: 100%;
        height: auto;
        object-fit: contain;
    `;
  overlay.appendChild(gif);

  element.style.position = "relative";
  element.appendChild(overlay);

  setTimeout(() => {
    element.remove();
    showNotification(1);
  }, 1500);
}

function removeBlockedComments() {
  loadSettings();
  const commentElements = document.querySelectorAll("li[data-author]");
  commentElements.forEach((element) => {
    if (blockedAuthors.includes(element.getAttribute("data-author"))) {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (isVisible) {
        removeWithAnimation(element);
        removedTotalCount++;
      }
    }
  });
}

//add event listener scroll
window.addEventListener("scroll", removeBlockedComments);
function addBlockButtons() {
  document.querySelectorAll(".favorite-links").forEach((favLink) => {
    // Sadece li içerisindeki favorite-links için işlem yap
    const parentLi = favLink.closest("li[data-author]");
    if (!parentLi) return;

    // Eğer buton zaten eklenmişse tekrar ekleme
    if (favLink.nextElementSibling?.classList.contains("trolblock-button"))
      return;

    const blockButton = document.createElement("a");
    blockButton.className = "trolblock-button";
    blockButton.style.cssText =
      "cursor:pointer;margin-left:5px;display:inline-flex;align-items:center; margin-top: 1px;";

    const img = document.createElement("img");
    img.src = browser.runtime.getURL("icons/icon16.png");
    img.style.cssText = "width:16px;height:16px;margin-right:3px;";

    const span = document.createElement("span");
    span.style.cssText = "color:#666;font-size:12px;";
    span.title = "Zırrrva";
    span.textContent = "Derdini S...";

    blockButton.appendChild(img);
    blockButton.appendChild(span);

    blockButton.addEventListener("click", (e) => {
      e.preventDefault();
      const author = parentLi.getAttribute("data-author");
      if (author) {
        browser.runtime
          .sendMessage({ action: "getBlockedAuthors" })
          .then((response) => {
            const currentList = response.blockedAuthors || [];
            if (!currentList.includes(author)) {
              const newList = [...currentList, author];
              browser.runtime
                .sendMessage({
                  action: "updateBlockedAuthors",
                  blockedAuthors: newList,
                })
                .then(() => {
                  blockedAuthors = newList;
                  removeBlockedComments(); // Engellenen yorumları hemen kaldır
                })
                .catch((error) => {
                  console.error("Error updating blocked authors:", error);
                });
            }
          })
          .catch((error) => {
            console.error("Error fetching blocked authors:", error);
          });
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
loadSettings();
browser.runtime
  .sendMessage({ action: "getBlockedAuthors" })
  .then((response) => {
    if (response?.blockedAuthors) {
      blockedAuthors = response.blockedAuthors;
      addBlockButtons();
      removeBlockedComments();

      observeContent.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  })
  .catch((error) => {
    console.error("Error fetching blocked authors:", error);
  });

// Engellenen yazarları yükle ve hemen başlat
browser.runtime
  .sendMessage({ action: "getBlockedAuthors" })
  .then((response) => {
    if (response?.blockedAuthors) {
      blockedAuthors = response.blockedAuthors;
      removeBlockedComments();

      // Sadece gerekli container'ı izle
      new MutationObserver(() => {
        clearTimeout(throttleTimer);
        throttleTimer = setTimeout(removeBlockedComments, 250);
      }).observe(document.body, { childList: true, subtree: true });
    }
  })
  .catch((error) => {
    console.error("Error fetching blocked authors:", error);
  });

// Mesaj dinleyicileri
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "updateBlockedAuthors") {
    blockedAuthors = message.blockedAuthors || [];
    removeBlockedComments();
  }
  if (message.action === "refreshBlockList") {
    browser.runtime
      .sendMessage({ action: "getBlockedAuthors" })
      .then((response) => {
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
