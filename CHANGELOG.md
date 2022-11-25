### 1.2.3 - 2022-11-25 - Parsing Issues

- Weapons with periods in their name (IKELOS weapons, a few others) are now parsed correctly
- Slight optimization for transferring weapons by name (no longer populates the search bar with `name:"<weapon>"`)

### 1.2.2 - 2022-10-04 - Activation Phrase Fix

- Added fix for capital letter in activation phrase by trimming/lowercasing everywhere

### 1.2.1 - 2022-10-03 - Only in Inventory

- Added fix for loading DIM on another tab. Previously required reloading the page on the inventory tab. Now Voice DIM will load no matter what page is started on
- Added fix for a user having the item popup sidebar being collapsed.

### 1.2.0 - 2022-09-24 - Always Listening

- Added a toggle-able `Always Listening` mode
  - Each command must be prefixed with an activation phrase (defaulted to `okay ghost`)
- Added fix for `maxPower` command (didn't work in normal DIM, only in beta)
- Added fix for search already being populated when performing a command.

### 1.1.3 - 2022-09-20 - Perk fix

- Fixed perk matching

### 1.1.2 - 2022-09-19 - Options page links

- Added an `onInstalled` event for the extension. It'll direct users to the options page.
- Link to the options page from the `?`

### 1.1.1 - 2022-09-16 - Better performance

- Use a `waitForElement/waitForSearchToUpdate` function instead of arbitrarily sleeping in code
  - Results in at least a 300% improvement in action duration

### 1.1.0 - 2022-09-13 - The One with Custom Commands

- Quite a few changes in this one
- Reworked how the extension waits for the search to update visible (not dimmed) items
  - Really reworked how all UI interactions are performed
- Added the ability to customize the command words for particular actions
  - Visit the options page (click the extension icon) to set these
- Added a `store` command for storing items in the vault
- Added an `equip` command for directly equipping an item on your current character (when possible)
  - This works like how `transfer` previously did, and `transfer` has been updated to only transfer, not equip
- (from above) `Transfer` now only transfers instead of equipping
- Added mic icon on page with a link to the website
  - When listening, there will be text next to the icon that updates as the user speaks their command
- Added link to the [Voice DIM website](https://www.voicedim.com) via the `?` icon.
- Fixed `Start Farming mode` command if a user has at least 10 loadouts saved

### 1.0.1 - 2022-08-23 - Corrected Shortcut

- Defaulted the shortcut correctly (set to `Ctrl+Shift+0`)

### 1.0.0 - 2022-08-19 - Initial Release

- See [Reddit post](https://www.reddit.com/r/DestinyTheGame/comments/wseigx/interact_with_dim_using_your_voice/) about the available commands with more info
  - Commands are available to:
    - Transfer a weapon by name
    - Transfer a weapon with particular perks
    - Transfer a weapon by attribute (energy type, slot, ammo type, etc)
    - Collect from the postmaster
    - Start/Stop farming mode
    - Equip loadouts by name
    - Equip max power
- Use global shortcut to activate listening
