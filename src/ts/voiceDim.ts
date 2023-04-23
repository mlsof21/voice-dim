import {
  AlwaysListening,
  debugLog,
  DEFAULT_ALWAYS_LISTENING,
  DEFAULT_COMMANDS,
  infoLog,
  logs,
  retrieve,
} from './common';
import {
  ammoTypeQueries,
  armorTypeQueries,
  energyTypeQueries,
  otherQueries,
  rarityQueries,
  weaponSlotQueries,
  weaponTypeQueries,
} from './maps';
import { SpeechParser } from './speechParser';
import UiInteractor from './uiInteractor';

const annyang = require('annyang');

// Globals
let knownPerks: string[] = [];

let listeningOptions: AlwaysListening;
let mappedCommands: Record<string, string> = {};

const uiInteractor = new UiInteractor();
const speechParser = new SpeechParser(knownPerks);

type ActionFunction = Record<
  string,
  (() => void) | ((loadoutName: string) => void) | ((query: string, action: string) => void)
>;

const potentialActions: ActionFunction = {
  transfer: handleItemMovement,
  equip: handleItemMovement,
  store: uiInteractor.handleStoreItem,
  startFarming: uiInteractor.handleStartFarmingMode,
  stopFarming: uiInteractor.handleStopFarmingMode,
  maxPower: uiInteractor.handleEquipMaxPower,
  loadout: uiInteractor.handleEquipLoadout,
  postmaster: uiInteractor.handleCollectPostmaster,
};

export async function parseSpeech(this: any, transcript: string) {
  await uiInteractor.clearSearchBar();
  let query = transcript.trim();
  const closestMatch = speechParser.getClosestMatch(Object.keys(mappedCommands), query);

  if (!closestMatch) {
    infoLog('voice dim', "Couldn't determine correct action");
    return;
  }
  const closestAction = speechParser.getClosestMatch(Object.keys(potentialActions), mappedCommands[closestMatch.match]);
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
    await uiInteractor.clearSearchBar();
    return;
  }
  switch (action) {
    case 'transfer':
      await uiInteractor.transferItem(itemToMove);
      break;
    case 'equip':
      uiInteractor.equipItem(itemToMove);
      break;
    default:
      break;
  }
  await uiInteractor.clearSearchBar();
}

async function getItemToMove(query: string): Promise<Element | null> {
  let itemToMove: Element | null = null;
  let splitQuery = query.split(' with ').map((x) => x.trim());
  let nonPerkQuery = speechParser.getGenericQuery(splitQuery[0]);

  const perkQuery = splitQuery.length > 1 && splitQuery[1] !== '' ? speechParser.getPerkQuery(splitQuery[1]) : '';

  // getting a specific weapon
  if (nonPerkQuery === '') {
    const availableItems = uiInteractor.getAllTransferableItems();
    const itemToGet = speechParser.getClosestMatch(Object.keys(availableItems), splitQuery[0]);
    if (!itemToGet) return null;
    const fullName = availableItems[itemToGet.match].name;
    debugLog('voice dim', { itemToGet });
    await uiInteractor.populateSearchBar(`${perkQuery} name:"${fullName}"`.trim());
    const visibleItems = uiInteractor.getVisibleItems();
    itemToMove = visibleItems[0];
  }
  // Getting a generic weapon (solar grenade launcher, kinetic handcannon, etc.)
  else {
    nonPerkQuery += ` ${perkQuery} -is:incurrentchar -is:postmaster`;
    await uiInteractor.populateSearchBar(nonPerkQuery);
    const filteredItems = uiInteractor.getVisibleItems();
    if (filteredItems.length > 0) {
      itemToMove = filteredItems[0];
    }
  }
  return itemToMove;
}

function handleShortcutPress() {
  if (!annyang.isListening()) {
    annyang.start();
    updateMicIcon('listening');
  } else {
    annyang.abort();
    updateMicIcon('notListening');
  }
}

function updateMicIcon(newMode: string) {
  const micIcon = <HTMLElement>document.querySelector('.imageContainer > img');
  const voiceDimContainer = <HTMLElement>document.getElementById('voiceDim');
  if (newMode === 'listening') {
    micIcon.style.filter = 'hue-rotate(90deg)';
    voiceDimContainer.classList.add('pulse');
  } else {
    micIcon.style.filter = '';
    voiceDimContainer.classList.remove('pulse');
  }
}

function initializeShortcutListening() {
  annyang.addCallback('result', (userSaid: string[]) => {
    debugLog('shortcut', userSaid);
    const transcript = userSaid[0].trim().toLowerCase();
    infoLog('voice dim', 'Heard', transcript);
    uiInteractor.updateUiTranscript(transcript, true);
    parseSpeech(transcript);
    updateMicIcon('notListening');
    annyang.abort();
    setTimeout(() => {
      uiInteractor.updateUiTranscript('', false);
    }, 5000);
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
            uiInteractor.updateUiTranscript(transcript, true);
            parseSpeech(transcript);
            actionPerformed = true;
            setTimeout(() => uiInteractor.updateUiTranscript('', false), 7000);
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
  if (request === 'get logs') {
    sendResponse({
      ack: 'Acknowledged.',
      logs: logs.length > 100 ? logs.slice(logs.length - 101, logs.length - 1) : logs,
    });
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
