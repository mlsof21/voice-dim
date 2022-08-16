const origConsoleLog = console.log;

console.log = function () {
  args = [];
  args.push('[dim-voice]');
  for (let i = 0; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  origConsoleLog.apply(console, args);
};

// get html elements
let searchBar =
  document.getElementsByName('filter').length > 0
    ? document.getElementsByName('filter')[0]
    : null;

const singleClick = new Event('click', {
  bubbles: true,
  cancelable: true,
  view: window,
});

const dblClick = new Event('dblclick', {
  bubbles: true,
  cancelable: true,
  view: window,
});

const inputEvent = new Event('input', { bubbles: true });

const enterEvent = new KeyboardEvent('keydown', {
  bubbles: true,
  which: 13,
  key: 'Enter',
});

const escapeEvent = new KeyboardEvent('keydown', {
  bubbles: true,
  which: 27,
  key: 'Escape',
});

let knownPerks = [];

function setHtmlElements() {
  searchBar =
    document.getElementsByName('filter').length > 0
      ? document.getElementsByName('filter')[0]
      : null;
  if (debugging) {
    const searchLink = document.getElementsByClassName('search-link')[0];
    const debugBar = document.createElement('input');
    debugBar.type = 'text';
    debugBar.id = 'debugInput';
    searchLink.appendChild(debugBar);
    const debugButton = document.createElement('button');
    debugButton.id = 'debugButton';
    debugButton.innerText = 'submit';
    debugButton.onclick = () => {
      const value = document.getElementById('debugInput').value;
      parseSpeech(value);
    };
    searchLink.appendChild(debugButton);
  }
  observer.disconnect();
}

function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    'value'
  ).set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
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

const potentialActions = {
  transfer: handleItemTypeQuery,
  'start farming': handleStartFarmingMode,
  'stop farming': handleStopFarmingMode,
  'equip max power': handleEquipMaxPower,
  'equip loadout': handleEquipLoadout,
  'equip load out': handleEquipLoadout,
  'collect post master': handleCollectPostmaster,
  'collect postmaster': handleCollectPostmaster,
};

function parseSpeech(transcript) {
  console.log('parsing', transcript);
  let query = transcript.trim();
  const closestMatch = getClosestMatch(Object.keys(potentialActions), query);
  console.log({ closestMatch });

  query = query.replace(closestMatch.item, '').trim();
  potentialActions[closestMatch.item].call(this, query);
}

function handleItemTypeQuery(query) {
  query = query.replace('transfer', '');
  console.log('In handleItemTypeQuery, handling', query);

  let fullQuery = getFullQuery(query);

  const withQuery = getWithQuery(query);

  if (fullQuery === '') {
    console.log('looking for', query);
    let timeout = 100;
    if (withQuery !== '') {
      populateSearchBar(withQuery);
      timeout = 2000;
    }
    setTimeout(() => {
      const availableItems = getAllTransferableItems();
      const itemToGet = getClosestMatch(Object.keys(availableItems), query);
      const itemDiv = availableItems[itemToGet.item];

      if (itemDiv) {
        itemDiv.dispatchEvent(dblClick);
      }
    }, timeout);
  } else {
    if (withQuery !== '') {
      fullQuery += ` ${withQuery}`;
    }
    fullQuery += ' -is:incurrentchar';

    console.log('Full query being sent to DIM: ' + fullQuery);
    transferByWeaponTypeQuery(fullQuery);
  }
}

