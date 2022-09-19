chrome.commands.onCommand.addListener((command: any) => {
  console.log(`[voice-dim] Command "${command}" triggered`);

  chrome.tabs.query({}, (tabs: any[]) => {
    const dimTabs = tabs.filter((tab: { url: string }) => tab.url?.match(/destinyitemmanager\.com.*inventory/));

    if (dimTabs && dimTabs[0]?.id)
      chrome.tabs.sendMessage(dimTabs[0].id, { dimShortcutPressed: true }, (response: any) => {
        console.log('[voice-dim]', { response });
      });
  });
});

chrome.runtime.onMessage.addListener((data: any) => {
  console.log({ data });
  if (data === 'showOptions') {
    openOptionsPage();
  }
});

async function openOptionsPage() {
  const [optionsTab] = await chrome.tabs.query({
    url: `chrome-extension://${chrome.runtime.id}\/html\/options.html`,
  });
  console.log({ optionsTab });
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
  console.log('in browserAction');
  chrome.browserAction.onClicked.addListener(async () => {
    await openOptionsPage();
  });
}
