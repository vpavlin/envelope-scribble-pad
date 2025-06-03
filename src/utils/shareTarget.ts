
export interface SharedContent {
  title?: string;
  text?: string;
  url?: string;
}

export const extractSharedContent = (): SharedContent | null => {
  const urlParams = new URLSearchParams(window.location.search);
  
  const title = urlParams.get('title');
  const text = urlParams.get('text');
  const url = urlParams.get('url');
  
  // Check if any share parameters exist
  if (title || text || url) {
    return { title, text, url };
  }
  
  return null;
};

export const formatSharedContentAsNote = (shared: SharedContent): { title: string; content: string } => {
  let title = shared.title || 'Shared Content';
  let content = '';
  
  if (shared.text) {
    content += shared.text;
  }
  
  if (shared.url) {
    if (content) content += '\n\n';
    content += `Source: ${shared.url}`;
  }
  
  return { title, content };
};

export const clearShareParams = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('title');
  url.searchParams.delete('text');
  url.searchParams.delete('url');
  window.history.replaceState({}, document.title, url.pathname);
};
