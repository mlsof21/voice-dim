import Fuse from 'fuse.js';
import {
  AlwaysListening,
  DEFAULT_ALWAYS_LISTENING,
  DEFAULT_COMMANDS,
  getVisibleItems,
  retrieve,
  sleep,
  waitForElementToDisplay,
  waitForSearchToUpdate,
} from './common';
import { SpeechService } from './speech';
const annyang = require('annyang');
const origConsoleLog = console.log;

console.log = function () {
  const args = [];
  args.push('[voice-dim]');
  for (let i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  origConsoleLog.apply(console, args);
};

let speechService: SpeechService | null;
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
  kinetic: 'is:kineticslot',
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
  favorite: 'tag:favorite',
  keeper: 'tag:keep',
  junk: 'tag:junk',
  infusion: 'tag:infuse',
  archived: 'tag:archive',
  tagged: 'is:tagged',
  'not tagged': '-is:tagged',
  'has notes': 'is:hasnotes',
  'has no notes': '-is:hasnotes',
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
  store: handleStoreItem,
  startFarming: handleStartFarmingMode,
  stopFarming: handleStopFarmingMode,
  maxPower: handleEquipMaxPower,
  loadout: handleEquipLoadout,
  postmaster: handleCollectPostmaster,
};

export async function parseSpeech(this: any, transcript: string) {
  clearSearchBar();
  let query = transcript.trim();
  const closestMatch = getClosestMatch(Object.keys(mappedCommands), query);

  if (!closestMatch) {
    console.log("Couldn't determine correct action");
    return;
  }
  const closestAction = getClosestMatch(Object.keys(potentialActions), mappedCommands[closestMatch.match]);
  if (!closestAction) {
    console.log("Couldn't determine correct action");
    return;
  }
  console.log({ closestAction });

  query = query.replace(closestMatch.toReplace, '').trim();
  await potentialActions[closestAction.match].call(this, query, closestAction.match);
}

