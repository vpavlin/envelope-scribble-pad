
// Background script for the Lope companion extension

let lopeAppUrl = 'https://5231fd71-747f-4ed5-afba-6b29c5975acc.lovableproject.com';

// Load settings when extension starts
chrome.runtime.onStartup.addListener(loadSettings);
chrome.runtime.onInstalled.addListener(() => {
  loadSettings();
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'saveToLope',
    title: 'Save to Lope',
    contexts: ['page', 'selection', 'link']
  });

  chrome.contextMenus.create({
    id: 'saveSelectionToLope',
    title: 'Save selection to Lope',
    contexts: ['selection']
  });
});

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['lopeInstanceUrl']);
    lopeAppUrl = result.lopeInstanceUrl || 'https://5231fd71-747f-4ed5-afba-6b29c5975acc.lovableproject.com';
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.lopeInstanceUrl) {
    lopeAppUrl = changes.lopeInstanceUrl.newValue;
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Reload settings to ensure we have the latest URL
  await loadSettings();
  
  try {
    let title = tab.title || 'Saved from web';
    let content = '';

    if (info.menuItemId === 'saveSelectionToLope' && info.selectionText) {
      content = info.selectionText;
      title = `Selected text from ${new URL(tab.url).hostname}`;
    } else if (info.linkUrl) {
      content = info.linkUrl;
      title = `Link from ${new URL(tab.url).hostname}`;
    } else {
      content = `Source: ${tab.url}`;
    }

    // Create share target URL using the actual tab URL
    const params = new URLSearchParams({
      title: title,
      text: content,
      url: tab.url
    });

    const shareUrl = `${lopeAppUrl}?${params.toString()}`;
    
    // Open Lope with the shared content
    await chrome.tabs.create({ url: shareUrl });
    
  } catch (error) {
    console.error('Error in context menu handler:', error);
  }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveToLope') {
    // Reload settings to ensure we have the latest URL
    loadSettings().then(() => {
      const params = new URLSearchParams({
        title: request.title || 'Saved from web',
        text: request.content || '',
        url: request.url || ''
      });

      const shareUrl = `${lopeAppUrl}?${params.toString()}`;
      
      chrome.tabs.create({ url: shareUrl }).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        console.error('Error opening Lope:', error);
        sendResponse({ success: false, error: error.message });
      });
    });
    
    return true; // Keep message channel open for async response
  }
});
