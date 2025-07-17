import SpeechParser from '../speechParser';

describe('SpeechParser does things correctly', () => {
  it('gets the correct perks', () => {
    const knownPerks = ['Outlaw', 'Firefly'];
    const expectedPerkQuery = 'perkname:"Outlaw" perkname:"Firefly"';
    const speechHeard = 'with outlaw and firefly';
    const result = SpeechParser.getPerkQuery(speechHeard, knownPerks);

    expect(result).toBe(expectedPerkQuery);
  });

  it('gets the correct perks', () => {
    const knownPerks = ['Outlaw', 'Firefly'];
    const expectedPerkQuery = 'perkname:"Outlaw" perkname:"Firefly"';
    const speechHeard = 'with outlaw and firefly';
    const result = SpeechParser.getPerkQuery(speechHeard, knownPerks);

    expect(result).toBe(expectedPerkQuery);
  });
});
