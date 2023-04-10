import Fuse from 'fuse.js';
import {
  AlwaysListening,
  debugLog,
  DEFAULT_ALWAYS_LISTENING,
  DEFAULT_COMMANDS,
  getVisibleItems,
  infoLog,
  retrieve,
  sleep,
  waitForElementToDisplay,
  waitForSearchToUpdate,
} from './common';

const annyang = require('annyang');

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
  'wish-listed': 'is:wishlist',
  wishlisted: 'is:wishlist',
  wishlist: 'is:wishlist',
  favorite: 'tag:favorite',
  keeper: 'tag:keep',
  junk: 'tag:junk',
  infusion: 'tag:infuse',
  archived: 'tag:archive',
  'not tagged': '-is:tagged',
  tagged: 'is:tagged',
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

let listeningOptions: AlwaysListening;
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

function updateUiTranscript(transcript: string, show: boolean) {
  const textDiv = document.querySelector('.textContainer');
  (<HTMLDivElement>textDiv).style.display = show ? 'flex' : 'none';
  const transcriptSpan = document.getElementById('transcript');
  if (transcriptSpan) transcriptSpan.innerText = transcript;
}

async function parseSpeech(this: any, transcript: string) {
  await clearSearchBar();
  let query = transcript.trim();
  const closestMatch = getClosestMatch(Object.keys(mappedCommands), query);

  if (!closestMatch) {
    infoLog('voice dim', "Couldn't determine correct action");
    return;
  }
  const closestAction = getClosestMatch(Object.keys(potentialActions), mappedCommands[closestMatch.match]);
  if (!closestAction) {
    infoLog('voice dim', "Couldn't determine correct action");
    return;
  }

  query = getNewQuery(query, closestMatch.match);
  await potentialActions[closestAction.match].call(this, query, closestAction.match);
}

function getNewQuery(query: string, phraseToReplace: string) {
  const phraseIndex = query.indexOf(phraseToReplace) + phraseToReplace.length;
  const firstSpace = query.indexOf(' ', phraseIndex);
  return query.substring(firstSpace + 1).trim();
}

async function handleStoreItem(query: string) {
  await populateSearchBar('is:incurrentchar');
  const availableItems = getAllTransferableItems();
  const itemToStore = getClosestMatch(Object.keys(availableItems), query);
  if (!itemToStore || (itemToStore && itemToStore.match === '')) {
    await clearSearchBar();
    return;
  }
  // probably not necessary since we're just using the element returned above
  // await populateSearchBar(`name:"${itemToStore?.match}"`);
  const itemDiv = availableItems[itemToStore.match].item;
  itemDiv?.dispatchEvent(uiEvents.singleClick);
  const vaultDiv = await waitForElementToDisplay('.item-popup [title*="vault"]');
  vaultDiv?.dispatchEvent(uiEvents.singleClick);
  await clearSearchBar();
}

// TODO: probably don't need this anymore
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
  infoLog('voice dim', 'in handleItemMovement', { query, action });
  const itemToMove = await getItemToMove(query);
  debugLog('voice dim', { itemToMove });
  if (!itemToMove) {
    await clearSearchBar();
    return;
  }
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
  await clearSearchBar();
}

