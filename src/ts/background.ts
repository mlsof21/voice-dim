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

chrome.runtime.onMessage.addListener((data: { type: string }) => {
  console.log({ data });
  if (data.type === 'notification') {
    console.log('creating notification');
  }
});

// export const clients: Record<string, WebSocket> = {};

// const wss = new WebSocketServer({
//   port: 10555,
//   host: 'localhost',
// });

// export const init = () => {
//   wss.on('connection', (ws: WebSocket) => {
//     // disallow any not identified connection
//     if (!ws.protocol) {
//       return ws.close();
//     }

//     // keep track of WebSocket
//     clients[ws.protocol] = ws;

//     // check if data is an authentication flow or not
//     ws.on('message', (msg: string) => {
//       console.log({ msg });
//       const { action, data } = JSON.parse(msg);

//       console.log({ action, data });
//     });

//     // on connection close update plugin status
//     ws.on('close', () => {});
//   });
// };
