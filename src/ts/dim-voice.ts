import { HttpClientConfig } from 'bungie-api-ts/core';
import {
  DestinyManifest,
  DestinyManifestSlice,
  getDestinyManifest,
  getDestinyManifestSlice,
} from 'bungie-api-ts/destiny2';
import Fuse from 'fuse.js';
import { Action, retrieve } from './common';
import { SpeechService } from './speech';

const origConsoleLog = console.log;

console.log = function () {
  const args = [];
  args.push('[voice-dim]');
  for (let i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  origConsoleLog.apply(console, args);
};

// Keyboard and Mouse Events
const uiEvents = {
  singleClick: new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  }),
  dblClick: new MouseEvent('dblclick', {
    bubbles: true,
    cancelable: true,
    view: window,
  }),
  input: new KeyboardEvent('input', { bubbles: true }),
  enter: new KeyboardEvent('keydown', {
    bubbles: true,
    key: 'Enter',
  }),
  letter: (letter: string) =>
    new KeyboardEvent('keypress', {
      bubbles: true,
      key: letter,
      cancelable: true,
      view: window,
    }),
  escape: new KeyboardEvent('keydown', {
    bubbles: true,
    key: 'Escape',
  }),
};

// Globals
let knownPerks: string[] = [];
let searchBar = setSearchBar();

// Queries for the search bar
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
  smg: 'is:weapon is:submachine',
  'submachine gun': 'is:weapon is:submachine',
  bow: 'is:weapon is:bow',
  'slug shotgun': 'is:weapon is:shotgun perkname:"pinpoint slug frame"',
  'pellet shotgun': 'is:weapon is:shotgun -perkname:"pinpoint slug frame"',
  shotgun: 'is:weapon is:shotgun',
  shotty: 'is:weapon is:shotgun',
  shottie: 'is:weapon is:shotgun',
  'sniper rifle': 'is:weapon is:sniperrifle',
  sniper: 'is:weapon is:sniperrifle',
  'linear fusion rifle': 'is:weapon is:linearfusionrifle',
  'linear fusion': 'is:weapon is:linearfusionrifle',
  linear: 'is:weapon is:linearfusionrifle',
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

const otherQueries = {
  crafted: 'is:crafted',
  deepsight: 'is:deepsight',
  'deep sight': 'is:deepsight',
  'deep site': 'is:deepsight',
  wishlist: 'is:wishlist',
  wishlisted: 'is:wishlist',
};

function setSearchBar() {
  return document.getElementsByName('filter').length > 0
    ? <HTMLInputElement>document.getElementsByName('filter')[0]
    : null;
}

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

type ActionFunction = Record<
  string,
  (() => void) | ((loadoutName: string) => void) | ((query: string, action: string) => void)
>;

const potentialActions: ActionFunction = {
  transfer: handleItemMovement,
  equip: handleItemMovement,
  store: handleItemMovement,
  startFarming: handleStartFarmingMode,
  stopFarming: handleStopFarmingMode,
  maxPower: handleEquipMaxPower,
  loadout: handleEquipLoadout,
  postmaster: handleCollectPostmaster,
};

export function parseSpeech(this: any, transcript: string) {
  console.log('parsing', transcript);
  let query = transcript.trim();
  const closestMatch = getClosestMatch(Object.keys(mappedCommands), query);
  const closestAction = getClosestMatch(Object.keys(potentialActions), mappedCommands[closestMatch]);
  console.log({ closestAction });

  query = query.replace(closestMatch, '').trim();
  if (closestMatch !== '') {
    potentialActions[closestAction].call(this, query, closestAction);
  }
  clearSearchBar();
}

function handleStoreItem(query: string) {
  populateSearchBar('is:incurrentchar');
  setTimeout(() => {
    const availableItems = getAllTransferableItems();
    const itemToStore = getClosestMatch(Object.keys(availableItems), query);
    const itemDiv = availableItems[itemToStore];
    itemDiv?.dispatchEvent(uiEvents.singleClick);
    setTimeout(() => {
      const vaultDiv = document.querySelector('.item-popup [title^="Vault"]');
      vaultDiv?.dispatchEvent(uiEvents.singleClick);
      searchBar?.dispatchEvent(uiEvents.escape);
    }, 500);
  }, 2000);
}

function handleEquipItem(query: string) {
  populateSearchBar('-is:incurrentchar');
  setTimeout(() => {
    const availableItems = getAllTransferableItems();
    const itemToStore = getClosestMatch(Object.keys(availableItems), query);
    const itemDiv = availableItems[itemToStore];
    itemDiv?.dispatchEvent(uiEvents.singleClick);
    setTimeout(storeWeapon, 500);
  }, 2000);
}

function storeWeapon() {
  const currentClass = getCurrentCharacterClass();
  const storeDiv = document.querySelector(`[title^="Store"] [data-icon*="${currentClass}"]`);
  storeDiv?.dispatchEvent(uiEvents.singleClick);
  clearSearchBar();
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
function handleItemMovement(query: string, action: string) {
  console.log('in handleItemMovement', { query, action });
  query = query.replace('transfer', '');
  let fullQuery = getGenericQuery(query);

  const withQuery = getPerkQuery(query);

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
    visibleItems[0]?.dispatchEvent(uiEvents.dblClick);
  }, 2000);
}

function getGenericQuery(query: string) {
  let fullQuery = '';
  query = query.split('with ')[0];
  const genericQueries = [
    rarityQueries,
    weaponTypeQueries,
    energyTypeQueries,
    weaponSlotQueries,
    armorTypeQueries,
    ammoTypeQueries,
    otherQueries,
  ];

  for (const genericQuery of genericQueries) {
    fullQuery += checkForGenericTerms(genericQuery, query);
  }
  return fullQuery.trim();
}

