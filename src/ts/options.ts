import { DEFAULT_COMMANDS, retrieve, store } from './common';

function onChange() {
  console.log('in onchange');

  const commands = {
    transfer: getTextValueById('transfer'),
    startFarming: getTextValueById('startFarming'),
    stopFarming: getTextValueById('stopFarming'),
    maxPower: getTextValueById('maxPower'),
    loadout: getTextValueById('loadout'),
    postmaster: getTextValueById('postmaster'),
  };
  console.log({ commands });
  store('commands', commands);

  chrome.tabs.query({}, (tabs) => {
    const dimTab = tabs.filter((tab) => tab.url?.match(/destinyitemmanager\.com.*inventory/))[0];
    if (dimTab.id)
      chrome.tabs.sendMessage(dimTab.id, 'shortcut updated', (response) => {
        console.log('[dim-voice]', { response });
      });
  });
}

function getTextValueById(id: string): string[] {
  const value = (<HTMLInputElement>document.getElementById(id)).value
    .split(',')
    .map((x) => x.trim())
    .filter((trimmed) => trimmed !== '');

  if (value.length == 0) return DEFAULT_COMMANDS[id];
  return value;
}

async function onLoad() {
  const { transfer, loadout, maxPower, postmaster, startFarming, stopFarming }: Record<string, string[]> =
    await retrieve('commands');

  (<HTMLInputElement>document.getElementById('transfer')).value = transfer.join(',') ?? 'transfer';
  (<HTMLInputElement>document.getElementById('loadout')).value = loadout.join(',') ?? 'equip loadout';
  (<HTMLInputElement>document.getElementById('maxPower')).value = maxPower.join(',') ?? 'equip max power';
  (<HTMLInputElement>document.getElementById('postmaster')).value = postmaster.join(',') ?? 'collect postmaster';
  (<HTMLInputElement>document.getElementById('startFarming')).value = startFarming.join(',') ?? 'start farming mode';
  (<HTMLInputElement>document.getElementById('stopFarming')).value = stopFarming.join(',') ?? 'stop farming mode';
}

window.onload = function () {
  console.log('loaded');
  onLoad();
  const inputs = document.querySelectorAll('input');
  inputs.forEach((input) => {
    input.addEventListener('change', onChange);
    input.addEventListener('keydown', onChange);
  });
};
