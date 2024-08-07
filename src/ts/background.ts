import { infoLog } from './common';
const tag = 'background';

chrome.commands.onCommand.addListener((command: any) => {
  infoLog(tag, `Command "${command}" triggered`);
  sendDimTabMessage({ dimShortcutPressed: true });
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  const dimTabId = await getDimTabId();
  if (dimTabId && tabId === dimTabId) {
    if (changeInfo.url && !changeInfo.url.includes('inventory')) {
      sendDimTabMessage('not on inventory page');
    } else if (changeInfo.url && changeInfo.url.includes('inventory')) {
      sendDimTabMessage('on inventory page');
    }
  }
});

async function getDimTabId(): Promise<number | undefined | null> {
  const dimTabs = await chrome.tabs.query({ url: 'https://*.destinyitemmanager.com/*' });
  return dimTabs && dimTabs.length >= 1 ? dimTabs[0]?.id : null;
}
async function sendDimTabMessage(message: any) {
  const dimTabId = await getDimTabId();
  if (dimTabId) {
    infoLog(tag, 'sending', message);

    chrome.tabs.sendMessage(dimTabId, message, (response: any) => {
      infoLog(tag, { response });
    });
  }
}

chrome.runtime.onMessage.addListener((data: any, sender: chrome.runtime.MessageSender) => {
  infoLog(tag, { data });
  if (data === 'showOptions') {
    openOptionsPage();
  }
});

async function openOptionsPage() {
  const [optionsTab] = await chrome.tabs.query({
    url: `chrome-extension://${chrome.runtime.id}\/html\/options.html`,
  });
  infoLog(tag, { optionsTab });
  if (!optionsTab) chrome.tabs.create({ url: '../html/options.html' });
  else {
    chrome.tabs.update(optionsTab.id!, { active: true });
  }
}
if ('action' in chrome) {
  chrome.action.onClicked.addListener(async () => {
    await openOptionsPage();
  });
} else if ('browserAction' in chrome) {
  chrome.browserAction.onClicked.addListener(async () => {
    await openOptionsPage();
  });
}
