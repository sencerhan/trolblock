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
  console.log('[Trolblock] removeWithAnimation called, showAnimations setting:', settings.showAnimations);
  
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

// Twitter blocklama için animasyonlu silme
function removeTwitterWithAnimation(article, username) {
  console.log(`[Trolblock] Removing Twitter content from user: ${username}`);
  
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

    // Eğer buton zaten eklenmişse veya işaretlenmişse tekrar ekleme
    if (favLink.nextElementSibling?.classList.contains("trolblock-button") || 
        parentLi.getAttribute('data-trolblock-processed') === 'true') {
      return;
    }

    // İşlendiğini işaretle
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

// Sayfa yüklendiğinde ve DOM değişikliklerinde butonları ekle
const observeContent = new MutationObserver(() => {
  clearTimeout(throttleTimer);
  throttleTimer = setTimeout(() => {
    addBlockButtons();
    removeBlockedComments();
  }, 250);
});

// Twitter/X.com için özel fonksiyonlar
function isTwitter() {
  const result = window.location.hostname.includes('x.com') || window.location.hostname.includes('twitter.com');
  console.log('[Trolblock] Twitter check:', result, 'URL:', window.location.hostname);
  return result;
}

function findTwitterArticles() {
  // Try multiple selectors to find tweet containers
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
  
  // Remove duplicates
  articles = [...new Set(articles)];
  console.log(`[Trolblock] Total unique tweet containers found: ${articles.length}`);
  
  return articles;
}

function addTwitterBlockButtons() {
  if (!isTwitter()) return;
  
  console.log('[Trolblock] Searching for Twitter tweet containers...');
  const articles = findTwitterArticles();
  
  // Twitter'da tweet container elementlerini bul
  articles.forEach((article, index) => {
    // Daha kapsamlı bir kontrol ile butonun zaten eklenmiş olup olmadığını kontrol et
    if (article.querySelector('.trolblock-twitter-button') || article.getAttribute('data-trolblock-processed') === 'true') {
      return;
    }

    // Önce kullanıcı adı var mı kontrol et
    const username = findTwitterUsername(article);
    if (!username) {
      // Eğer kullanıcı adı yoksa işaretle ama buton ekleme
      article.setAttribute('data-trolblock-processed', 'true');
      console.log(`[Trolblock] No username found in article #${index}, skipping button`);
      return;
    }

    // İşlendiğini işaretle
    article.setAttribute('data-trolblock-processed', 'true');
    
    console.log(`[Trolblock] Adding button to tweet container #${index} for user @${username}`);
    
    // Buton oluştur
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

    // İkonu oluştur
    const img = document.createElement("img");
    img.src = browser.runtime.getURL("icons/icon48.png");
    img.style.cssText = "width:24px;height:24px;";
    blockButton.appendChild(img);

    // Tıklama olayında @ içeren span'ı bul ve engelle
    blockButton.addEventListener("click", (e) => {
      e.stopPropagation();
      console.log('[Trolblock] Block button clicked');
      
      // @ işareti içeren farklı elementleri dene
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
                
                // Options sayfasına güncelleme mesajı gönder
                browser.runtime.sendMessage({
                  action: "refreshOptionsPage",
                  blockedAuthors: newList
                });
                
                // Kullanıcıya bildirim göster
                showNotification(1);
                
                // Tweeti gizleme işlemi
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
        // HTML içeriğini loglayalım
        console.log('[Trolblock] Tweet container HTML:', article.outerHTML);
      }
    });

    // Butonu article'a ekle
    article.style.position = "relative";
    article.appendChild(blockButton);
    console.log(`[Trolblock] Button added to tweet container #${index}`);
  });
}

