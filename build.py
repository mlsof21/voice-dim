import os, zipfile, re, json, os.path
from typing import List

def get_files_to_zip():
    zippable_files = []
    exclude = [
        r'\.(py|md|zip)', # file extensions
        r'\.gitignore|package\.json|package-lock\.json|tsconfig\.json', # files
        r'(\\|/)(screenshots|test|node_modules|\.github|\.git)' # directories    
    ]

    for root, folders, files in os.walk('.'):
        print(root)
        for f in files:
            file = os.path.join(root, f)
            if not any(re.search(p, file) for p in exclude):
                zippable_files.append(file)
    return zippable_files


def zip_files(files: List[str], browser: str):
    output_folder = 'build'
    if not os.path.isdir(output_folder):
        os.mkdir(output_folder)

    output_file = os.path.join(output_folder, f"dim-voice-{browser}.zip")
    zf = zipfile.ZipFile(output_file, 'w', zipfile.ZIP_STORED)
    
    for f in files:
        print("Creating for", browser)
        if f.endswith("manifest.json"):
            manifest = json.load(open(f))
            if browser == "firefox":
                manifest["manifest_version"] = 2
                del manifest['action']
                # manifest["permissions"].append("https://www.bungie.net/*")
            
            zf.writestr(f[2:], json.dumps(manifest, indent=2))
        else:
            zf.write(f[2:])

    zf.close()


if __name__ == "__main__":
    browsers = ["chrome", "firefox"]
    files_to_zip = get_files_to_zip()
    print("Files to zip:", files_to_zip)
    
    for browser in browsers:
        zip_files(files_to_zip, browser)
