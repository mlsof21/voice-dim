chrome.commands.onCommand.addListener((command: any) => {
  console.log(`[dim-voice] Command "${command}" triggered`);

  chrome.tabs.query({}, (tabs: any[]) => {
    const dimTab = tabs.filter((tab: { url: string }) => tab.url?.match(/destinyitemmanager\.com.*inventory/))[0];

    if (dimTab.id)
      chrome.tabs.sendMessage(dimTab.id, { dimShortcutPressed: true }, (response: any) => {
        if ('ack' in response) console.log('[dim-voice]', response.ack);
        else console.log('[dim-voice]', { response });
      });
  });
});

chrome.runtime.onMessage.addListener((data: { type: string }) => {
  console.log({ data });
  if (data.type === 'notification') {
    console.log('creating notification');
  }
});
