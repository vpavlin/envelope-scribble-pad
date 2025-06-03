
// Popup script for the Lope companion extension
class LopePopup {
  constructor() {
    this.lopeAppUrl = 'https://5231fd71-747f-4ed5-afba-6b29c5975acc.lovableproject.com';
    this.init();
  }

  async init() {
    await this.loadCurrentPage();
    this.setupEventListeners();
    this.loadEnvelopes();
  }

  async loadCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      document.getElementById('currentUrl').textContent = tab.url;
      document.getElementById('title').value = tab.title || '';
    } catch (error) {
      console.error('Error loading current page:', error);
    }
  }

  setupEventListeners() {
    document.getElementById('noteForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNote();
    });

    document.getElementById('captureSelection').addEventListener('click', () => {
      this.captureSelection();
    });

    document.getElementById('capturePage').addEventListener('click', () => {
      this.capturePageInfo();
    });
  }

  async captureSelection() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const selection = window.getSelection().toString();
          return selection.trim();
        }
      });

      const selectedText = results[0]?.result;
      if (selectedText) {
        const contentTextarea = document.getElementById('content');
        const currentContent = contentTextarea.value;
        const newContent = currentContent ? `${currentContent}\n\n${selectedText}` : selectedText;
        contentTextarea.value = newContent;
        this.showStatus('Selection captured!', 'success');
      } else {
        this.showStatus('No text selected on the page', 'error');
      }
    } catch (error) {
      console.error('Error capturing selection:', error);
      this.showStatus('Error capturing selection', 'error');
    }
  }

  async capturePageInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const title = document.title;
          const url = window.location.href;
          const description = document.querySelector('meta[name="description"]')?.content || '';
          
          return { title, url, description };
        }
      });

      const pageInfo = results[0]?.result;
      if (pageInfo) {
        document.getElementById('title').value = pageInfo.title;
        
        let content = `Source: ${pageInfo.url}`;
        if (pageInfo.description) {
          content += `\n\nDescription: ${pageInfo.description}`;
        }
        
        const contentTextarea = document.getElementById('content');
        const currentContent = contentTextarea.value;
        contentTextarea.value = currentContent ? `${currentContent}\n\n${content}` : content;
        
        this.showStatus('Page info captured!', 'success');
      }
    } catch (error) {
      console.error('Error capturing page info:', error);
      this.showStatus('Error capturing page info', 'error');
    }
  }

  async saveNote() {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const envelope = document.getElementById('envelope').value;

    if (!title) {
      this.showStatus('Please enter a title', 'error');
      return;
    }

    try {
      // Create the URL with share target parameters
      const params = new URLSearchParams({
        title: title,
        text: content,
        url: window.location.href
      });

      const lopeUrl = `${this.lopeAppUrl}?${params.toString()}`;

      // Open Lope in a new tab with the shared content
      await chrome.tabs.create({ url: lopeUrl });
      
      this.showStatus('Note sent to Lope!', 'success');
      
      // Clear the form
      document.getElementById('noteForm').reset();
      
      // Close the popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1000);

    } catch (error) {
      console.error('Error saving note:', error);
      this.showStatus('Error saving note', 'error');
    }
  }

  async loadEnvelopes() {
    // For now, just show default option
    // In a more advanced version, you could sync with the main app
    const select = document.getElementById('envelope');
    select.innerHTML = '<option value="">Default envelope</option>';
  }

  showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
    
    // Clear status after 3 seconds
    setTimeout(() => {
      statusDiv.innerHTML = '';
    }, 3000);
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LopePopup();
});