async function handleStoreItem(query: string) {
  await populateSearchBar('is:incurrentchar', true);
  const availableItems = getAllTransferableItems();
  const itemToStore = getClosestMatch(Object.keys(availableItems), query);
  if (!itemToStore || (itemToStore && itemToStore.match === '')) {
    clearSearchBar();
    return;
  }
  await populateSearchBar(`name:"${itemToStore?.match}"`);
  const itemDiv = availableItems[itemToStore.match];
  itemDiv?.dispatchEvent(uiEvents.singleClick);
  const vaultDiv = await waitForElementToDisplay('.item-popup [title^="Vault"]');
  vaultDiv?.dispatchEvent(uiEvents.singleClick);
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
async function handleItemMovement(query: string, action: string): Promise<void> {
  console.log('in handleItemMovement', { query, action });
  const itemToMove = await getItemToMove(query);
  console.log({ itemToMove });
  if (!itemToMove) return;

  switch (action) {
    case 'transfer':
      await transferItem(itemToMove);
      break;
    case 'equip':
      equipItem(itemToMove);
      break;
    default:
      break;
  }
  clearSearchBar();
}

async function getItemToMove(query: string): Promise<Element | null> {
  let itemToMove: Element | null = null;
  let splitQuery = query.split(' with ').map((x) => x.trim());
  let nonPerkQuery = getGenericQuery(splitQuery[0]);

  const perkQuery = splitQuery.length > 1 && splitQuery[1] !== '' ? getPerkQuery(splitQuery[1]) : '';
  if (nonPerkQuery === '') {
    if (perkQuery !== '') {
      await populateSearchBar(perkQuery, true);
    }
    const availableItems = getAllTransferableItems();
    const itemToGet = getClosestMatch(Object.keys(availableItems), splitQuery[0]);
    await populateSearchBar(`name:"${itemToGet?.match}"`);
    const visibleItems = getVisibleItems();
    itemToMove = visibleItems[0];
  } else {
    nonPerkQuery += ` ${perkQuery} -is:incurrentchar`;
    await populateSearchBar(nonPerkQuery);
    const filteredItems = getVisibleItems();
    if (filteredItems.length > 0) {
      itemToMove = filteredItems[0];
    }
  }
  return itemToMove;
}

async function transferItem(item: Element) {
  item.dispatchEvent(uiEvents.singleClick);
  const currentClass = getCurrentCharacterClass();
  const storeDiv = await waitForElementToDisplay(`[title^="Store"] [data-icon*="${currentClass}"]`);
  storeDiv?.dispatchEvent(uiEvents.singleClick);
}

function equipItem(item: Element) {
  item.dispatchEvent(uiEvents.dblClick);
}

function getGenericQuery(query: string) {
  let genericQuery = '';
  const genericQueries = [
    rarityQueries,
    weaponTypeQueries,
    energyTypeQueries,
    weaponSlotQueries,
    armorTypeQueries,
    ammoTypeQueries,
    otherQueries,
  ];

  for (const gq of genericQueries) {
    genericQuery += checkForGenericTerms(gq, query);
  }
  return genericQuery.trim();
}

function getPerkQuery(query: string) {
  let perkQuery = '';
  const splitPerkNames = query
    .split(' and ')
    .map((x) => {
      return x.trim();
    })
    .filter((x) => x !== '');
  const perkNames = [];
  for (const perkName of splitPerkNames) {
    const closestPerk = getClosestMatch(knownPerks, perkName);
    if (closestPerk && closestPerk.match !== '') perkNames.push(`perkname:"${closestPerk.match}"`);
  }
  perkQuery = perkNames.join(' ');
  return perkQuery;
}

async function handleStartFarmingMode() {
  console.log('Starting farming mode');
  await openCurrentCharacterLoadoutMenu();
  const farmingSpan = document.querySelector('.loadout-menu ul li span');
  farmingSpan?.dispatchEvent(uiEvents.singleClick);
}

function handleStopFarmingMode() {
  const stopButton = document.querySelector('#item-farming button');
  stopButton?.dispatchEvent(uiEvents.singleClick);
}

async function handleEquipMaxPower() {
  await openCurrentCharacterLoadoutMenu();
  const maxPowerSpan = document.querySelector('span[class^=MaxlightButton]');
  maxPowerSpan?.dispatchEvent(uiEvents.singleClick);
}

async function openCurrentCharacterLoadoutMenu() {
  const currentCharacter = document.querySelector('.character.current');
  currentCharacter?.dispatchEvent(uiEvents.singleClick);
  await waitForElementToDisplay('.loadout-menu');
}

async function handleEquipLoadout(loadoutName: string) {
  console.log('Equipping loadout', loadoutName);
  await openCurrentCharacterLoadoutMenu();
  const availableLoadoutNames = getLoadoutNames();
  const loadoutToEquip = getClosestMatch(availableLoadoutNames, loadoutName);
  const loadoutToEquipSpan = document.querySelector(`.loadout-menu span[title="${loadoutToEquip?.match}"]`);
  loadoutToEquipSpan?.dispatchEvent(uiEvents.singleClick);
}

function getLoadoutNames(): string[] {
  const loadoutNames: string[] = [];
  const loadoutSpans = document.querySelectorAll('.loadout-menu li > span[title]:first-child');
  loadoutSpans.forEach((span) => {
    if (span.textContent) loadoutNames.push(span.textContent);
  });
  return loadoutNames;
}

async function handleCollectPostmaster() {
  const postmasterButton = document.querySelector('[class^="PullFromPostmaster"]');
  postmasterButton?.dispatchEvent(uiEvents.singleClick);
  await sleep(500);
  postmasterButton?.dispatchEvent(uiEvents.singleClick);
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

type FuseMatch = {
  toReplace: string;
  match: string;
};

function getClosestMatch(availableItems: string[], query: string): FuseMatch | null {
  const options = {
    includeScore: true,
    shouldSort: true,
  };
  const fuse = new Fuse(availableItems, options);
  const result = fuse.search(query);
  console.log({ result, query });

  if (isAcceptableResult(result)) {
    return { toReplace: query, match: result[0].item };
  }

  console.log("Couldn't find a match. Trying to find match by splitting the current query.");
  const splitQuery = query.split(' ');

  for (const split of splitQuery) {
    const splitResult = fuse.search(split);
    console.log({ splitResult, split });
    return isAcceptableResult(splitResult)
      ? { toReplace: split, match: splitResult[0].item }
      : { toReplace: '', match: '' };
  }

  return null;
}

function isAcceptableResult(result: Fuse.FuseResult<string>[]): boolean {
  return result.length > 0 && typeof result[0].score !== 'undefined' && result[0].score < 0.5;
}

async function populateSearchBar(searchInput: string, clearFirst: boolean = false): Promise<void> {
  if (!searchBar) searchBar = <HTMLInputElement>document.getElementsByName('filter')[0];
  if (searchBar) {
    const count = getVisibleItems().length;
    if (clearFirst) clearSearchBar();
    searchBar.value += ' ' + searchInput;
    console.log('Populating search bar with', searchBar.value);
    searchBar?.dispatchEvent(uiEvents.input);
    await sleep(50);
    searchBar?.focus();
    searchBar?.dispatchEvent(uiEvents.enter);

    await waitForSearchToUpdate(count);
  }
}

function clearSearchBar() {
  console.log('Clearing search');
  const clearButton = document.querySelector('.filter-bar-button[title^=Clear]');
  clearButton?.dispatchEvent(uiEvents.singleClick);
}

function handleShortcutPress() {
  if (!speechService?.recognizing) {
    speechService?.startListening();
  } else {
    speechService?.stopListening();
  }
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.log({ request });
  if (request.dimShortcutPressed) {
    sendResponse({ ack: 'Acknowledged.' });
    handleShortcutPress();
    return;
  }
  if (request === 'shortcut updated') {
    await getCustomCommands();
    sendResponse({ ack: 'Acknowledged.' });
  }
  if (request === 'listening options updated') {
    await getAlwaysListeningOptions();
  }
});

async function getCustomCommands() {
  const commands = await retrieve('commands', DEFAULT_COMMANDS);
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

async function getAlwaysListeningOptions() {
  const options: AlwaysListening = await retrieve('alwaysListening', DEFAULT_ALWAYS_LISTENING);
  console.log({ options });
  // if (speechService) speechService.stopListening();
  // if (options.active) speechService = new SpeechService(options);
  if (annyang) {
    console.log('initializing annyang');
    annyang.start({ autoRestart: options.active, continuous: options.active });
    annyang.addCallback('result', (userSaid: string, commandText: string, results: string[]) => {
      console.log({ userSaid, commandText, results });
      // parseSpeech(userSaid ?? '');
    });
    annyang.debug(true);
  }
}

function createMicDiv() {
  const imageUrl = chrome.runtime.getURL('icons/icon_large.png');
  const betaClass = window.location.hostname.startsWith('beta') ? 'beta' : '';
  const voiceDimDiv = document.createElement('div');
  voiceDimDiv.id = 'voiceDim';
  voiceDimDiv.innerHTML = `
    <div class="container">
      <div class="textContainer">
        <span id="transcript"></span>
      </div>
      <div class="${betaClass} imageContainer">
        <img src="${imageUrl}" />
      </div>
    </div>
  `;

  document.body.appendChild(voiceDimDiv);

  const imageDiv = document.querySelector('#voiceDim .imageContainer');
  imageDiv?.addEventListener('click', () => {
    handleShortcutPress();
  });
}

function createHelpDiv() {
  const voiceDimHelp = document.createElement('div');
  voiceDimHelp.id = 'voiceDimHelp';
  voiceDimHelp.className = 'voiceDimHelp';
  voiceDimHelp.innerHTML = `<span class="questionMark">?</span>`;
  voiceDimHelp.addEventListener('click', () => chrome.runtime.sendMessage('showOptions'));

  document.body.appendChild(voiceDimHelp);
}

// function createHelpModal() {}
// function showHelpModal() {}

async function getPerks() {
  const response = await fetch(
    'https://raw.githubusercontent.com/DestinyItemManager/d2ai-module/master/voice-dim-valid-perks.json'
  );
  knownPerks = await response.json();
  console.log({ knownPerks });
}

function init() {
  getPerks();
  getCustomCommands();
  getAlwaysListeningOptions();
  createMicDiv();
  createHelpDiv();
}

window.addEventListener('load', init);
