import { debounce, DEFAULT_COMMANDS, retrieve, sleep, store } from './common';

function onCommandChange() {
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

function onAlwaysListeningChange(alwaysListening: boolean, activationPhrase: string) {
  store('alwaysListening', { alwaysListening, activationPhrase });
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
  const commands: Record<string, string[]> = await retrieve('commands', DEFAULT_COMMANDS);
  Object.keys(commands).forEach((command) => {
    (<HTMLInputElement>document.getElementById(command)).value = (commands[command] ?? DEFAULT_COMMANDS[command]).join(
      ','
    );
  });

  const alwaysListening: { alwaysListening: boolean; activationPhrase: string } = await retrieve('alwaysListening', {
    alwaysListening: false,
    activationPhrase: 'ok dim',
  });
  const listeningCheckbox = <HTMLInputElement>document.getElementById('alwaysListeningToggle');
  listeningCheckbox.checked = alwaysListening.alwaysListening;
  toggleAlwaysListeningSection(alwaysListening.alwaysListening);
  const activationPhrase = <HTMLInputElement>document.getElementById('activationPhrase');
  activationPhrase.value = alwaysListening.activationPhrase;
}
function toggleAlwaysListeningSection(isChecked: boolean) {
  const listeningSection = document.querySelector('.alwaysListeningInput') as HTMLElement;
  if (isChecked) {
    listeningSection.style.display = 'inline-block';
  } else {
    listeningSection.style.display = 'none';
  }
}

window.onload = function () {
  onLoad();
  const alwaysListening = <HTMLInputElement>document.getElementById('alwaysListeningToggle');
  alwaysListening?.addEventListener('change', (e) => {
    const checkbox = e.target as HTMLInputElement;
    const activationWordInput = document.getElementsByClassName('alwaysListeningInput')[0] as HTMLElement;
    const activationPhrase = document.getElementById('activationPhrase') as HTMLInputElement;
    if (activationWordInput) toggleAlwaysListeningSection(checkbox.checked);
    onAlwaysListeningChange(checkbox.checked, activationPhrase.value);
  });
  const inputs = document.querySelectorAll('input');
  inputs.forEach((input) => {
    input.addEventListener('keydown', debounce(onCommandChange));
  });
};
