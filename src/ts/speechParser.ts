import { debugLog } from './common';
import Fuse from 'fuse.js';
import {
  ammoTypeQueries,
  armorTypeQueries,
  energyTypeQueries,
  otherQueries,
  rarityQueries,
  weaponSlotQueries,
  weaponTypeQueries,
} from './maps';

export type FuseMatch = {
  toReplace: string;
  match: string;
};

export class SpeechParser {
  knownPerks: string[];

  constructor(_knownPerks: string[]) {
    this.knownPerks = _knownPerks;
  }

  checkForGenericTerms(queries: Record<string, string>, query: string) {
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

  getClosestMatch(availableItems: string[], query: string): FuseMatch | null {
    const options = {
      includeScore: true,
      shouldSort: true,
    };
    const fuse = new Fuse(availableItems, options);
    const result = fuse.search(query);
    debugLog('voice dim', { result, query });

    if (this.isAcceptableResult(result)) {
      return { toReplace: query, match: result[0].item };
    }

    debugLog('voice dim', "Couldn't find a match. Trying to find match by splitting the current query.");
    const splitQuery = query.split(' ');

    for (const split of splitQuery) {
      const splitResult = fuse.search(split);
      debugLog('voice dim', { splitResult, split });
      return this.isAcceptableResult(splitResult)
        ? { toReplace: split, match: splitResult[0].item }
        : { toReplace: '', match: '' };
    }

    return null;
  }

  isAcceptableResult(result: Fuse.FuseResult<string>[]): boolean {
    return result.length > 0 && typeof result[0].score !== 'undefined' && result[0].score < 0.5;
  }

  getGenericQuery(query: string) {
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
      genericQuery += this.checkForGenericTerms(gq, query);
    }
    return genericQuery.trim();
  }

  getPerkQuery(query: string) {
    let perkQuery = '';
    const splitPerkNames = query
      .split(' and ')
      .map((x) => {
        return x.trim();
      })
      .filter((x) => x !== '');
    const perkNames = [];
    for (const perkName of splitPerkNames) {
      const closestPerk = this.getClosestMatch(this.knownPerks, perkName);
      if (closestPerk && closestPerk.match !== '') perkNames.push(`perkname:"${closestPerk.match}"`);
    }
    perkQuery = perkNames.join(' ');
    return perkQuery;
  }
}
