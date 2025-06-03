
// Content script for the Lope companion extension

class LopeContentScript {
  constructor() {
    this.init();
  }

  init() {
    // Add keyboard shortcut listener
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+L (or Cmd+Shift+L on Mac) to quick save
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        this.quickSave();
      }
    });

    // Add floating save button when text is selected
    document.addEventListener('mouseup', () => {
      setTimeout(() => this.handleTextSelection(), 100);
    });

    // Clean up floating button when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.lope-floating-button')) {
        this.removeFloatingButton();
      }
    });
  }

  handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 10) {
      this.showFloatingButton(selection);
    } else {
      this.removeFloatingButton();
    }
  }

  showFloatingButton(selection) {
    this.removeFloatingButton();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const button = document.createElement('div');
    button.className = 'lope-floating-button';
    button.innerHTML = `
      <div class="lope-floating-content">
        <span class="lope-icon">✉</span>
        <span>Save to Lope</span>
      </div>
    `;

    // Position the button
    button.style.cssText = `
      position: fixed;
      top: ${rect.bottom + window.scrollY + 10}px;
      left: ${rect.left + window.scrollX}px;
      z-index: 10000;
      background: #3b82f6;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      user-select: none;
    `;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.saveSelection(selection.toString());
      this.removeFloatingButton();
    });

    button.addEventListener('mouseenter', () => {
      button.style.background = '#2563eb';
      button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = '#3b82f6';
      button.style.transform = 'translateY(0)';
    });

    document.body.appendChild(button);
  }

  removeFloatingButton() {
    const existingButton = document.querySelector('.lope-floating-button');
    if (existingButton) {
      existingButton.remove();
    }
  }

  async saveSelection(selectedText) {
    const title = `Selected text from ${window.location.hostname}`;
    const content = selectedText;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveToLope',
        title: title,
        content: content,
        url: window.location.href
      });

      if (response && response.success) {
        this.showToast('Saved to Lope!', 'success');
      } else {
        this.showToast('Error saving to Lope', 'error');
      }
    } catch (error) {
      console.error('Error saving selection:', error);
      this.showToast('Error saving to Lope', 'error');
    }
  }

  async quickSave() {
    const title = document.title || 'Quick save from web';
    const selectedText = window.getSelection().toString().trim();
    const content = selectedText || `Source: ${window.location.href}`;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'saveToLope',
        title: title,
        content: content,
        url: window.location.href
      });

      if (response && response.success) {
        this.showToast('Quick saved to Lope!', 'success');
      } else {
        this.showToast('Error saving to Lope', 'error');
      }
    } catch (error) {
      console.error('Error with quick save:', error);
      this.showToast('Error saving to Lope', 'error');
    }
  }

  showToast(message, type) {
    // Remove existing toast
    const existingToast = document.querySelector('.lope-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'lope-toast';
    toast.textContent = message;

    const bgColor = type === 'success' ? '#10b981' : '#ef4444';
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10001;
      background: ${bgColor};
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      transform: translateX(100%);
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the content script
new LopeContentScript();
