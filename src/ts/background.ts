chrome.commands.onCommand.addListener((command) => {
  console.log(`Command "${command}" triggered`);

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { dimShouldListen: 'DIM listen shortcut has been triggered.' },
      function (response) {
        console.log(response.ack);
      }
    );
  });
});

chrome.runtime.onMessage.addListener((data) => {
  if (data.type === 'notification') {
    console.log('creating notification');
    chrome.notifications.create('test', {
      type: 'basic',
      iconUrl: '../../icon_128.png',
      title: 'DIM is listening',
      message: 'DIM is listening for a command.',
      priority: 2,
    });
  }
});
