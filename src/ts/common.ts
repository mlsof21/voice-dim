export const logs: Log[] = [];

export type Log = {
  tag: string;
  message: unknown;
  args: unknown[];
};

export function infoLog(tag: string, message: unknown, ...args: unknown[]) {
  console.log(`[${tag}]`, message, ...args);
  logs.push({ tag: `[${tag} info]`, message, args });
}

export function debugLog(tag: string, message: unknown, ...args: unknown[]) {
  console.debug(`[${tag}]`, message, ...args);
  logs.push({ tag: `[${tag} debug]`, message, args });
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

export type AlwaysListening = {
  active: boolean;
  activationPhrase: string;
};

export const DEFAULT_ALWAYS_LISTENING: AlwaysListening = {
  active: false,
  activationPhrase: 'okay ghost',
};

export function store<T>(key: string, value: T) {
  chrome.storage.local.set({ [key]: value }, () => {
    infoLog('voice dim', 'Stored', key, value);
  });
}

export function retrieve<T>(key: string, defaultValue: T): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError.message);
      }
      infoLog('voice dim', { result });
      if (Object.keys(result).length == 0) {
        store(key, defaultValue);
        resolve(defaultValue);
      }
      infoLog('voice dim', 'Found', result[key]);
      resolve(result[key]);
    });
  });
}

export interface ISpeechService {
  startListening: () => void;
  stopListening: () => void;
  recognizing: boolean;
}
