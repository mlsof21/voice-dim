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

chrome.runtime.onMessage.addListener((data: { type: string; message: string }) => {
  console.log({ data });
  if (data.type === 'notification') {
    console.log('creating notification');
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icon.png',
      title: 'notification title',
      message: data.message,
      priority: 2,
    });
  }
});

chrome.action.onClicked.addListener(async () => {
  const [optionsTab] = await chrome.tabs.query({ url: `chrome-extension://${chrome.runtime.id}\/html\/options.html` });
  console.log({ optionsTab });
  if (!optionsTab) chrome.tabs.create({ url: '../html/options.html' });
  else {
    chrome.tabs.update(optionsTab.id!, { active: true });
  }
});
