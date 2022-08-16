import json
import pprint
import requests


manifest = {}
perk_names = []

valid_plug_category_identifiers = ['barrels', 'batteries', 'frames', 'guards', 'magazines', 'magazines_gl', 'stocks', 'tubes', 'grips','scopes', 'origins']

perks = {}

def get_manifest():
    response = requests.get('https://www.bungie.net/Platform/Destiny2/Manifest/', headers={'x-api-key': '897a3b5426fb4564b05058cad181b602'})
    body =  response.json()
    
    jsonWorld = body['Response']['jsonWorldContentPaths']['en']
    fullManifest = requests.get('https://www.bungie.net' + jsonWorld)
    global manifest 
    manifest = fullManifest.json()

def create_maps():
    global manifest
    global perk_names
    global perks
    for hash in manifest['DestinyInventoryItemDefinition']:
        item = manifest['DestinyInventoryItemDefinition'][hash]

        # Only map "mods"
        if item['itemType'] == 19:
            plug_category_identifier = item['plug']['plugCategoryIdentifier'] if 'plug' in item else ''
            if plug_category_identifier in valid_plug_category_identifiers:
                perk_names.append(item['displayProperties']['name'].lower())   
                perk_hashes = list(map(lambda x: x['perkHash'], item['perks']))
                summary_item_hash = item['summaryItemHash'] if 'summaryItemHash' in item else ''
                perk_obj = {
                    'name': item['displayProperties']['name'],
                    'plugCategoryIdentifier': plug_category_identifier,
                    'itemCategoryHashes': item['itemCategoryHashes'],
                    'summaryItemHash': summary_item_hash,
                    'perkHash': perk_hashes
                }
                perks[hash] = perk_obj

def main():
    get_manifest()
    create_maps()
    global perk_names
    global perks

    perk_names = sorted(set(perk_names))
    print(perk_names)
    with open('perks.json', 'w', encoding="utf-8") as file:
        file.write(json.dumps(perks, indent=4))

if __name__ == "__main__":
    main()