async function getItemToMove(query: string): Promise<Element | null> {
  let itemToMove: Element | null = null;
  let splitQuery = query.split(' with ').map((x) => x.trim());
  let nonPerkQuery = getGenericQuery(splitQuery[0]);

  const perkQuery = splitQuery.length > 1 && splitQuery[1] !== '' ? getPerkQuery(splitQuery[1]) : '';

  // getting a specific weapon
  if (nonPerkQuery === '') {
    const availableItems = getAllTransferableItems();
    const itemToGet = getClosestMatch(Object.keys(availableItems), splitQuery[0]);
    if (!itemToGet) return null;
    const fullName = availableItems[itemToGet.match].name;
    debugLog('voice dim', { itemToGet });
    await populateSearchBar(`${perkQuery} name:"${fullName}"`.trim());
    const visibleItems = getVisibleItems();
    itemToMove = visibleItems[0];
  }
  // Getting a generic weapon (solar grenade launcher, kinetic handcannon, etc.)
  else {
    nonPerkQuery += ` ${perkQuery} -is:incurrentchar -is:postmaster`;
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
  const expandCollapseButton = await waitForElementToDisplay('.item-popup [title^="Expand or collapse"]');
  if (!document.querySelector(".item-popup [title*='[P]']")) {
    expandCollapseButton?.dispatchEvent(uiEvents.singleClick);
  }
  const storeDiv = await waitForElementToDisplay(".item-popup [title*='[P]']", 500);
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
  infoLog('voice dim', 'Starting farming mode');
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
  const xpath = "//span[contains(text(),'Max Power')]";
  const maxPowerSpan = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
  maxPowerSpan?.dispatchEvent(uiEvents.singleClick);
}

async function openCurrentCharacterLoadoutMenu() {
  const currentCharacter = document.querySelector('.character.current');
  currentCharacter?.dispatchEvent(uiEvents.singleClick);
  await waitForElementToDisplay('.loadout-menu');
}

async function handleEquipLoadout(loadoutName: string) {
  infoLog('voice dim', 'Equipping loadout', loadoutName);
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
  const xpath = "//span[contains(text(),'Collect Postmaster')]";
  const postmasterButton = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
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

function getAllTransferableItems(): Record<string, { name: string; item: Element }> {
  const items: Record<string, { name: string; item: Element }> = {};
  for (const labelName of transferableItemAriaLabels) {
    const result = document.querySelectorAll(`[aria-label="${labelName}"] .item`);
    const filteredItems = getVisibleItems(result);
    filteredItems.forEach((item) => {
      const split = (<HTMLElement>item).title.split('\n');
      const sanitized = split[0].replaceAll('.', '');
      items[sanitized] = { name: split[0], item };
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
  debugLog('voice dim', { result, query });

  if (isAcceptableResult(result)) {
    return { toReplace: query, match: result[0].item };
  }

  debugLog('voice dim', "Couldn't find a match. Trying to find match by splitting the current query.");
  const splitQuery = query.split(' ');

  for (const split of splitQuery) {
    const splitResult = fuse.search(split);
    debugLog('voice dim', { splitResult, split });
    return isAcceptableResult(splitResult)
      ? { toReplace: split, match: splitResult[0].item }
      : { toReplace: '', match: '' };
  }

  return null;
}

function isAcceptableResult(result: Fuse.FuseResult<string>[]): boolean {
  return result.length > 0 && typeof result[0].score !== 'undefined' && result[0].score < 0.5;
}

async function populateSearchBar(searchInput: string): Promise<void> {
  if (!searchBar) searchBar = <HTMLInputElement>document.getElementsByName('filter')[0];
  if (searchBar) {
    const count = getVisibleItems().length;
    const newValue = `${searchBar.value} ${searchInput.trim()}`.trim();
    searchBar.value = newValue;
    infoLog('voice dim', 'Populating search bar with', searchBar.value);
    await simulateSearchInput();

    await waitForSearchToUpdate(count);
  }
}

async function simulateSearchInput() {
  searchBar?.dispatchEvent(uiEvents.input);
  await sleep(50);
  searchBar?.focus();
  searchBar?.dispatchEvent(uiEvents.enter);
  searchBar?.blur();
}

async function clearSearchBar() {
  infoLog('voice dim', 'Clearing search bar');
  const clearButton = document.querySelector('.filter-bar-button[title^=Clear]');
  const initialCount = getVisibleItems().length;
  let waitForUpdate = false;
  clearButton?.dispatchEvent(uiEvents.singleClick);
  if (searchBar && searchBar?.value !== '') {
    searchBar.value = '';
    searchBar?.dispatchEvent(uiEvents.escape);
    searchBar?.blur();
    waitForUpdate = true;
  }
  if (waitForUpdate) await waitForSearchToUpdate(initialCount);
}

function handleShortcutPress() {
  if (!annyang.isListening()) {
    annyang.start();
  } else {
    annyang.abort();
  }
}

function initializeShortcutListening() {
  annyang.addCallback('result', (userSaid: string[]) => {
    debugLog('shortcut', userSaid);
    const transcript = userSaid[0].trim().toLowerCase();
    infoLog('voice dim', 'Heard', transcript);
    updateUiTranscript(transcript, true);
    parseSpeech(transcript);
    annyang.abort();
    setTimeout(() => updateUiTranscript('', false), 7000);
  });
}

function initializeAlwaysListening() {
  annyang.start({ autoRestart: listeningOptions.active, continuous: listeningOptions.active });
  annyang.addCallback('result', (userSaid?: string[] | undefined) => {
    debugLog('voice dim', { userSaid });
    if (userSaid) {
      let actionPerformed = false;
      for (let said of userSaid) {
        said = said.trim().toLowerCase();
        const ap = listeningOptions.activationPhrase.trim().toLowerCase();
        const phrases = [ap];

        if (ap.includes('dim')) phrases.push(ap.replace('dim', 'them'));

        for (let phrase of phrases) {
          // include a space intentionally
          if (said.includes(`${phrase} `)) {
            const transcript = said.split(`${phrase} `)[1];
            infoLog('voice dim', 'Heard', transcript);
            updateUiTranscript(transcript, true);
            parseSpeech(transcript);
            actionPerformed = true;
            setTimeout(() => updateUiTranscript('', false), 7000);
            break;
          }
        }
        if (actionPerformed) break;
      }
    }
  });
}

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  infoLog('voice dim', 'Message received', { request });
  if (request.dimShortcutPressed && !listeningOptions.active) {
    handleShortcutPress();
  }
  if (request === 'shortcut updated') {
    await getCustomCommands();
  }
  if (request === 'listening options updated') {
    await getAlwaysListeningOptions();
  }
  if (request === 'not on inventory page') {
    infoLog('voice dim', 'no longer on inventory page');
    stopVoiceDim();
  }
  if (request === 'on inventory page') {
    infoLog('voice dim', 'on inventory page');
    init();
  }
  sendResponse({ ack: 'Acknowledged.' });
  return true;
});

async function getCustomCommands() {
  const commands = await retrieve('commands', DEFAULT_COMMANDS);
  mappedCommands = reverseMapCustomCommands(commands);
  infoLog('voice dim', { commands, mappedCommands });
}

function reverseMapCustomCommands(commands: Record<string, string[]>) {
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
  listeningOptions = await retrieve('alwaysListening', DEFAULT_ALWAYS_LISTENING);
  infoLog('voice dim', { listeningOptions });
  startListening();
  // annyang.debug(true);
}

function startListening() {
  annyang.abort();
  annyang.removeCallback();
  if (listeningOptions.active) {
    initializeAlwaysListening();
  } else {
    initializeShortcutListening();
  }
}

function stopListening() {
  annyang.abort();
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
  infoLog('voice dim', { knownPerks });
}

function init() {
  if (window.location.href.includes('inventory')) {
    getPerks();
    getCustomCommands();
    getAlwaysListeningOptions();
    if (!document.getElementById('voiceDim')) createMicDiv();
    if (!document.getElementById('voiceDimHelp')) createHelpDiv();
  }
}

window.addEventListener('load', init);

function stopVoiceDim() {
  const voiceDimDiv = document.getElementById('voiceDim');
  if (voiceDimDiv) voiceDimDiv.remove();
  const voiceDimHelp = document.getElementById('voiceDimHelp');
  if (voiceDimHelp) voiceDimHelp.remove();

  stopListening();
}
