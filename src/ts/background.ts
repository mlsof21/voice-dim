import { infoLog } from './common';

chrome.commands.onCommand.addListener((command: any) => {
  infoLog('voice dim', `Command "${command}" triggered`);

  chrome.tabs.query({}, (tabs: any[]) => {
    const dimTabs = tabs.filter((tab: { url: string }) => tab.url?.match(/destinyitemmanager\.com.*inventory/));

    if (dimTabs && dimTabs[0]?.id)
      chrome.tabs.sendMessage(dimTabs[0].id, { dimShortcutPressed: true }, (response: any) => {
        infoLog('voice dim', { response });
      });
  });
});

chrome.runtime.onMessage.addListener((data: any) => {
  infoLog('voice dim', { data });
  if (data === 'showOptions') {
    openOptionsPage();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  openOptionsPage();
});

async function openOptionsPage() {
  const [optionsTab] = await chrome.tabs.query({
    url: `chrome-extension://${chrome.runtime.id}\/html\/options.html`,
  });
  infoLog('voice dim', { optionsTab });
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
