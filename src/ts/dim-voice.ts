import { HttpClientConfig } from 'bungie-api-ts/core';
import {
  DestinyManifest,
  DestinyManifestSlice,
  getDestinyManifest,
  getDestinyManifestSlice,
} from 'bungie-api-ts/destiny2';
import Fuse from 'fuse.js';
import { Action, retrieve } from './common';

const origConsoleLog = console.log;

console.log = function () {
  const args = [];
  args.push('[dim-voice]');
  for (let i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  origConsoleLog.apply(console, args);
};

// get html elements
let searchBar = setSearchBar();

const singleClick = new MouseEvent('click', {
  bubbles: true,
  cancelable: true,
  view: window,
});
const dblClick = new MouseEvent('dblclick', {
  bubbles: true,
  cancelable: true,
  view: window,
});

const inputEvent = new KeyboardEvent('input', { bubbles: true });

const enterEvent = new KeyboardEvent('keydown', {
  bubbles: true,
  key: 'Enter',
});

const letterEvent = (letter: string) =>
  new KeyboardEvent('keypress', {
    bubbles: true,
    key: letter,
    cancelable: true,
    view: window,
  });

const escapeEvent = new KeyboardEvent('keydown', {
  bubbles: true,
  key: 'Escape',
});
let knownPerks: string[] = [];

function setSearchBar() {
  return document.getElementsByName('filter').length > 0
    ? <HTMLInputElement>document.getElementsByName('filter')[0]
    : null;
}

const weaponTypeQueries = {
  weapon: 'is:weapon',
  'auto rifle': 'is:weapon is:autorifle',
  autorifle: 'is:weapon is:autorifle',
  auto: 'is:weapon is:autorifle',
  'hand cannon': 'is:weapon is:handcannon',
  handcannon: 'is:weapon is:handcannon',
  'pulse rifle': 'is:weapon is:pulserifle',
  pulse: 'is:weapon is:pulserifle',
  'scout rifle': 'is:weapon is:scoutrifle',
  scout: 'is:weapon is:scoutrifle',
  sidearm: 'is:weapon is:sidearm',
  'submachine gun': 'is:weapon is:submachine',
  bow: 'is:weapon is:bow',
  'slug shotgun': 'is:weapon is:shotgun perkname:"pinpoint slug frame"',
  'pellet shotgun': 'is:weapon is:shotgun -perkname:"pinpoint slug frame"',
  shotgun: 'is:weapon is:shotgun',
  'sniper rifle': 'is:weapon is:sniperrifle',
  sniper: 'is:weapon is:sniperrifle',
  'linear fusion rifle': 'is:weapon is:linearfusionrifle',
  'linear fusion': 'is:weapon is:linearfusionrifle',
  'fusion rifle': 'is:weapon is:fusionrifle',
  fusion: 'is:weapon is:fusionrifle',
  'trace rifle': 'is:weapon is:tracerifle',
  'grenade launcher': 'is:weapon is:grenadelauncher',
  'rocket launcher': 'is:weapon is:rocketlauncher',
  machinegun: 'is:weapon is:machinegun',
  'machine gun': 'is:weapon is:machinegun',
  sword: 'is:weapon is:sword',
  glaive: 'is:weapon is:glaive',
};

const craftedQuery = {
  crafted: 'is:crafted',
};

const energyTypeQueries = {
  arc: 'is:arc',
  ark: 'is:arc',
  solar: 'is:solar',
  void: 'is:void',
  stasis: 'is:stasis',
};

const rarityQueries = {
  blue: 'is:rare',
  rare: 'is:rare',
  legendary: 'is:legendary',
  exotic: 'is:exotic',
};

const weaponSlotQueries = {
  kinetic: 'is:kinetic',
  energy: 'is:energy',
  power: 'is:power',
};

const ammoTypeQueries = {
  primary: 'is:primary',
  special: 'is:special',
  heavy: 'is:heavy',
};

const armorTypeQueries = {
  helmet: 'is:armor is:helmet',
  arms: 'is:armor is:gauntlets',
  gauntlets: 'is:armor is:gauntlets',
  chest: 'is:armor is:chest',
  legs: 'is:armor is:leg',
  boots: 'is:armor is:leg',
  leg: 'is:armor is:leg',
};

const transferableItemAriaLabels = [
  'Kinetic Weapons',
  'Energy Weapons',
  'Power Weapons',
  'Helmet',
  'Gauntlets',
  'Chest Armor',
  'Leg Armor',
  'Class Armor',
];

let mappedCommands: Record<string, string> = {};

const potentialActions: Record<string, (() => void) | ((loadoutName: string) => void)> = {
  transfer: handleItemTypeQuery,
  equip: handleEquipItem,
  store: handleStoreItem,
  startFarming: handleStartFarmingMode,
  stopFarming: handleStopFarmingMode,
  maxPower: handleEquipMaxPower,
  loadout: handleEquipLoadout,
  postmaster: handleCollectPostmaster,
};

function parseSpeech(this: any, transcript: string) {
  console.log('parsing', transcript);
  let query = transcript.trim();
  const closestMatch = getClosestMatch(Object.keys(mappedCommands), query);
  const closestAction = getClosestMatch(Object.keys(potentialActions), mappedCommands[closestMatch]);
  console.log({ closestAction });

  query = query.replace(closestMatch, '').trim();
  if (closestMatch !== '') potentialActions[closestAction].call(this, query);
}

function handleStoreItem(query: string) {
  populateSearchBar('is:incurrentchar');
  setTimeout(() => {
    const availableItems = getAllTransferableItems();
    const itemToStore = getClosestMatch(Object.keys(availableItems), query);
    const itemDiv = availableItems[itemToStore];
    if (itemDiv) {
      itemDiv.dispatchEvent(singleClick);
      setTimeout(() => {
        const vaultDiv = document.querySelector('.item-popup [title^="Vault"]');
        vaultDiv?.dispatchEvent(singleClick);
        searchBar?.dispatchEvent(escapeEvent);
      }, 500);
    }
  }, 2000);
}

function handleEquipItem(query: string) {
  populateSearchBar('-is:incurrentchar');
  setTimeout(() => {
    const availableItems = getAllTransferableItems();
    const itemToStore = getClosestMatch(Object.keys(availableItems), query);
    const itemDiv = availableItems[itemToStore];
    itemDiv?.dispatchEvent(singleClick);
    setTimeout(storeWeaponOnCurrentCharacter, 500);
  }, 2000);
}

function storeWeaponOnCurrentCharacter() {
  const currentClass = getCurrentCharacterClass();
  const storeDiv = document.querySelector(`[title^="Store"] [data-icon*="${currentClass}"]`);
  storeDiv?.dispatchEvent(singleClick);
  searchBar?.dispatchEvent(escapeEvent);
}

function getCurrentCharacterClass(): string {
  const currentCharacter = document.querySelector('.character.current');
  if (currentCharacter?.innerHTML.includes('Titan')) {
    return 'Titan';
  }
  if (currentCharacter?.innerHTML.includes('Hunter')) {
    return 'Hunter';
  }
  if (currentCharacter?.innerHTML.includes('Warlock')) {
    return 'Warlock';
  }

  return '';
}
function handleItemTypeQuery(query: string) {
  query = query.replace('transfer', '');
  console.log('In handleItemTypeQuery, handling', query);

  let fullQuery = getFullQuery(query);

  const withQuery = getWithQuery(query);

  // likely means we're looking for a specific weapon
  if (fullQuery === '') {
    console.log('looking for', query);
    let timeout = 100;
    if (withQuery !== '') {
      populateSearchBar(withQuery);
      timeout = 2000;
    }
    setTimeout(() => equipItemOnCurrentCharacter(query), timeout);
  } else {
    if (withQuery !== '') {
      fullQuery += ` ${withQuery}`;
    }
    fullQuery += ' -is:incurrentchar';

    console.log('Full query being sent to DIM: ' + fullQuery);
    transferByWeaponTypeQuery(fullQuery);
  }
}

function equipItemOnCurrentCharacter(query: string) {
  const availableItems = getAllTransferableItems();
  const itemToGet = getClosestMatch(Object.keys(availableItems), query);
  populateSearchBar(`name:"${itemToGet}"`);
  setTimeout(() => {
    const visibleItems = getVisibleItems();
    console.log({ visibleItems });
    visibleItems[0]?.dispatchEvent(dblClick);
    clearSearchBar();
  }, 2000);
  // const itemDiv = availableItems[itemToGet];
}

function getFullQuery(query: string) {
  let fullQuery = '';
  query = query.split('with ')[0];
  const genericQueries = [
    rarityQueries,
    craftedQuery,
    weaponTypeQueries,
    energyTypeQueries,
    weaponSlotQueries,
    armorTypeQueries,
    ammoTypeQueries,
  ];

  for (const genericQuery of genericQueries) {
    fullQuery += checkForGenericTerms(genericQuery, query);
  }
  return fullQuery.trim();
}

function getWithQuery(query: string) {
  let withQuery = '';
  let perkNamesToSearch = '';
  if (query.includes(' with ')) {
    [query, perkNamesToSearch] = query.split(' with ').map((x) => {
      return x.trim();
    });
    const splitPerkNames = perkNamesToSearch.split(' and ').map((x) => {
      return x.trim();
    });
    const perkNames = [];
    for (const perkName of splitPerkNames) {
      const closestPerk = getClosestMatch(knownPerks, perkName);
      perkNames.push(`perkname:"${closestPerk}"`);
    }
    withQuery = perkNames.join(' ');
  }
  return withQuery;
}

function handleStartFarmingMode() {
  console.log('Starting farming mode');
  const currentCharacter = document.querySelector('.character.current');

  const currentCharacterClick = () => currentCharacter?.dispatchEvent(singleClick);
  const farmingClick = () => {
    const farmingSpan = document.querySelector('.loadout-menu ul li span');
    farmingSpan?.dispatchEvent(singleClick);
  };

  const actions = [
    { func: currentCharacterClick, timeout: 500 },
    { func: farmingClick, timeout: 0 },
  ];

  performUiInteractions(actions);
}

function handleStopFarmingMode() {
  const stopButton = document.querySelector('#item-farming button');
  stopButton?.dispatchEvent(singleClick);
}

function handleEquipMaxPower() {
  const currentCharacter = document.querySelector('.character.current');
  const currentCharacterClick = () => currentCharacter?.dispatchEvent(singleClick);
  const maxPowerClick = () => {
    const maxPowerSpan = document.querySelector('span[class^=MaxlightButton]');
    maxPowerSpan?.dispatchEvent(singleClick);
  };

  const actions = [
    { func: currentCharacterClick, timeout: 500 },
    { func: maxPowerClick, timeout: 0 },
  ];

  performUiInteractions(actions);
}

function handleEquipLoadout(loadoutName: string) {
  console.log('Equipping loadout', loadoutName);
  if (loadoutName.includes('equip loadout') || loadoutName.includes('equip load out'))
    loadoutName = loadoutName.replace('equip loadout', '').replace('equip load out', '');
  const currentCharacter = document.querySelector('.character.current');
  const characterClick = () => currentCharacter?.dispatchEvent(singleClick);

  const loadoutClick = () => {
    const availableLoadoutNames = getLoadoutNames();
    const loadoutResult = getClosestMatch(availableLoadoutNames, loadoutName);
    const loadoutToEquip = loadoutResult;
    const loadoutToEquipSpan = document.querySelector(`.loadout-menu span[title="${loadoutToEquip}"]`);
    loadoutToEquipSpan?.dispatchEvent(singleClick);
  };

  const actions = [
    { func: characterClick, timeout: 500 },
    { func: loadoutClick, timeout: 0 },
  ];

  performUiInteractions(actions);
}

function getLoadoutNames(): string[] {
  const loadoutNames: string[] = [];
  const loadoutSpans = document.querySelectorAll('.loadout-menu li > span[title]:first-child');
  loadoutSpans.forEach((span) => {
    if (span.textContent) loadoutNames.push(span.textContent);
  });
  return loadoutNames;
}

function handleCollectPostmaster() {
  const postmasterButton = document.querySelector('[class^="PullFromPostmaster"]');

  const postmasterClick = () => {
    postmasterButton?.dispatchEvent(singleClick);
  };

  const actions: Action[] = [
    { func: postmasterClick, timeout: 500 },
    { func: postmasterClick, timeout: 0 },
  ];
  performUiInteractions(actions);
}

function checkForGenericTerms(queries: Record<string, string>, query: string) {
  let fullQuery = '';
  for (const type of Object.keys(queries)) {
    const search = `\\b${type}\\b`;
    const re = new RegExp(search, 'g');
    if (query.search(re) >= 0) {
      fullQuery += queries[type] + ' ';
      break;
    }
  }
  return fullQuery;
}

function getAllTransferableItems(): Record<string, Element> {
  const items: Record<string, Element> = {};
  for (const labelName of transferableItemAriaLabels) {
    const result = document.querySelectorAll(`[aria-label="${labelName}"] .item`);
    const filteredItems = getVisibleItems(result);
    filteredItems.forEach((item) => {
      const split = (<HTMLElement>item).title.split('\n');
      const sanitized = split[0].replaceAll('.', '');
      items[sanitized] = item;
    });
  }

  return items;
}

function getClosestMatch(availableItems: string[], query: string): string {
  const options = {
    includeScore: true,
    shouldSort: true,
  };
  console.log({ availableItems });

  const fuse = new Fuse(availableItems, options);

  const result = fuse.search(query);
  console.log({ result, query });

  if (result.length > 0 && typeof result[0].score !== 'undefined' && result[0].score < 0.5) {
    return result[0].item;
  }

  console.log("Couldn't find a match. Trying to find match by splitting the current query.");
  const splitQuery = query.split(' ');

  for (const split of splitQuery) {
    const splitResult = fuse.search(split);
    console.log({ splitResult, split });
    return splitResult.length > 0 ? splitResult[0].item : '';
  }

  return result.length > 0 ? result[0].item : '';
}

function populateSearchBar(searchInput: string) {
  console.log('Populating search bar with', searchInput);
  if (!searchBar) searchBar = <HTMLInputElement>document.getElementsByName('filter')[0];
  if (searchBar) {
    searchBar.value = searchInput;
    const inputFunc = () => {
      searchBar?.dispatchEvent(inputEvent);
    };

    const enterFunc = () => {
      searchBar?.focus();
      searchBar?.dispatchEvent(enterEvent);
    };
    const escapeFunc = () => {
      searchBar?.focus();
      searchBar?.dispatchEvent(escapeEvent);
    };
    const actions = [
      { func: inputFunc, timeout: 100 },
      { func: enterFunc, timeout: 1000 },
      { func: escapeFunc, timeout: 1000 },
    ];
    performUiInteractions(actions);
  }
}

function clearSearchBar() {
  console.log('Clearing search bar');
  if (!searchBar) searchBar = <HTMLInputElement>document.getElementsByName('filter')[0];
  if (searchBar) {
    searchBar.value = '';
    const escapeFunc = () => {
      searchBar?.focus();
      searchBar?.dispatchEvent(escapeEvent);
    };
    performUiInteractions([{ func: escapeFunc, timeout: 100 }]);
  }
}

function performUiInteractions(actions: Action[]) {
  let totalTimeout = 0;
  for (let i = 0; i < actions.length; i++) {
    totalTimeout += actions[i].timeout;
    setTimeout(actions[i].func, totalTimeout);
  }
}

function getVisibleItems(items: NodeListOf<Element> | undefined = undefined): Element[] {
  if (!items) items = document.querySelectorAll('div.item');
  const result: Element[] = [];
  items.forEach((x) => {
    if (parseFloat(window.getComputedStyle(x, null).opacity) > 0.2) {
      result.push(x);
    }
  });
  return result;
}

function transferByWeaponTypeQuery(searchInput: string) {
  populateSearchBar(searchInput);
  const transferFunc = function () {
    const filteredItems = getVisibleItems();
    console.log(filteredItems);
    if (filteredItems.length > 0) {
      filteredItems[0].dispatchEvent(dblClick);
    }
  };
  const escapeFunc = function () {
    searchBar?.focus();
    searchBar?.dispatchEvent(escapeEvent);
  };
  const actions = [
    { func: transferFunc, timeout: 2000 },
    { func: escapeFunc, timeout: 1000 },
  ];

  performUiInteractions(actions);
}

const dimWords = ['dim', 'damn', 'then', 'them'];

const { webkitSpeechRecognition } = window as any;

var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;

// initialize our SpeechRecognition object
var recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;
// recognition.maxAlternatives = 1;
recognition.continuous = false;
let recognizing = false;

recognition.onerror = (e: any) => {
  console.error('Error with speech recognition:', e);
  stopSpeech();
};

recognition.onresult = (e: any) => {
  var transcript = e.results[0][0].transcript.toLowerCase();
  console.log({ transcript });
  if (dimWords.some((word) => transcript.startsWith(word))) {
    parseSpeech(removeMagicWord(transcript));
    stopSpeech();
  } else {
    console.log('no magic word, understood ', transcript);
    parseSpeech(transcript.toLowerCase());
    stopSpeech();
  }
};

// called when we detect silence
recognition.onspeechend = () => {
  if (recognizing) {
    stopSpeech();
  }
};

function removeMagicWord(transcript: string) {
  for (const word of dimWords) {
    console.log('checking transcript for', word);
    if (transcript.startsWith(word)) {
      transcript = transcript.replace(word, '');
      break;
    }
  }
  console.log('returning transcript:', transcript);
  return transcript;
}

// called when we detect sound
function startSpeech() {
  recognizing = true;
  try {
    // calling it twice will throw...
    console.log('starting speech recognition');
    recognition.start();
  } catch (e) {}
}

function stopSpeech() {
  console.log('stopping speech recognition');
  recognition.stop();
  recognizing = false;
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
  console.log({ request });
  if (request.dimShortcutPressed) {
    sendResponse({ ack: 'Acknowledged.' });
    if (!recognizing) {
      startSpeech();
    } else {
      stopSpeech();
    }
    return;
  }
  if (request === 'shortcut updated') {
    await getCustomCommands();

    // sendResponse({ ack: 'Acknowledged.' });
  }
});