function findTwitterUsername(container) {
  // Bu fonksiyon sadece gerektiğinde çağrılacak ve loglanacak
  
  // Try various selectors to find username - daha az log, daha hedefli arama
  const usernameSelectors = [
    'div[data-testid="User-Name"] span', // Kullanıcı profil adı
    'a[role="link"] span', // Bağlantı içindeki textler
    'span[data-testid="tweetText"] a', // Tweet içindeki mention
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
  
  // Son çare olarak container içindeki tüm metni kontrol et
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
  
  articles.forEach((article, index) => {
    const username = findTwitterUsername(article);
    
    if (username && blockedAuthors.includes(username)) {
      console.log(`[Trolblock] Blocked user found in container #${index}: ${username}`);
      // Animasyonlu silme fonksiyonunu kullan
      removeTwitterWithAnimation(article, username);
      blockedCount++;
    }
  });
  
  console.log('[Trolblock] Total blocked tweet containers:', blockedCount);
}

// Twitter için mutation observer ve interval checker
function setupTwitterObserver() {
  if (!isTwitter()) return;
  
  console.log('[Trolblock] Setting up Twitter observer');
  
  // Daha az loglama ve daha hedefli DOM değişikliği takibi
  const twitterObserver = new MutationObserver((mutations) => {
    clearTimeout(throttleTimer);
    
    // Sadece önemli DOM değişikliklerini işle - @ işareti içeren değişikliklere odaklan
    let containsUsernames = false;
    let newArticleAdded = false;
    
    // Sadece eklenen nodeları kontrol et
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element Node
            // Yeni article eklenmiş mi?
            if (node.tagName === 'ARTICLE' || node.querySelector('article') || 
                node.getAttribute('data-testid') === 'tweet' || 
                node.getAttribute('data-testid') === 'cellInnerDiv') {
              newArticleAdded = true;
            }
            
            // İçeriğinde @ işareti var mı?
            if (node.textContent && node.textContent.includes('@')) {
              containsUsernames = true;
            }
          }
        });
      }
    });
    
    // Article eklendiğinde veya @ işareti değiştiğinde güncelle
    if (newArticleAdded || containsUsernames) {
      throttleTimer = setTimeout(() => {
        addTwitterBlockButtons();
        removeTwitterBlocked();
      }, 250);
    }
  });
  
  twitterObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('[Trolblock] Twitter observer is now active');
  
  // Interval'i daha az sıklıkta çalıştır
  const twitterInterval = setInterval(() => {
    addTwitterBlockButtons();
    removeTwitterBlocked();
  }, 3000); // 10 saniyede bir kontrol et
  
  // 2 dakika sonra interval'i temizle
  setTimeout(() => clearInterval(twitterInterval), 2 * 60 * 1000);
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Trolblock] DOMContentLoaded event fired');
  
  if (isTwitter()) {
    console.log('[Trolblock] Twitter detected, initializing...');
    // Log DOM structure for debugging
    console.log('[Trolblock] Current page structure:', document.body.innerHTML.substring(0, 500) + '...');
    
    // Twitter için gözlemciyi başlat
    setupTwitterObserver();
    
    // İlk yükleme için butonları ekle, daha uzun bekle
    console.log('[Trolblock] Setting up initial delay for Twitter...');
    setTimeout(() => {
      console.log('[Trolblock] Initial Twitter processing...');
      addTwitterBlockButtons();
      removeTwitterBlocked();
    }, 3000); // Twitter'ın yavaş yüklenmesi için daha uzun bekle
  }
});

// İlk yükleme
loadSettings();
console.log('[Trolblock] Initial loading, fetching blocked authors...');
browser.runtime
  .sendMessage({ action: "getBlockedAuthors" })
  .then((response) => {
    if (response?.blockedAuthors) {
      blockedAuthors = response.blockedAuthors;
      console.log('[Trolblock] Blocked authors loaded:', blockedAuthors);
      
      if (isTwitter()) {
        console.log('[Trolblock] Initializing Twitter features...');
        addTwitterBlockButtons();
        removeTwitterBlocked();
        setupTwitterObserver();
      } else {
        console.log('[Trolblock] Initializing standard features...');
        addBlockButtons();
        removeBlockedComments();
        
        observeContent.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    }
  })
  .catch((error) => {
    console.error("[Trolblock] Error fetching blocked authors:", error);
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
