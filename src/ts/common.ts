export const logs: Log[] = [];

const commonTag = 'common';

export type Log = {
  tag: string;
  message: unknown;
  args: unknown[];
};

export function infoLog(tag: string, message: unknown, ...args: unknown[]) {
  console.log(`[voice dim - ${tag}]`, message, ...args);
  logs.push({ tag: `[${tag} info]`, message, args });
}

export function debugLog(tag: string, message: unknown, ...args: unknown[]) {
  console.debug(`[voice dim - ${tag}]`, message, ...args);
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

export function waitForSearchToUpdate(
  initialCount: number = Infinity,
  timeoutInMs: number = 3000,
  checkFrequencyInMs: number = 50
): Promise<void> {
  return new Promise((resolve) => {
    var startTimeInMs = Date.now();
    (function loopSearch() {
      const count = getVisibleItems();
      if (count.length !== initialCount) {
        clearTimeout();
        return resolve();
      } else {
        setTimeout(function () {
          if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs) return;
          loopSearch();
        }, checkFrequencyInMs);
      }
    })();
  });
}

export function getVisibleItems(items: NodeListOf<Element> | undefined = undefined): Element[] {
  if (!items) items = document.querySelectorAll('div.item');
  // const result: Element[] = Array.from(items).filter((item) => !item.className.includes('searchHidden'));
  const result = Array.from(items).filter((item) => parseFloat(window.getComputedStyle(item).opacity) > 0.5);
  return result;
}

export async function waitForElementToDisplay(
  selector: string,
  checkFrequencyInMs: number = 50,
  timeoutInMs: number = 2000
): Promise<Element | null> {
  return new Promise((resolve, reject) => {
    var startTimeInMs = Date.now();
    (function loopSearch() {
      if (document.querySelector(selector) != null) {
        return resolve(document.querySelector(selector));
      } else {
        setTimeout(function () {
          if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs) {
            debugLog(commonTag, "couldn't find", selector);
            return reject();
          }
          loopSearch();
        }, checkFrequencyInMs);
      }
    })();
  });
}

export const DEFAULT_COMMANDS: Record<string, string[]> = {
  transfer: ['transfer'],
  equip: ['equip'],
  store: ['store'],
  loadout: ['loadout'],
  maxPower: ['max power'],
  postmaster: ['collect postmaster'],
  startFarming: ['start farming mode'],
  stopFarming: ['stop farming mode'],
  refresh: ['refresh']
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
    infoLog(commonTag, 'Stored', key, value);
  });
}

export function retrieve<T>(key: string, defaultValue: T): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError.message);
      }
      infoLog(commonTag, { result });
      if (Object.keys(result).length == 0) {
        store(key, defaultValue);
        resolve(defaultValue);
      }
      infoLog(commonTag, 'Found', result[key]);
      resolve(result[key]);
    });
  });
}

export interface ISpeechService {
  startListening: () => void;
  stopListening: () => void;
  recognizing: boolean;
}
