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

// Temel değişkenler
let blockedAuthors = [];
let throttleTimer;
let activeNotification = null;
let notificationTimeout = null;
let pageObserver = null;

let settings = {
  showNotifications: true,
  showAnimations: true,
};

// ===== UYGULAMA BAŞLATMA =====

// Ana başlatma fonksiyonu
function initializeExtension() {
  console.log('[Trolblock] Initializing extension');

  // Ayarları ve engellenen yazarları yükle
  loadStoredData()
    .then(() => {
      // Sayfa tipine göre uygun işlevleri başlat
      setupPageSpecificFeatures();

      // Mesaj dinleyicisini ayarla
      setupMessageListener();

      // Sayfa kapanırken temizlik yap
      window.addEventListener('beforeunload', cleanup);
    })
    .catch(error => {
      console.error('[Trolblock] Initialization error:', error);
    });
}

// Storage'dan verileri yükle
async function loadStoredData() {
  try {
    // Ayarları yükle
    const settingsResult = await new Promise(resolve => {
      browser.storage.local.get(['showNotifications', 'showAnimations'], resolve);
    });

    settings.showNotifications = settingsResult.showNotifications !== false;
    settings.showAnimations = settingsResult.showAnimations !== false;

    // Engellenen yazarları yükle
    const response = await browser.runtime.sendMessage({ action: "getBlockedAuthors" });
    blockedAuthors = response?.blockedAuthors || [];

    console.log('[Trolblock] Settings and blocked authors loaded:', blockedAuthors.length);
    return true;
  } catch (error) {
    console.error('[Trolblock] Error loading stored data:', error);
    return false;
  }
}

// Sayfa tipine göre özellikler
function setupPageSpecificFeatures() {
  if (isTwitter()) {
    console.log('[Trolblock] Setting up Twitter features');
    setupTwitterFeatures();
  } else {
    console.log('[Trolblock] Setting up Eksisozluk features');
    setupEksiFeatures();
  }

  // Sayfada engellenen içerikleri kaldır (hem Twitter hem de Ekşi için)
  setTimeout(removeBlockedContent, 500);
  setTimeout(removeBlockedContent, 1500);
  setTimeout(removeBlockedContent, 3000);
}

// ===== PLATFORM BELİRLEME =====

// Twitter veya Ekşi kontrolü
function isTwitter() {
  return window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com');
}

// ===== BİLDİRİM VE ANİMASYON =====

// Bildirim göster
function showNotification(count) {
  loadStoredData();
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

  notificationTimeout = setTimeout(() => {
    notification.remove();
    activeNotification = null;
  }, 4000);
}

