export interface Action {
  func: () => void;
  timeout: number;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const debounce = <F extends (...args: Parameters<F>) => ReturnType<F>>(func: F, waitFor: number = 300) => {
  let timeout: NodeJS.Timeout;

  const debounced = (...args: Parameters<F>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced;
};

export const DEFAULT_COMMANDS: Record<string, string[]> = {
  transfer: ['transfer'],
  equip: ['equip'],
  store: ['store'],
  loadout: ['loadout'],
  maxPower: ['max power'],
  postmaster: ['collect postmaster'],
  startFarming: ['start farming mode'],
  stopFarming: ['stop farming mode'],
};

export function store(key: string, value: any) {
  console.log('storing', key, value);

  chrome.storage.local.set({ [key]: value }, () => {
    console.log('Stored', key, value);
  });
}

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

export interface SpeechService {
  startListening: () => void;
  stopListening: () => void;
  recognizing: boolean;
}