function getPerkQuery(query: string) {
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
  openCurrentCharacterLoadoutMenu();
  const farmingClick = () => {
    const farmingSpan = document.querySelector('.loadout-menu ul li span');
    farmingSpan?.dispatchEvent(uiEvents.singleClick);
  };

  const actions = [{ func: farmingClick, timeout: 0 }];

  performUiInteractions(actions);
}

function handleStopFarmingMode() {
  const stopButton = document.querySelector('#item-farming button');
  stopButton?.dispatchEvent(uiEvents.singleClick);
}

function handleEquipMaxPower() {
  openCurrentCharacterLoadoutMenu();
  const maxPowerClick = () => {
    const maxPowerSpan = document.querySelector('span[class^=MaxlightButton]');
    maxPowerSpan?.dispatchEvent(uiEvents.singleClick);
  };

  const actions = [{ func: maxPowerClick, timeout: 0 }];

  performUiInteractions(actions);
}

function openCurrentCharacterLoadoutMenu() {
  const currentCharacter = document.querySelector('.character.current');
  currentCharacter?.dispatchEvent(uiEvents.singleClick);
}

function handleEquipLoadout(loadoutName: string) {
  console.log('Equipping loadout', loadoutName);
  if (loadoutName.includes('equip loadout') || loadoutName.includes('equip load out'))
    loadoutName = loadoutName.replace('equip loadout', '').replace('equip load out', '');

  openCurrentCharacterLoadoutMenu();
  const loadoutClick = () => {
    const availableLoadoutNames = getLoadoutNames();
    const loadoutResult = getClosestMatch(availableLoadoutNames, loadoutName);
    const loadoutToEquip = loadoutResult;
    const loadoutToEquipSpan = document.querySelector(`.loadout-menu span[title="${loadoutToEquip}"]`);
    loadoutToEquipSpan?.dispatchEvent(uiEvents.singleClick);
  };

  const actions = [{ func: loadoutClick, timeout: 0 }];

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
    postmasterButton?.dispatchEvent(uiEvents.singleClick);
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

  // const soundsLike = [];
  // for (const item of availableItems) {
  //   soundsLike.push({ word: item, query, score: natural.Metaphone.compare(item, query) });
  // }
  // console.log({ soundsLike });

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
      searchBar?.dispatchEvent(uiEvents.input);
    };

    const enterFunc = () => {
      searchBar?.focus();
      searchBar?.dispatchEvent(uiEvents.enter);
    };
    const escapeFunc = () => {
      searchBar?.focus();
      searchBar?.dispatchEvent(uiEvents.escape);
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
      searchBar?.dispatchEvent(uiEvents.escape);
      searchBar?.blur();
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
      filteredItems[0].dispatchEvent(uiEvents.dblClick);
    }
  };
  const escapeFunc = function () {
    searchBar?.focus();
    searchBar?.dispatchEvent(uiEvents.escape);
  };
  const actions = [
    { func: transferFunc, timeout: 2000 },
    { func: escapeFunc, timeout: 1000 },
  ];

  performUiInteractions(actions);
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log(sender.tab ? 'from a content script:' + sender.tab.url : 'from the extension');
  console.log({ request });
  if (request.dimShortcutPressed) {
    sendResponse({ ack: 'Acknowledged.' });
    if (!speechService.recognizing) {
      speechService.startSpeech();
    } else {
      speechService.stopSpeech();
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

function createMicDiv() {
  const imageUrl = chrome.runtime.getURL('icon_large.png');
  console.log({ imageUrl });
  const voiceDimDiv = document.createElement('div');
  voiceDimDiv.id = 'voiceDim';
  voiceDimDiv.innerHTML = `
    <div class="container">
      <div class="textContainer">
        <span id="transcript"></span>
      </div>
      <div class="imageContainer">
        <img src="${imageUrl}" />
      </div>
    </div>
  `;

  document.body.appendChild(voiceDimDiv);

  const imageDiv = document.querySelector('#voiceDim .imageContainer');
  imageDiv?.addEventListener('click', () => {
    speechService.startSpeech();
  });
}

function createHelpDiv() {
  const voiceDimHelp = document.createElement('div');
  voiceDimHelp.id = 'voiceDimHelp';
  voiceDimHelp.className = 'voiceDimHelp';
  voiceDimHelp.innerText = '?';
  voiceDimHelp.addEventListener('click', showHelpModal);
  document.body.appendChild(voiceDimHelp);
}

function createHelpModal() {}
function showHelpModal() {}

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
getCustomCommands();

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return;

    for (let i = 0; i < mutation.addedNodes.length; i++) {
      const node = <Element>mutation.addedNodes[i];
      if (node.className && node.className.toLowerCase() == 'search-link') {
        createMicDiv();
        createHelpDiv();
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

let speechService: any;
if (window.navigator.userAgent.indexOf('Chrome') >= 0) {
  speechService = new SpeechService();
} else {
}

// …

// registerServiceWorker();
// TODO: use this
// const host = 'ws://localhost:7777';
// var ws = new WebSocket(host);

// function sendMessage(message: string) {
//   if (ws === undefined) {
//     ws = new WebSocket(host);
//   }

//   console.log('Sending to server', message);
//   ws.send(message);
//   // ws.onopen = () => {
//   //   ws.send(JSON.stringify(message));
//   // };

//   ws.onmessage = (event: MessageEvent) => {
//     console.log('received %s', event.data);
//   };
// }
