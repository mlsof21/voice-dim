// import { init } from './voice-dim-server';

chrome.commands.onCommand.addListener((command: any) => {
  console.log(`[dim-voice] Command "${command}" triggered`);

  chrome.tabs.query({}, (tabs: any[]) => {
    const dimTabs = tabs.filter((tab: { url: string }) => tab.url?.match(/destinyitemmanager\.com.*inventory/));

    if (dimTabs && dimTabs[0]?.id)
      chrome.tabs.sendMessage(dimTabs[0].id, { dimShortcutPressed: true }, (response: any) => {
        console.log('[dim-voice]', { response });
      });
  });
});

chrome.runtime.onMessage.addListener((data: { type: string; message: string }) => {
  console.log({ data });
  if (data.type === 'notification') {
    console.log('creating notification');
  }
});

// init();
