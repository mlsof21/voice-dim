export function store(key: string, value: any) {
  console.log('storing', key, value);

  chrome.storage.local.set({ [key]: value }, () => {
    console.log('Stored', key, value);
  });
}

export const DEFAULT_COMMANDS: Record<string, string[]> = {
  transfer: ['transfer'],
  loadout: ['equip loadout'],
  maxPower: ['equip max power'],
  postmaster: ['collect postmaster'],
  startFarming: ['start farming mode'],
  stopFarming: ['stop farming mode'],
};

export function retrieve(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError.message);
      }
      console.log({ result });
      if (Object.keys(result).length == 0) {
        store('commands', DEFAULT_COMMANDS);
        resolve(DEFAULT_COMMANDS);
      }
      console.log('Found', result[key]);
      resolve(result[key]);
    });
  });
}
