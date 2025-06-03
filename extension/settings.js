
// Settings script for the Lope companion extension
class LopeSettings {
  constructor() {
    this.defaultUrl = 'https://5231fd71-747f-4ed5-afba-6b29c5975acc.lovableproject.com';
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['lopeInstanceUrl']);
      const instanceUrl = result.lopeInstanceUrl || this.defaultUrl;
      document.getElementById('instanceUrl').value = instanceUrl;
    } catch (error) {
      console.error('Error loading settings:', error);
      document.getElementById('instanceUrl').value = this.defaultUrl;
    }
  }

  setupEventListeners() {
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });

    document.getElementById('resetButton').addEventListener('click', () => {
      this.resetSettings();
    });
  }

  async saveSettings() {
    const instanceUrl = document.getElementById('instanceUrl').value.trim();
    
    if (!instanceUrl) {
      this.showStatus('Please enter a valid URL', 'error');
      return;
    }

    // Validate URL format
    try {
      new URL(instanceUrl);
    } catch (error) {
      this.showStatus('Please enter a valid URL format', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ lopeInstanceUrl: instanceUrl });
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  async resetSettings() {
    try {
      await chrome.storage.sync.set({ lopeInstanceUrl: this.defaultUrl });
      document.getElementById('instanceUrl').value = this.defaultUrl;
      this.showStatus('Settings reset to default', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showStatus('Error resetting settings', 'error');
    }
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

// Initialize the settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LopeSettings();
});
