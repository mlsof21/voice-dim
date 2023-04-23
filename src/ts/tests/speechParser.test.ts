import { SpeechParser } from '../speechParser';

describe('SpeechParser does things correctly', () => {
  it('gets the correct perks', () => {
    const knownPerks = ['Outlaw', 'Firefly'];
    const expectedPerkQuery = 'perkname:"Outlaw" perkname:"Firefly"';
    const speechParser = new SpeechParser(knownPerks);
    const speechHeard = 'with outlaw and firefly';
    const result = speechParser.getPerkQuery(speechHeard);

    expect(result).toBe(expectedPerkQuery);
  });
});
