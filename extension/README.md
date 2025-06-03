
# Lope Companion Browser Extension

A companion browser extension for the Lope note-taking app that allows you to easily capture web content and send it to your Lope app.

## Features

- **Quick Save**: Press Ctrl+Shift+L (Cmd+Shift+L on Mac) to quickly save the current page or selected text
- **Text Selection**: Select text on any webpage and click the floating "Save to Lope" button
- **Context Menu**: Right-click on pages, selections, or links to save them to Lope
- **Popup Interface**: Click the extension icon for a full capture interface
- **Page Info Capture**: Automatically capture page titles, URLs, and descriptions

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension` folder
4. The Lope Companion extension should now appear in your browser

## Usage

### Quick Methods
- **Keyboard Shortcut**: Press `Ctrl+Shift+L` (or `Cmd+Shift+L` on Mac) to quickly save
- **Text Selection**: Select text and click the floating button that appears
- **Right-click Menu**: Right-click anywhere to access Lope save options

### Full Interface
- Click the Lope extension icon in your browser toolbar
- Fill in the title and content
- Choose an envelope (optional)
- Click "Save to Lope" to send the note to your main app

### Capture Options
- **Capture Selection**: Saves currently selected text
- **Capture Page Info**: Saves page title, URL, and description

## How It Works

The extension uses the share target functionality built into your Lope PWA. When you save content, it opens your Lope app in a new tab with the content pre-filled, just like sharing from a mobile app.

## Permissions

- `activeTab`: To access the current webpage content
- `storage`: To store extension settings
- `contextMenus`: To add right-click menu options
- `host_permissions`: To communicate with your Lope app

## Development

To modify the extension:

1. Make changes to the files in the `extension` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Lope Companion extension
4. Test your changes

The extension connects to your Lope app at: `https://5231fd71-747f-4ed5-afba-6b29c5975acc.lovableproject.com`
