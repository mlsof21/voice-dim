import {
  AlwaysListening,
  debounce,
  DEFAULT_ALWAYS_LISTENING,
  DEFAULT_COMMANDS,
  infoLog,
  retrieve,
  store,
} from './common';

function onCommandChange() {
  const commands: Record<string, string[]> = {};
  Object.keys(DEFAULT_COMMANDS).forEach((command) => {
    commands[command] = getTextValueById(command);
  });
  store('commands', commands);

  updateSaveText(true, 'Saved!');
  setTimeout(() => updateSaveText(false), 3000);

  chrome.tabs.query({}, (tabs) => {
    const dimTabs = tabs.filter((tab) => tab.url?.match(/destinyitemmanager\.com.*inventory/));
    if (dimTabs && dimTabs[0].id)
      chrome.tabs.sendMessage(dimTabs[0].id, 'shortcut updated', (response) => {
        infoLog('voice dim', { response });
      });
  });
}

function sendListenOptionsMessage() {
  chrome.tabs.query({}, (tabs) => {
    const dimTab = tabs.filter((tab) => tab.url?.match(/destinyitemmanager\.com.*inventory/))[0];
    if (dimTab.id)
      chrome.tabs.sendMessage(dimTab.id, 'listening options updated', (response) => {
        infoLog('voice dim', { response });
      });
  });
}

function onActivationPhraseChange() {
  infoLog('voice dim', 'updating activation phrase');

  const activationPhrase = <HTMLInputElement>document.getElementById('activationPhrase');
  const listeningToggle = <HTMLInputElement>document.getElementById('alwaysListeningToggle');

  store('alwaysListening', { active: listeningToggle.checked, activationPhrase: activationPhrase.value });
  sendListenOptionsMessage();
}

function onAlwaysListeningChange(listeningOptions: AlwaysListening) {
  infoLog('voice dim', 'updating alwaysListening');

  store('alwaysListening', { active: listeningOptions.active, activationPhrase: listeningOptions.activationPhrase });
  sendListenOptionsMessage();
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

  const alwaysListening: AlwaysListening = await retrieve('alwaysListening', DEFAULT_ALWAYS_LISTENING);
  const listeningCheckbox = <HTMLInputElement>document.getElementById('alwaysListeningToggle');
  listeningCheckbox.checked = alwaysListening.active;
  toggleAlwaysListeningSection(alwaysListening.active);
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
    const checkbox = <HTMLInputElement>e.target;
    const activationWordInput = <HTMLElement>document.getElementsByClassName('alwaysListeningInput')[0];
    const activationPhrase = <HTMLInputElement>document.getElementById('activationPhrase');
    if (activationWordInput) toggleAlwaysListeningSection(checkbox.checked);
    onAlwaysListeningChange({ active: checkbox.checked, activationPhrase: activationPhrase.value });
  });
  const activationPhraseInput = <HTMLInputElement>document.getElementById('activationPhrase');
  activationPhraseInput?.addEventListener('keydown', debounce(onActivationPhraseChange));
  const commandInputs = document.querySelectorAll('.commands input');
  infoLog('voice dim', { commandInputs });
  commandInputs.forEach((input) => {
    input.addEventListener('keydown', debounce(onCommandChange));
  });
};
