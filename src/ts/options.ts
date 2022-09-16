import { debounce, DEFAULT_COMMANDS, retrieve, sleep, store } from './common';

function onChange() {
  const commands: Record<string, string[]> = {};
  Object.keys(DEFAULT_COMMANDS).forEach((command) => {
    commands[command] = getTextValueById(command);
  });
  store('commands', commands);

  updateSaveText(true, 'Saved!');
  setTimeout(() => updateSaveText(false), 3000);

  chrome.tabs.query({}, (tabs) => {
    const dimTab = tabs.filter((tab) => tab.url?.match(/destinyitemmanager\.com.*inventory/))[0];
    if (dimTab.id)
      chrome.tabs.sendMessage(dimTab.id, 'shortcut updated', (response) => {
        console.log('[voice-dim]', { response });
      });
  });
}

function updateSaveText(show: boolean, text: string = '') {
  const saveSpan = <HTMLSpanElement>document.querySelector('.saveText');
  saveSpan.innerText = text;
  saveSpan['style'].display = show ? 'block' : 'none';
}

function getTextValueById(id: string): string[] {
  const value = (<HTMLInputElement>document.getElementById(id)).value
    .split(',')
    .map((x) => x.trim())
    .filter((trimmed) => trimmed !== '');

  return value.length == 0 ? DEFAULT_COMMANDS[id] : value;
}

async function onLoad() {
  const commands: Record<string, string[]> = await retrieve('commands');
  Object.keys(commands).forEach((command) => {
    (<HTMLInputElement>document.getElementById(command)).value = (commands[command] ?? DEFAULT_COMMANDS[command]).join(
      ','
    );
  });
}

window.onload = function () {
  onLoad();
  const inputs = document.querySelectorAll('input');
  inputs.forEach((input) => {
    input.addEventListener('keydown', debounce(onChange));
  });
};