function removeWithAnimation(element) {
  console.log('[Trolblock] removeWithAnimation called, showAnimations setting:', settings.showAnimations);
  loadStoredData();
  if (!settings.showAnimations) {
    console.log('[Trolblock] Animations disabled, removing element immediately');
    element.remove();
    showNotification(1);
    return;
  }

  try {
    const gifUrl = browser.runtime.getURL("gif/boom.gif");
    console.log('[Trolblock] Animation GIF URL:', gifUrl);

    const overlay = document.createElement("div");
    overlay.className = "trolblock-animation-overlay";
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(244, 241, 234, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      pointer-events: none;
    `;

    const gif = document.createElement("img");
    gif.src = gifUrl;
    gif.style.cssText = `
      width: 80%;
      height: auto;
      object-fit: contain;
      max-width: 300px;
    `;

    gif.onload = () => console.log('[Trolblock] GIF loaded successfully');
    gif.onerror = (e) => {
      console.error('[Trolblock] GIF failed to load:', e);
      // GIF yüklenemezse yazı göster
      const fallbackText = document.createElement("div");
      fallbackText.textContent = "💥 BOOM! 💥";
      fallbackText.style.cssText = `
        font-size: 24px;
        color: red;
        font-weight: bold;
        text-align: center;
      `;
      overlay.appendChild(fallbackText);
    };

    overlay.appendChild(gif);

    // Ensure element has position for absolute positioning to work
    const originalPosition = element.style.position;
    element.style.position = "relative";

    console.log('[Trolblock] Adding animation overlay to element');
    element.appendChild(overlay);

    setTimeout(() => {
      console.log('[Trolblock] Animation completed, removing element');
      element.remove();
      showNotification(1);
    }, 1500);
  } catch (error) {
    console.error('[Trolblock] Error in animation:', error);
    element.remove();
    showNotification(1);
  }
}

function removeTwitterWithAnimation(article, username) {
  console.log(`[Trolblock] Removing Twitter content from user: ${username}`);
  loadStoredData();
  if (!settings.showAnimations) {
    article.style.display = 'none';
    showNotification(1);
    return;
  }

  try {
    const gifUrl = browser.runtime.getURL("gif/boom.gif");
    const overlay = document.createElement("div");
    overlay.className = "trolblock-twitter-animation";
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      pointer-events: none;
      border-radius: 16px;
    `;

    const text = document.createElement("div");
    text.textContent = `@${username} engellendi!`;
    text.style.cssText = `
      color: white;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
    `;

    const gif = document.createElement("img");
    gif.src = gifUrl;
    gif.style.cssText = `
      width: 70%;
      height: auto;
      object-fit: contain;
      max-width: 300px;
    `;

    //overlay.appendChild(text);
    overlay.appendChild(gif);

    // Ensure article has position for absolute positioning to work
    const originalPosition = article.style.position;
    //article.style.position = "relative";

    // Check if overlay already exists before appending
    const existingOverlay = article.querySelector('.trolblock-twitter-animation');
    if (!existingOverlay) {
      article.appendChild(overlay);
    }

    setTimeout(() => {
      article.style.display = 'none';
      //article.remove();
      showNotification(1);
    }, 1600);
  } catch (error) {
    console.error('[Trolblock] Error in Twitter animation:', error);
    article.style.display = 'none';

    showNotification(1);
  }
}

// ===== EKŞİSÖZLÜK FONKSİYONLARI =====

// Ekşisözlük özelliklerini ayarla
function setupEksiFeatures() {
  // Ekşi için blok butonlarını ekle
  addBlockButtons();

  // Ekşi için gözlemci ekle
  if (pageObserver) pageObserver.disconnect();

  pageObserver = new MutationObserver(() => {
    clearTimeout(throttleTimer);
    throttleTimer = setTimeout(() => {
      addBlockButtons();
      removeBlockedComments();
    }, 250);
  });

  pageObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Scroll olayını dinle
  window.addEventListener("scroll", removeBlockedComments);
}

// Blok butonları ekle (Ekşi)
function addBlockButtons() {
  document.querySelectorAll(".favorite-links").forEach((favLink) => {
    const parentLi = favLink.closest("li[data-author]");
    if (!parentLi) return;

    if (favLink.nextElementSibling?.classList.contains("trolblock-button") ||
      parentLi.getAttribute('data-trolblock-processed') === 'true') {
      return;
    }

    parentLi.setAttribute('data-trolblock-processed', 'true');

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

                  // Options sayfasına güncelleme mesajı gönder
                  browser.runtime.sendMessage({
                    action: "refreshOptionsPage",
                    blockedAuthors: newList
                  });
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

    const shareElement = parentLi.querySelector('a.entry-share');
    if (shareElement) {
      shareElement.parentNode.insertBefore(blockButton, shareElement);
    } else {
      favLink.insertAdjacentElement("afterend", blockButton);
    }
  });
}

// Ekşi için engellenen yorumları kaldır
function removeBlockedComments() {
  const commentElements = document.querySelectorAll("li[data-author]");
  let removedCount = 0;

  commentElements.forEach((element) => {
    if (blockedAuthors.includes(element.getAttribute("data-author"))) {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (isVisible && !element.getAttribute('data-trolblock-removing')) {
        element.setAttribute('data-trolblock-removing', 'true');
        removeWithAnimation(element);
        removedCount++;
      }
    }
  });

  return removedCount;
}

// ===== TWITTER FONKSİYONLARI =====

// Twitter özelliklerini ayarla
function setupTwitterFeatures() {
  // Twitter için gözlemci ekle
  if (pageObserver) pageObserver.disconnect();

  pageObserver = new MutationObserver((mutations) => {
    clearTimeout(throttleTimer);

    const shouldUpdate = mutations.some(mutation =>
      mutation.type === 'childList' &&
      mutation.addedNodes.length > 0 &&
      Array.from(mutation.addedNodes).some(node =>
        node.nodeType === 1 && (
          node.tagName === 'ARTICLE' ||
          node.querySelector('article') ||
          (node.textContent && node.textContent.includes('@'))
        )
      )
    );

    if (shouldUpdate) {
      throttleTimer = setTimeout(() => {
        addTwitterBlockButtons();
        removeTwitterBlocked();
      }, 250);
    }
  });

  pageObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Twitter için blok butonları ekle
function addTwitterBlockButtons() {
  if (!isTwitter()) return;

  const articles = findTwitterArticles();

  articles.forEach((article) => {
    if (article.querySelector('.trolblock-twitter-button') ||
      article.getAttribute('data-trolblock-processed') === 'true') {
      return;
    }

    const username = findTwitterUsername(article);
    if (!username) {
      article.setAttribute('data-trolblock-processed', 'true');
      return;
    }

    article.setAttribute('data-trolblock-processed', 'true');

    const blockButton = document.createElement("div");
    blockButton.className = "trolblock-twitter-button";
    blockButton.style.cssText = `
      position: absolute;
      top: 58px;
      left: 20px;
      cursor: pointer;
      z-index: 9999;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    const img = document.createElement("img");
    img.src = browser.runtime.getURL("icons/icon48.png");
    img.style.cssText = "width:24px;height:24px;";
    blockButton.appendChild(img);

    blockButton.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log('[Trolblock] Block button clicked');

      let username = findTwitterUsername(article);

      if (username) {
        console.log('[Trolblock] Found username:', username);

        browser.runtime.sendMessage({ action: "getBlockedAuthors" })
          .then((response) => {
            const currentList = response.blockedAuthors || [];
            if (!currentList.includes(username)) {
              const newList = [...currentList, username];
              browser.runtime.sendMessage({
                action: "updateBlockedAuthors",
                blockedAuthors: newList,
              })
                .then(() => {
                  blockedAuthors = newList;

                  browser.runtime.sendMessage({
                    action: "refreshOptionsPage",
                    blockedAuthors: newList
                  });

                  showNotification(1);

                  removeTwitterBlocked();
                })
                .catch((error) => {
                  console.error("Error updating blocked authors:", error);
                });
            }
          })
          .catch((error) => {
            console.error("Error fetching blocked authors:", error);
          });
      } else {
        console.log('[Trolblock] No username found in this tweet!');
        console.log('[Trolblock] Tweet container HTML:', article.outerHTML);
      }
    });

    article.style.position = "relative";
    article.appendChild(blockButton);
    console.log(`[Trolblock] Button added to tweet container`);
  });
}

function findTwitterArticles() {
  const selectors = [
    'article',
    'div[data-testid="tweet"]',
    'div[data-testid="tweetDetail"]',
    'div[data-testid="cellInnerDiv"]'
  ];

  let articles = [];

  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    console.log(`[Trolblock] Selector "${selector}" found ${found.length} elements`);
    if (found.length > 0) {
      articles = articles.concat(Array.from(found));
    }
  }

  articles = [...new Set(articles)];
  console.log(`[Trolblock] Total unique tweet containers found: ${articles.length}`);

  return articles;
}

function findTwitterUsername(container) {
  const usernameSelectors = [
    'div[data-testid="User-Name"] span',
    'a[role="link"] span',
    'span[data-testid="tweetText"] a',
  ];

  let username = null;

  for (const selector of usernameSelectors) {
    const elements = container.querySelectorAll(selector);

    for (const element of elements) {
      const text = element.textContent.trim();

      if (text.includes('@')) {
        username = text.replace('@', '');
        console.log(`[Trolblock] Found username: @${username}`);
        return username;
      }
    }
  }

  if (!username && container.textContent.includes('@')) {
    const matches = container.textContent.match(/@(\w+)/);
    if (matches && matches[1]) {
      username = matches[1];
      console.log(`[Trolblock] Found username via text content: @${username}`);
      return username;
    }
  }

  return null;
}

function removeTwitterBlocked() {
  if (!isTwitter()) return;

  console.log('[Trolblock] Checking for blocked Twitter content...');
  const articles = findTwitterArticles();
  console.log('[Trolblock] Scanning for blocked users in', articles.length, 'containers');

  let blockedCount = 0;

  articles.forEach((article) => {
    const username = findTwitterUsername(article);

    if (username && blockedAuthors.includes(username)) {
      const isVisible = article.top >= 0 && article.bottom <= window.innerHeight;
      if (isVisible) {
        removeWithAnimation(article);
        removedCount++;
      }
      removeTwitterWithAnimation(article, username);
      blockedCount++;
    }
  });

  console.log('[Trolblock] Total blocked tweet containers:', blockedCount);
}

// ===== ORTAK FONKSİYONLAR =====

// Engellenen içeriği kaldır (platform bağımsız)
function removeBlockedContent() {
  if (isTwitter()) {
    removeTwitterBlocked();
  } else {
    removeBlockedComments();
  }
}

// Mesaj dinleyicisi
function setupMessageListener() {
  browser.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case "updateBlockedAuthors":
        blockedAuthors = message.blockedAuthors || [];
        removeBlockedContent();
        break;

      case "updateSettings":
        Object.assign(settings, message.settings);
        break;

      case "refreshBlockList":
        loadStoredData().then(removeBlockedContent);
        break;
    }
    return true;
  });
}

// Temizlik işlemleri
function cleanup() {
  if (pageObserver) {
    pageObserver.disconnect();
    pageObserver = null;
  }

  if (throttleTimer) {
    clearTimeout(throttleTimer);
    throttleTimer = null;
  }

  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
    notificationTimeout = null;
  }
}

// ===== BAŞLATMA =====

// Sayfa tam yüklendiğinde veya zaten yüklendiyse başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

// Sayfa yüklendiğinde ek kontrol
window.addEventListener('scroll', () => {
  if (isTwitter()) {
    addTwitterBlockButtons();
    removeTwitterBlocked();
  } else {
    removeBlockedComments();
  }
});
window.addEventListener('load', () => {
  console.log('[Trolblock] Window load event fired');
  setTimeout(removeBlockedContent, 500);
});
