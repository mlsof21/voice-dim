// Queries for the search bar
export const weaponTypeQueries = {
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

export const energyTypeQueries = {
  arc: 'is:arc',
  ark: 'is:arc',
  solar: 'is:solar',
  void: 'is:void',
  stasis: 'is:stasis',
  strand: 'is:strand',
};

export const rarityQueries = {
  blue: 'is:rare',
  rare: 'is:rare',
  legendary: 'is:legendary',
  exotic: 'is:exotic',
};

export const weaponSlotQueries = {
  kinetic: 'is:kineticslot',
  energy: 'is:energy',
  power: 'is:power',
};

export const ammoTypeQueries = {
  primary: 'is:primary',
  special: 'is:special',
  heavy: 'is:heavy',
};

export const armorTypeQueries = {
  helmet: 'is:armor is:helmet',
  arms: 'is:armor is:gauntlets',
  gauntlets: 'is:armor is:gauntlets',
  chest: 'is:armor is:chest',
  legs: 'is:armor is:leg',
  boots: 'is:armor is:leg',
  leg: 'is:armor is:leg',
};

export const otherQueries = {
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
