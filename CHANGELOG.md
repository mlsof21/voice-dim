

## Changelog

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