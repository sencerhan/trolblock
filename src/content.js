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
  console.log('[Trollblock] Initializing extension');

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
      console.error('[Trollblock] Initialization error:', error);
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

    console.log('[Trollblock] Settings and blocked authors loaded:', blockedAuthors.length);
    return true;
  } catch (error) {
    console.error('[Trollblock] Error loading stored data:', error);
    return false;
  }
}

// Sayfa tipine göre özellikler
function setupPageSpecificFeatures() {
  if (isTwitter()) {
    console.log('[Trollblock] Setting up Twitter features');
    setupTwitterFeatures();
  } else {
    console.log('[Trollblock] Setting up Eksisozluk features');
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
  notification.className = "trollblock-notification";

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
  console.log('[Trollblock] removeWithAnimation called, showAnimations setting:', settings.showAnimations);
  loadStoredData();
  if (!settings.showAnimations) {
    console.log('[Trollblock] Animations disabled, removing element immediately');
    element.style.display = 'none';
    showNotification(1);
    return;
  }

  try {
    const gifUrl = browser.runtime.getURL("gif/boom.gif");
    console.log('[Trollblock] Animation GIF URL:', gifUrl);

    const overlay = document.createElement("div");
    overlay.className = "trollblock-animation-overlay";
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

    gif.onload = () => console.log('[Trollblock] GIF loaded successfully');
    gif.onerror = (e) => {
      console.error('[Trollblock] GIF failed to load:', e);
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
    //element.style.position = "relative";

    console.log('[Trollblock] Adding animation overlay to element');
    element.appendChild(overlay);

    setTimeout(() => {
      console.log('[Trollblock] Animation completed, removing element');
      element.style.display = 'none';
      showNotification(1);
    }, 1500);
  } catch (error) {
    console.error('[Trollblock] Error in animation:', error);
    element.style.display = 'none';
    showNotification(1);
  }
}

function removeTwitterWithAnimation(article, username) {
  console.log(`[Trollblock] Removing Twitter content from user: ${username}`);
  loadStoredData();
  if (!settings.showAnimations) {
    article.style.display = 'none';
    showNotification(1);
    return;
  }

  try {
    const gifUrl = browser.runtime.getURL("gif/boom.gif");
    const overlay = document.createElement("div");
    overlay.className = "trollblock-twitter-animation";
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
    const existingOverlay = article.querySelector('.trollblock-twitter-animation');
    if (!existingOverlay) {
      article.appendChild(overlay);
    }

    setTimeout(() => {
      article.style.display = 'none';
      //article.remove();
      showNotification(1);
    }, 1600);
  } catch (error) {
    console.error('[Trollblock] Error in Twitter animation:', error);
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

    if (favLink.nextElementSibling?.classList.contains("trollblock-button") ||
      parentLi.getAttribute('data-trollblock-processed') === 'true') {
      return;
    }

    parentLi.setAttribute('data-trollblock-processed', 'true');

    const blockButton = document.createElement("a");
    blockButton.className = "trollblock-button";
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
      if (isVisible && !element.getAttribute('data-trollblock-removing')) {
        element.setAttribute('data-trollblock-removing', 'true');
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
// 

function addTwitterBlockButtons() {
  if (!isTwitter()) return;

  const articles = findTwitterArticles();

  articles.forEach((article) => {
    if (article.querySelector('.trollblock-twitter-button') ||
      article.getAttribute('data-trollblock-processed') === 'true') {
      return;
    }

    const username = findTwitterUsername(article);
    if (!username) {
      article.setAttribute('data-trollblock-processed', 'true');
      return;
    }

    article.setAttribute('data-trollblock-processed', 'true');

    const blockButton = document.createElement("div");
    blockButton.className = "trollblock-twitter-button";
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
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    `;

    const img = document.createElement("img");
    img.src = browser.runtime.getURL("icons/icon48.png");
    img.title = "Zırrrva!";
    img.style.cssText = `
      width: 24px;
      height: 24px;
      transition: transform 0.3s ease-in-out;
    `;
    blockButton.appendChild(img);

    blockButton.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log('[Trollblock] Block button clicked');

      let username = findTwitterUsername(article);

      if (username) {
        console.log('[Trollblock] Found username:', username);

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
        console.log('[Trollblock] No username found in this tweet!');
        console.log('[Trollblock] Tweet container HTML:', article.outerHTML);
      }
    });
    article.addEventListener('mouseenter', () => {
      blockButton.style.opacity = '1';
    });
    
    article.addEventListener('mouseleave', () => {
      blockButton.style.opacity = '0';
      img.style.transform = 'scale(1)'; // Reset scale when leaving article
    });

    // Add hover effect to button itself
    blockButton.addEventListener('mouseenter', () => {
      img.style.transform = 'scale(3)';
    });
    
    blockButton.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
    });

    article.style.position = "relative";
    article.appendChild(blockButton);
    console.log(`[Trollblock] Button added to tweet container`);
  });
}
const articles = document.querySelectorAll('article');
setInterval(() => {
  addTwitterBlockButtons();
}, 5000);
function findTwitterArticles() {
  const mainArticles = document.querySelectorAll('article');
  const tweetContainers = document.querySelectorAll('div[data-testid="tweet"], div[data-testid="tweetDetail"], div[data-testid="cellInnerDiv"]');
  
  let articles = [];

  // Add main article elements
  mainArticles.forEach(article => {
    if (!article.closest('article') || article.closest('article') === article) {
      // Only add if this is the topmost article
      articles.push(article);
    }
  });

  // Add tweet containers that are inside articles
  tweetContainers.forEach(container => {
    const parentArticle = container.closest('article');
    if (parentArticle && !articles.includes(parentArticle)) {
      articles.push(parentArticle);
    }
  });

  articles = [...new Set(articles)].filter(article => {
    // Additional validation to ensure element is a valid tweet container
    return article && 
           article.textContent && 
           article.textContent.includes('@') &&
           !article.closest('[aria-label="Timeline: Trending now"]') && // Exclude trending section
           !article.closest('[aria-label="Who to follow"]'); // Exclude suggestions
  });

  console.log(`[Trollblock] Found ${articles.length} valid tweet containers`);
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
        console.log(`[Trollblock] Found username: @${username}`);
        return username;
      }
    }
  }

  if (!username && container.textContent.includes('@')) {
    const matches = container.textContent.match(/@(\w+)/);
    if (matches && matches[1]) {
      username = matches[1];
      console.log(`[Trollblock] Found username via text content: @${username}`);
      return username;
    }
  }

  return null;
}

function removeTwitterBlocked() {
  if (!isTwitter()) return;

  console.log('[Trollblock] Checking for blocked Twitter content...');
  const articles = findTwitterArticles();
  console.log('[Trollblock] Scanning for blocked users in', articles.length, 'containers');

  let blockedCount = 0;

  articles.forEach((article) => {
    const username = findTwitterUsername(article);

    if (username && blockedAuthors.includes(username)) {
      // Check if element is partially visible in viewport
      const rect = article.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const isPartiallyVisible = 
        // Element's top edge is in view OR bottom edge is in view
        (rect.top >= 0 && rect.top <= windowHeight) ||
        (rect.bottom >= 0 && rect.bottom <= windowHeight) ||
        // OR element spans the entire viewport
        (rect.top <= 0 && rect.bottom >= windowHeight);

      if (isPartiallyVisible && !article.getAttribute('data-trollblock-removing')) {
        article.setAttribute('data-trollblock-removing', 'true');
        removeTwitterWithAnimation(article, username);
        blockedCount++;
      }
    }
  });

  if (blockedCount > 0) {
    showNotification(blockedCount);
  }

  console.log('[Trollblock] Total blocked tweet containers:', blockedCount);
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
let scrollTimeout = null;
window.addEventListener('scroll', () => {
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  scrollTimeout = setTimeout(() => {
    if (isTwitter()) {
      addTwitterBlockButtons();
      removeTwitterBlocked();
    } else {
      removeBlockedComments();
    }
  }, 250); // Throttle scroll events
});

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(removeBlockedContent, 500); 
});
