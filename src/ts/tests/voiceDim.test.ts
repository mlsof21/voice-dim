/**
 * @jest-environment jsdom
 */

//ts-ignore
const { Corti } = require('../../../node_modules/corti/src/corti');
Corti.patch();
import { chrome } from 'jest-chrome';
import { getPerkQuery } from '../voiceDim';

beforeAll(() => {});

test('perks are parsed correctly', () => {
  expect(getPerkQuery('with outlaw and firefly')).toBe('perkname:"Outlaw" perkname:"Firefly"');
});