function getFullQuery(query) {
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

function getWithQuery(query) {
  let withQuery = '';
  if (query.includes(' with ')) {
    [query, perkNamesToSearch] = query.split(' with ').map((x) => {
      return x.trim();
    });
    const splitPerkNames = perkNamesToSearch.split(' and ').map((x) => {
      return x.trim();
    });
    let perkNames = [];
    for (let perkName of splitPerkNames) {
      const closestPerk = getClosestMatch(knownPerks, perkName);
      perkNames.push(`perkname:"${closestPerk.item}"`);
    }
    withQuery = perkNames.join(' ');
  }
  return withQuery;
}

function handleStartFarmingMode() {
  console.log('Starting farming mode');
  const currentCharacter = document.querySelector('.character.current');
  currentCharacter.dispatchEvent(singleClick);
  setTimeout(() => {
    const farmingSpan = [
      ...document.querySelectorAll('.loadout-menu span'),
    ].filter((x) => x.textContent.includes('Farming'))[0];
    farmingSpan.dispatchEvent(singleClick);
  }, 500);
}

function handleStopFarmingMode() {
  const stopButton = document.querySelector('#item-farming button');
  stopButton.dispatchEvent(singleClick);
}

function handleEquipMaxPower() {
  const currentCharacter = document.querySelector('.character.current');
  currentCharacter.dispatchEvent(singleClick);
  setTimeout(() => {
    const maxPowerSpan = [
      ...document.querySelectorAll('.loadout-menu span'),
    ].filter((x) => x.textContent.includes('Max Power'))[0];
    maxPowerSpan.dispatchEvent(singleClick);
  }, 500);
}

function handleEquipLoadout(loadoutName) {
  console.log('Equipping loadout', loadoutName);
  if (
    loadoutName.includes('equip loadout') ||
    loadoutName.includes('equip load out')
  )
    loadoutName = loadoutName
      .replace('equip loadout', '')
      .replace('equip load out', '');
  const currentCharacter = document.querySelector('.character.current');
  currentCharacter.dispatchEvent(singleClick);
  setTimeout(() => {
    const availableLoadoutNames = [
      ...document.querySelectorAll(
        '.loadout-menu li > span[title]:first-child'
      ),
    ].map((x) => x.textContent);
    const loadoutResult = getClosestMatch(availableLoadoutNames, loadoutName);
    const loadoutToEquip = loadoutResult.item;
    const loadoutToEquipSpan = document.querySelector(
      `.loadout-menu span[title="${loadoutToEquip}"]`
    );
    loadoutToEquipSpan.dispatchEvent(singleClick);
  }, 500);
}

function handleCollectPostmaster() {
  const postmasterButton = document.querySelector(
    '[class^="PullFromPostmaster"]'
  );
  postmasterButton.dispatchEvent(singleClick);
  setTimeout(() => postmasterButton.dispatchEvent(singleClick), 500);
}

function checkForGenericTerms(queries, query) {
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

function getAllTransferableItems() {
  const items = {};
  for (const labelName of transferableItemAriaLabels) {
    const result = document.querySelectorAll(
      `[aria-label="${labelName}"] .item`
    );
    const filteredItems = getVisibleItems(result);
    filteredItems.forEach((item) => {
      const split = item.title.split('\n');
      const sanitized = split[0].replaceAll('.', '');
      items[sanitized] = item;
    });
  }

  return items;
}

function getClosestMatch(availableItems, query) {
  const options = {
    includeScore: true,
    shouldSort: true,
  };
  console.log({ availableItems });

  const fuse = new Fuse(availableItems, options);

  const result = fuse.search(query);
  console.log({ result, query });

  if (result.length > 0) {
    return result[0];
  }

  console.log(
    "Couldn't find a match. Trying to find match by splitting the current query."
  );
  const splitQuery = query.split(' ');

  for (const split of splitQuery) {
    const splitResult = fuse.search(split);
    console.log({ splitResult, split });
    return splitResult.length > 0 ? splitResult[0] : '';
  }

  return result.length > 0 ? result[0] : '';
}

function populateSearchBar(searchInput) {
  console.log('Populating search bar with', searchInput);
  if (!searchBar) searchBar = document.getElementsByName('filter')[0];
  if (searchBar) {
    // setNativeValue(searchBar, searchInput);
    searchBar.value = searchInput;
    const inputFunc = function () {
      searchBar.dispatchEvent(inputEvent);
    };

    const enterFunc = function () {
      searchBar.focus();
      setTimeout(() => {}, 500);
      searchBar.dispatchEvent(enterEvent);
    };
    const escapeFunc = function () {
      searchBar.focus();
      setTimeout(() => {}, 500);
      searchBar.dispatchEvent(escapeEvent);
    };
    const actions = [
      { func: inputFunc, timeout: 100 },
      { func: enterFunc, timeout: 1000 },
      { func: escapeFunc, timeout: 1000 },
    ];
    performUiInteraction(actions);
  }
}

function performUiInteraction(actions) {
  let totalTimeout = 0;
  for (let i = 0; i < actions.length; i++) {
    totalTimeout += actions[i].timeout;
    setTimeout(actions[i].func, totalTimeout);
  }
}

function getVisibleItems(items) {
  if (!items) items = document.querySelectorAll('div.item');
  return [...items].filter(
    (x) => window.getComputedStyle(x, null).opacity > 0.2
  );
}

function transferByWeaponTypeQuery(searchInput) {
  populateSearchBar(searchInput);

  const transferFunc = function () {
    const filteredItems = getVisibleItems();
    console.log(filteredItems);
    if (filteredItems.length > 0) {
      filteredItems[0].dispatchEvent(dblClick);
    }
  };
  const escapeFunc = function () {
    searchBar.focus();
    setTimeout(() => {}, 500);
    searchBar.dispatchEvent(escapeEvent);
  };
  const actions = [
    { func: transferFunc, timeout: 2000 },
    { func: escapeFunc, timeout: 1000 },
  ];

  performUiInteraction(actions);
}

const dimWords = ['dim', 'damn', 'then', 'them'];
const debugging = true;

if (!window.webkitSpeechRecognition) {
  console.log('Sorry this will work only in Chrome for now...');
}

// navigator.mediaDevices.getUserMedia({audio: true})
var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;

// initialize our SpeechRecognition object
var recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.continuous = false;
let recognizing = false;

recognition.onerror = (e) => {
  console.error('Error with speech recognition:', e);
  stopSpeech();
};

recognition.onresult = (e) => {
  const transcript = e.results[0][0].transcript.toLowerCase();
  if (dimWords.some((word) => transcript.startsWith(word))) {
    parseSpeech(removeMagicWord(transcript));
    stopSpeech();
  } else {
    console.log('no magic word, understood ', transcript);
    parseSpeech(transcript);
    stopSpeech();
  }
};

// called when we detect silence
recognition.onspeechend = () => {
  if (recognizing) {
    stopSpeech();
  }
};

function removeMagicWord(transcript) {
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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? 'from a content script:' + sender.tab.url
      : 'from the extension'
  );
  if (request.dimShortcutPressed) {
    sendResponse({ ack: 'Acknowledged.' });
    if (!recognizing) {
      startSpeech();
    } else {
      stopSpeech();
    }
  }
  return true;
});

