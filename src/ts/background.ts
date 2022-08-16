chrome.commands.onCommand.addListener((command) => {
  console.log(`[dim-voice] Command "${command}" triggered`);

  chrome.tabs.query({}, function (tabs) {
    const dimTab = tabs.filter((tab) =>
      tab.url.includes('destinyitemmanager.com')
    )[0];

    chrome.tabs.sendMessage(
      dimTab.id,
      { dimShortcutPressed: true },
      function (response) {
        console.log('[dim-voice]', response.ack);
      }
    );
  });
});

chrome.runtime.onMessage.addListener((data) => {
  console.log({ data });
  if (data.type === 'notification') {
    console.log('creating notification');
  }
});
