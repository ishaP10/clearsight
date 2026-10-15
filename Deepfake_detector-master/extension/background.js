chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'deepfake-analyze-image',
      title: 'Analyze image for deepfake (ClearSight)',
      contexts: ['image'],
    });
    chrome.contextMenus.create({
      id: 'restore-image-ai',
      title: 'Restore & enhance image with AI (ClearSight)',
      contexts: ['image'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (!info.srcUrl) return;

  if (info.menuItemId === 'deepfake-analyze-image') {
    const pageUrl = chrome.runtime.getURL(
      `analyze.html?src=${encodeURIComponent(info.srcUrl)}&action=analyze`,
    );
    chrome.tabs.create({ url: pageUrl });
  } else if (info.menuItemId === 'restore-image-ai') {
    const pageUrl = chrome.runtime.getURL(
      `analyze.html?src=${encodeURIComponent(info.srcUrl)}&action=restore`,
    );
    chrome.tabs.create({ url: pageUrl });
  }
});