async function getManifest() {
  const response = await fetch(
    'https://www.bungie.net/Platform/Destiny2/Manifest/',
    {
      headers: { 'x-api-key': '897a3b5426fb4564b05058cad181b602' },
    }
  );
  const responseJson = await response.json();

  const jsonWorld = responseJson['Response']['jsonWorldContentPaths']['en'];
  const fullManifest = await fetch('https://www.bungie.net' + jsonWorld);
  manifest = await fullManifest.json();

  createMaps();
}

function createMaps() {
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

  for (const hash in manifest.DestinyInventoryItemDefinition) {
    const item = manifest.DestinyInventoryItemDefinition[hash];

    // Only map weapons
    if (item.itemType === 19) {
      plugCategoryIdentifier =
        'plug' in item ? item.plug.plugCategoryIdentifier : '';
      if (
        validPlugs.includes(plugCategoryIdentifier) &&
        item.displayProperties.name !== ''
      ) {
        knownPerks.push(item.displayProperties.name.toLowerCase());
      }
    }
  }
  knownPerks = [...new Set(knownPerks.sort())];
  console.log({ knownPerks });
}

getManifest();

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return;

    for (let i = 0; i < mutation.addedNodes.length; i++) {
      let node = mutation.addedNodes[i];
      if (node.className && node.className.toLowerCase() == 'search-link') {
        // setHtmlElements();
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
