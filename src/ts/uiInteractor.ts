import { debugLog, infoLog, sleep } from './common';
import { SpeechParser } from './speechParser';

class UiInteractor {
  speechParser: SpeechParser;

  searchBar: HTMLInputElement | null;
  textContainer: HTMLDivElement | null;
  transcriptTextElement: HTMLElement | null;
  transferableItemAriaLabels = [
    'Kinetic Weapons',
    'Energy Weapons',
    'Power Weapons',
    'Helmet',
    'Gauntlets',
    'Chest Armor',
    'Leg Armor',
    'Class Armor',
  ];
  uiEvents = {
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

  constructor() {
    this.speechParser = new SpeechParser([]);

    this.searchBar =
      document.getElementsByName('filter').length > 0
        ? <HTMLInputElement>document.getElementsByName('filter')[0]
        : null;
    this.textContainer = document.querySelector('.textContainer');
    this.transcriptTextElement = document.getElementById('transcript');
  }

  updateUiTranscript(transcript: string, show: boolean) {
    if (this.textContainer && this.transcriptTextElement) {
      this.textContainer.style.display = show ? 'flex' : 'none';
      this.transcriptTextElement.innerText = transcript;
    }
  }

  async transferItem(item: Element) {
    item.dispatchEvent(this.uiEvents.singleClick);
    const expandCollapseButton = await this.waitForElementToDisplay('.item-popup [title^="Expand or collapse"]');
    if (!document.querySelector(".item-popup [title*='[P]']")) {
      expandCollapseButton?.dispatchEvent(this.uiEvents.singleClick);
    }
    const storeDiv = await this.waitForElementToDisplay(".item-popup [title*='[P]']", 500);
    storeDiv?.dispatchEvent(this.uiEvents.singleClick);
  }

  equipItem(item: Element) {
    item.dispatchEvent(this.uiEvents.dblClick);
  }

  async openCurrentCharacterLoadoutMenu() {
    const currentCharacter = document.querySelector('.character.current');
    currentCharacter?.dispatchEvent(this.uiEvents.singleClick);
    await this.waitForElementToDisplay('.loadout-menu');
  }

  async handleEquipLoadout(loadoutName: string) {
    infoLog('voice dim', 'Equipping loadout', loadoutName);
    await this.openCurrentCharacterLoadoutMenu();
    const availableLoadoutNames = this.getLoadoutNames();
    const loadoutToEquip = this.speechParser.getClosestMatch(availableLoadoutNames, loadoutName);
    const loadoutToEquipSpan = document.querySelector(`.loadout-menu span[title="${loadoutToEquip?.match}"]`);
    loadoutToEquipSpan?.dispatchEvent(this.uiEvents.singleClick);
  }

  async handleCollectPostmaster() {
    const xpath = "//span[contains(text(),'Collect Postmaster')]";
    const postmasterButton = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    postmasterButton?.dispatchEvent(this.uiEvents.singleClick);
  }

  async populateSearchBar(searchInput: string): Promise<void> {
    if (this.searchBar) {
      const count = this.getVisibleItems().length;
      const newValue = `${this.searchBar.value} ${searchInput.trim()}`.trim();
      this.searchBar.value = newValue;
      infoLog('voice dim', 'Populating search bar with', this.searchBar.value);
      await this.simulateSearchInput();

      await this.waitForSearchToUpdate(count);
    }
  }

  async simulateSearchInput() {
    this.searchBar?.dispatchEvent(this.uiEvents.input);
    await sleep(50);
    this.searchBar?.focus();
    this.searchBar?.dispatchEvent(this.uiEvents.enter);
    this.searchBar?.blur();
  }

  async clearSearchBar() {
    infoLog('voice dim', 'Clearing search bar');
    const clearButton = document.querySelector('.filter-bar-button[title^=Clear]');
    const initialCount = this.getVisibleItems().length;
    let waitForUpdate = false;
    clearButton?.dispatchEvent(this.uiEvents.singleClick);
    if (this.searchBar && this.searchBar?.value !== '') {
      this.searchBar.value = '';
      this.searchBar?.dispatchEvent(this.uiEvents.escape);
      this.searchBar?.blur();
      waitForUpdate = true;
    }
    if (waitForUpdate) await this.waitForSearchToUpdate(initialCount);
  }

  waitForSearchToUpdate(
    initialCount: number = Infinity,
    timeoutInMs: number = 3000,
    checkFrequencyInMs: number = 50
  ): Promise<void> {
    return new Promise((resolve) => {
      var startTimeInMs = Date.now();
      const loopSearch = () => {
        const count = this.getVisibleItems();
        if (count.length !== initialCount) {
          clearTimeout();
          return resolve();
        } else {
          setTimeout(function () {
            if (timeoutInMs && Date.now() - startTimeInMs > timeoutInMs) return;
            loopSearch();
          }, checkFrequencyInMs);
        }
      };
      loopSearch();
    });
  }

  getVisibleItems(items: NodeListOf<Element> | undefined = undefined): Element[] {
    if (!items) items = document.querySelectorAll('div.item');
    const result = Array.from(items).filter((item) => parseFloat(window.getComputedStyle(item).opacity) > 0.5);
    return result;
  }

  getAllTransferableItems(): Record<string, { name: string; item: Element }> {
    const items: Record<string, { name: string; item: Element }> = {};
    for (const labelName of this.transferableItemAriaLabels) {
      const result = document.querySelectorAll(`[aria-label="${labelName}"] .item`);
      const filteredItems = this.getVisibleItems(result);
      filteredItems.forEach((item) => {
        const split = (<HTMLElement>item).title.split('\n');
        const sanitized = split[0].replaceAll('.', '');
        items[sanitized] = { name: split[0], item };
      });
    }
    return items;
  }

  getLoadoutNames(): string[] {
    const loadoutNames: string[] = [];
    const loadoutSpans = document.querySelectorAll('.loadout-menu li > span[title]:first-child');
    loadoutSpans.forEach((span) => {
      if (span.textContent) loadoutNames.push(span.textContent);
    });
    return loadoutNames;
  }

  async waitForElementToDisplay(
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
              debugLog('voice dim', "couldn't find", selector);
              return reject();
            }
            loopSearch();
          }, checkFrequencyInMs);
        }
      })();
    });
  }

  async handleEquipMaxPower() {
    await this.openCurrentCharacterLoadoutMenu();
    const xpath = "//span[contains(text(),'Max Power')]";
    const maxPowerSpan = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
    maxPowerSpan?.dispatchEvent(this.uiEvents.singleClick);
  }

  handleStopFarmingMode() {
    const stopButton = document.querySelector('#item-farming button');
    stopButton?.dispatchEvent(this.uiEvents.singleClick);
  }

  async handleStartFarmingMode() {
    infoLog('voice dim', 'Starting farming mode');
    await this.openCurrentCharacterLoadoutMenu();
    const farmingSpan = document.querySelector('.loadout-menu ul li span');
    farmingSpan?.dispatchEvent(this.uiEvents.singleClick);
  }

  async handleStoreItem(query: string) {
    await this.populateSearchBar('is:incurrentchar');
    const availableItems = this.getAllTransferableItems();
    const itemToStore = this.speechParser.getClosestMatch(Object.keys(availableItems), query);
    if (!itemToStore || (itemToStore && itemToStore.match === '')) {
      await this.clearSearchBar();
      return;
    }
    const itemDiv = availableItems[itemToStore.match].item;
    itemDiv?.dispatchEvent(this.uiEvents.singleClick);
    const vaultDiv = await this.waitForElementToDisplay('.item-popup [title*="vault"]');
    vaultDiv?.dispatchEvent(this.uiEvents.singleClick);
    await this.clearSearchBar();
  }
}

export default UiInteractor;
