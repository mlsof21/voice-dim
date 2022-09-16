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

export function waitForSearchToUpdate(
  initialCount: number = Infinity,
  timeoutInMs: number = 3000,
  checkFrequencyInMs: number = 50
): Promise<void> {
  return new Promise((resolve) => {
    var startTimeInMs = Date.now();
    (function loopSearch() {
      const count = getVisibleItems();
      if (count.length < initialCount) {
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
  const result: Element[] = Array.from(items).filter((item) => !item.className.includes('searchHidden'));

  return result;
}

export async function waitForElementToDisplay(
  selector: string,
  checkFrequencyInMs: number = 50,
  timeoutInMs: number = 2000
): Promise<Element | null> {
  return new Promise((resolve) => {
    var startTimeInMs = Date.now();
    (function loopSearch() {
      if (document.querySelector(selector) != null) {
        return resolve(document.querySelector(selector));
      } else {
        setTimeout(function () {
          if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs) {
            console.log("couldn't find", selector);
            return;
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

export interface ISpeechService {
  startListening: () => void;
  stopListening: () => void;
  recognizing: boolean;
}
