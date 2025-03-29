// browser-polyfill.js
// This script provides a compatibility layer for Chrome and Firefox extensions

(function() {
    'use strict';
    
    if (typeof globalThis.browser === 'undefined') {
        // If browser is not defined (Chrome), create it as a proxy to chrome
        globalThis.browser = {};
        
        // Copy all chrome API properties to browser
        for (const key of Object.keys(chrome)) {
            if (chrome[key] && typeof chrome[key] === 'object') {
                globalThis.browser[key] = chrome[key];
            }
        }
        
        // Add promise-based APIs for Chrome's callback-based APIs
        if (chrome.runtime) {
            globalThis.browser.runtime = {
                ...chrome.runtime,
                sendMessage: function(message) {
                    return new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage(message, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(response);
                            }
                        });
                    });
                }
            };
        }
        
        if (chrome.storage) {
            globalThis.browser.storage = {
                ...chrome.storage
            };
            
            if (chrome.storage.sync) {
                globalThis.browser.storage.sync = {
                    ...chrome.storage.sync,
                    get: function(keys) {
                        return new Promise((resolve, reject) => {
                            chrome.storage.sync.get(keys, (result) => {
                                if (chrome.runtime.lastError) {
                                    reject(chrome.runtime.lastError);
                                } else {
                                    resolve(result);
                                }
                            });
                        });
                    },
                    set: function(items) {
                        return new Promise((resolve, reject) => {
                            chrome.storage.sync.set(items, () => {
                                if (chrome.runtime.lastError) {
                                    reject(chrome.runtime.lastError);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    }
                };
            }
        }
        
        if (chrome.tabs) {
            globalThis.browser.tabs = {
                ...chrome.tabs,
                query: function(queryInfo) {
                    return new Promise((resolve, reject) => {
                        chrome.tabs.query(queryInfo, (tabs) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(tabs);
                            }
                        });
                    });
                },
                sendMessage: function(tabId, message) {
                    return new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(tabId, message, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError);
                            } else {
                                resolve(response);
                            }
                        });
                    });
                }
            };
        }
    }
})();