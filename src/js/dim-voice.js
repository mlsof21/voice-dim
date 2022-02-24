// get html elements
let searchBar = document.getElementsByName('filter').length > 0 ? document.getElementsByName('filter')[0] : null;
let dblClick = new Event('dblclick', {
  bubbles: true,
  cancelable: true,
  view: window
});

let inputEvent = new Event("input", { bubbles: true });
let enterEvent = new KeyboardEvent("keydown", { bubbles: true, which: 13, key: "enter" });

function setHtmlElements() {
  searchBar = document.getElementsByName('filter').length > 0 ? document.getElementsByName('filter')[0] : null;
  observer.disconnect();
}

function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
  const prototype = Object.getPrototypeOf(element);
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

  if (valueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value);
  } else {
    valueSetter.call(element, value);
  }
}



const weaponTypeQueries = {
  "auto rifle": "is:autorifle",
  "autorifle": "is:autorifle",
  "hand cannon": "is:handcannon",
  "pulse rifle": "is:pulserifle",
  "scout rifle": "is:scoutrifle",
  "sidearm": "is:sidearm",
  "submachine gun": "is:submachinegun",
  "bow": "is:bow",
  "shotgun": "is:shotgun",
  "sniper rifle": "is:sniperrifle",
  "fusion rifle": "is:fusionrifle",
  "trace rifle": "is:tracerifle",
  "grenade launcher": "is:grenadelauncher",
  "rocket launcher": "is:rocketlauncher",
  "linear fusion rifle": "is:linearfusionrifle",
  "machinegun": "is:machinegun",
  "machine gun": "is:machinegun",
  "sword": "is:sword",
}

const energyTypeQueries = {
  "arc": "is:arc",
  "solar": "is:solar",
  "void": "is:void",
  "stasis": "is:stasis",
}

const weaponSlotQueries = {
  "kinetic": "is:kinetic",
  "energy": "is:energy",
  "power": "is:power",
  "heavy": "is:power"
}

function parseSpeech(transcript) {
  console.log("parsing", transcript);
  let query = transcript.substring(3).trim();
  if (query.indexOf('transfer') === 0) {
    query = query.substring(8).toLowerCase().trim();
    // const weaponQueries = Object.keys(weaponTypeQueries);
    // const energyQueries = Object.keys(energyTypeQueries);
    // const slotQueries = Object.keys(weaponSlotQueries);

    const splitQuery = query.split(' ');
    let fullQuery = '';
    for (const weaponType of Object.keys(weaponTypeQueries)) {
      if (query.includes(weaponType)) {
        fullQuery += weaponTypeQueries[weaponType] + " ";
        break;
      }
    }

    for (const energyType of Object.keys(energyTypeQueries)) {
      const search = `\\b${energyType}\\b`;
      const re = new RegExp(search, 'g');
      if (query.search(re) >= 0) {
        fullQuery += energyTypeQueries[energyType];
        break;
      }
    }

    for (const slotType of Object.keys(weaponSlotQueries)) {
      if (query.includes(slotType)) {
        fullQuery += weaponSlotQueries[slotType] + " ";
        break;
      }
    }

    fullQuery = fullQuery.trim();

    if (fullQuery === "") {
      const availableItems = getAllTransferableItems();
      const itemToGet = getClosestMatch(availableItems, query);
      const itemDiv = document.querySelector(`[title*="${itemToGet}" i`);
      if (itemDiv) {
        itemDiv.dispatchEvent(dblClick);
      }
    }
    else {
      console.log("Full query being sent to DIM: " + fullQuery);
      transferByWeaponTypeQuery(fullQuery);
    }

  }

}

const transferableItemClassNames = [
  "KineticSlot",
  "Energy",
  "Power",
  "Helmet",
  "Gauntlets",
  "Chest",
  "Leg",
  "ClassItem"
]

function getAllTransferableItems() {
  const items = [];
  for (const className of transferableItemClassNames) {
    const result = document.querySelectorAll(`.item-type-${className} .item`);
    result.forEach(item => {
      const split = item.title.split('\n');
      items.push(split[0]);
    });
  }

  return items;
}

function getClosestMatch(availableItems, query) {
  const options = {
    includeScore: true
  }

  const fuse = new Fuse(availableItems, options)

  const result = fuse.search(query);
  console.log({ result, query });
  return result.length > 0 ? result[0].item : "";
}

function transferByWeaponTypeQuery(searchInput) {
  if (searchBar) {
    // setNativeValue(searchBar, searchInput);
    searchBar.value = searchInput;
    const inputFunc = function () {
      searchBar.dispatchEvent(inputEvent);
    }

    const enterFunc = function () {
      searchBar.dispatchEvent(enterEvent);
    }

    const transferFunc = function () {
      const filteredItems = [...document.querySelectorAll("div.item")].filter(x => window.getComputedStyle(x, null).opacity > .2);
      console.log(filteredItems);
      if (filteredItems.length > 0) {
        filteredItems[0].dispatchEvent(dblClick);
      }
    }
    const actions = [{ func: inputFunc, timeout: 500 }, { func: enterFunc, timeout: 500 }, {
      func: transferFunc, timeout: 2000
    }];

    let totalTimeout = 0;
    for (let i = 0; i < actions.length; i++) {
      totalTimeout += actions[i].timeout;
      setTimeout(actions[i].func, totalTimeout);
    }
  }
}

if (!window.webkitSpeechRecognition) {
  console.log('Sorry this will work only in Chrome for now...');
}
const magic_word = 'dim';

// navigator.mediaDevices.getUserMedia({audio: true})
var SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;


// initialize our SpeechRecognition object
var recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.interimResults = false;
// recognition.maxAlternatives = 1;
recognition.continuous = true;
let recognizing = false;

recognition.onerror = (e) => {
  console.error("Error with speech recognition:", e)
}

recognition.onresult = e => {
  // console.log({e});
  var transcripts = [].concat.apply([], [...e.results].map(res => [...res].map(alt => alt.transcript)));
  if (transcripts.some(t => t.indexOf(magic_word) > -1)) {
    const fullTranscript = transcripts.join('');
    parseSpeech(fullTranscript);
    stopSpeech();
  }
  else {
    console.log('understood ' + JSON.stringify(transcripts));
  }
}
// called when we detect silence
recognition.onspeechend = () => {
  if (recognizing) {
    stopSpeech();
  }
}

// called when we detect sound
function startSpeech() {
  recognizing = true;
  console.time("listening");
  console.timeLog("listening");
  try { // calling it twice will throw...
    console.log("starting speech recognition");
    showListeningNotification();
    recognition.start();
  }
  catch (e) { }
}

function stopSpeech() {
  console.log("stopping speech recognition");
  recognition.stop();
  console.timeEnd("listening");
  recognizing = false;
}

function showListeningNotification() {
  console.log("showing Listening notification");
  chrome.runtime.sendMessage('', {
    type: 'notification'
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(
    sender.tab
      ? "from a content script:" + sender.tab.url
      : "from the extension"
  );
  if (request.dimShouldListen === "DIM listen shortcut has been triggered.")
    sendResponse({ ack: "Acknowledged." });
  startSpeech();
  return true;
});

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return;

    for (let i = 0; i < mutation.addedNodes.length; i++) {
      let node = mutation.addedNodes[i];
      // console.log({ node })
      if (node.className && node.className.toLowerCase() == "search-link") {
        setHtmlElements();
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