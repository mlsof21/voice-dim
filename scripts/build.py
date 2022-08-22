import json
import os
import os.path
from typing import List


def get_files_to_zip(browser: str):
    zippable_files = []
    exclude = [
        r'\.(py|md|zip|ts)',  # file extensions
        # files
        fr'\..*ignore|package\.json|package-lock\.json|tsconfig\.json|\.prettierrc\.json|requirements\.txt|manifest\.(?:(?!{browser}).)*\.json',
        # directories
        r'(\\|/)(screenshots|test|node_modules|\.github|\.git|env|\.vscode|build)'
    ]
    for root, folders, files in os.walk(f'./dist'):
        print(root)
        for f in files:
            file = os.path.join(root, f)
            if not any(re.search(p, file) for p in exclude):
                zippable_files.append(file)
    return zippable_files


def zip_files(files: List[str], browser: str):
    output_folder = f'build'
    if not os.path.isdir(output_folder):
        os.mkdir(output_folder)

    version = json.load(open('manifest.json'))['version']
    output_file = os.path.join(
        output_folder, f"dim-voice-{browser}-{version}.zip")

    if os.path.exists(output_file):
        user_response = input(
            f"Zip file {output_file} already exists. Do you want to continue? (yn)")
        if user_response in ("n", "no", "N"):
            exit(1)
        else:
            print(f"Overwriting existing {output_file}")
    zf = zipfile.ZipFile(output_file, 'w', zipfile.ZIP_STORED)

    for f in files:
        print(f"Creating {f} for", browser)

        print("basename:", basename(f))
        if f.endswith('js'):
            zf.write(f[2:], 'js/' + basename(f.replace('./dist', '')))
        elif f.endswith('css'):
            zf.write(f[2:], 'css/' + basename(f.replace('./dist', '')))
        elif f.endswith('html'):
            zf.write(f[2:], 'html/' + basename(f.replace('./dist', '')))
        else:
            zf.write(f[2:],
                     basename(f.replace('./dist', '').replace(f'{browser}.', '')))

    zf.close()


if __name__ == "__main__":
    browsers = ["chrome", "firefox"]

    for browser in browsers:
        files_to_zip = get_files_to_zip(browser)
        print("Files to zip:", files_to_zip)
        zip_files(files_to_zip, browser)
    # shutil.make_archive('build/dim-voice-chrome', 'zip', './dist')