async function getCustomCommands() {
  const commands = await retrieve('commands');
  mappedCommands = reverseMapCustomCommands(commands);
  console.log({ commands, mappedCommands });
}

function reverseMapCustomCommands(commands: any) {
  const newCommands: Record<string, string> = {};
  for (const propName in commands) {
    const arr: Array<string> = commands[propName];
    arr.forEach((value) => {
      newCommands[value] = propName;
    });
  }
  return newCommands;
}

async function $http(config: HttpClientConfig): Promise<Response> {
  return fetch(config.url, {
    method: config.method,
    body: config.body,
  }).then((res) => res.json());
}

async function getManifest(): Promise<DestinyManifest> {
  const response = await getDestinyManifest($http);
  return response.Response;
}

async function getDestinyInventoryItemManifest(): Promise<DestinyManifestSlice<['DestinyInventoryItemDefinition']>> {
  const manifest = await getManifest();
  const manifestSlice = await getDestinyManifestSlice($http, {
    destinyManifest: manifest,
    language: 'en',
    tableNames: ['DestinyInventoryItemDefinition'],
  });
  return manifestSlice;
}

async function getPerks() {
  const inventoryItemManifest = await getDestinyInventoryItemManifest();
  createMaps(inventoryItemManifest);
}

function createMaps(manifest: DestinyManifestSlice<['DestinyInventoryItemDefinition']>) {
  const validPlugs = [
    'barrels',
    'batteries',
    'frames',
    'guards',
    'magazines',
    'magazines_gl',
    'stocks',
    'tubes',
    'grips',
    'scopes',
    'origins',
    'intrinsics',
  ];
  const foundPerks = [];

  for (const hash in manifest.DestinyInventoryItemDefinition) {
    const item = manifest.DestinyInventoryItemDefinition[hash];
    // Only map perks
    if (item && item.itemType === 19) {
      const plugCategoryIdentifier = item.plug?.plugCategoryIdentifier ?? '';
      if (validPlugs.includes(plugCategoryIdentifier) && item.displayProperties.name !== '') {
        foundPerks.push(item.displayProperties.name.toLowerCase());
      }
    }
  }
  knownPerks = [...new Set(foundPerks.sort())];
  console.log({ knownPerks });
}

getPerks();

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return;

    for (let i = 0; i < mutation.addedNodes.length; i++) {
      const node = <Element>mutation.addedNodes[i];
      if (node.className && node.className.toLowerCase() == 'search-link') {
        getCustomCommands();
        break;
      }
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false,
});

// init();

// const client = new WebSocket('wss://localhost:10555');

// client.send('test');
